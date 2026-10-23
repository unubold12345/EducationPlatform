import {apiFailure,apiUser,checkOrigin,readJson} from "@/lib/api";
import {speakingVoiceStream} from "@/modules/speaking-lab/voice";
export const runtime="nodejs";
export const maxDuration=180;
export async function POST(request:Request) {
 try {
  checkOrigin(request);const user=await apiUser(request);
  const stream=await speakingVoiceStream(user.id,await readJson(request,4000));
  return new Response(stream,{headers:{"Content-Type":"application/x-speaking-frames","Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
 }catch(error){return apiFailure(error);}
}
