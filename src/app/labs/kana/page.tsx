import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { studyGate } from "@/modules/language-decks/gate";
import { KanaStudy } from "@/modules/language-decks/kana-client";
import { openLanguageDeck } from "@/modules/language-decks/service";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Хирагана · Катакана · Workshop", robots: { index: false, follow: false } };

// Workshop → JLPT → Kana (owner request 2026-11-18): the hiragana and katakana charts, chart first, with cards and
// quizzes per row. Paid like the word decks; progress uses the same table and review route.
export default async function KanaPage() {
  const user = await requireUser("/workspace/workshop?exam=jlpt");
  const gate = await studyGate(user.id, "jlpt", "Хирагана · Катакана");
  if (gate) return gate;
  const [hiragana, katakana] = await Promise.all([openLanguageDeck(user.id, "kana-hiragana"), openLanguageDeck(user.id, "kana-katakana")]);
  return <KanaStudy userId={user.id} scripts={[hiragana.deck, katakana.deck]}
    initialProgress={{ [hiragana.deck.id]: hiragana.progress, [katakana.deck.id]: katakana.progress }} now={hiragana.now} />;
}
