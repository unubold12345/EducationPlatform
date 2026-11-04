import "server-only";
import { getDb } from "@/lib/db";
import { findExam } from "@/modules/exams/definitions";
import { guidedTasks } from "@/modules/workshops/guided";
import type { ExamDefinition } from "@/modules/exams/types";
export function sourceContent(key:string) { return findExam(key)??guidedTasks.find(task=>task.slug===key); }
export async function publishedRecord(key:string) {return getDb().publishedContent.findFirst({where:{key},orderBy:{version:"desc"}});}
export async function getExam(key:string):Promise<ExamDefinition|undefined> {
  const base=findExam(key);if(!base)return;
  const record=await publishedRecord(key);return record?{...record.body as unknown as ExamDefinition,version:record.version}:base;
}
export async function getWorkshop(key:string) {
  const base=guidedTasks.find(task=>task.slug===key);if(!base)return;
  const record=await publishedRecord(key);return record?record.body as unknown as typeof base:base;
}
