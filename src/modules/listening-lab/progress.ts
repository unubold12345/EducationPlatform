// Per-browser answers and scores for the Listening Lab. Never sent to the server or the student's account.
import {findListeningDrill,listeningDrills,type ListeningAnswer} from "./drills";

export type Answer=ListeningAnswer;
export type DrillState={answers:Record<number,Answer>;checked:boolean;best:number|null;attempts:number};
export type ListeningMode="practice"|"exam";
export type Lab={drill:string;mode:ListeningMode;speed:number;drills:Record<string,DrillState>};

const KEY="education-listening-lab-v2",SPEEDS=[0.75,0.9,1,1.15];
export const LISTENING_SPEEDS=SPEEDS;
const EMPTY:Lab={drill:listeningDrills[0].id,mode:"practice",speed:1,drills:{}};
export const blankDrillState=():DrillState=>({answers:{},checked:false,best:null,attempts:0});
let cache:Lab|null=null;
const listeners=new Set<()=>void>();

function read():Lab {
 try {
  const raw=JSON.parse(localStorage.getItem(KEY)??"null");
  if(!raw||typeof raw!=="object")return EMPTY;
  const drills:Lab["drills"]={};
  for(const [id,value] of Object.entries(raw.drills??{})){
   const drill=findListeningDrill(id),state=value as DrillState;if(!drill||!state||typeof state!=="object")continue;
   const answers:Record<number,Answer>={},questions=drill.groups.flatMap(g=>g.questions.map(question=>({question,options:g.options?.length??0})));
   for(const [index,answer] of Object.entries(state.answers??{})){
    const item=questions[Number(index)];if(!item)continue;
    const {question}=item,letter=(v:unknown,count:number)=>Number.isInteger(v)&&(v as number)>=0&&(v as number)<count;
    if(question.kind==="gap"&&typeof answer==="string"&&answer.length<=80)answers[Number(index)]=answer;
    if(question.kind==="choice"&&letter(answer,question.options.length))answers[Number(index)]=answer as number;
    if(question.kind==="match"&&letter(answer,item.options))answers[Number(index)]=answer as number;
    if(question.kind==="two"&&Array.isArray(answer)&&answer.length<=2&&answer.every(v=>letter(v,question.options.length)))answers[Number(index)]=answer as number[];
   }
   drills[id]={answers,checked:state.checked===true,best:typeof state.best==="number"?state.best:null,attempts:Number.isInteger(state.attempts)?state.attempts:0};
  }
  return {drill:findListeningDrill(raw.drill)?raw.drill:EMPTY.drill,mode:raw.mode==="exam"?"exam":"practice",speed:SPEEDS.includes(raw.speed)?raw.speed:1,drills};
 }catch{return EMPTY;}
}
export const getLab=()=>cache??=read();
export const getServerLab=()=>EMPTY;
export function subscribeLab(listener:()=>void) {
 listeners.add(listener);
 const onStorage=(event:StorageEvent)=>{if(event.key===KEY){cache=null;listener();}};
 window.addEventListener("storage",onStorage);
 return()=>{listeners.delete(listener);window.removeEventListener("storage",onStorage);};
}
export function updateLab(change:(current:Lab)=>Lab) {
 cache=change(getLab());
 try{localStorage.setItem(KEY,JSON.stringify(cache));}catch{/* Storage can be unavailable; the page keeps working for this visit. */}
 for(const listener of listeners)listener();
}
