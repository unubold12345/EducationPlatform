import { apiFailure, apiUser, checkOrigin, privateJson, readJson } from "@/lib/api";
import { regenerateReadingPractice } from "@/modules/reading-lab/service";

export const maxDuration = 180;

type Context = { params: Promise<{ id: string }> };

// A retry: new questions on the passage of the student's own practice, at the retry price.
// The body is an empty object; the passage, the count and the price are read from the account.
export async function POST(request: Request, context: Context) {
  try {
    checkOrigin(request);
    const user = await apiUser(request);
    const { id } = await context.params;
    return privateJson(await regenerateReadingPractice(user.id, id, await readJson(request, 256)));
  } catch (error) {
    return apiFailure(error);
  }
}
