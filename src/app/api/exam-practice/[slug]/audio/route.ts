import { ApiError,apiFailure,apiUser } from "@/lib/api";
import { authorizePracticeAudio } from "@/modules/exam-practice/service";
import { listeningFile } from "@/modules/exams/audio-files";
import { listeningAudioResponse } from "@/modules/exams/audio-response";
export const runtime="nodejs";
export async function GET(request:Request,{params}:{params:Promise<{slug:string}>}){
  try{
    const user=await apiUser(request);const {slug}=await params;
    const revision=await authorizePracticeAudio(user.id,slug);
    const filename=listeningFile(slug,Number(new URL(request.url).searchParams.get("part")),revision);
    if(!filename)throw new ApiError(404,"Бичлэг олдсонгүй.");
    return await listeningAudioResponse(filename,request);
  }catch(error){return apiFailure(error);}
}
