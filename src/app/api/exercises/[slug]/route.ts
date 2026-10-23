import { ApiError, apiFailure, readJson, privateJson, apiUser, checkOrigin } from "@/lib/api";
import { requireSubscription } from "@/modules/subscriptions/access";
import { getExercise } from "@/modules/content/published";
import { gradeExercise } from "@/modules/exercises/grading";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const input=await readJson(request);
    const examId=input&&typeof input==="object"&&"examId" in input?input.examId:undefined;
    if(examId!==undefined&&typeof examId!=="string")throw new ApiError(400,"Хувилбар буруу.");
    const exercise = await getExercise((await params).slug,examId as string|undefined);
    if (!exercise) throw new ApiError(404, "Дасгал олдсонгүй.");
    checkOrigin(request);const user=await apiUser(request);await requireSubscription(user.id,exercise.program);
    const result = gradeExercise(exercise, input);
    if (!result) throw new ApiError(400, "Бүх асуултад зөв хэлбэрээр хариулна уу.");
    return privateJson(result);
  } catch (error) { return apiFailure(error); }
}
