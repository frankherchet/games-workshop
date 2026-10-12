"""One-time, isolated preview deployment for PR #2.

Never writes to the website root. No recursive delete, no secret logging.
"""
import ftplib
import hashlib
import os
import ssl
import sys
import uuid
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import urlparse
from urllib.request import Request, urlopen

from deploy import configuration

# Hard-code the only permitted folder. No environment-controlled destination.
PREVIEW_DIRECTORY = "pferdezauber-demo-pr2-20261012"
PREVIEW_URL = f"https://games.computersys.de/{PREVIEW_DIRECTORY}/"


def verified_page():
    page = Path("dist/index.html")
    if not page.is_file():
        raise RuntimeError("Build output is missing.")
    html = page.read_bytes()
    opener = b'<body><script>if(!location.hash)location.hash="spiel/pferdezauber";</script>'
    if html.count(b"<body>") != 1:
        raise RuntimeError("Unexpected HTML structure.")
    html = html.replace(b"<body>", opener, 1)
    # Discourage search indexing for this temporary public demo.
    html = html.replace(b"<head>", b'<head><meta name="robots" content="noindex,nofollow">', 1)
    if b"pferdezauber" not in html:
        raise RuntimeError("Pferdezauber is missing from preview build.")
    return html


def deploy():
    configuration({**os.environ, "FTP_REMOTE_DIR": "/", "SITE_URL": "https://games.computersys.de/"})
    html = verified_page()
    context = ssl.create_default_context()
    release = uuid.uuid4().hex
    with ftplib.FTP_TLS(context=context, timeout=35) as ftp:
        ftp.connect(os.environ["FTP_HOST"], 21)
        ftp.login(os.environ["FTP_USER"], os.environ["FTP_PASSWORD"])
        ftp.prot_p()
        ftp.set_pasv(True)
        ftp.voidcmd("TYPE I")
        ftp.cwd("/")
        # Fail rather than overwriting any existing directory (including a prior preview).
        ftp.mkd(PREVIEW_DIRECTORY)
        ftp.cwd(PREVIEW_DIRECTORY)
        tmp = ".pferdezauber-" + release + ".tmp"
        import io
        ftp.storbinary("STOR " + tmp, io.BytesIO(html))
        if ftp.size(tmp) != len(html):
            raise RuntimeError("The preview upload has an unexpected size.")
        ftp.rename(tmp, "index.html")
    # Verify exact content through HTTPS, with a strict same-origin URL.
    url = PREVIEW_URL + "?v=" + release
    request = Request(url, headers={"Cache-Control": "no-cache"})
    with urlopen(request, timeout=35, context=context) as response:
        redirected = urlparse(response.url)
        if redirected.scheme != "https" or redirected.hostname != "games.computersys.de" or redirected.path not in (f"/{PREVIEW_DIRECTORY}/", f"/{PREVIEW_DIRECTORY}/index.html"):
            raise RuntimeError("Unexpected preview redirect.")
        received = response.read()
    if hashlib.sha256(received).digest() != hashlib.sha256(html).digest():
        raise RuntimeError("HTTPS preview content does not match the tested build.")
    print("Isolated preview uploaded and SHA256 verified via HTTPS: " + PREVIEW_URL)


if __name__ == "__main__":
    try:
        deploy()
    except Exception as exc:
        # Never echo exception details: FTPS errors can include sensitive server paths.
        print("Preview deployment did not complete (" + type(exc).__name__ + "). Check permissions and target directory.", file=sys.stderr)
        sys.exit(1)
