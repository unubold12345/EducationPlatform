// Which pages render inside the Workspace shell (left tabs, no site header or footer).
export function inWorkspace(pathname: string) {
  if (pathname === "/workspace" || pathname.startsWith("/workspace/")) return true;
  // Monthly plan purchase and renewal, under the Plans tab.
  if (pathname.startsWith("/subscribe/")) return true;
  if (pathname === "/exams" || pathname.startsWith("/exams/")) return true;
  if (pathname.startsWith("/checkout/") || pathname.startsWith("/workshops/")) return true;
  if (["/labs/ielts-writing", "/labs/ielts-speaking", "/labs/ielts-listening"].includes(pathname)) return true;
  return false;
}

export type WorkspaceTab = "home" | "chat" | "flashcards" | "myexams" | "exams" | "review" | "workshop" | "plans" | "profile";
export function workspaceTab(pathname: string): WorkspaceTab | null {
  if (pathname === "/workspace") return "home";
  if (pathname.startsWith("/workspace/chat")) return "chat";
  if (pathname.startsWith("/workspace/flashcards")) return "flashcards";
  if (pathname.startsWith("/workspace/my-exams")) return "myexams";
  if (pathname.startsWith("/workspace/review")) return "review";
  if (pathname.startsWith("/workspace/workshop")) return "workshop";
  if (pathname.startsWith("/workshops/") || pathname.startsWith("/labs/ielts-")) return "workshop";
  if (pathname.startsWith("/workspace/plans") || pathname.startsWith("/subscribe/")) return "plans";
  if (pathname.startsWith("/workspace/profile")) return "profile";
  if (pathname === "/exams" || pathname.startsWith("/exams/") || pathname.startsWith("/checkout/")) return "exams";
  return null;
}
