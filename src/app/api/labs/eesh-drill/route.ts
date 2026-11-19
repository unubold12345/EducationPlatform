import { ApiError, apiFailure, apiUser, privateJson } from "@/lib/api";
import { TimedSittingOpen } from "@/modules/exam-practice/service";
import { drillFilter } from "@/modules/eesh-workshop/contracts";
import { eeshInsights } from "@/modules/eesh-workshop/insights";
import { eeshDrill } from "@/modules/eesh-workshop/service";

// Workshop → ЭЕШ: ten questions of one topic (?topic=) or domain (?domain=) across the years. Key-free; the student
// checks each answer through /api/exam-practice/<slug>/check, which applies the same access and sitting rules.
export async function GET(request: Request) {
  try {
    const user = await apiUser(request);
    const params = new URL(request.url).searchParams;
    const insights = eeshInsights(params.get("subject") ?? "");
    const filter = insights ? drillFilter(insights, params) : null;
    if (!insights || !filter) throw new ApiError(400, "Хичээл эсвэл сэдэв буруу байна.");
    return privateJson(await eeshDrill(user.id, insights, filter));
  } catch (error) {
    if (error instanceof TimedSittingOpen) return privateJson({ error: error.message, href: error.href }, 403);
    return apiFailure(error);
  }
}
