"""One-time FTPS upload for a fresh isolated, public Pferdezauber living-world preview."""
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

FOLDER = "pferdezauber-lebendige-welt-20261013"
URL = "https://games.computersys.de/" + FOLDER + "/"


def publish():
    configuration({**os.environ, "FTP_REMOTE_DIR": "/", "SITE_URL": "https://games.computersys.de/"})
    index = Path("dist/index.html")
    if not index.is_file():
        raise RuntimeError("Missing standalone HTML build.")
    html = index.read_bytes()
    required = (b'const HUMAN_PACES', b'pferdezauberWorld', b'Sonnenweide', b'pz-population', b'Das verschwundene Fohlen')
    if html.count(b"<body>") != 1 or any(marker not in html for marker in required):
        raise RuntimeError("Wrong game build: living-world elements missing.")
    html = html.replace(
        b"<body>",
        b'<body><script>if(!location.hash)location.hash="spiel/pferdezauber";</script>', 1
    )
    html = html.replace(
        b"<head>", b'<head><meta name="robots" content="noindex,nofollow">', 1
    )
    token = uuid.uuid4().hex
    context = ssl.create_default_context()
    with ftplib.FTP_TLS(context=context, timeout=40) as ftp:
        ftp.connect(os.environ["FTP_HOST"], 21)
        ftp.login(os.environ["FTP_USER"], os.environ["FTP_PASSWORD"])
        ftp.prot_p()
        ftp.set_pasv(True)
        ftp.voidcmd("TYPE I")
        ftp.cwd("/")
        # Fail rather than update an existing directory or touch the main site.
        ftp.mkd(FOLDER)
        ftp.cwd(FOLDER)
        tmp = ".preview-" + token + ".tmp"
        ftp.storbinary("STOR " + tmp, io.BytesIO(html))
        if ftp.size(tmp) != len(html):
            raise RuntimeError("FTPS size verification failed.")
        ftp.rename(tmp, "index.html")
    with urlopen(Request(URL + "?v=" + token, headers={"Cache-Control": "no-cache"}), timeout=40, context=context) as response:
        dest = urlparse(response.url)
        if (dest.scheme != "https" or dest.hostname != "games.computersys.de" or
                dest.path not in ("/" + FOLDER + "/", "/" + FOLDER + "/index.html")):
            raise RuntimeError("Unexpected target HTTPS address.")
        remote = response.read()
    if hashlib.sha256(remote).digest() != hashlib.sha256(html).digest():
        raise RuntimeError("Published file checksum does not match the tested build.")
    print("Isolated living-world preview successfully verified: " + URL)


if __name__ == "__main__":
    try:
        publish()
    except Exception as error:
        # FTP errors may contain sensitive directories or account data.
        print("Isolated preview failed (" + type(error).__name__ + ").", file=sys.stderr)
        sys.exit(1)
