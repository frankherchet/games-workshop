import importlib.util
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('deploy', Path(__file__).parents[1] / 'scripts/deploy.py')
deploy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(deploy)


class DeploymentTests(unittest.TestCase):
    def config(self, **changes):
        return dict(FTP_HOST='example.test', FTP_USER='test', FTP_PASSWORD='not-a-real-secret', FTP_REMOTE_DIR='/games', FEEDBACK_GITHUB_TOKEN='test_token', **changes)

    def test_requires_explicit_directory(self):
        env = self.config()
        del env['FTP_REMOTE_DIR']
        with self.assertRaises(ValueError):
            deploy.configuration(env)

    def test_feedback_secret_is_executable_php_and_rejects_injection(self):
        config = deploy.feedback_config('not_a_real_token')
        self.assertTrue(config.startswith(b'<?php'))
        self.assertIn(b'http_response_code(404)', config)
        self.assertNotIn(b'not_a_real_token', config)
        for token in ['', "bad\nheader", "bad'php", 'bad/token']:
            with self.assertRaises(ValueError): deploy.feedback_config(token)

    def test_feedback_never_uploads_secret_before_php_verification(self):
        from unittest.mock import patch, MagicMock
        ftp = MagicMock()
        with patch.object(deploy, 'upload_file') as endpoint, patch.object(deploy, 'verify_feedback', side_effect=RuntimeError('PHP unavailable')):
            with self.assertRaises(RuntimeError):
                deploy.upload_feedback(ftp, '/', 'release', 'https://games.computersys.de/', None, b'fake-config')
            endpoint.assert_called_once()
            ftp.storbinary.assert_not_called()

    def test_feedback_config_upload_uses_php_suffix_and_size_check(self):
        from unittest.mock import patch, MagicMock
        ftp = MagicMock(); ftp.size.return_value = 11
        with patch.object(deploy, 'upload_file'), patch.object(deploy, 'verify_feedback'):
            deploy.upload_feedback(ftp, '/', 'release', 'https://games.computersys.de/', None, b'fake-config')
            self.assertEqual(ftp.storbinary.call_args.args[0], 'STOR .games-release-config.php')
            ftp.rename.assert_called_once_with('.games-release-config.php', 'feedback-config.php')
            ftp.reset_mock(); ftp.size.return_value = 0
            with self.assertRaises(RuntimeError):
                deploy.upload_feedback(ftp, '/', 'release', 'https://games.computersys.de/', None, b'fake-config')
            ftp.rename.assert_not_called()

    def test_rejects_traversal_and_command_injection(self):
        for directory in ['games', '/games/../', '/games\r\nDELE index.html']:
            env = self.config()
            env['FTP_REMOTE_DIR'] = directory
            with self.assertRaises(ValueError):
                deploy.configuration(env)

    def test_accepts_restricted_ftp_root(self):
        env = self.config()
        env['FTP_REMOTE_DIR'] = '/'
        self.assertEqual(deploy.configuration(env), ('/', 'https://games.computersys.de/'))

    def test_uploads_temp_before_atomic_publication(self):
        class FakeFTP:
            def __init__(self): self.calls = []
            def cwd(self, directory): self.calls.append(('cwd', directory))
            def storbinary(self, command, stream): self.calls.append(('store', command)); self.data = stream.read()
            def size(self, name): return len(self.data)
            def rename(self, source, target): self.calls.append(('rename', source, target))
        with tempfile.TemporaryDirectory() as directory:
            page = Path(directory) / 'index.html'
            page.write_text('complete page')
            ftp = FakeFTP()
            deploy.upload(ftp, '/games', page, 'release')
            self.assertEqual(ftp.calls, [('cwd', '/games'), ('store', 'STOR .games-release.html.tmp'), ('rename', '.games-release.html.tmp', 'index.html')])

    def test_wrong_size_never_publishes(self):
        class FakeFTP:
            def cwd(self, directory): pass
            def storbinary(self, command, stream): pass
            def size(self, name): return -1
            def rename(self, source, target): self.fail = True
        with tempfile.TemporaryDirectory() as directory:
            page = Path(directory) / 'index.html'
            page.write_text('page')
            ftp = FakeFTP()
            with self.assertRaises(RuntimeError): deploy.upload(ftp, '/games', page, 'release')
            self.assertFalse(hasattr(ftp, 'fail'))

    def test_new_garden_images_are_included_in_deployment(self):
        import hashlib, json
        with tempfile.TemporaryDirectory() as directory:
            dist = Path(directory)
            (dist / 'assets').mkdir()
            names = []
            for theme in ['forest', 'castle']:
                data = theme.encode()
                name = f'assets/garden-{theme}-' + hashlib.sha256(data).hexdigest()[:12] + '.png'
                (dist / name).write_bytes(data)
                names.append(name)
            (dist / 'assets-manifest.json').write_text(json.dumps(names))
            self.assertEqual(deploy.assets_for(dist), [dist / name for name in names])

    def test_manifest_validates_hash_and_rejects_traversal(self):
        import hashlib, json
        with tempfile.TemporaryDirectory() as directory:
            dist = Path(directory)
            (dist / 'assets').mkdir()
            data = b'example-image'
            name = 'assets/garden-fine-' + hashlib.sha256(data).hexdigest()[:12] + '.png'
            (dist / name).write_bytes(data)
            manifest = dist / 'assets-manifest.json'
            manifest.write_text(json.dumps([name]))
            self.assertEqual(deploy.assets_for(dist), [dist / name])
            for value in [['../password'], ['assets/missing.png'], [], [name, name]]:
                manifest.write_text(json.dumps(value))
                with self.assertRaises(ValueError): deploy.assets_for(dist)
            manifest.write_text(json.dumps([name]))
            (dist / name).write_bytes(b'changed')
            with self.assertRaises(ValueError): deploy.assets_for(dist)

    def test_sprite_atlas_is_an_allowed_hashed_asset(self):
        import hashlib, json
        with tempfile.TemporaryDirectory() as directory:
            dist=Path(directory);(dist / 'assets').mkdir()
            data=b'sprite-example';name='assets/garden-sprites-'+hashlib.sha256(data).hexdigest()[:12]+'.png'
            (dist / name).write_bytes(data);(dist / 'assets-manifest.json').write_text(json.dumps([name]))
            self.assertEqual(deploy.assets_for(dist),[dist / name])

    def test_assets_publish_before_index_and_failure_keeps_old_page(self):
        class FakeFTP:
            def __init__(self, fail=False): self.calls = []; self.fail = fail
            def cwd(self, path): self.calls.append(('cwd', path))
            def storbinary(self, command, stream): self.calls.append(('store', command)); self.data = stream.read()
            def size(self, name): return -1 if self.fail else len(self.data)
            def rename(self, source, target): self.calls.append(('rename', target))
        with tempfile.TemporaryDirectory() as directory:
            page = Path(directory) / 'index.html'; page.write_text('page')
            asset = Path(directory) / 'garden-fine-123456789abc.png'; asset.write_bytes(b'image')
            ftp = FakeFTP()
            deploy.upload(ftp, '/', page, 'test', [asset])
            self.assertEqual([call[1] for call in ftp.calls if call[0] == 'rename'], [asset.name, 'index.html'])
            ftp = FakeFTP(True)
            with self.assertRaises(RuntimeError): deploy.upload(ftp, '/', page, 'test', [asset])
            self.assertFalse(any('html' in str(call) for call in ftp.calls))

    def test_main_loads_assets_before_connecting_and_verifies_both(self):
        from unittest.mock import patch, MagicMock
        with tempfile.TemporaryDirectory() as directory:
            with patch.object(deploy, 'configuration', return_value=('/', 'https://games.computersys.de/')), patch.object(deploy.Path, 'is_file', return_value=True), patch.object(deploy, 'assets_for', return_value=[Path('dist/assets/example.png')]) as manifest, patch.object(deploy.ftplib, 'FTP_TLS') as tls, patch.dict(deploy.os.environ, self.config()), patch.object(deploy, 'upload_feedback') as feedback, patch.object(deploy, 'upload') as upload, patch.object(deploy, 'verify_file') as verify:
                deploy.main()
                feedback.assert_called_once()
                manifest.assert_called_once_with(Path('dist'))
                self.assertEqual(len(upload.call_args.args[-1]), 1)
                self.assertEqual([call.args[1] for call in verify.call_args_list], ['assets/example.png', ''])


if __name__ == '__main__': unittest.main()

