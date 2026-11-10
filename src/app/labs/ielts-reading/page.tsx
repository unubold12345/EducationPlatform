import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { readingLabEnabled } from "@/lib/local-pilot";
import { getSession } from "@/lib/session";
import { ReadingLab } from "@/modules/reading-lab/client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Reading Lab · Workshop", robots: { index: false, follow: false } };

// The five sample passages are open to guests and during a timed mock, like the Listening Lab: they are original,
// unrelated to any mock and use no AI. Making a practice from the student's own material needs a session and credits.
export default async function ReadingLabPage() {
  if (!readingLabEnabled()) notFound();
  const session = await getSession();
  return <ReadingLab userKey={session?.user.id ?? null} />;
}
