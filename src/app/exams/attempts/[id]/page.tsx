import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { ApiError } from "@/lib/api";
import { accessMock } from "@/modules/exams/service";
import { ExamRunner } from "@/modules/exams/runner";
import { MockAccessRequired } from "@/modules/exams/payments";
import { speakingLabEnabled } from "@/lib/local-pilot";
import { isAdmin } from "@/modules/admin/service";
export const metadata:Metadata={title:"Бүтэн шалгалт"};
export default async function MockAttemptPage({params}:{params:Promise<{id:string}>}){
  const user=await requireUser();
  let attempt;
  try{attempt=await accessMock((await params).id,user.id);}
  catch(error){if(error instanceof MockAccessRequired)redirect("/checkout/"+error.slug);if(error instanceof ApiError&&error.status===404)notFound();if(error instanceof ApiError&&error.status===410)redirect("/workspace/review?ended=1");throw error;}
  // Every finished mock's result is the Review page (2026-11-19); this address keeps working for old links.
  if(attempt.report)redirect("/workspace/review/"+attempt.id);
  // The Speaking Lab's AI examiner shares the Lab's pilot switch; the runner offers it in IELTS Speaking stages.
  // Admins see the skip controls on an open sitting; the skip route checks admin membership again.
  return <ExamRunner initial={attempt} examiner={speakingLabEnabled()} admin={await isAdmin(user.id)}/>;
}
