import {apiFailure,apiUser,checkOrigin,privateJson} from "@/lib/api";
import {requireSpeakingLab} from "@/modules/speaking-lab/service";
import {speechModelStatus,voiceModel,whisperModel} from "@/modules/speaking-lab/models";
export const runtime="nodejs";
// Starts loading the local speech models in the background while the student reads the setup screen.
export async function POST(request:Request) {
 try {
  checkOrigin(request);const user=await apiUser(request);await requireSpeakingLab(user.id);
  const before=speechModelStatus();
  void voiceModel().catch(()=>{});void whisperModel().catch(()=>{});
  return privateJson(before);
 }catch(error){return apiFailure(error);}
}
