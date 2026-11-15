import { ApiError, apiFailure, apiUser, checkOrigin, privateJson, readJson } from "@/lib/api";
import { assertAdmin } from "@/modules/admin/service";
import { sendAnnouncement, withdrawAnnouncement } from "@/modules/notifications/service";

// Admin only: {"action":"send",title,body,href?,email?} or {"action":"withdraw","id":...}.
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const user = await apiUser(request);
    await assertAdmin(user.id);
    const input = await readJson(request, 4096);
    const action = input && typeof input === "object" && !Array.isArray(input) ? (input as Record<string, unknown>).action : null;
    if (action === "send") return privateJson(await sendAnnouncement(user.id, input));
    if (action === "withdraw") return privateJson(await withdrawAnnouncement(user.id, (input as Record<string, unknown>).id));
    throw new ApiError(400, "Үйлдэл зөвшөөрөгдөөгүй.");
  } catch (error) {
    return apiFailure(error);
  }
}
