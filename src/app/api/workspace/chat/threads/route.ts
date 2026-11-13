import { apiFailure, apiUser, privateJson } from "@/lib/api";
import { listChatThreads } from "@/modules/workspace/chat-threads";

// The signed-in student's own chat threads, most recently used first.
export async function GET(request: Request) {
  try {
    const user = await apiUser(request);
    return privateJson({ threads: await listChatThreads(user.id) });
  } catch (error) {
    return apiFailure(error);
  }
}
