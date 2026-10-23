import { ApiError,apiFailure,apiUser,checkOrigin,privateJson } from "@/lib/api";
import { getDb } from "@/lib/db";
import { ownMock } from "@/modules/exams/service";
import type { ExamState } from "@/modules/exams/types";
type Context={params:Promise<{id:string;stageId:string}>};
export async function PUT(request:Request,{params}:Context) {
  try {
    checkOrigin(request);const user=await apiUser(request);const {id,stageId}=await params;
    const row=await ownMock(id,user.id);const state=row.state as unknown as ExamState;
    const index=state.definition.stages.findIndex(s=>s.id===stageId&&s.kind==="speaking");
    if(index<0||index>state.stageIndex)throw new ApiError(403,"Энэ хэсэг эхлээгүй байна.");
    // Allow a brief upload grace after recording stops; deadlines still never extend.
    const start=Date.parse(row.createdAt.toISOString())+state.definition.stages.slice(0,index).reduce((n,s)=>n+s.seconds*1000,0);
    const end=start+state.definition.stages[index].seconds*1000;
    if(Date.now()>end+120000)throw new ApiError(409,"Бичлэг илгээх хугацаа дууссан байна. Татаж авч багшдаа өгнө үү.");
    const mime=request.headers.get("content-type")?.split(";")[0]??"";
    if(!["audio/webm","audio/ogg","audio/mp4"].includes(mime))throw new ApiError(415,"Дэмжихгүй аудио төрөл.");
    const reader=request.body?.getReader();if(!reader)throw new ApiError(400,"Бичлэг хоосон байна.");
    let size=0;const chunks:Uint8Array[]=[];
    try{while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>8*1024*1024){await reader.cancel();throw new ApiError(413,"Бичлэг 8MB-аас их байна.");}chunks.push(value);}}finally{reader.releaseLock();}
    if(size<100)throw new ApiError(400,"Бичлэг хоосон байна.");
    const data=Buffer.concat(chunks);
    try{await getDb().mockRecording.create({data:{attemptId:id,stageId,mime,data}});}catch(error){
      const old=await getDb().mockRecording.findUnique({where:{attemptId_stageId:{attemptId:id,stageId}},select:{data:true,mime:true}});
      if(!old)throw error;
      if(old.mime!==mime||!Buffer.from(old.data).equals(data))throw new ApiError(409,"Энэ хэсгийн өмнөх клип хадгалагдсан. Шинэ клипээ татаж авч багшдаа өгнө үү.");
    }
    return privateJson({saved:true});
  }catch(error){return apiFailure(error);}
}
export async function GET(request:Request,{params}:Context) {
  try{
    const user=await apiUser(request);const {id,stageId}=await params;const row=await ownMock(id,user.id);
    if(!(row.state as unknown as ExamState).finishedAt)throw new ApiError(403,"Шалгалт дууссаны дараа бичлэгээ сонсоно уу.");
    const recording=await getDb().mockRecording.findUnique({where:{attemptId_stageId:{attemptId:id,stageId}}});
    if(!recording)throw new ApiError(404,"Бичлэг олдсонгүй.");
    return new Response(recording.data,{headers:{"Content-Type":recording.mime,"Cache-Control":"private, no-store","Content-Length":String(recording.data.length),"X-Content-Type-Options":"nosniff"}});
  }catch(error){return apiFailure(error);}
}
