'use client';
import { useEffect, useRef, useState } from 'react';
import type { PublicQuestion, PublicStage } from '../types';
import { AnswerOptions, type StripItem } from '../session-tools';
import { SheetSitting, type SheetChrome } from '../sheet';
import { SpeakingRecorder } from '../speaking-recorder';
import { toeflListening, toeflSpeaking, type ToeflClip } from './catalog';
import { BuildTask, GapInput, ToeflText, ToeflWritingTask, playBeep } from './view';
import './toefl.css';

type Props={stage:PublicStage;slug:string;attemptId:string;elapsed:number;remaining:number;answers:Record<string,string>;flags:string[];disabled:boolean;
 onChange:(id:string,value:string)=>void;onFlag:(id:string)=>void;onRecording:(blob:Blob)=>void;chrome:SheetChrome};
const clipUrl=(attemptId:string,clip:string)=>`/api/mock-attempts/${attemptId}/audio/toefl?clip=${encodeURIComponent(clip)}`;
const clock=(seconds:number)=>`${Math.floor(Math.max(0,seconds)/60)}:${String(Math.floor(Math.max(0,seconds)%60)).padStart(2,'0')}`;

/**
 * One TOEFL stage in a timed sitting, in the shared answer-sheet layout: Reading pages, Listening on the clock,
 * Build a Sentence, a writing task or a speaking item.
 */
export function ToeflSection(props:Props){
 const {stage}=props;
 if(stage.kind==='listening')return <ToeflListening {...props}/>;
 if(stage.kind==='speaking'||stage.kind==='preparation')return <ToeflSpeaking {...props}/>;
 if(stage.kind==='writing')return <ToeflWriting {...props}/>;
 if(stage.id==='toefl-w-build')return <ToeflBuild {...props}/>;
 return <ToeflReading {...props}/>;
}

const strip=(questions:PublicQuestion[],answers:Record<string,string>,flags:string[]):StripItem[]=>questions.map(question=>({id:question.id,label:question.number??'',state:answers[question.id]?.trim()?'answered':undefined,flagged:flags.includes(question.id)}));
const focusItem=(id:string)=>requestAnimationFrame(()=>{const item=document.getElementById('toefl-q-'+id)??document.getElementById('gap-'+id);if(item){item.scrollIntoView({block:'center'});item.focus({preventScroll:true});}});

function Flag({question,flags,disabled,onFlag}:{question:PublicQuestion;flags:string[];disabled:boolean;onFlag:(id:string)=>void}){
 return <button type="button" className="toefl-flag" disabled={disabled} aria-pressed={flags.includes(question.id)} aria-label={question.number+' дараа харах'} onClick={()=>onFlag(question.id)}>{flags.includes(question.id)?'⚑ Тэмдэглэсэн':'⚐ Дараа харах'}</button>;
}

/** Reading Module 1 or 2: one page per task (the paragraph with its gaps, a short text, or the academic passage). */
function ToeflReading({stage,answers,flags,disabled,onChange,onFlag,chrome}:Props){
 const groups=(stage.groups??[]).filter(group=>stage.questions.some(question=>question.groupId===group.id));
 const [selected,setSelected]=useState(0);
 const group=groups[Math.min(selected,groups.length-1)];
 const questions=stage.questions.filter(question=>question.groupId===group?.id);
 const go=(at:number)=>{if(at>=0&&at<groups.length){setSelected(at);requestAnimationFrame(()=>document.getElementById('toefl-page-heading')?.focus());}};
 const byId=new Map(stage.questions.map(question=>[question.id,question]));
 const sheet=groups.map(item=>({id:item.id,title:item.title,items:strip(stage.questions.filter(question=>question.groupId===item.id),answers,flags)}));
 const jump=(id:string)=>{const at=groups.findIndex(item=>item.id===byId.get(id)?.groupId);if(at>=0){setSelected(at);focusItem(id);}};
 return <SheetSitting chrome={chrome} heading={stage.title} groups={sheet} current={questions.find(question=>!answers[question.id]?.trim())?.id??questions[0]?.id} onJump={jump}>
 <section className="toefl-work" aria-label="TOEFL Reading">
  <h2 id="toefl-page-heading" tabIndex={-1}>{group?.title}</h2>
  {group?.instructions&&group.toefl?.layout!=='daily'?<p className="toefl-instructions" lang="en">{group.instructions}</p>:null}
  {group?.toefl?.layout==='words'?<div className="toefl-words" lang="en"><p>{group.toefl.segments.map((part,at)=>{
   if(typeof part==='string')return <span key={at}>{part}</span>;
   const question=byId.get(part.q);
   return question?.toefl?.gap?<GapInput key={at} id={'gap-'+question.id} gap={question.toefl.gap} value={answers[question.id]??''} disabled={disabled} label={'Асуулт '+question.number} onChange={value=>onChange(question.id,value)}/>:null;
  })}</p><div className="toefl-gap-flags">{questions.map(question=><span key={question.id}><b>{question.number}</b><Flag question={question} flags={flags} disabled={disabled} onFlag={onFlag}/></span>)}</div></div>
  :<div className="toefl-split"><ToeflText group={group?.toefl}/><div className="toefl-questions">{group?.toefl?.layout==='daily'?<p className="toefl-instructions" lang="en">{group.instructions}</p>:null}{questions.map(question=><article className="toefl-question" id={'toefl-q-'+question.id} tabIndex={-1} key={question.id}>
   <header><strong>{question.number}</strong><Flag question={question} flags={flags} disabled={disabled} onFlag={onFlag}/></header>
   <p lang="en">{question.prompt}</p>
   <AnswerOptions name={question.id} selected={answers[question.id]} disabled={disabled} onSelect={value=>onChange(question.id,value)} labels={question.optionLabels} options={(question.options??[]).map(option=>({value:option,content:option}))}/>
  </article>)}</div></div>}
  <nav className="toefl-next" aria-label="Даалгавар шилжих"><button className="button secondary" type="button" disabled={selected===0} onClick={()=>go(selected-1)}>← Өмнөх</button><span>{selected+1} / {groups.length}</span><button className="button" type="button" disabled={selected===groups.length-1} onClick={()=>go(selected+1)}>Дараах →</button></nav>
 </section>
 </SheetSitting>;
}

