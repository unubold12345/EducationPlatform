import { apiUser,apiFailure,checkOrigin,readJson,privateJson } from "@/lib/api";
import { assertAdmin,adminMutation } from "@/modules/admin/service";
export async function POST(request:Request) {
  try {
    checkOrigin(request);
    const user=await apiUser(request);
    await assertAdmin(user.id);
    return privateJson(await adminMutation(user.id,await readJson(request)));
  } catch(error){return apiFailure(error);}
}
