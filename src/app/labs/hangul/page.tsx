import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { studyGate } from "@/modules/language-decks/gate";
import { HangulStudy } from "@/modules/language-decks/hangul-client";
import { openLanguageDeck } from "@/modules/language-decks/service";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Хангыль · Workshop", robots: { index: false, follow: false } };

// Workshop → TOPIK → Hangul (2026-11-18): letters, the syllable chart, final consonants and sound-change rules, and a
// quiz on the chart. Paid like the word decks (Ази хэл Basic or Pro); progress uses the same table and review route.
export default async function HangulPage() {
  const user = await requireUser("/workspace/workshop?exam=topik");
  const gate = await studyGate(user.id, "topik", "Хангыль · 한글");
  if (gate) return gate;
  const { deck, progress } = await openLanguageDeck(user.id, "hangul");
  return <HangulStudy deck={deck} initialProgress={progress} />;
}
