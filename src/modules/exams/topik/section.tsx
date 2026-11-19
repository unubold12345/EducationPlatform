'use client';
import { useState } from 'react';
import type { PublicStage } from '../types';
import { LockedListeningPlayer } from '../listening-section';
import { listeningPosition, topikPlayingItem } from '../audio-files';
import { useQuestionShortcuts } from '../session-tools';
import { SheetSitting, type SheetChrome } from '../sheet';
import { TopikGroupHead, TopikQuestion, TopikWriting } from './view';
import player from '@/modules/listening-lab/listening.module.css';
import './topik.css';

type Props={stage:PublicStage;slug:string;attemptId:string;elapsed:number;answers:Record<string,string>;flags:string[];disabled:boolean;onChange:(id:string,value:string)=>void;onFlag:(id:string)=>void;chrome:SheetChrome};

/**
 * One TOPIK section in a timed sitting: a page per printed block ([1～4], [25～26] …) in the shared answer-sheet
 * layout, whose sheet is the 답안지. In Listening the page follows the recording; the student can still look back within the section.
 */
export function TopikSection({stage,slug,attemptId,elapsed,answers,flags,disabled,onChange,onFlag,chrome}:Props){
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
 const go=(index:number,focus?:string)=>{if(index>=0&&index<groups.length){setSelected(index);requestAnimationFrame(()=>{const item=focus?document.getElementById('topik-q-'+focus):null;if(item){item.scrollIntoView({block:'center'});item.focus({preventScroll:true});}else document.getElementById('topik-page-heading')?.focus();});}};
 useQuestionShortcuts(writing?{onPrevious:()=>go(at-1),onNext:()=>go(at+1)}:{onPrevious:()=>go(at-1),onNext:()=>go(at+1),onFlag:()=>{if(active&&!disabled)onFlag(active.id);},
  onOption:index=>{const value=active?.options?.[index];if(value&&!disabled)onChange(active.id,value);}});
 const note=(group?.instructions??'').split('\n').slice(1).join(' ');
 const sheet=[{id:stage.id,title:stage.title,items:stage.questions.map(q=>({id:q.id,label:q.number??'',state:answers[q.id]?.trim()?'answered' as const:undefined,flagged:flags.includes(q.id)}))}];
 return <SheetSitting chrome={chrome} heading={stage.title} groups={sheet} current={active?.id} label={<><span lang="ko">답안지</span> · хариултын хуудас</>}
  onJump={id=>go(groups.findIndex(g=>g.id===stage.questions.find(q=>q.id===id)?.groupId),id)}>
  <section className="topik-work" aria-label={stage.title}>
  {listening?<div className={`${player.root} ${player.mock}`}><LockedListeningPlayer attemptId={attemptId} slug={slug} elapsed={elapsed}/></div>:null}
  <div className="topik-page">
   <h2 id="topik-page-heading" tabIndex={-1} className="topik-page-title">{group?.title}<span>{at+1}/{groups.length}{live===at?' · Тоглож байна':''}</span></h2>
   {group?.topik?<TopikGroupHead group={group.topik} note={note}/>:null}
   {questions.map(q=><article id={'topik-q-'+q.id} tabIndex={-1} className="topik-item" key={q.id} onFocus={()=>setFocused(q.id)} data-answered={answers[q.id]?.trim()?'':undefined}>
    <header><strong>{q.number}.</strong>{q.points?<small>{q.points} оноо</small>:null}<button type="button" disabled={disabled} aria-pressed={flags.includes(q.id)} aria-label={q.number+' дараа харах'} onClick={()=>onFlag(q.id)}>{flags.includes(q.id)?'⚑ Тэмдэглэсэн':'⚐ Дараа харах'}</button></header>
    {writing?<TopikWriting question={q} value={answers[q.id]} disabled={disabled} onChange={value=>onChange(q.id,value)}/>
     :<TopikQuestion question={q} value={answers[q.id]} disabled={disabled} onChange={value=>onChange(q.id,value)}/>}
   </article>)}
   <nav className="topik-next" aria-label="Блок шилжих"><button className="button secondary" type="button" disabled={at===0} onClick={()=>go(at-1)}>← Өмнөх</button><span>{at+1} / {groups.length}</span><button className="button" type="button" disabled={at===groups.length-1} onClick={()=>go(at+1)}>Дараах →</button></nav>
  </div>
  </section>
 </SheetSitting>;
}
