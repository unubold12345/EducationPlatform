"use client";
import {Fragment,useEffect,useMemo,useRef,useState,useSyncExternalStore,type CSSProperties} from "react";
import Link from "next/link";
import {evidenceOf,findListeningDrill,listeningDrills,numberedQuestions,questionCorrect,questionMarks,recordingLines,totalMarks,type ListeningLine,type NumberedQuestion} from "./drills";
import {blankDrillState,getLab,getServerLab,LISTENING_SPEEDS,subscribeLab,updateLab,type Answer,type DrillState,type ListeningMode} from "./progress";
import timingData from "./timings.json";
import styles from "./listening.module.css";

type Timing={key:string;duration:number;starts:number[]};
const timings=timingData as Record<string,Timing>;
const LETTERS="ABCDEFG";
const clock=(seconds:number)=>`${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,"0")}`;
const scoreOf=(items:NumberedQuestion[],answers:Record<number,Answer>)=>items.reduce((n,q)=>n+questionMarks(q.question,answers[q.index]),0);
const label=(q:NumberedQuestion)=>q.marks>1?`${q.number}–${q.number+q.marks-1}`:String(q.number);
const filled=(value:Answer|undefined)=>Array.isArray(value)?value.length>0:value!==undefined&&value!=="";

// Splits a transcript line around each question's evidence so the answer location can be marked.
function evidenceParts(line:ListeningLine,items:NumberedQuestion[]) {
 const spans=items.flatMap(q=>evidenceOf(q.question).map(e=>({start:line.text.indexOf(e),length:e.length,label:label(q)}))).filter(s=>s.start>=0).sort((a,b)=>a.start-b.start);
 const parts:{text:string;label:string|null}[]=[];let cursor=0;
 for(const span of spans){if(span.start<cursor)continue;if(span.start>cursor)parts.push({text:line.text.slice(cursor,span.start),label:null});parts.push({text:line.text.slice(span.start,span.start+span.length),label:span.label});cursor=span.start+span.length;}
 if(cursor<line.text.length)parts.push({text:line.text.slice(cursor),label:null});
 return parts;
}

