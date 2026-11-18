'use client';
import Link from 'next/link';
import { useState } from 'react';
import type { PublicExamAttempt } from '../types';
import { MockGrades } from '../ai-grading/panel';
import './toefl.css';

type Filter='all'|'wrong'|'blank'|'correct'|'pending';
type Review=NonNullable<PublicExamAttempt['report']>['reviews'][number];
const filters:[Filter,string][]=[['all','Бүгд'],['wrong','Алдсан'],['blank','Хоосон'],['correct','Зөв'],['pending','Хяналт']];
const groupOf=(review:Review):Filter=>review.correct===null?'pending':review.correct?'correct':review.selected.trim()?'wrong':'blank';
/** The task a review belongs to, from its id (toefl01-r2u-41 → Reading Module 2 Upper). */
function taskOf(id:string){
 const part=/-(r1|r2l|r2u|l1|l2l|l2u|w|s)-/.exec(id)?.[1];
 return ({r1:'Reading · Module 1',r2l:'Reading · Module 2 Lower',r2u:'Reading · Module 2 Upper',l1:'Listening · Module 1',l2l:'Listening · Module 2 Lower',l2u:'Listening · Module 2 Upper',w:'Writing',s:'Speaking'} as Record<string,string>)[part??'']??'';
}
const speakingStages=['toefl-s-repeat-1','toefl-s-repeat-2','toefl-s-repeat-3','toefl-s-repeat-4','toefl-s-repeat-5','toefl-s-repeat-6','toefl-s-repeat-7','toefl-s-interview-1','toefl-s-interview-2','toefl-s-interview-3','toefl-s-interview-4'];

/** TOEFL results: raw Reading /50 and Listening /47 with the module taken, Build a Sentence /10, and the AI grades of the writing and speaking tasks, with model answers. */
export function ToeflResults({attempt}:{attempt:PublicExamAttempt}){
 const report=attempt.report!;
 const endpoint='/api/mock-attempts/'+attempt.id;
 const section=(title:string)=>report.sections.find(item=>item.title===title);
 const reading=section('Reading'),listening=section('Listening');
 const build=report.reviews.filter(review=>review.domain==='Writing'&&review.correct!==null);
 const readingUpper=report.reviews.some(review=>review.id.includes('-r2u-')),listeningUpper=report.reviews.some(review=>review.id.includes('-l2u-'));
 const [filter,setFilter]=useState<Filter>('all');
 const visible=report.reviews.filter(review=>filter==='all'||groupOf(review)===filter);
 return <div className="container page-space toefl-results">
  <p className="eyebrow">TOEFL iBT · ХАДГАЛСАН ҮР ДҮН</p><h1>{attempt.title}</h1>
  <div className="exam-report-grid">
   <section><p className="eyebrow">Reading</p><strong>{reading?.correct??0}<span> / {reading?.total??50}</span></strong><p>Module 2: {readingUpper?'Upper':'Lower'}</p></section>
   <section><p className="eyebrow">Listening</p><strong>{listening?.correct??0}<span> / {listening?.total??47}</span></strong><p>Module 2: {listeningUpper?'Upper':'Lower'}</p></section>
   <section><p className="eyebrow">Build a Sentence</p><strong>{build.filter(review=>review.correct).length}<span> / {build.length}</span></strong><p>Writing · зөв өгүүлбэр</p></section>
  </div>
  <MockGrades attempt={attempt}/>
  <p className="toefl-note">Зөв хариултын тоо (raw). ETS-ийн 1–6 band болон 0–120 оноонд хөрвүүлэхгүй: ETS албан хөрвүүлэлтийн хүснэгт нийтэлдэггүй. {(!readingUpper||!listeningUpper)?'Lower модуль нь ойролцоогоор B1 ба түүнээс доош түвшний дадлага. ':''}Энэ бол ETS-ийн материал биш; TOEFL, TOEFL iBT нь ETS-ийн бүртгэлтэй тэмдэг.</p>
  <section className="exam-recordings toefl-recordings"><h2>Speaking бичлэгүүд</h2>{attempt.recordings.length?speakingStages.filter(stageId=>attempt.recordings.some(recording=>recording.stageId===stageId)).map(stageId=>{const recording=attempt.recordings.find(item=>item.stageId===stageId)!;return <div key={stageId}><h3>{stageId.includes('repeat')?'Listen and Repeat '+stageId.split('-').pop():'Interview '+stageId.split('-').pop()}</h3><audio controls preload="none" src={endpoint+'/recordings/'+stageId}/><a className="text-link" download={stageId+(recording.mime.includes('mp4')?'.m4a':'.webm')} href={endpoint+'/recordings/'+stageId}>Татах ↓</a></div>;}):<p>Хадгалсан бичлэг одоогоор алга. Илгээж буй бичлэг байвал дуусмагц шинэчилнэ.</p>}</section>
  <div className="result-actions"><Link className="button" href={'/exams/'+attempt.slug+'/practice'}>Цаггүй дадлага →</Link><Link className="button secondary" href={'/workspace/review/'+attempt.id}>AI-тай задлах →</Link><Link className="button secondary" href="/exams/toefl">Бусад TOEFL mock →</Link></div>
  <h2 className="exam-review-title">Хариу ба тайлбар</h2>
  <div className="review-filter" role="group" aria-label="Хариу шүүх">{filters.map(([name,label])=><button key={name} type="button" aria-pressed={filter===name} onClick={()=>setFilter(name)}>{label} · {name==='all'?report.reviews.length:report.reviews.filter(review=>groupOf(review)===name).length}</button>)}</div>
  {!visible.length?<p>Энэ шүүлтэд асуулт алга. Өөр шүүлт сонгоно уу.</p>:null}
  <div className="exam-review-list">{visible.map(review=><details className="exam-review" key={review.id}>
   <summary><span className={review.correct===null?'pending-label':review.correct?'correct':'incorrect'}>{review.correct===null?'Хяналт':review.correct?'Зөв':review.selected.trim()?'Алдсан':'Хоосон'}</span><span>{review.number}. <small>{taskOf(review.id)}</small> {review.prompt.slice(0,120)}</span></summary>
   {review.contextTitle||review.context?<details className="review-passage"><summary>{review.contextTitle??'Текст'}</summary><p lang="en" className="toefl-review-text">{review.context}</p></details>:null}
   <p lang="en">{review.prompt}</p>
   <p><strong>Таны хариу:</strong> {review.domain==='Speaking'?'Бичлэгийг дээр сонсоно уу':review.selected||'—'}</p>
   {review.answer?<p><strong>Зөв хариу:</strong> {review.answer}</p>:null}
   <p className="explanation toefl-review-text" lang="en">{review.explanation}</p>
   {review.transcript?<details className="review-passage"><summary>Бичлэгийн текст</summary><p lang="en" className="toefl-review-text">{review.transcript}</p></details>:null}
  </details>)}</div>
 </div>;
}
