"""One-shot upload of the Pferdezauber v2 preview to a NEW directory."""
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

FOLDER = "pferdezauber-demo-v2-20261012"
URL = "https://games.computersys.de/" + FOLDER + "/"


def release():
    configuration({**os.environ, "FTP_REMOTE_DIR": "/", "SITE_URL": "https://games.computersys.de/"})
    page = Path("dist/index.html")
    if not page.is_file():
        raise ValueError("Build missing.")
    html = page.read_bytes()
    if html.count(b"<body>") != 1 or b"id:'friesian'" not in html or b"id:'foal-black'" not in html or b"horseCards" not in html:
        raise ValueError("Missing breed selector or unexpected build.")
    html = html.replace(b"<body>", b'<body><script>if(!location.hash)location.hash="spiel/pferdezauber";</script>', 1)
    html = html.replace(b"<head>", b'<head><meta name="robots" content="noindex,nofollow">', 1)
    ctx = ssl.create_default_context()
    token = uuid.uuid4().hex
    with ftplib.FTP_TLS(context=ctx, timeout=35) as ftp:
        ftp.connect(os.environ["FTP_HOST"], 21)
        ftp.login(os.environ["FTP_USER"], os.environ["FTP_PASSWORD"])
        ftp.prot_p()
        ftp.set_pasv(True)
        ftp.voidcmd("TYPE I")
        ftp.cwd("/")
        # Do not touch existing live pages, existing previews, or arbitrary paths.
        ftp.mkd(FOLDER)
        ftp.cwd(FOLDER)
        tmp = ".pferdezauber-v2-" + token + ".tmp"
        ftp.storbinary("STOR " + tmp, io.BytesIO(html))
        if ftp.size(tmp) != len(html):
            raise RuntimeError("Upload size mismatch.")
        ftp.rename(tmp, "index.html")
    with urlopen(Request(URL+"?v="+token, headers={"Cache-Control":"no-cache"}), timeout=35, context=ctx) as response:
        target = urlparse(response.url)
        if target.scheme != "https" or target.hostname != "games.computersys.de" or target.path not in ("/"+FOLDER+"/", "/"+FOLDER+"/index.html"):
            raise RuntimeError("Unexpected HTTPS location.")
        online = response.read()
    if hashlib.sha256(online).digest() != hashlib.sha256(html).digest():
        raise RuntimeError("Published content differs from the tested build.")
    print("Verified isolated preview: "+URL)


if __name__ == "__main__":
    try:
        release()
    except Exception as exc:
        print("Isolated preview failed ("+type(exc).__name__+"). Check rights and the destination directory.", file=sys.stderr)
        sys.exit(1)
