import {apiFailure,apiUser,checkOrigin,privateJson,readJson} from "@/lib/api";
import {EXPERT_LIMITS} from "@/modules/writing-lab/expert";
import {createStrongReview} from "@/modules/writing-lab/expert-service";

// The DeepSeek full review thinks before it writes: usually about a minute, stopped at 200 seconds.
export const maxDuration=240;

export async function POST(request:Request) {
 try{checkOrigin(request);const user=await apiUser(request);return privateJson(await createStrongReview(user.id,await readJson(request,EXPERT_LIMITS.bodyBytes)));}
 catch(error){return apiFailure(error);}
}
