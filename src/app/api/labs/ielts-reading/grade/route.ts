import { apiFailure, apiUser, checkOrigin, privateJson, readJson } from "@/lib/api";
import { READING_LIMITS } from "@/modules/reading-lab/contracts";
import { gradeReadingPractice } from "@/modules/reading-lab/service";

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const user = await apiUser(request);
    return privateJson(gradeReadingPractice(user.id, await readJson(request, READING_LIMITS.gradeBodyBytes)));
  } catch (error) {
    return apiFailure(error);
  }
}
