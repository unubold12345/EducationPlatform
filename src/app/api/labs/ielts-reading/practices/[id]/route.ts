import { apiFailure, apiUser, checkOrigin, privateJson, readJson } from "@/lib/api";
import { READING_LIMITS } from "@/modules/reading-lab/contracts";
import { deleteReadingPractice, updateReadingPractice } from "@/modules/reading-lab/service";

type Context = { params: Promise<{ id: string }> };

// Save answers and the timer on the student's own practice, or clear a checked one for another attempt.
export async function PATCH(request: Request, context: Context) {
  try {
    checkOrigin(request);
    const user = await apiUser(request);
    const { id } = await context.params;
    return privateJson(await updateReadingPractice(user.id, id, await readJson(request, READING_LIMITS.progressBodyBytes)));
  } catch (error) {
    return apiFailure(error);
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    checkOrigin(request);
    const user = await apiUser(request);
    const { id } = await context.params;
    return privateJson(await deleteReadingPractice(user.id, id));
  } catch (error) {
    return apiFailure(error);
  }
}
