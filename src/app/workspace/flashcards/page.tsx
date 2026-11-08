import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { Flashcards } from "@/modules/flashcards/client";

export const metadata: Metadata = { title: "Флашкарт" };

export default async function FlashcardsPage() {
  const user = await requireUser("/workspace/flashcards");
  return <Flashcards userKey={user.id} />;
}
