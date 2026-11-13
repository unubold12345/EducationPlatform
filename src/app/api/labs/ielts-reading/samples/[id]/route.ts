import { apiFailure, apiUser, checkOrigin, privateJson, readJson } from "@/lib/api";
import { READING_LIMITS } from "@/modules/reading-lab/contracts";
import { updateSampleProgress } from "@/modules/reading-lab/service";

type Context = { params: Promise<{ id: string }> };

// A signed-in student's progress on a built-in sample: save, check (marked on the server) or clear.
export async function PATCH(request: Request, context: Context) {
  try {
    checkOrigin(request);
    const user = await apiUser(request);
    const { id } = await context.params;
    return privateJson(await updateSampleProgress(user.id, id, await readJson(request, READING_LIMITS.progressBodyBytes)));
  } catch (error) {
    return apiFailure(error);
  }
}
