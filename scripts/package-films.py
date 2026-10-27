"""Assemble reviewed Kling shots and package reproducible, integrity-checked web media."""
from pathlib import Path
import argparse
import hashlib
import io
import json
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('source_directory', type=Path)
parser.add_argument('--audio', required=True, type=Path)
args = parser.parse_args()
source = args.source_directory.resolve()
output = source / 'delivery'
output.mkdir(exist_ok=True)

def run(arguments):
    subprocess.run(arguments, check=True, timeout=300)

def encode(arguments, destination):
    # Capture the complete encode before one verified atomic filesystem write.
    # Fragmented MP4 places initialization metadata first and supports web playback.
    payload = subprocess.check_output(['ffmpeg', '-v', 'error', '-xerror', *arguments,
         '-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-pix_fmt', 'yuv420p',
         '-movflags', 'frag_keyframe+empty_moov+default_base_moof', '-f', 'mp4', 'pipe:1'], timeout=300)
    temporary = destination.with_suffix('.partial')
    temporary.write_bytes(payload)
    assert temporary.read_bytes() == payload, destination.name
    temporary.replace(destination)
    assert destination.read_bytes() == payload, destination.name

normalised = []
for name in ['veranda', 'screens', 'shutters']:
    run(['ffmpeg', '-v', 'error', '-xerror', '-i', str(source / (name + '-v1.mp4')), '-f', 'null', '-'])
    target = output / (name + '-linear.mp4')
    encode(['-i', str(source / (name + '-v1.mp4')), '-t', '7', '-an', '-vf',
            'scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,setsar=1,fps=24'], target)
    normalised.append(target)

# Simple clean cuts retain exactly 21 seconds. The previously approved narration is preserved.
concat = ';'.join(f'[{i}:v]setpts=PTS-STARTPTS[v{i}]' for i in range(3))
concat += ';[v0][v1][v2]concat=n=3:v=1:a=0,fade=t=in:d=0.25,fade=t=out:st=20.75:d=0.25[v]'
inputs = [argument for item in normalised for argument in ['-i', str(item)]]
encode([*inputs, '-i', str(args.audio.resolve()), '-filter_complex', concat, '-map', '[v]',
        '-map', '3:a:0', '-af', 'apad=whole_dur=21', '-t', '21', '-c:a', 'aac', '-b:a', '160k'], output / 'introduction-v2.mp4')

# Forward/return movement avoids a visible jump back to a different endpoint.
for item, destination, width in zip(normalised, ['veranda-atmosphere.mp4', 'screen-detail.mp4', 'shutter-detail.mp4'], [1280, 1920, 1920]):
    filters = f'[0:v]scale={width}:-2,split[a][b];[b]reverse,setpts=PTS-STARTPTS[r];[a]setpts=PTS-STARTPTS[f];[f][r]concat=n=2:v=1:a=0[v]'
    encode(['-i', str(item), '-filter_complex', filters, '-map', '[v]', '-an'], output / destination)

descriptions = '''WEBVTT

00:00.000 --> 00:07.000
Een aluminium overkapping met gesloten glazen wanden aan een bakstenen woning. De camera beweegt rustig langs de tuin.

00:07.000 --> 00:14.000
Een zonwerend screen aan een veranda beweegt in zijn zijgeleiders.

00:14.000 --> 00:21.000
Een antraciet rolluik aan een raam in een bakstenen gevel beweegt langs de geleiders.
'''
(output / 'descriptions-v2.vtt').write_text(descriptions)
(output / 'gallery-descriptions-v2.vtt').write_text('WEBVTT\n\n00:00.000 --> 00:14.000\nProductimpressie van zonwering die rustig langs de vaste zijgeleiders beweegt.\n')
names = ['introduction-v2.mp4', 'veranda-atmosphere.mp4', 'screen-detail.mp4', 'shutter-detail.mp4', 'descriptions-v2.vtt', 'gallery-descriptions-v2.vtt']
records = []
for name in names:
    path = output / name
    if name.endswith('.mp4'):
        probe = subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=codec_name,width,height:format=duration', '-of', 'json', str(path)], text=True)
        metadata = json.loads(probe)
        stream = metadata['streams'][0]
        assert stream['codec_name'] == 'h264' and stream['height'] >= 720, name
        assert abs(float(metadata['format']['duration']) - (21 if name == 'introduction-v2.mp4' else 14)) < 0.1, name
        run(['ffmpeg', '-v', 'error', '-xerror', '-i', str(path), '-f', 'null', '-'])
    payload = path.read_bytes()
    assert payload, name
    records.append({'name': name, 'bytes': len(payload), 'sha256': hashlib.sha256(payload).hexdigest()})

archive = io.BytesIO()
with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_STORED) as bundle:
    for name in names:
        bundle.writestr(zipfile.ZipInfo(name, date_time=(2026, 10, 27, 0, 0, 0)), (output / name).read_bytes())
data = archive.getvalue()
parts = []
for index, start in enumerate(range(0, len(data), 1024 * 1024)):
    part = data[start:start + 1024 * 1024]
    name = f'films-v2.part{index:03}'
    destination = ROOT / 'media' / name
    destination.write_bytes(part)
    assert destination.read_bytes() == part
    parts.append({'file': name, 'sha256': hashlib.sha256(part).hexdigest()})
(ROOT / 'media/film-manifest.json').write_text(json.dumps({'sha256': hashlib.sha256(data).hexdigest(), 'parts': parts, 'files': records}, indent=2) + '\n')
print(json.dumps({'files': records, 'archive_bytes': len(data), 'parts': len(parts)}, indent=2))
