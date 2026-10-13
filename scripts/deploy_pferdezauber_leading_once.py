"""One-time FTPS publication of the isolated horse-leading test preview."""
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

FOLDER = "pferdezauber-fuehren-20261013"
URL = "https://games.computersys.de/" + FOLDER + "/"


def publish():
    configuration({**os.environ, "FTP_REMOTE_DIR": "/", "SITE_URL": "https://games.computersys.de/"})
    path = Path("dist/index.html")
    if not path.is_file():
        raise RuntimeError("Missing built index.")
    html = path.read_bytes()
    required = (
        b"toggleLead", b"function leadRope(", b"pz-lead-switch",
        b"Reithelm", b"Westernhut", b"function advanceLead(",
        b"Fohlen nicht reitbar", b"pferdezauberWorld"
    )
    if html.count(b"<body>") != 1 or any(fragment not in html for fragment in required):
        raise RuntimeError("Unexpected build; leading or rider outfit features missing.")
    html = html.replace(
        b"<body>", b'<body><script>if(!location.hash)location.hash="spiel/pferdezauber";</script>', 1
    )
    html = html.replace(
        b"<head>", b'<head><meta name="robots" content="noindex,nofollow">', 1
    )
    nonce = uuid.uuid4().hex
    context = ssl.create_default_context()
    with ftplib.FTP_TLS(context=context, timeout=40) as ftp:
        ftp.connect(os.environ["FTP_HOST"], 21)
        ftp.login(os.environ["FTP_USER"], os.environ["FTP_PASSWORD"])
        ftp.prot_p()
        ftp.set_pasv(True)
        ftp.voidcmd("TYPE I")
        ftp.cwd("/")
        # Only a newly created fixed directory can be written. Live website
        # root and earlier demos are never overwritten or deleted.
        ftp.mkd(FOLDER)
        ftp.cwd(FOLDER)
        tmp = ".leading-preview-" + nonce + ".tmp"
        ftp.storbinary("STOR " + tmp, io.BytesIO(html))
        if ftp.size(tmp) != len(html):
            raise RuntimeError("Upload length mismatch.")
        ftp.rename(tmp, "index.html")
    with urlopen(Request(URL+"?v="+nonce,headers={"Cache-Control":"no-cache"}), timeout=40, context=context) as response:
        target=urlparse(response.url)
        if target.scheme!="https" or target.hostname!="games.computersys.de" or target.path not in ("/"+FOLDER+"/","/"+FOLDER+"/index.html"):
            raise RuntimeError("Unexpected HTTPS destination.")
        remote=response.read()
    if hashlib.sha256(remote).digest()!=hashlib.sha256(html).digest():
        raise RuntimeError("HTTPS page checksum does not match tested build.")
    print("Successfully verified the isolated leading-and-outfits preview at " + URL)


if __name__=="__main__":
    try:
        publish()
    except Exception as error:
        # FTPS errors may contain account and server path information.
        print("Isolated preview did not complete ("+type(error).__name__+").",file=sys.stderr)
        sys.exit(1)
