// Browser-only conductor of the AI examiner in an IELTS mock Speaking stage. It reads the stage's script aloud,
// listens, has each answer transcribed and hands the transcript to the runner, which saves it like any other
// response. The server clock stays in charge: the engine only ever acts inside the time the stage has left,
// and a stage change stops whatever it was doing. Practice mode has no clock: it passes Infinity as the time
// left, and the engine then gives the Part 2 preparation minute itself.
import {VoicePlayer,audibleSeconds,deviceVoice,startRecorder,type EnergyRef,type RecorderHandle} from "@/modules/speaking-lab/audio";
import {encodeSpeechWav} from "@/modules/speaking-lab/pcm";
import {countWords,isClarificationRequest,speakingAcks,speakingVoices,type SpeakingPart,type SpeakingVoice} from "@/modules/speaking-lab/contracts";
import type {AvatarGesture} from "@/modules/speaking-lab/avatar";
import {EXAMINER_SPEED,appendTranscript,examinerScript,examinerSpeech,followUpFor,transcriptText,type ExaminerQuestion,type ExaminerScript,type ExaminerStage} from "./speaking-examiner";
import {examinerVoice,updateSpeakingRecord} from "./speaking-examiner-store";

export type ExaminerStatus="starting"|"blocked"|"voicing"|"speaking"|"listening"|"transcribing"|"preparing"|"finished"|"paused"|"stopped";
export type ExaminerView={
 stageId:string|null;status:ExaminerStatus;caption:string;
 /** The natural voice is unavailable and the line is only on screen or in the device voice: always show it. */
 showCaption:boolean;
 hearing:boolean;notice:string;error:string;
 /** The question being asked now, and every question asked so far in this stage. */
 current:string|null;asked:string[];long:boolean;gesture:AvatarGesture;
};
export type ExaminerIo={stage:ExaminerStage;answers:Record<string,string>;
 /** Seconds left in the stage by the server clock, or Infinity where there is no clock (practice mode). */
 remaining:number;disabled:boolean;save:(id:string,value:string)=>void};

const IDLE:ExaminerView={stageId:null,status:"starting",caption:"",showCaption:false,hearing:false,notice:"",error:"",current:null,asked:[],long:false,gesture:null};
// Recording stops this many seconds before the stage deadline, so the transcript can still be saved.
const MARGIN=7;
type StopReason="silence"|"limit"|"quiet"|"manual"|"skip"|"repeat"|"halt";
type Heard={kind:"answer";text:string;seconds:number;pauses:number}|{kind:"silent"|"unclear"|"skipped"|"repeat"}|null;
const sleep=(ms:number)=>new Promise<void>(resolve=>setTimeout(resolve,ms));
const NOTICES={
 silent:"Микрофон таны дууг сонссонгүй. Асуултыг дахин уншиж байна.",
 unclear:"Хариу тод сонсогдсонгүй. Микрофондоо ойртож дахин хариулна уу.",
 device:"Байгалийн дуу одоогоор ачаалагдсангүй — төхөөрөмжийн дуугаар уншиж байна.",
};

export class ExaminerEngine {
 readonly energy:EnergyRef={current:0};
 private view:ExaminerView=IDLE;
 private listeners=new Set<()=>void>();
 private io:ExaminerIo|null=null;
 private player:VoicePlayer|null=null;
 private recorder:RecorderHandle|null=null;
 private stopListening:((reason:StopReason)=>void)|null=null;
 private voiceAbort:AbortController|null=null;
 private transcribeAbort:AbortController|null=null;
 private deviceStop:(()=>void)|null=null;
 private host:HTMLElement|null=null;
 // `run` changes whenever the current activity must stop; `life` when the whole engine is torn down.
 private run=0;private life=0;private ids=0;
 private remaining=0;private remainingAt=0;
 private acks:AudioBuffer[]=[];private ackVoice:SpeakingVoice|null=null;private ackNext=0;private ackUntil=0;private acksLoading=false;
 private followUps=0;private voiceMisses=0;private lastNod=0;private listenStart=0;
 private endPreparation:(()=>void)|null=null;
 private readonly base:string;private readonly recordId:string;
 /** `base`: the API address of this sitting's examiner routes. `recordId`: where this browser keeps its timing and notes. */
 constructor(base:string,recordId:string){this.base=base;this.recordId=recordId;}

