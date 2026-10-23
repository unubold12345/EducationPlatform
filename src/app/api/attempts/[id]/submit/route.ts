import { apiFailure, apiUser, checkOrigin, privateJson, readJson } from "@/lib/api";
import { writeAttempt } from "@/modules/attempts/service";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { checkOrigin(request); const user = await apiUser(request); return privateJson(await writeAttempt((await params).id, user.id, await readJson(request), true)); }
  catch (error) { return apiFailure(error); }
}

