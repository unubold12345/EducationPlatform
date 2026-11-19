import { apiFailure, apiUser, checkOrigin, privateJson, readJson } from "@/lib/api";
import { deleteGoal, updateGoal } from "@/modules/dashboard/service";
import { GOAL_LIMITS } from "@/modules/dashboard/exams";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    checkOrigin(request);
    const user = await apiUser(request);
    const { id } = await context.params;
    return privateJson(await updateGoal(user.id, id, await readJson(request, GOAL_LIMITS.bodyBytes)));
  } catch (error) {
    return apiFailure(error);
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    checkOrigin(request);
    const user = await apiUser(request);
    const { id } = await context.params;
    return privateJson(await deleteGoal(user.id, id));
  } catch (error) {
    return apiFailure(error);
  }
}
