import { apiFailure, apiUser, checkOrigin, privateJson } from "@/lib/api";
import { importVocabulary } from "@/modules/vocabulary/service";

export const maxDuration = 180;

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const user = await apiUser(request);
    return privateJson(await importVocabulary(user.id, request));
  } catch (error) {
    return apiFailure(error);
  }
}