/** One recording at a time on the server clock: the printed introduction while it plays, then its questions until their time ends. */
function ToeflListening({stage,slug,attemptId,elapsed,answers,flags,disabled,onChange,chrome}:Props){
 const clips=toeflListening(slug,stage.id,stage.questions.map(question=>question.id));
 const current=clips.find(entry=>elapsed>=entry.start&&elapsed<entry.windowEnd);
 const done=!current&&clips.length>0&&elapsed>=clips[clips.length-1].windowEnd;
 const position=current?clips.indexOf(current):-1;
 const group=current?stage.groups?.find(item=>item.toefl&&'clip' in item.toefl&&item.toefl.clip===current.clip):undefined;
 const playing=current?elapsed<current.start+current.seconds:false;
 const questions=current?stage.questions.filter(question=>current.questions.includes(question.id)):[];
 const total=stage.questions.length,first=questions[0]?stage.questions.indexOf(questions[0])+1:0;
 return <SheetSitting chrome={chrome} heading={stage.title} groups={[{id:stage.id,title:stage.title,items:strip(stage.questions,answers,flags)}]} current={questions[0]?.id} note="Хуудас бичлэгийг дагана: асуулт бүр өөрийн хугацаанд л нээлттэй.">
 <section className="toefl-work toefl-listening" aria-label="TOEFL Listening">
  <p className="toefl-progress">{done?'Бүх бичлэг дууссан. Хэсэг удахгүй солигдоно.':current?`Бичлэг ${position+1} / ${clips.length} · асуулт ${first}${questions.length>1?'–'+(first+questions.length-1):''} / ${total}`:'Бичлэг удахгүй эхэлнэ.'}</p>
  {current?<ClipPlayer key={current.clip} src={clipUrl(attemptId,current.clip)} offset={Math.max(0,elapsed-current.start)} active={playing}/>:null}
  {current&&group?<div className="toefl-listen-head"><h2>{group.title}</h2><p lang="en">{group.toefl?.layout==='set'?group.toefl.setting:group.instructions}</p></div>:null}
  {current&&playing?<div className="toefl-listen-now" role="status"><span className="toefl-wave" aria-hidden="true"><i/><i/><i/><i/><i/></span>Сонсож байна…</div>:null}
  {current&&!playing?<><p className="toefl-window" role="timer">Хариулах хугацаа: <strong>{clock(current.windowEnd-elapsed)}</strong> · дараа нь энэ асуулт түгжигдэнэ</p>
   {questions.map(question=><article className="toefl-question" key={question.id}><header><strong>{question.number}</strong></header><p lang="en">{question.prompt}</p>
    <AnswerOptions name={question.id} selected={answers[question.id]} disabled={disabled} onSelect={value=>onChange(question.id,value)} labels={question.optionLabels} options={(question.options??[]).map(option=>({value:option,content:option}))}/></article>)}</>:null}
 </section>
 </SheetSitting>;
}

/** Plays one clip from `offset` seconds once; a blocked autoplay shows a button that starts it at the server position. */
function ClipPlayer({src,offset,active,onEnded}:{src:string;offset:number;active:boolean;onEnded?:()=>void}){
 const audio=useRef<HTMLAudioElement>(null),start=useRef(offset),ended=useRef(onEnded);
 const [blocked,setBlocked]=useState(false);
 useEffect(()=>{ended.current=onEnded;},[onEnded]);
 async function play(){const element=audio.current;if(!element)return;try{if(start.current>0.5&&start.current<(element.duration||Infinity))element.currentTime=start.current;await element.play();setBlocked(false);}catch{setBlocked(true);}}
 if(!active)return null;
 return <div className="toefl-player">
  <audio ref={audio} src={src} preload="auto" onLoadedMetadata={()=>void play()} onEnded={()=>ended.current?.()} onError={()=>setBlocked(true)} aria-label="Recording"/>
  {blocked?<button className="button secondary small" type="button" onClick={()=>void play()}>Дууг тоглуулах →</button>:null}
 </div>;
}

