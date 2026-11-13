import "server-only";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import { WorkspaceShell } from "./shell";
import { shellAccount } from "./data";
import { streakSummary } from "@/modules/roadmap/service";
import "./workspace.css";

// Mongolian Ө and Ү live in the cyrillic-ext subset, so both Cyrillic subsets are required.
const workspaceFont = Inter({ subsets: ["latin", "cyrillic", "cyrillic-ext"], variable: "--font-wsp", display: "swap" });

/** Server half of the Workspace frame: who is signed in, which plans are active and the daily streak. */
export async function WorkspaceFrame({ children }: { children: ReactNode }) {
  const account = await shellAccount();
  const streak = account ? await streakSummary(account.userKey) : null;
  return <WorkspaceShell account={account} streak={streak} fontClass={workspaceFont.variable}>{children}</WorkspaceShell>;
}
