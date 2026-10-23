"use client";
import {overallBand,type SpeakingReport} from "./contracts";
import type {ProgressEntry} from "./progress";

export type SessionStats={answers:number;voiced:number;words:number;seconds:number;wpm:number|null;pauses:number};

const criteria=[
 {key:"fluency",label:"Fluency & Coherence",hint:"Flow, linking ideas, extending answers"},
 {key:"lexical",label:"Lexical Resource",hint:"Range and precision of vocabulary"},
 {key:"grammar",label:"Grammar Range & Accuracy",hint:"Variety of structures, error control"},
] as const;

function Ring({value}:{value:number}) {
 const pct=Math.max(0,Math.min(1,value/9)),r=52,c=2*Math.PI*r;
 return <svg className="sl-ring" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r={r} className="sl-ring-track"/><circle cx="60" cy="60" r={r} className="sl-ring-fill" strokeDasharray={`${c*pct} ${c}`} transform="rotate(-90 60 60)"/></svg>;
}

export function Trend({entries}:{entries:ProgressEntry[]}) {
 const recent=entries.slice(-8);if(recent.length<2)return null;
 return <div className="sl-trend" aria-label={`Your last ${recent.length} indicative scores`}>
  {recent.map((entry,i)=><div key={entry.date+i} title={`${entry.date.slice(0,10)} · ${entry.overall}`}><span style={{height:`${Math.max(8,(entry.overall-3)/6*100)}%`}}/><small>{entry.overall}</small></div>)}
 </div>;
}

