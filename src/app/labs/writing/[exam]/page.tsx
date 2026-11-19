import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { studyGate } from "@/modules/language-decks/gate";
import { labMocks } from "@/modules/exam-practice/lab-mocks";
import { LabMockPage } from "@/modules/exam-practice/lab-mock-page";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ exam: string }> };

// JLPT has no writing paper, so only HSK and TOPIK have a writing workshop.
const WRITING = {
  hsk: { title: "HSK · Бичих", eyebrow: "书写 · HSK 2", lead: "HSK 2 mock-уудын бичих хэсэг: ханзны бүрэлдэхүүн сонгох, pinyin-аар ханз бичих. Хариугаа шалгаж, тайлбарыг нь уншина." },
  topik: { title: "TOPIK · Бичих", eyebrow: "쓰기 · TOPIK Ⅱ", lead: "TOPIK Ⅱ mock-уудын 쓰기 51–54: өгүүлбэр нөхөх, график тайлбарлах, эссэ. Бичсэнээ жишиг хариутай харьцуулна." },
} as const;
const isWritingExam = (value: string): value is keyof typeof WRITING => Object.hasOwn(WRITING, value);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { exam } = await params;
  return { title: isWritingExam(exam) ? `${WRITING[exam].title} · Workshop` : "Workshop", robots: { index: false, follow: false } };
}

// Workshop → HSK / TOPIK → Бичих (owner request 2026-11-19): the writing items of the mocks, each opened in the lab mock
// page. Like the rest of the JLPT/HSK/TOPIK workshops it needs the Ази хэл plan and is closed during a timed sitting.
export default async function WritingWorkshopPage({ params }: Props) {
  const { exam } = await params;
  if (!isWritingExam(exam)) notFound();
  const user = await requireUser(`/workspace/workshop?exam=${exam}`);
  const page = WRITING[exam];
  const gate = await studyGate(user.id, exam, page.title);
  if (gate) return gate;
  return <LabMockPage exam={exam} eyebrow={page.eyebrow} title={page.title} lead={page.lead} mocks={await labMocks(user.id, exam, "writing")} />;
}
