import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { readingLabEnabled } from "@/lib/local-pilot";
import { getSession } from "@/lib/session";
import { ReadingLab } from "@/modules/reading-lab/client";
import { readingLibrary } from "@/modules/reading-lab/service";
import { labMocks } from "@/modules/exam-practice/lab-mocks";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Reading Lab · Workshop", robots: { index: false, follow: false } };

// The five sample passages are open to guests and during a timed mock, like the Listening Lab: they are original,
// unrelated to any mock and use no AI. Making a practice from the student's own material needs a session and credits.
// A signed-in student's practices and sample progress live on the account and are read here.
export default async function ReadingLabPage() {
  if (!readingLabEnabled()) notFound();
  const session = await getSession();
  const userId = session?.user.id ?? null;
  const [library, mocks] = await Promise.all([userId ? readingLibrary(userId) : null, labMocks(userId ?? undefined, "ielts", "reading")]);
  // Since 2026-11-19 (owner request) the IELTS mocks' reading is listed too; a mock opens in the lab mock page.
  return <ReadingLab userKey={userId} initialPractices={library?.practices ?? []} initialSamples={library?.samples ?? {}} initialLimit={library?.limit} mocks={mocks} />;
}
