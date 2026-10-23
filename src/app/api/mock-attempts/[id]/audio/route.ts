import { readFile } from "node:fs/promises";
import path from "node:path";
import { ApiError,apiFailure,apiUser } from "@/lib/api";
import { accessMock } from "@/modules/exams/service";
export const runtime="nodejs";
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}) {
  try {
    const user=await apiUser(request);const attempt=await accessMock((await params).id,user.id);
    const part=Number(new URL(request.url).searchParams.get("part"));
    if(!Number.isInteger(part)||part<1||part>4||attempt.program!=="ielts")throw new ApiError(404,"Бичлэг олдсонгүй.");
    const elapsed=(Date.parse(attempt.serverNow)-Date.parse(attempt.stageStartedAt))/1000;
    if(!attempt.finishedAt&&(attempt.stage?.id!=="ielts-listening"||part!==Math.min(4,Math.floor(elapsed/450)+1)))throw new ApiError(403,"Зөвхөн одоо тоглож буй хэсгийн бичлэгийг нээж болно.");
    const data=await readFile(path.join(process.cwd(),"assets","exams",`ielts-01-part-${part}.mp3`));
    const headers={"Content-Type":"audio/mpeg","Cache-Control":"private, no-store","Accept-Ranges":"bytes"};
    const range=request.headers.get("range");
    if(range) {
      const match=/^bytes=(\d+)-(\d*)$/.exec(range);if(!match)return new Response(null,{status:416,headers:{"Content-Range":`bytes */${data.length}`}});
      const start=Number(match[1]),end=Math.min(match[2]?Number(match[2]):data.length-1,data.length-1);
      if(start>end||start>=data.length)return new Response(null,{status:416,headers:{"Content-Range":`bytes */${data.length}`}});
      return new Response(data.subarray(start,end+1),{status:206,headers:{...headers,"Content-Range":`bytes ${start}-${end}/${data.length}`,"Content-Length":String(end-start+1)}});
    }
    return new Response(data,{headers:{...headers,"Content-Length":String(data.length)}});
  }catch(error){return apiFailure(error);}
}
