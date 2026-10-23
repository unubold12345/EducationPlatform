import { apiFailure, apiUser, checkOrigin, privateJson, readJson } from "@/lib/api";
import { tutorReply } from "@/modules/tutor/service";
export const maxDuration=75;
export async function POST(request:Request) {
  try {checkOrigin(request);const user=await apiUser(request);return privateJson(await tutorReply(user.id,await readJson(request,16000)));}
  catch(error){return apiFailure(error);}
}
