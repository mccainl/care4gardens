"""A fixed-camera composited glass detail with a rigid, short-travel pane.

Uses the matched open/closed architectural references as video plates. Only
the first narrow pane's optical difference is translated; no scaling occurs.
"""
from pathlib import Path
import subprocess,json
import numpy as np
from PIL import Image,ImageDraw,ImageFilter
ROOT=Path(__file__).resolve().parents[1]
WORK=ROOT/'qa_media/glass-detail'
assets=ROOT/'site/assets'
closed=np.asarray(Image.open(assets/'03_glass_sliding_wall_after.webp').convert('RGB'),dtype=np.float32)
opened=np.asarray(Image.open(assets/'03_glass_sliding_wall_before.webp').convert('RGB'),dtype=np.float32)
h,w=closed.shape[:2]
assert opened.shape==closed.shape
# Coordinates are the first narrow leaf only, not the full glazing wall.
corners=[(314,222),(457,207),(457,692),(314,670)]
# Keep the garden plate fixed. Remove only the old narrow seam using its
# immediate neighbours, then animate a rigid transparent pane outline.
background=closed.copy()
for y in range(207,693):
    for x in range(452,461):
        f=(x-451)/10
        background[y,x]=(1-f)*closed[y,451]+f*closed[y,461]
layer=Image.new('RGBA',(w,h),(0,0,0,0))
draw=ImageDraw.Draw(layer)
draw.polygon(corners,fill=(225,240,235,2))
draw.line([(314,222),(314,670)],fill=(115,130,126,100),width=2)
draw.line([(456,208),(456,689)],fill=(190,205,200,175),width=2)
draw.line([(458,208),(458,689)],fill=(40,55,49,100),width=1)
draw.line([(314,669),(457,691)],fill=(28,35,32,230),width=3)
rgba=np.asarray(layer,dtype=np.float32)
alpha=rgba[...,3:4]/255
premult=rgba[...,:3]*alpha
run=subprocess.Popen(['ffmpeg','-y','-v','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{w}x{h}','-r','24','-i','-',
 '-vf','scale=1920:1080:flags=lanczos,setsar=1','-an','-c:v','libx264','-preset','slow','-crf','17','-threads','4','-pix_fmt','yuv420p',str(WORK/'glass-rigid.mp4')],stdin=subprocess.PIPE)
positions=[]
for frame in range(192):
    t=frame/24
    u=min(1,max(0,(t-.75)/2.5))
    ease=u*u*u*(u*(u*6-15)+10)
    shift=8*(1-ease)
    lo=int(shift);frac=shift-lo
    # Pure translation of the same optical plate. Width and height never change.
    moved=(1-frac)*np.roll(premult,lo,axis=1)+frac*np.roll(premult,lo+1,axis=1)
    opacity=(1-frac)*np.roll(alpha,lo,axis=1)+frac*np.roll(alpha,lo+1,axis=1)
    output=np.clip(background*(1-opacity)+moved,0,255).astype(np.uint8)
    run.stdin.write(output.tobytes())
    positions.append({'frame':frame,'x_offset_reference_pixels':shift,'pane_width_reference_pixels':143})
run.stdin.close();assert run.wait()==0
(ROOT/'docs/product-remake-20261027/rigid-pane-measurements.json').write_text(json.dumps({'method':'Fixed transparent pane translated horizontally; zero scaling, rotation or mesh deformation.','reference_dimensions':[w,h],'pane_corners':corners,'travel_reference_pixels':8,'travel_output_pixels':8*1920/w,'physical_distance':'Illustrative small travel; no calibrated centimetre measurement claimed.','start_seconds':.75,'stop_seconds':3.25,'hold_to_seconds':8,'positions':positions},indent=2)+'\n')
