"""Offline Kokoro audio for mocks 07–12. Never reads or writes website content.

Run with a Python environment containing kokoro-onnx, numpy and onnxruntime:
  python -B generate_audio.py --model-dir <local-model-folder> [--forms 7 8 ...]
ffmpeg/ffprobe must be on PATH. The model folder contains kokoro-v1.0.onnx and
voices-v1.0.bin. Cached PCM stays outside this pack, in the system temp directory.
"""
import argparse
from concurrent.futures import ProcessPoolExecutor, as_completed
import hashlib
import importlib.metadata
import json
import re
import subprocess
import tempfile
from pathlib import Path

import numpy as np
import onnxruntime as ort
from kokoro_onnx import Kokoro

ROOT=Path(__file__).resolve().parents[1]
RATE=24000
SPEED=1.0
NARRATOR='bf_emma'
GAP=.4
SETTINGS=dict(speed=SPEED,sampleRate=RATE,turnGapSeconds=GAP,previewSeconds=60,
              midpointSeconds=30,partCheckSeconds=30,finalCheckSeconds=120,
              narrator=NARRATOR,bitrate='80k',revision=1)
VOICES={
7:[{'Coordinator':'bm_george','Caller':'af_heart'},{'Host':'bm_george'},
   {'Maya':'bf_isabella','Leo':'am_michael'},{'Lecturer':'bf_emma'}],
8:[{'Volunteer':'bm_george','Caller':'am_michael'},{'Director':'bf_isabella'},
   {'Tutor':'bf_emma','Amira':'af_heart','Ben':'bm_george'},{'Lecturer':'bm_george'}],
9:[{'Mechanic':'am_michael','Customer':'bf_isabella'},{'Coordinator':'bf_emma'},
   {'Tutor':'bm_george','Clara':'bf_isabella','Rafi':'am_michael'},{'Lecturer':'bf_isabella'}],
10:[{'Organiser':'am_michael','Caller':'af_heart'},{'Guide':'bf_isabella'},
    {'Tutor':'bf_emma','Nora':'bf_isabella','Ethan':'am_michael'},{'Lecturer':'bm_george'}],
11:[{'Administrator':'bf_isabella','Caller':'am_michael'},{'Guide':'bm_george'},
    {'Tutor':'bf_emma','Lena':'bf_isabella','Omar':'am_michael'},{'Lecturer':'bf_isabella'}],
12:[{'Assistant':'bf_isabella','Caller':'am_michael'},{'Coordinator':'bm_george'},
    {'Tutor':'bf_emma','Alice':'bf_isabella','Jamal':'am_michael'},{'Lecturer':'bf_emma'}]
}

def digest(value):return hashlib.sha256(value).hexdigest()

def dump(path,data):
    path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')

def normalise(text):
    text=text.replace('’',"'").replace('—',', ').replace('–',' to ')
    text=re.sub(r'\b(?:[A-Z]-){2,}[A-Z]\b',lambda m:', '.join(m.group().split('-')),text)
    for old,new in {'6:30':'six thirty','9:15':'nine fifteen','10:15':'ten fifteen',
                    '12:30':'twelve thirty','4:30':'four thirty','4:00':"four o'clock",
                    '19 October':'the nineteenth of October','£168':'one hundred and sixty-eight pounds',
                    '£28':'twenty-eight pounds'}.items():
        text=text.replace(old,new)
    return text

def parse(script,roles):
    segments=[]
    current=None
    for raw in script.splitlines():
        line=raw.strip()
        if not line:continue
        if line=='---':segments.append(dict(kind='midpoint'));continue
        match=re.match(r'^([A-Za-z ]{1,25}):\s*(.*)$',line)
        if match and match.group(1) in roles:
            current=match.group(1);line=match.group(2)
        if current is None:raise ValueError('Speech before a known role label')
        if match and match.group(1) not in roles:raise ValueError('Unknown role: '+match.group(1))
        if line:segments.append(dict(kind='speech',role=current,voice=roles[current],text=line,spokenText=normalise(line)))
    return segments

