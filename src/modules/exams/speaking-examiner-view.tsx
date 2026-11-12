"use client";
// The AI examiner inside an IELTS mock Speaking stage, and the AI report on the results page. The look is the
// Speaking Lab's (same avatars, stage and report), and the student picks which of its partners conducts the test.
import "./speaking-examiner.css";
import {useEffect,useRef,useState,useSyncExternalStore,type CSSProperties} from "react";
import {SpeakingAvatar,type AvatarMood} from "@/modules/speaking-lab/avatar";
import {PartnerPortrait,partnerLooks} from "@/modules/speaking-lab/partner";
import {SpeakingReportView,type SessionStats} from "@/modules/speaking-lab/report";
import {countWords,speakingTargets,type SpeakingReport} from "@/modules/speaking-lab/contracts";
import {getProgress,getServerProgress,savePhrase,subscribeProgress} from "@/modules/speaking-lab/progress";
import {CreditCost,useCredits} from "@/modules/credits/client";
import {cueCard,examinerName,examinerScript,isTranscript,transcriptText,type ExaminerStage} from "./speaking-examiner";
import {ExaminerPicker,useExaminerVoice} from "./speaking-examiner-picker";
import {ExaminerEngine} from "./speaking-examiner-engine";
import {EMPTY_RECORD,speakingRecord,subscribeExaminer,updateSpeakingRecord} from "./speaking-examiner-store";
import type {PublicExamAttempt} from "./types";

const ICONS={
 stop:"M9 7h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z",
 mic:"M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-2.1a7 7 0 0 0 6-6.9h-2Z",
 captions:"M19 4H5c-1.11 0-2 .9-2 2v12c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 7H9.5v-.5h-2v3h2V13H11v1c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1zm7 0h-1.5v-.5h-2v3h2V13H18v1c0 .55-.45 1-1 1h-3c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1z",
 repeat:"M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z",
 next:"M6 18l8.5-6L6 6v12zm10-12v12h2V6h-2z",
} as const;
function Glyph({name}:{name:keyof typeof ICONS}){return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={ICONS[name]}/></svg>;}
const PART_NAMES={1:"Interview",2:"Long turn",3:"Discussion"} as const;

/** The examiner's explanation and the student's choice, shown until they have chosen for this mock. */
export function ExaminerInvitation({onChoose}:{onChoose:(choice:"on"|"off")=>void}) {
 const voice=useExaminerVoice();
 return <section className="exam-examiner-invite" aria-label="AI шалгагч">
  <PartnerPortrait voice={voice} className="exam-examiner-face"/>
  <div>
   <h2>Speaking-ийг AI шалгагчтай өгөх үү?</h2>
   <p>{examinerName(voice)} асуултуудыг чанга уншиж, таны хариуг сонсоно. Хариуг бичвэр болгохын тулд дууг манай сервер рүү илгээх (тэндээс яриа таних үйлчилгээнд дамжиж болно) бөгөөд бичвэр нь таны хариулт болж хадгалагдана. Цаг зогсохгүй. Шалгагчаа доороос сонгож болно.</p>
   <ExaminerPicker/>
   <div className="result-actions">
    <button type="button" className="button" onClick={()=>onChoose("on")}>AI шалгагчтай эхлэх →</button>
    <button type="button" className="button secondary" onClick={()=>onChoose("off")}>Асуултыг дэлгэцээс уншиж өгөх</button>
   </div>
  </div>
 </section>;
}

type Props={
 /** The API address of this sitting ("/api/mock-attempts/<id>" or "/api/exam-practice/<slug>"). */
 base:string;
 /** The key of this browser's timing, notes and report record. */
 recordId:string;
 stage:ExaminerStage;
 /** Seconds left in this stage by the server clock. Practice mode has no clock and leaves it out. */
 remaining?:number;
 answers:Record<string,string>;disabled:boolean;
 onChange:(id:string,value:string)=>void;onLeave:()=>void;
 /** Practice mode only: clear this part's saved answers so it can be done again. */
 onRestart?:(ids:string[])=>void;
};

