// Per-browser practice history and phrasebook. Never sent to the server or the student's account.
import type {SpeakingTopic} from "./contracts";

export type ProgressEntry={date:string;mode:"mock"|"practice";topic:SpeakingTopic;part:number|null;bands:{fluency:number;lexical:number;grammar:number};overall:number;wpm:number|null};
export type SavedPhrase={id:string;text:string;note:string};
export type Progress={entries:ProgressEntry[];phrases:SavedPhrase[]};

const KEY="education-speaking-lab-v1",EMPTY:Progress={entries:[],phrases:[]};
let cache:Progress|null=null;
const listeners=new Set<()=>void>();

function read():Progress {
 try {
  const raw=JSON.parse(localStorage.getItem(KEY)??"null");
  if(!raw||!Array.isArray(raw.entries)||!Array.isArray(raw.phrases))return EMPTY;
  const entries=raw.entries.filter((e:ProgressEntry)=>e&&typeof e.overall==="number"&&typeof e.date==="string"&&e.bands).slice(-30);
  const phrases=raw.phrases.filter((p:SavedPhrase)=>p&&typeof p.id==="string"&&typeof p.text==="string"&&typeof p.note==="string").slice(-200);
  return {entries,phrases};
 }catch{return EMPTY;}
}
export const getProgress=()=>cache??=read();
export const getServerProgress=()=>EMPTY;
export function subscribeProgress(listener:()=>void) {
 listeners.add(listener);
 const onStorage=(event:StorageEvent)=>{if(event.key===KEY){cache=null;listener();}};
 window.addEventListener("storage",onStorage);
 return()=>{listeners.delete(listener);window.removeEventListener("storage",onStorage);};
}
export function updateProgress(change:(current:Progress)=>Progress) {
 cache=change(getProgress());
 try{localStorage.setItem(KEY,JSON.stringify(cache));}catch{/* Storage can be unavailable; the page keeps working for this visit. */}
 for(const listener of listeners)listener();
}
export function savePhrase(text:string,note:string) {
 const id=text.trim().toLowerCase();
 updateProgress(current=>current.phrases.some(p=>p.id===id)?current:{...current,phrases:[...current.phrases,{id,text:text.trim(),note:note.trim()}].slice(-200)});
}
export function removePhrase(id:string){updateProgress(current=>({...current,phrases:current.phrases.filter(p=>p.id!==id)}));}
export function clearProgress(){updateProgress(()=>EMPTY);}
