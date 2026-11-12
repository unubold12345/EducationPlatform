// Hosted speech for the Speaking Lab and the mock examiner: the same Kokoro voices and Whisper transcription,
// run by an inference provider (DeepInfra) instead of inside this web server. Used only when DEEPINFRA_API_KEY is set;
// without it the local models in models.ts serve as before. Pure module: no database, session or Next imports.

export const HOSTED_VOICE_MODEL="hexgrad/Kokoro-82M";
export const HOSTED_TRANSCRIBE_MODEL="openai/whisper-large-v3-turbo";
const ENDPOINT="https://api.deepinfra.com/v1/inference/";
const MAX_AUDIO_BYTES=4_000_000;

type Fetcher=typeof fetch;
type Env=Record<string,string|undefined>;

/** The provider key, or null when speech runs on the local models. Never sent to the browser. */
export function hostedSpeechKey(env:Env=process.env):string|null {
 return env.DEEPINFRA_API_KEY?.trim()||null;
}

export class SpeechProviderError extends Error {
 reason:"network"|"status"|"shape";status:number;
 constructor(reason:"network"|"status"|"shape",status=0){super(`Speech provider failed (${reason}${status?` ${status}`:""})`);this.name="SpeechProviderError";this.reason=reason;this.status=status;}
}

// One request, repeated once after a short wait when the provider is busy or briefly down.
async function call(url:string,init:()=>RequestInit,timeoutMs:number,fetcher:Fetcher,retryMs:number):Promise<Response> {
 for(let attempt=0;;attempt++){
  let response:Response|null=null;
  try{response=await fetcher(url,{...init(),method:"POST",cache:"no-store",redirect:"error",signal:AbortSignal.timeout(timeoutMs)});}
  catch{if(attempt)throw new SpeechProviderError("network");}
  if(response?.ok)return response;
  const retry=!response||response.status===429||response.status>=500;
  if(response){void response.body?.cancel().catch(()=>{});if(attempt||!retry)throw new SpeechProviderError("status",response.status);}
  await new Promise(resolve=>setTimeout(resolve,retryMs));
 }
}

// RIFF/WAVE, MP3 (ID3 tag or frame sync), Ogg and FLAC: everything the provider can return and a browser can decode.
function looksLikeAudio(bytes:Uint8Array):boolean {
 if(bytes.length<64)return false;
 const tag=String.fromCharCode(bytes[0],bytes[1],bytes[2],bytes[3]);
 return tag==="RIFF"||tag==="OggS"||tag==="fLaC"||tag.startsWith("ID3")||(bytes[0]===0xff&&(bytes[1]&0xe0)===0xe0);
}

// The provider answers either with the audio itself or with JSON carrying it as base64 (optionally a data: URL).
async function readAudio(response:Response):Promise<ArrayBuffer> {
 let bytes:Uint8Array;
 if((response.headers.get("content-type")??"").includes("json")){
  let audio:unknown;
  try{audio=((await response.json()) as {audio?:unknown}).audio;}catch{throw new SpeechProviderError("shape");}
  if(typeof audio!=="string"||audio.length>MAX_AUDIO_BYTES*1.4)throw new SpeechProviderError("shape");
  bytes=new Uint8Array(Buffer.from(audio.replace(/^data:[^,]*,/,""),"base64"));
 }else bytes=new Uint8Array(await response.arrayBuffer());
 if(bytes.length>MAX_AUDIO_BYTES||!looksLikeAudio(bytes))throw new SpeechProviderError("shape");
 return bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength) as ArrayBuffer;
}

export type HostedVoiceRequest={text:string;voice:string;speed:number};

/** One spoken chunk as compressed audio. `voice` is a Kokoro voice id already validated against the fixed list. */
export async function hostedVoice(key:string,request:HostedVoiceRequest,fetcher:Fetcher=fetch,retryMs=400):Promise<ArrayBuffer> {
 const response=await call(ENDPOINT+HOSTED_VOICE_MODEL,()=>({
  headers:{"Content-Type":"application/json",Authorization:`Bearer ${key}`},
  // MP3 is about a tenth of the WAV the local model returns, which matters on a phone connection.
  body:JSON.stringify({text:request.text,preset_voice:[request.voice],speed:request.speed,output_format:"mp3"}),
 }),20000,fetcher,retryMs);
 return readAudio(response);
}

/** The words heard in a 16 kHz mono WAV answer (already validated by decodeSpeechWav). English is fixed, not detected. */
export async function hostedTranscript(key:string,wav:ArrayBuffer,fetcher:Fetcher=fetch,retryMs=400):Promise<string> {
 const response=await call(ENDPOINT+HOSTED_TRANSCRIBE_MODEL,()=>{
  const form=new FormData();
  form.append("audio",new Blob([wav],{type:"audio/wav"}),"answer.wav");
  form.append("language","en");
  return {headers:{Authorization:`Bearer ${key}`},body:form};
 },60000,fetcher,retryMs);
 let text:unknown;
 try{text=((await response.json()) as {text?:unknown}).text;}catch{throw new SpeechProviderError("shape");}
 if(typeof text!=="string")throw new SpeechProviderError("shape");
 return text;
}
