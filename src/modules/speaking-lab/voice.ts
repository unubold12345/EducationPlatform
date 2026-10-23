import "server-only";
import {ApiError} from "@/lib/api";
import {encodeVoiceFrame,speechChunks,validVoiceInput} from "./contracts";
import {voiceModel} from "./models";
import {requireSpeakingLab,reserveSpeakingRequest,serialized} from "./service";

const MAX_SAMPLES=24000*70;

// Streams one framed WAV per sentence so playback starts after the first sentence, not the whole reply.
export async function speakingVoiceStream(userId:string,input:unknown):Promise<ReadableStream<Uint8Array>> {
 if(!validVoiceInput(input))throw new ApiError(400,"Дууны хүсэлтийн бүтэц буруу байна.");
 const chunks=speechChunks(input.text);if(!chunks.length)throw new ApiError(400,"Дуудах текст хоосон байна.");
 await requireSpeakingLab(userId);
 await reserveSpeakingRequest(userId,"voice");
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
