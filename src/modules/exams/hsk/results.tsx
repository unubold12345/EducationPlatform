'use client';
import Link from 'next/link';
import { useState } from 'react';
import type { PublicExamAttempt } from '../types';
import { ChineseText, HskImage, HskMaterial, HskQuestion, hskOptionLabels, hskPart, transcriptLines } from './view';
import './hsk.css';

type Filter='all'|'wrong'|'blank'|'correct';
/**
 * The paper's practice conversion: each section is out of 100, so a correct answer is worth 100 ÷ the section's
 * items (5 in a full 20-item section, 10 in the free mock's 10-item sections); 200 in all.
 */
const hskPerItem=(total:number)=>total>0?100/total:0;
const hskPracticeScore=(correct:number,total:number)=>Math.round(correct*hskPerItem(total));
const HSK_PRACTICE_PASS=120;

export function HskResults({attempt}:{attempt:PublicExamAttempt}){
 const report=attempt.report!;
 const [filter,setFilter]=useState<Filter>(()=>report.reviews.some(q=>q.correct===false&&q.selected.trim())?'wrong':report.reviews.some(q=>!q.selected.trim())?'blank':'all');
 const [readings,setReadings]=useState(true);
 const practice=report.sections.reduce((sum,section)=>sum+hskPracticeScore(section.correct,section.total),0);
 const perItem=[...new Set(report.sections.map(section=>hskPerItem(section.total)))].map(value=>Number(value.toFixed(2))).join(' / ');
 const parts=new Map<string,{correct:number;total:number;groupId:string}>();
 for(const review of report.reviews){const entry=parts.get(review.domain)??{correct:0,total:0,groupId:review.groupId??''};entry.total++;if(review.correct)entry.correct++;parts.set(review.domain,entry);}
 const weakest=[...parts].filter(([,d])=>d.correct<d.total).sort((a,b)=>a[1].correct/a[1].total-b[1].correct/b[1].total).slice(0,3);
 const visible=report.reviews.filter(q=>filter==='all'?true:filter==='correct'?q.correct===true:filter==='blank'?!q.selected.trim():q.correct===false&&Boolean(q.selected.trim()));
 const count=(name:Filter)=>name==='all'?report.reviews.length:report.reviews.filter(q=>name==='correct'?q.correct===true:name==='blank'?!q.selected.trim():q.correct===false&&Boolean(q.selected.trim())).length;
 return <div className="container page-space hsk-results">
  <p className="eyebrow">HSK 1 · ХАДГАЛСАН ҮР ДҮН</p><h1>{attempt.title}</h1>
  <p className="hsk-score-line"><strong>{report.points.earned}/{report.points.total}</strong> зөв · Дадлагын оноо <strong>{practice}/200</strong></p>
  <div className="exam-report-grid">{report.sections.map(section=><section key={section.title}><h2>{section.title}</h2><strong>{section.correct} / {section.total}</strong><p>{hskPracticeScore(section.correct,section.total)}/100 дадлагын оноо</p></section>)}</div>
  <p className="hsk-note">Дадлагын оноо = зөв хариулт × {perItem} (хэсэг бүр 100). Албан HSK 1-д ихэвчлэн 120/200 тэнцэх босго байдаг ч энэ нь албан, тэнцүүлсэн оноо биш; түвшин батлахгүй. {practice>=HSK_PRACTICE_PASS?'Энэ mock-д 120-оос дээш авлаа.':'120 хүртэл '+(HSK_PRACTICE_PASS-practice)+' оноо дутуу.'} Эх зохиомжтой, багшийн хяналт хүлээгдэж буй дадлага.</p>
  {weakest.length?<><h2>Дараа нь юуг давтах вэ?</h2><div className="hsk-recommend">{weakest.map(([domain,d])=><Link className="status" href={'/exams/'+attempt.slug+'/practice?section='+encodeURIComponent(d.groupId)} key={domain}>{domain} · {d.correct}/{d.total} →</Link>)}</div></>:null}
  <div className="result-actions"><Link className="button" href={'/exams/'+attempt.slug+'/practice'}>Цаггүй дадлага →</Link><Link className="button secondary" href={'/workspace/review/'+attempt.id}>AI-тай задлах →</Link><Link className="button secondary" href="/exams/hsk">Бусад HSK mock →</Link></div>
  <div className="hsk-review-head"><h2>Хариу, тайлбар</h2><button type="button" className="text-link" aria-pressed={readings} onClick={()=>setReadings(!readings)}>Pinyin {readings?'✓':'—'}</button></div>
  <div className="review-filter" role="group" aria-label="Хариу шүүх">{([['all','Бүгд'],['wrong','Алдсан'],['blank','Хоосон'],['correct','Зөв']] as const).map(([value,label])=><button type="button" key={value} aria-pressed={filter===value} onClick={()=>setFilter(value)}>{label} · {count(value)}</button>)}</div>
  {!visible.length?<p>Энэ шүүлтэд асуулт алга. Өөр шүүлт сонгоно уу.</p>:null}
  {visible.map(review=>{
   const part=hskPart(review.groupId);
   return <details className="exam-review hsk-review" key={review.id}><summary><strong>{review.correct?'✓':review.selected.trim()?'✗':'○'} {review.number}</strong> · {review.domain}</summary>
    {part?<>
     <HskMaterial group={review.hskGroup} readings={readings} example={false}/>
     <HskQuestion question={{id:'review-'+review.id,number:review.number,options:hskOptionLabels(part,review.hsk,review.hskGroup),figure:review.figure,hsk:review.hsk}} part={part} value={review.selected} disabled readings={readings} correct={review.answer.split(' ')[0]} onChange={()=>{}}/>
    </>:review.figure?.kind==='image'?<HskImage picture={review.figure}/>:null}
    <p>Таны хариу: <strong>{review.selected||'—'}</strong> · Зөв хариу: <strong>{review.answer}</strong></p>
    <p lang="en">{review.explanation}</p>
    {review.transcript?<details open><summary>Бичлэгийн текст</summary><div className="hsk-transcript">{transcriptLines(review.transcript).map((line,i)=><p key={i}><ChineseText line={line} readings={readings}/></p>)}</div></details>:null}
   </details>;
  })}
 </div>;
}
