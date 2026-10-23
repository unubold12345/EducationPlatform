import { apiFailure, apiUser, checkOrigin, privateJson, readJson } from "@/lib/api";
import { readAttempt, writeAttempt } from "@/modules/attempts/service";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, { params }: Context) {
  try { const user = await apiUser(request); return privateJson(await readAttempt((await params).id, user.id)); }
  catch (error) { return apiFailure(error); }
}
export async function PATCH(request: Request, { params }: Context) {
  try { checkOrigin(request); const user = await apiUser(request); return privateJson(await writeAttempt((await params).id, user.id, await readJson(request), false)); }
  catch (error) { return apiFailure(error); }
}

