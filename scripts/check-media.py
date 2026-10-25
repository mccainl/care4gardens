"""Fully decode image and video assets, including media outside the viewport."""
from pathlib import Path
from PIL import Image
import json
import subprocess
ROOT = Path(__file__).resolve().parents[1] / 'site' / 'assets'
count = 0
videos = 0
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
    elif path.suffix == '.mp4':
        probe = subprocess.run(
            ['ffprobe', '-v', 'error', '-select_streams', 'v:0',
             '-show_entries', 'stream=codec_name,width,height:format=duration',
             '-of', 'json', str(path)], check=True, capture_output=True, text=True)
        metadata = json.loads(probe.stdout)
        if not metadata.get('streams') or float(metadata['format']['duration']) < 1:
            raise ValueError('Invalid video stream: ' + path.name)
        stream = metadata['streams'][0]
        if stream['codec_name'] != 'h264' or min(stream['width'], stream['height']) < 1:
            raise ValueError('Unsupported web video: ' + path.name)
        subprocess.run(
            ['ffmpeg', '-v', 'error', '-xerror', '-i', str(path),
             '-f', 'null', '-'], check=True, capture_output=True)
        videos += 1
print(f'PASS: fully decoded {count} raster images and {videos} H.264 videos; no empty media.')
