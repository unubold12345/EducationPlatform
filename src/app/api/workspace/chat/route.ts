import { apiFailure, apiUser, checkOrigin, privateJson, readJson } from "@/lib/api";
import { workspaceChatReply } from "@/modules/workspace/chat-service";
import { CHAT_BODY_BYTES } from "@/modules/workspace/chat-contract";
export const maxDuration = 75;
export async function POST(request: Request) {
  try { checkOrigin(request); const user = await apiUser(request); return privateJson(await workspaceChatReply(user.id, await readJson(request, CHAT_BODY_BYTES))); }
  catch (error) { return apiFailure(error); }
}
