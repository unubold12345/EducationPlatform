import { apiFailure, apiUser, checkOrigin, privateJson, readJson } from "@/lib/api";
import { DECK_REVIEW_BODY_BYTES, recordDeckReview } from "@/modules/language-decks/service";

type Context = { params: Promise<{ deck: string }> };

// A card or quiz session on a JLPT/HSK deck: grades become the student's progress. Plan and timed-sitting checks
// are in the service.
export async function POST(request: Request, context: Context) {
  try {
    checkOrigin(request);
    const user = await apiUser(request);
    const { deck } = await context.params;
    return privateJson(await recordDeckReview(user.id, deck, await readJson(request, DECK_REVIEW_BODY_BYTES)));
  } catch (error) {
    return apiFailure(error);
  }
}
