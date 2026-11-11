import {apiFailure,apiUser,checkOrigin,readJson} from "@/lib/api";
import {practiceExaminerVoice} from "@/modules/exam-practice/speaking";
export const runtime="nodejs";
export const maxDuration=180;
type Context={params:Promise<{slug:string}>};
// The AI examiner's voice in practice mode's IELTS Speaking sections.
export async function POST(request:Request,{params}:Context) {
 try {
  checkOrigin(request);const user=await apiUser(request);
  const stream=await practiceExaminerVoice(user.id,(await params).slug,await readJson(request,2000));
  return new Response(stream,{headers:{"Content-Type":"application/x-speaking-frames","Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
 }catch(error){return apiFailure(error);}
}
