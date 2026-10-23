import type { ExamDefinition, ExamState, ExamQuestion, ExamReport } from "./types.ts";

export function createExamState(definition:ExamDefinition, now:number):ExamState {
  return {version:1,definition:structuredClone(definition),stageIndex:0,stageStartedAt:new Date(now).toISOString(),deadline:new Date(now+definition.stages[0].seconds*1000).toISOString(),responses:{},flags:[],routes:{},completed:[],finishedAt:null};
}
export function stageFor(state:ExamState) {
  const stage=state.definition.stages[state.stageIndex];
  if (!stage) return null;
  return stage.variants ? {...stage,questions:stage.variants[state.routes[stage.id] ?? "lower"]} : stage;
}
function normalise(value:string) { return value.normalize("NFKC").trim().toLocaleLowerCase("en").replace(/[’]/g,"'").replace(/\s+/g," "); }
function numeric(value:string) {
  const v=value.trim().replaceAll("−","-");
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:\/[+-]?(?:\d+(?:\.\d*)?|\.\d+))?$/.test(v)) return null;
  const parts=v.split("/").map(Number); const number=parts.length===2 ? parts[0]/parts[1] : parts[0];
  return Number.isFinite(number) ? number : null;
}
export function isCorrect(question:ExamQuestion,response:string) {
  if (question.kind==="essay" || question.kind==="speaking") return null;
  if (!response.trim()) return false;
  if (question.kind==="number") {
    const value=numeric(response);
    return value!==null && question.answers.some(answer=>{const target=numeric(answer);return target!==null && Math.abs(value-target)<=0.00005;});
  }
  if (question.maxWords && response.trim().split(/\s+/).length>question.maxWords) return false;
  return question.answers.some(answer=>normalise(answer)===normalise(response));
}
export function expireStages(state:ExamState,now:number) {
  let changed=false;
  while (!state.finishedAt && now>=Date.parse(state.deadline)) {
    changed=true;
    const stage=stageFor(state)!;
    state.completed.push(stage.id);
    const nextIndex=state.stageIndex+1;
    if (nextIndex>=state.definition.stages.length) {state.finishedAt=state.deadline;state.stageIndex=nextIndex;break;}
    const next=state.definition.stages[nextIndex];
    if (next.variants) {
      const scored=stage.questions.filter(q=>!q.pretest);
      const correct=scored.filter(q=>isCorrect(q,state.responses[q.id]??"")).length;
      // Transparent practice threshold, NOT College Board's proprietary IRT routing.
      state.routes[next.id]=correct>=Math.ceil(scored.length*0.65) ? "higher" : "lower";
    }
    const start=Date.parse(state.deadline);
    state.stageIndex=nextIndex;state.stageStartedAt=new Date(start).toISOString();
    state.deadline=new Date(start+next.seconds*1000).toISOString();
  }
  return changed;
}
export function validateExamEdit(state:ExamState,input:unknown):input is {revision:number;stageId:string;responses:Record<string,string>;flags:string[]} {
  if (!input || typeof input!=="object") return false;
  const data=input as Record<string,unknown>; const stage=stageFor(state);
  if (!stage || state.finishedAt || data.stageId!==stage.id || !Number.isInteger(data.revision) || (data.revision as number)<0) return false;
  if (!data.responses || typeof data.responses!=="object" || Array.isArray(data.responses) || !Array.isArray(data.flags)) return false;
  const entries=Object.entries(data.responses); const ids=new Set(stage.questions.map(q=>q.id));
  if (entries.length>stage.questions.length || data.flags.length>stage.questions.length || !data.flags.every(id=>typeof id==="string"&&ids.has(id))) return false;
  return entries.every(([id,value])=>{
    const q=stage.questions.find(q=>q.id===id);
    if (!q || typeof value!=="string") return false;
    const limit=q.kind==="essay" ? 16000 : q.kind==="speaking" ? 4000 : q.kind==="choice" ? Math.max(120,...(q.options??[]).map(option=>option.length)) : 120;
    if(value.length>limit)return false;
    return q.kind!=="choice" || value==="" || !!q.options?.includes(value);
  });
}
export function editExam(state:ExamState,input:{responses:Record<string,string>;flags:string[]}) {
  Object.assign(state.responses,input.responses);
  const currentIds=new Set(stageFor(state)!.questions.map(q=>q.id));
  state.flags=[...state.flags.filter(id=>!currentIds.has(id)),...new Set(input.flags)];
}
export function makeReport(state:ExamState):ExamReport {
  const seen=new Set<string>(); const reviews:ExamReport["reviews"]=[];
  for (const stage of state.definition.stages) {
    if (stage.kind==="preparation") continue;
    const questions=stage.variants ? stage.variants[state.routes[stage.id]??"lower"] : stage.questions;
    for (const q of questions) {
      if (seen.has(q.id)) continue;seen.add(q.id);
      reviews.push({id:q.id,domain:q.domain,prompt:q.prompt,passage:q.passage?.startsWith("Reading passage") ? state.definition.stages.find(s=>s.passages)?.passages?.find(p=>p.title===q.passage)?.text : q.passage,selected:state.responses[q.id]??"",answer:q.answers.join(" / "),explanation:q.explanation,correct:isCorrect(q,state.responses[q.id]??""),pretest:!!q.pretest});
    }
  }
  const names=state.definition.program==="sat" ? ["Reading & Writing","Math"] : ["Listening","Academic Reading","Writing","Speaking"];
  const sections=names.map(title=>{
    const list=reviews.filter(q=>!q.pretest&&(state.definition.program==="sat" ? (title==="Reading & Writing" ? q.id.startsWith("sat-rw") : q.id.startsWith("sat-math")) : q.domain===title));
    return {title,correct:list.filter(q=>q.correct===true).length,total:list.filter(q=>q.correct!==null).length,pending:list.filter(q=>q.correct===null).length};
  });
  return {sections,reviews};
}
