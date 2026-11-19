'use client';
import { useState, type ReactNode } from 'react';
import type { PublicStage } from '../types';
import { LockedListeningPlayer } from '../listening-section';
import { listeningPosition } from '../audio-files';
import { useQuestionShortcuts } from '../session-tools';
import { JapaneseText } from './text';
import player from '@/modules/listening-lab/listening.module.css';
import './jlpt.css';

type Props={stage:PublicStage;slug:string;attemptId:string;elapsed:number;answers:Record<string,string>;flags:string[];disabled:boolean;onChange:(id:string,value:string)=>void;onFlag:(id:string)=>void;version?:number;
 /** Sitting chrome drawn by the runner: mock title, section position, clock, save status and the stop button. */
 title:string;stageIndex:number;timeline:{title:string}[];instructions:string;clock:ReactNode;status:string;end:ReactNode};

/** Text length as printed, without authored readings （かな） or target brackets 【】. */
const printed=(text:string)=>text.replace(/（[ぁ-ゖァ-ヺー]+）/g,'').replace(/[【】]/g,'').length;

/**
 * The JLPT timed sitting (2026-11-19 "answer-sheet sidebar" layout): the question page on the left, and a sticky
 * column on the right with the clock, the three sections and a JLPT-style answer sheet (one row of numbered bubbles
 * per question, grouped by 問題) for seeing progress and jumping. On narrow screens the column becomes a top bar
 * whose answer sheet opens on demand.
 */
