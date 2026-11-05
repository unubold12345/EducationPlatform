import { apiFailure,apiUser,checkOrigin,privateJson,readJson } from "@/lib/api";
import { checkPractice } from "@/modules/exam-practice/service";
export async function POST(request:Request,{params}:{params:Promise<{slug:string}>}){
  try{checkOrigin(request);const user=await apiUser(request);return privateJson(await checkPractice(user.id,(await params).slug,await readJson(request,65536)));}catch(error){return apiFailure(error);}
}
