#!/usr/bin/env python3
"""Package the finished intro and sidecars for the existing GitHub Pages build."""
from pathlib import Path
import hashlib
import importlib.util
import io
import json
import subprocess
import zipfile

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'qa_media/cinematic-rebuild'
DEST=ROOT/'site/assets'
spec=importlib.util.spec_from_file_location('finish', ROOT/'scripts/finish-cinematic.py')
finish=importlib.util.module_from_spec(spec)
spec.loader.exec_module(finish)
DEST.mkdir(exist_ok=True)
video=SOURCE/'care4gardens-arthur-final.mp4'
subprocess.run(['ffmpeg','-v','error','-xerror','-i',str(video),'-f','null','-'],check=True)
(DEST/'introduction-cinematic.mp4').write_bytes(video.read_bytes())
(DEST/'narration-cinematic.vtt').write_text(finish.CAPTIONS)
(DEST/'descriptions-cinematic.vtt').write_text(finish.DESCRIPTIONS)
subprocess.run(['ffmpeg','-y','-v','error','-i',str(video),'-frames:v','1',
                '-c:v','libwebp','-quality','86',str(DEST/'introduction-cinematic.webp')],check=True)
names=['introduction-cinematic.mp4','introduction-cinematic.webp',
       'narration-cinematic.vtt','descriptions-cinematic.vtt']
buffer=io.BytesIO()
records=[]
with zipfile.ZipFile(buffer,'w',compression=zipfile.ZIP_STORED) as archive:
    for name in names:
        payload=(DEST/name).read_bytes()
        archive.writestr(zipfile.ZipInfo(name,date_time=(2026,10,27,0,0,0)),payload)
        records.append(dict(name=name,bytes=len(payload),sha256=hashlib.sha256(payload).hexdigest()))
data=buffer.getvalue();parts=[]
for index,start in enumerate(range(0,len(data),512*1024)):
    payload=data[start:start+512*1024];name=f'cinematic.part{index:03}'
    (ROOT/'media'/name).write_bytes(payload)
    parts.append(dict(file=name,sha256=hashlib.sha256(payload).hexdigest()))
manifest=dict(sha256=hashlib.sha256(data).hexdigest(),parts=parts,files=records)
(ROOT/'media/cinematic-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps(dict(archive_bytes=len(data),parts=len(parts),files=records)))
