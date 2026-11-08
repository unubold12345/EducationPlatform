import type { Metadata } from "next";
import { Suspense } from "react";
import { requireUser } from "@/lib/session";
import { WorkspaceChat } from "@/modules/workspace/chat";
export const metadata: Metadata = { title: "AI туслах" };

export default async function WorkspaceChatPage() {
  const user = await requireUser("/workspace/chat");
  return <Suspense><WorkspaceChat userKey={user.id} firstName={user.name.trim().split(/\s+/)[0] || "Сайн уу"} /></Suspense>;
}
