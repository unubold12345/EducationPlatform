import "server-only";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import { WorkspaceShell } from "./shell";
import { shellAccount } from "./data";
import "./workspace.css";

// Mongolian Ө and Ү live in the cyrillic-ext subset, so both Cyrillic subsets are required.
const workspaceFont = Inter({ subsets: ["latin", "cyrillic", "cyrillic-ext"], variable: "--font-wsp", display: "swap" });

/** Server half of the Workspace frame: who is signed in and which plans are active. The daily streak was removed
 * on 2026-11-14 (owner request). */
export async function WorkspaceFrame({ children }: { children: ReactNode }) {
  const account = await shellAccount();
  return <WorkspaceShell account={account} fontClass={workspaceFont.variable}>{children}</WorkspaceShell>;
}
