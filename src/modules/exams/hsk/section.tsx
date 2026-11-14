'use client';
import { useState } from 'react';
import type { PublicStage } from '../types';
import { LockedListeningPlayer } from '../listening-section';
import { listeningPosition } from '../audio-files';
import { useQuestionShortcuts } from '../session-tools';
import { HskMaterial, HskQuestion, hskPart } from './view';
import player from '@/modules/listening-lab/listening.module.css';
import './hsk.css';

type Props={stage:PublicStage;slug:string;attemptId:string;elapsed:number;answers:Record<string,string>;flags:string[];disabled:boolean;onChange:(id:string,value:string)=>void;onFlag:(id:string)=>void};

/** One HSK 1 section in a timed sitting: a page per part, as on the paper. Listening follows the part now playing. */
export function HskSection({stage,slug,attemptId,elapsed,answers,flags,disabled,onChange,onFlag}:Props){
 const listening=stage.kind==='listening';
 const groups=stage.groups??[];
 const position=listening?listeningPosition(slug,elapsed):null;
 const livePart=position&&!position.ended?position.part:null;
 const [selected,setSelected]=useState(livePart?livePart-1:0),[followed,setFollowed]=useState(livePart),[readings,setReadings]=useState(true),[focused,setFocused]=useState('');
 // The page turns with the recording; the student can still look back at an earlier part of this section.
 if(livePart!==followed){setFollowed(livePart);if(livePart)setSelected(livePart-1);}
 const group=groups[Math.min(selected,groups.length-1)];
 const part=hskPart(group?.id);
 const questions=stage.questions.filter(q=>q.groupId===group?.id);
 const active=questions.find(q=>q.id===focused)??questions.find(q=>!answers[q.id])??questions[0];
 const go=(at:number)=>{if(at>=0&&at<groups.length){setSelected(at);requestAnimationFrame(()=>document.getElementById('hsk-page-heading')?.focus());}};
 useQuestionShortcuts({onPrevious:()=>go(selected-1),onNext:()=>go(selected+1),onFlag:()=>{if(active&&!disabled)onFlag(active.id);},
  onOption:at=>{const value=active?.options?.[at];if(value&&!disabled)onChange(active.id,value);}});
 const [task,...note]=(group?.instructions??'').split('\n');
 return <section className="hsk-work" aria-label={listening?'HSK сонсох':'HSK унших'}>
  {listening?<div className={`${player.root} ${player.mock}`}><LockedListeningPlayer attemptId={attemptId} slug={slug} elapsed={elapsed}/></div>:null}
  <nav className="hsk-parts" aria-label="Хэсгүүд">{groups.map((g,i)=>{const qs=stage.questions.filter(q=>q.groupId===g.id);return <button key={g.id} type="button" aria-current={i===selected?'true':undefined} onClick={()=>go(i)}>
   <strong>{g.title}</strong><small>{qs[0]?.number}–{qs.at(-1)?.number} · {qs.filter(q=>answers[q.id]).length}/{qs.length}{livePart===i+1?' · Тоглож байна':''}{qs.some(q=>flags.includes(q.id))?' · ⚑':''}</small></button>;})}</nav>
  <div className="hsk-controls"><button type="button" aria-pressed={readings} onClick={()=>setReadings(!readings)}>Pinyin {readings?'✓':'—'}</button><span>{selected+1}/{groups.length} хэсэг</span></div>
  <h2 id="hsk-page-heading" tabIndex={-1}>{group?.title}</h2>
  {task?<p className="hsk-task"><span lang="zh-CN">{task}</span>{note.length?<span>{note.join(' ')}</span>:null}</p>:null}
  <HskMaterial group={group?.hsk} readings={readings}/>
  <div className={'hsk-items hsk-items-'+(part??'')}>{part?questions.map(q=><article className="hsk-item" key={q.id} onFocus={()=>setFocused(q.id)} data-answered={answers[q.id]?'':undefined}>
   <header><strong>{q.number}</strong><button type="button" disabled={disabled} aria-pressed={flags.includes(q.id)} aria-label={q.number+' дараа харах'} onClick={()=>onFlag(q.id)}>{flags.includes(q.id)?'⚑ Тэмдэглэсэн':'⚐ Дараа харах'}</button></header>
   <HskQuestion question={q} part={part} value={answers[q.id]} disabled={disabled} readings={readings} onChange={value=>onChange(q.id,value)}/>
  </article>):null}</div>
  <nav className="hsk-next" aria-label="Хэсэг шилжих"><button className="button secondary" type="button" disabled={selected===0} onClick={()=>go(selected-1)}>← Өмнөх хэсэг</button><span/><button className="button" type="button" disabled={selected===groups.length-1} onClick={()=>go(selected+1)}>Дараах хэсэг →</button></nav>
 </section>;
}
