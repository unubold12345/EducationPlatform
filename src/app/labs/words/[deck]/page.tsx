import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { findLanguageDeck } from "@/modules/language-decks/catalog";
import { DeckStudy } from "@/modules/language-decks/client";
import { studyGate } from "@/modules/language-decks/gate";
import { openLanguageDeck } from "@/modules/language-decks/service";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ deck: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const deck = findLanguageDeck((await params).deck);
  return { title: deck ? `${deck.title} үгс · Workshop` : "Workshop", robots: { index: false, follow: false } };
}

// A JLPT/HSK word deck (Workshop → JLPT / HSK). Paid only (Гадаад хэл Basic or Pro) and closed during a timed sitting;
// the review route checks both again. The kana charts have their own page (/labs/kana).
export default async function LanguageDeckPage({ params }: Props) {
  const { deck: id } = await params;
  const info = findLanguageDeck(id);
  if (!info || info.kind !== "words") notFound();
  // Sign-in returns to the exam's Workshop tab (the login page only returns to /workspace, /exams and checkout paths).
  const user = await requireUser(`/workspace/workshop?exam=${info.exam}`);
  const gate = await studyGate(user.id, info.exam, `${info.title} үгсийн сан`);
  if (gate) return gate;
  const { deck, progress, now } = await openLanguageDeck(user.id, id);
  return <DeckStudy userId={user.id} deck={deck} initialProgress={progress} now={now} />;
}
