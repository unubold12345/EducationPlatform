import { ApiError, apiFailure, apiUser, privateJson } from "@/lib/api";
import { creditEntries } from "@/modules/dashboard/service";

// The next page of the student's own AI charges: `?before=<id of the last entry shown>`.
export async function GET(request: Request) {
  try {
    const user = await apiUser(request);
    const before = new URL(request.url).searchParams.get("before");
    if (!before || before.length > 64 || !/^[A-Za-z0-9_-]+$/.test(before)) throw new ApiError(400, "Хүсэлт буруу байна.");
    return privateJson(await creditEntries(user.id, before));
  } catch (error) {
    return apiFailure(error);
  }
}
