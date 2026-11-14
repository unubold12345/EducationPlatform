import { apiFailure, apiUser, checkOrigin, privateJson, readJson } from "@/lib/api";
import { regenerateMyExam } from "@/modules/my-exams/service";

export const maxDuration = 180;

type Context = { params: Promise<{ id: string }> };

// A retry: new questions for the student's own exam from the text kept with it, at the retry price.
// The body is an empty object; the material, the count and the price are read from the account.
export async function POST(request: Request, context: Context) {
  try {
    checkOrigin(request);
    const user = await apiUser(request);
    const { id } = await context.params;
    return privateJson(await regenerateMyExam(user.id, id, await readJson(request, 256)));
  } catch (error) {
    return apiFailure(error);
  }
}
