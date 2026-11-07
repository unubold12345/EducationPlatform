import type { ExamDefinition, ExamState, ExamQuestion, ExamReport } from "./types.ts";

export function createExamState(definition:ExamDefinition, now:number):ExamState {
  return {version:1,definition:structuredClone(definition),stageIndex:0,stageStartedAt:new Date(now).toISOString(),deadline:new Date(now+definition.stages[0].seconds*1000).toISOString(),responses:{},flags:[],routes:{},completed:[],finishedAt:null};
}
export function stageFor(state:ExamState) {
  const stage=state.definition.stages[state.stageIndex];
  if (!stage) return null;
  return stage.variants ? {...stage,questions:stage.variants[state.routes[stage.id] ?? "lower"]} : stage;
}
export function normalise(value:string) { return value.normalize("NFKC").trim().toLocaleLowerCase("en").replace(/[’]/g,"'").replace(/\s+/g," "); }
function numeric(value:string) {
  const v=value.trim().replaceAll("−","-").replaceAll(",",".");
  if (/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(v)) { const number=Number(v); return Number.isFinite(number) ? number : null; }
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)\/[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(v)) return null;
  const parts=v.split("/").map(Number); const number=parts[0]/parts[1];
  return Number.isFinite(number) ? number : null;
}
const superscripts:Record<string,string>={"⁰":"0","¹":"1","²":"2","³":"3","⁴":"4","⁵":"5","⁶":"6","⁷":"7","⁸":"8","⁹":"9","⁻":"-","⁺":"+"};
/** Compare typed mathematics without demanding one exact spelling of the same expression. */
export function normaliseMath(value:string) {
  let text=value.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+/g,group=>"^"+[...group].map(char=>superscripts[char]??"").join(""));
  text=text.normalize("NFKC").toLocaleLowerCase("en").trim();
  return text
    .replace(/[−–—]/g,"-").replace(/[×·∗]/g,"*").replace(/÷/g,"/")
    .replace(/π/g,"pi").replace(/∞/g,"inf")
    .replace(/√/g,"sqrt").replace(/sqrt\(([0-9a-z./]+)\)/g,"sqrt$1")
    .replace(/≤/g,"<=").replace(/≥/g,">=").replace(/≠/g,"!=").replace(/±/g,"+-")
    .replace(/[{}]/g,char=>char==="{"?"(":")")
    .replace(/,/g,";").replace(/\s+/g,"").replace(/\.$/,"");
}
export function normaliseText(value:string) {
  return value.normalize("NFKC").trim().toLocaleLowerCase("en").replace(/ё/g,"е").replace(/[−–—]/g,"-").replace(/\s+/g," ").replace(/[.!?]+$/,"");
}
/** Numbers, fractions and mathematics that evaluate to the same value are equal. */
function close(a:number,b:number) {
  // Four decimal places are accepted for ordinary numbers, while very small physics values
  // (10⁻¹⁴) keep a relative tolerance so zero cannot pass as the answer.
  const tolerance=Math.abs(b)>=0.000001?Math.max(0.000000001,Math.abs(b)*0.0001):Math.abs(b)*0.000001;
  return Math.abs(a-b)<=tolerance;
}
function sameNumber(left:string,right:string) {
  const a=numeric(left),b=numeric(right);
  return a!==null&&b!==null&&close(a,b);
}
export function isCorrect(question:ExamQuestion,response:string) {
  if (question.kind==="essay" || question.kind==="speaking") return null;
  if (!response.trim()) return false;
  const matcher=question.matcher ?? (question.kind==="number"?"numeric":question.kind==="short"?"text":"choice");
  if (matcher==="numeric") {
    const value=numeric(response);
    return value!==null && question.answers.some(answer=>{const target=numeric(answer);return target!==null && close(value,target);});
  }
  if (matcher==="math") {
    const given=normaliseMath(response);
    return question.answers.some(answer=>{
      if (given===normaliseMath(answer)) return true;
      if (sameNumber(given,normaliseMath(answer))) return true;
      // A decimal and the exact fraction it names are the same answer.
      const target=numeric(answer);
      const typed=numeric(response);
      return target!==null&&typed!==null&&close(target,typed);
    });
  }
  if (matcher==="text") {
    const given=normaliseText(response);
    return question.answers.some(answer=>normaliseText(answer)===given);
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
    const limit=q.kind==="essay" ? 16000 : q.kind==="speaking" ? 4000 : q.kind==="choice" ? Math.max(120,...(q.options??[]).map(option=>option.length)) : 160;
    if(value.length>limit)return false;
    return q.kind!=="choice" || value==="" || !!q.options?.includes(value);
  });
}
export function editExam(state:ExamState,input:{responses:Record<string,string>;flags:string[]}) {
  Object.assign(state.responses,input.responses);
  const currentIds=new Set(stageFor(state)!.questions.map(q=>q.id));
  state.flags=[...state.flags.filter(id=>!currentIds.has(id)),...new Set(input.flags)];
}
const pointsOf=(question:ExamQuestion)=>question.points??1;
export function makeReport(state:ExamState):ExamReport {
  const seen=new Set<string>(); const reviews:ExamReport["reviews"]=[];
  for (const stage of state.definition.stages) {
    if (stage.kind==="preparation") continue;
    const questions=stage.variants ? stage.variants[state.routes[stage.id]??"lower"] : stage.questions;
    for (const q of questions) {
      if (seen.has(q.id)) continue;seen.add(q.id);
      const correct=isCorrect(q,state.responses[q.id]??"");
      const points=pointsOf(q);
      const group=stage.groups?.find(item=>item.id===q.groupId);
      const shared=group&&(group.pageMode==="group"||group.kind==="listening")?group:undefined;
      const figure=q.figure??shared?.figure;
      reviews.push({id:q.id,domain:q.domain,prompt:q.prompt,passage:state.definition.stages.flatMap(s=>s.passages??[]).find(p=>p.title===q.passage)?.text ?? q.passage,selected:state.responses[q.id]??"",answer:q.answerDisplay??q.answers.join(" / "),explanation:q.explanation,correct,pretest:!!q.pretest,...(figure?{figure}:{}),points,earned:correct===null?null:correct?points:0,number:q.number,...(shared?.instructions?{instructions:shared.instructions}:{}),...(shared?.context?{context:shared.context}:{}),...(shared?.contextTitle?{contextTitle:shared.contextTitle}:{})});
    }
  }
  // ЭЕШ papers report marks by subject skill; SAT and IELTS keep their existing section names.
  const program=state.definition.program;
  const names=program==="sat" ? ["Reading & Writing","Math"] : program==="entrance" ? [...new Set(reviews.filter(q=>!q.pretest).map(q=>q.domain))] : ["Listening","Academic Reading","Writing","Speaking"];
  const sections=names.map(title=>{
    const list=reviews.filter(q=>!q.pretest&&(program==="sat" ? (title==="Reading & Writing" ? q.id.startsWith("sat-rw") : q.id.startsWith("sat-math")) : program==="entrance" || q.domain===title));
    const graded=list.filter(q=>q.correct!==null);
    return {title,correct:list.filter(q=>q.correct===true).length,total:graded.length,pending:list.filter(q=>q.correct===null).length,points:graded.reduce((sum,q)=>sum+q.points,0),earned:graded.reduce((sum,q)=>sum+q.earned!,0)};
  });
  const graded=reviews.filter(q=>!q.pretest&&q.correct!==null);
  return {sections,reviews,points:{total:graded.reduce((sum,q)=>sum+q.points,0),earned:graded.reduce((sum,q)=>sum+q.earned!,0)}};
}
