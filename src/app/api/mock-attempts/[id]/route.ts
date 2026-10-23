import { apiFailure,apiUser,checkOrigin,privateJson,readJson } from "@/lib/api";
import { accessMock } from "@/modules/exams/service";
type Context={params:Promise<{id:string}>};
export async function GET(request:Request,{params}:Context) {
  try {const user=await apiUser(request);return privateJson(await accessMock((await params).id,user.id));}catch(error){return apiFailure(error);}
}
export async function PATCH(request:Request,{params}:Context) {
  try {checkOrigin(request);const user=await apiUser(request);return privateJson(await accessMock((await params).id,user.id,await readJson(request,65536)));}catch(error){return apiFailure(error);}
}
