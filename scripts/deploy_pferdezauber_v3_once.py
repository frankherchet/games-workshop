"""Publish one isolated Pferdezauber v3 test page, without touching the live root."""
import ftplib
import hashlib
import io
import os
import ssl
import sys
import uuid
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import Request, urlopen

from deploy import configuration

FOLDER = "pferdezauber-demo-v3-20261013"
URL = "https://games.computersys.de/" + FOLDER + "/"


def publish_preview():
    configuration({**os.environ, "FTP_REMOTE_DIR": "/", "SITE_URL": "https://games.computersys.de/"})
    page = Path("dist/index.html")
    if not page.is_file():
        raise RuntimeError("Build artifact missing.")
    html = page.read_bytes()
    if (
        html.count(b"<body>") != 1
        or b"const HUMAN_PACES" not in html
        or b"pz-role-switch" not in html
        or b"cycleHumanPace" not in html
        or b"Das verschwundene Fohlen" not in html
    ):
        raise RuntimeError("Unexpected preview content.")
    html = html.replace(
        b"<body>", b'<body><script>if(!location.hash)location.hash="spiel/pferdezauber";</script>', 1
    )
    html = html.replace(
        b"<head>", b'<head><meta name="robots" content="noindex,nofollow">', 1
    )
    release = uuid.uuid4().hex
    ssl_context = ssl.create_default_context()
    with ftplib.FTP_TLS(context=ssl_context, timeout=35) as ftp:
        ftp.connect(os.environ["FTP_HOST"], 21)
        ftp.login(os.environ["FTP_USER"], os.environ["FTP_PASSWORD"])
        ftp.prot_p()
        ftp.set_pasv(True)
        ftp.voidcmd("TYPE I")
        ftp.cwd("/")
        # A fresh, fixed directory only: never update the root or previous previews.
        ftp.mkd(FOLDER)
        ftp.cwd(FOLDER)
        tmp = ".pferdezauber-" + release + ".tmp"
        ftp.storbinary("STOR " + tmp, io.BytesIO(html))
        if ftp.size(tmp) != len(html):
            raise RuntimeError("Upload size check failed.")
        ftp.rename(tmp, "index.html")

    request = Request(URL + "?v=" + release, headers={"Cache-Control": "no-cache"})
    with urlopen(request, timeout=35, context=ssl_context) as response:
        target = urlparse(response.url)
        if (
            target.scheme != "https"
            or target.hostname != "games.computersys.de"
            or target.path not in ("/" + FOLDER + "/", "/" + FOLDER + "/index.html")
        ):
            raise RuntimeError("Unexpected HTTPS destination.")
        received = response.read()
    if hashlib.sha256(received).digest() != hashlib.sha256(html).digest():
        raise RuntimeError("HTTPS content differs from build.")
    print("Standalone horse-speed preview uploaded and verified at " + URL)


if __name__ == "__main__":
    try:
        publish_preview()
    except Exception as error:
        # FTPS errors may contain sensitive locations; report only the class.
        print("Preview upload failed (" + type(error).__name__ + ").", file=sys.stderr)
        sys.exit(1)
