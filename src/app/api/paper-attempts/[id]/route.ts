import { apiFailure,apiUser,checkOrigin,privateJson,readJson } from "@/lib/api";
import { paperAttempt } from "@/modules/papers/service";
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){try{const user=await apiUser(request);return privateJson(await paperAttempt((await params).id,user.id));}catch(error){return apiFailure(error);}}
export async function PUT(request:Request,{params}:{params:Promise<{id:string}>}){try{checkOrigin(request);const user=await apiUser(request);return privateJson(await paperAttempt((await params).id,user.id,await readJson(request)));}catch(error){return apiFailure(error);}}
