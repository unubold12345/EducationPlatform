import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { isLanguageExam } from "@/modules/language-decks/catalog";
import { studyGate } from "@/modules/language-decks/gate";
import { LanguageReading } from "@/modules/language-reading/client";
import { labMocks } from "@/modules/exam-practice/lab-mocks";
import { LabMockSection } from "@/modules/exam-practice/lab-mock-page";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ exam: string }> };

const TITLE = { jlpt: "JLPT", hsk: "HSK", topik: "TOPIK" } as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { exam } = await params;
  return { title: isLanguageExam(exam) ? `${TITLE[exam]} унших дасгал · Workshop` : "Workshop", robots: { index: false, follow: false } };
}

// Workshop → JLPT / HSK / TOPIK → Унших дасгал (owner request 2026-11-19): AI-written short texts to read with furigana,
// pinyin or romanization and a Mongolian translation, no questions. Paid like the decks (Ази хэл Basic or Pro) and
// closed during a timed sitting; the generate route checks both again and charges credits. Under it, the reading
// sections of the exam's mocks open in the lab mock page (owner request 2026-11-19: their own reading workshop).
export default async function LanguageReadingPage({ params }: Props) {
  const { exam } = await params;
  if (!isLanguageExam(exam)) notFound();
  const user = await requireUser(`/workspace/workshop?exam=${exam}`);
  const gate = await studyGate(user.id, exam, `${TITLE[exam]} · Унших дасгал`);
  if (gate) return gate;
  return <LanguageReading userId={user.id} exam={exam}><LabMockSection title="Mock-ийн уншлага" mocks={await labMocks(user.id, exam, "reading")} /></LanguageReading>;
}
