import "server-only";
import {ApiError} from "@/lib/api";
import {speakingLabEnabled} from "@/lib/local-pilot";
import {normalizeSpeakingReply} from "@/modules/speaking-lab/contracts";
import {reportTokens,requireSpeakingLab,speakingCompletion} from "@/modules/speaking-lab/service";
import {speakingVoiceStream} from "@/modules/speaking-lab/voice";
import {transcribeSpeaking} from "@/modules/speaking-lab/transcribe";
import {expireStages,stageFor} from "./engine";
import {ownMock} from "./service";
import type {ExamState} from "./types";
import {EXAMINER_SPEED,EXAMINER_VOICE,examinerSpeech,mockReportMessages,mockSpeakingTurns,speakingPart,validExaminerVoiceInput,validMockReportInput} from "./speaking-examiner";

// The examiner shares the Speaking Lab's pilot switch, voice and transcription, but not its access rule. The Lab
// refuses every request while a timed sitting is open; the examiner works only inside one: the student's own
// IELTS attempt, and only while its server clock is in a Speaking stage. It calls no language model.

/** The student's own open IELTS attempt, with the stage its server clock is in now. Nothing is saved here. */
async function openSitting(id:string,userId:string) {
 if(!speakingLabEnabled())throw new ApiError(404,"AI шалгагч идэвхгүй байна.");
 const state=(await ownMock(id,userId)).state as unknown as ExamState;
 // Deadlines that passed since the last save are applied to this copy only, so a stage that has ended is refused.
 expireStages(state,Date.now());
 if(state.definition.program!=="ielts")throw new ApiError(404,"AI шалгагч зөвхөн IELTS mock-д ажиллана.");
 const stage=stageFor(state);
 if(state.finishedAt||!stage)throw new ApiError(409,"Шалгалт дууссан байна.");
 return stage;
}
async function liveSpeakingStage(id:string,userId:string) {
 const stage=await openSitting(id,userId);
 if(!speakingPart(stage))throw new ApiError(409,"Speaking хэсэг одоо идэвхгүй байна.");
 return stage;
}

/** Loading the local speech models may start as soon as the IELTS sitting is open, before Speaking begins. */
export async function requireExaminerSitting(id:string,userId:string) {await openSitting(id,userId);}

/** Speech for lines of the current stage's script. The page names the lines; the text comes from the attempt snapshot. */
export async function examinerVoice(id:string,userId:string,body:unknown) {
 if(!validExaminerVoiceInput(body))throw new ApiError(400,"Дууны хүсэлтийн бүтэц буруу байна.");
 const stage=await liveSpeakingStage(id,userId);
 if(stage.id!==body.stageId)throw new ApiError(409,"Энэ хэсэг дууссан байна.");
 // The examiner is one of the Lab's fixed partners (checked above); the words still come only from the script.
 const voice=body.voice??EXAMINER_VOICE,text=examinerSpeech(stage,body.say,voice);
 if(!text)throw new ApiError(400,"Шалгагчийн ийм мөр алга.");
 return speakingVoiceStream(userId,{text,voice,speed:EXAMINER_SPEED},async()=>{});
}

/** Transcribes one spoken answer. The stage is checked before and after, so nothing arrives for a stage that has ended. */
export function examinerTranscribe(id:string,userId:string,buffer:ArrayBuffer) {
 return transcribeSpeaking(userId,buffer,async()=>{await liveSpeakingStage(id,userId);});
}

/**
 * The AI report on a finished mock's Speaking transcripts. This is the only language-model call of the feature
 * and it follows the Lab's rule: refused while any timed sitting is open. The conversation is rebuilt from the
 * student's own submitted snapshot; the page sends only the feedback language, the target band and timing.
 */
export async function mockSpeakingReport(id:string,userId:string,body:unknown) {
 if(!validMockReportInput(body))throw new ApiError(400,"Тайлангийн хүсэлтийн бүтэц буруу байна.");
 await requireSpeakingLab(userId);
 const state=(await ownMock(id,userId)).state as unknown as ExamState;
 if(state.definition.program!=="ielts")throw new ApiError(404,"Speaking тайлан зөвхөн IELTS mock-д гарна.");
 if(!state.finishedAt)throw new ApiError(409,"Шалгалт дууссаны дараа тайлан авна уу.");
 const {turns,answers}=mockSpeakingTurns(state.definition.stages,state.responses);
 if(!answers)throw new ApiError(400,"AI шалгагчийн бичвэрлэсэн Speaking хариулт алга.");
 return speakingCompletion(userId,"speaking-report",{
  messages:mockReportMessages(body,turns),maxTokens:reportTokens(body.language),temperature:0.3,timeoutMs:80000,
  read:json=>{const report=normalizeSpeakingReply(json,"report")?.report;return report?{report}:null;},
  recheck:()=>requireSpeakingLab(userId),
 });
}
