import { apiFailure, apiUser, checkOrigin, privateJson, readJson } from "@/lib/api";
import { createDeck } from "@/modules/vocabulary/service";

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const user = await apiUser(request);
    return privateJson(await createDeck(user.id, await readJson(request, 2 * 1024)), 201);
  } catch (error) {
    return apiFailure(error);
  }
}
