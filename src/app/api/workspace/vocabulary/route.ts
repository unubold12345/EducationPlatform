import { apiFailure, apiUser, checkOrigin, privateJson, readJson } from "@/lib/api";
import { addVocabularyWord } from "@/modules/vocabulary/service";

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const user = await apiUser(request);
    return privateJson(await addVocabularyWord(user.id, await readJson(request, 8 * 1024)), 201);
  } catch (error) {
    return apiFailure(error);
  }
}
