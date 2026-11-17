"use client";
import Link from "next/link";
import { WORKSHOP_EXAM_COOKIE, WORKSHOP_EXAMS, type WorkshopExam } from "./catalog";

// Workshop's exam switch. Each exam shows only its own labs, so an IELTS student never sees Japanese or Chinese
// (owner rule 2026-11-18). The last tab is remembered in a cookie the Workshop page reads.
function remember(exam: WorkshopExam) {
  try { document.cookie = `${WORKSHOP_EXAM_COOKIE}=${exam}; path=/workspace; max-age=31536000; samesite=lax`; } catch { /* Tabs work without it. */ }
}

export function ExamTabs({ current }: { current: WorkshopExam }) {
  return <nav className="workshop-tabs" aria-label="Шалгалт">
    {WORKSHOP_EXAMS.map(exam => <Link key={exam.id} href={"/workspace/workshop?exam=" + exam.id} aria-current={exam.id === current ? "page" : undefined}
      onClick={() => remember(exam.id)} prefetch={false}>{exam.label}</Link>)}
  </nav>;
}
