import { apiFailure, apiUser, checkOrigin, privateJson, readJson } from "@/lib/api";
import { BULK_BODY_BYTES, bulkVocabulary } from "@/modules/vocabulary/service";

// Several words in one request: save a reviewed list, move to a deck, star, reset progress or delete.
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const user = await apiUser(request);
    return privateJson(await bulkVocabulary(user.id, await readJson(request, BULK_BODY_BYTES)));
  } catch (error) {
    return apiFailure(error);
  }
}
