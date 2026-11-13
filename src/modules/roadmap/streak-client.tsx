"use client";
import Link from "next/link";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Icon } from "@/modules/workspace/icons";
import { streakLine, type StreakSummary } from "./streak";
import { mnDate, mnWeekday } from "./plan";

const StreakContext = createContext<StreakSummary | null>(null);
// One check-in per page session per day, even when the shell remounts between layouts (or React runs
// the effect twice): every mount listens to the same request.
let checkIn: { day: string; request: Promise<StreakSummary | null> } | null = null;
function checkInOnce(day: string) {
  if (checkIn?.day !== day) {
    const request = fetch("/api/workspace/streak", { method: "POST", headers: { "content-type": "application/json" } })
      .then(response => response.ok ? response.json() as Promise<{ streak?: StreakSummary }> : null)
      .then(data => data?.streak ?? null)
      .catch(() => null);
    checkIn = { day, request };
    // A failed check-in may be tried again on the next mount.
    void request.then(result => { if (!result && checkIn?.request === request) checkIn = null; });
  }
  return checkIn!.request;
}

/** Holds the streak for the Workspace and checks the student in once a day. */
export function StreakProvider({ initial, signedIn, children }: { initial: StreakSummary | null; signedIn: boolean; children: ReactNode }) {
  const [summary, setSummary] = useState(initial);
  // A server render after the check-in carries the newer figures.
  const [last, setLast] = useState(initial);
  if (initial !== last) { setLast(initial); if (initial && (!summary || initial.total >= summary.total)) setSummary(initial); }
  const today = initial?.week.at(-1)?.day ?? null;

  useEffect(() => {
    if (!signedIn || !initial || initial.today || !today) return;
    let live = true;
    void checkInOnce(today).then(result => { if (live && result) setSummary(result); });
    return () => { live = false; };
  }, [signedIn, initial, today]);

  return <StreakContext.Provider value={summary}>{children}</StreakContext.Provider>;
}

export const useStreak = () => useContext(StreakContext);


/** The rail's streak row: flame, current days, link to the roadmap. */
export function StreakChip() {
  const streak = useStreak();
  if (!streak) return null;
  return <Link className="wsp-streak" href="/workspace" data-lit={streak.today ? "" : undefined} title={`Дараалсан өдөр: ${streak.current} · хамгийн урт ${streak.longest}`}>
    <Icon name="flame" size={18} />
    <span className="wsp-streak-text"><span>Streak</span><strong>{streak.current}<small> өдөр</small></strong></span>
  </Link>;
}

/** Home and roadmap card: the streak with the last seven days. */
export function StreakCard({ compact = false }: { compact?: boolean }) {
  const streak = useStreak();
  if (!streak) return null;
  return <div className={"wsp-streak-card" + (compact ? " is-compact" : "")} data-lit={streak.today ? "" : undefined}>
    <div className="wsp-streak-head">
      <span className="wsp-streak-flame" aria-hidden="true"><Icon name="flame" size={22} /></span>
      <div><strong>{streak.current}</strong><span>{streakLine(streak)}</span></div>
    </div>
    <ol className="wsp-streak-week" aria-label="Сүүлийн 7 өдөр">
      {streak.week.map(item => <li key={item.day} data-active={item.active ? "" : undefined} title={mnDate(item.day) + (item.active ? " · орсон" : " · ороогүй")}>
        <i aria-hidden="true">{item.active ? <Icon name="check" size={13} /> : null}</i><span>{mnWeekday(item.day)}</span>
      </li>)}
    </ol>
    {compact ? null : <p className="wsp-streak-foot">Хамгийн урт: <b>{streak.longest}</b> өдөр · Нийт: <b>{streak.total}</b> өдөр</p>}
  </div>;
}
