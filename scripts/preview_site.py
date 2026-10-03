"""Local preview of the extensionless static URLs (not a Netlify emulator)."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit, unquote
from pathlib import Path
import os
import argparse
from audit_seo import ROOT, resolve_file
from external_assets import ensure_assets


class Handler(SimpleHTTPRequestHandler):
    design_assets = None
    asset_manifest = None
    site_root = ROOT

    def translate_path(self, path):
        route = unquote(urlsplit(path).path)
        if self.design_assets and self.asset_manifest:
            allowed = {'/' + self.asset_manifest['directory'] + '/' + item['file']: item['file'] for item in self.asset_manifest['files'].values()}
            if route in allowed:
                return str(self.design_assets / allowed[route])
        candidate = self.site_root / route.lstrip('/')
        if not candidate.resolve().is_relative_to(self.site_root):
            return str(self.site_root / '404.html')
        for file in [candidate, Path(str(candidate).rstrip('/') + '.html'), candidate / 'index.html']:
            if file.is_file():
                return str(file)
        return super().translate_path(path)

    def log_message(self, format, *args):
        pass


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--design-assets', type=Path, help='Optional external optimized asset directory; otherwise use the pinned public pack.')
    parser.add_argument('--root', type=Path, default=ROOT, help='Site directory, including a production build directory.')
    parser.add_argument('--port', type=int, default=8765)
    args = parser.parse_args()
    Handler.site_root = args.root.resolve()
    if Handler.site_root == ROOT:
        Handler.design_assets, Handler.asset_manifest = ensure_assets(args.design_assets)
    os.chdir(Handler.site_root)
    print(f'Preview: http://127.0.0.1:{args.port}', flush=True)
    ThreadingHTTPServer(('127.0.0.1', args.port), Handler).serve_forever()
