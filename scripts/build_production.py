"""Build the complete static site with its externally stored, pinned WebP assets."""
from pathlib import Path
import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
from external_assets import ROOT, ensure_assets

EXCLUDED = {'.git', '.netlify', '.codex', '.agents', '.aws', 'artifacts', 'docs', 'scripts',
            'node_modules', '__pycache__', 'dist', 'output', 'tests', '.github', 'TomoGame_V1.0'}
CONFIG_FILES = {'.gitignore', 'netlify.toml', 'readme', 'package.json', 'package-lock.json'}


def build(output, asset_directory=None):
    output = output.resolve()
    if output == ROOT or output in ROOT.parents or len(output.parts) < 3:
        raise ValueError('Choose a dedicated build output directory')
    if output.is_relative_to(ROOT) and os.environ.get('NETLIFY') != 'true':
        raise ValueError('Local build output must be outside the clone; use --output with an external directory')
    # Netlify restores the previous publish directory between builds. Only its
    # exact, resolved <repo>/dist output is disposable; local outputs stay protected.
    rebuild = os.environ.get('NETLIFY') == 'true' and output == ROOT / 'dist'
    if output.exists() and not output.is_dir():
        raise ValueError('Build output must be a directory: ' + str(output))
    if output.exists() and any(output.iterdir()) and not rebuild:
        raise ValueError('Build output must be empty: ' + str(output))
    assets, data = ensure_assets(asset_directory)
    with tempfile.TemporaryDirectory(prefix='tomotravel-seo-') as checks:
        subprocess.run([sys.executable, str(ROOT / 'scripts/verify_seo.py'), '--output', str(Path(checks) / 'seo.json')], check=True, env=dict(os.environ, TOMO_DESIGN_ASSET_DIR=str(assets)))
    if rebuild and output.exists():
        shutil.rmtree(output)
    output.mkdir(parents=True, exist_ok=True)
    count = 0
    for base, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in EXCLUDED and not d.startswith('.') and not (Path(base) / d).is_symlink()]
        for name in files:
            path = Path(base) / name
            relative = path.relative_to(ROOT)
            if name in CONFIG_FILES or name.startswith('.') or relative.as_posix() == 'assets/design-assets.json' or path.is_symlink():
                continue
            if path.suffix in ('.py', '.pyc', '.log', '.toml'):
                continue
            target = output / relative
            # The remaining legacy tool differs from its published canonical URL.
            if relative.as_posix() == 'VideoInstructionEditor.html':
                target = output / 'videoinstructioneditor.html'
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(path, target)
            count += 1
    public_assets = output / data['directory']
    public_assets.mkdir(parents=True, exist_ok=True)
    for item in data['files'].values():
        shutil.copy2(assets / item['file'], public_assets / item['file'])
    report = {'site_files': count, 'design_assets': len(data['files']), 'design_asset_bytes': sum(i['bytes'] for i in data['files'].values()), 'output': str(output)}
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--design-assets', type=Path, help='Optional verified local asset pack; otherwise download the public pinned pack')
    args = parser.parse_args()
    build(args.output, args.design_assets)
