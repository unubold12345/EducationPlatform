import { ApiError,apiFailure,apiUser,checkOrigin,privateJson,readJson } from "@/lib/api";
import { createSubscriptionOrder } from "@/modules/subscriptions/service";
export async function POST(request:Request) {
  try {
    checkOrigin(request);const user=await apiUser(request);const input=await readJson(request);
    if(!input||typeof input!=="object"||Array.isArray(input)||Object.keys(input).length!==1||!("program" in input)||typeof input.program!=="string"||input.program.length>30)throw new ApiError(400,"Багцаа сонгоно уу.");
    return privateJson(await createSubscriptionOrder(input.program,user.id));
  }catch(error){return apiFailure(error);}
}
