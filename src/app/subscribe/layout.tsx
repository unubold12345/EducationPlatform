import type { ReactNode } from "react";
import { WorkspaceFrame } from "@/modules/workspace/frame";

// Buying or renewing a monthly plan happens inside the Workspace, under its Plans tab (owner request 2026-11-08).
// The address stays /subscribe/<program>, which plan cards, programme pages and sign-in return paths already use.
export default function SubscribeLayout({ children }: { children: ReactNode }) {
  return <WorkspaceFrame>{children}</WorkspaceFrame>;
}
