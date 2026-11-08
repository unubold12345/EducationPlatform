"""Generate original Japanese JLPT audio locally (no API key or provider).

Python 3.12 environment: kokoro-onnx==0.6.1, misaki[ja]==0.7.4, soundfile.
Use Kokoro v1.0 model/voices from thewh1teagle/kokoro-onnx model-files-v1.0
(original hexgrad/Kokoro-82M, Apache-2.0). ffmpeg/ffprobe must be on PATH.
Usage: python scripts/generate-jlpt-audio.py <model-dir>
Reuses cached utterances in the system temp folder; only deliverable tracks,
provenance and answer-free timing metadata are written inside the repository.
"""
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import unicodedata

import numpy as np
import onnxruntime as ort
from kokoro_onnx import Kokoro
from misaki import ja

ROOT=Path(__file__).resolve().parents[1]
ASSETS=ROOT/'assets'/'exams'
CACHE=Path(tempfile.gettempdir())/'codex-jlpt-utterances-v1'
CACHE.mkdir(exist_ok=True)
RATE=24000
VOICES={'narrator':'jf_alpha','woman':'jf_tebukuro','man':'jm_kumo'}
SPEED={'N5':0.9,'N4':1.0}

def speech_text(text):
    text=re.sub(r'[\u3400-\u9fff]+（([ぁ-ゖァ-ヺー]+)）',r'\1',text)
    return unicodedata.normalize('NFKC',text).replace('・','、')

def silence(seconds):
    return np.zeros(int(seconds*RATE),np.float32)

def main():
    model=Path(sys.argv[1])
    options=ort.SessionOptions()
    options.intra_op_num_threads=4
    options.inter_op_num_threads=1
    session=ort.InferenceSession(str(model/'kokoro-v1.0.onnx'),sess_options=options,providers=['CPUExecutionProvider'])
    kokoro=Kokoro.from_session(session,str(model/'voices-v1.0.bin'))
    g2p=ja.JAG2P()
    def say(text,voice,level):
        text=speech_text(text)
        digest=hashlib.sha256(json.dumps([text,voice,SPEED[level]],ensure_ascii=False).encode()).hexdigest()
        path=CACHE/(digest+'.npy')
        if path.exists():
            return np.load(path)
        converted=g2p(text)
        phonemes=converted if isinstance(converted,str) else converted[0]
        assert phonemes.strip(),repr(text)
        samples,rate=kokoro.create(phonemes,voice=VOICES[voice],speed=SPEED[level],is_phonemes=True)
        assert rate==RATE and samples.size>0
        samples=samples.astype(np.float32)
        np.save(path,samples)
        return samples
    def dialogue(text,level):
        chunks=[]
        for line in text.splitlines():
            pieces=re.split(r'(ナレーター|男|女)：',line)
            if pieces[0].strip(): chunks.extend([say(pieces[0],'narrator',level),silence(.6)])
            for i in range(1,len(pieces),2):
                voice={'男':'man','女':'woman','ナレーター':'narrator'}[pieces[i]]
                chunks.extend([say(pieces[i+1],voice,level),silence(.55)])
        return chunks
    timing={}
    for level in ['N5','N4']:
        for number in [1,2,3]:
            folder=ROOT/'MockExmps'/'JLPT'/level/f'mock-{number:02}'
            source=json.loads((folder/'mock.json').read_text(encoding='utf-8'))
            slug=source['id']
            parts=[]
            for group in source['sections'][2]['groups']:
                part=group['number']
                chunks=[say(f'問題{part}。'+group['instructions'],'narrator',level),silence(4)]
                starts={}
                def length(): return sum(len(chunk) for chunk in chunks)/RATE
                for q in group['questions']:
                    start=length()
                    chunks.extend([say(f"{q['number']}番。",'narrator',level),silence(1)])
                    if group['type']=='key-points':
                        chunks.extend([say(q['prompt'],'narrator',level),silence(8)])
                        chunks.extend(dialogue(q['script'],level))
                        chunks.extend([say(q['prompt'],'narrator',level)])
                    elif group['type']=='task-comprehension':
                        chunks.append(silence(8))
                        chunks.extend(dialogue(q['script'],level))
                        chunks.append(say(q['prompt'],'narrator',level))
                    else:
                        chunks.extend(dialogue(q['examinerReadout'],level))
                    end=length()
                    chunks.append(silence(12 if part<=2 else 8 if part==3 else 6))
                    starts[q['id']]={'start':round(start,3),'end':round(end,3)}
                    print(f'{slug} part {part} item {q["number"]} synthesized',flush=True)
                chunks.extend([say(f'問題{part}は、これで終わりです。','narrator',level),silence(8)])
                samples=np.concatenate(chunks)
                peak=max(float(np.max(np.abs(samples))),.001)
                pcm=(np.clip(samples/peak*.89,-1,1)*32767).astype('<i2').tobytes()
                filename=f'{slug}-part-{part}.mp3'
                subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','s16le','-ar',str(RATE),'-ac','1','-i','-','-b:a','64k',str(ASSETS/filename)],input=pcm,check=True)
                seconds=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(ASSETS/filename)],text=True))
                body=(ASSETS/filename).read_bytes()
                script_hash=hashlib.sha256(json.dumps(group,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
                parts.append({'part':part,'file':filename,'seconds':round(seconds,3),'sha256':hashlib.sha256(body).hexdigest(),'scriptSha256':script_hash,'questions':starts})
                print(f'FINISHED {filename}: {seconds:.1f}s',flush=True)
            assert sum(p['seconds'] for p in parts)<(1800 if level=='N5' else 2100),slug
            manifest={'slug':slug,'source':'Original synthetic Japanese practice audio; Kokoro-82M v1.0, Apache-2.0','modelUrl':'https://huggingface.co/hexgrad/Kokoro-82M','voices':VOICES,'speed':SPEED[level],'parts':parts,'humanListeningReview':False}
            (ROOT/'assets'/'jlpt'/(slug+'-audio.json')).write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
            timing[slug]={'seconds':[p['seconds'] for p in parts],'questions':{key:dict(value,part=p['part']) for p in parts for key,value in p['questions'].items()}}
            (ROOT/'src'/'modules'/'exams'/'jlpt'/'audio-catalog.json').write_text(json.dumps(timing,indent=2)+'\n',encoding='utf-8')

if __name__=='__main__': main()
