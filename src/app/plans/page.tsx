import { redirect } from "next/navigation";

// The plans page moved into the Workspace on 2026-11-08; old links and bookmarks keep working.
export default function PlansRedirect() {
  redirect("/workspace/plans");
}
