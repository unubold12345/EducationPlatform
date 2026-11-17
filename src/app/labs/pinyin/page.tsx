import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { pinyinChart } from "@/modules/language-decks/content";
import { studyGate } from "@/modules/language-decks/gate";
import { PinyinStudy } from "@/modules/language-decks/pinyin-client";
import { openLanguageDeck } from "@/modules/language-decks/service";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pinyin · аялгуу · Workshop", robots: { index: false, follow: false } };

// Workshop → HSK → Pinyin (owner request 2026-11-18): tones, the initials × finals chart (chart first) and a tone drill
// on HSK 1/2 words. Paid like the word decks; drill progress uses the same table and review route ("hsk-tones").
export default async function PinyinPage() {
  const user = await requireUser("/workspace/workshop?exam=hsk");
  const gate = await studyGate(user.id, "hsk", "Pinyin · аялгуу");
  if (gate) return gate;
  const { deck, progress } = await openLanguageDeck(user.id, "hsk-tones");
  return <PinyinStudy chart={pinyinChart()} drill={deck} initialProgress={progress} />;
}