 subscribe=(listener:()=>void)=>{this.listeners.add(listener);return()=>{this.listeners.delete(listener);};};
 snapshot=()=>this.view;
 /** The stage element whose --level variable follows the student's microphone. */
 attach=(element:HTMLElement|null)=>{this.host=element;};

 /** Called after every render with the runner's current stage, saved answers and server-clock seconds left. */
 sync(io:ExaminerIo) {
  this.io=io;this.remaining=io.remaining;this.remainingAt=performance.now();
  if(io.disabled){
   // Another window changed the attempt: saving is paused, so the examiner waits too.
   if(this.view.status!=="paused"||this.view.stageId!==io.stage.id){this.halt();this.set({...IDLE,stageId:io.stage.id,status:"paused"});}
   return;
  }
  if(io.stage.id!==this.view.stageId||this.view.status==="paused")this.enter();
 }
 dispose() {
  this.halt();this.life++;this.player?.close();this.player=null;this.acks=[];this.acksLoading=false;this.view=IDLE;
 }

 // ---------- Controls ----------
 /** A click that lets the browser play sound (needed after a reload in the middle of a Speaking stage). */
 unlock=()=>{if(this.view.status!=="blocked")return;this.audio().ensure();this.set({status:"starting"});void this.begin(this.run);};
 /** The student has finished the answer. */
 finishAnswer=()=>{if(this.view.status==="listening")this.stopListening?.("manual");};
 /** Hear the current question again instead of answering yet. */
 repeat=()=>{if(this.view.status==="listening"&&!this.view.long)this.stopListening?.("repeat");};
 /** Leave this question unanswered and go on. */
 skip=()=>{
  if(this.view.status==="listening")this.stopListening?.("skip");
  else if(this.view.status==="speaking"||this.view.status==="voicing")this.silence();
 };
 /** Start this stage's script again from the first unanswered question (after a microphone error). */
 retry=()=>{if(this.io&&!this.io.disabled)this.enter();};
 /** Practice mode: the student has finished preparing the long turn. */
 ready=()=>{this.endPreparation?.();};
 /** Practice mode: do this part again. The page clears the saved answers; the engine forgets them at once. */
 restart=(ids:string[])=>{
  if(!this.io||this.io.disabled)return;
  const answers={...this.io.answers};for(const id of ids)delete answers[id];
  this.io={...this.io,answers};this.enter();
 };

 // ---------- Plumbing ----------
 private set(patch:Partial<ExaminerView>){this.view={...this.view,...patch};for(const listener of this.listeners)listener();}
 private audio(){return this.player??=new VoicePlayer(this.energy);}
 private left(){return this.remaining-(performance.now()-this.remainingAt)/1000;}
 private level(value:number){this.host?.style.setProperty("--level",value.toFixed(3));}
 private timed(){return Number.isFinite(this.remaining);}
 private url(action:"voice"|"transcribe"){return `${this.base}/speaking/${action}`;}
 private silence() {
  this.voiceAbort?.abort();this.player?.stop();this.deviceStop?.();this.deviceStop=null;
  if(typeof window!=="undefined")window.speechSynthesis?.cancel();
  this.energy.current=0;
 }
 private halt() {
  this.run++;this.silence();this.transcribeAbort?.abort();
  this.recorder?.abort();this.recorder=null;
  this.stopListening?.("halt");this.stopListening=null;
  this.endPreparation?.();this.endPreparation=null;
  this.level(0);
 }
 private enter() {
  this.halt();this.followUps=0;this.ackUntil=0;
  this.set({...IDLE,stageId:this.io!.stage.id});
  void this.begin(this.run);
 }
 private async begin(run:number) {
  const context=this.audio().ensure();
  // Browsers keep a new audio context suspended until the page has been clicked.
  if(context.state!=="running")await Promise.race([context.resume().catch(()=>{}),sleep(500)]);
  if(run!==this.run)return;
  if(context.state!=="running"){this.set({status:"blocked"});return;}
  try{await this.conduct(run);}
  catch(error){
   if(run!==this.run)return;
   this.halt();
   this.set({status:"stopped",caption:"",hearing:false,error:error instanceof DOMException&&error.name==="NotAllowedError"
    ?"Микрофоны эрх хаалттай байна. Хөтчийн тохиргооноос зөвшөөрөөд дахин оролдоно уу."
    :"Микрофон эсвэл дуу ажилласангүй. Төхөөрөмжөө шалгаад дахин оролдоно уу."});
  }
 }

