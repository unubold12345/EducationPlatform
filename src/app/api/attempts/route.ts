import { ApiError, apiFailure, apiUser, checkOrigin, privateJson, readJson } from "@/lib/api";
import { startAttempt } from "@/modules/attempts/service";
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const user = await apiUser(request);
    let examId: string | undefined;
    // Node may expose an empty POST as a stream. Preserve the legacy no-body start.
    const hasBody = request.headers.has("content-type") || Number(request.headers.get("content-length") ?? "0") > 0 || request.headers.has("transfer-encoding");
    if (hasBody) {
      const input = await readJson(request);
      if (!input || typeof input !== "object" || !("examId" in input) || typeof input.examId !== "string" || input.examId.length > 100) throw new ApiError(400, "Дасгалаа сонгоно уу.");
      examId = input.examId;
    }
    return privateJson(await startAttempt(user.id, examId));
  }
  catch (error) { return apiFailure(error); }
}

