'use client';
import { useState } from 'react';
import type { PublicStage } from '../types';
import { LockedListeningPlayer } from '../listening-section';
import { listeningPosition } from '../audio-files';
import { useQuestionShortcuts } from '../session-tools';
import { JapaneseText } from './text';
import './jlpt.css';

type Props={stage:PublicStage;slug:string;attemptId:string;elapsed:number;answers:Record<string,string>;flags:string[];disabled:boolean;onChange:(id:string,value:string)=>void;onFlag:(id:string)=>void};
export function JlptSection({stage,slug,attemptId,elapsed,answers,flags,disabled,onChange,onFlag}:Props){
 const listening=stage.kind==='listening';
 const pages:{ids:string[];groupId:string;passage?:string}[]=[];
 for(const group of stage.groups??[]){
  for(const q of stage.questions.filter(q=>q.groupId===group.id)){
   const prior=pages.at(-1);
   if(prior?.groupId===group.id&&(listening||Boolean(q.passage&&prior.passage===q.passage)))prior.ids.push(q.id);
   else pages.push({ids:[q.id],groupId:group.id,passage:q.passage});
  }
 }
 const position=listening?listeningPosition(slug,elapsed):null;
 const livePart=position&&!position.ended?position.part:null;
 const [selected,setSelected]=useState(0),[followed,setFollowed]=useState(livePart),[readings,setReadings]=useState(true),[onlyOpen,setOnlyOpen]=useState(false);
 if(livePart!==followed){setFollowed(livePart);if(livePart)setSelected(livePart-1);}
 const page=pages[Math.min(selected,pages.length-1)];
 const group=stage.groups?.find(g=>g.id===page?.groupId);
 const questions=stage.questions.filter(q=>page?.ids.includes(q.id));
 const [focused,setFocused]=useState('');
 const active=questions.find(q=>q.id===focused)??questions[0];
 const go=(at:number)=>{if(at>=0&&at<pages.length){setSelected(at);setOnlyOpen(false);requestAnimationFrame(()=>document.getElementById('jlpt-page-heading')?.focus());}};
 useQuestionShortcuts({onPrevious:()=>go(selected-1),onNext:()=>go(selected+1),onFlag:()=>{if(active)onFlag(active.id);},onOption:at=>{const value=active?.options?.[at];if(value&&!disabled)onChange(active.id,value);}});
 const openPages=pages.map((p,i)=>({p,i})).filter(({p})=>!onlyOpen||p.ids.some(id=>!answers[id]?.trim()||flags.includes(id)));
 return <section className="jlpt-work" aria-label="JLPT даалгавар">
  {listening?<><LockedListeningPlayer attemptId={attemptId} slug={slug} elapsed={elapsed}/><p className="jlpt-note">Япон хиймэл дуу хоолой · Нэг удаа тоглоно · Дуу гарахгүй бол холбох товчийг дарна уу.</p></>:null}
  <nav className="jlpt-skills" aria-label="Даалгаврын төрөл">{stage.groups?.map((g,i)=>{const qs=stage.questions.filter(q=>q.groupId===g.id);return <button key={g.id} type="button" aria-current={g.id===group?.id?'true':undefined} onClick={()=>go(pages.findIndex(p=>p.groupId===g.id))}><strong>{listening?`${i+1}. `:''}{g.title}</strong><small>{qs.filter(q=>answers[q.id]?.trim()).length}/{qs.length}{livePart===i+1?' · Тоглож байна':''}</small></button>;})}</nav>
  <div className="jlpt-controls"><button type="button" aria-pressed={readings} onClick={()=>setReadings(!readings)}>ふりがな {readings?'✓':'—'}</button><button type="button" aria-pressed={onlyOpen} onClick={()=>setOnlyOpen(!onlyOpen)}>Хоосон / тэмдэгтэй</button><span>{selected+1}/{pages.length} хуудас</span></div>
  <nav className="jlpt-page-strip" aria-label="Асуулт сонгох">{openPages.map(({p,i})=><button type="button" key={p.ids[0]} aria-current={i===selected?'true':undefined} data-answered={p.ids.every(id=>answers[id]?.trim())?'':undefined} onClick={()=>go(i)}>{stage.questions.find(q=>q.id===p.ids[0])?.number}{p.ids.length>1?`–${stage.questions.find(q=>q.id===p.ids.at(-1))?.number}`:''}{p.ids.some(id=>flags.includes(id))?' ⚑':''}</button>)}</nav>
  <h2 id="jlpt-page-heading" tabIndex={-1}>{group?.title}</h2>
  {group?.instructions?<p><JapaneseText text={group.instructions} readings={readings}/></p>:null}
  <div className={'jlpt-page'+(page?.passage?' has-passage':'')}>
   {page?.passage?<aside className="jlpt-passage" aria-label="Унших эх"><p className="eyebrow">読解 · ЭХ ТЕКСТ</p><JapaneseText text={page.passage} readings={readings}/></aside>:null}
   <div className="jlpt-items">{questions.map(q=><article className="jlpt-item" key={q.id} tabIndex={-1} onFocus={()=>setFocused(q.id)}>
    <header><strong>{q.number}</strong><button type="button" disabled={disabled} aria-pressed={flags.includes(q.id)} aria-label={q.number+' дараа харах'} onClick={()=>onFlag(q.id)}>{flags.includes(q.id)?'⚑ Тэмдэглэсэн':'⚐ Дараа харах'}</button></header>
    <p><JapaneseText text={q.prompt} readings={readings}/></p>
    <fieldset className="jlpt-options" disabled={disabled}><legend className="sr-only">{q.number} хариулт</legend>{q.options?.map((option,i)=><label key={option} data-selected={answers[q.id]===option?'':undefined}><input type="radio" name={q.id} checked={answers[q.id]===option} onChange={()=>onChange(q.id,option)}/><span className="jlpt-option-number">{i+1}</span><JapaneseText text={option===String(i+1)&&listening?'音声の選択肢 '+option:option} readings={readings}/></label>)}</fieldset>
   </article>)}</div>
  </div>
  <nav className="jlpt-next" aria-label="ページ移動"><button className="button secondary" type="button" disabled={selected===0} onClick={()=>go(selected-1)}>← Өмнөх</button><span>1–4 сонгох · ← → шилжих · F тэмдэглэх</span><button className="button" type="button" disabled={selected===pages.length-1} onClick={()=>go(selected+1)}>Дараах →</button></nav>
 </section>;
}
