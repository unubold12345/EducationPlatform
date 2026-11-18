'use client';
import { useState } from 'react';
import type { PublicStage } from '../types';
import { LockedListeningPlayer } from '../listening-section';
import { listeningPosition, topikPlayingItem } from '../audio-files';
import { useQuestionShortcuts } from '../session-tools';
import { TopikGroupHead, TopikQuestion, TopikWriting } from './view';
import player from '@/modules/listening-lab/listening.module.css';
import './topik.css';

type Props={stage:PublicStage;slug:string;attemptId:string;elapsed:number;answers:Record<string,string>;flags:string[];disabled:boolean;onChange:(id:string,value:string)=>void;onFlag:(id:string)=>void};

/**
 * One TOPIK section in a timed sitting: a page per printed block ([1～4], [25～26] …) and the answer sheet (답안지)
 * beside it. In Listening the page follows the recording; the student can still look back within the section.
 */
export function TopikSection({stage,slug,attemptId,elapsed,answers,flags,disabled,onChange,onFlag}:Props){
 const listening=stage.kind==='listening',writing=stage.kind==='writing';
 const groups=stage.groups??[];
 const position=listening?listeningPosition(slug,elapsed):null;
 const liveItem=position&&!position.ended?topikPlayingItem(slug,position.part,position.offset):undefined;
 const liveGroup=liveItem?stage.questions.find(q=>q.id===liveItem)?.groupId:undefined;
 const live=liveGroup?groups.findIndex(g=>g.id===liveGroup):-1;
 const [selected,setSelected]=useState(Math.max(0,live)),[followed,setFollowed]=useState(live),[focused,setFocused]=useState('');
 if(live!==followed){setFollowed(live);if(live>=0)setSelected(live);}
 const at=Math.min(selected,groups.length-1),group=groups[at];
 const questions=stage.questions.filter(q=>q.groupId===group?.id);
 const active=questions.find(q=>q.id===focused)??questions.find(q=>!answers[q.id])??questions[0];
 const go=(index:number,focus?:string)=>{if(index>=0&&index<groups.length){setSelected(index);requestAnimationFrame(()=>document.getElementById(focus?'topik-q-'+focus:'topik-page-heading')?.focus());}};
 useQuestionShortcuts(writing?{onPrevious:()=>go(at-1),onNext:()=>go(at+1)}:{onPrevious:()=>go(at-1),onNext:()=>go(at+1),onFlag:()=>{if(active&&!disabled)onFlag(active.id);},
  onOption:index=>{const value=active?.options?.[index];if(value&&!disabled)onChange(active.id,value);}});
 const note=(group?.instructions??'').split('\n').slice(1).join(' ');
 const answered=stage.questions.filter(q=>answers[q.id]?.trim()).length;
 return <section className="topik-work" aria-label={stage.title}>
  {listening?<div className={`${player.root} ${player.mock}`}><LockedListeningPlayer attemptId={attemptId} slug={slug} elapsed={elapsed}/></div>:null}
  <div className="topik-layout">
   <div className="topik-page">
    <h2 id="topik-page-heading" tabIndex={-1} className="topik-page-title">{group?.title}<span>{at+1}/{groups.length}{live===at?' · Тоглож байна':''}</span></h2>
    {group?.topik?<TopikGroupHead group={group.topik} note={note}/>:null}
    {questions.map(q=><article id={'topik-q-'+q.id} tabIndex={-1} className="topik-item" key={q.id} onFocus={()=>setFocused(q.id)} data-answered={answers[q.id]?.trim()?'':undefined}>
     <header><strong>{q.number}.</strong>{q.points?<small>{q.points} оноо</small>:null}<button type="button" disabled={disabled} aria-pressed={flags.includes(q.id)} aria-label={q.number+' дараа харах'} onClick={()=>onFlag(q.id)}>{flags.includes(q.id)?'⚑ Тэмдэглэсэн':'⚐ Дараа харах'}</button></header>
     {writing?<TopikWriting question={q} value={answers[q.id]} disabled={disabled} onChange={value=>onChange(q.id,value)}/>
      :<TopikQuestion question={q} value={answers[q.id]} disabled={disabled} onChange={value=>onChange(q.id,value)}/>}
    </article>)}
    <nav className="topik-next" aria-label="Блок шилжих"><button className="button secondary" type="button" disabled={at===0} onClick={()=>go(at-1)}>← Өмнөх</button><button className="button" type="button" disabled={at===groups.length-1} onClick={()=>go(at+1)}>Дараах →</button></nav>
   </div>
   <aside className="topik-sheet" aria-label="Хариултын хуудас (답안지)">
    <p><strong lang="ko">답안지</strong> · {answered}/{stage.questions.length}</p>
    <ol>{stage.questions.map(q=>{const index=groups.findIndex(g=>g.id===q.groupId);const value=answers[q.id]?.trim();return <li key={q.id}>
     <button type="button" aria-current={index===at?'true':undefined} data-answered={value?'':undefined} data-flagged={flags.includes(q.id)?'':undefined} data-live={q.id===liveItem?'':undefined} onClick={()=>go(index,q.id)} aria-label={`${q.number}${value?', хариулсан':''}${flags.includes(q.id)?', тэмдэгтэй':''}`}>
      <span>{q.number}</span><b aria-hidden="true">{writing?(value?'✓':''):value??''}</b></button></li>;})}</ol>
    <p className="topik-sheet-key"><span data-answered=""/>хариулсан <span data-flagged=""/>тэмдэгтэй</p>
   </aside>
  </div>
 </section>;
}
