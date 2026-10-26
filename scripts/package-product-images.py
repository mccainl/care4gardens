"""Package generated product illustrations; encode and verify entirely in memory."""
from pathlib import Path
from PIL import Image
import argparse
import hashlib
import io
import json
import zipfile

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('source_directory', type=Path)
args = parser.parse_args()
records = json.loads((ROOT / 'docs/product-image-prompts.json').read_text())['images']
encoded = {}
for record in records:
    with Image.open(args.source_directory / record['generatedSource']) as original:
        image = original.convert('RGB')
    for key, width, quality in [('asset', 1600, 87), ('smallAsset', 720, 83)]:
        resized = image.copy()
        resized.thumbnail((width, width * 2))
        output = io.BytesIO()
        resized.save(output, 'WEBP', quality=quality, method=6)
        payload = output.getvalue()
        if len(payload) < 1000:
            raise ValueError('Incomplete image encoding: ' + record[key])
        with Image.open(io.BytesIO(payload)) as verified:
            verified.load()
        encoded[Path(record[key]).name] = payload

archive = io.BytesIO()
with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_STORED) as bundle:
    for name, payload in encoded.items():
        bundle.writestr(zipfile.ZipInfo(name, date_time=(2026, 10, 26, 0, 0, 0)), payload)
payload = archive.getvalue()
parts = []
for index, offset in enumerate(range(0, len(payload), 1024 * 1024)):
    name = f'product-v2.part{index:03}'
    part = payload[offset:offset + 1024 * 1024]
    destination = ROOT / 'media' / name
    temporary = destination.with_suffix('.partial')
    temporary.write_bytes(part)
    temporary.replace(destination)
    if destination.read_bytes() != part:
        raise ValueError('Archive part write failed: ' + name)
    parts.append({'file': name, 'sha256': hashlib.sha256(part).hexdigest()})
manifest = {
    'sha256': hashlib.sha256(payload).hexdigest(),
    'parts': parts,
    'files': [{'name': name, 'bytes': len(data)} for name, data in encoded.items()],
}
(ROOT / 'media/product-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(f'Packaged and decoded {len(encoded)} images in {len(parts)} integrity-checked parts.')
