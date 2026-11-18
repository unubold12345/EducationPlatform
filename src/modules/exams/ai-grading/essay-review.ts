import "server-only";
import {ApiError} from "@/lib/api";
import {writingLabEnabled} from "@/lib/local-pilot";
import {ESSAY_LIMIT} from "@/modules/writing-lab/contracts";
import {EXPERT_LIMITS,MOCK_TASK_NAME,STRONG_LIMITS,type EssayReviewKind,type ReviewSubject} from "@/modules/writing-lab/expert";
import {attemptReviews,expertQuota,expertReview,strongReview} from "@/modules/writing-lab/expert-service";
import {ownMock} from "../service";
import type {ExamState} from "../types";
import {writingItems,type WritingItem} from "./contracts";

// The detailed reviews a finished IELTS mock's results offer on its essays (owner 2026-11-18): the automatic grade is
// scores and a short note; the Essay Studio's two reviews give the detail, at the studio's price (credits for the
// DeepSeek review, the plan's monthly Claude reviews). The task and the essay come from the attempt snapshot, never
// from the request, so a student cannot have another text reviewed under a mock's name.

async function finishedIelts(id:string,userId:string) {
 const state=(await ownMock(id,userId)).state as unknown as ExamState;
 if(!state.finishedAt)throw new ApiError(409,"Шалгалт дууссаны дараа дэлгэрэнгүй үнэлгээ авна.");
 if(state.definition.program!=="ielts")throw new ApiError(404,"Дэлгэрэнгүй үнэлгээ зөвхөн IELTS Writing-д байна.");
 return state;
}

function subject(state:ExamState,item:WritingItem,attemptId:string):ReviewSubject {
 const task=item.kind==="ielts-task1"?"report":"essay";
 const prompt=item.material.trim()?`${item.prompt.trim()}\n\nData given with the task:\n${item.material.trim()}`:item.prompt.trim();
 return {task,promptId:null,title:`${state.definition.title} · ${item.label}`,prompt,taskType:MOCK_TASK_NAME[task],
  essay:item.response.trim(),language:"mn",attemptId,questionId:item.id};
}

/** What the results page shows: each essay's length, the reviews already made, and the Claude reviews left this month. */
export async function mockEssayReviews(id:string,userId:string) {
 const state=await finishedIelts(id,userId);
 const enabled=writingLabEnabled();
 const [reviews,quota]=enabled?await Promise.all([attemptReviews(userId,id),expertQuota(userId)]):[[],null];
 return {
  enabled,quota,reviews,
  items:writingItems(state).map(item=>({id:item.id,label:item.label,words:item.words})),
  minWords:{strong:STRONG_LIMITS.minWords,expert:EXPERT_LIMITS.minWords},
 };
}

/** One detailed review of one of the mock's essays; the studio's checks, price and saving apply unchanged. */
export async function reviewMockEssay(id:string,userId:string,body:unknown) {
 const input=body&&typeof body==="object"&&!Array.isArray(body)?body as Record<string,unknown>:null;
 const kind=input?.kind as EssayReviewKind;
 if(!input||Object.keys(input).length!==2||typeof input.questionId!=="string"||(kind!=="strong"&&kind!=="expert"))throw new ApiError(400,"Үнэлгээний хүсэлт буруу байна.");
 const state=await finishedIelts(id,userId);
 const item=writingItems(state).find(entry=>entry.id===input.questionId);
 if(!item)throw new ApiError(404,"Энэ шалгалтад ийм Writing даалгавар алга.");
 const min=kind==="strong"?STRONG_LIMITS.minWords:EXPERT_LIMITS.minWords;
 if(item.words<min)throw new ApiError(400,`Энэ үнэлгээнд дор хаяж ${min} үг хэрэгтэй. Таны хариулт ${item.words} үгтэй.`);
 if(item.response.length>ESSAY_LIMIT)throw new ApiError(400,`Бичвэр ${ESSAY_LIMIT} тэмдэгтээс урт тул дэлгэрэнгүй үнэлгээнд илгээх боломжгүй.`);
 const text=subject(state,item,id);
 return kind==="strong"?strongReview(userId,text):expertReview(userId,text);
}
