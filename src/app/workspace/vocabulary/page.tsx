import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { vocabularyBank } from "@/modules/vocabulary/service";
import { Vocabulary } from "@/modules/vocabulary/client";

export const metadata: Metadata = { title: "Үгсийн сан" };

export default async function VocabularyPage() {
  const user = await requireUser("/workspace/vocabulary");
  const { words, decks, space, now } = await vocabularyBank(user.id);
  return <Vocabulary userId={user.id} initialWords={words} initialDecks={decks} space={space} now={now} />;
}
