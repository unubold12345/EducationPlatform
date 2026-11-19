import { apiFailure, apiUser, checkOrigin, privateJson, readJson } from "@/lib/api";
import { createTask } from "@/modules/dashboard/service";
import { TASK_LIMITS } from "@/modules/dashboard/tasks";

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const user = await apiUser(request);
    return privateJson(await createTask(user.id, await readJson(request, TASK_LIMITS.bodyBytes)), 201);
  } catch (error) {
    return apiFailure(error);
  }
}
