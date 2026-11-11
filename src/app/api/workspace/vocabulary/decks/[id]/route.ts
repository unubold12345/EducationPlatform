import { apiFailure, apiUser, checkOrigin, privateJson, readJson } from "@/lib/api";
import { deleteDeck, updateDeck } from "@/modules/vocabulary/service";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    checkOrigin(request);
    const user = await apiUser(request);
    const { id } = await context.params;
    return privateJson(await updateDeck(user.id, id, await readJson(request, 2 * 1024)));
  } catch (error) {
    return apiFailure(error);
  }
}

// `?words=delete` removes the deck's words with it; otherwise they stay in the bank without a deck.
export async function DELETE(request: Request, context: Context) {
  try {
    checkOrigin(request);
    const user = await apiUser(request);
    const { id } = await context.params;
    return privateJson(await deleteDeck(user.id, id, new URL(request.url).searchParams.get("words") === "delete"));
  } catch (error) {
    return apiFailure(error);
  }
}
