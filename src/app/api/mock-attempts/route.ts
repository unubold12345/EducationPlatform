import { ApiError,apiFailure,apiUser,checkOrigin,privateJson,readJson } from "@/lib/api";
import { startMock } from "@/modules/exams/service";
export async function POST(request:Request) {
  try {
    checkOrigin(request);const user=await apiUser(request);const input=await readJson(request);
    if(!input||typeof input!=="object"||!("slug" in input)||typeof input.slug!=="string"||input.slug.length>80)throw new ApiError(400,"Шалгалтаа сонгоно уу.");
    return privateJson(await startMock(input.slug,user.id));
  }catch(error){return apiFailure(error);}
}
