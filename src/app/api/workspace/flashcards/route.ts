import { apiFailure, apiUser, checkOrigin, privateJson } from "@/lib/api";
import { createFlashcardDeck } from "@/modules/flashcards/service";

export const maxDuration = 180;

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const user = await apiUser(request);
    return privateJson(await createFlashcardDeck(user.id, request));
  } catch (error) {
    return apiFailure(error);
  }
}
