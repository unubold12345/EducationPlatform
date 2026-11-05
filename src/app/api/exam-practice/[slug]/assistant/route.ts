import { apiFailure,apiUser,checkOrigin,privateJson,readJson } from "@/lib/api";
import { practiceAssistantReply } from "@/modules/exam-practice/service";
export const maxDuration=75;
export async function POST(request:Request,{params}:{params:Promise<{slug:string}>}){
  try{checkOrigin(request);const user=await apiUser(request);return privateJson(await practiceAssistantReply(user.id,(await params).slug,await readJson(request,16000)));}catch(error){return apiFailure(error);}
}
