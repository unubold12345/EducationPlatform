import { apiFailure, apiUser, checkOrigin, privateJson, readJson } from "@/lib/api";
import { createGoal } from "@/modules/dashboard/service";
import { GOAL_LIMITS } from "@/modules/dashboard/exams";

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const user = await apiUser(request);
    return privateJson(await createGoal(user.id, await readJson(request, GOAL_LIMITS.bodyBytes)), 201);
  } catch (error) {
    return apiFailure(error);
  }
}
