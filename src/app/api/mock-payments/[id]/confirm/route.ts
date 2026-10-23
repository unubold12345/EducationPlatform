import { ApiError,apiFailure,apiUser,checkOrigin,privateJson,readJson } from "@/lib/api";
import { confirmMockOrder } from "@/modules/exams/payments";
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}) {
  try {
    checkOrigin(request); const user=await apiUser(request); const input=await readJson(request); const {id}=await params;
    if (id.length>100||!input||typeof input!=="object"||Array.isArray(input)||Object.keys(input).length!==1||!("decision" in input)||(input.decision!=="success"&&input.decision!=="decline")) throw new ApiError(400,"Төлбөрийн сонголтоо шалгана уу.");
    return privateJson(await confirmMockOrder(id,user.id,input.decision));
  } catch(error) { return apiFailure(error); }
}
