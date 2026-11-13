import { apiFailure, apiUser, checkOrigin, privateJson } from "@/lib/api";
import { deleteChatThread, readChatThread } from "@/modules/workspace/chat-threads";

type Context = { params: Promise<{ id: string }> };

// One of the student's own threads with its messages.
export async function GET(request: Request, context: Context) {
  try {
    const user = await apiUser(request);
    const { id } = await context.params;
    return privateJson({ thread: await readChatThread(user.id, id) });
  } catch (error) {
    return apiFailure(error);
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    checkOrigin(request);
    const user = await apiUser(request);
    const { id } = await context.params;
    return privateJson(await deleteChatThread(user.id, id));
  } catch (error) {
    return apiFailure(error);
  }
}