/** Build a Sentence: ten replies, one at a time; the answer sheet moves between them. */
function ToeflBuild({stage,answers,flags,disabled,onChange,onFlag,chrome}:Props){
 const [index,setIndex]=useState(0);
 const question=stage.questions[index];
 const group=stage.groups?.[0];
 return <SheetSitting chrome={chrome} heading={stage.title} groups={[{id:stage.id,title:stage.title,items:strip(stage.questions,answers,flags)}]} current={question.id} onJump={id=>setIndex(stage.questions.findIndex(item=>item.id===id))}>
 <section className="toefl-work" aria-label="Build a Sentence">
  <p className="toefl-instructions" lang="en">{group?.instructions}</p>
  <article className="toefl-question"><header><strong>{question.number}</strong><Flag question={question} flags={flags} disabled={disabled} onFlag={onFlag}/></header>
   {question.toefl?.build?<BuildTask key={question.id} build={question.toefl.build} number={question.number} value={answers[question.id]??''} disabled={disabled} onChange={value=>onChange(question.id,value)}/>:null}</article>
  <nav className="toefl-next" aria-label="Асуулт шилжих"><button className="button secondary" type="button" disabled={index===0} onClick={()=>setIndex(index-1)}>← Өмнөх</button><span>{index+1} / {stage.questions.length}</span><button className="button" type="button" disabled={index===stage.questions.length-1} onClick={()=>setIndex(index+1)}>Дараах →</button></nav>
 </section>
 </SheetSitting>;
}

/** Write an Email or Write for an Academic Discussion: the task card beside the editor. */
function ToeflWriting({stage,answers,disabled,onChange,chrome}:Props){
 const question=stage.questions[0];const group=stage.groups?.[0];
 const value=answers[question.id]??'';const words=value.trim().split(/\s+/).filter(Boolean).length;
 return <SheetSitting chrome={chrome} heading={stage.title} groups={[]} note={words+' үг бичсэн'+(question.minWords?' · дор хаяж '+question.minWords:'')}>
 <section className="toefl-work toefl-writing" aria-label={group?.title}>
  <ToeflWritingTask group={group?.toefl}/>
  <div className="toefl-editor"><label htmlFor="toefl-text">Your response</label><textarea id="toefl-text" lang="en" rows={16} maxLength={16000} value={value} disabled={disabled} spellCheck={false} onChange={event=>onChange(question.id,event.target.value)}/>
   <p className="fine-print">{words} words{question.minWords?' · at least '+question.minWords:''} · хадгалагдана, автоматаар дүгнэхгүй</p></div>
 </section>
 </SheetSitting>;
}

/** A speaking introduction (scenario and narrator) or one item: the clip plays once, a beep, then the microphone records until the stage ends. */
function ToeflSpeaking({stage,slug,attemptId,elapsed,remaining,onRecording,chrome}:Props){
 const timing=toeflSpeaking(slug,stage.id);
 const intro=stage.kind==='preparation';
 const group=stage.groups?.[0];
 const [heard,setHeard]=useState(false);
 const answering=!intro&&timing?(heard||elapsed>=timing.seconds+2):false;
 const beeped=useRef(false);
 useEffect(()=>{if(answering&&!beeped.current){beeped.current=true;playBeep();}},[answering]);
 const question=stage.questions[0];
 return <SheetSitting chrome={chrome} heading={stage.title} groups={[]} note={intro?'Танилцуулга. Асуултууд дараалан автоматаар эхэлнэ.':'Бичлэг нэг удаа тоглоно, дохионы дараа микрофон бичиж эхэлнэ.'}>
 <section className="toefl-work toefl-speaking" aria-label={stage.title}>
  {timing&&!answering?<ClipPlayer src={clipUrl(attemptId,timing.clip)} offset={elapsed} active={elapsed<=timing.seconds+1} onEnded={()=>setHeard(true)}/>:null}
  {intro&&group?.toefl?.layout==='speaking-intro'?<div className="toefl-task" lang="en"><h2>{group.title}</h2><p>{group.toefl.scenario}</p>{group.toefl.picture?<p className="toefl-picture"><span>Picture</span>{group.toefl.picture}</p>:null}<p className="fine-print">Эхний асуулт {clock(remaining)}-ийн дараа эхэлнэ.</p></div>:null}
  {!intro?<div className="toefl-speak-card"><p className="eyebrow">{stage.title}</p><h2 lang="en">{question?.prompt}</h2>
   {answering?<><p className="toefl-window" role="timer">Ярих хугацаа: <strong>{clock(remaining)}</strong></p><SpeakingRecorder key={stage.id} onComplete={onRecording}/></>
   :<div className="toefl-listen-now" role="status"><span className="toefl-wave" aria-hidden="true"><i/><i/><i/><i/><i/></span>Сонсоно уу. Дохионы дараа ярина.</div>}</div>:null}
 </section>
 </SheetSitting>;
}

export type { ToeflClip };
