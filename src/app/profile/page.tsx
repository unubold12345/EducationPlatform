import { redirect } from "next/navigation";

// The profile moved into the Workspace on 2026-11-08; old links, bookmarks and Google link errors keep working.
export default async function ProfileRedirect({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  redirect(typeof error === "string" && error ? "/workspace/profile?error=" + encodeURIComponent(error) : "/workspace/profile");
}
