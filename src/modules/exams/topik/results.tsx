'use client';
import Link from 'next/link';
import { useState } from 'react';
import type { PublicExamAttempt } from '../types';
import { KoreanText, topikChars } from './text';
import { CIRCLED, TopikGroupHead, TopikQuestion, TopikWriting, gapValues } from './view';
import { TOPIK_LEVELS, topikGrade, topikLevel, topikName } from './catalog';
import './topik.css';

type Filter='all'|'wrong'|'blank'|'correct'|'writing';
type Review=NonNullable<PublicExamAttempt['report']>['reviews'][number];
const WRITING_MAX:Record<string,number>={'51':10,'52':10,'53':30,'54':50};
const isWriting=(review:Review)=>review.groupId?.startsWith('topik-w-')??false;

/**
 * Listening and Reading are scored on the server with the paper's item points. Writing is the student's own
 * estimate against the model answers and rubric: it is kept on this page only and never saved or sent.
 */
export function TopikResults({attempt}:{attempt:PublicExamAttempt}){
 const report=attempt.report!,level=topikLevel(attempt.slug);
 const writing=report.reviews.filter(isWriting);
 const [filter,setFilter]=useState<Filter>(()=>report.reviews.some(q=>q.correct===false&&q.selected.trim())?'wrong':'all');
 const [self,setSelf]=useState<Record<string,number>>({});
 const writingScore=writing.reduce((sum,review)=>sum+(self[review.number??'']??0),0);
 const scored=report.points.earned+(level===2?writingScore:0);
 const total=level===2?300:200;
 const grade=topikGrade(level,scored);
 const next=TOPIK_LEVELS[level].find(step=>scored<step.min);
 const parts=new Map<string,{earned:number;total:number;groupId:string}>();
 for(const review of report.reviews){if(review.correct===null)continue;const entry=parts.get(review.domain)??{earned:0,total:0,groupId:review.groupId??''};entry.total+=review.points;entry.earned+=review.earned??0;parts.set(review.domain,entry);}
 const weakest=[...parts].filter(([,d])=>d.earned<d.total).sort((a,b)=>a[1].earned/a[1].total-b[1].earned/b[1].total).slice(0,4);
 const match=(review:Review,name:Filter)=>name==='all'?true:name==='writing'?isWriting(review):isWriting(review)?false:name==='correct'?review.correct===true:name==='blank'?!review.selected.trim():review.correct===false&&Boolean(review.selected.trim());
 const filters:[Filter,string][]=[['all','Бүгд'],['wrong','Алдсан'],['blank','Хоосон'],['correct','Зөв'],...(writing.length?[['writing','Бичих'] as [Filter,string]]:[])];
 return <div className="container page-space topik-results">
  <p className="eyebrow">{topikName(level)} · ХАДГАЛСАН ҮР ДҮН</p><h1>{attempt.title}</h1>
  <p className="topik-score-line"><strong>{scored}/{total}</strong> оноо{level===2?<> (сонсох, унших {report.points.earned}/200{writing.length?<> + бичих {writingScore}/100 өөрийн үнэлгээ</>:null})</>:null} · {grade?<>Дадлагын түвшин <strong>{grade}-р түвшин ({grade}급)</strong></>:<>Түвшин хүрээгүй</>}</p>
  <div className="exam-report-grid">{report.sections.map(section=><section key={section.title}><h2>{section.title}</h2>{section.pending&&!section.total?<><strong>{writing.length?writingScore:0} / 100</strong><p>Өөрийн үнэлгээ · доор жишиг хариутай харьцуулна</p></>:<><strong>{section.earned} / {section.points}</strong><p>{section.correct}/{section.total} зөв · асуултын оноогоор</p></>}</section>)}</div>
  <p className="topik-note">{topikName(level)}-ийн албан босго: {TOPIK_LEVELS[level].map(step=>`${step.level}-р түвшин ${step.min}`).join(', ')} ({total}-аас). {next?`${next.level}-р түвшин хүртэл ${next.min-scored} оноо дутуу.`:'Хамгийн дээд түвшний босгыг давлаа.'} Энэ нь эх зохиомжтой mock-ийн дадлагын тооцоо; албан TOPIK оноо, түвшин биш.{level===2?' Бичих хэсгийн оноог та доорх жишиг хариу, шалгуураар өөрөө тавина; хадгалагдахгүй.':''}</p>
  {weakest.length?<><h2>Дараа нь юуг давтах вэ?</h2><div className="topik-recommend">{weakest.map(([domain,d])=><Link className="status" href={'/exams/'+attempt.slug+'/practice?section='+encodeURIComponent(d.groupId)} key={domain}>{domain} · {d.earned}/{d.total} →</Link>)}</div></>:null}
  <div className="result-actions"><Link className="button" href={'/exams/'+attempt.slug+'/practice'}>Цаггүй дадлага →</Link><Link className="button secondary" href={'/workspace/review/'+attempt.id}>AI-тай задлах →</Link><Link className="button secondary" href="/exams/topik">Бусад TOPIK mock →</Link></div>
  <h2>Хариу, тайлбар</h2>
  <div className="review-filter" role="group" aria-label="Хариу шүүх">{filters.map(([value,label])=><button type="button" key={value} aria-pressed={filter===value} onClick={()=>setFilter(value)}>{label} · {report.reviews.filter(q=>match(q,value)).length}</button>)}</div>
  {report.reviews.filter(q=>match(q,filter)).map(review=><details className="exam-review topik-review" key={review.id} open={isWriting(review)&&filter==='writing'}>
   <summary><strong>{isWriting(review)?'✎':review.correct?'✓':review.selected.trim()?'✗':'○'} {review.number}</strong> · {review.domain}{isWriting(review)?<> · {self[review.number??'']??0}/{WRITING_MAX[review.number??'']} өөрийн үнэлгээ</>:<> · {review.earned??0}/{review.points} оноо</>}</summary>
   {review.topikGroup?<TopikGroupHead group={review.topikGroup} example={false}/>:null}
   {isWriting(review)?<WritingReview review={review} score={self[review.number??'']??0} onScore={value=>setSelf(current=>({...current,[review.number??'']:value}))}/>:<>
    <TopikQuestion question={{id:'review-'+review.id,number:review.number,options:[...CIRCLED],topik:review.topik}} value={review.selected} disabled correct={review.answer.split(' ')[0]} onChange={()=>{}}/>
    <p>Таны хариу: <strong>{review.selected||'—'}</strong> · Зөв хариу: <strong lang="ko">{review.answer}</strong></p>
    <p className="topik-explanation">{review.explanation}</p>
    {review.transcript?<details open><summary>Бичлэгийн текст</summary><div className="topik-transcript" lang="ko">{review.transcript.split('\n').map((line,i)=><p key={i}>{line}</p>)}</div></details>:null}
   </>}
  </details>)}
 </div>;
}

