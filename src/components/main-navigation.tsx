"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function MainNavigation() {
  const pathname = usePathname();
  return <nav aria-label="Үндсэн цэс">
    <Link href="/programs" aria-current={pathname.startsWith("/programs") || pathname.startsWith("/exercises") || pathname.startsWith("/workshops") ? "page" : undefined}>Хөтөлбөрүүд</Link>
    <Link href="/exams" aria-current={pathname.startsWith("/exams") ? "page" : undefined}>Шалгалтууд</Link>
    <Link href="/plans" aria-current={pathname.startsWith("/plans") || pathname.startsWith("/subscribe") ? "page" : undefined}>Багцууд</Link>
    <Link href="/dashboard" className="progress-nav" aria-current={pathname.startsWith("/dashboard") || pathname.startsWith("/learn") ? "page" : undefined}>Миний бэлтгэл</Link>
  </nav>;
}
