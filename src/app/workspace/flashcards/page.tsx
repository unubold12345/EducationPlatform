import { redirect } from "next/navigation";

// Flashcards became the saved vocabulary bank on 2026-11-09. Keep old links working.
export default function FlashcardRedirect() {
  redirect("/workspace/vocabulary");
}
