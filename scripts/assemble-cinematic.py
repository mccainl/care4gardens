#!/usr/bin/env python3
"""Assemble the new moving footage at native speed. Narration is a separate finishing step."""
import argparse
import json
from pathlib import Path
import shlex
import subprocess

ROOT = Path(__file__).resolve().parents[1]
# Native 24 fps frame ranges; never extend a shot with stills or optical flow.
CUTS = [
    ('S01', 's01-v1', 36, 180),
    ('S02', 's02-v1', 48, 192),
    ('S03', 's03-v1', 42, 192),
    ('S05', 's05-v2', 24, 168),
    ('S04', 's04-v1', 48, 192),
]


def timeline():
    cursor = 0
    result = []
    for shot, take, start, end in CUTS:
        length = end - start
        result.append(dict(shot_id=shot, take=take, source_in_frame=start,
                           source_out_frame_exclusive=end, in_frame=cursor,
                           out_frame_exclusive=cursor+length, seconds=length/24))
        cursor += length
    return dict(fps=24, total_frames=cursor, duration_seconds=cursor/24, shots=result,
                status='motion_preview_narration_pending',
                music_source='s04-v1 original generated audio, no detected speech; crossfaded into one continuous bed',
                excluded_audio='All other generated audio discarded, including unintended narration')


def command(source_dir, output):
    info = timeline()
    duration = info['duration_seconds']
    args = ['ffmpeg', '-y', '-hide_banner', '-v', 'error', '-xerror']
    for _, take, _, _ in CUTS:
        args += ['-threads', '2', '-i', str(source_dir / (take + '.mp4'))]
    # Independent decoder inputs keep every music repeat's timestamps isolated.
    # Splitting one stream into a chain of crossfades prematurely exhausted it.
    for _ in range(4):
        args += ['-i', str(source_dir / 's04-v1.mp4')]
    filters = []
    for i, (_, _, start, end) in enumerate(CUTS):
        filters.append(f'[{i}:v:0]trim=start_frame={start}:end_frame={end},settb=1/24,setpts=N,setsar=1[v{i}]')
    filters.append(''.join(f'[v{i}]' for i in range(5))+'concat=n=5:v=1:a=0[v]')
    for i in range(5):
        filters.append(f'[{i+4}:a:0]atrim=start=0:end=8,aresample=48000,aformat=channel_layouts=stereo,asetpts=N/SR/TB[m{i}]')
    filters += ['[m0][m1]acrossfade=d=1.5:c1=tri:c2=tri[m01]',
                '[m01][m2]acrossfade=d=1.5:c1=tri:c2=tri[m02]',
                '[m02][m3]acrossfade=d=1.5:c1=tri:c2=tri[m03]',
                '[m03][m4]acrossfade=d=1.5:c1=tri:c2=tri[music]']
    filters.append(f'[music]asetpts=N/SR/TB,atrim=end={duration},highpass=f=55,loudnorm=I=-22:TP=-2:LRA=7,afade=t=in:d=0.45,afade=t=out:st={duration-1.5}:d=1.5[a]')
    args += ['-filter_complex_threads','1','-filter_complex',';'.join(filters),
             '-map','[v]','-map','[a]','-c:v','libx264','-preset','slow','-crf','20',
             '-threads','4','-pix_fmt','yuv420p','-r','24','-color_primaries','bt709',
             '-color_trc','bt709','-colorspace','bt709','-c:a','aac','-b:a','160k',
             '-ar','48000','-ac','2','-movflags','+faststart','-t',str(duration),
             '-metadata','title=Care4Gardens - bewegend beeldvoorstel',
             '-metadata','comment=Narration pending. Not a final client delivery.',str(output)]
    return args


def verify(output):
    probe = json.loads(subprocess.check_output([
        'ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(output)
    ], text=True))
    video = next(s for s in probe['streams'] if s['codec_type'] == 'video')
    audio = next(s for s in probe['streams'] if s['codec_type'] == 'audio')
    info = timeline()
    assert (video['width'], video['height'], video['r_frame_rate']) == (1280, 720, '24/1')
    assert int(video['nb_frames']) == info['total_frames']
    assert abs(float(audio['duration']) - info['duration_seconds']) < .05, 'Incomplete soundtrack'
    subprocess.run(['ffmpeg', '-v', 'error', '-xerror', '-i', str(output), '-f', 'null', '-'], check=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-dir', type=Path, default=ROOT/'qa_media/cinematic-rebuild')
    parser.add_argument('--output', type=Path, default=ROOT/'qa_media/cinematic-rebuild/care4gardens-motion-preview.mp4')
    parser.add_argument('--print-command', action='store_true')
    parser.add_argument('--timeline', action='store_true')
    options = parser.parse_args()
    if options.timeline:
        print(json.dumps(timeline(), ensure_ascii=False, indent=2))
    elif options.print_command:
        print(shlex.join(command(options.source_dir, options.output)))
    else:
        options.output.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(command(options.source_dir, options.output), check=True)
        verify(options.output)
        print(json.dumps(timeline(), ensure_ascii=False))
