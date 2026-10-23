import "server-only";
import { getDb } from "@/lib/db";
import { findExercise,exerciseSets } from "@/modules/exercises/content";
import { findExam } from "@/modules/exams/definitions";
import { guidedTasks } from "@/modules/exercises/guided";
import type { ExerciseSet } from "@/modules/exercises/types";
import type { ExamDefinition } from "@/modules/exams/types";
export function sourceContent(key:string) { return findExercise(key)??findExam(key)??guidedTasks.find(task=>task.slug===key); }
export async function publishedRecord(key:string) {return getDb().publishedContent.findFirst({where:{key},orderBy:{version:"desc"}});}
export async function getExercise(key:string,examId?:string):Promise<ExerciseSet|undefined> {
  const base=findExercise(key);if(!base)return;
  if(examId===base.examId)return base;
  const version=examId?.startsWith(key+"-published-v")?Number(examId.slice((key+"-published-v").length)):undefined;
  if(examId&&(!Number.isInteger(version)||Number(version)<2))return;
  const record=version?await getDb().publishedContent.findUnique({where:{key_version:{key,version}}}):await publishedRecord(key);
  if(!record)return examId?undefined:base;
  const body=record.body as unknown as ExerciseSet;
  return {...body,examId:`${key}-published-v${record.version}`,questions:body.questions.map(q=>({...q,id:q.id.replace(/-v1$/,"-published-v"+record.version)}))};
}
export async function getExercises(){return Promise.all(exerciseSets.map(set=>getExercise(set.slug).then(value=>value!)));}
export async function getExam(key:string):Promise<ExamDefinition|undefined> {
  const base=findExam(key);if(!base)return;
  const record=await publishedRecord(key);return record?{...record.body as unknown as ExamDefinition,version:record.version}:base;
}
export async function getWorkshop(key:string) {
  const base=guidedTasks.find(task=>task.slug===key);if(!base)return;
  const record=await publishedRecord(key);return record?record.body as unknown as typeof base:base;
}