export function JlptSection({stage,slug,attemptId,elapsed,answers,flags,disabled,onChange,onFlag,version=1,title,stageIndex,timeline,instructions,clock,status,end}:Props){
 const listening=stage.kind==='listening';
 const pages:{ids:string[];groupId:string;passage?:string}[]=[];
 for(const group of stage.groups??[]){
  for(const q of stage.questions.filter(q=>q.groupId===group.id)){
   const prior=pages.at(-1);
   if(prior?.groupId===group.id&&(listening||Boolean(q.passage&&prior.passage===q.passage)))prior.ids.push(q.id);
   else pages.push({ids:[q.id],groupId:group.id,passage:q.passage});
  }
 }
 const position=listening?listeningPosition(slug,elapsed,version):null;
 const livePart=position&&!position.ended?position.part:null;
 const [selected,setSelected]=useState(0),[followed,setFollowed]=useState(livePart),[readings,setReadings]=useState(true),[sheetOpen,setSheetOpen]=useState(false);
 if(livePart!==followed){setFollowed(livePart);if(livePart)setSelected(livePart-1);}
 const page=pages[Math.min(selected,pages.length-1)];
 const groupIndex=Math.max(0,stage.groups?.findIndex(g=>g.id===page?.groupId)??0);
 const group=stage.groups?.[groupIndex];
 const questions=stage.questions.filter(q=>page?.ids.includes(q.id));
 const [focused,setFocused]=useState('');
 const active=questions.find(q=>q.id===focused)??questions[0];
 const answered=stage.questions.filter(q=>answers[q.id]?.trim()).length;
 const go=(at:number,target?:string)=>{
  if(at<0||at>=pages.length)return;
  setSelected(at);setSheetOpen(false);
  if(target)setFocused(target);
  requestAnimationFrame(()=>{
   const item=target&&pages[at].ids.length>1?document.getElementById('jlpt-q-'+target):null;
   if(item){item.scrollIntoView({block:'center'});item.focus({preventScroll:true});}
   else document.getElementById('jlpt-page-heading')?.focus();
  });
 };
 useQuestionShortcuts({onPrevious:()=>go(selected-1),onNext:()=>go(selected+1),onFlag:()=>{if(active)onFlag(active.id);},onOption:at=>{const value=active?.options?.[at];if(value&&!disabled)onChange(active.id,value);}});
 const furigana=<button type="button" className="jlpt-furigana" aria-pressed={readings} onClick={()=>setReadings(!readings)}>ふりがな {readings?'✓':'—'}</button>;
 return <div className="jlpt-sit">
  <section className="jlpt-sit-main jlpt-work" aria-label="JLPT даалгавар">
   <header className="jlpt-sit-head"><p className="eyebrow">{title} · {stageIndex+1}/{timeline.length} хэсэг</p><h1>{stage.title}</h1></header>
   {listening?<div className={`${player.root} ${player.mock}`}><LockedListeningPlayer attemptId={attemptId} slug={slug} elapsed={elapsed} version={version}/></div>:null}
   <div className="jlpt-group-head">
    <p className="eyebrow"><span lang="ja">問題{groupIndex+1}</span>{livePart===groupIndex+1?' · Тоглож байна':''}</p>
    <h2 id="jlpt-page-heading" tabIndex={-1}>{group?.title}</h2>
    {group?.instructions?<p><JapaneseText text={group.instructions} readings={readings}/></p>:null}
   </div>
   <div className={'jlpt-page'+(page?.passage?' has-passage':'')}>
    {page?.passage?<aside className="jlpt-passage" aria-label="Унших эх"><p className="eyebrow">読解 · ЭХ ТЕКСТ</p><JapaneseText text={page.passage} readings={readings}/></aside>:null}
    <div className="jlpt-items">{questions.map(q=>{
     // Two columns when the longest option fits in half the width, otherwise one per row (three-way choices: up to three).
     const longest=Math.max(1,...(q.options??[]).map((option,i)=>printed(listening&&option===String(i+1)?'音声の選択肢 '+option:option)));
     const layout={['--jlpt-min' as string]:`calc(${longest}em + 80px)`,['--jlpt-share' as string]:q.options?.length===3?'33.33%':'50%'};
     return <article className="jlpt-item" id={'jlpt-q-'+q.id} key={q.id} tabIndex={-1} onFocus={()=>setFocused(q.id)}>
      <header><strong>{q.number}</strong><button type="button" disabled={disabled} aria-pressed={flags.includes(q.id)} aria-label={q.number+' дараа харах'} onClick={()=>onFlag(q.id)}>{flags.includes(q.id)?'⚑ Тэмдэглэсэн':'⚐ Дараа харах'}</button></header>
      <p><JapaneseText text={q.prompt} readings={readings}/></p>
      <fieldset className="jlpt-options" style={layout} disabled={disabled}><legend className="sr-only">{q.number} хариулт</legend>{q.options?.map((option,i)=><label key={option} data-selected={answers[q.id]===option?'':undefined}><input type="radio" name={q.id} checked={answers[q.id]===option} onChange={()=>onChange(q.id,option)}/><span className="jlpt-option-number">{i+1}</span><JapaneseText text={option===String(i+1)&&listening?'音声の選択肢 '+option:option} readings={readings}/></label>)}</fieldset>
     </article>;
    })}</div>
   </div>
   <nav className="jlpt-next" aria-label="ページ移動"><button className="button secondary" type="button" disabled={selected===0} onClick={()=>go(selected-1)}>← Өмнөх</button><span>{selected+1} / {pages.length}</span><button className="button" type="button" disabled={selected===pages.length-1} onClick={()=>go(selected+1)}>Дараах →</button></nav>
  </section>
  <aside className="jlpt-sheet" aria-label="Хариултын хуудас">
   <div className="jlpt-sheet-top">
    {clock}
    <p className="jlpt-save" role="status">{status}</p>
    {furigana}
    <button type="button" className="jlpt-sheet-toggle" aria-expanded={sheetOpen} aria-controls="jlpt-sheet-body" onClick={()=>setSheetOpen(!sheetOpen)}><span className="jlpt-toggle-word">Хариу </span>{answered}/{stage.questions.length} {sheetOpen?'▴':'▾'}</button>
   </div>
   <div className="jlpt-sheet-body" id="jlpt-sheet-body" data-open={sheetOpen?'':undefined}>
    <ol className="jlpt-stages" aria-label="Хэсгүүд">{timeline.map((item,i)=><li key={item.title} data-state={i<stageIndex?'done':i===stageIndex?'current':undefined} aria-current={i===stageIndex?'step':undefined}><span>{i<stageIndex?'✓':i+1}</span>{item.title}</li>)}</ol>
    <p className="jlpt-sheet-label"><span lang="ja">解答用紙</span> · Хариултын хуудас</p>
    {stage.groups?.map((g,gi)=>{const qs=stage.questions.filter(q=>q.groupId===g.id);return <section className="jlpt-sheet-group" key={g.id}>
     <h3 title={g.title}><span lang="ja">問題{gi+1}</span> {g.title}{livePart===gi+1?' ▶':''}</h3>
     <div className="jlpt-sheet-rows">{qs.map(q=>{
      const pageAt=pages.findIndex(p=>p.ids.includes(q.id)),choice=q.options?.indexOf(answers[q.id]??'')??-1,flagged=flags.includes(q.id);
      return <button type="button" className="jlpt-sheet-row" key={q.id} aria-current={pageAt===selected?'true':undefined} data-answered={choice>=0?'':undefined} data-flagged={flagged?'':undefined} aria-label={q.number+(choice>=0?', хариулт '+(choice+1):', хариулаагүй')+(flagged?', тэмдэгтэй':'')} onClick={()=>go(pageAt,q.id)}>
       <span className="jlpt-sheet-number">{q.number}</span>
       <span className="jlpt-bubbles" aria-hidden="true">{q.options?.map((option,i)=><i key={option} data-on={i===choice?'':undefined}>{i+1}</i>)}</span>
       {flagged?<span className="jlpt-sheet-flag" aria-hidden="true">⚑</span>:null}
      </button>;
     })}</div>
    </section>;})}
    <p className="jlpt-sheet-count">{answered} / {stage.questions.length} хариулсан</p>
    <details className="jlpt-directions"><summary>Заавар</summary><p>{instructions}</p></details>
    <div className="jlpt-sheet-end">{end}</div>
   </div>
  </aside>
 </div>;
}
