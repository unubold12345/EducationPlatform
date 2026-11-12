import {apiFailure,apiUser,checkOrigin,privateJson} from "@/lib/api";
import {requireExaminerSitting} from "@/modules/exams/speaking-examiner-service";
import {speechModelStatus,warmSpeechModels} from "@/modules/speaking-lab/models";
import {after} from "next/server";
export const runtime="nodejs";
export const maxDuration=180;
type Context={params:Promise<{id:string}>};
// Starts loading the local speech models while the student is still in an earlier stage of the IELTS mock.
export async function POST(request:Request,{params}:Context) {
 try {
  checkOrigin(request);const user=await apiUser(request);await requireExaminerSitting((await params).id,user.id);
  const before=speechModelStatus();
  after(warmSpeechModels);
  return privateJson(before);
 }catch(error){return apiFailure(error);}
}
