'use client';
// TOEFL iBT printed material and the two new answer formats, shared by the timed sitting and practice mode.
// Everything here is answer-free: gaps carry their prefix and letter count, Build a Sentence its boxes in shuffled order.
import { useRef } from 'react';
import type { ToeflGroup, ToeflItem } from '../types';
import { buildSlots } from './slots';

/** Complete the Words: the printed prefix, then one box per missing letter. The response is the typed letters. */
export function GapInput({id,gap,value,disabled,onChange,label}:{id:string;gap:NonNullable<ToeflItem['gap']>;value:string;disabled?:boolean;onChange:(value:string)=>void;label:string}){
 const boxes=useRef<(HTMLInputElement|null)[]>([]);
 const letters=Array.from({length:gap.missing},(_,at)=>value[at]&&value[at]!==' '?value[at]:'');
 const save=(next:string[])=>onChange(next.map(letter=>letter||' ').join('').replace(/\s+$/,''));
 function type(at:number,text:string){
  const typed=text.replace(/[^A-Za-z']/g,'');
  if(!typed){const next=[...letters];next[at]='';save(next);return;}
  const next=[...letters];let cursor=at;
  for(const letter of typed){if(cursor>=gap.missing)break;next[cursor++]=letter.toLocaleLowerCase('en');}
  save(next);boxes.current[Math.min(cursor,gap.missing-1)]?.focus();
 }
 return <span className="toefl-gap" data-filled={letters.every(Boolean)?'':undefined} role="group" aria-label={label}>
  <span className="toefl-gap-prefix" aria-hidden="true">{gap.prefix}</span>
  {letters.map((letter,at)=><input key={at} id={at===0?id:undefined} ref={element=>{boxes.current[at]=element;}} className="toefl-gap-box" value={letter} disabled={disabled} maxLength={gap.missing} autoComplete="off" autoCapitalize="off" spellCheck={false} inputMode="text"
   aria-label={`${label}: ${gap.prefix} үгийн ${at+1}-р үсэг`} onFocus={event=>event.currentTarget.select()}
   onChange={event=>type(at,event.currentTarget.value)}
   onKeyDown={event=>{
    if(event.key==='Backspace'&&!letter&&at>0){event.preventDefault();const next=[...letters];next[at-1]='';save(next);boxes.current[at-1]?.focus();}
    else if(event.key==='ArrowLeft'&&at>0){event.preventDefault();boxes.current[at-1]?.focus();}
    else if(event.key==='ArrowRight'&&at<gap.missing-1){event.preventDefault();boxes.current[at+1]?.focus();}
   }}/>)}
 </span>;
}

export { buildSlots };

/** Build a Sentence: the other speaker's line, the reply with its boxes, and the word boxes to place. The response is the placed boxes joined by spaces. */
export function BuildTask({build,value,disabled,onChange,number}:{build:NonNullable<ToeflItem['build']>;value:string;disabled?:boolean;onChange:(value:string)=>void;number?:string}){
 const placed=buildSlots(value,build.chips);
 const pool=[...build.chips];for(const chip of placed){const at=pool.indexOf(chip);if(at>=0)pool.splice(at,1);}
 const set=(next:string[])=>onChange(next.join(' '));
 return <div className="toefl-build">
  <p className="toefl-build-line" lang="en"><span className="toefl-speaker" aria-hidden="true">A</span>{build.context}</p>
  <div className="toefl-build-reply" lang="en" aria-label={`Хариу өгүүлбэр${number?' '+number:''}`}><span className="toefl-speaker" aria-hidden="true">B</span>
   {build.prefix?<span className="toefl-build-fixed">{build.prefix}</span>:null}
   {Array.from({length:build.slots},(_,at)=>placed[at]
    ?<button key={at} type="button" className="toefl-slot" data-filled="" disabled={disabled} aria-label={`${at+1}-р нүд: ${placed[at]}. Буцаах`} onClick={()=>set(placed.filter((_,index)=>index!==at))}>{placed[at]}</button>
    :<span key={at} className="toefl-slot" aria-label={`${at+1}-р нүд хоосон`}/>)}
   {build.suffix?<span className="toefl-build-fixed">{build.suffix}</span>:null}
   <span className="toefl-build-end">{build.end}</span>
  </div>
  <div className="toefl-chips" role="group" aria-label="Үгийн хайрцагууд">{pool.map((chip,at)=><button key={chip+at} type="button" className="toefl-chip" lang="en" disabled={disabled||placed.length>=build.slots} onClick={()=>set([...placed,chip])}>{chip}</button>)}</div>
  <p className="fine-print">Хайрцаг дарж дараагийн хоосон нүдэнд байрлуулна. Байрлуулсан үгийг дарвал буцна. Зарим асуултад нэг хайрцаг илүү байдаг.</p>
 </div>;
}

/** A reading text or passage (Read in Daily Life, Read an Academic Passage). */
export function ToeflText({group}:{group:ToeflGroup|undefined}){
 if(group?.layout==='daily')return <article className="toefl-text toefl-daily" lang="en"><p className="eyebrow">{group.format}</p>{group.text.split(/\n{2,}/).map((block,at)=><p key={at}>{block}</p>)}</article>;
 if(group?.layout==='academic')return <article className="toefl-text toefl-academic" lang="en"><h3>{group.title}</h3>{group.paragraphs.map((paragraph,at)=><p key={at}><span className="toefl-paragraph-number" aria-label={`Paragraph ${at+1}`}>{at+1}</span>{paragraph}</p>)}</article>;
 return null;
}

/** The writing task card: the email situation with its three points, or the professor's question and two students' posts. */
export function ToeflWritingTask({group}:{group:ToeflGroup|undefined}){
 if(group?.layout==='email')return <section className="toefl-task" lang="en"><p>{group.scenario}</p><p>Write an email to {group.to}. In your email, do the following:</p><ul>{group.bullets.map(point=><li key={point}>{point}</li>)}</ul><p>Write as much as you can and in complete sentences.</p><dl className="toefl-email-head"><div><dt>To:</dt><dd>{group.to}</dd></div><div><dt>Subject:</dt><dd>{group.subject}</dd></div></dl></section>;
 if(group?.layout==='discussion')return <section className="toefl-task" lang="en"><p>Your professor is teaching a class on {group.course}. Write a post responding to the professor&apos;s question. In your response, you should do the following:</p><ul><li>Express and support your opinion.</li><li>Make a contribution to the discussion in your own words.</li></ul><p>An effective response will contain at least 100 words.</p>
  <div className="toefl-posts"><article className="toefl-post toefl-professor"><strong>{group.professor.name}</strong><p>{group.professor.post}</p></article>{group.students.map(student=><article className="toefl-post" key={student.name}><strong>{student.name}</strong><p>{student.post}</p></article>)}</div></section>;
 return null;
}

/** A short two-tone beep before the student speaks (Web Audio; no file). */
export function playBeep(){
 try{
  const Context=window.AudioContext??(window as unknown as {webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
  if(!Context)return;
  const context=new Context();const oscillator=context.createOscillator();const gain=context.createGain();
  oscillator.frequency.value=880;gain.gain.setValueAtTime(0.0001,context.currentTime);gain.gain.exponentialRampToValueAtTime(0.25,context.currentTime+0.02);gain.gain.exponentialRampToValueAtTime(0.0001,context.currentTime+0.35);
  oscillator.connect(gain).connect(context.destination);oscillator.start();oscillator.stop(context.currentTime+0.4);oscillator.onended=()=>void context.close();
 }catch{/* A missing beep never blocks the answer. */}
}
