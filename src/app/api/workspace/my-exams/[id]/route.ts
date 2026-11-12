import { apiFailure, apiUser, checkOrigin, privateJson, readJson } from "@/lib/api";
import { MY_EXAM_LIMITS } from "@/modules/my-exams/contracts";
import { deleteMyExam, updateMyExam } from "@/modules/my-exams/service";

type Context = { params: Promise<{ id: string }> };

// Start a sitting or save its progress on the student's own exam.
export async function PATCH(request: Request, context: Context) {
  try {
    checkOrigin(request);
    const user = await apiUser(request);
    const { id } = await context.params;
    return privateJson(await updateMyExam(user.id, id, await readJson(request, MY_EXAM_LIMITS.sittingBodyBytes)));
  } catch (error) {
    return apiFailure(error);
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    checkOrigin(request);
    const user = await apiUser(request);
    const { id } = await context.params;
    return privateJson(await deleteMyExam(user.id, id));
  } catch (error) {
    return apiFailure(error);
  }
}
