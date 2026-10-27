"""Replace only the closing shot; copy approved opening video and audio packets."""
from pathlib import Path
import subprocess, json, hashlib

ROOT=Path(__file__).resolve().parents[1]
WORK=ROOT/'qa_media/glass-detail'
APPROVED=ROOT/'qa_media/product-remake/care4gardens-product-remake.mp4'
WORK.mkdir(parents=True,exist_ok=True)

def run(args): subprocess.run(args,check=True)

def main():
    font=ROOT/'site/assets/dm-sans-600.ttf'
    brand=ROOT/'qa_media/product-remake/brand.txt'
    tagline=ROOT/'qa_media/product-remake/tagline.txt'
    filters=(f"trim=duration=8,setpts=PTS-STARTPTS,fps=24,setsar=1,"
      f"drawtext=fontfile={font}:textfile={brand}:fontsize=72:fontcolor=white:shadowcolor=black@0.55:shadowx=2:shadowy=3:x=(w-tw)/2:y=90:alpha='if(lt(t,4),0,min(1,(t-4)/0.6))',"
      f"drawtext=fontfile={font}:textfile={tagline}:fontsize=25:fontcolor=white:shadowcolor=black@0.55:shadowx=1:shadowy=2:x=(w-tw)/2:y=180:alpha='if(lt(t,4.3),0,min(1,(t-4.3)/0.6))'")
    run(['ffmpeg','-y','-v','error','-xerror','-i',str(WORK/'glass-rigid.mp4'),'-vf',filters,'-an','-c:v','libx264','-preset','slow','-crf','18','-threads','4','-pix_fmt','yuv420p','-video_track_timescale','12288',str(WORK/'ending.mp4')])
    run(['ffmpeg','-y','-v','error','-i',str(APPROVED),'-frames:v','384','-map','0:v:0','-c','copy','-an',str(WORK/'opening.mp4')])
    (WORK/'concat.txt').write_text("file 'opening.mp4'\nfile 'ending.mp4'\n")
    run(['ffmpeg','-y','-v','error','-f','concat','-safe','0','-i',str(WORK/'concat.txt'),'-i',str(APPROVED),'-map','0:v:0','-map','1:a:0','-c','copy','-movflags','+faststart',str(WORK/'care4gardens-approved-corrected.mp4')])
    out=WORK/'care4gardens-approved-corrected.mp4'
    run(['ffmpeg','-v','error','-xerror','-i',str(out),'-f','null','-'])
    def stream_hash(path,stream,extra=[]):
        return subprocess.check_output(['ffmpeg','-v','error','-i',str(path),'-map',stream,*extra,'-f','hash','-hash','sha256','-'],text=True).strip()
    assert stream_hash(out,'0:a:0')==stream_hash(APPROVED,'0:a:0'), 'Approved audio changed'
    assert stream_hash(out,'0:v:0',['-frames:v','384'])==stream_hash(APPROVED,'0:v:0',['-frames:v','384']), 'Approved first 16 seconds changed'
    probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(out)]))
    v=next(s for s in probe['streams'] if s['codec_type']=='video')
    assert int(v['nb_frames'])==576 and v['width']==1920 and v['height']==1080
    report={'file':out.name,'bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'frames':576,'duration':24,'audio_identical':True,'opening_384_frames_identical':True,'strict_decode':'passed'}
    (ROOT/'docs/product-remake-20261027/glass-correction-export.json').write_text(json.dumps(report,indent=2)+'\n')

if __name__=='__main__': main()
