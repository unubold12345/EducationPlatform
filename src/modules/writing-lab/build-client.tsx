"use client";
// TOEFL Essay Studio → Build a Sentence (2026-11-19): ten replies per set, built from boxes and checked here, with no AI.
// The item view is the TOEFL mocks' own (`exams/toefl/view.tsx`), so practice looks like the test.
import {useState,useSyncExternalStore} from "react";
import {BuildTask} from "@/modules/exams/toefl/view";
import {BUILD_FOCUS,BUILD_SETS,buildCorrect,buildTask,findBuildSet,placedBoxes} from "./build-sentence";
import {getServerStudio,getStudio,subscribeStudio,updateStudio} from "./progress";
import styles from "./writing.module.css";

type Round={set:string;at:number;answers:Record<string,string>;checked:Record<string,boolean>};
const fresh=(set:string):Round=>({set,at:0,answers:{},checked:{}});

export function BuildPractice() {
 const studio=useSyncExternalStore(subscribeStudio,getStudio,getServerStudio);
 const [round,setRound]=useState<Round>(()=>fresh(BUILD_SETS[0].id));
 const set=findBuildSet(round.set)??BUILD_SETS[0],done=round.at>=set.items.length;
 const item=done?null:set.items[round.at];
 const value=item?round.answers[item.id]??"":"";
 const checked=item?round.checked[item.id]:undefined;
 const right=set.items.filter(entry=>round.checked[entry.id]&&buildCorrect(entry,round.answers[entry.id]??"")).length;
 // Checked only once every box is filled (the view stops taking boxes then).
 const full=!!item&&placedBoxes(item,value).length===item.chips.length;

 const choose=(id:string)=>{if(id===round.set)return;setRound(fresh(id));};
 const check=()=>{
  if(!item)return;
  const next={...round,checked:{...round.checked,[item.id]:true}};
  setRound(next);
  // The set's score is saved once its last item is checked.
  if(set.items.every(entry=>next.checked[entry.id]))updateStudio(s=>({...s,build:{...s.build,[set.id]:set.items.filter(entry=>buildCorrect(entry,next.answers[entry.id]??"")).length}}));
 };

 return <section className={`toefl-practice ${styles.build}`} aria-label="Build a Sentence">
  <div className={styles.buildHead}>
   <div>
    <h2>Build a Sentence</h2>
    <p>Хоёр хүний ярианы хариу өгүүлбэрийг хайрцгуудаас зөв дарааллаар бүтээнэ. Шалгалтад 10 өгүүлбэр, нийт 23 минутын Writing-ийн эхний хэсэг. Хариуг энд шууд шалгана, AI ашиглахгүй.</p>
   </div>
   <div className={styles.buildSets} role="tablist" aria-label="Өгүүлбэрийн багц">
    {BUILD_SETS.map(entry=><button key={entry.id} type="button" role="tab" aria-selected={entry.id===set.id} onClick={()=>choose(entry.id)}>
     {entry.title}<small>{studio.build[entry.id]!==undefined?`Сүүлд ${studio.build[entry.id]}/${entry.items.length}`:`${entry.items.length} өгүүлбэр`}</small>
    </button>)}
   </div>
  </div>

  <ol className={styles.buildDots} aria-label="Явц">
   {set.items.map((entry,at)=>{
    const state=round.checked[entry.id]?(buildCorrect(entry,round.answers[entry.id]??"")?"right":"wrong"):at===round.at?"current":undefined;
    return <li key={entry.id} data-state={state}><button type="button" onClick={()=>setRound({...round,at})} aria-label={`${at+1}-р өгүүлбэр${state==="right"?" · зөв":state==="wrong"?" · буруу":""}`} aria-current={at===round.at?"step":undefined}>{at+1}</button></li>;
   })}
  </ol>

  {item?<div className={styles.buildCard}>
   <p className={styles.buildCount}>{round.at+1} / {set.items.length}</p>
   <BuildTask key={item.id} build={buildTask(item)} value={value} disabled={checked} number={String(round.at+1)} onChange={next=>setRound({...round,answers:{...round.answers,[item.id]:next}})}/>
   {checked&&<div className={styles.buildResult} data-right={buildCorrect(item,value)?"":undefined} role="status">
    <strong>{buildCorrect(item,value)?"✓ Зөв":"✗ Буруу"}</strong>
    <p lang="en">{item.answer}</p>
    {!buildCorrect(item,value)&&<p className={styles.buildWhy}>{BUILD_FOCUS[item.focus]}</p>}
   </div>}
   <div className={styles.buildActions}>
    {!checked
     ?<button type="button" className={styles.primary} disabled={!full} onClick={check}>Шалгах</button>
     :<button type="button" className={styles.primary} onClick={()=>setRound({...round,at:round.at+1})}>{round.at+1<set.items.length?"Дараагийн →":"Дүнг харах →"}</button>}
    {!checked&&value&&<button type="button" className={styles.link} onClick={()=>setRound({...round,answers:{...round.answers,[item.id]:""}})}>Цэвэрлэх</button>}
   </div>
  </div>
  :<div className={styles.buildCard}>
   <p className={styles.buildScore}><strong>{right}</strong> / {set.items.length} зөв</p>
   <ol className={styles.buildReview}>{set.items.map(entry=>{
    const ok=buildCorrect(entry,round.answers[entry.id]??"");
    return <li key={entry.id} data-right={ok?"":undefined}><span aria-hidden="true">{ok?"✓":"✗"}</span><p lang="en">{entry.answer}</p></li>;
   })}</ol>
   <div className={styles.buildActions}>
    <button type="button" className={styles.primary} onClick={()=>setRound(fresh(set.id))}>Дахин эхлэх</button>
    {BUILD_SETS.some(entry=>entry.id!==set.id)&&<button type="button" className={styles.secondary} onClick={()=>{const index=BUILD_SETS.findIndex(entry=>entry.id===set.id);setRound(fresh(BUILD_SETS[(index+1)%BUILD_SETS.length].id));}}>Дараагийн багц</button>}
   </div>
  </div>}
 </section>;
}
