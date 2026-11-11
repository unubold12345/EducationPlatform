import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { vocabularyBank } from "@/modules/vocabulary/service";
import { Vocabulary } from "@/modules/vocabulary/client";

export const metadata: Metadata = { title: "Үгсийн сан" };

export default async function VocabularyPage() {
  const user = await requireUser("/workspace/vocabulary");
  const { words, decks, limit, now } = await vocabularyBank(user.id);
  return <Vocabulary userId={user.id} initialWords={words} initialDecks={decks} limit={limit} now={now} />;
}
