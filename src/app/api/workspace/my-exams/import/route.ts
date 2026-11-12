import { apiFailure, apiUser, checkOrigin, privateJson, readJson } from "@/lib/api";
import { MY_EXAM_LIMITS } from "@/modules/my-exams/contracts";
import { importMyExam } from "@/modules/my-exams/service";

// Moves one exam saved in a browser before 2026-11-12 to the signed-in student's account.
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const user = await apiUser(request);
    return privateJson(await importMyExam(user.id, await readJson(request, MY_EXAM_LIMITS.importBodyBytes)));
  } catch (error) {
    return apiFailure(error);
  }
}
