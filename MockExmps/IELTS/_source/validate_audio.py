"""Validate offline recordings, script coverage, pauses, hashes and complete decoding."""
import hashlib
import json
import subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]

def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()

def probe(path):
    result=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(path)],text=True))
    stream=result['streams'][0]
    assert stream['codec_name']=='mp3' and stream['sample_rate']=='24000' and stream['channels']==1
    decoded=subprocess.run(['ffmpeg','-v','error','-i',str(path),'-f','null','-'],check=True,capture_output=True)
    assert not decoded.stderr.strip(),(path.name,'decoder reported errors')
    return float(result['format']['duration'])

def main():
    manifest=json.loads((ROOT/'audio-manifest.json').read_text(encoding='utf-8'))
    assert manifest['complete'] and len(manifest['parts'])==24 and len(manifest['fullTests'])==6
    results=[]
    for form in range(7,13):
        mock=json.loads((ROOT/f'mock-{form:02d}'/'mock.json').read_text(encoding='utf-8'))
        parts=[]
        for number in range(1,5):
            path=ROOT/f'mock-{form:02d}'/'audio'/f'part-{number}.json'
            meta=json.loads(path.read_text(encoding='utf-8'))
            audio=ROOT/meta['file']
            assert meta['sha256']==sha(audio)
            assert meta['sourceScriptSha256']==hashlib.sha256(mock['listening'][number-1]['script'].encode()).hexdigest()
            seconds=probe(audio)
            assert abs(seconds-meta['seconds'])<.01 and abs(seconds-meta['pcmSeconds'])<.2
            segments=meta['segments'];cursor=0
            for entry in segments:
                assert abs(entry['start']-cursor)<.002
                assert entry['seconds']>0
                cursor+=entry['seconds']
            assert abs(cursor-meta['pcmSeconds'])<.02
            pauses=[s for s in segments if s['kind']=='pause']
            preview=[s for s in pauses if s.get('purpose')=='preview']
            midpoint=[s for s in pauses if s.get('purpose')=='midpoint']
            checking=[s for s in pauses if s.get('purpose')=='checking']
            assert len(preview)==1 and preview[0]['seconds']==60
            assert len(midpoint)==(1 if number<4 else 0)
            assert all(s['seconds']==30 for s in midpoint)
            assert len(checking)==1 and checking[0]['seconds']==(30 if number<4 else 120)
            speech=[s for s in segments if s['kind']=='speech']
            # Remove only known role labels and the silent midpoint marker, then compare every paragraph/turn.
            source=[];role=None
            for line in mock['listening'][number-1]['script'].splitlines():
                line=line.strip()
                if not line or line=='---':continue
                for candidate in meta['roles']:
                    prefix=candidate+': '
                    if line.startswith(prefix):role=candidate;line=line[len(prefix):];break
                source.append((role,line))
            assert source==[(s['role'],s['sourceText']) for s in speech],(form,number,'script coverage')
            assert all(s['voice']==meta['roles'][s['role']] for s in speech)
            if midpoint:
                # Every first-half source turn precedes the recorded midpoint pause.
                first=mock['listening'][number-1]['script'].split('\n---\n')[0]
                firstLines=len([line for line in first.splitlines() if line.strip()])
                assert speech[firstLines-1]['start']<midpoint[0]['start']<speech[firstLines]['start']
            assert 250<seconds<700,(form,number,seconds)
            parts.append(dict(part=number,seconds=seconds,sha256=meta['sha256'],speechSegments=len(speech)))
        full=next(t for t in manifest['fullTests'] if t['form']==form)
        assert full['sha256']==sha(ROOT/full['file'])
        seconds=probe(ROOT/full['file'])
        assert abs(seconds-sum(p['seconds'] for p in parts))<.5
        assert abs(seconds-full['seconds'])<.01
        results.append(dict(form=form,parts=parts,fullSeconds=seconds,fullFile=full['file']))
    report=dict(status='passed',filesDecoded=30,parts=24,completeTests=6,forms=results,
                checks=['MP3 codec, 24 kHz mono','full FFmpeg decode of all 30 files','SHA-256 file hashes',
                        'exact source script coverage and role-to-voice mapping','contiguous timing records',
                        '60-second previews; 30-second midpoint/checking; 120-second final check',
                        'no Part 4 midpoint interruption','combined-track durations match four parts'],
                limits='Machine checks do not replace full human listening/pronunciation review or learner calibration.')
    (ROOT/'audio-validation.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8',newline='\n')
    print('PASS: 24 parts and six full tests; all 30 MP3s decode, hashes/scripts/timing agree.')

if __name__=='__main__':main()