class Generator:
    def __init__(self,model,cache):
        self.cache=cache;cache.mkdir(parents=True,exist_ok=True)
        options=ort.SessionOptions();options.intra_op_num_threads=2;options.inter_op_num_threads=1
        session=ort.InferenceSession(str(model/'kokoro-v1.0.onnx'),sess_options=options,providers=['CPUExecutionProvider'])
        self.kokoro=Kokoro.from_session(session,str(model/'voices-v1.0.bin'))
        required={NARRATOR}|{v for forms in VOICES.values() for part in forms for v in part.values()}
        assert required<=set(self.kokoro.get_voices())
        self.modelHashes={p.name:digest(p.read_bytes()) for p in [model/'kokoro-v1.0.onnx',model/'voices-v1.0.bin']}
        self.packages={p:importlib.metadata.version(p) for p in ('kokoro-onnx','onnxruntime','numpy')}

    def say(self,voice,text):
        key=digest(json.dumps([voice,text,SETTINGS,self.modelHashes],sort_keys=True).encode())
        path=self.cache/(key+'.npy')
        if path.exists():return np.load(path,allow_pickle=False)
        # Short sentences prevent excessive model input, while keeping natural clauses intact.
        sentences=re.split(r'(?<=[.!?])\s+',text)
        chunks=[];pending=''
        for sentence in sentences:
            if pending and len(pending)+len(sentence)>480:chunks.append(pending);pending=''
            pending=(pending+' '+sentence).strip()
        if pending:chunks.append(pending)
        arrays=[]
        for chunk in chunks:
            samples,rate=self.kokoro.create(chunk,voice=voice,speed=SPEED,lang='en-gb' if voice.startswith('b') else 'en-us')
            assert rate==RATE and len(samples)>RATE*.1 and np.isfinite(samples).all()
            arrays.append(samples.astype(np.float32))
        result=np.concatenate(arrays)
        with tempfile.NamedTemporaryFile(dir=self.cache,suffix='.npy',delete=False) as handle:
            np.save(handle,result,allow_pickle=False)
            temporary=Path(handle.name)
        temporary.replace(path)
        return result

    def part(self,form,number,data):
        folder=ROOT/f'mock-{form:02d}'/'audio';folder.mkdir(exist_ok=True)
        path=folder/f'part-{number}.mp3';metadata=folder/f'part-{number}.json'
        sourceHash=digest(data['script'].encode())
        fingerprint=digest(json.dumps([sourceHash,data['title'],VOICES[form][number-1],SETTINGS,self.modelHashes],sort_keys=True).encode())
        if path.exists() and metadata.exists():
            previous=json.loads(metadata.read_text(encoding='utf-8'))
            if previous.get('fingerprint')==fingerprint and previous.get('sha256')==digest(path.read_bytes()):
                print(f'Mock {form:02d} Part {number}: verified cached recording',flush=True);return previous
        timeline=[];arrays=[];cursor=0
        def add(kind,seconds=0,voice=None,text=None,extra=None):
            nonlocal cursor
            samples=np.zeros(int(seconds*RATE),dtype=np.float32) if kind=='pause' else self.say(voice,text)
            entry=dict(kind=kind,start=round(cursor/RATE,4),seconds=round(len(samples)/RATE,4))
            if text:entry.update(voice=voice,spokenText=text)
            if extra:entry.update(extra)
            timeline.append(entry);arrays.append(samples);cursor+=len(samples)
        start=(number-1)*10+1;end=start+9
        if number==1:
            add('narration',voice=NARRATOR,text=f'IELTS Academic practice. Mock {form}. Listening. You will hear each part once. Write your answers on the answer sheet. There are four parts and forty questions.')
            add('pause',seconds=1)
        add('narration',voice=NARRATOR,text=f'Part {number}. {data["title"]}. You now have one minute to read questions {start} to {end}.')
        add('pause',seconds=SETTINGS['previewSeconds'],extra=dict(purpose='preview'))
        segments=parse(data['script'],VOICES[form][number-1])
        for i,s in enumerate(segments):
            if s['kind']=='midpoint':
                add('narration',voice=NARRATOR,text=f'Now look at questions {start+5} to {end}.')
                add('pause',seconds=SETTINGS['midpointSeconds'],extra=dict(purpose='midpoint'))
            else:
                add('speech',voice=s['voice'],text=s['spokenText'],extra=dict(role=s['role'],sourceText=s['text']))
                add('pause',seconds=GAP,extra=dict(purpose='turn'))
            if (i+1)%10==0:print(f'Mock {form:02d} Part {number}: {i+1}/{len(segments)} script segments',flush=True)
        check=SETTINGS['partCheckSeconds'] if number<4 else SETTINGS['finalCheckSeconds']
        closing=f'That is the end of part {number}. You now have thirty seconds to check your answers.' if number<4 else 'That is the end of part four. You now have two minutes to check all your Listening answers.'
        add('narration',voice=NARRATOR,text=closing)
        add('pause',seconds=check,extra=dict(purpose='checking'))
        if number==4:add('narration',voice=NARRATOR,text='That is the end of the Listening test. Please stop writing.')
        audio=np.concatenate(arrays)
        # One constant gain preserves voice differences; no time stretching or per-turn loudness tricks.
        peak=float(np.max(np.abs(audio)));gain=min(1.0,.89/max(peak,1e-6));audio*=gain
        pcm=(np.clip(audio,-1,1)*32767).astype('<i2').tobytes()
        temporary=path.with_suffix('.partial.mp3')
        subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','s16le','-ar',str(RATE),'-ac','1','-i','-',
                        '-codec:a','libmp3lame','-b:a',SETTINGS['bitrate'],'-metadata',f'title=IELTS Mock {form:02d} - Listening Part {number}',str(temporary)],input=pcm,check=True)
        temporary.replace(path)
        result=dict(form=form,part=number,file=f'mock-{form:02d}/audio/{path.name}',sha256=digest(path.read_bytes()),
                    bytes=path.stat().st_size,seconds=probe(path),pcmSeconds=round(len(audio)/RATE,4),
                    sourceScriptSha256=sourceHash,fingerprint=fingerprint,roles=VOICES[form][number-1],
                    settings=SETTINGS,modelSha256=self.modelHashes,packages=self.packages,gain=gain,segments=timeline)
        dump(metadata,result)
        print(f'Mock {form:02d} Part {number}: complete, {result["seconds"]:.2f} seconds',flush=True)
        return result

