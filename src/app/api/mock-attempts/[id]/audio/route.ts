import { ApiError,apiFailure,apiUser } from "@/lib/api";
import { accessMock } from "@/modules/exams/service";
import { listeningFile,listeningPosition } from "@/modules/exams/audio-files";
import { listeningAudioResponse } from "@/modules/exams/audio-response";
export const runtime="nodejs";
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}) {
  try {
    const user=await apiUser(request);const attempt=await accessMock((await params).id,user.id);
    const part=Number(new URL(request.url).searchParams.get("part"));
    if(!Number.isInteger(part)||part<1||part>4||attempt.program!=="ielts")throw new ApiError(404,"Бичлэг олдсонгүй.");
    const elapsed=(Date.parse(attempt.serverNow)-Date.parse(attempt.stageStartedAt))/1000;
    if(!attempt.finishedAt&&(attempt.stage?.id!=="ielts-listening"||part!==listeningPosition(attempt.slug,elapsed).part))throw new ApiError(403,"Зөвхөн одоо тоглож буй хэсгийн бичлэгийг нээж болно.");
    const filename=listeningFile(attempt.slug,part);
    if(!filename)throw new ApiError(404,"Бичлэг олдсонгүй.");
    return await listeningAudioResponse(filename,request);
  }catch(error){return apiFailure(error);}
}
