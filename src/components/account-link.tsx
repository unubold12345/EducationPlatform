"use client";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export function AccountLink() {
  const { data: session, isPending } = authClient.useSession();
  return <Link className={"profile-link account-entry " + (session ? "member" : "guest")} href={session ? "/profile" : "/login"} aria-busy={isPending}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/></svg><span>{session ? "Миний профайл" : "Нэвтрэх"}</span>
  </Link>;
}
