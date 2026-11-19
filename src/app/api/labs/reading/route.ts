import { apiFailure, apiUser, checkOrigin, privateJson, readJson } from "@/lib/api";
import { READING_LIMITS } from "@/modules/language-reading/contracts";
import { createLanguageReading } from "@/modules/language-reading/service";

export const maxDuration = 180;

// Workshop → JLPT / HSK / TOPIK → Унших дасгал: one AI-written reading text, paid with credits. Same origin, a verified
// session and a small JSON body here; the plan, open-sitting, quota and credit checks are in the service.
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const user = await apiUser(request);
    return privateJson(await createLanguageReading(user.id, await readJson(request, READING_LIMITS.bodyBytes)));
  } catch (error) {
    return apiFailure(error);
  }
}
