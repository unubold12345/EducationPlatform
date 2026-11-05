import { apiFailure,apiUser,checkOrigin,privateJson,readJson } from "@/lib/api";
import { accessMock } from "@/modules/exams/service";
type Context={params:Promise<{id:string}>};
const knownStage=(request:Request)=>new URL(request.url).searchParams.get("have")?.slice(0,80);
export async function GET(request:Request,{params}:Context) {
  try {const user=await apiUser(request);return privateJson(await accessMock((await params).id,user.id,undefined,knownStage(request)));}catch(error){return apiFailure(error);}
}
export async function PATCH(request:Request,{params}:Context) {
  try {checkOrigin(request);const user=await apiUser(request);return privateJson(await accessMock((await params).id,user.id,await readJson(request,65536),knownStage(request)));}catch(error){return apiFailure(error);}
}
