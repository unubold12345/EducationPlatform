// Browser-only records for the IELTS mock's AI examiner. Never sent to the server as stored data:
// the examiner choice per mock, which partner is the examiner, and per attempt the measured answer timing, the Part 2 notes and the last AI report.
import type {AnswerTiming,SpeakingReport,SpeakingVoice} from "@/modules/speaking-lab/contracts";
import {examinerVoiceOf} from "./speaking-examiner";

/** "ask" until the student has chosen on the start page or in the Speaking stage. */
export type ExaminerChoice="on"|"off"|"ask";
export type SavedSpeakingReport={data:SpeakingReport;target:number;language:"en"|"mn";date:string};
export type SpeakingRecord={timing:(AnswerTiming&{id:string})[];notes:string;report:SavedSpeakingReport|null};

const CHOICE="education-mock-examiner-v1:",RECORD="education-mock-speaking-v1:",VOICE="education-mock-examiner-voice-v1";
export const EMPTY_RECORD:SpeakingRecord={timing:[],notes:"",report:null};
const cache=new Map<string,unknown>(),listeners=new Set<()=>void>();

function read<T>(key:string,parse:(raw:string|null)=>T):T {
 if(cache.has(key))return cache.get(key) as T;
 let value:T;
 try{value=parse(localStorage.getItem(key));}catch{value=parse(null);}
 cache.set(key,value);return value;
}
function write(key:string,value:unknown,stored:string) {
 cache.set(key,value);
 try{localStorage.setItem(key,stored);}catch{/* Storage can be unavailable; the choice still holds for this visit. */}
 for(const listener of listeners)listener();
}
export function subscribeExaminer(listener:()=>void) {
 listeners.add(listener);
 const onStorage=(event:StorageEvent)=>{if(event.key===VOICE||event.key?.startsWith(CHOICE)||event.key?.startsWith(RECORD)){cache.delete(event.key);listener();}};
 window.addEventListener("storage",onStorage);
 return()=>{listeners.delete(listener);window.removeEventListener("storage",onStorage);};
}

export const examinerChoice=(slug:string):ExaminerChoice=>read(CHOICE+slug,raw=>raw==="on"||raw==="off"?raw:"ask");
export function setExaminerChoice(slug:string,choice:"on"|"off"){write(CHOICE+slug,choice,choice);}

/** Which partner conducts the Speaking test in this browser: one choice for every mock and practice session. */
export const examinerVoice=():SpeakingVoice=>read(VOICE,examinerVoiceOf);
export function setExaminerVoice(voice:SpeakingVoice){write(VOICE,voice,voice);}

function parseRecord(raw:string|null):SpeakingRecord {
 if(!raw)return EMPTY_RECORD;
 const value=JSON.parse(raw);
 if(!value||typeof value!=="object"||!Array.isArray(value.timing))return EMPTY_RECORD;
 const timing=value.timing.filter((entry:AnswerTiming&{id:string})=>entry&&typeof entry.id==="string"&&[1,2,3].includes(entry.part)&&[entry.seconds,entry.words,entry.pauses].every(n=>typeof n==="number"&&Number.isFinite(n)&&n>=0)).slice(-48);
 const report=value.report&&typeof value.report==="object"&&value.report.data?.bands&&typeof value.report.target==="number"?value.report as SavedSpeakingReport:null;
 return {timing,notes:typeof value.notes==="string"?value.notes.slice(0,4000):"",report};
}
export const speakingRecord=(attemptId:string):SpeakingRecord=>read(RECORD+attemptId,parseRecord);
export function updateSpeakingRecord(attemptId:string,change:(current:SpeakingRecord)=>SpeakingRecord) {
 const next=change(speakingRecord(attemptId));
 write(RECORD+attemptId,next,JSON.stringify(next));
}