 // ---------- The script ----------
 private async conduct(run:number) {
  const script=this.io?examinerScript(this.io.stage):null;
  if(!script){this.set({status:"finished"});return;}
  if(script.preparation){
   await this.say(["intro"],run);
   if(run===this.run)this.set({status:"preparing"});
   return;
  }
  const answered=(id:string)=>!!this.io?.answers[id]?.trim();
  const fresh=!script.questions.some(question=>answered(question.id));
  let first=true;
  for(const [index,question] of script.questions.entries()){
   if(run!==this.run)return;
   // After a reload the script resumes at the first question without a saved answer.
   if(answered(question.id)){this.set({asked:[...this.view.asked,question.id]});continue;}
   if(this.left()<(question.long?25:16))break;
   this.set({current:question.id,asked:[...this.view.asked,question.id],long:question.long});
   const opening=question.long?["intro"]:first&&fresh?["intro","q:"+question.id]:["q:"+question.id];
   first=false;
   // A timed mock has its own preparation stage. Without a clock the minute is given here; "ready" ends it early.
   if(question.long&&!this.timed()){
    await this.say(["prepare"],run);
    if(run!==this.run)return;
    this.set({status:"preparing"});
    await new Promise<void>(resolve=>{const timer=setTimeout(resolve,60000);this.endPreparation=()=>{clearTimeout(timer);resolve();};});
    this.endPreparation=null;
    if(run!==this.run)return;
   }
   await this.exchange(script,question,opening,script.questions.length-index-1,run);
  }
  if(run!==this.run)return;
  this.set({current:null,long:false});
  // The closing line is spoken only when it fits in the time left; otherwise a plain "Thank you."
  const fits=this.left()>=countWords(script.closing)/2.4+2;
  if(fits||this.left()>=4)await this.say(fits?["closing"]:["ack:0"],run);
  if(run===this.run)this.set({status:"finished"});
 }

 // One question: ask it, listen, repeat it on request, and follow up a short answer once.
 private async exchange(script:ExaminerScript,question:ExaminerQuestion,opening:string[],pending:number,run:number) {
  let keys=opening,repeats=0,followed=false;
  while(run===this.run){
   await this.say(keys,run);
   if(run!==this.run)return;
   const heard=await this.listen(question,script.part,run);
   if(!heard||run!==this.run||heard.kind==="skipped")return;
   const again=question.long?["phrase:start"]:["q:"+question.id];
   if(heard.kind==="repeat"){if(repeats++<3&&this.left()>=15){keys=again;continue;}return;}
   if(heard.kind!=="answer"){
    // Nothing usable was heard: ask once more, then go on to the next question.
    if(repeats++<1&&this.left()>=20){this.set({notice:NOTICES[heard.kind]});keys=again;continue;}
    return;
   }
   if(!question.long&&isClarificationRequest(heard.text)&&repeats++<2&&this.left()>=15){keys=["phrase:repeat","q:"+question.id];continue;}
   const words=this.keep(script.part,question,heard);
   // With time to spare the examiner asks a little more, as a real one would.
   const roomy=this.timed()&&this.left()-pending*30>40;
   const follow=followed||question.long||this.left()<25?null:followUpFor(script.part,words,this.followUps,roomy);
   if(follow===null)return;
   followed=true;this.followUps++;keys=["follow:"+follow];
  }
 }

