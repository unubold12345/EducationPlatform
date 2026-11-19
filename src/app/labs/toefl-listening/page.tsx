import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listeningLabEnabled } from "@/lib/local-pilot";
import { getSession } from "@/lib/session";
import { labMocks } from "@/modules/exam-practice/lab-mocks";
import { LabMockPage } from "@/modules/exam-practice/lab-mock-page";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "TOEFL сонсгол · Workshop", robots: { index: false, follow: false } };

// Workshop → TOEFL (owner request 2026-11-19): the listening of the nine TOEFL mocks, each opened in the lab mock page
// (practice mode narrowed to listening). Guests see the list; a mock opens with the usual access (purchase or Англи хэл plan).
export default async function ToeflListeningPage() {
  if (!listeningLabEnabled()) notFound();
  const session = await getSession();
  return <LabMockPage exam="toefl" eyebrow="Listening · TOEFL iBT" title="TOEFL сонсгол" lead="TOEFL iBT mock-уудын Listening хэсэг цаггүй: бичлэгийг хэдэн ч удаа сонсоод хариулж, шалгасны дараа текстийг нь уншина." mocks={await labMocks(session?.user.id, "toefl", "listening")} />;
}
