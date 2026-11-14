import { apiFailure, apiUser, checkOrigin, privateJson, readJson } from "@/lib/api";
import { buyVocabularySpace } from "@/modules/vocabulary/service";

// Buys permanent vocabulary space with yellow (purchased) credits: { packs, requestId }.
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const user = await apiUser(request);
    return privateJson(await buyVocabularySpace(user.id, await readJson(request, 1024)));
  } catch (error) {
    return apiFailure(error);
  }
}
