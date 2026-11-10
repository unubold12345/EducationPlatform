import { apiFailure, apiUser, checkOrigin, privateJson, readJson } from "@/lib/api";
import { tutorReply } from "@/modules/tutor/service";
import { ASSISTANT_BODY_BYTES } from "@/modules/tutor/contracts";
export const maxDuration=75;
export async function POST(request:Request) {
  try {checkOrigin(request);const user=await apiUser(request);return privateJson(await tutorReply(user.id,await readJson(request,ASSISTANT_BODY_BYTES)));}
  catch(error){return apiFailure(error);}
}
