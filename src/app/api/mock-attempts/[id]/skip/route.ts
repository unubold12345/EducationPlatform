import {apiFailure,apiUser,checkOrigin,privateJson,readJson} from "@/lib/api";
import {skipMock} from "@/modules/exams/service";
type Context={params:Promise<{id:string}>};
// Admin testing only: close the current stage (or all) of the admin's own open sitting; skipMock checks admin membership.
export async function POST(request:Request,{params}:Context) {
 try{checkOrigin(request);const user=await apiUser(request);return privateJson(await skipMock((await params).id,user.id,await readJson(request,65536)));}
 catch(error){return apiFailure(error);}
}
