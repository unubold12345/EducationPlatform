import { apiFailure, apiUser, checkOrigin, privateJson } from "@/lib/api";
import { createMyExam } from "@/modules/my-exams/service";

export const maxDuration = 180;

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const user = await apiUser(request);
    return privateJson(await createMyExam(user.id, request));
  } catch (error) {
    return apiFailure(error);
  }
}
