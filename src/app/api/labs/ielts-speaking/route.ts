import {apiFailure,apiUser,checkOrigin,privateJson,readJson} from "@/lib/api";
import {speakingReply} from "@/modules/speaking-lab/service";
export const maxDuration=180;
export async function POST(request:Request) {
 try{checkOrigin(request);const user=await apiUser(request);return privateJson(await speakingReply(user.id,await readJson(request,120000)));}
 catch(error){return apiFailure(error);}
}
