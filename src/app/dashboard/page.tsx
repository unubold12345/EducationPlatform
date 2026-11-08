import { redirect } from "next/navigation";

// The dashboard became the Workspace home on 2026-11-08; old links and bookmarks keep working.
export default function DashboardPage() {
  redirect("/workspace");
}
