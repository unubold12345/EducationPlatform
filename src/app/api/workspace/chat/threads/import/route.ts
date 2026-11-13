import { apiFailure, apiUser, checkOrigin, privateJson, readJson } from "@/lib/api";
import { CHAT_IMPORT_BODY_BYTES } from "@/modules/workspace/chat-storage";
import { importChatThread } from "@/modules/workspace/chat-threads";

// Moves one chat thread kept in a browser before 2026-11-12 to the signed-in student's account.
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const user = await apiUser(request);
    return privateJson(await importChatThread(user.id, await readJson(request, CHAT_IMPORT_BODY_BYTES)));
  } catch (error) {
    return apiFailure(error);
  }
}
