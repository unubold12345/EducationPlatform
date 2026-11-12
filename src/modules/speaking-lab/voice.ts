import "server-only";
import {ApiError} from "@/lib/api";
import {encodeVoiceFrame,speechChunks,validVoiceInput,type VoiceInput} from "./contracts";
import {voiceModel} from "./models";
import {requireSpeakingLab,reserveSpeakingRequest,serialized} from "./service";
import {hostedSpeechKey,hostedVoice} from "./speech-provider";

const MAX_SAMPLES=24000*70;

// Streams one framed audio clip per sentence so playback starts after the first sentence, not the whole reply.
// `allow` is the access check: the Lab's own (no open timed sitting) by default, or the mock examiner's live-stage check.
export async function speakingVoiceStream(userId:string,input:unknown,allow:(userId:string)=>Promise<void>=requireSpeakingLab):Promise<ReadableStream<Uint8Array>> {
 if(!validVoiceInput(input))throw new ApiError(400,"Дууны хүсэлтийн бүтэц буруу байна.");
 const chunks=speechChunks(input.text);if(!chunks.length)throw new ApiError(400,"Дуудах текст хоосон байна.");
 await allow(userId);
 await reserveSpeakingRequest(userId,"voice");
 const key=hostedSpeechKey();
 return key?hostedStream(key,input,chunks):localStream(input,chunks);
}

// Hosted provider: no process-wide queue, so students do not wait for each other. The next sentence is
// requested while the current one is being sent, which keeps the gap between sentences short.
async function hostedStream(key:string,input:VoiceInput,chunks:string[]):Promise<ReadableStream<Uint8Array>> {
 let cancelled=false,index=0;
 const request=(at:number)=>{const audio=hostedVoice(key,{text:chunks[at],voice:input.voice,speed:input.speed});audio.catch(()=>{});return audio;};
 let ahead:Promise<ArrayBuffer>|null=request(0);
 // The first sentence is awaited before the response starts, so a provider failure is a 503 the page can
 // answer with the device voice, not a stream that breaks after a 200.
 await ahead.catch(error=>{console.error("Speaking voice provider failed",error instanceof Error?error.message:"Unknown");throw new ApiError(503,"Байгалийн дуу түр ажиллахгүй байна. Төхөөрөмжийн дууг сонгоно уу.");});
 return new ReadableStream<Uint8Array>({
  async pull(controller) {
   if(cancelled||!ahead){controller.close();return;}
   const caption=chunks[index++],current=ahead;
   ahead=index<chunks.length?request(index):null;
   try {
    const audio=await current;
    if(cancelled)return;
    controller.enqueue(encodeVoiceFrame(caption,audio));
    if(!ahead)controller.close();
   }catch(error){
    console.error("Speaking voice provider failed",error instanceof Error?error.message:"Unknown");
    controller.error(new Error("Voice generation failed"));
   }
  },
  cancel(){cancelled=true;ahead=null;},
 },{highWaterMark:1});
}

async function localStream(input:VoiceInput,chunks:string[]):Promise<ReadableStream<Uint8Array>> {
 const tts=await voiceModel().catch(error=>{console.error("Speaking voice load failed",error instanceof Error?error.name:"Unknown");throw new ApiError(503,"Байгалийн дууг ачаалж чадсангүй. Төхөөрөмжийн дууг сонгоно уу.");});
 let cancelled=false,index=0,samples=0;
 return new ReadableStream<Uint8Array>({
  async pull(controller) {
   if(cancelled||index>=chunks.length){controller.close();return;}
   const caption=chunks[index++];
   try {
    const audio=await serialized("voice",30000,()=>tts.generate(caption,{voice:input.voice,speed:input.speed}));
    samples+=audio.audio.length;
    if(cancelled)return;
    if(samples>MAX_SAMPLES){controller.close();return;}
    controller.enqueue(encodeVoiceFrame(caption,audio.toWav()));
    if(index>=chunks.length)controller.close();
   }catch(error){
    console.error("Speaking voice failed",error instanceof Error?error.name:"Unknown");
    controller.error(new Error("Voice generation failed"));
   }
  },
  cancel(){cancelled=true;},
 },{highWaterMark:1});
}
