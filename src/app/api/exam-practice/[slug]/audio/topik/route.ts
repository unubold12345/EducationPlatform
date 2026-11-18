import { practiceAudio } from "@/modules/exams/audio-handlers";
import { topikAudioResponse } from "@/modules/exams/audio-response-topik";
export const runtime="nodejs";
// TOPIK Ⅰ and Ⅱ mocks only; a separate route keeps their recordings in their own function bundle.
export async function GET(request:Request,{params}:{params:Promise<{slug:string}>}){
  return practiceAudio(request,(await params).slug,"topik",topikAudioResponse);
}
