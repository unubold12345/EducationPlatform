import { apiFailure, apiUser, privateJson } from "@/lib/api";
import { myExamLibrary } from "@/modules/my-exams/service";

// The mobile app's counterpart of /workspace/my-exams' server props: the signed-in student's saved exams and how
// many their plan keeps, read by the page's own loader. An exam carries its public questions, the open sitting and
// the graded history; the key and explanations stay on the server except inside a sitting that was already graded.
// Read-only: generating, sitting, grading, retrying and deleting use /api/workspace/my-exams/**.
export async function GET(request: Request) {
  try {
    const user = await apiUser(request);
    return privateJson(await myExamLibrary(user.id));
  } catch (error) { return apiFailure(error); }
}
