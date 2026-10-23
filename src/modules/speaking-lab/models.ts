import "server-only";
import path from "node:path";
import {createRequire} from "node:module";
import type {KokoroTTS} from "kokoro-js";
import type {AutomaticSpeechRecognitionPipeline} from "@huggingface/transformers";

// Local speech models are loaded once per server process and reused.
// Kokoro's ESM entry reads a global __dirname that Prisma also defines, so both load via CJS require.
const state=globalThis as unknown as {educationLabVoice?:Promise<KokoroTTS>;educationLabWhisper?:Promise<AutomaticSpeechRecognitionPipeline>};
const cacheDir=()=>path.join(process.cwd(),"artifacts","speaking-voice-cache");
const load=()=>createRequire(path.join(process.cwd(),"package.json"));

export const WHISPER_MODEL=process.env.SPEAKING_WHISPER_MODEL?.trim()||"onnx-community/whisper-base.en";

export function voiceModel() {
 state.educationLabVoice??=(async()=>{
  const require=load();
  const {env}=require("@huggingface/transformers") as typeof import("@huggingface/transformers");
  const {KokoroTTS}=require("kokoro-js") as typeof import("kokoro-js");
  env.cacheDir=cacheDir();
  return KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX",{dtype:"q8",device:"cpu"});
 })().catch(error=>{state.educationLabVoice=undefined;throw error;});
 return state.educationLabVoice;
}

export function whisperModel() {
 state.educationLabWhisper??=(async()=>{
  const require=load();
  const {env,pipeline}=require("@huggingface/transformers") as typeof import("@huggingface/transformers");
  env.cacheDir=cacheDir();
  // fp32 encoder keeps accuracy on accented speech; the quantised decoder keeps it fast on CPU.
  return pipeline("automatic-speech-recognition",WHISPER_MODEL,{dtype:{encoder_model:"fp32",decoder_model_merged:"q8"},device:"cpu"});
 })().catch(error=>{state.educationLabWhisper=undefined;throw error;});
 return state.educationLabWhisper;
}

export function speechModelStatus() {
 return {voice:state.educationLabVoice?"loading-or-ready":"cold",transcribe:state.educationLabWhisper?"loading-or-ready":"cold"};
}