export function SpeakingReportView({report,stats,target,language,entries,saved,onSave,onListen,onNew,onAgain,onDownload,listening}:{
 report:SpeakingReport;stats:SessionStats;target:number;language:"en"|"mn";entries:ProgressEntry[];saved:Set<string>;
 onSave:(text:string,note:string)=>void;onListen:(text:string)=>void;onNew:()=>void;onAgain:()=>void;onDownload:()=>void;listening:boolean;
}) {
 const overall=overallBand([report.bands.fluency,report.bands.lexical,report.bands.grammar]);
 const gap=Math.round((target-overall)*10)/10;
 const mn=language==="mn";
 return <div className="sl-report">
  <header className="sl-report-hero">
   <div className="sl-score"><Ring value={overall}/><div><strong>{overall.toFixed(1)}</strong><span>indicative</span></div></div>
   <div>
    <p className="sl-kicker">{mn?"Таны тайлан":"Your speaking report"}</p>
    <h2>{gap<=0?(mn?"Зорилтот түвшиндээ хүрч байна!":"You’re performing at your target."):(mn?`Зорилт ${target} хүртэл ${gap} оноо`:`${gap} band${gap===1?"":"s"} from your ${target} target`)}</h2>
    <p>{report.summary}</p>
    <p className="sl-disclaimer">{mn?"Зөвхөн текстэд тулгуурласан AI тооцоолол. Албан ёсны IELTS оноо биш; дуудлагыг үнэлээгүй.":"AI estimate from your transcript and timing only — not an official IELTS score. Pronunciation is not assessed."}{report.confidence==="low"?(mn?" Хариулт цөөн тул итгэл бага.":" Low confidence: speak a little more for a firmer estimate."):""}</p>
   </div>
  </header>

  <section className="sl-criteria">
   {criteria.map(c=>{const value=report.bands[c.key];return <div key={c.key} className="sl-criterion">
    <div><strong>{c.label}</strong><span>{value.toFixed(1)}</span></div>
    <div className="sl-bar"><i style={{width:`${value/9*100}%`}}/><b style={{left:`${target/9*100}%`}} title={`Target ${target}`}/></div>
    <small>{c.hint}</small>
   </div>;})}
   <div className="sl-criterion muted"><div><strong>Pronunciation</strong><span>—</span></div><div className="sl-bar"/><small>{mn?"Аудио шинжилгээ шаардлагатай тул үнэлээгүй":"Not assessed — needs audio analysis"}</small></div>
  </section>

  <section className="sl-measured" aria-label="Measured from your recordings">
   <div><strong>{stats.answers}</strong><span>answers</span></div>
   <div><strong>{stats.words}</strong><span>words</span></div>
   <div><strong>{stats.voiced?`${Math.round(stats.seconds)}s`:"—"}</strong><span>speaking time</span></div>
   <div><strong>{stats.wpm??"—"}</strong><span>words / min</span></div>
   <div><strong>{stats.voiced?stats.pauses:"—"}</strong><span>long pauses</span></div>
  </section>
  {stats.wpm!==null&&<p className="sl-measure-note">{stats.wpm<90?(mn?"Хурд удаан байна — 110–150 үг/мин орчим хэвийн.":"Your pace is slow; natural conversation is roughly 110–150 words per minute."):stats.wpm>175?(mn?"Хурд өндөр — тодорхой ярихад анхаар.":"You speak fast — make sure ideas stay clear."):(mn?"Ярианы хурд байгалийн хэмжээнд байна.":"Your pace is in a natural range.")}</p>}

  <div className="sl-report-grid">
   {report.strengths.length>0&&<section className="sl-card good"><h3>{mn?"Сайн байсан зүйлс":"What went well"}</h3><ul>{report.strengths.map(s=><li key={s}>{s}</li>)}</ul></section>}
   {report.fixes.length>0&&<section className="sl-card"><h3>{mn?"Засах зүйлс":"Fix these next"}</h3>
    {report.fixes.map(f=><div className="sl-fix" key={f.said+f.better}>
     <p>{f.issue}</p>
     <div className="sl-diff"><s>{f.said}</s><span aria-hidden="true">→</span><ins>{f.better}</ins></div>
     <button type="button" className="sl-link" disabled={saved.has(f.better.trim().toLowerCase())} onClick={()=>onSave(f.better,f.issue)}>{saved.has(f.better.trim().toLowerCase())?"Saved ✓":"+ Phrasebook"}</button>
    </div>)}
   </section>}
  </div>

  {report.vocabulary.length>0&&<section className="sl-vocab"><h3>{mn?"Ашиглаж эхлэх үгс":"Vocabulary to start using"}</h3>
   <div>{report.vocabulary.map(v=><article key={v.phrase}>
    <strong>{v.phrase}</strong><p>{v.meaning}</p><em>“{v.example}”</em>
    <button type="button" className="sl-link" disabled={saved.has(v.phrase.trim().toLowerCase())} onClick={()=>onSave(v.phrase,`${v.meaning} — ${v.example}`)}>{saved.has(v.phrase.trim().toLowerCase())?"Saved ✓":"+ Phrasebook"}</button>
   </article>)}</div>
  </section>}

  <section className="sl-model">
   <div><h3>{mn?`${Math.min(9,target+1)} түвшний жишээ хариулт`:`Band ${Math.min(9,target+1)} model answer`}</h3><p className="sl-q">{report.model.question}</p></div>
   <blockquote>{report.model.answer}</blockquote>
   <button type="button" className="button secondary" onClick={()=>onListen(report.model.answer)} disabled={listening}>{listening?"Playing…":"▶ Listen & shadow it"}</button>
   <small>{mn?"Сонсоод дагаж хэлэх (shadowing) нь хэллэг, хэмнэлийг сайжруулна.":"Shadowing — repeating right after the speaker — builds rhythm and natural phrasing."}</small>
  </section>

  <section className="sl-next"><span>🎯</span><div><h3>{mn?"Маргаашийн дасгал":"Tomorrow’s practice"}</h3><p>{report.next}</p></div></section>

  {entries.length>1&&<section className="sl-card"><h3>{mn?"Таны ахиц":"Your progress"}</h3><Trend entries={entries}/><small className="sl-muted">Stored only in this browser.</small></section>}

  <div className="sl-report-actions">
   <button type="button" className="button primary" onClick={onAgain}>Practise again</button>
   <button type="button" className="button secondary" onClick={onNew}>New setup</button>
   <button type="button" className="sl-link" onClick={onDownload}>Download report ↓</button>
  </div>
 </div>;
}
