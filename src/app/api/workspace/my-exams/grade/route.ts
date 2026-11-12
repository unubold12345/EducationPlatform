import { apiFailure, apiUser, checkOrigin, privateJson, readJson } from "@/lib/api";
import { MY_EXAM_LIMITS } from "@/modules/my-exams/contracts";
import { gradeMyExam } from "@/modules/my-exams/service";

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const user = await apiUser(request);
    return privateJson(await gradeMyExam(user.id, await readJson(request, MY_EXAM_LIMITS.gradeBodyBytes)));
  } catch (error) {
    return apiFailure(error);
  }
}
