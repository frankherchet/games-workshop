"""Publish the standalone page using explicit FTPS. The feedback token is sent only to an executable PHP config, never packaged."""
import base64
import io
import ftplib
import hashlib
import json
import re
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


def assets_for(dist):
    manifest = json.loads((dist / 'assets-manifest.json').read_text())
    if not isinstance(manifest, list) or not manifest or len(manifest) > 20 or len(set(manifest)) != len(manifest):
        raise ValueError('Invalid asset manifest.')
    assets = []
    for name in manifest:
        if not isinstance(name, str) or not re.fullmatch(r'assets/(?:garden-fine|garden-sprites|garden-defenses|garden-extras)-[a-f0-9]{12}\.png', name):
            raise ValueError('Unsupported asset path.')
        asset = dist / name
        if not asset.is_file() or asset.is_symlink() or asset.resolve().parent != (dist / 'assets').resolve():
            raise ValueError('Missing or unsafe asset.')
        if hashlib.sha256(asset.read_bytes()).hexdigest()[:12] != asset.stem.rsplit('-',1)[-1]:
            raise ValueError('Asset content hash does not match its filename.')
        assets.append(asset)
    return assets


def upload_file(ftp, source, target, temporary):
    with source.open('rb') as stream:
        ftp.storbinary('STOR ' + temporary, stream)
    if ftp.size(temporary) != source.stat().st_size:
        raise RuntimeError('Uploaded file size does not match.')
    ftp.rename(temporary, target)


def upload(ftp, remote, page, release, assets=()):
    # Publish assets first and index last. Preserve old assets for rollback.
    ftp.cwd(remote)
    if assets:
        try:
            ftp.cwd('assets')
        except ftplib.error_perm as error:
            if not str(error).startswith('550'):
                raise
            ftp.mkd('assets')
            ftp.cwd('assets')
        for asset in assets:
            upload_file(ftp, asset, asset.name, f'.games-{release}-{asset.name}.tmp')
        ftp.cwd(remote)
    upload_file(ftp, page, 'index.html', f'.games-{release}.html.tmp')


def feedback_config(token):
    if not token or not re.fullmatch(r'[A-Za-z0-9_]+', token):
        raise ValueError('FEEDBACK_GITHUB_TOKEN is missing or invalid.')
    encoded = base64.b64encode(token.encode()).decode()
    return ("<?php\nif (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) { http_response_code(404); exit; }\nreturn base64_decode('" + encoded + "');\n").encode()


def verify_feedback(site, context):
    with urlopen(Request(site + 'feedback.php', headers={'Cache-Control': 'no-cache'}), timeout=30, context=context) as response:
        parsed = urlparse(response.url)
        if parsed.scheme != 'https' or parsed.hostname != 'games.computersys.de':
            raise RuntimeError('Feedback redirects to an unexpected location.')
        data = json.loads(response.read(4096))
    if data.get('service') != 'games-feedback' or not re.fullmatch(r'[a-f0-9]{64}', data.get('csrf', '')):
        raise RuntimeError('PHP execution could not be verified.')


def upload_feedback(ftp, remote, release, site, context, config):
    ftp.cwd(remote)
    endpoint = Path('dist/feedback.php')
    upload_file(ftp, endpoint, 'feedback.php', f'.games-{release}-feedback.php')
    # Confirm PHP execution before any secret is sent to this hosting directory.
    verify_feedback(site, context)
    temporary = f'.games-{release}-config.php'
    ftp.storbinary('STOR ' + temporary, io.BytesIO(config))
    if ftp.size(temporary) != len(config):
        raise RuntimeError('Uploaded config size does not match.')
    ftp.rename(temporary, 'feedback-config.php')


def verify_file(site, relative, source, release, context):
    request = Request(site + relative + '?release=' + release, headers={'Cache-Control': 'no-cache'})
    with urlopen(request, timeout=30, context=context) as response:
        parsed = urlparse(response.url)
        if parsed.scheme != 'https' or parsed.hostname != 'games.computersys.de':
            raise RuntimeError('Website redirects to an unexpected location.')
        live = response.read()
    if hashlib.sha256(live).digest() != hashlib.sha256(source.read_bytes()).digest():
        raise RuntimeError('HTTPS content verification does not match the build.')


def main():
    remote, site = configuration(os.environ)
    page = Path('dist/index.html')
    if not page.is_file():
        raise ValueError('Build the page before deploying.')
    assets = assets_for(page.parent)
    config = feedback_config(os.environ.get('FEEDBACK_GITHUB_TOKEN', ''))
    if not Path('dist/feedback.php').is_file():
        raise ValueError('Feedback endpoint is missing from build.')
    release = uuid.uuid4().hex
    context = ssl.create_default_context()
    with ftplib.FTP_TLS(context=context, timeout=30) as ftp:
        ftp.connect(os.environ['FTP_HOST'], 21)
        ftp.login(os.environ['FTP_USER'], os.environ['FTP_PASSWORD'])
        ftp.prot_p()
        ftp.set_pasv(True)
        ftp.voidcmd('TYPE I')
        upload_feedback(ftp, remote, release, site, context, config)
        upload(ftp, remote, page, release, assets)
    for asset in assets:
        verify_file(site, 'assets/' + asset.name, asset, release, context)
    verify_file(site, '', page, release, context)
    print('FTPS upload and HTTPS content verification succeeded.')


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        # Server exception text may echo account information. Do not print it.
        print(f'Deployment failed ({type(error).__name__}). Check configuration, permissions, FTPS and the target directory.', file=sys.stderr)
        sys.exit(1)

