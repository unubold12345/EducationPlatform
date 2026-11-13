"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Composer, emptyComposer, type ComposerState } from "./composer";
import { Icon, type IconName } from "./icons";
import { setPendingPrompt } from "./chat-store";

type Segment = "ai" | "exams" | "workshop";
export type HomeProgram = { href: string; label: string; detail: string; tone: string };
export type HomeLab = { href: string; label: string; detail: string; icon: IconName };

/** The home hero box, like a study app's mode switch: ask the AI, pick an exam or open a lab. */
export function HomeSwitcher({ programs, labs }: { programs: HomeProgram[]; labs: HomeLab[] }) {
  const router = useRouter();
  const [segment, setSegment] = useState<Segment>("ai");
  const [state, setState] = useState<ComposerState>(emptyComposer);
  const [error, setError] = useState("");
  const segments: [Segment, string, IconName][] = [["ai", "AI туслах", "spark"], ["exams", "Шалгалт", "exam"], ["workshop", "Workshop", "workshop"]];
  function submit() {
    const { text, images, ...options } = state;
    if (!text.trim() && !images.length) return;
    // The chat page sends it; pictures travel with it through this tab's session storage.
    if (!setPendingPrompt({ text: text.trim(), images, ...options })) {
      setError(images.length ? "Зургийг AI чат руу дамжуулж чадсангүй. AI чат хуудсанд шууд хавсаргана уу." : "Мессежийг дамжуулж чадсангүй. Дахин оролдоно уу.");
      return;
    }
    router.push("/workspace/chat");
  }
  return <>
    <div className="wsp-segments" role="tablist" aria-label="Юу хийх вэ?" onKeyDown={event => {
      // Arrow keys move between the three tabs, as in any tab list.
      const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
      if (!step) return;
      event.preventDefault();
      const next = segments[(segments.findIndex(([id]) => id === segment) + step + segments.length) % segments.length][0];
      setSegment(next);
      document.getElementById("home-tab-" + next)?.focus();
    }}>
      {segments.map(([id, label, icon]) => <button key={id} type="button" role="tab" id={"home-tab-" + id} aria-selected={segment === id} aria-controls={"home-panel-" + id} tabIndex={segment === id ? 0 : -1} className="wsp-segment" onClick={() => setSegment(id)}><Icon name={icon} size={17} />{label}</button>)}
    </div>
    <div role="tabpanel" id={"home-panel-" + segment} aria-labelledby={"home-tab-" + segment} className="wsp-hero-panel">
      {segment === "ai" ? <>
        <Composer state={state} onChange={setState} onSubmit={submit} />
        {error ? <p className="wsp-error" role="alert">{error}</p> : null}
        <p className="wsp-fine">Илгээхэд таны мессеж, зураг AI руу очно. Чат таны бүртгэлд хадгалагдана.</p>
      </> : segment === "exams" ? <div className="wsp-pick-grid">
        {programs.map(program => <Link key={program.href} href={program.href} className={"wsp-pick " + program.tone}><strong>{program.label}</strong><span>{program.detail}</span><Icon name="arrow" size={18} /></Link>)}
      </div> : <div className={"wsp-pick-grid is-three" + (labs.length === 4 ? " is-four" : "")}>
        {labs.length ? labs.map(lab => <Link key={lab.href} href={lab.href} prefetch={false} className="wsp-pick"><Icon name={lab.icon} size={22} /><strong>{lab.label}</strong><span>{lab.detail}</span></Link>)
          : <p className="wsp-muted">Workshop одоогоор идэвхгүй байна.</p>}
      </div>}
    </div>
  </>;
}
