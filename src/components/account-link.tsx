"use client";
import { useEffect } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

// The layout's head script copies this hint to <html data-account> before paint, so a refresh of a signed-in
// page does not flash "Нэвтрэх". It only hides the link while the session loads; the session check decides.
const HINT = "education-account";

// Guests get a sign-in link. Signed-in students reach their profile inside the Workspace, so the header shows nothing.
export function AccountLink() {
  const { data: session, isPending } = authClient.useSession();
  useEffect(() => {
    if (isPending) return;
    const value = session ? "member" : "guest";
    document.documentElement.dataset.account = value;
    try { localStorage.setItem(HINT, value); } catch {}
  }, [session, isPending]);
  if (session) return null;
  return <Link className="profile-link account-entry guest" href="/login" aria-busy={isPending || undefined}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/></svg>
    <span>Нэвтрэх</span>
  </Link>;
}
