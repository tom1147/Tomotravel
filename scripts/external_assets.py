"""Fetch the pinned public design pack outside the working tree and verify every byte."""
from pathlib import Path, PurePosixPath
import hashlib
import io
import json
import os
import re
import tempfile
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[1]


def manifest():
    data = json.loads((ROOT / 'assets/design-assets.json').read_text(encoding='utf-8'))
    directory = PurePosixPath(data['directory'])
    if directory.is_absolute() or '..' in directory.parts or directory.parts[0] != '_design-assets':
        raise ValueError('Invalid public asset directory')
    for item in data['files'].values():
        if not re.fullmatch(r'[a-z0-9-]+\.webp', item['file']):
            raise ValueError('Invalid asset filename')
    return data


def verified(directory, data):
    for item in data['files'].values():
        file = directory / item['file']
        if not file.is_file() or file.stat().st_size != item['bytes']:
            return False
        if hashlib.sha256(file.read_bytes()).hexdigest() != item['sha256']:
            return False
    return True


def cached_asset(url):
    """Resolve an already available external asset without network requests during SEO checks."""
    from urllib.parse import urlsplit
    data = manifest()
    directory = Path(os.environ.get('TOMO_DESIGN_ASSET_DIR', str(Path(tempfile.gettempdir()) / 'tomotravel-design-assets' / data['archive_sha256'])))
    route = urlsplit(url).path
    for item in data['files'].values():
        if route == '/' + data['directory'] + '/' + item['file']:
            file = directory / item['file']
            return file if file.is_file() else None
    return None


def ensure_assets(local_directory=None):
    data = manifest()
    if local_directory is not None:
        directory = Path(local_directory).resolve()
        if not verified(directory, data):
            raise ValueError('The supplied asset directory does not match assets/design-assets.json')
        return directory, data

    directory = Path(tempfile.gettempdir()) / 'tomotravel-design-assets' / data['archive_sha256']
    if verified(directory, data):
        return directory, data
    request = urllib.request.Request(data['archive_url'], headers={'User-Agent': 'TomoTravel-SiteBuild/1.0'})
    with urllib.request.urlopen(request, timeout=45) as response:
        payload = response.read(data['archive_bytes'] + 1)
    if len(payload) != data['archive_bytes'] or hashlib.sha256(payload).hexdigest() != data['archive_sha256']:
        raise ValueError('Design asset download checksum mismatch')
    expected = {item['file']: item for item in data['files'].values()}
    with zipfile.ZipFile(io.BytesIO(payload)) as archive:
        if set(archive.namelist()) != set(expected) or len(archive.namelist()) != len(expected):
            raise ValueError('Unexpected files in the design asset archive')
        directory.mkdir(parents=True, exist_ok=True)
        for name, item in expected.items():
            content = archive.read(name)
            if len(content) != item['bytes'] or hashlib.sha256(content).hexdigest() != item['sha256']:
                raise ValueError('Invalid design asset: ' + name)
            target = directory / name
            temporary = directory / (name + '.part')
            temporary.write_bytes(content)
            temporary.replace(target)
    return directory, data
