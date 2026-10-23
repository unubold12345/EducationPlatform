// Pure validation shared by unit tests and the admin publishing service.
import { isCorrect } from "../exams/engine.ts";
import type { ExamQuestion } from "../exams/types.ts";
const immutable=new Set(["slug","program","examId","id","version","seconds","kind","pretest","minWords","maxWords","minutes","audioPart","skill","url"]);
export function validateContentShape(base:unknown,value:unknown,field=""):boolean {
  if(base===undefined)return value===undefined;
  if(base===null)return value===null;
  if(immutable.has(field))return JSON.stringify(base)===JSON.stringify(value);
  if(Array.isArray(base))return Array.isArray(value)&&base.length===value.length&&base.every((item,i)=>validateContentShape(item,value[i],field));
  if(typeof base==="object") {
    if(!value||typeof value!=="object"||Array.isArray(value))return false;
    const original=base as Record<string,unknown>;const candidate=value as Record<string,unknown>;
    const keys=Object.keys(original).filter(key=>original[key]!==undefined);
    return keys.length===Object.keys(candidate).length&&keys.every(key=>Object.hasOwn(candidate,key)&&validateContentShape(original[key],candidate[key],key));
  }
  if(typeof base==="string")return typeof value==="string"&&(base.length===0||value.trim().length>0)&&value.length<=25000&&!value.includes("\u0000");
  if(typeof base==="boolean")return typeof value==="boolean";
  if(typeof base==="number")return typeof value==="number"&&Number.isFinite(value)&&Number.isInteger(value)&&value>=0&&value<=20;
  return false;
}
export function validateAnswerKeys(value:unknown):boolean {
  if(!value||typeof value!=="object")return true;
  if(Array.isArray(value))return value.every(validateAnswerKeys);
  const item=value as Record<string,unknown>;
  if(item.kind==="number"&&(!Array.isArray(item.answers)||!item.answers.every(answer=>typeof answer==="string"&&isCorrect(item as unknown as ExamQuestion,answer)===true)))return false;
  if(item.kind==="short"&&Array.isArray(item.answers)&&typeof item.maxWords==="number"&&item.answers.some(answer=>typeof answer!=="string"||answer.trim().split(/\s+/).length>Number(item.maxWords)))return false;
  if(Array.isArray(item.options)) {
    if(new Set(item.options).size!==item.options.length)return false;
    if("correct" in item&&(!Number.isInteger(item.correct)||Number(item.correct)<0||Number(item.correct)>=item.options.length))return false;
    const options=item.options;
    if(item.kind==="choice"&&(!Array.isArray(item.answers)||!item.answers.length||!item.answers.every(answer=>options.includes(answer))))return false;
  }
  return Object.values(item).every(validateAnswerKeys);
}
