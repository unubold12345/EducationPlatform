import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { readingLabEnabled } from "@/lib/local-pilot";
import { getSession } from "@/lib/session";
import { labMocks } from "@/modules/exam-practice/lab-mocks";
import { LabMockPage } from "@/modules/exam-practice/lab-mock-page";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "TOEFL уншлага · Workshop", robots: { index: false, follow: false } };

// Workshop → TOEFL (owner request 2026-11-19): the reading of the nine TOEFL mocks, each opened in the lab mock page
// (practice mode narrowed to reading). Guests see the list; a mock opens with the usual access (purchase or Англи хэл plan).
export default async function ToeflReadingPage() {
  if (!readingLabEnabled()) notFound();
  const session = await getSession();
  return <LabMockPage exam="toefl" eyebrow="Reading · TOEFL iBT" title="TOEFL уншлага" lead="TOEFL iBT mock-уудын Reading хэсэг цаггүй: Complete the Words, Read in Daily Life, Read an Academic Passage. Асуулт бүрийг шалгаж, тайлбарыг нь уншина." mocks={await labMocks(session?.user.id, "toefl", "reading")} />;
}
