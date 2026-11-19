// Which pages render inside the Workspace shell (left tabs, no site header or footer).
export function inWorkspace(pathname: string) {
  if (pathname === "/workspace" || pathname.startsWith("/workspace/")) return true;
  // Monthly plan purchase and renewal, under the Plans tab.
  if (pathname.startsWith("/subscribe/")) return true;
  if (pathname === "/exams" || pathname.startsWith("/exams/")) return true;
  if (pathname.startsWith("/checkout/") || pathname.startsWith("/workshops/")) return true;
  if (["/labs/ielts-writing", "/labs/ielts-speaking", "/labs/ielts-listening", "/labs/ielts-reading"].includes(pathname)) return true;
  // JLPT/HSK word decks (Workshop → JLPT / HSK, 2026-11-18).
  if (pathname.startsWith("/labs/words/") || pathname === "/labs/kana" || pathname === "/labs/pinyin" || pathname === "/labs/hangul") return true;
  // JLPT/HSK/TOPIK reading practice (Workshop, 2026-11-19).
  if (pathname.startsWith("/labs/reading/")) return true;
  // TOEFL labs, JLPT/HSK/TOPIK writing and one skill of a mock opened from a lab (Workshop, 2026-11-19).
  if (pathname === "/labs/toefl-listening" || pathname === "/labs/toefl-reading" || pathname === "/labs/toefl-writing" || pathname === "/labs/toefl-speaking" || pathname.startsWith("/labs/writing/") || pathname.startsWith("/labs/mock/")) return true;
  // ЭЕШ subjects (Workshop → ЭЕШ, 2026-11-20).
  if (pathname.startsWith("/labs/eesh/")) return true;
  return false;
}

export type WorkspaceTab = "home" | "dashboard" | "chat" | "vocabulary" | "myexams" | "exams" | "review" | "workshop" | "plans" | "profile";
export function workspaceTab(pathname: string): WorkspaceTab | null {
  if (pathname === "/workspace") return "home";
  if (pathname.startsWith("/workspace/dashboard")) return "dashboard";
  if (pathname.startsWith("/workspace/chat")) return "chat";
  if (pathname.startsWith("/workspace/vocabulary") || pathname.startsWith("/workspace/flashcards")) return "vocabulary";
  if (pathname.startsWith("/workspace/my-exams")) return "myexams";
  if (pathname.startsWith("/workspace/review")) return "review";
  if (pathname.startsWith("/workspace/workshop")) return "workshop";
  if (pathname.startsWith("/workshops/") || pathname.startsWith("/labs/ielts-") || pathname.startsWith("/labs/words/") || pathname === "/labs/kana" || pathname === "/labs/pinyin" || pathname === "/labs/hangul" || pathname.startsWith("/labs/reading/")
    || pathname.startsWith("/labs/toefl-") || pathname.startsWith("/labs/writing/") || pathname.startsWith("/labs/mock/") || pathname.startsWith("/labs/eesh/")) return "workshop";
  if (pathname.startsWith("/workspace/plans") || pathname.startsWith("/subscribe/")) return "plans";
  if (pathname.startsWith("/workspace/profile")) return "profile";
  if (pathname === "/exams" || pathname.startsWith("/exams/") || pathname.startsWith("/checkout/")) return "exams";
  return null;
}
