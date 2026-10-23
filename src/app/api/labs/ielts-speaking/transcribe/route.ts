import {ApiError,apiFailure,apiUser,checkOrigin} from "@/lib/api";
import {transcribeSpeaking} from "@/modules/speaking-lab/transcribe";
export const runtime="nodejs";
export const maxDuration=180;
export async function POST(request:Request) {
 try {
  checkOrigin(request);const user=await apiUser(request);
  if(request.headers.get("content-type")!=="audio/wav")throw new ApiError(415,"WAV recording required.");
  const reader=request.body?.getReader();if(!reader)throw new ApiError(400,"Recording is empty.");
  const chunks:Uint8Array[]=[];let size=0;
  try{while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>3840044){await reader.cancel();throw new ApiError(413,"Recording exceeds two minutes.");}chunks.push(value);}}finally{reader.releaseLock();}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  return Response.json(await transcribeSpeaking(user.id,bytes.buffer),{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiFailure(error);}
}
