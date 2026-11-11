import { practiceAudio } from "@/modules/exams/audio-handlers";
import { hskAudioResponse } from "@/modules/exams/audio-response-hsk";
export const runtime="nodejs";
// HSK 1 mocks only; a separate route keeps their recordings in their own function bundle.
export async function GET(request:Request,{params}:{params:Promise<{slug:string}>}){
  return practiceAudio(request,(await params).slug,"hsk",hskAudioResponse);
}