export function SpeakingExaminer({base,recordId,stage,remaining=Infinity,answers,disabled,onChange,onLeave,onRestart}:Props) {
 const [engine]=useState(()=>new ExaminerEngine(base,recordId));
 const timed=Number.isFinite(remaining);
 const view=useSyncExternalStore(engine.subscribe,engine.snapshot,engine.snapshot);
 const record=useSyncExternalStore(subscribeExaminer,()=>speakingRecord(recordId),()=>EMPTY_RECORD);
 const [captions,setCaptions]=useState(true),[picking,setPicking]=useState(false);
 const voice=useExaminerVoice(),name=examinerName(voice);
 // The engine follows the runner: the stage, the saved answers and the server clock. A new stage restarts its script.
 const host=useRef<HTMLElement>(null);
 useEffect(()=>{engine.attach(host.current);engine.sync({stage,answers,remaining,disabled,save:onChange});});
 useEffect(()=>()=>engine.dispose(),[engine]);

 const script=examinerScript(stage,voice);
 if(!script)return null;
 const preparation=script.preparation,part=script.part;
 const cardQuestion=part===2?stage.questions[0]:undefined;
 const card=cardQuestion?cueCard(cardQuestion.prompt):null;
 const status=view.stageId===stage.id?view.status:"starting";
 const listening=status==="listening";
 const mood:AvatarMood=listening?"listening":status==="speaking"?"speaking":status==="voicing"||status==="transcribing"||status==="starting"?"thinking":"idle";
 const asked=script.questions.filter(question=>view.asked.includes(question.id));
 const answered=script.questions.filter(question=>answers[question.id]?.trim()).length;
 const caption=status==="speaking"&&view.caption&&(captions||view.showCaption)?view.caption:"";
 const line=status==="starting"?"Шалгагч холбогдож байна"
  :status==="blocked"?"Дуу тоглуулахын тулд доорх товчийг дарна уу"
  :status==="voicing"?""
  :status==="speaking"?`${name} ярьж байна`
  :listening?(view.hearing?"Сонсож байна…":view.long?"Бэлэн болмогцоо ярьж эхлээрэй":"Хариулна уу — сонсож байна")
  :status==="transcribing"?"Хариуг тань бичиж авч байна"
  :status==="preparing"?"Нэг минут бэлдээрэй. Тэмдэглэл хийж болно."
  :status==="paused"?"Түр зогссон"
  :status==="stopped"?"Шалгагч зогслоо"
  :!timed?(part===3?"Speaking-ийн гурван хэсэг дууслаа.":"Энэ хэсэг дууслаа. Дараагийн хэсгээ дээрээс нээнэ үү.")
  :part===3?"Speaking дууслаа. Цаг дуусахад үр дүн гарна.":"Энэ хэсэг дууслаа. Дараагийн хэсэг цаг дуусахад эхэлнэ.";
 const hint=listening?(view.long?"Хоёр минут хүртэл ярина. Дуусвал товчийг дарна уу.":"Хариулж дуусаад түр чимээгүй болоход дараагийн асуулт руу шилжинэ.")
  :status==="speaking"||status==="voicing"?"Асуултыг сонсоод хариулна уу."
  :preparation?"Бэлтгэлийн минут дуусахад Part 2 автоматаар эхэлнэ."
  :status==="preparing"?"Минут дуусахад эсвэл «Бэлэн» дарахад ярьж эхэлнэ."
  :status==="finished"?(timed?"Үлдсэн хугацаанд хүлээнэ үү.":"Дахин хийвэл энэ хэсгийн хариу шинээр бичигдэнэ."):"";
 // Without a clock the preparation minute belongs to the long turn, and its notes stay in this browser only.
 const preparing=preparation||(!timed&&status==="preparing");
 const notes=preparation&&cardQuestion?answers[cardQuestion.id]??"":record.notes;
 const saveNotes=(value:string)=>{if(preparation&&cardQuestion)onChange(cardQuestion.id,value);updateSpeakingRecord(recordId,current=>({...current,notes:value}));};
 const restartIds=script.questions.map(question=>question.id);

 return <div className="sl-root exam-examiner" data-examiner-status={status}>
  <section ref={host} className={`sl-stage mood-${mood}`} style={{"--partner":partnerLooks[voice].top} as CSSProperties} aria-label="AI шалгагч">
   <div className="sl-stage-top">
    <span className="sl-live"/><strong>{name}</strong>
    <span>AI examiner · Part {part} {PART_NAMES[part]}</span>
    {!preparation&&<em>{answered} / {script.questions.length}</em>}
   </div>
   <div className="sl-portrait">
    <SpeakingAvatar level={engine.energy} mood={mood} gesture={view.gesture} voice={voice}/>
    <div className={`sl-self ${listening?"on":""}`} aria-hidden="true"><span>Та</span><div><i/><i/><i/><i/><i/></div></div>
   </div>
   <div className="sl-caption" aria-live="polite">{caption?<p lang="en">{caption}</p>:<p className="sl-status">{(status==="voicing"||status==="transcribing"||status==="starting")&&<i className="sl-dots"><b/><b/><b/></i>}{line}</p>}</div>
   <div className="sl-dock">
    {status==="blocked"?<button type="button" className="button" onClick={()=>engine.unlock()}>Ярилцлагыг үргэлжлүүлэх →</button>
    :status==="stopped"?<button type="button" className="button secondary" onClick={()=>engine.retry()}>Дахин оролдох</button>
    :status==="preparing"&&!timed?<button type="button" className="button" onClick={()=>engine.ready()}>Бэлэн — ярьж эхлэх →</button>
    :status==="finished"&&onRestart?<button type="button" className="button secondary" onClick={()=>{onRestart(restartIds);engine.restart(restartIds);}}>Энэ хэсгийг дахин хийх</button>
    :<div className="sl-controls">
     <button type="button" className="sl-ctl" aria-pressed={captions} onClick={()=>setCaptions(on=>!on)}><i><Glyph name="captions"/></i>Captions</button>
     <div className={`sl-mic-wrap ${listening?"on":""} ${view.hearing?"hearing":""}`}>
      <button type="button" className="sl-mic" onClick={()=>engine.finishAnswer()} disabled={!listening} aria-label="Хариултаа дуусгаж илгээх"><Glyph name={listening?"stop":"mic"}/></button>
     </div>
     <button type="button" className="sl-ctl" disabled={!listening||view.long} onClick={()=>engine.repeat()}><i><Glyph name="repeat"/></i>Repeat</button>
     <button type="button" className="sl-ctl" disabled={!(listening||status==="speaking"||status==="voicing")||preparation} onClick={()=>engine.skip()}><i><Glyph name="next"/></i>Skip</button>
    </div>}
    {hint&&<p className="sl-dock-hint">{hint}</p>}
   </div>
  </section>

  <section className="sl-panel exam-examiner-side">
   {card||cardQuestion?<div className="sl-task">
    <div className="sl-task-head"><span className="sl-cue-label">Cue card · Part 2</span><span className="sl-task-go">{preparing?"Preparation · 1 minute":"Speak for one to two minutes"}</span></div>
    {card?<><h3 lang="en">{card.title}</h3><p lang="en">You should say:</p><ul lang="en">{card.points.map(point=><li key={point}>{point}</li>)}</ul><p className="sl-cue-close" lang="en">{card.closing}</p></>:<h3 lang="en">{cardQuestion!.prompt}</h3>}
    {preparing
     ?<label className="sl-notes">Тэмдэглэл (ярих үед харагдана)<textarea rows={4} lang="en" maxLength={4000} value={notes} disabled={disabled} onChange={event=>saveNotes(event.target.value)} placeholder="Key words: who · when · why it matters…"/></label>
     :notes.trim()?<div className="sl-notes">Таны тэмдэглэл<p className="exam-examiner-notes" lang="en">{notes}</p></div>:null}
   </div>:null}
   {!preparation&&<div className="exam-examiner-log" role="log" aria-label="Асуулт ба таны хариулт">
    <p className="sl-exam-note">{timed?"Шалгалтын горим — засвар, зөвлөгөөг дууссаны дараах тайлангаас авна.":"Шалгагч шалгалтын адил ярина — засвар, зөвлөгөөг доорх AI тайлангаас авна."}</p>
    {asked.map(question=>{const said=transcriptText(answers[question.id]);return <article key={question.id} className="exam-examiner-turn">
     {question.text&&<p lang="en"><strong>{name}</strong>{question.text}</p>}
     {said?<p lang="en" className="mine"><strong>Та</strong>{said}</p>:answers[question.id]?.trim()?<p className="mine"><strong>Та</strong>Тэмдэглэл хадгалсан.</p>:null}
    </article>;})}
   </div>}
   {view.notice&&<p className="sl-notice" role="status">{view.notice}</p>}
   {view.error&&<p className="error-message" role="alert">{view.error}</p>}
   <p className="exam-examiner-foot">Хариуг бичвэр болгохын тулд дууг манай сервер рүү илгээнэ (тэндээс яриа таних үйлчилгээнд дамжиж болно). Автомат бичвэр алдаатай байж болно{timed?"; бүтэн бичлэг тусдаа хадгалагдана":"; дууны бичлэг хадгалахгүй"}. <button type="button" className="sl-link" aria-expanded={picking} onClick={()=>setPicking(open=>!open)}>Шалгагч солих</button> · <button type="button" className="sl-link" onClick={onLeave}>{timed?"Шалгагчгүй үргэлжлүүлэх":"Шалгагчийг хаах"}</button></p>
   {picking&&<div className="exam-examiner-change"><ExaminerPicker/><p>Сонгосон шалгагч дараагийн өгүүлбэрээс эхлэн ярина.</p></div>}
  </section>
 </div>;
}

