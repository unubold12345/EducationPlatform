import { apiFailure, apiUser, privateJson } from "@/lib/api";
import { vocabularyBank } from "@/modules/vocabulary/service";

// The mobile app's counterpart of /workspace/vocabulary's server props: the student's own words and decks, the
// bank size with its bought space, and the moment "due" is measured from. Read-only; it calls the page's own
// loader, which scopes every row by the signed-in user. Changes go through /api/workspace/vocabulary/**.
export async function GET(request: Request) {
  try {
    const user = await apiUser(request);
    const { words, decks, space, now } = await vocabularyBank(user.id);
    return privateJson({ userId: user.id, words, decks, space, now });
  } catch (error) { return apiFailure(error); }
}
