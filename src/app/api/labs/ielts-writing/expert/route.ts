import {apiFailure,apiUser,checkOrigin,privateJson,readJson} from "@/lib/api";
import {EXPERT_LIMITS} from "@/modules/writing-lab/expert";
import {createExpertReview} from "@/modules/writing-lab/expert-service";

// A Claude Opus review with high effort takes one to three minutes.
export const maxDuration=300;

export async function POST(request:Request) {
 try{checkOrigin(request);const user=await apiUser(request);return privateJson(await createExpertReview(user.id,await readJson(request,EXPERT_LIMITS.bodyBytes)));}
 catch(error){return apiFailure(error);}
}
