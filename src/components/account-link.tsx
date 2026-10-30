"use client";
import { useEffect } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

// The layout's head script copies this hint to <html data-account> before paint, so a refresh shows the
// last known label instead of flashing "Нэвтрэх". It only picks a label; the session check decides the link.
const HINT = "education-account";

export function AccountLink() {
  const { data: session, isPending } = authClient.useSession();
  useEffect(() => {
    if (isPending) return;
    const value = session ? "member" : "guest";
    document.documentElement.dataset.account = value;
    try { localStorage.setItem(HINT, value); } catch {}
  }, [session, isPending]);
  const icon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/></svg>;
  if (isPending) return <Link className="profile-link account-entry" href="/profile" aria-busy="true">
    {icon}<span className="account-label-member">Миний профайл</span><span className="account-label-guest">Нэвтрэх</span>
  </Link>;
  return <Link className={"profile-link account-entry " + (session ? "member" : "guest")} href={session ? "/profile" : "/login"}>
    {icon}<span>{session ? "Миний профайл" : "Нэвтрэх"}</span>
  </Link>;
}
