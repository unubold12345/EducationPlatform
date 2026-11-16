import { attemptAudio } from "@/modules/exams/audio-handlers";
import { jlptAudioResponse } from "@/modules/exams/audio-response-jlpt";
export const runtime="nodejs";
// JLPT attempts on audio revision 2; a separate route keeps their recordings in their own function bundle.
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}) {
  return attemptAudio(request,(await params).id,"jlpt",jlptAudioResponse);
}
