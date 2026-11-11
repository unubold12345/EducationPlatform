import {apiFailure,apiUser,checkOrigin,privateJson,readJson} from "@/lib/api";
import {practiceSpeakingReport} from "@/modules/exam-practice/speaking";
export const maxDuration=180;
type Context={params:Promise<{slug:string}>};
// The AI report on the Speaking transcripts saved in practice mode (credits).
export async function POST(request:Request,{params}:Context) {
 try{checkOrigin(request);const user=await apiUser(request);return privateJson(await practiceSpeakingReport(user.id,(await params).slug,await readJson(request,8000)));}
 catch(error){return apiFailure(error);}
}
