import {apiFailure,apiUser,checkOrigin,privateJson,readJson} from "@/lib/api";
import {mockEssayReviews,reviewMockEssay} from "@/modules/exams/ai-grading/essay-review";
// A Claude review with high effort takes one to three minutes.
export const maxDuration=300;
type Context={params:Promise<{id:string}>};
// Essay Studio's detailed reviews of a finished IELTS mock's essays: GET lists them, POST makes one (credits or plan quota).
export async function GET(request:Request,{params}:Context) {
 try{const user=await apiUser(request);return privateJson(await mockEssayReviews((await params).id,user.id));}
 catch(error){return apiFailure(error);}
}
export async function POST(request:Request,{params}:Context) {
 try{checkOrigin(request);const user=await apiUser(request);return privateJson(await reviewMockEssay((await params).id,user.id,await readJson(request,200)));}
 catch(error){return apiFailure(error);}
}
