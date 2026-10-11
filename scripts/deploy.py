"""Publish the standalone page using explicit FTPS. Credentials never enter files."""
import ftplib
import hashlib
import os
import ssl
import sys
import uuid
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import Request, urlopen


def configuration(env):
    names = ['FTP_HOST', 'FTP_USER', 'FTP_PASSWORD', 'FTP_REMOTE_DIR']
    if any(not env.get(name) for name in names):
        raise ValueError('FTP secrets or FTP_REMOTE_DIR are missing.')
    remote = env['FTP_REMOTE_DIR']
    if not remote.startswith('/') or any(part == '..' for part in remote.split('/')) or any(c in remote for c in '\r\n\0'):
        raise ValueError('FTP_REMOTE_DIR must be an absolute directory without parent traversal.')
    if any(c in env['FTP_HOST'] for c in '/:@\r\n\0 '):
        raise ValueError('FTP_HOST must be a hostname without scheme or port.')
    for name in ['FTP_USER', 'FTP_PASSWORD']:
        if any(c in env[name] for c in '\r\n\0'):
            raise ValueError('FTP credentials contain unsupported control characters.')
    site = env.get('SITE_URL', 'https://games.computersys.de/')
    parsed = urlparse(site)
    if parsed.scheme != 'https' or parsed.hostname != 'games.computersys.de' or parsed.username or parsed.password or parsed.port or parsed.query or parsed.fragment or parsed.path not in ('', '/'):
        raise ValueError('SITE_URL must be https://games.computersys.de/.')
    return remote, site.rstrip('/') + '/'


def upload(ftp, remote, page, release):
    # No recursive mirroring or deletion: only the platform's own index.html.
    ftp.cwd(remote)
    temp = f'.games-{release}.html.tmp'
    with page.open('rb') as stream:
        ftp.storbinary('STOR ' + temp, stream)
    if ftp.size(temp) != page.stat().st_size:
        raise RuntimeError('Uploaded file size does not match.')
    # Rename publishes the complete file. If the server cannot replace index.html,
    # fail instead of deleting the existing page first.
    ftp.rename(temp, 'index.html')


def main():
    remote, site = configuration(os.environ)
    page = Path('dist/index.html')
    if not page.is_file():
        raise ValueError('Build the page before deploying.')
    release = uuid.uuid4().hex
    context = ssl.create_default_context()
    with ftplib.FTP_TLS(context=context, timeout=30) as ftp:
        ftp.connect(os.environ['FTP_HOST'], 21)
        ftp.login(os.environ['FTP_USER'], os.environ['FTP_PASSWORD'])
        ftp.prot_p()
        ftp.set_pasv(True)
        ftp.voidcmd('TYPE I')
        upload(ftp, remote, page, release)
    request = Request(site + '?release=' + release, headers={'Cache-Control': 'no-cache'})
    with urlopen(request, timeout=30, context=context) as response:
        if urlparse(response.url).hostname != 'games.computersys.de':
            raise RuntimeError('Website redirects to an unexpected host.')
        live = response.read()
    if hashlib.sha256(live).digest() != hashlib.sha256(page.read_bytes()).digest():
        raise RuntimeError('Upload completed, but HTTPS verification does not match the build. Check the subdomain directory and caching.')
    print('FTPS upload and HTTPS content verification succeeded.')


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        # Server exception text may echo account information. Do not print it.
        print(f'Deployment failed ({type(error).__name__}). Check configuration, permissions, FTPS and the target directory.', file=sys.stderr)
        sys.exit(1)
