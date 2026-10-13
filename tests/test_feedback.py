import http.cookiejar
import json
import shutil
import socket
import subprocess
import tempfile
import time
import unittest
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import HTTPCookieProcessor, Request, build_opener


class FeedbackHTTPTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.directory = tempfile.TemporaryDirectory()
        shutil.copyfile(Path(__file__).parents[1] / 'server/feedback.php', Path(cls.directory.name) / 'feedback.php')
        with socket.socket() as sock:
            sock.bind(('127.0.0.1', 0))
            port = sock.getsockname()[1]
        cls.url = f'http://127.0.0.1:{port}/feedback.php'
        cls.server = subprocess.Popen(['php', '-S', f'127.0.0.1:{port}', '-t', cls.directory.name], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        for attempt in range(60):
            try:
                build_opener().open(cls.url, timeout=1).close()
                break
            except URLError:
                time.sleep(.05)
        else:
            cls.server.terminate(); cls.server.wait(); cls.directory.cleanup()
            raise RuntimeError('PHP server did not start')

    @classmethod
    def tearDownClass(cls):
        cls.server.terminate(); cls.server.wait(timeout=5); cls.directory.cleanup()

    def setUp(self):
        self.client = build_opener(HTTPCookieProcessor(http.cookiejar.CookieJar()))
        with self.client.open(self.url) as response:
            self.session = json.load(response)

    def post(self, data, csrf=None, origin='https://games.computersys.de'):
        request = Request(self.url, data=json.dumps(data).encode(), headers={
            'Content-Type': 'application/json', 'Origin': origin,
            'X-CSRF-Token': self.session['csrf'] if csrf is None else csrf,
        })
        try:
            with self.client.open(request) as response: return response.status, json.load(response)
        except HTTPError as response:
            with response: return response.code, json.load(response)

    def valid_data(self):
        return {'type': 'bug', 'description': 'Testbeschreibung ohne GitHub-Aufruf', 'context': dict.fromkeys(['page','game','build','browser','language','viewport','pixelRatio','time'], 'test')}

    def test_get_bootstraps_csrf_without_secret(self):
        self.assertEqual(self.session['service'], 'games-feedback')
        self.assertRegex(self.session['csrf'], r'^[a-f0-9]{64}$')
        self.assertNotIn('token', self.session)

    def test_rejects_wrong_origin_and_csrf(self):
        self.assertEqual(self.post(self.valid_data(), origin='https://attacker.invalid')[0], 403)
        self.assertEqual(self.post(self.valid_data(), csrf='invalid')[0], 403)

    def test_valid_input_without_config_fails_without_creating_issue(self):
        status, data = self.post(self.valid_data())
        self.assertEqual(status, 503)
        self.assertIn('noch nicht eingerichtet', data['error'])

    def test_invalid_and_oversized_input_is_rejected(self):
        self.assertEqual(self.post({'type':'bug'})[0], 400)
        self.assertEqual(self.post({'description':'x'*16001})[0], 413)

    def test_direct_config_access_does_not_reveal_secret(self):
        import importlib.util
        spec = importlib.util.spec_from_file_location('feedback_deploy', Path(__file__).parents[1] / 'scripts/deploy.py')
        deploy = importlib.util.module_from_spec(spec); spec.loader.exec_module(deploy)
        config = Path(self.directory.name) / 'feedback-config.php'
        config.write_bytes(deploy.feedback_config('fake_test_secret'))
        try:
            with self.assertRaises(HTTPError) as error:
                self.client.open(self.url.replace('feedback.php', 'feedback-config.php'))
            self.assertEqual(error.exception.code, 404)
            self.assertEqual(error.exception.read(), b'')
            error.exception.close()
        finally:
            config.unlink()


if __name__ == '__main__': unittest.main()
