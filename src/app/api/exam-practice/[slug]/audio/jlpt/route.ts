import { practiceAudio } from "@/modules/exams/audio-handlers";
import { jlptAudioResponse } from "@/modules/exams/audio-response-jlpt";
export const runtime="nodejs";
// JLPT practice on audio revision 2; a separate route keeps their recordings in their own function bundle.
export async function GET(request:Request,{params}:{params:Promise<{slug:string}>}){
  return practiceAudio(request,(await params).slug,"jlpt",jlptAudioResponse);
}
