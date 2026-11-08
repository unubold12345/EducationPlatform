import type { ReactNode } from "react";
import { WorkspaceFrame } from "@/modules/workspace/frame";

// The whole mock flow, including timed sittings, results and practice, stays in the Workspace.
export default function ExamsLayout({ children }: { children: ReactNode }) {
  return <WorkspaceFrame>{children}</WorkspaceFrame>;
}