 /** Saves the transcript as the question's response and keeps the measured timing in this browser. */
 private keep(part:SpeakingPart,question:ExaminerQuestion,heard:{text:string;seconds:number;pauses:number}) {
  const io=this.io!,value=appendTranscript(io.answers[question.id],heard.text);
  this.io={...io,answers:{...io.answers,[question.id]:value}};
  io.save(question.id,value);
  updateSpeakingRecord(this.recordId,record=>({...record,timing:[...record.timing,{id:question.id,part,seconds:heard.seconds,words:countWords(heard.text),pauses:heard.pauses}].slice(-48)}));
  return countWords(transcriptText(value));
 }

 // ---------- Voice ----------
 private async say(keys:string[],run:number) {
  const io=this.io;if(!io||run!==this.run)return;
  // Let a playing acknowledgement finish, with a beat of silence, before the next line.
  const wait=this.ackUntil-performance.now();
  if(wait>0)await sleep(wait+150);
  if(run!==this.run)return;
  // The examiner is read for every line, so a change of examiner takes effect with the next thing said.
  const voice=examinerVoice(),text=examinerSpeech(io.stage,keys,voice);if(!text)return;
  this.set({status:"voicing",caption:"",showCaption:false});
  try {
   const controller=new AbortController();this.voiceAbort=controller;
   // A cold voice model can take a while; do not let it eat the stage. Later lines try the natural voice again.
   const slow=setTimeout(()=>controller.abort(),this.voiceMisses?5000:15000);
   let response:Response;
   try{response=await fetch(this.url("voice"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({stageId:io.stage.id,say:keys,voice}),signal:controller.signal});}
   finally{clearTimeout(slow);}
   // 409: the stage has just changed on the server; the runner is about to move on.
   if(response.status===409)return;
   if(!response.ok)throw new Error("voice");
   await this.audio().play(response,{onStart:()=>{if(run===this.run)this.set({status:"speaking"});},onCaption:line=>{if(run===this.run)this.set({caption:line});}});
   this.voiceMisses=0;
  }catch{
   if(run!==this.run)return;
   if(!this.voiceMisses++)this.set({notice:NOTICES.device});
   await this.speakDevice(text,run,voice);
  }
  if(run===this.run)this.set({caption:"",showCaption:false});
 }
 private speakDevice(text:string,run:number,voice:SpeakingVoice) {
  return new Promise<void>(resolve=>{
   const synth=typeof window!=="undefined"?window.speechSynthesis:undefined;
   let frame=0,timer:ReturnType<typeof setTimeout>|undefined,settled=false;
   const finish=()=>{if(settled)return;settled=true;cancelAnimationFrame(frame);clearTimeout(timer);this.energy.current=0;this.deviceStop=null;resolve();};
   this.deviceStop=finish;
   const shown=()=>{if(run===this.run)this.set({status:"speaking",caption:text,showCaption:true});};
   // No speech engine at all: leave the line on screen for as long as it takes to read.
   if(!synth){shown();timer=setTimeout(finish,Math.min(14000,1800+text.length*60));return;}
   const utterance=new SpeechSynthesisUtterance(text);
   utterance.lang=speakingVoices[voice].accent==="British"?"en-GB":"en-US";utterance.rate=EXAMINER_SPEED;utterance.voice=deviceVoice(synth.getVoices(),voice);
   utterance.onstart=()=>{shown();const tick=()=>{this.energy.current=.06+Math.random()*.14;frame=requestAnimationFrame(tick);};tick();};
   utterance.onend=finish;utterance.onerror=finish;
   // Some browsers never fire onend for a cancelled utterance.
   timer=setTimeout(finish,Math.min(40000,4000+text.length*110));
   synth.speak(utterance);
  });
 }
 // A person says "thank you" the moment you finish. The clips are synthesised once, while the student is speaking.
 private async loadAcks() {
  const voice=examinerVoice();
  // Clips made for another examiner are dropped; a load already under way stops itself below.
  if(this.ackVoice!==voice){this.acks=[];this.ackNext=0;this.ackVoice=voice;this.acksLoading=false;}
  if(this.acksLoading||this.acks.length||this.voiceMisses||!this.io)return;
  this.acksLoading=true;const life=this.life,stageId=this.io.stage.id;
  try {
   for(let index=0;index<speakingAcks.mock.length;index++){
    const response=await fetch(this.url("voice"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({stageId,say:["ack:"+index],voice}),signal:AbortSignal.timeout(30000)});
    if(!response.ok||life!==this.life||voice!==this.ackVoice)return;
    const clips=await this.audio().load(response);
    if(life!==this.life||voice!==this.ackVoice)return;
    this.acks.push(...clips.slice(0,1));
   }
  }catch{/* Acknowledgements are a nicety; the test works without them. */}
  finally{if(life===this.life&&voice===this.ackVoice)this.acksLoading=false;}
 }
 private acknowledge() {
  this.set({gesture:{name:"Yes",id:++this.ids}});
  if(!this.acks.length||this.ackVoice!==examinerVoice())return;
  const clip=this.acks[this.ackNext++%this.acks.length];
  this.audio().playClip(clip);this.ackUntil=performance.now()+audibleSeconds(clip)*1000;
 }
 // The examiner nods now and then while the student is talking, when they pause for breath.
 private nod() {
  const now=performance.now();
  if(now-this.lastNod<7000||now-this.listenStart<3500)return;
  this.lastNod=now;this.set({gesture:{name:"Yes",id:++this.ids}});
 }

