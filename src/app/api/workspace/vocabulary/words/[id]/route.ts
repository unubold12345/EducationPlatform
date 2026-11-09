import { apiFailure, apiUser, checkOrigin, privateJson, readJson } from "@/lib/api";
import { deleteVocabularyWord, updateVocabularyWord } from "@/modules/vocabulary/service";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    checkOrigin(request);
    const user = await apiUser(request);
    const { id } = await context.params;
    return privateJson(await updateVocabularyWord(user.id, id, await readJson(request, 8 * 1024)));
  } catch (error) {
    return apiFailure(error);
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    checkOrigin(request);
    const user = await apiUser(request);
    const { id } = await context.params;
    return privateJson(await deleteVocabularyWord(user.id, id));
  } catch (error) {
    return apiFailure(error);
  }
}
