import { apiFailure, apiUser, checkOrigin, privateJson } from "@/lib/api";
import { checkIn } from "@/modules/roadmap/service";

// Today's check-in, sent by the Workspace once a day. No body: the day comes from the server clock.
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const user = await apiUser(request);
    return privateJson(await checkIn(user.id));
  } catch (error) {
    return apiFailure(error);
  }
}
