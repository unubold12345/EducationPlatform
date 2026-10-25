import { apiFailure,apiUser,checkOrigin,privateJson,readJson,ApiError } from "@/lib/api";
import { startPaper } from "@/modules/papers/service";
import { findOfficialPaper } from "@/modules/papers/catalog";
export async function POST(request:Request){try{checkOrigin(request);const user=await apiUser(request);const body=await readJson(request);if(!body||typeof body!=="object"||Object.keys(body).length!==1||!("slug" in body)||typeof body.slug!=="string"||!findOfficialPaper(body.slug))throw new ApiError(400,"Шалгалт буруу.");return privateJson(await startPaper(user.id,body.slug));}catch(error){return apiFailure(error);}}
