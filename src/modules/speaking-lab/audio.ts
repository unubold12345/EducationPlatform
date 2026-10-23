// Browser-only audio engine for the Speaking Lab: streamed voice playback and voice-activity microphone capture.
import {VoiceFrameReader} from "./contracts";

export type EnergyRef={current:number};

export class VoicePlayer {
 context:AudioContext|null=null;
 analyser:AnalyserNode|null=null;
 sources=new Set<AudioBufferSourceNode>();
 timers=new Set<ReturnType<typeof setTimeout>>();
 frame=0;
 run=0;
 energy:EnergyRef;
 constructor(energy:EnergyRef){this.energy=energy;}

 ensure() {
  if(!this.context||this.context.state==="closed"){
   this.context=new AudioContext();
   this.analyser=this.context.createAnalyser();this.analyser.fftSize=512;this.analyser.connect(this.context.destination);
  }
  void this.context.resume().catch(()=>{});
  return this.context;
 }

 private meter() {
  const analyser=this.analyser;if(!analyser)return;
  const samples=new Uint8Array(analyser.fftSize);
  const tick=()=>{
   analyser.getByteTimeDomainData(samples);
   let sum=0;for(const n of samples)sum+=((n-128)/128)**2;
   this.energy.current=this.sources.size?Math.sqrt(sum/samples.length):0;
   this.frame=requestAnimationFrame(tick);
  };
  cancelAnimationFrame(this.frame);tick();
 }

 // Plays framed WAV chunks as they arrive. Resolves when playback ends or is stopped.
 async play(response:Response,handlers:{onStart:()=>void;onCaption:(text:string)=>void}):Promise<"ended"|"stopped"> {
  const run=++this.run,context=this.ensure(),reader=response.body?.getReader();
  if(!reader)throw new Error("Voice stream was empty.");
  const frames=new VoiceFrameReader();let next=0,started=false,lastEnd:Promise<void>=Promise.resolve();
  this.meter();
  try {
   while(true){
    const {value,done}=await reader.read();
    if(run!==this.run){void reader.cancel().catch(()=>{});return "stopped";}
    if(done)break;
    for(const frame of frames.push(value)){
     const buffer=await context.decodeAudioData(frame.wav);
     if(run!==this.run)return "stopped";
     const source=context.createBufferSource();source.buffer=buffer;source.connect(this.analyser!);
     const at=Math.max(context.currentTime+.04,next);next=at+buffer.duration;
     this.sources.add(source);
     lastEnd=new Promise(resolve=>{source.onended=()=>{this.sources.delete(source);resolve();};});
     source.start(at);
     const timer=setTimeout(()=>{this.timers.delete(timer);if(run===this.run)handlers.onCaption(frame.caption);},Math.max(0,(at-context.currentTime)*1000));
     this.timers.add(timer);
     if(!started){started=true;handlers.onStart();}
    }
   }
   await lastEnd;
   return run===this.run?"ended":"stopped";
  }finally{if(run===this.run){cancelAnimationFrame(this.frame);this.energy.current=0;}}
 }

 stop() {
  this.run++;
  for(const timer of this.timers)clearTimeout(timer);this.timers.clear();
  for(const source of this.sources){try{source.stop();}catch{/* already stopped */}}
  this.sources.clear();cancelAnimationFrame(this.frame);this.energy.current=0;
 }

 close(){this.stop();void this.context?.close().catch(()=>{});this.context=null;}
}

export type Recording={pcm:Float32Array;seconds:number;pauses:number;duration:number;heardSpeech:boolean};
export type RecorderOptions={
 autoStop:boolean;silenceMs:number;maxMs:number;
 onLevel:(level:number)=>void;onSpeech:(speaking:boolean)=>void;onAutoStop:(reason:"silence"|"limit"|"quiet")=>void;
};
export type RecorderHandle={stop:()=>Promise<Recording|null>;abort:()=>void;startedAt:number};

const PAUSE_MS=1200,QUIET_MS=12000;

