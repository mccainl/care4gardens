"""Restore the exact approved Care4Gardens media, with integrity checks.

The archive is split into small Git blobs for connector-based publication.
No downloads, AI generation, credentials or third-party services are needed.
"""
from pathlib import Path, PurePosixPath
import hashlib
import io
import json
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'media'
DEST = ROOT / 'site' / 'assets'
manifest = json.loads((SOURCE / 'manifest.json').read_text())
pieces = []
for part in manifest['parts']:
    name = part['file']
    if Path(name).name != name:
        raise ValueError('Unexpected media part path')
    data = (SOURCE / name).read_bytes()
    if hashlib.sha256(data).hexdigest() != part['sha256']:
        raise ValueError('Media part failed integrity verification: ' + name)
    pieces.append(data)
archive = b''.join(pieces)
if hashlib.sha256(archive).hexdigest() != manifest['sha256']:
    raise ValueError('Media archive failed integrity verification')
DEST.mkdir(parents=True, exist_ok=True)
# The lightweight hero loop is tracked separately so it can be updated independently.
(DEST / 'hero-loop.mp4').unlink(missing_ok=True)
restored = 0
with zipfile.ZipFile(io.BytesIO(archive)) as z:
    for name in z.namelist():
        if PurePosixPath(name).name != name or name in ('.', '..'):
            raise ValueError('Unexpected media entry path')
        if name == 'hero-loop.mp4':
            continue
        (DEST / name).write_bytes(z.read(name))
        restored += 1
    print(f'Care4Gardens: verified and restored {restored} media assets.')
