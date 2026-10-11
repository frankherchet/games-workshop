import importlib.util
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('deploy', Path(__file__).parents[1] / 'scripts/deploy.py')
deploy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(deploy)


class DeploymentTests(unittest.TestCase):
    def config(self, **changes):
        return dict(FTP_HOST='example.test', FTP_USER='test', FTP_PASSWORD='not-a-real-secret', FTP_REMOTE_DIR='/games', **changes)

    def test_requires_explicit_directory(self):
        env = self.config()
        del env['FTP_REMOTE_DIR']
        with self.assertRaises(ValueError):
            deploy.configuration(env)

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


if __name__ == '__main__': unittest.main()
