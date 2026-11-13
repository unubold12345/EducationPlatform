import type { Metadata } from "next";
import { Suspense } from "react";
import { requireUser } from "@/lib/session";
import { WorkspaceChat } from "@/modules/workspace/chat";
import { isChatThreadId } from "@/modules/workspace/chat-contract";
import { listChatThreads, readChatThread } from "@/modules/workspace/chat-threads";
export const metadata: Metadata = { title: "AI туслах" };

export default async function WorkspaceChatPage({ searchParams }: { searchParams: Promise<{ thread?: string | string[] }> }) {
  const user = await requireUser("/workspace/chat");
  const { thread } = await searchParams;
  const id = typeof thread === "string" && isChatThreadId(thread) ? thread : null;
  // Chats live on the account: the list and the open thread are read here, scoped to this student. If either read
  // fails, the page reads it again from the browser and says so there.
  const [threads, open] = await Promise.all([
    listChatThreads(user.id).catch(() => null),
    id ? readChatThread(user.id, id).catch(() => null) : null,
  ]);
  return <Suspense><WorkspaceChat userKey={user.id} firstName={user.name.trim().split(/\s+/)[0] || "Сайн уу"} threads={threads} initial={open} /></Suspense>;
}
