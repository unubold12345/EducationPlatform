'use client';
import { useState } from 'react';
import type { PublicStage } from '../types';
import { LockedListeningPlayer } from '../listening-section';
import { hskPlayingItem, listeningPosition } from '../audio-files';
import { useQuestionShortcuts } from '../session-tools';
import { SheetSitting, type SheetChrome } from '../sheet';
import { HskMaterial, HskQuestion, hskPart } from './view';
import player from '@/modules/listening-lab/listening.module.css';
import './hsk.css';

type Props={stage:PublicStage;slug:string;attemptId:string;elapsed:number;answers:Record<string,string>;flags:string[];disabled:boolean;onChange:(id:string,value:string)=>void;onFlag:(id:string)=>void;chrome:SheetChrome};

/**
 * One HSK section in a timed sitting: a page per part (or per set of a part), as on the paper, in the answer-sheet
 * layout (clock, parts and numbered answers on the right). Listening follows the item now playing.
 */
export function HskSection({stage,slug,attemptId,elapsed,answers,flags,disabled,onChange,onFlag,chrome}:Props){
 const listening=stage.kind==='listening';
 const groups=stage.groups??[];
 const position=listening?listeningPosition(slug,elapsed):null;
 // The page that holds the item being read; a part with two picture sets (HSK 2) turns between them.
 const liveItem=position&&!position.ended?hskPlayingItem(slug,position.part,position.offset):undefined;
 const liveGroup=liveItem?stage.questions.find(q=>q.id===liveItem)?.groupId:undefined;
 const found=liveGroup?groups.findIndex(g=>g.id===liveGroup):-1;
 const livePart=position&&!position.ended?(found>=0?found+1:position.part):null;
 const [selected,setSelected]=useState(livePart?livePart-1:0),[followed,setFollowed]=useState(livePart),[readings,setReadings]=useState(true),[focused,setFocused]=useState('');
 // The page turns with the recording; the student can still look back at an earlier part of this section.
 if(livePart!==followed){setFollowed(livePart);if(livePart)setSelected(livePart-1);}
 const group=groups[Math.min(selected,groups.length-1)];
 const part=hskPart(group?.id,group?.hsk);
 const questions=stage.questions.filter(q=>q.groupId===group?.id);
 const active=questions.find(q=>q.id===focused)??questions.find(q=>!answers[q.id])??questions[0];
 const go=(at:number,target?:string)=>{if(at>=0&&at<groups.length){setSelected(at);requestAnimationFrame(()=>{const item=target?document.getElementById('hsk-q-'+target):null;if(item){item.scrollIntoView({block:'center'});item.focus({preventScroll:true});}else document.getElementById('hsk-page-heading')?.focus();});}};
 useQuestionShortcuts({onPrevious:()=>go(selected-1),onNext:()=>go(selected+1),onFlag:()=>{if(active&&!disabled)onFlag(active.id);},
  onOption:at=>{const value=active?.options?.[at];if(value&&!disabled)onChange(active.id,value);}});
 const [task,...note]=(group?.instructions??'').split('\n');
 const sheet=groups.map((g,i)=>({id:g.id,title:g.title+(livePart===i+1?' ▶':''),items:stage.questions.filter(q=>q.groupId===g.id).map(q=>({id:q.id,label:q.number??'',state:answers[q.id]?'answered' as const:undefined,flagged:flags.includes(q.id)}))}));
 const pinyin=<button type="button" aria-pressed={readings} onClick={()=>setReadings(!readings)}>Pinyin {readings?'✓':'—'}</button>;
 return <SheetSitting chrome={chrome} heading={stage.title} groups={sheet} current={active?.id} toggles={pinyin} onJump={id=>go(groups.findIndex(g=>g.id===stage.questions.find(q=>q.id===id)?.groupId),id)}>
  <section className="hsk-work" aria-label={listening?'HSK сонсох':'HSK унших'}>
  {listening?<div className={`${player.root} ${player.mock}`}><LockedListeningPlayer attemptId={attemptId} slug={slug} elapsed={elapsed}/></div>:null}
  <p className="eyebrow hsk-page-count">{selected+1}/{groups.length} хэсэг{livePart===selected+1?' · Тоглож байна':''}</p>
  <h2 id="hsk-page-heading" tabIndex={-1}>{group?.title}</h2>
  {task?<p className="hsk-task"><span lang="zh-CN">{task}</span>{note.length?<span>{note.join(' ')}</span>:null}</p>:null}
  <HskMaterial group={group?.hsk} readings={readings}/>
  <div className={'hsk-items hsk-items-'+(part??'')}>{part?questions.map(q=><article className="hsk-item" id={'hsk-q-'+q.id} tabIndex={-1} key={q.id} onFocus={()=>setFocused(q.id)} data-answered={answers[q.id]?'':undefined}>
   <header><strong>{q.number}</strong><button type="button" disabled={disabled} aria-pressed={flags.includes(q.id)} aria-label={q.number+' дараа харах'} onClick={()=>onFlag(q.id)}>{flags.includes(q.id)?'⚑ Тэмдэглэсэн':'⚐ Дараа харах'}</button></header>
   <HskQuestion question={q} part={part} value={answers[q.id]} disabled={disabled} readings={readings} onChange={value=>onChange(q.id,value)}/>
  </article>):null}</div>
  <nav className="hsk-next" aria-label="Хэсэг шилжих"><button className="button secondary" type="button" disabled={selected===0} onClick={()=>go(selected-1)}>← Өмнөх хэсэг</button><span>{selected+1} / {groups.length}</span><button className="button" type="button" disabled={selected===groups.length-1} onClick={()=>go(selected+1)}>Дараах хэсэг →</button></nav>
  </section>
 </SheetSitting>;
}
