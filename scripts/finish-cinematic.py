#!/usr/bin/env python3
"""Finish the selected motion edit with Arthur's natural-speed Dutch narration."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import wave

DURATION = 30.25
RATE = 48000
# Source cuts are inside measured silence; no spoken words are time-stretched.
PHRASES = [(0, 4.75, .4), (4.75, 9.15, 6.15), (9.15, 14.6, 12.2),
           (14.6, 19.53, 18.3), (19.53, 22.709792, 24.4)]

CAPTIONS = '''WEBVTT

00:00.400 --> 00:02.120 line:85%
Meer genieten van uw tuin.

00:02.580 --> 00:05.000 line:85%
Met een overkapping in aluminium.

00:06.550 --> 00:08.650 line:85%
Of de warme uitstraling van Douglas,

00:09.100 --> 00:10.650 line:85%
passend bij uw tuin.

00:12.290 --> 00:14.800 line:85%
Glazen schuifwanden geven beschutting,

00:15.330 --> 00:17.250 line:85%
terwijl uw uitzicht blijft.

00:18.900 --> 00:23.200 line:85%
Van persoonlijk advies en inmeten
tot vakkundige montage.

00:24.600 --> 00:27.500 line:85%
Care4Gardens maakt buitenleven mooier.
'''

DESCRIPTIONS = '''WEBVTT

00:00.000 --> 00:06.000
Een vrouw loopt een aluminium veranda in. De camera beweegt langs de tuin.

00:06.000 --> 00:12.000
Een man zet een kopje op tafel onder een Douglas overkapping.

00:12.000 --> 00:18.250
Een man schuift een glazen wand opzij. De tuin blijft zichtbaar.

00:18.250 --> 00:24.250
Een adviseur bespreekt een tuinplan met een bewoner.

00:24.250 --> 00:30.250
Twee mensen genieten van koffie in de tuinkamer. Care4Gardens maakt buitenleven mooier.
'''


def run(args):
    subprocess.run(args, check=True)


def finish(preview, voice, font, output):
    output.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(voice), 'rb') as reader:
        assert (reader.getnchannels(), reader.getsampwidth(), reader.getframerate()) == (2, 2, RATE)
        pcm = reader.readframes(reader.getnframes())
    aligned = bytearray(round(DURATION * RATE) * 4)
    for start, end, destination in PHRASES:
        clip = pcm[round(start * RATE) * 4:round(end * RATE) * 4]
        offset = round(destination * RATE) * 4
        assert offset + len(clip) <= len(aligned)
        aligned[offset:offset + len(clip)] = clip
    voice_aligned = output.with_name('arthur-aligned.wav')
    with wave.open(str(voice_aligned), 'wb') as writer:
        writer.setparams((2, 2, RATE, 0, 'NONE', 'not compressed'))
        writer.writeframes(aligned)

    mix = output.with_name('cinematic-mix.wav')
    filters = ('[1:a]loudnorm=I=-16:TP=-2:LRA=7,aresample=48000,asplit[voice][key];'
               '[0:a]volume=0.5[music];'
               '[music][key]sidechaincompress=threshold=0.08:ratio=3:attack=30:release=450[bed];'
               '[voice][bed]amix=inputs=2:duration=longest:normalize=0,atrim=end=30.25[a]')
    run(['ffmpeg','-y','-v','error','-xerror','-i',str(preview),'-i',str(voice_aligned),
         '-filter_complex',filters,'-map','[a]','-c:a','pcm_s24le','-ar','48000',str(mix)])
    measurement = subprocess.run(['ffmpeg','-hide_banner','-i',str(mix),'-af',
        'loudnorm=I=-16:TP=-1:LRA=7:print_format=json','-f','null','-'],
        check=True,capture_output=True,text=True).stderr
    stats = json.loads(measurement[measurement.rfind('{'):])
    normalise = (f"loudnorm=I=-16:TP=-1:LRA=7:measured_I={stats['input_i']}:"
                 f"measured_TP={stats['input_tp']}:measured_LRA={stats['input_lra']}:"
                 f"measured_thresh={stats['input_thresh']}:offset={stats['target_offset']}:linear=true")
    alpha = "if(lt(t,25.2),0,min((t-25.2)/0.6,1))"
    brand = (f"drawtext=fontfile='{font}':text='Care4Gardens':fontsize=48:fontcolor=white:"
             f"x=(w-text_w)/2:y=62:shadowcolor=black@0.65:shadowx=2:shadowy=3:alpha='{alpha}',"
             f"drawtext=fontfile='{font}':text='MAAKT BUITENLEVEN MOOIER':fontsize=15:fontcolor=white:"
             f"x=(w-text_w)/2:y=124:shadowcolor=black@0.65:shadowx=1:shadowy=2:alpha='{alpha}'")
    run(['ffmpeg','-y','-v','error','-xerror','-i',str(preview),'-i',str(mix),
         '-map','0:v:0','-map','1:a:0','-vf',brand,'-af',normalise,
         '-c:v','libx264','-crf','18','-preset','slow','-threads','4','-pix_fmt','yuv420p',
         '-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709',
         '-c:a','aac','-b:a','192k','-ar','48000','-ac','2','-movflags','+faststart',
         '-t',str(DURATION),'-metadata','title=Care4Gardens - Meer tijd buiten',
         '-metadata','comment=Illustratief websiteconcept. Nederlandse voice-over: Arthur.',str(output)])
    run(['ffmpeg','-v','error','-xerror','-i',str(output),'-f','null','-'])
    probe = json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(output)]))
    v = next(s for s in probe['streams'] if s['codec_type'] == 'video')
    a = next(s for s in probe['streams'] if s['codec_type'] == 'audio')
    assert int(v['nb_frames']) == 726
    assert (v['width'],v['height'],v['r_frame_rate']) == (1280,720,'24/1')
    assert abs(float(a['duration'])-DURATION) < .05
    output.with_name('narration-cinematic.vtt').write_text(CAPTIONS)
    output.with_name('descriptions-cinematic.vtt').write_text(DESCRIPTIONS)
    record = dict(sha256=hashlib.sha256(output.read_bytes()).hexdigest(),bytes=output.stat().st_size,
                  duration_seconds=DURATION,frames=726,phrase_edits=PHRASES,premix_loudness=stats,
                  voice_sha256=hashlib.sha256(voice.read_bytes()).hexdigest(),
                  preview_sha256=hashlib.sha256(preview.read_bytes()).hexdigest(),
                  font_sha256=hashlib.sha256(font.read_bytes()).hexdigest())
    output.with_suffix('.json').write_text(json.dumps(record,indent=2)+'\n')
    print(json.dumps(record))


if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    for arg in ['preview','voice','font','output']:
        parser.add_argument('--'+arg,type=Path,required=True)
    args=parser.parse_args()
    finish(args.preview,args.voice,args.font,args.output)