function WritingReview({review,score,onScore}:{review:Review;score:number;onScore:(value:number)=>void}){
 const max=WRITING_MAX[review.number??'']??0;
 const gaps=review.topik?.gaps;
 return <div className="topik-writing-review">
  <TopikWriting question={{id:'review-'+review.id,number:review.number,topik:review.topik}} value={review.selected} disabled onChange={()=>{}}/>
  {gaps?<p className="sr-only">{gaps.map(gap=>`${gap}: ${gapValues(review.selected,gaps)[gap]||'—'}`).join('; ')}</p>:review.selected.trim()?null:<p>Хариу бичээгүй.</p>}
  <section className="topik-model"><h3>Жишиг хариу</h3><div lang="ko">{review.answer.split('\n').map((line,i)=><p key={i}><KoreanText text={line} inline/></p>)}</div>{gaps?null:<p className="topik-count">Жишиг: {topikChars(review.answer)} тэмдэгт</p>}</section>
  <section className="topik-rubric"><h3>Үнэлгээний шалгуур</h3><p>{review.explanation}</p></section>
  <label className="topik-self">Өөрийн оноо: <input type="range" min={0} max={max} step={1} value={score} onChange={event=>onScore(Number(event.target.value))}/><strong>{score}/{max}</strong></label>
 </div>;
}
