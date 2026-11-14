import { ApiError, apiFailure, apiUser, checkOrigin, privateJson, readJson } from "@/lib/api";
import { findExam } from "@/modules/exams/definitions";
import { pickMock } from "@/modules/subscriptions/mock-access";

// Picks a mock for the current Гадаад хэл plan month ({ slug }). The server decides whether a pick is needed,
// counts the month's picks under a row lock and never uses a pick for a mock that is already open.
export async function POST(request: Request) {
  try {
    checkOrigin(request); const user = await apiUser(request); const input = await readJson(request, 1024);
    if (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).length !== 1) throw new ApiError(400, "Шалгалтаа сонгоно уу.");
    const { slug } = input as Record<string, unknown>;
    if (typeof slug !== "string" || !slug || slug.length > 80) throw new ApiError(400, "Шалгалтаа сонгоно уу.");
    const exam = findExam(slug);
    if (!exam) throw new ApiError(404, "Шалгалт олдсонгүй.");
    return privateJson(await pickMock(user.id, exam.slug, exam.program));
  } catch (error) { return apiFailure(error); }
}
