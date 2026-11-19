import { apiFailure, apiUser, checkOrigin, privateJson, readJson } from "@/lib/api";
import { deleteTask, updateTask } from "@/modules/dashboard/service";
import { TASK_LIMITS } from "@/modules/dashboard/tasks";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    checkOrigin(request);
    const user = await apiUser(request);
    const { id } = await context.params;
    return privateJson(await updateTask(user.id, id, await readJson(request, TASK_LIMITS.bodyBytes)));
  } catch (error) {
    return apiFailure(error);
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    checkOrigin(request);
    const user = await apiUser(request);
    const { id } = await context.params;
    return privateJson(await deleteTask(user.id, id));
  } catch (error) {
    return apiFailure(error);
  }
}
