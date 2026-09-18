"""Local preview of the extensionless static URLs (not a Netlify emulator)."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit, unquote
from pathlib import Path
import os
from audit_seo import ROOT, resolve_file


class Handler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        file = resolve_file(path)
        return str(file) if file else super().translate_path(path)

    def log_message(self, format, *args):
        pass


if __name__ == '__main__':
    os.chdir(ROOT)
    print('Preview: http://127.0.0.1:8765', flush=True)
    ThreadingHTTPServer(('127.0.0.1', 8765), Handler).serve_forever()