export function ListeningLab() {
 const lab=useSyncExternalStore(subscribeLab,getLab,getServerLab);
 const drill=findListeningDrill(lab.drill)??listeningDrills[0],timing=timings[drill.id];
 const items=useMemo(()=>numberedQuestions(drill),[drill]),lines=useMemo(()=>recordingLines(drill),[drill]);
 const marks=totalMarks(drill);
 const state=lab.drills[drill.id]??blankDrillState();
 const exam=lab.mode==="exam"&&!state.checked;
 const audio=useRef<HTMLAudioElement>(null);
 const [playing,setPlaying]=useState(false);
 const [time,setTime]=useState(0);
 const [examUsed,setExamUsed]=useState<string|null>(null);
 const [showText,setShowText]=useState(false);
 const used=examUsed===drill.id;
 const textVisible=state.checked||(lab.mode==="practice"&&showText);
 const duration=timing?.duration??0;
 const active=timing?timing.starts.findLastIndex(start=>start<=time+0.05):-1;
 const answered=items.filter(q=>filled(state.answers[q.index])).length;

 const setDrill=(change:Partial<DrillState>)=>updateLab(l=>({...l,drills:{...l.drills,[l.drill]:{...(l.drills[l.drill]??blankDrillState()),...change}}}));
 const answer=(index:number,value:Answer)=>{if(!state.checked)setDrill({answers:{...state.answers,[index]:value}});};
 const toggleTwo=(index:number,option:number)=>{
  const current=Array.isArray(state.answers[index])?state.answers[index] as number[]:[];
  answer(index,current.includes(option)?current.filter(v=>v!==option):current.length<2?[...current,option]:current);
 };

 useEffect(()=>{if(audio.current)audio.current.playbackRate=exam?1:lab.speed;},[lab.speed,exam,drill.id]);
 useEffect(()=>()=>audio.current?.pause(),[]);

 const stop=()=>{const a=audio.current;if(a){a.pause();a.currentTime=0;}setPlaying(false);setTime(0);};
 const chooseDrill=(id:string)=>{if(id===drill.id)return;stop();setShowText(false);updateLab(l=>({...l,drill:id}));};
 const chooseMode=(mode:ListeningMode)=>{if(mode===lab.mode)return;stop();setExamUsed(null);setShowText(false);updateLab(l=>({...l,mode}));};
 const toggle=()=>{
  const a=audio.current;if(!a)return;
  if(exam){if(playing||used)return;a.currentTime=0;a.playbackRate=1;setExamUsed(drill.id);void a.play().catch(()=>setExamUsed(null));return;}
  if(a.paused)void a.play().catch(()=>{});else a.pause();
 };
 const seek=(seconds:number,play=false)=>{
  const a=audio.current;if(!a||exam)return;
  a.currentTime=Math.max(0,Math.min(duration,seconds));setTime(a.currentTime);
  if(play&&a.paused)void a.play().catch(()=>{});
 };
 const check=()=>{stop();setDrill({checked:true,attempts:state.attempts+1,best:Math.max(state.best??0,scoreOf(items,state.answers))});};
 const retry=()=>{stop();setExamUsed(null);setShowText(false);setDrill({answers:{},checked:false});};
 const score=state.checked?scoreOf(items,state.answers):null;

 const renderQuestion=(q:NumberedQuestion)=>{
  const {question,index}=q,value=state.answers[index],ok=state.checked?questionCorrect(question,value):null;
  const result=ok===null?undefined:ok?"good":questionMarks(question,value)>0?"part":"bad";
  return <li key={index} data-result={result}>
   <span className={styles.num}>{label(q)}</span>
   {question.kind==="gap"?<div className={styles.gap}>
    {question.prompt.split("______").map((piece,i,all)=><Fragment key={i}>{piece}{i<all.length-1&&<input type="text" value={typeof value==="string"?value:""} readOnly={state.checked} autoComplete="off" spellCheck={false}
     aria-label={`Асуулт ${q.number}`} maxLength={80} onChange={e=>answer(index,e.currentTarget.value)}/>}</Fragment>)}
    {ok===false&&<span className={styles.fix}>Зөв хариулт: <b>{question.answers[0]}</b></span>}
   </div>:question.kind==="match"?<div className={styles.match}>
    <span>{question.prompt}</span>
    <select value={typeof value==="number"?value:""} disabled={state.checked} aria-label={`Асуулт ${q.number}`} onChange={e=>answer(index,Number(e.currentTarget.value))}>
     <option value="" disabled>—</option>
     {q.group.options!.map((_,o)=><option key={o} value={o}>{LETTERS[o]}</option>)}
    </select>
    {ok===false&&<span className={styles.fix}>Зөв хариулт: <b>{LETTERS[question.answer]}</b></span>}
   </div>:<fieldset className={styles.choice}>
    <legend>{question.prompt}</legend>
    {question.options.map((option,o)=>{
     const chosen=question.kind==="two"?Array.isArray(value)&&value.includes(o):value===o;
     const correct=question.kind==="two"?question.answers.includes(o):question.answer===o;
     return <label key={o} data-correct={state.checked&&correct?"":undefined} data-chosen={chosen?"":undefined}>
      {question.kind==="two"?<input type="checkbox" checked={chosen} disabled={state.checked} onChange={()=>toggleTwo(index,o)}/>
       :<input type="radio" name={`${drill.id}-${index}`} checked={chosen} disabled={state.checked} onChange={()=>answer(index,o)}/>}
      <span className={styles.letter}>{LETTERS[o]}</span>{option}
     </label>;
    })}
   </fieldset>}
  </li>;
 };

 return <div className={`container page-space ${styles.root}`}>
  <header className={styles.top}>
   <div>
    <p className={styles.kicker}><Link href="/workshop">Workshop</Link> · Listening</p>
    <h1>Сонсгол лаб</h1>
    <p className={styles.lede}>IELTS Listening-ийн бүрэн хэсгүүд: хоёр тест, тус бүр Part 1–4, 40 асуулт. Бичлэг нь жинхэнэ шалгалтын адил танилцуулга, асуулт унших болон шалгах хугацаатай. Дадлагын горимд дахин сонсож хурдыг өөрчилнө; шалгалтын горимд бичлэг нэг л удаа тоглоно.</p>
   </div>
   <div className={styles.modes} role="tablist" aria-label="Горим">
    {(["practice","exam"] as const).map(mode=><button key={mode} type="button" role="tab" aria-selected={lab.mode===mode} onClick={()=>chooseMode(mode)}>
     {mode==="practice"?"Дадлага":"Шалгалт"}<small>{mode==="practice"?"Давтан сонсох, хурд":"Нэг удаа сонсоно"}</small>
    </button>)}
   </div>
  </header>

  <div className={styles.layout}>
   <nav className={styles.drills} aria-label="Сонсголын тестүүд">
    {([1,2] as const).map(test=><Fragment key={test}>
     <p className={styles.testLabel}>Test {test}</p>
     {listeningDrills.filter(d=>d.test===test).map(d=>{const s=lab.drills[d.id],total=totalMarks(d);return <button key={d.id} type="button" aria-current={d.id===drill.id?"true":undefined} onClick={()=>chooseDrill(d.id)} data-drill={d.id}>
      <span className={styles.part}>Part {d.part}</span>
      <strong>{d.title}</strong>
      <small>{d.skill}{s?.best!=null&&<em data-full={s.best===total?"":undefined}>{s.best}/{total}</em>}</small>
     </button>;})}
    </Fragment>)}
   </nav>

   <section className={styles.work} aria-labelledby="listening-title">
    <div className={styles.brief}>
     <p className={styles.part}>Test {drill.test} · Part {drill.part} · {drill.skill}</p>
     <h2 id="listening-title">{drill.title}</h2>
     <p>{drill.intro}</p>
    </div>

    <div className={styles.player} data-exam={exam?"":undefined}>
     <audio ref={audio} src={`/listening-lab/${drill.id}.mp3`} preload="metadata" key={drill.id}
      onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onTimeUpdate={e=>setTime(e.currentTarget.currentTime)} onEnded={()=>setPlaying(false)}/>
     <button type="button" className={styles.play} onClick={toggle} disabled={exam&&(playing||used)} aria-label={playing?"Түр зогсоох":"Тоглуулах"}>
      {playing?<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
       :<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.6-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>}
     </button>
     <div className={styles.track}>
      <input type="range" min={0} max={duration||1} step={0.1} value={Math.min(time,duration)} disabled={exam} aria-label="Бичлэгийн байрлал"
       onChange={e=>seek(Number(e.currentTarget.value))} style={{"--progress":`${duration?Math.min(100,time/duration*100):0}%`} as CSSProperties}/>
      <span className={styles.time}>{clock(time)} / {clock(duration)}</span>
     </div>
     {!exam&&<div className={styles.tools}>
      <button type="button" onClick={()=>seek(time-5)} aria-label="5 секунд буцах">↺ 5с</button>
      <select value={lab.speed} aria-label="Хурд" onChange={e=>updateLab(l=>({...l,speed:Number(e.currentTarget.value)}))}>
       {LISTENING_SPEEDS.map(s=><option key={s} value={s}>{s}×</option>)}
      </select>
     </div>}
    </div>
    {exam&&<p className={styles.note} role="status">{used&&!playing?"Бичлэг дууслаа. Хариултаа бөглөөд шалгана уу.":playing?"Бичлэг тоглож байна. Шалгалтын горимд зогсоох, буцаах боломжгүй.":"Шалгалтын горим: бичлэг нэг л удаа тоглоно. Асуулт унших хугацаа бичлэг дотроо байгаа."}</p>}

    <div className={styles.questions}>
     {drill.groups.map((group,g)=>{
      const groupItems=items.filter(q=>q.group===group),first=groupItems[0],last=groupItems.at(-1)!;
      return <div key={g} className={styles.group}>
       <div className={styles.qhead}>
        <h3>{first===last&&last.marks===1?`Question ${first.number}`:`Questions ${first.number}–${last.number+last.marks-1}`}</h3>
        <p>{group.instruction}{group.limit&&<> <b>{group.limit}</b></>}</p>
       </div>
       {group.heading&&<p className={styles.heading}>{group.heading}</p>}
       {group.options&&<ul className={styles.box}>{group.options.map((option,o)=><li key={o}><span className={styles.letter}>{LETTERS[o]}</span>{option}</li>)}</ul>}
       <ol>{groupItems.map(renderQuestion)}</ol>
      </div>;
     })}
     <div className={styles.actions}>
      {state.checked?<>
       <p className={styles.score} role="status"><strong>{score}/{marks}</strong> зөв{state.best!=null&&state.attempts>1&&<span> · Шилдэг {state.best}/{marks}</span>}</p>
       <button type="button" className="button secondary small" onClick={retry}>Дахин оролдох</button>
      </>:<>
       <p className={styles.muted}>{answered}/{items.length} хариулсан</p>
       <button type="button" className="button small" onClick={check} disabled={!answered}>Хариулт шалгах</button>
      </>}
     </div>
    </div>

    <div className={styles.transcript}>
     <div className={styles.qhead}>
      <h3>Бичлэгийн текст</h3>
      {!state.checked&&lab.mode==="practice"&&<button type="button" className={styles.link} onClick={()=>setShowText(v=>!v)}>{showText?"Текст нуух":"Текст харуулах"}</button>}
     </div>
     {textVisible?<>
      {state.checked&&<p className={styles.muted}>Тэмдэглэсэн хэсэгт хариулт сонсогдсон. Мөр дээр дарж тэр хэсгээс нь дахин сонсоорой.</p>}
      <ol className={styles.lines}>
       {lines.map((line,i)=><li key={i} data-active={(playing||time>0)&&i===active?"":undefined} data-narrator={line.voice==="narrator"?"":undefined}>
        <button type="button" onClick={()=>timing&&seek(timing.starts[i],true)} disabled={exam}>
         <span className={styles.speaker}>{line.speaker}</span>
         <span>{state.checked?evidenceParts(line,items).map((p,j)=>p.label===null?<Fragment key={j}>{p.text}</Fragment>:<mark key={j}><sup>{p.label}</sup>{p.text}</mark>):line.text}</span>
        </button>
       </li>)}
      </ol>
     </>:<p className={styles.muted}>{lab.mode==="exam"?"Текст хариултаа шалгасны дараа гарна.":"Эхлээд текстгүйгээр сонсож үзээрэй."}</p>}
    </div>
   </section>
  </div>
 </div>;
}
