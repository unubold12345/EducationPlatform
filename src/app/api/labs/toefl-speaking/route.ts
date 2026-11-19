import {apiFailure,apiUser,checkOrigin,privateJson,readJson} from "@/lib/api";
import {interviewReport} from "@/modules/toefl-speaking/service";
export const maxDuration=180;
export async function POST(request:Request) {
 try{checkOrigin(request);const user=await apiUser(request);return privateJson(await interviewReport(user.id,await readJson(request,40000)));}
 catch(error){return apiFailure(error);}
}
