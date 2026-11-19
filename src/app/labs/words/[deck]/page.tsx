import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { findLanguageDeck, isStudyDeck } from "@/modules/language-decks/catalog";
import { DeckStudy } from "@/modules/language-decks/client";
import { studyGate } from "@/modules/language-decks/gate";
import { openLanguageDeck } from "@/modules/language-decks/service";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ deck: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const deck = findLanguageDeck((await params).deck);
  return { title: deck ? `${deck.title}${deck.kind === "kanji" ? "" : " үгс"} · Workshop` : "Workshop", robots: { index: false, follow: false } };
}

// A JLPT/HSK/TOPIK word deck or a JLPT kanji deck (Workshop → JLPT / HSK / TOPIK). Paid only (Ази хэл Basic or Pro) and closed during a timed sitting;
// the review route checks both again. The kana charts have their own page (/labs/kana).
export default async function LanguageDeckPage({ params }: Props) {
  const { deck: id } = await params;
  const info = findLanguageDeck(id);
  if (!info || !isStudyDeck(info)) notFound();
  // Sign-in returns to the exam's Workshop tab (the login page only returns to /workspace, /exams and checkout paths).
  const user = await requireUser(`/workspace/workshop?exam=${info.exam}`);
  const gate = await studyGate(user.id, info.exam, info.kind === "kanji" ? info.title : `${info.title} үгсийн сан`);
  if (gate) return gate;
  const { deck, progress, now } = await openLanguageDeck(user.id, id);
  return <DeckStudy userId={user.id} deck={deck} initialProgress={progress} now={now} />;
}
