// Per-browser drafts and feedback history. Never sent to the server or the student's account.
import type {SpellDialect} from "./spelling";
import {writingPrompts,type WritingAction,type WritingBands,type WritingReply,type WritingTask} from "./contracts";

export type Draft={promptId:string|null;topic:string;essay:string;reply:WritingReply|null;action:WritingAction|null;checked:string;dismissed:string[]};
export type HistoryEntry={date:string;task:WritingTask;title:string;words:number;overall:number;bands:WritingBands};
export type Studio={task:WritingTask;language:"mn"|"en";spelling:SpellDialect|"off";words:string[];drafts:Partial<Record<WritingTask,Draft>>;history:HistoryEntry[]};

const KEY="education-writing-lab-v1",EMPTY:Studio={task:"essay",language:"mn",spelling:"uk",words:[],drafts:{},history:[]};
let cache:Studio|null=null,timer:ReturnType<typeof setTimeout>|undefined;
const listeners=new Set<()=>void>();

export function blankDraft(task:WritingTask,promptId?:string):Draft {
 return {promptId:task==="free"?null:promptId??writingPrompts.find(p=>p.task===task)!.id,topic:"",essay:"",reply:null,action:null,checked:"",dismissed:[]};
}
function read():Studio {
 try {
  const raw=JSON.parse(localStorage.getItem(KEY)??"null");
  if(!raw||typeof raw!=="object"||!["essay","letter","free"].includes(raw.task))return EMPTY;
  const drafts:Studio["drafts"]={};
  for(const task of ["essay","letter","free"] as WritingTask[]){
   const d=raw.drafts?.[task];
   if(d&&typeof d.essay==="string"&&typeof d.topic==="string"&&Array.isArray(d.dismissed)&&(task==="free"?d.promptId===null:writingPrompts.some(p=>p.id===d.promptId&&p.task===task)))drafts[task]={...blankDraft(task),...d};
  }
  const history=Array.isArray(raw.history)?raw.history.filter((e:HistoryEntry)=>e&&typeof e.overall==="number"&&typeof e.date==="string"&&e.bands).slice(-30):[];
  const words=Array.isArray(raw.words)?raw.words.filter((w:unknown)=>typeof w==="string"&&w.length<=40).slice(-300):[];
  return {task:raw.task,language:raw.language==="en"?"en":"mn",spelling:["uk","us","off"].includes(raw.spelling)?raw.spelling:"uk",words,drafts,history};
 }catch{return EMPTY;}
}
export const getStudio=()=>cache??=read();
export const getServerStudio=()=>EMPTY;
function flush(){
 clearTimeout(timer);timer=undefined;
 if(cache)try{localStorage.setItem(KEY,JSON.stringify(cache));}catch{/* Storage can be unavailable; the page keeps working for this visit. */}
}
export function subscribeStudio(listener:()=>void) {
 listeners.add(listener);
 const onStorage=(event:StorageEvent)=>{if(event.key===KEY){cache=null;listener();}};
 // Leaving the page writes any pending change at once, so a fresh result is never lost to the debounce.
 const onHide=()=>{if(timer!==undefined)flush();};
 window.addEventListener("storage",onStorage);window.addEventListener("pagehide",onHide);
 return()=>{listeners.delete(listener);window.removeEventListener("storage",onStorage);window.removeEventListener("pagehide",onHide);};
}
// Typing updates the in-memory copy at once and writes to storage shortly after, so keystrokes stay cheap.
export function updateStudio(change:(current:Studio)=>Studio) {
 cache=change(getStudio());
 clearTimeout(timer);
 timer=setTimeout(flush,300);
 for(const listener of listeners)listener();
}
