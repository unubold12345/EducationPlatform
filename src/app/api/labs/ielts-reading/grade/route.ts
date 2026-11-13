import { apiFailure, apiUser, checkOrigin, privateJson, readJson } from "@/lib/api";
import { READING_LIMITS } from "@/modules/reading-lab/contracts";
import { gradeReadingPractice } from "@/modules/reading-lab/service";

// Marks the student's own practice from the key stored on the account and keeps the result there.
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const user = await apiUser(request);
    return privateJson(await gradeReadingPractice(user.id, await readJson(request, READING_LIMITS.gradeBodyBytes)));
  } catch (error) {
    return apiFailure(error);
  }
}