def probe(path):
    return float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(path)],text=True))

def combine(form,parts):
    folder=ROOT/f'mock-{form:02d}'/'audio';full=folder/'listening-full.mp3'
    # Join decoded samples, so MP3 encoder delay cannot cause timestamp overlaps at joins.
    command=['ffmpeg','-hide_banner','-loglevel','error','-y']
    for part in parts:command+=['-i',str(ROOT/part['file'])]
    filters=';'.join(f'[{i}:a]asetpts=PTS-STARTPTS[a{i}]' for i in range(4))
    filters+=';'+''.join(f'[a{i}]' for i in range(4))+'concat=n=4:v=0:a=1[out]'
    temporary=full.with_suffix('.partial.mp3')
    command+=['-filter_complex',filters,'-map','[out]','-codec:a','libmp3lame','-b:a',SETTINGS['bitrate'],
              '-ar',str(RATE),'-ac','1','-metadata',f'title=IELTS Mock {form:02d} - Complete Listening',str(temporary)]
    subprocess.run(command,check=True)
    temporary.replace(full)
    offset=0;chapters=[]
    for p in parts:
        chapters.append(dict(part=p['part'],start=round(offset,3),seconds=p['pcmSeconds'],file=p['file']));offset+=p['pcmSeconds']
    return dict(form=form,file=f'mock-{form:02d}/audio/{full.name}',seconds=probe(full),bytes=full.stat().st_size,
                sha256=digest(full.read_bytes()),parts=chapters,assembly='Decoded audio concatenation with continuous timestamps; re-encoded MP3')

