import { apiUser,checkOrigin,apiFailure,readJson,privateJson } from "@/lib/api";
import { assertAdmin } from "@/modules/admin/service";
import { editContent } from "@/modules/content/editor-service";
import { sourceContent } from "@/modules/content/published";
import { getDb } from "@/lib/db";
export async function GET(request:Request,{params}:{params:Promise<{key:string}>}) {
  try{
    const user=await apiUser(request);await assertAdmin(user.id);const {key}=await params;
    const source=sourceContent(key);if(!source)return privateJson({error:"Материал олдсонгүй."},404);
    const [draft,history]=await Promise.all([getDb().contentDraft.findUnique({where:{key}}),getDb().publishedContent.findMany({where:{key},orderBy:{version:"desc"},take:5})]);
    return privateJson({source,draft,history});
  }catch(error){return apiFailure(error);}
}
export async function POST(request:Request,{params}:{params:Promise<{key:string}>}) {
  try{checkOrigin(request);const user=await apiUser(request);await assertAdmin(user.id);return privateJson(await editContent(user.id,(await params).key,await readJson(request,512000)));}catch(error){return apiFailure(error);}
}
