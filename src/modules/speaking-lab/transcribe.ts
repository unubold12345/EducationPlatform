import "server-only";
import {ApiError} from "@/lib/api";
import {decodeSpeechWav} from "./pcm";
import {whisperModel} from "./models";
import {requireSpeakingLab,reserveSpeakingRequest,serialized} from "./service";
import {hostedSpeechKey,hostedTranscript} from "./speech-provider";

async function localTranscript(samples:Float32Array) {
 const recognizer=await whisperModel();
 const result=await serialized("transcribe",60000,()=>recognizer(samples,samples.length>16000*28?{chunk_length_s:30,stride_length_s:5}:{}));
 return Array.isArray(result)?result[0]?.text:result.text;
}

// `allow` is the access check, run before and after the model: the Lab's own by default, or the mock examiner's.
export async function transcribeSpeaking(userId:string,buffer:ArrayBuffer,allow:(userId:string)=>Promise<void>=requireSpeakingLab) {
 const samples=decodeSpeechWav(buffer);if(!samples)throw new ApiError(400,"Use a recording between 0.25 and 120 seconds.");
 if(Math.sqrt(samples.reduce((sum,n)=>sum+n*n,0)/samples.length)<.002)throw new ApiError(422,"No speech was audible. Move closer to your microphone and try again.");
 await allow(userId);
 await reserveSpeakingRequest(userId,"transcribe");
 try {
  // Hosted provider when configured (no shared queue); otherwise the local model, one answer at a time.
  const key=hostedSpeechKey();
  const text=(key?await hostedTranscript(key,buffer):await localTranscript(samples))?.replace(/\s+/g," ").trim();
  // Whisper emits bracketed non-speech tags such as [BLANK_AUDIO] or (music) on silence.
  const spoken=text?.replace(/[[(][^\])]*[\])]/g,"").trim();
  if(!spoken||spoken.length>2000)throw new ApiError(422,"Couldn’t make out the answer. Try again a little closer to the microphone, or type.");
  await allow(userId);
  return {text:spoken};
 }catch(error){
  if(error instanceof ApiError)throw error;
  console.error("Speaking transcription failed",error instanceof Error?(error.name==="SpeechProviderError"?error.message:error.name):"Unknown");
  throw new ApiError(503,"Transcription is unavailable. You can still type your answer.");
 }
}
