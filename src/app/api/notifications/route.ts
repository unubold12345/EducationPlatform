import { ApiError, apiFailure, apiUser, checkOrigin, privateJson, readJson } from "@/lib/api";
import { listNotifications, markNotificationsRead } from "@/modules/notifications/service";
import { parseMarkIds } from "@/modules/notifications/rules";

// The signed-in student's own inbox, newest first, with the unread count.
export async function GET(request: Request) {
  try {
    const user = await apiUser(request);
    return privateJson(await listNotifications(user.id));
  } catch (error) {
    return apiFailure(error);
  }
}

// Marks the student's own notices read: {"action":"read","ids":[...]} or {"action":"read-all"}.
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const user = await apiUser(request);
    const input = await readJson(request, 4096);
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new ApiError(400, "Хүсэлтийн бүтэц буруу байна.");
    const body = input as Record<string, unknown>;
    if (body.action === "read-all" && Object.keys(body).length === 1) return privateJson(await markNotificationsRead(user.id, "all"));
    const ids = body.action === "read" && Object.keys(body).length === 2 ? parseMarkIds(body.ids) : null;
    if (!ids) throw new ApiError(400, "Хүсэлтийн бүтэц буруу байна.");
    return privateJson(await markNotificationsRead(user.id, ids));
  } catch (error) {
    return apiFailure(error);
  }
}