 // ---------- Microphone ----------
 private async listen(question:ExaminerQuestion,part:SpeakingPart,run:number):Promise<Heard> {
  const budget=(this.left()-MARGIN)*1000;
  if(budget<2500)return {kind:"skipped"};
  const stopped=new Promise<StopReason>(resolve=>{this.stopListening=resolve;});
  this.listenStart=performance.now();
  this.set({status:"listening",hearing:false,caption:""});
  const handle=await startRecorder(this.audio().ensure(),{
   autoStop:true,silenceMs:question.long?5000:part===3?2300:1800,maxMs:Math.min(question.long?120000:90000,budget),
   onLevel:level=>this.level(level),
   onSpeech:speaking=>{if(run!==this.run)return;this.set({hearing:speaking,...(speaking?{notice:""}:{})});if(!speaking)this.nod();},
   onAutoStop:reason=>this.stopListening?.(reason),
  });
  if(run!==this.run){handle.abort();return null;}
  this.recorder=handle;
  void this.loadAcks();
  const reason=await stopped;
  if(run!==this.run||reason==="halt")return null;
  this.stopListening=null;this.recorder=null;this.set({hearing:false});
  if(reason==="skip"||reason==="repeat"){handle.abort();return {kind:reason==="skip"?"skipped":"repeat"};}
  this.set({status:"transcribing"});
  const recording=await handle.stop().catch(()=>null);
  if(run!==this.run)return null;
  if(!recording||!recording.heardSpeech)return {kind:"silent"};
  this.acknowledge();
  try {
   const controller=new AbortController();this.transcribeAbort=controller;
   const response=await fetch(this.url("transcribe"),{method:"POST",headers:{"Content-Type":"audio/wav"},body:encodeSpeechWav(recording.pcm),signal:AbortSignal.any([controller.signal,AbortSignal.timeout(45000)])});
   const data=await response.json().catch(()=>({}));
   if(run!==this.run)return null;
   const text=response.ok?String(data.text??"").trim():"";
   return text?{kind:"answer",text,seconds:Math.round(recording.seconds*10)/10,pauses:recording.pauses}:{kind:"unclear"};
  }catch{return run===this.run?{kind:"unclear"}:null;}
 }
}
