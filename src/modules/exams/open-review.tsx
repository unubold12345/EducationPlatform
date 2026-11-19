"use client";
import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { PublicExamAttempt } from "./types";

/**
 * A sitting just ended: its result is the Review page, so the runner moves there (2026-11-19). `hold` keeps the
 * student here while a speaking recording is still uploading or failed and must be downloaded first (`children`).
 */
export function OpenReview({ attempt, hold = false, children }: { attempt: PublicExamAttempt; hold?: boolean; children?: ReactNode }) {
  const router = useRouter();
  const href = "/workspace/review/" + attempt.id;
  useEffect(() => { if (!hold) router.replace(href); }, [hold, href, router]);
  return <div className="container page-space exam-results exam-finished" aria-live="polite">
    <p className="eyebrow">Шалгалт дууссан</p>
    <h1>{attempt.title}</h1>
    {children}
    <p>{hold ? "Бичлэгээ хадгалсны дараа үр дүнгээ нээнэ үү." : "Үр дүнг нээж байна…"}</p>
    <div className="result-actions"><Link className="button" href={href}>Үр дүн харах →</Link></div>
  </div>;
}
