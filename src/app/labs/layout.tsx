import type { ReactNode } from "react";
import { WorkspaceFrame } from "@/modules/workspace/frame";

export default function LabsLayout({ children }: { children: ReactNode }) {
  return <WorkspaceFrame>{children}</WorkspaceFrame>;
}
