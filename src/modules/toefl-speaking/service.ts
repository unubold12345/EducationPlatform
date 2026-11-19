import "server-only";
import {ApiError} from "@/lib/api";
import {reportTokens,requireSpeakingLab,speakingCompletion} from "@/modules/speaking-lab/service";
import {interviewMessages,normalizeInterviewReport,parseInterviewJson,validInterviewInput} from "./contracts";

// The Take an Interview report: one credit-charged call on the Speaking Lab's budget, access check and price.
// Listen and Repeat never reaches the server beyond the Lab's own voice and transcription routes.
export async function interviewReport(userId:string,body:unknown) {
 if(!validInterviewInput(body))throw new ApiError(400,"Ярилцлагын хариултын бүтэц буруу эсвэл хэт богино байна.");
 await requireSpeakingLab(userId);
 return speakingCompletion(userId,"speaking-report",{
  messages:interviewMessages(body),maxTokens:reportTokens(body.language),temperature:0.3,timeoutMs:80000,
  parse:parseInterviewJson,
  read:json=>{const report=normalizeInterviewReport(json,body);return report?{report}:null;},
  recheck:()=>requireSpeakingLab(userId),
 });
}