// ---------- After the mock: the AI report ----------
type Reviews=NonNullable<PublicExamAttempt["report"]>["reviews"];

/**
 * The Speaking Lab's report for a finished IELTS mock, made on request from the examiner's transcripts. It costs
 * credits like the Lab's report, is an AI estimate only and is kept in this browser; the mock itself stores no band.
 */
export function MockSpeakingReport({attemptId,reviews}:{attemptId:string;reviews:Reviews}) {
 const transcripts=reviews.filter(review=>review.domain==="Speaking"&&isTranscript(review.selected)).map(review=>transcriptText(review.selected)).filter(Boolean);
 return <SpeakingReportCard base={"/api/mock-attempts/"+attemptId} recordId={attemptId} transcripts={transcripts} note="mock-ийн дүнд орохгүй"/>;
}

/** `transcripts`: the examiner's transcripts the report will be made from; with none the card is not shown. */
export function SpeakingReportCard({base,recordId,transcripts,note}:{base:string;recordId:string;transcripts:string[];note:string}) {
 const record=useSyncExternalStore(subscribeExaminer,()=>speakingRecord(recordId),()=>EMPTY_RECORD);
 const progress=useSyncExternalStore(subscribeProgress,getProgress,getServerProgress);
 const {apply}=useCredits();
 const [language,setLanguage]=useState<"en"|"mn">("mn"),[target,setTarget]=useState(6.5);
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 const voice=useExaminerVoice();
 if(!transcripts.length)return null;
 const saved=new Set(progress.phrases.map(phrase=>phrase.id));
 const seconds=record.timing.reduce((sum,entry)=>sum+entry.seconds,0),voicedWords=record.timing.reduce((sum,entry)=>sum+entry.words,0);
 const stats:SessionStats={answers:transcripts.length,voiced:record.timing.length,words:transcripts.reduce((sum,text)=>sum+countWords(text),0),seconds,wpm:seconds>=10?Math.round(voicedWords/seconds*60):null,pauses:record.timing.reduce((sum,entry)=>sum+entry.pauses,0)};
 async function request() {
  if(busy)return;
  setBusy(true);setError("");
  try {
   const timing=record.timing.map(({part,seconds,words,pauses})=>({part,seconds:Math.min(180,seconds),words:Math.min(600,words),pauses:Math.min(100,pauses)}));
   const response=await fetch(base+"/speaking/report",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({language,target,timing}),signal:AbortSignal.timeout(175000)});
   const data=await response.json().catch(()=>({})) as {error?:string;report?:SpeakingReport};
   if(!response.ok||!data.report)throw new Error(data.error||"Тайлан гарсангүй. Дахин оролдоно уу.");
   apply(data);
   const report=data.report;
   updateSpeakingRecord(recordId,current=>({...current,report:{data:report,target,language,date:new Date().toISOString()}}));
  }catch(reason){setError(reason instanceof Error&&!["TimeoutError","AbortError"].includes(reason.name)&&reason.message?reason.message:"Тайлан удаж байна. Дахин оролдоно уу.");}
  finally{setBusy(false);}
 }
 return <section className="sl-root exam-speaking-report" aria-labelledby="exam-speaking-report-title">
  <div className="exam-speaking-report-head">
   <PartnerPortrait voice={voice} className="exam-examiner-face"/>
   <div>
    <h2 id="exam-speaking-report-title">Speaking · AI тайлан</h2>
    <p>{examinerName(voice)} таны {transcripts.length} хариултын бичвэрээс fluency, vocabulary, grammar-ийн ойролцоо band, засах зүйлс, жишээ хариулт гаргана. Бичвэр DeepSeek рүү илгээгдэнэ. Энэ нь AI-ийн тооцоолол бөгөөд албан ёсны оноо биш; дуудлагыг үнэлэхгүй, {note}.</p>
   </div>
  </div>
  <div className="exam-speaking-report-form">
   <label>Тайлбарын хэл<select value={language} disabled={busy} onChange={event=>setLanguage(event.target.value as "en"|"mn")}><option value="mn">Монгол</option><option value="en">English</option></select></label>
   <label>Зорилтот band<select value={target} disabled={busy} onChange={event=>setTarget(Number(event.target.value))}>{speakingTargets.map(value=><option key={value} value={value}>{value.toFixed(1)}</option>)}</select></label>
   <button type="button" className="button" disabled={busy} onClick={()=>void request()}>{busy?"Тайлан бичиж байна…":record.report?"Тайланг шинээр авах":"AI тайлан авах"} <CreditCost action="speaking-report" compact/></button>
  </div>
  {error&&<p className="error-message" role="alert">{error}</p>}
  {record.report?<SpeakingReportView report={record.report.data} stats={stats} target={record.report.target} language={record.report.language} entries={[]} saved={saved} voice={voice} mock review={[]} onSave={savePhrase}/>
   :<p className="fine-print">Тайлан энэ хөтөч дээр хадгалагдана. Өөр төхөөрөмж дээр дахин авбал кредит дахин зарцуулна.</p>}
 </section>;
}
