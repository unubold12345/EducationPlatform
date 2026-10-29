"use client";
import {useEffect,useRef,useState,useSyncExternalStore} from "react";
import Link from "next/link";
import {countParagraphs,countWords,findWritingPrompt,MIN_WORDS,writingPrompts,writingTasks,type WritingAction,type WritingFix,type WritingKind,type WritingReply,type WritingTask} from "./contracts";
import {SpellEditor} from "./spell-editor";
import {blankDraft,getServerStudio,getStudio,subscribeStudio,updateStudio,type Draft} from "./progress";
import styles from "./writing.module.css";

const KIND_LABEL:Record<WritingKind,string>={grammar:"Дүрэм",spelling:"Үсэг",punctuation:"Цэг тэмдэг",vocabulary:"Үг",style:"Найруулга"};
const BUSY_LABEL:Record<WritingAction,string>={ideas:"Санаа боловсруулж байна",grammar:"Дүрэм шалгаж байна",feedback:"Бүрэн үнэлгээ хийж байна · ~20 сек"};
const clock=(seconds:number)=>`${seconds<0?"+":""}${Math.floor(Math.abs(seconds)/60)}:${String(Math.floor(Math.abs(seconds)%60)).padStart(2,"0")}`;

// Replaces the first occurrence without String.replace, whose "$" patterns would corrupt student text.
function replaceOnce(text:string,original:string,better:string){const at=text.indexOf(original);return at<0?text:text.slice(0,at)+better+text.slice(at+original.length);}

function segments(essay:string,fixes:{fix:WritingFix;index:number}[]) {
 const spans=fixes.map(({fix,index})=>({start:essay.indexOf(fix.original),end:essay.indexOf(fix.original)+fix.original.length,index})).filter(s=>s.start>=0).sort((a,b)=>a.start-b.start);
 const parts:{text:string;index:number|null}[]=[];let cursor=0;
 for(const span of spans){if(span.start<cursor)continue;if(span.start>cursor)parts.push({text:essay.slice(cursor,span.start),index:null});parts.push({text:essay.slice(span.start,span.end),index:span.index});cursor=span.end;}
 if(cursor<essay.length)parts.push({text:essay.slice(cursor),index:null});
 return parts;
}

function Timer({minutes}:{minutes:number}) {
 const [state,setState]=useState<{elapsed:number;since:number|null}>({elapsed:0,since:null});
 const [now,setNow]=useState(0);
 useEffect(()=>{if(state.since===null)return;const id=window.setInterval(()=>setNow(Date.now()),500);return()=>window.clearInterval(id);},[state.since]);
 const elapsed=state.elapsed+(state.since===null?0:Math.max(0,now-state.since)/1000);
 const shown=minutes?minutes*60-elapsed:elapsed;
 const toggle=()=>{const t=Date.now();setNow(t);setState(s=>s.since===null?{...s,since:t}:{elapsed:s.elapsed+(t-s.since)/1000,since:null});};
 return <div className={styles.timer} data-over={minutes>0&&shown<0?"":undefined}>
  <button type="button" onClick={toggle} aria-label={state.since===null?"Цаг эхлүүлэх":"Цаг зогсоох"}>{state.since===null?"▶":"❚❚"}</button>
  <span aria-live="off">{clock(shown)}</span>
  {(elapsed>0)&&<button type="button" onClick={()=>setState({elapsed:0,since:null})} aria-label="Цаг шинэчлэх">↺</button>}
 </div>;
}

