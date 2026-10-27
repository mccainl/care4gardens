"""Restore integrity-checked original and supplemental media archives."""
from pathlib import Path, PurePosixPath
import hashlib
import io
import json
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'media'
DEST = ROOT / 'site' / 'assets'
DEST.mkdir(parents=True, exist_ok=True)
WITHDRAWN = {'garden-living.mp4', 'hero-loop.mp4', 'glass-installation.mp4', 'installation-descriptions.vtt',
             'introduction.mp4', 'glass-closing.mp4', 'garden-transformations.mp4'}
for name in WITHDRAWN:
    (DEST / name).unlink(missing_ok=True)
restored = 0
for manifest_name in ['manifest.json', 'motion-manifest.json', 'product-manifest.json', 'film-manifest.json']:
    manifest = json.loads((SOURCE / manifest_name).read_text())
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
    with zipfile.ZipFile(io.BytesIO(archive)) as z:
        for name in z.namelist():
            if PurePosixPath(name).name != name or name in ('.', '..'):
                raise ValueError('Unexpected media entry path')
            if name in WITHDRAWN:
                continue
            payload = z.read(name)
            if not payload:
                if manifest_name == 'manifest.json' and name == '04_screen_veranda_after.webp':
                    continue
                raise ValueError('Empty media entry: ' + name)
            (DEST / name).write_bytes(payload)
            restored += 1
print(f'Care4Gardens: verified and restored {restored} media entries.')
