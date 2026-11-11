import {ApiError,apiFailure,apiUser,checkOrigin} from "@/lib/api";
import {examinerTranscribe} from "@/modules/exams/speaking-examiner-service";
export const runtime="nodejs";
export const maxDuration=180;
type Context={params:Promise<{id:string}>};
// Transcribes one spoken answer during a Speaking stage. The recording is not stored by this route.
export async function POST(request:Request,{params}:Context) {
 try {
  checkOrigin(request);const user=await apiUser(request);
  if(request.headers.get("content-type")!=="audio/wav")throw new ApiError(415,"WAV recording required.");
  const reader=request.body?.getReader();if(!reader)throw new ApiError(400,"Recording is empty.");
  const chunks:Uint8Array[]=[];let size=0;
  try{while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>3840044){await reader.cancel();throw new ApiError(413,"Recording exceeds two minutes.");}chunks.push(value);}}finally{reader.releaseLock();}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  return Response.json(await examinerTranscribe((await params).id,user.id,bytes.buffer),{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiFailure(error);}
}
