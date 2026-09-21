"""Write generated site files atomically; avoid touching unchanged files."""
import os
from pathlib import Path
import tempfile
import time


def write_text(path, text, *, newline='\n'):
    path = Path(path)
    data = text.replace('\r\n', '\n').replace('\n', newline).encode('utf-8')
    if path.exists() and path.read_bytes() == data:
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(dir=path.parent, prefix='.' + path.name + '.', suffix='.tmp', delete=False) as handle:
        temporary = Path(handle.name)
        handle.write(data)
    try:
        for attempt in range(3):
            try:
                os.replace(temporary, path)
                return
            except OSError:
                if attempt == 2:
                    raise
                time.sleep(0.1)
    finally:
        temporary.unlink(missing_ok=True)
