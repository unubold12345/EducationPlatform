"use client";
import { useState, type ReactNode } from "react";
import { QuestionStrip, type StripItem } from "./session-tools";
import "./sheet.css";

/** What the runner draws on every timed stage: mock title, stage position, clock, save state and the stop/skip buttons. */
export type SheetChrome = { title: string; stageIndex: number; timeline: { title: string }[]; instructions: string; clock: ReactNode; status: string; end: ReactNode };
export type SheetGroup = { id: string; title: string; items: StripItem[] };

type Props = {
  chrome: SheetChrome;
  /** The stage's own heading above the page. */
  heading: string;
  /** Answer-sheet rows, one per part or task; empty for a stage with nothing to jump to (writing, speaking, a break). */
  groups: SheetGroup[];
  current?: string;
  /** Jump to a question. Without it the sheet only shows progress (Listening follows the recording). */
  onJump?: (id: string) => void;
  /** Small switches beside the clock (Pinyin). */
  toggles?: ReactNode;
  /** Extra buttons in the sheet (calculator and formulas). */
  tools?: ReactNode;
  note?: string;
  label?: ReactNode;
  className?: string;
  children: ReactNode;
};

/**
 * The timed sitting layout shared by SAT, IELTS, TOEFL, HSK and TOPIK (2026-11-19, the owner's pick, after JLPT's):
 * the stage's page on the left, and a sticky column on the right with the clock, save state, the stages, an answer
 * sheet per part that shows progress and jumps, directions and the stop button. Below 1100 px the column becomes a
 * top bar whose sheet opens on demand.
 */
export function SheetSitting({ chrome, heading, groups, current = "", onJump, toggles, tools, note, label, className = "", children }: Props) {
  const [open, setOpen] = useState(false);
  const items = groups.flatMap(group => group.items);
  const answered = items.filter(item => item.state).length;
  const body = "exam-sheet-body";
  return <div className={"sheet-sit " + className}>
    <section className="sheet-main" aria-label={heading}>
      <header className="sheet-head"><p className="eyebrow">{chrome.title} · {chrome.stageIndex + 1}/{chrome.timeline.length} хэсэг</p><h1>{heading}</h1></header>
      {children}
    </section>
    <aside className="exam-sheet" aria-label="Хариултын хуудас">
      <div className="exam-sheet-top">
        {chrome.clock}
        <p className="exam-sheet-save" role="status">{chrome.status}</p>
        {toggles}
        <button type="button" className="exam-sheet-toggle" aria-expanded={open} aria-controls={body} onClick={() => setOpen(!open)}>
          <span className="exam-sheet-word">{items.length ? "Хариу " : "Хэсэг "}</span>{items.length ? `${answered}/${items.length}` : `${chrome.stageIndex + 1}/${chrome.timeline.length}`} {open ? "▴" : "▾"}
        </button>
      </div>
      <div className="exam-sheet-body" id={body} data-open={open ? "" : undefined}>
        <ol className="exam-sheet-stages" aria-label="Хэсгүүд">{chrome.timeline.map((stage, i) => <li key={stage.title + i} data-state={i < chrome.stageIndex ? "done" : i === chrome.stageIndex ? "current" : undefined} aria-current={i === chrome.stageIndex ? "step" : undefined}>
          <span>{i < chrome.stageIndex ? "✓" : i + 1}</span>{stage.title}
        </li>)}</ol>
        {items.length ? <>
          <p className="exam-sheet-label">{label ?? "Хариултын хуудас"}</p>
          {groups.map(group => <section className="exam-sheet-group" key={group.id}>
            {groups.length > 1 || group.title !== heading ? <h3 title={group.title}>{group.title}</h3> : null}
            {onJump ? <QuestionStrip items={group.items} current={current} onSelect={id => { setOpen(false); onJump(id); }} />
              : <div className="question-strip is-static" role="list" aria-label={group.title}>{group.items.map(item => <span role="listitem" key={item.id} data-state={item.state} data-flagged={item.flagged ? "" : undefined} aria-current={item.id === current ? "true" : undefined}>{item.label}</span>)}</div>}
          </section>)}
          <p className="exam-sheet-count">{answered} / {items.length} хариулсан <span className="exam-sheet-key"><i data-state="answered" />хариулсан <i data-flagged="" />тэмдэгтэй</span></p>
        </> : null}
        {note ? <p className="exam-sheet-note">{note}</p> : null}
        {tools ? <div className="exam-sheet-tools">{tools}</div> : null}
        <details className="exam-sheet-directions"><summary>Заавар · Directions</summary><p>{chrome.instructions}</p></details>
        <div className="exam-sheet-end">{chrome.end}<p>Цаг зогсохгүй · Дууссан хэсэг түгжигдэнэ</p></div>
      </div>
    </aside>
  </div>;
}
