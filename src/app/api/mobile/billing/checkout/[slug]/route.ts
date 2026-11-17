import { ApiError, apiFailure, apiUser, privateJson } from "@/lib/api";
import { getDb } from "@/lib/db";
import { getExam } from "@/modules/content/published";
import { entranceSubjectFormats } from "@/modules/exams/entrance/subjects";
import { isFreeMock } from "@/modules/exams/free/catalog";
import { mockPaymentsEnabled } from "@/modules/exams/payments";
import { MOCK_PRICE_LABEL } from "@/modules/exams/pricing";
import { mockAccess } from "@/modules/subscriptions/mock-access";

// The mobile app's counterpart of /checkout/[slug] (src/app/checkout/[slug]/page.tsx): the same exam lookup, the
// student's own purchase row and the one access rule, as JSON. `state` names which of the page's three screens to
// show. Read-only; the order is created and confirmed through /api/mock-payments.
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const user = await apiUser(request);
    const { slug } = await params;
    const exam = slug.length > 80 ? undefined : await getExam(slug);
    if (!exam) throw new ApiError(404, "Шалгалт олдсонгүй.");
    const summary = { slug: exam.slug, title: exam.title };
    // A free mock is never sold: every signed-in account sits it at no cost.
    if (isFreeMock(exam.slug)) return privateJson({ state: "free", exam: summary });
    const order = await getDb().mockPurchase.findUnique({ where: { userId_examSlug: { userId: user.id, examSlug: exam.slug } } });
    const access = await mockAccess(user.id, exam.slug, exam.program);
    const paid = order?.status === "PAID";
    if ((access.kind === "plan" || access.kind === "picked") && !paid) return privateJson({ state: "included", exam: summary, picked: access.kind === "picked" });
    return privateJson({
      state: "checkout",
      exam: {
        ...summary,
        label: exam.program === "hsk" ? "HSK 1 · ХЯТАД ХЭЛ" : exam.program === "jlpt" ? "JLPT · N5/N4" : exam.program === "entrance" ? "ЭЕШ · MOCK" : exam.program === "sat" ? "DIGITAL SAT" : "IELTS ACADEMIC",
        format: exam.program === "hsk" ? "40 асуулт · Хятад audio-той сонсох · Унших · 32 минут" : exam.program === "jlpt" ? "Үгийн сан · Хэлзүй, унших · Япон Listening audio"
          : exam.program === "entrance" ? entranceSubjectFormats[exam.subject ?? "math"] : exam.program === "sat" ? "98 асуулт · Reading & Writing, Math · Стандарт цаг, завсарлага" : "40 Listening + 40 Reading · 2 Writing task · Speaking бичлэг",
      },
      priceLabel: MOCK_PRICE_LABEL,
      // The receipt of a paid order; an unpaid order only says whether its last test payment was declined.
      receipt: paid ? { id: order.id, amountMnt: order.amountMnt, legacy: order.provider === "LEGACY" } : null,
      declined: order?.status === "DECLINED",
      picksLeft: access.kind === "pickable" && !paid ? access.month.limit - access.month.used : null,
      enabled: mockPaymentsEnabled(),
    });
  } catch (error) { return apiFailure(error); }
}
