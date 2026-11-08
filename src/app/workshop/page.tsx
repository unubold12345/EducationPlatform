import { redirect } from "next/navigation";

// Workshop moved into the Workspace on 2026-11-08; old links keep working.
export default function WorkshopIndex() {
  redirect("/workspace/workshop");
}
