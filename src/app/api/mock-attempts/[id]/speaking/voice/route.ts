import {apiFailure,apiUser,checkOrigin,readJson} from "@/lib/api";
import {examinerVoice} from "@/modules/exams/speaking-examiner-service";
export const runtime="nodejs";
export const maxDuration=180;
type Context={params:Promise<{id:string}>};
// The AI examiner's voice during a Speaking stage of the student's own IELTS mock.
export async function POST(request:Request,{params}:Context) {
 try {
  checkOrigin(request);const user=await apiUser(request);
  const stream=await examinerVoice((await params).id,user.id,await readJson(request,2000));
  return new Response(stream,{headers:{"Content-Type":"application/x-speaking-frames","Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
 }catch(error){return apiFailure(error);}
}
