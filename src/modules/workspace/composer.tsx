"use client";
import { useEffect, useId, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { Icon, type IconName } from "./icons";
import { CHAT_LIMITS, CHAT_MODES, CHAT_SUBJECTS, modeLabels, subjectLabels, type ChatMode, type ChatSubject } from "./chat-contract";
import { CreditCost } from "@/modules/credits/client";
import { AttachButton, ImageStrip, imageFiles, prepareImages, type AttachedImage } from "@/modules/ai-images/client";
import { AI_IMAGE_LIMITS } from "@/modules/ai-images/contracts";

const modeIcons: Record<ChatMode, IconName> = { ask: "chat", solve: "bolt", explain: "spark", quiz: "check", writing: "pen", vocab: "exam" };

export type ComposerState = { mode: ChatMode; subject: ChatSubject; language: "mn" | "en"; text: string; images: AttachedImage[] };
export const emptyComposer: ComposerState = { mode: "ask", subject: "general", language: "mn", text: "", images: [] };
const MAX_IMAGES = AI_IMAGE_LIMITS.perMessage;

/** The Workspace prompt box: tool chips, a growing text area, image attachments, subject and language pickers and a send button. */
export function Composer({ state, onChange, onSubmit, pending = false, docked = false, autoFocus = false }: {
  state: ComposerState; onChange: Dispatch<SetStateAction<ComposerState>>; onSubmit: () => void; pending?: boolean; docked?: boolean; autoFocus?: boolean;
}) {
  const area = useRef<HTMLTextAreaElement>(null);
  const ids = useId();
  const [preparing, setPreparing] = useState(false);
  const [imageError, setImageError] = useState("");
  const [dragging, setDragging] = useState(false);
  const count = useRef(state.images.length);
  useEffect(() => { count.current = state.images.length; }, [state.images.length]);
  // Grow with the text up to a comfortable height, then scroll inside the box.
  useEffect(() => {
    const element = area.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = Math.min(element.scrollHeight, docked ? 220 : 320) + "px";
  }, [state.text, docked]);
  useEffect(() => { if (autoFocus) area.current?.focus(); }, [autoFocus]);
  const ready = Boolean(state.text.trim() || state.images.length) && !pending && !preparing;
  const set = (patch: Partial<ComposerState>) => onChange(current => ({ ...current, ...patch }));
  // Picked, pasted or dropped pictures are resized in the browser before they join the message.
  async function attach(files: File[]) {
    if (!files.length || pending) return;
    setPreparing(true); setImageError("");
    try {
      const result = await prepareImages(files, MAX_IMAGES - count.current, MAX_IMAGES);
      count.current = Math.min(MAX_IMAGES, count.current + result.images.length);
      onChange(current => ({ ...current, images: [...current.images, ...result.images].slice(0, MAX_IMAGES) }));
      setImageError(result.error);
    } finally { setPreparing(false); }
  }
  const removeImage = (id: string) => { setImageError(""); onChange(current => ({ ...current, images: current.images.filter(image => image.id !== id) })); };
  return <form className={"wsp-composer" + (docked ? " is-docked" : "") + (dragging ? " is-dropping" : "")} onSubmit={event => { event.preventDefault(); if (ready) onSubmit(); }}
    onDragOver={event => { if (Array.from(event.dataTransfer.types).includes("Files")) { event.preventDefault(); setDragging(true); } }}
    onDragLeave={event => { if (event.currentTarget === event.target) setDragging(false); }}
    onDrop={event => { const files = imageFiles(event.dataTransfer); setDragging(false); if (files.length) { event.preventDefault(); void attach(files); } }}>
    <div className="wsp-tools" role="group" aria-label="AI-ийн горим">
      {CHAT_MODES.map(mode => <button key={mode} type="button" className="wsp-tool" aria-pressed={state.mode === mode} onClick={() => { set({ mode }); area.current?.focus(); }}>
        <Icon name={modeIcons[mode]} size={16} />{modeLabels[mode].label}
      </button>)}
    </div>
    <div className="wsp-input">
      <label className="wsp-input-tag" htmlFor={ids + "-text"}>{modeLabels[state.mode].label}</label>
      <textarea id={ids + "-text"} ref={area} rows={docked ? 1 : 3} maxLength={CHAT_LIMITS.message} value={state.text} placeholder={modeLabels[state.mode].placeholder}
        onChange={event => set({ text: event.target.value })}
        onPaste={event => { const files = imageFiles(event.clipboardData); if (files.length) { event.preventDefault(); void attach(files); } }}
        onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); if (ready) onSubmit(); } }} />
    </div>
    <ImageStrip images={state.images} onRemove={removeImage} busy={preparing} disabled={pending} error={imageError} className="wsp-composer-images" />
    <div className="wsp-composer-foot">
      <AttachButton onFiles={files => void attach(files)} count={state.images.length} max={MAX_IMAGES} disabled={pending || preparing} className="wsp-attach" />
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
      <CreditCost action="chat" images={state.images.length} />
      <button type="submit" className="wsp-send" disabled={!ready}><span>{pending ? "Бичиж байна…" : "Илгээх"}</span><Icon name="send" size={18} /></button>
    </div>
  </form>;
}
