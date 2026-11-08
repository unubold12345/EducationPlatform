"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Exams, plans and the profile live in the Workspace (owner decision 2026-11-08), so the site header links there only.
export function MainNavigation() {
  const pathname = usePathname();
  return <nav aria-label="Үндсэн цэс">
    <Link href="/#programs" aria-current={pathname === "/" || pathname.startsWith("/programs") ? "page" : undefined}>Хөтөлбөрүүд</Link>
    <Link href="/workspace" className="progress-nav workspace-nav" aria-current={pathname.startsWith("/workspace") ? "page" : undefined}>Workspace</Link>
  </nav>;
}