export function WritingStudio({signedIn}:{signedIn:boolean}) {
 const studio=useSyncExternalStore(subscribeStudio,getStudio,getServerStudio);
 const task=studio.task,info=writingTasks[task],draft=studio.drafts[task]??blankDraft(task);
 const prompt=draft.promptId?findWritingPrompt(draft.promptId):undefined;
 const [busy,setBusy]=useState<WritingAction|null>(null);
 const [error,setError]=useState("");
 const [view,setView]=useState<"write"|"marks">("write");
 const [tab,setTab]=useState<"fixes"|"words"|"summary">("fixes");
 const [active,setActive]=useState<number|null>(null);
 const [spellCount,setSpellCount]=useState<number|null>(null);
 const editor=useRef<HTMLTextAreaElement>(null);
 const words=countWords(draft.essay),paragraphs=countParagraphs(draft.essay);
 const reply=draft.reply,report=reply?.report??null;
 const stale=!!reply&&draft.action!=="ideas"&&draft.checked!==draft.essay;
 const fixes=(reply?.fixes??[]).map((fix,index)=>({fix,index,done:!draft.essay.includes(fix.original),skipped:draft.dismissed.includes(fix.original)}));
 const open=fixes.filter(f=>!f.done&&!f.skipped);

 const edit=(change:Partial<Draft>)=>updateStudio(s=>({...s,drafts:{...s.drafts,[s.task]:{...(s.drafts[s.task]??blankDraft(s.task)),...change}}}));
 const switchTask=(next:WritingTask)=>{if(busy)return;setError("");setView("write");setActive(null);updateStudio(s=>({...s,task:next}));};
 const choosePrompt=(id:string)=>{
  if(id===draft.promptId)return;
  if(draft.essay.trim()&&!window.confirm("Сэдэв солиход одоогийн бичвэр арилна. Үргэлжлүүлэх үү?"))return;
  setError("");setView("write");edit(blankDraft(task,id));
 };
 const shuffle=()=>{const pool=writingPrompts.filter(p=>p.task===task&&p.id!==draft.promptId);choosePrompt(pool[Math.floor(Math.random()*pool.length)].id);};
 const restart=()=>{if(draft.essay.trim()&&!window.confirm("Бичвэрээ устгаад шинээр эхлэх үү?"))return;setError("");setView("write");edit({...blankDraft(task,draft.promptId??undefined),topic:draft.topic});};
 const apply=(fix:WritingFix)=>{edit({essay:replaceOnce(draft.essay,fix.original,fix.better)});setActive(null);};
 const applyAll=()=>{let essay=draft.essay;for(const {fix} of open)essay=replaceOnce(essay,fix.original,fix.better);edit({essay});setView("write");};
 const insert=(phrase:string)=>{
  const el=editor.current,start=el?.selectionStart??draft.essay.length,end=el?.selectionEnd??start;
  const before=draft.essay.slice(0,start),pad=before&&!/\s$/.test(before)?" ":"";
  edit({essay:before+pad+phrase+draft.essay.slice(end)});setView("write");
  requestAnimationFrame(()=>{const at=start+pad.length+phrase.length;editor.current?.focus();editor.current?.setSelectionRange(at,at);});
 };

 async function run(action:WritingAction) {
  if(busy||!signedIn)return;
  if(words<MIN_WORDS[action]){setError(`${action==="feedback"?"Бүрэн үнэлгээнд":"Дүрэм шалгахад"} дор хаяж ${MIN_WORDS[action]} үг хэрэгтэй.`);return;}
  if(task==="free"&&action==="ideas"&&!draft.topic.trim()){setError("Санаа авахын тулд эхлээд сэдвээ бичнэ үү.");return;}
  setBusy(action);setError("");
  const essay=draft.essay;
  try{
   const response=await fetch("/api/labs/ielts-writing",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({task,promptId:draft.promptId,topic:task==="free"?draft.topic:"",essay,action,language:studio.language})});
   const data=await response.json().catch(()=>({}));
   if(!response.ok){setError(typeof data.error==="string"?data.error:"Түр алдаа гарлаа. Дахин оролдоно уу.");return;}
   const result:WritingReply={fixes:data.fixes??[],words:data.words??[],report:data.report??null,ideas:data.ideas??null};
   updateStudio(s=>{
    const current=s.drafts[task]??blankDraft(task);
    const history=action==="feedback"&&result.report?[...s.history,{date:new Date().toISOString(),task,title:task==="free"?(current.topic.trim()||"Free writing").slice(0,80):findWritingPrompt(current.promptId!)?.theme??"Essay",words:countWords(essay),overall:result.report.overall,bands:result.report.bands}].slice(-30):s.history;
    return {...s,history,drafts:{...s.drafts,[task]:{...current,reply:result,action,checked:essay,dismissed:[]}}};
   });
   setTab(action==="feedback"?"summary":"fixes");setActive(null);
   if(action!=="ideas"&&result.fixes.length)setView("marks");
  }catch{setError("Сүлжээний алдаа гарлаа. Бичвэр тань хадгалагдсан хэвээр байна.");}
  finally{setBusy(null);}
 }

 const target=info.target,progress=target?Math.min(1,words/target):0;
 const history=studio.history.filter(e=>e.task===task).slice(-8);
 const criteria=report?[["Task "+(task==="letter"?"achievement":"response"),report.bands.task],["Coherence & cohesion",report.bands.coherence],["Lexical resource",report.bands.lexical],["Grammar range & accuracy",report.bands.grammar]] as const:[];

 return <div className={`container page-space ${styles.root}`}>
  <header className={styles.top}>
   <div><p className={styles.kicker}><Link href="/workshop">Workshop</Link> · Essay Studio</p><h1>Бич. <span>Дараа нь сайжруул.</span></h1></div>
   <div className={styles.tasks} role="tablist" aria-label="Бичгийн төрөл">
    {(Object.keys(writingTasks) as WritingTask[]).map(key=><button key={key} type="button" role="tab" aria-selected={task===key} disabled={!!busy} onClick={()=>switchTask(key)}>{writingTasks[key].label}<small>{writingTasks[key].note}</small></button>)}
   </div>
  </header>

  <section className={styles.prompt} aria-label="Даалгавар">
   <div className={styles.promptMeta}>
    {prompt&&<span className={styles.theme}>{prompt.theme}</span>}
    <span>{target?`${target}+ үг · ${info.minutes} минут`:"Үгийн хязгааргүй"}</span>
    {prompt&&<div className={styles.promptTools}>
     <select aria-label="Сэдэв сонгох" value={draft.promptId!} disabled={!!busy} onChange={event=>choosePrompt(event.target.value)}>{writingPrompts.filter(p=>p.task===task).map((p,i)=><option key={p.id} value={p.id}>{String(i+1).padStart(2,"0")} · {p.theme}</option>)}</select>
     <button type="button" className={styles.ghost} disabled={!!busy} onClick={shuffle}>↻ Өөр сэдэв</button>
    </div>}
   </div>
   {prompt?<p className={styles.promptText}>{prompt.text}</p>:<input className={styles.topic} value={draft.topic} maxLength={400} onChange={event=>edit({topic:event.target.value})} placeholder="Юуны тухай бичих вэ? Жишээ нь: My favourite place in Ulaanbaatar" aria-label="Өөрийн сэдэв"/>}
  </section>

  <div className={styles.main}>
   <section className={styles.paper} aria-label="Бичвэр">
    <div className={styles.paperBar}>
     <div className={styles.views} role="tablist" aria-label="Харагдац">
      <button type="button" role="tab" aria-selected={view==="write"} onClick={()=>setView("write")}>Бичих</button>
      <button type="button" role="tab" aria-selected={view==="marks"} disabled={!open.length} onClick={()=>setView("marks")}>Тэмдэглэгээ{open.length?<em>{open.length}</em>:null}</button>
     </div>
     <div className={styles.barTools}>
      <label className={styles.spell} title="Harper · бичвэр энэ төхөөрөмжөөс гарахгүй">
       <span aria-hidden="true">abc</span>{studio.spelling!=="off"&&spellCount!==null&&<em data-clean={spellCount===0?"":undefined}>{spellCount===0?"✓":spellCount}</em>}
       <select aria-label="Автомат зөв бичиг" value={studio.spelling} onChange={event=>{const value=event.target.value;updateStudio(s=>({...s,spelling:value==="us"?"us":value==="off"?"off":"uk"}));}}>
        <option value="uk">UK</option><option value="us">US</option><option value="off">Унтраах</option>
       </select>
      </label>
      <Timer key={task} minutes={info.minutes}/>
     </div>
    </div>
    {view==="write"||!open.length
     ?<SpellEditor value={draft.essay} onChange={essay=>edit({essay})} dialect={studio.spelling} words={studio.words} onCount={setSpellCount}
       onAddWord={word=>updateStudio(s=>({...s,words:[...s.words.filter(w=>w.toLowerCase()!==word.toLowerCase()),word].slice(-300)}))}
       editorRef={editor} disabled={!!busy&&busy!=="ideas"} label="Таны бичвэр"
       placeholder={task==="letter"?"Dear Sir or Madam,\n\nI am writing to…":"Эндээс бичиж эхлээрэй. Бичвэр тань энэ төхөөрөмж дээр автоматаар хадгалагдана."}
       onKeyDown={event=>{if(event.key==="Enter"&&(event.ctrlKey||event.metaKey)){event.preventDefault();void run("feedback");}}}/>
     :<div className={styles.marked} aria-label="Засвар тэмдэглэсэн бичвэр">{segments(draft.essay,open).map((part,i)=>part.index===null?<span key={i}>{part.text}</span>:<mark key={i} data-kind={reply!.fixes[part.index].kind} data-active={active===part.index?"":undefined} onClick={()=>{setActive(part.index);setTab("fixes");document.getElementById(`fix-${part.index}`)?.scrollIntoView({block:"nearest",behavior:"smooth"});}}>{part.text}</mark>)}</div>}
    <footer className={styles.meter}>
     <div className={styles.count}>
      {target>0&&<span className={styles.bar} aria-hidden="true"><i style={{transform:`scaleX(${progress})`}} data-done={words>=target?"":undefined}/></span>}
      <span><strong>{words}</strong>{target?` / ${target}`:""} үг · {paragraphs} догол мөр</span>
      {draft.essay&&<button type="button" className={styles.link} onClick={restart} disabled={!!busy}>Шинээр эхлэх</button>}
     </div>
     <div className={styles.actions}>
      {signedIn?<>
       <button type="button" className={styles.secondary} disabled={!!busy} onClick={()=>void run("grammar")}>Дүрэм шалгах</button>
       <button type="button" className={styles.primary} disabled={!!busy} onClick={()=>void run("feedback")} title="Ctrl + Enter">{busy==="feedback"?"Үнэлж байна…":"Бүрэн үнэлгээ"}<kbd>⌃↵</kbd></button>
      </>:<Link className={styles.primary} href="/login?next=%2Flabs%2Fielts-writing">Нэвтэрч AI-аар шалгуулах →</Link>}
     </div>
    </footer>
   </section>

   <aside className={styles.coach} aria-label="AI туслах" aria-busy={!!busy}>
    <div className={styles.coachHead}>
     <span className={styles.spark} aria-hidden="true">✦</span>
     <div><h2>AI туслах</h2><p>{busy?BUSY_LABEL[busy]:stale?"Бичвэр өөрчлөгдсөн · дахин шалгаж болно":reply?"Сүүлийн шалгалтын үр дүн":"Бичиж дуусаад шалгуулаарай"}</p></div>
     <select className={styles.language} aria-label="Тайлбарын хэл" value={studio.language} onChange={event=>updateStudio(s=>({...s,language:event.target.value==="en"?"en":"mn"}))}><option value="mn">MN</option><option value="en">EN</option></select>
    </div>
    {error&&<p className={styles.error} role="alert">{error}</p>}
    <div className={styles.coachBody} aria-live="polite">
     {busy?<div className={styles.skeleton} aria-label={BUSY_LABEL[busy]}><i/><i/><i/><i/></div>
     :!reply?<div className={styles.empty}>
      <ol>
       <li><b>01</b><span><strong>Санаа ав</strong>Сэдвийн төлөвлөгөө, хэрэгтэй хэллэгүүд.</span></li>
       <li><b>02</b><span><strong>Бич</strong>Цаг тавиад, зорилтот үгийн тоонд хүр.</span></li>
       <li><b>03</b><span><strong>Шалгуул</strong>Алдаа бүрийг нэг товшилтоор засна.</span></li>
      </ol>
      {signedIn&&<button type="button" className={styles.secondary} onClick={()=>void run("ideas")}>✦ Санаа авах</button>}
     </div>
     :draft.action==="ideas"&&reply.ideas?<div className={styles.ideas}>
      <p className={styles.angle}>{reply.ideas.angle}</p>
      <ol className={styles.outline}>{reply.ideas.outline.map((item,i)=><li key={i}>{item}</li>)}</ol>
      <h3>Хэрэгтэй хэллэг <small>· дарж оруулна</small></h3>
      <div className={styles.phrases}>{reply.ideas.phrases.map(p=><button key={p} type="button" onClick={()=>insert(p)}>{p}</button>)}</div>
     </div>
     :<>
      {report&&<div className={styles.score}>
       <div className={styles.overall}><strong>{report.overall.toFixed(1)}</strong><span>Тооцоолсон band</span></div>
       <ul className={styles.criteria}>{criteria.map(([label,value])=><li key={label}><span>{label}</span><i aria-hidden="true"><b style={{transform:`scaleX(${value/9})`}}/></i><em>{value.toFixed(1)}</em></li>)}</ul>
      </div>}
      <div className={styles.tabs} role="tablist">
       <button type="button" role="tab" aria-selected={tab==="fixes"} onClick={()=>setTab("fixes")}>Засвар{open.length?<em>{open.length}</em>:null}</button>
       {report&&<button type="button" role="tab" aria-selected={tab==="words"} onClick={()=>setTab("words")}>Үг хэллэг{reply.words.length?<em>{reply.words.length}</em>:null}</button>}
       {report&&<button type="button" role="tab" aria-selected={tab==="summary"} onClick={()=>setTab("summary")}>Дүгнэлт</button>}
      </div>
      {tab==="fixes"&&<div className={styles.fixes}>
       {!fixes.length&&<p className={styles.clean}>✓ Алдаа олдсонгүй. Сайн байна!</p>}
       {open.length>1&&<button type="button" className={styles.link} onClick={applyAll}>Бүгдийг засах ({open.length})</button>}
       {fixes.map(({fix,index,done,skipped})=><article key={index} id={`fix-${index}`} className={styles.fix} data-state={done?"done":skipped?"skipped":undefined} data-active={active===index?"":undefined} onMouseEnter={()=>setActive(index)} onMouseLeave={()=>setActive(null)}>
        <span className={styles.kind} data-kind={fix.kind}>{KIND_LABEL[fix.kind]}</span>
        <p className={styles.diff}><s>{fix.original}</s><span aria-hidden="true">→</span><ins>{fix.better||"(устгах)"}</ins></p>
        {fix.why&&<p className={styles.why}>{fix.why}</p>}
        {done?<span className={styles.status}>✓ Засагдсан</span>:skipped?<button type="button" className={styles.link} onClick={()=>edit({dismissed:draft.dismissed.filter(d=>d!==fix.original)})}>Буцаах</button>
         :<div className={styles.fixActions}><button type="button" className={styles.apply} onClick={()=>apply(fix)}>Засах</button><button type="button" className={styles.link} onClick={()=>edit({dismissed:[...draft.dismissed,fix.original]})}>Алгасах</button></div>}
       </article>)}
      </div>}
      {tab==="words"&&report&&<div className={styles.words}>
       {!reply.words.length&&<p className={styles.clean}>Үгийн сонголт тань тохиромжтой байна.</p>}
       {reply.words.map(w=><article key={w.word} className={styles.word}><p><s>{w.word}</s><span aria-hidden="true">→</span><button type="button" onClick={()=>insert(w.better)} title="Бичвэрт оруулах">{w.better}</button></p>{w.example&&<p className={styles.why}>“{w.example}”</p>}</article>)}
      </div>}
      {tab==="summary"&&report&&<div className={styles.summary}>
       <p>{report.summary}</p>
       {report.strengths.length>0&&<><h3>Сайн тал</h3><ul>{report.strengths.map(s=><li key={s}>{s}</li>)}</ul></>}
       {report.next.length>0&&<><h3>Дараагийн алхам</h3><ul>{report.next.map(s=><li key={s}>{s}</li>)}</ul></>}
       {report.rewrite&&<><h3>Сайжруулсан хувилбар</h3><div className={styles.rewrite}><s>{report.rewrite.original}</s><p>{report.rewrite.better}</p></div></>}
      </div>}
     </>}
    </div>
    <p className={styles.note}>Илгээхэд даалгавар, бичвэр тань DeepSeek руу очно. Band нь албан ёсны IELTS үнэлгээ биш, дадлагын тооцоо.</p>
   </aside>
  </div>

  {history.length>0&&<section className={styles.history} aria-label="Сүүлийн үнэлгээнүүд">
   <h2>Ахиц</h2>
   <ol>{history.map(e=><li key={e.date} title={`${e.title} · ${e.words} үг`}><i style={{height:`${(e.overall/9)*100}%`}}/><strong>{e.overall.toFixed(1)}</strong><span>{new Date(e.date).toLocaleDateString("mn-MN",{month:"2-digit",day:"2-digit"})}</span></li>)}</ol>
  </section>}
 </div>;
}
