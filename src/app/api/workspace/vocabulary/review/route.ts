import { apiFailure, apiUser, checkOrigin, privateJson, readJson } from "@/lib/api";
import { REVIEW_BODY_BYTES, recordVocabularyReview } from "@/modules/vocabulary/service";

// A quiz session's grades become study progress on the student's own words.
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const user = await apiUser(request);
    return privateJson(await recordVocabularyReview(user.id, await readJson(request, REVIEW_BODY_BYTES)));
  } catch (error) {
    return apiFailure(error);
  }
}
