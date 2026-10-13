"""One-time isolated preview: Pferdezauber riding, saddle and bridle."""
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

FOLDER = "pferdezauber-reiten-20261013"
URL = "https://games.computersys.de/" + FOLDER + "/"


def publish():
    configuration({**os.environ, "FTP_REMOTE_DIR": "/", "SITE_URL": "https://games.computersys.de/"})
    file = Path("dist/index.html")
    if not file.is_file():
        raise RuntimeError("Missing build.")
    html = file.read_bytes()
    required = (
        b"mountOrDismount", b"function rider(", b"pz-mount-switch",
        b"Fohlen nicht reitbar", b"pferdezauberWorld", b"HUMAN_PACES"
    )
    if html.count(b"<body>") != 1 or any(part not in html for part in required):
        raise RuntimeError("Wrong build: riding or companion features missing.")
    html = html.replace(b"<body>", b'<body><script>if(!location.hash)location.hash="spiel/pferdezauber";</script>', 1)
    html = html.replace(b"<head>", b'<head><meta name="robots" content="noindex,nofollow">', 1)
    token = uuid.uuid4().hex
    ctx = ssl.create_default_context()
    with ftplib.FTP_TLS(context=ctx, timeout=40) as ftp:
        ftp.connect(os.environ["FTP_HOST"], 21)
        ftp.login(os.environ["FTP_USER"], os.environ["FTP_PASSWORD"])
        ftp.prot_p()
        ftp.set_pasv(True)
        ftp.voidcmd("TYPE I")
        ftp.cwd("/")
        # Create a fresh directory. Do not overwrite any existing preview or root.
        ftp.mkd(FOLDER)
        ftp.cwd(FOLDER)
        tmp = ".preview-" + token + ".tmp"
        ftp.storbinary("STOR " + tmp, io.BytesIO(html))
        if ftp.size(tmp) != len(html):
            raise RuntimeError("FTPS upload size differs from build.")
        ftp.rename(tmp, "index.html")
    with urlopen(Request(URL+"?v="+token, headers={"Cache-Control":"no-cache"}),timeout=40,context=ctx) as response:
        target=urlparse(response.url)
        if target.scheme != "https" or target.hostname != "games.computersys.de" or target.path not in ("/"+FOLDER+"/","/"+FOLDER+"/index.html"):
            raise RuntimeError("Preview redirect unexpected.")
        remote=response.read()
    if hashlib.sha256(remote).digest() != hashlib.sha256(html).digest():
        raise RuntimeError("Published page does not match tested build.")
    print("Isolated riding preview verified via HTTPS: " + URL)


if __name__ == "__main__":
    try:
        publish()
    except Exception as exc:
        # Do not expose server paths or credentials in logs.
        print("Isolated riding preview failed (" + type(exc).__name__ + ").", file=sys.stderr)
        sys.exit(1)
