import {apiFailure,apiUser,checkOrigin,privateJson,readJson} from "@/lib/api";
import {mockSpeakingReport} from "@/modules/exams/speaking-examiner-service";
export const maxDuration=180;
type Context={params:Promise<{id:string}>};
// The AI report on the Speaking transcripts of a finished IELTS mock (credits; never during an open sitting).
export async function POST(request:Request,{params}:Context) {
 try{checkOrigin(request);const user=await apiUser(request);return privateJson(await mockSpeakingReport((await params).id,user.id,await readJson(request,8000)));}
 catch(error){return apiFailure(error);}
}
