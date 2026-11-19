// Per-browser drafts and feedback history. Never sent to the server or the student's account.
import type {SpellDialect} from "./spelling";
import {examTasks,writingPrompts,type WritingAction,type WritingBands,type WritingReply,type WritingTask} from "./contracts";

export type Draft={promptId:string|null;topic:string;essay:string;reply:WritingReply|null;action:WritingAction|null;checked:string;dismissed:string[]};
export type HistoryEntry={date:string;task:WritingTask;title:string;words:number;overall:number;bands:WritingBands};
/** The TOEFL studio's tab: Build a Sentence (no AI) or one of its two written tasks. */
export type ToeflView="build"|"email"|"discussion";
/**
 * `task` is the IELTS studio's tab and `toefl` the TOEFL studio's (2026-11-19); drafts and history are kept per task.
 * `build` holds the last Build a Sentence score of each set (correct answers out of its items).
 */
export type Studio={task:WritingTask;toefl:ToeflView;language:"mn"|"en";spelling:SpellDialect|"off";words:string[];drafts:Partial<Record<WritingTask,Draft>>;history:HistoryEntry[];build:Record<string,number>};

const KEY="education-writing-lab-v1",EMPTY:Studio={task:"essay",toefl:"build",language:"mn",spelling:"uk",words:[],drafts:{},history:[],build:{}};
const TASKS:WritingTask[]=[...examTasks("ielts"),...examTasks("toefl")];
let cache:Studio|null=null,timer:ReturnType<typeof setTimeout>|undefined;
const listeners=new Set<()=>void>();

export function blankDraft(task:WritingTask,promptId?:string):Draft {
 return {promptId:task==="free"?null:promptId??writingPrompts.find(p=>p.task===task)!.id,topic:"",essay:"",reply:null,action:null,checked:"",dismissed:[]};
}
function read():Studio {
 try {
  const raw=JSON.parse(localStorage.getItem(KEY)??"null");
  if(!raw||typeof raw!=="object")return EMPTY;
  const drafts:Studio["drafts"]={};
  for(const task of TASKS){
   const d=raw.drafts?.[task];
   if(d&&typeof d.essay==="string"&&typeof d.topic==="string"&&Array.isArray(d.dismissed)&&(task==="free"?d.promptId===null:writingPrompts.some(p=>p.id===d.promptId&&p.task===task)))drafts[task]={...blankDraft(task),...d};
  }
  const history=Array.isArray(raw.history)?raw.history.filter((e:HistoryEntry)=>e&&TASKS.includes(e.task)&&typeof e.overall==="number"&&typeof e.date==="string"&&e.bands).slice(-30):[];
  const words=Array.isArray(raw.words)?raw.words.filter((w:unknown)=>typeof w==="string"&&w.length<=40).slice(-300):[];
  const build:Record<string,number>={};
  if(raw.build&&typeof raw.build==="object")for(const [set,score] of Object.entries(raw.build))if(/^[a-z0-9-]{1,40}$/.test(set)&&typeof score==="number"&&score>=0&&score<=20)build[set]=score;
  return {
   task:examTasks("ielts").includes(raw.task)?raw.task:"essay",
   toefl:["build","email","discussion"].includes(raw.toefl)?raw.toefl:"build",
   language:raw.language==="en"?"en":"mn",spelling:["uk","us","off"].includes(raw.spelling)?raw.spelling:"uk",words,drafts,history,build,
  };
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
