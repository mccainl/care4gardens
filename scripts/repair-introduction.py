"""Re-edit the original Care4Gardens story; retain its soundtrack and safe motion.

Usage: python3 scripts/repair-introduction.py path/to/restored/originals
The originals remain untouched. No generative media calls or credits are used.
"""
from pathlib import Path
import argparse
import hashlib
import io
import json
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('originals', type=Path)
parser.add_argument('--reuse-normalised', action='store_true')
args = parser.parse_args()
originals = args.originals.resolve()
work = ROOT / 'qa_media' / 'repair'
work.mkdir(parents=True, exist_ok=True)
assets = ROOT / 'site' / 'assets'
font = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'

def run(command):
    subprocess.run(command, check=True, timeout=600, capture_output=True)

def encode(inputs, filters, output, audio=None):
    command = ['ffmpeg', '-v', 'error', '-xerror', '-y', *inputs]
    if audio:
        command += ['-i', str(audio)]
    command += ['-filter_complex', filters, '-map', '[v]', '-c:v', 'libx264',
                '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', '24']
    if audio:
        command += ['-map', '5:a:0', '-af', 'apad=whole_dur=21.5',
                    '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-t', '21.5']
    else:
        command += ['-an']
    command += ['-movflags', '+faststart', str(output)]
    run(command)

# Frame-exact edit points follow the existing narration's changes of meaning.
# Moving glass ranges are excluded. Open/closed states are explicit editorial cuts.
shots = [
    {'id': 'aluminium-open', 'source': originals / 'garden-transformations.mp4', 'in': 0, 'out': 1.5, 'frames': 56},
    {'id': 'aluminium-sheltered', 'source': assets / 'veranda-atmosphere.mp4', 'in': .5, 'out': 3.6, 'frames': 74},
    {'id': 'douglas-open', 'source': originals / 'garden-transformations.mp4', 'in': 7.75, 'out': 8.95, 'frames': 30},
    {'id': 'douglas-glass', 'source': originals / 'garden-transformations.mp4', 'in': 11, 'out': 14.95, 'frames': 126},
    {'id': 'garden-living', 'source': originals / 'garden-living.mp4', 'in': 9, 'out': 14.95, 'frames': 230},
]
assert sum(s['frames'] for s in shots) == 516
normalised = []
for shot in shots:
    output = work / (shot['id'] + '.mp4')
    duration = shot['frames'] / 24
    factor = duration / (shot['out'] - shot['in'])
    # Crop the previous burned-in captions, then use one consistent editorial footer.
    # No stretching, invented mechanism animation, reverse playback, or frozen end card.
    vf = (f"[0:v]trim=start={shot['in']}:end={shot['out']},setpts={factor}*(PTS-STARTPTS),"
          "scale=1280:720,setsar=1,crop=1280:566:0:0,"
          "minterpolate=fps=24:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,"
          f"tpad=stop_mode=clone:stop_duration=0.15,trim=end_frame={shot['frames']},"
          "setpts=N/(24*TB),pad=1280:720:0:0:color=0x132f25[v]")
    if not args.reuse_normalised:
        encode(['-i', str(shot['source'])], vf, output)
    probe = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=nb_frames', '-of', 'json', str(output)]))
    assert int(probe['streams'][0]['nb_frames']) == shot['frames'], shot['id']
    normalised.append(output)

captions = [
    (0.14, 2.30, 'Van een open terras'),
    (2.30, 5.22, 'naar een plek om langer van buiten te genieten.'),
    (5.42, 6.68, 'Met overkappingen'),
    (6.68, 9.56, 'en glazen schuifwanden van Care4Gardens.'),
    (9.72, 11.90, 'Wij maken buitenleven mooier.'),
    (12.08, 14.03, 'Ook genieten van uw tuin?'),
    (14.08, 16.25, 'Sluit u aan bij onze tevreden klanten.'),
    (16.44, 20.25, 'Care4Gardens maakt buitenleven mooier.'),
]
labels = [(0, 5.4167, 'ALUMINIUM OVERKAPPINGEN'),
          (5.4167, 6.6667, 'DOUGLAS OVERKAPPINGEN'),
          (6.6667, 11.9167, 'OVERKAPPINGEN & GLAZEN SCHUIFWANDEN'),
          (11.9167, 16.44, 'VAN ADVIES TOT MONTAGE'),
          (16.44, 21.5, 'CARE4GARDENS')]
