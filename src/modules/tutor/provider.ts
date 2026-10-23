import "server-only";
import { ApiError } from "@/lib/api";
import type { TutorContext, TutorInput } from "./contracts";
import { tutorMessages } from "./contracts";

export async function deepseekTutor(input: TutorInput, context: TutorContext) {
  const key=process.env.DEEPSEEK_API_KEY?.trim();
  if (!key) throw new ApiError(503,"AI багш одоогоор холбогдоогүй байна. Үндсэн тайлбараа ашиглана уу.");
  let response: Response;
  try {
    response=await fetch("https://api.deepseek.com/chat/completions",{
      method:"POST", cache:"no-store", headers:{"Content-Type":"application/json",Authorization:`Bearer ${key}`},
      body:JSON.stringify({model:process.env.DEEPSEEK_MODEL||"deepseek-flash",messages:tutorMessages(input,context),thinking:{type:"disabled"},max_tokens:1400,stream:false}),
      signal:AbortSignal.timeout(60000),redirect:"error",
    });
  } catch { throw new ApiError(503,"AI багштай холбогдож чадсангүй. Түр хүлээгээд дахин оролдоно уу."); }
  // Never echo provider error bodies: they can contain request/credential details.
  if (!response.ok) throw new ApiError(503,response.status===429?"AI багш ачаалалтай байна. Түр хүлээгээд дахин оролдоно уу.":"AI холболт түр ажиллахгүй байна. Үндсэн тайлбараа ашиглана уу.");
  try {
    const data=await response.json();const choice=data.choices?.[0];const content=choice?.message?.content;
    if (choice?.finish_reason!=="stop"||typeof content!=="string"||!content.trim()||content.length>12000) throw Error("Invalid completion");
    return content.trim();
  } catch { throw new ApiError(503,"AI тайлбар бүрэн ирсэнгүй. Дахин оролдоно уу."); }
}
