import {apiFailure,apiUser,checkOrigin,privateJson} from "@/lib/api";
import {endMock} from "@/modules/exams/service";
type Context={params:Promise<{id:string}>};
// Stops the student's own open timed sitting and discards it (never reviewed); same origin only.
export async function POST(request:Request,{params}:Context) {
 try{checkOrigin(request);const user=await apiUser(request);return privateJson(await endMock((await params).id,user.id));}
 catch(error){return apiFailure(error);}
}
