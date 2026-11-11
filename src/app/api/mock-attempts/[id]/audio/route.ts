import { attemptAudio } from "@/modules/exams/audio-handlers";
import { listeningAudioResponse } from "@/modules/exams/audio-response";
export const runtime="nodejs";
// Recordings for IELTS 01–06 and JLPT; Mocks 07–12 use ./forms (see audioPath in audio-files.ts).
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}) {
  return attemptAudio(request,(await params).id,"base",listeningAudioResponse);
}
