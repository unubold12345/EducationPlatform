import {apiFailure,apiUser,checkOrigin,privateJson,readJson} from "@/lib/api";
import {writingReply} from "@/modules/writing-lab/service";
export const maxDuration=180;
export async function POST(request:Request) {
 try{checkOrigin(request);const user=await apiUser(request);return privateJson(await writingReply(user.id,await readJson(request,40000)));}
 catch(error){return apiFailure(error);}
}
