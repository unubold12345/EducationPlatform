import { apiFailure, apiUser, checkOrigin, privateJson, readJson } from "@/lib/api";
import { workspaceChatReply } from "@/modules/workspace/chat-service";
export const maxDuration = 75;
export async function POST(request: Request) {
  try { checkOrigin(request); const user = await apiUser(request); return privateJson(await workspaceChatReply(user.id, await readJson(request, 48000))); }
  catch (error) { return apiFailure(error); }
}