def generate_form(form,parts,model,cache):
    generator=Generator(model,cache)
    data=json.loads((ROOT/f'mock-{form:02d}'/'mock.json').read_text(encoding='utf-8'))
    for part in parts:generator.part(form,part,data['listening'][part-1])
    return form

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--model-dir',type=Path,required=True)
    parser.add_argument('--cache-dir',type=Path,default=Path(tempfile.gettempdir())/'education-ielts-offline-tts-cache')
    parser.add_argument('--forms',nargs='+',type=int,default=list(range(7,13)))
    parser.add_argument('--parts',nargs='+',type=int,default=[1,2,3,4])
    parser.add_argument('--jobs',type=int,default=1,choices=[1,2,3],help='Independent local synthesis processes, two CPU threads each')
    args=parser.parse_args()
    assert set(args.forms)<=set(VOICES) and set(args.parts)<={1,2,3,4}
    assert len(args.forms)==len(set(args.forms))
    if args.jobs==1:
        generator=Generator(args.model_dir,args.cache_dir)
        for form in args.forms:
            data=json.loads((ROOT/f'mock-{form:02d}'/'mock.json').read_text(encoding='utf-8'))
            for part in args.parts:generator.part(form,part,data['listening'][part-1])
    else:
        with ProcessPoolExecutor(max_workers=args.jobs) as pool:
            futures=[pool.submit(generate_form,form,args.parts,args.model_dir,args.cache_dir) for form in args.forms]
            for future in as_completed(futures):print(f'Mock {future.result():02d}: all requested parts ready',flush=True)
    allParts=[];full=[]
    for form in range(7,13):
        parts=[]
        for part in range(1,5):
            meta=ROOT/f'mock-{form:02d}'/'audio'/f'part-{part}.json'
            if meta.exists():
                value=json.loads(meta.read_text(encoding='utf-8'))
                assert digest((ROOT/value['file']).read_bytes())==value['sha256']
                parts.append(value);allParts.append(value)
        if len(parts)==4:full.append(combine(form,parts))
    modelHashes={p.name:digest(p.read_bytes()) for p in [args.model_dir/'kokoro-v1.0.onnx',args.model_dir/'voices-v1.0.bin']}
    packages={p:importlib.metadata.version(p) for p in ('kokoro-onnx','onnxruntime','numpy')}
    manifest=dict(engine='Local Kokoro-82M ONNX, synthetic English stock voices',license='Apache-2.0 model; stock voices only',
                  settings=SETTINGS,modelSha256=modelHashes,packages=packages,
                  complete=len(allParts)==24 and len(full)==6,
                  parts=[{k:v for k,v in p.items() if k!='segments'} for p in allParts],fullTests=full)
    dump(ROOT/'audio-manifest.json',manifest)
    def clock(seconds):
        total=round(seconds);return f'{total//60}:{total%60:02d}'
    lines=['# Listening recordings — IELTS mocks 07–12',
           'Local synthetic English recordings, generated with Kokoro-82M stock British and American voices. Use the matching candidate paper. The complete track plays all four parts with previews and checking pauses already included.',
           '| Mock | Complete test | Part 1 | Part 2 | Part 3 | Part 4 |',
           '| --- | --- | --- | --- | --- | --- |']
    for test in full:
        cells=[f"{test['form']:02d}",f"[Play ({clock(test['seconds'])})]({test['file']})"]
        cells += [f"[Play ({clock(p['seconds'])})]({p['file']})" for p in test['parts']]
        lines.append('| '+' | '.join(cells)+' |')
    lines += ['', 'For a timed sitting, play one complete track continuously. For separate-part practice, use the individual files. Do not add extra pauses: each part begins with 60 seconds to read; Parts 1–3 include 30 seconds at the midpoint and 30 seconds to check; Part 4 is continuous and ends with two minutes for final checking.',
              '', 'The final stop-writing announcement follows the two-minute check. Track durations include all instructions and silences. Full tracks are concatenations of their four parts; timings and SHA-256 hashes are in [audio-manifest.json](audio-manifest.json). Per-part JSON records retain role/voice mapping, the exact source paragraphs, pronunciation expansions and segment times.',
              '', '## Regenerate locally', '', 'Use a Python environment with `kokoro-onnx`, `onnxruntime` and `numpy`, plus FFmpeg/FFprobe. Supply a local folder containing `kokoro-v1.0.onnx` and `voices-v1.0.bin`. No API key or network call is used by the generator.',
              '', '```powershell', 'python -B MockExmps/IELTS/_source/generate_audio.py --model-dir <local-model-folder> --jobs 3',
              'python -B MockExmps/IELTS/_source/validate_audio.py', 'python -B MockExmps/IELTS/_source/build.py', '```',
              '', 'The verified PCM cache stays in the system temporary directory. The generator reuses matching recordings and writes only this offline pack and that temporary cache. It does not update website media or catalogues.',
              '', 'These voices do not reproduce the full official accent range. Complete human listening/pronunciation review and learner calibration remain outstanding. A synthetic recording is practice material, not an official IELTS recording.']
    (ROOT/'AUDIO.md').write_text('\n\n'.join(lines[:2])+'\n\n'+'\n'.join(lines[2:])+'\n',encoding='utf-8',newline='\n')
    print(f'Finished: {len(allParts)} parts, {len(full)} complete tests',flush=True)

if __name__=='__main__':main()
