import { apiFailure, apiUser, checkOrigin, privateJson, readJson } from "@/lib/api";
import { READING_LIMITS } from "@/modules/reading-lab/contracts";
import { importReading } from "@/modules/reading-lab/service";

// Moves Reading Lab work a browser kept before 2026-11-12 to the signed-in student's account.
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const user = await apiUser(request);
    return privateJson(await importReading(user.id, await readJson(request, READING_LIMITS.importBodyBytes)));
  } catch (error) {
    return apiFailure(error);
  }
}
