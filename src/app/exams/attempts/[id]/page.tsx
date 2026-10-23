import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { ApiError } from "@/lib/api";
import { accessMock } from "@/modules/exams/service";
import { ExamRunner } from "@/modules/exams/runner";
import { MockAccessRequired } from "@/modules/exams/payments";
export const metadata:Metadata={title:"Бүтэн шалгалт"};
export default async function MockAttemptPage({params}:{params:Promise<{id:string}>}){
  const user=await requireUser();
  let attempt;
  try{attempt=await accessMock((await params).id,user.id);}
  catch(error){if(error instanceof MockAccessRequired)redirect("/checkout/"+error.slug);if(error instanceof ApiError&&error.status===404)notFound();throw error;}
  return <ExamRunner initial={attempt}/>;
}
