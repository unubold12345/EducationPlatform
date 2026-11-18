import {apiFailure,apiUser,checkOrigin,privateJson,readJson} from "@/lib/api";
import {gradeMock,mockGrades} from "@/modules/exams/ai-grading/service";
export const maxDuration=300;
type Context={params:Promise<{id:string}>};
// AI grades of a finished IELTS or TOEFL mock's Writing and Speaking: GET reads them, POST grades one part once.
export async function GET(request:Request,{params}:Context) {
 try{const user=await apiUser(request);return privateJson(await mockGrades((await params).id,user.id));}
 catch(error){return apiFailure(error);}
}
export async function POST(request:Request,{params}:Context) {
 try{checkOrigin(request);const user=await apiUser(request);return privateJson(await gradeMock((await params).id,user.id,await readJson(request,200)));}
 catch(error){return apiFailure(error);}
}
