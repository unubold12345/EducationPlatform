"use client";
import { useEffect, useId, useRef } from "react";
import { Icon, type IconName } from "./icons";
import { CHAT_LIMITS, CHAT_MODES, CHAT_SUBJECTS, modeLabels, subjectLabels, type ChatMode, type ChatSubject } from "./chat-contract";
import { CreditCost } from "@/modules/credits/client";

const modeIcons: Record<ChatMode, IconName> = { ask: "chat", solve: "bolt", explain: "spark", quiz: "check", writing: "pen", vocab: "exam" };

export type ComposerState = { mode: ChatMode; subject: ChatSubject; language: "mn" | "en"; text: string };

/** The Workspace prompt box: tool chips, a growing text area, subject and language pickers and a send button. */
export function Composer({ state, onChange, onSubmit, pending = false, docked = false, autoFocus = false }: {
  state: ComposerState; onChange: (next: ComposerState) => void; onSubmit: () => void; pending?: boolean; docked?: boolean; autoFocus?: boolean;
}) {
  const area = useRef<HTMLTextAreaElement>(null);
  const ids = useId();
  // Grow with the text up to a comfortable height, then scroll inside the box.
  useEffect(() => {
    const element = area.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = Math.min(element.scrollHeight, docked ? 220 : 320) + "px";
  }, [state.text, docked]);
  useEffect(() => { if (autoFocus) area.current?.focus(); }, [autoFocus]);
  const ready = Boolean(state.text.trim()) && !pending;
  const set = (patch: Partial<ComposerState>) => onChange({ ...state, ...patch });
  return <form className={"wsp-composer" + (docked ? " is-docked" : "")} onSubmit={event => { event.preventDefault(); if (ready) onSubmit(); }}>
    <div className="wsp-tools" role="group" aria-label="AI-ийн горим">
      {CHAT_MODES.map(mode => <button key={mode} type="button" className="wsp-tool" aria-pressed={state.mode === mode} onClick={() => { set({ mode }); area.current?.focus(); }}>
        <Icon name={modeIcons[mode]} size={16} />{modeLabels[mode].label}
      </button>)}
    </div>
    <div className="wsp-input">
      <label className="wsp-input-tag" htmlFor={ids + "-text"}>{modeLabels[state.mode].label}</label>
      <textarea id={ids + "-text"} ref={area} rows={docked ? 1 : 3} maxLength={CHAT_LIMITS.message} value={state.text} placeholder={modeLabels[state.mode].placeholder}
        onChange={event => set({ text: event.target.value })}
        onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); if (ready) onSubmit(); } }} />
    </div>
    <div className="wsp-composer-foot">
      <label className="wsp-select"><span className="sr-only">Хичээл</span>
        <select value={state.subject} onChange={event => set({ subject: event.target.value as ChatSubject })} disabled={pending}>
          {CHAT_SUBJECTS.map(subject => <option key={subject} value={subject}>{subjectLabels[subject]}</option>)}
        </select><Icon name="chevron" size={16} />
      </label>
      <label className="wsp-select"><span className="sr-only">Хариултын хэл</span>
        <select value={state.language} onChange={event => set({ language: event.target.value as "mn" | "en" })} disabled={pending}>
          <option value="mn">Монгол</option><option value="en">English</option>
        </select><Icon name="chevron" size={16} />
      </label>
      {state.text.length > CHAT_LIMITS.message - 300 ? <span className="wsp-count">{state.text.length} / {CHAT_LIMITS.message}</span> : null}
      <CreditCost action="chat" />
      <button type="submit" className="wsp-send" disabled={!ready}><span>{pending ? "Бичиж байна…" : "Илгээх"}</span><Icon name="send" size={18} /></button>
    </div>
  </form>;
}
