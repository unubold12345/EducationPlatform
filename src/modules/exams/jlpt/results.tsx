'use client';
import Link from 'next/link';
import { useState } from 'react';
import type { PublicExamAttempt } from '../types';
import { JapaneseText } from './text';
import './jlpt.css';
export function JlptResults({attempt}:{attempt:PublicExamAttempt}){
 const report=attempt.report!;
 const [filter,setFilter]=useState<'all'|'wrong'|'blank'|'correct'>('wrong');
 const domains=new Map<string,{correct:number;total:number;section:string}>();
 for(const review of report.reviews){const entry=domains.get(review.domain)??{correct:0,total:0,section:review.groupId??''};entry.total++;if(review.correct)entry.correct++;domains.set(review.domain,entry);}
 const weakest=[...domains].filter(([,d])=>d.correct<d.total).sort((a,b)=>a[1].correct/a[1].total-b[1].correct/b[1].total).slice(0,3);
 const visible=report.reviews.filter(q=>{
  if(filter==='all')return true;
  if(filter==='correct')return q.correct===true;
  if(filter==='blank')return !q.selected.trim();
  return q.correct===false&&Boolean(q.selected.trim());
 });
 return <div className="container page-space jlpt-results"><p className="eyebrow">JLPT · ХАДГАЛСАН ҮР ДҮН</p><h1>{attempt.title}</h1><p>{report.points.earned}/{report.points.total} зөв · Raw оноо</p><div className="exam-report-grid">{report.sections.map(section=><section key={section.title}><h2 lang="ja">{section.title}</h2><strong>{section.correct} / {section.total}</strong></section>)}</div>
  <p className="jlpt-note">Албан ёсны JLPT-ийн 180 оноо, тэнцсэн эсэхийг тооцохгүй. Энэ нь эх зохиомжтой, багшийн хяналт хүлээгдэж буй дадлагын үр дүн.</p>
  <h2>Дараа нь юуг давтах вэ?</h2><div className="jlpt-recommend">{weakest.map(([domain,d])=><Link className="status" href={'/exams/'+attempt.slug+'/practice?section='+encodeURIComponent(d.section)} key={domain}>{domain} · {d.correct}/{d.total} →</Link>)}</div>
  <div className="result-actions"><Link className="button" href={'/exams/'+attempt.slug+'/practice'}>Цаггүй дадлага →</Link><Link className="button secondary" href="/exams/jlpt">Бусад JLPT mock →</Link></div>
  <h2>Хариу, тайлбар</h2><div className="review-filter" role="group" aria-label="Хариу шүүх">{([['all','Бүгд'],['wrong','Алдсан'],['blank','Хоосон'],['correct','Зөв']] as const).map(([value,label])=><button type="button" key={value} aria-pressed={filter===value} onClick={()=>setFilter(value)}>{label}</button>)}</div>
  {!visible.length?<p>Энэ шүүлтэд асуулт алга. Өөр шүүлт сонгоно уу.</p>:null}
  {visible.map(review=><details className="exam-review" key={review.id}><summary><strong>{review.correct?'✓':'○'} {review.number}</strong> · {review.domain}</summary><p><JapaneseText text={review.prompt}/></p>{review.passage?<div className="jlpt-note"><JapaneseText text={review.passage}/></div>:null}<p>Таны хариу: <JapaneseText text={review.selected||'—'}/></p><p>Зөв хариу: <JapaneseText text={review.answer}/></p><p lang="en">{review.explanation}</p>{review.transcript?<details><summary>Бичлэгийн текст</summary><JapaneseText text={review.transcript}/></details>:null}</details>)}
 </div>;
}
