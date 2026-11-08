import { apiFailure,apiUser,checkOrigin,privateJson,readJson } from "@/lib/api";
import { resetPractice,savePractice,practiceView } from "@/modules/exam-practice/service";
type Context={params:Promise<{slug:string}>};
export async function GET(request:Request,{params}:Context){
  try{const user=await apiUser(request);return privateJson(await practiceView(user.id,(await params).slug));}catch(error){return apiFailure(error);}
}
export async function PATCH(request:Request,{params}:Context){
  try{checkOrigin(request);const user=await apiUser(request);return privateJson(await savePractice(user.id,(await params).slug,await readJson(request,65536)));}catch(error){return apiFailure(error);}
}
export async function DELETE(request:Request,{params}:Context){
  try{checkOrigin(request);const user=await apiUser(request);return privateJson(await resetPractice(user.id,(await params).slug));}catch(error){return apiFailure(error);}
}