filters = ''.join(f'[{i}:v]' for i in range(5)) + 'concat=n=5:v=1:a=0,setsar=1'
for index, (start, end, text) in enumerate(labels + captions):
    textfile = work / f'text-{index}.txt'
    textfile.write_text(text)
    label = index < len(labels)
    filters += (f",drawtext=fontfile={font}:textfile={textfile}:fontsize={22 if label else 36}:"
                f"fontcolor={'0xc3d2b8' if label else 'white'}:x=(w-tw)/2:y={589 if label else 632}:"
                f"enable='gte(t,{start})*lt(t,{end})'")
# Fade only after the final spoken phrase, retaining almost a second of breathing room.
filters += ',fade=t=out:st=20.75:d=0.75[v]'
target = assets / 'introduction-corrected.mp4'
encode([item for p in normalised for item in ['-i', str(p)]], filters, target, originals / 'introduction.mp4')

# The hero retains the customer's original interior, using only the stable end range.
hero = assets / 'garden-living-corrected.mp4'
if not args.reuse_normalised:
    encode(['-i', str(originals / 'garden-living.mp4')],
       '[0:v]trim=start=9:end=14.95,setpts=1.5*(PTS-STARTPTS),'
       'minterpolate=fps=24:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,'
       'setsar=1[v]', hero)
for source, name in [(target, 'introduction-poster.webp'), (hero, 'garden-living-poster.webp')]:
    run(['ffmpeg', '-v', 'error', '-y', '-i', str(source), '-frames:v', '1',
         '-c:v', 'libwebp', '-quality', '90', str(assets / name)])

def timestamp(seconds):
    ms = round(seconds * 1000)
    return f'{ms // 60000:02}:{ms // 1000 % 60:02}.{ms % 1000:03}'

(assets / 'narration-corrected.vtt').write_text('WEBVTT\n\n' + '\n\n'.join(
    f'{timestamp(start)} --> {timestamp(end)}\n{text}' for start, end, text in captions) + '\n')
(assets / 'descriptions-corrected.vtt').write_text('''WEBVTT

00:00.000 --> 00:05.417
Een open aluminium overkapping in de tuin; een duidelijke beeldwissel toont de beschutte uitvoering met gesloten glas.

00:05.417 --> 00:11.917
Een Douglas overkapping; een beeldwissel toont de uitvoering met gesloten glazen schuifwanden.

00:11.917 --> 00:21.500
Vanuit de beschutte zithoek blijft de tuin zichtbaar door het glas. De camera beweegt rustig door tot na de slotwoorden.
''')

names = ['introduction-corrected.mp4', 'garden-living-corrected.mp4',
         'introduction-poster.webp', 'garden-living-poster.webp',
         'narration-corrected.vtt', 'descriptions-corrected.vtt']
records = []
for name in names:
    payload = (assets / name).read_bytes()
    if name.endswith('.mp4'):
        run(['ffmpeg', '-v', 'error', '-xerror', '-i', str(assets / name), '-f', 'null', '-'])
    records.append({'name': name, 'bytes': len(payload), 'sha256': hashlib.sha256(payload).hexdigest()})

archive = io.BytesIO()
with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_STORED) as bundle:
    for name in names:
        bundle.writestr(zipfile.ZipInfo(name, date_time=(2026, 10, 27, 0, 0, 0)), (assets / name).read_bytes())
data = archive.getvalue()
parts = []
for index, start in enumerate(range(0, len(data), 1024 * 1024)):
    part = data[start:start + 1024 * 1024]
    name = f'film-repair.part{index:03}'
    (ROOT / 'media' / name).write_bytes(part)
    parts.append({'file': name, 'sha256': hashlib.sha256(part).hexdigest()})
for stale in (ROOT / 'media').glob('film-repair.part*'):
    if stale.name not in {part['file'] for part in parts}:
        stale.unlink()
(ROOT / 'media' / 'repair-manifest.json').write_text(json.dumps({
    'sha256': hashlib.sha256(data).hexdigest(), 'parts': parts, 'files': records}, indent=2) + '\n')
timeline = []
frame = 0
for shot in shots:
    timeline.append({**shot, 'source': shot['source'].name,
                     'source_sha256': hashlib.sha256(shot['source'].read_bytes()).hexdigest(),
                     'start_frame': frame, 'end_frame_exclusive': frame + shot['frames']})
    frame += shot['frames']
(work / 'edit.json').write_text(json.dumps({'fps': 24, 'shots': timeline, 'captions': captions,
                                          'original_audio_sha256': hashlib.sha256((originals / 'introduction.mp4').read_bytes()).hexdigest()}, indent=2))
print(json.dumps({'files': records, 'timeline': timeline}, indent=2))
