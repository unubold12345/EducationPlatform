import {apiFailure,apiUser,checkOrigin,privateJson} from "@/lib/api";
import {requireSpeakingLab} from "@/modules/speaking-lab/service";
import {speechModelStatus,voiceModel,whisperModel} from "@/modules/speaking-lab/models";
import {after} from "next/server";
export const runtime="nodejs";
export const maxDuration=180;
// Starts loading the local speech models in the background while the student reads the setup screen.
export async function POST(request:Request) {
 try {
  checkOrigin(request);const user=await apiUser(request);await requireSpeakingLab(user.id);
  const before=speechModelStatus();
  // Keep background loading attached to the request lifecycle on serverless hosts.
  after(async()=>{await Promise.allSettled([voiceModel(),whisperModel()]);});
  return privateJson(before);
 }catch(error){return apiFailure(error);}
}