// Records with MediaRecorder and watches loudness to detect when the student starts and finishes speaking.
export async function startRecorder(context:AudioContext,options:RecorderOptions):Promise<RecorderHandle> {
 const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true,channelCount:1},video:false});
 const mime=["audio/webm;codecs=opus","audio/mp4","audio/ogg;codecs=opus"].find(type=>typeof MediaRecorder!=="undefined"&&MediaRecorder.isTypeSupported(type));
 const recorder=new MediaRecorder(stream,mime?{mimeType:mime}:undefined),chunks:Blob[]=[];
 recorder.ondataavailable=event=>{if(event.data.size)chunks.push(event.data);};
 const input=context.createMediaStreamSource(stream),analyser=context.createAnalyser();analyser.fftSize=1024;input.connect(analyser);
 const samples=new Float32Array(analyser.fftSize),startedAt=performance.now();
 let floor=0,run=0,voiced=false,firstVoice=0,lastVoice=0,pauses=0,finished=false;
 const tick=()=>{
  analyser.getFloatTimeDomainData(samples);
  let sum=0;for(const n of samples)sum+=n*n;
  const rms=Math.sqrt(sum/samples.length),now=performance.now();
  if(now-startedAt<300)floor=Math.max(floor,rms);
  else floor=rms<floor?floor*.9+rms*.1:floor*.999+rms*.001;
  const threshold=Math.max(.012,Math.min(.06,floor*2.6));
  const loud=rms>threshold;
  options.onLevel(Math.min(1,rms/Math.max(threshold*3,.05)));
  if(loud){
   run++;
   if(run>=3){
    if(!firstVoice)firstVoice=now;
    if(lastVoice&&now-lastVoice>=PAUSE_MS)pauses++;
    lastVoice=now;
    if(!voiced){voiced=true;options.onSpeech(true);}
   }
  }else{
   run=0;
   if(voiced&&now-lastVoice>350){voiced=false;options.onSpeech(false);}
  }
  if(finished)return;
  const elapsed=now-startedAt;
  if(elapsed>=options.maxMs){finished=true;options.onAutoStop("limit");}
  else if(options.autoStop&&firstVoice&&now-lastVoice>=options.silenceMs){finished=true;options.onAutoStop("silence");}
  else if(options.autoStop&&!firstVoice&&elapsed>=QUIET_MS){finished=true;options.onAutoStop("quiet");}
 };
 const interval=setInterval(tick,50);
 const release=()=>{clearInterval(interval);input.disconnect();stream.getTracks().forEach(track=>track.stop());options.onLevel(0);};
 recorder.start(250);
 let stopping:Promise<Recording|null>|null=null;
 return {
  startedAt,
  abort(){finished=true;try{if(recorder.state!=="inactive")recorder.stop();}catch{/* ignore */}release();},
  stop(){
   finished=true;
   stopping??=new Promise<Recording|null>((resolve,reject)=>{
    recorder.onstop=async()=>{
     release();
     try {
      if(!chunks.length){resolve(null);return;}
      const decoded=await context.decodeAudioData(await new Blob(chunks,{type:recorder.mimeType}).arrayBuffer());
      const length=Math.min(16000*118,Math.ceil(decoded.duration*16000));
      if(length<16000*.3){resolve(null);return;}
      const offline=new OfflineAudioContext(1,length,16000),source=offline.createBufferSource();
      source.buffer=decoded;source.connect(offline.destination);source.start();
      const pcm=(await offline.startRendering()).getChannelData(0);
      const seconds=firstVoice?Math.max(.5,(lastVoice-firstVoice)/1000+.3):decoded.duration;
      resolve({pcm,seconds:Math.min(180,seconds),pauses,duration:decoded.duration,heardSpeech:!!firstVoice});
     }catch(error){reject(error);}
    };
    if(recorder.state!=="inactive")recorder.stop();else recorder.onstop?.(new Event("stop"));
   });
   return stopping;
  },
 };
}
