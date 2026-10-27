"""Assemble newly generated people-free footage; never alter the website."""
from pathlib import Path
import subprocess, json, wave, hashlib

ROOT = Path(__file__).resolve().parents[1]
WORK = ROOT / 'qa_media/product-remake'
DOC = ROOT / 'docs/product-remake-20261027'
WORK.mkdir(parents=True, exist_ok=True)
DURATION = 24
PHRASES = [(0, 4.75, .3), (4.75, 9.15, 8.1), (9.15, 14.6, 13.2), (19.53, 22.709792, 19.8)]

def run(args):
    subprocess.run(args, check=True)

def main():
    voice = ROOT / 'qa_media/cinematic-rebuild/arthur-nl.wav'
    with wave.open(str(voice), 'rb') as r:
        channels, width, rate = r.getnchannels(), r.getsampwidth(), r.getframerate()
        pcm = r.readframes(r.getnframes())
    framebytes = channels * width
    aligned = bytearray(DURATION * rate * framebytes)
    for start, end, dest in PHRASES:
        chunk = pcm[round(start*rate)*framebytes:round(end*rate)*framebytes]
        offset = round(dest*rate)*framebytes
        aligned[offset:offset+len(chunk)] = chunk
    with wave.open(str(WORK/'voice.wav'), 'wb') as w:
        w.setparams((channels,width,rate,0,'NONE','not compressed'))
        w.writeframes(aligned)
    # Existing instrumental audio only. None of the people-film's picture is reused.
    music = ROOT/'qa_media/cinematic-rebuild/care4gardens-motion-preview.mp4'
    args = ['ffmpeg','-y','-v','error','-xerror']
    for name in ['aluminium','douglas','glass']:
        args += ['-i',str(WORK/(name+'.mp4'))]
    args += ['-i',str(WORK/'voice.wav'),'-i',str(music)]
    filters = []
    for i in range(3):
        direction = 'reverse,' if i == 2 else ''
        filters.append(f'[{i}:v]trim=duration=8,{direction}setpts=PTS-STARTPTS,fps=24,scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1[v{i}]')
    filters.append('[v0][v1][v2]concat=n=3:v=1:a=0[picture]')
    font = ROOT/'site/assets/dm-sans-600.ttf'
    (WORK/'brand.txt').write_text('Care4Gardens')
    (WORK/'tagline.txt').write_text('MAAKT BUITENLEVEN MOOIER')
    filters.append(f"[picture]drawtext=fontfile={font}:textfile={WORK/'brand.txt'}:fontsize=72:fontcolor=white:shadowcolor=black@0.55:shadowx=2:shadowy=3:x=(w-tw)/2:y=90:alpha='if(lt(t,20),0,min(1,(t-20)/0.6))',drawtext=fontfile={font}:textfile={WORK/'tagline.txt'}:fontsize=25:fontcolor=white:shadowcolor=black@0.55:shadowx=1:shadowy=2:x=(w-tw)/2:y=180:alpha='if(lt(t,20.3),0,min(1,(t-20.3)/0.6))'[v]")
    filters += ['[3:a]loudnorm=I=-16:TP=-2:LRA=7,aresample=48000,asplit[voice][key]',
                '[4:a]atrim=end=24,asetpts=PTS-STARTPTS,volume=0.42,afade=t=in:d=0.6,afade=t=out:st=22.6:d=1.4[music]',
                '[music][key]sidechaincompress=threshold=0.025:ratio=5:attack=20:release=500[ducked]',
                '[voice][ducked]amix=inputs=2:duration=longest:normalize=0,alimiter=limit=0.85:level=false,atrim=end=24[a]']
    out=WORK/'care4gardens-product-remake.mp4'
    args += ['-filter_complex_threads','1','-filter_complex',';'.join(filters),'-map','[v]','-map','[a]',
             '-c:v','libx264','-preset','slow','-crf','18','-threads','4','-pix_fmt','yuv420p',
             '-c:a','aac','-b:a','192k','-ar','48000','-ac','2','-t','24','-movflags','+faststart',str(out)]
    run(args)
    run(['ffmpeg','-v','error','-xerror','-i',str(out),'-f','null','-'])
    probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(out)]))
    video=next(s for s in probe['streams'] if s['codec_type']=='video')
    assert video['nb_frames']=='576'
    assert video['width']==1920 and video['height']==1080
    record={'file':out.name,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'bytes':out.stat().st_size,'duration':24,'frames':576,'narration':'Existing Arthur recording; four complete phrases, natural speed; no new voice generation.','phrase_edits':PHRASES,'visual_sources':'Three newly generated clips; no footage from either prior film.','website_changed':False,'strict_decode':'passed','creative_approval':False}
    (DOC/'export.json').write_text(json.dumps(record,indent=2)+'\n')

if __name__=='__main__':
    main()
