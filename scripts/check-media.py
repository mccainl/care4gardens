"""Decode all raster images, including lazy images outside the first viewport."""
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parents[1] / 'site' / 'assets'
count = 0
for path in ROOT.iterdir():
    if not path.is_file():
        continue
    if not path.stat().st_size:
        raise ValueError('Empty media file: ' + path.name)
    if path.suffix.lower() in {'.webp', '.png', '.jpg', '.jpeg'}:
        with Image.open(path) as image:
            image.load()
            if image.width < 1 or image.height < 1:
                raise ValueError('Invalid image size: ' + path.name)
        count += 1
    elif path.suffix == '.mp4' and b'ftyp' not in path.read_bytes()[:32]:
        raise ValueError('Invalid MP4 header: ' + path.name)
print(f'PASS: decoded {count} raster images; media files are non-empty.')
