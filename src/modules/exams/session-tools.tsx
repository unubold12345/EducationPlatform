"use client";
// Study tools shared by the timed sitting and practice mode. All of them are browser-only comfort:
// nothing here touches responses, deadlines or grading.
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import "./session-tools.css";

export type StripItem = { id: string; label: string; state?: "answered" | "correct" | "wrong" | "review"; flagged?: boolean };
const stateNames = { answered: "хариулсан", correct: "зөв", wrong: "буруу", review: "зөвлөмж харсан" };

export function QuestionStrip({items,current,onSelect}:{items:StripItem[];current:string;onSelect:(id:string)=>void}) {
  return <nav className="question-strip" aria-label="Асуултууд">{items.map(item=>{
    const name="Асуулт "+item.label+(item.state?", "+stateNames[item.state]:"")+(item.flagged?", тэмдэгтэй":"");
    return <button key={item.id} type="button" data-state={item.state} data-flagged={item.flagged?"":undefined} aria-current={item.id===current?"true":undefined} aria-label={name} onClick={()=>onSelect(item.id)}>{item.label}</button>;
  })}</nav>;
}

type Shortcuts = { onPrevious?: () => void; onNext?: () => void; onFlag?: () => void; onOption?: (index: number) => void; onSubmit?: () => void };
// Left/right move, A-E or 1-5 choose, F flags, Enter checks. Never fires while typing or in the AI drawer.
export function useQuestionShortcuts(handlers: Shortcuts) {
  const latest = useRef(handlers);
  useEffect(() => { latest.current = handlers; });
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return;
      const target = event.target as HTMLElement | null;
      const radio = target instanceof HTMLInputElement && target.type === "radio";
      if (target && !radio && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (target?.isContentEditable || document.querySelector("[role=dialog]")) return;
      const key = event.key.toLowerCase();
      // A focused radio button already uses the arrow keys to change its own group.
      if (key === "arrowleft" && !radio) latest.current.onPrevious?.();
      else if (key === "arrowright" && !radio) latest.current.onNext?.();
      else if (key === "f") latest.current.onFlag?.();
      else if (key === "enter" && (radio || target === document.body)) latest.current.onSubmit?.();
      else if (/^[a-e]$/.test(key)) latest.current.onOption?.(key.charCodeAt(0) - 97);
      else if (/^[1-5]$/.test(key)) latest.current.onOption?.(Number(key) - 1);
      else return;
      event.preventDefault();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

function readStored<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback; } catch { return fallback; }
}
function writeStored(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Private windows can refuse storage; the tool still works for this page. */ }
}
// Rendered empty on the server, then restored after hydration so the markup always matches.
function useStoredValue<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  useEffect(() => { const stored = readStored(key, fallback); const timer = setTimeout(() => setValue(stored), 0); return () => clearTimeout(timer); }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const update = useCallback((next: T) => { setValue(next); writeStored(key, next); }, [key]);
  return [value, update] as const;
}

export function useEliminations(scope: string) {
  const [struck, setStruck] = useStoredValue<Record<string, string[]>>("education-eliminate-v1:" + scope, {});
  const toggle = useCallback((questionId: string, option: string) => {
    const list = struck[questionId] ?? [];
    setStruck({ ...struck, [questionId]: list.includes(option) ? list.filter(item => item !== option) : [...list, option] });
  }, [struck, setStruck]);
  return { struck, toggle };
}

const scales = [0.9, 1, 1.12, 1.25];
export function usePassageScale() {
  const [scale, setScale] = useStoredValue("education-passage-scale-v1", 1);
  return {
    scale,
    controls: <span className="passage-scale" role="group" aria-label="Текстийн хэмжээ">
      <button type="button" aria-label="Текст жижигрүүлэх" disabled={scale <= scales[0]} onClick={() => setScale(scales[Math.max(0, scales.indexOf(scale) - 1)])}>A−</button>
      <button type="button" aria-label="Текст томруулах" disabled={scale >= scales[scales.length - 1]} onClick={() => setScale(scales[Math.min(scales.length - 1, scales.indexOf(scale) + 1)])}>A+</button>
    </span>,
  };
}

export function PassagePane({title,text,caption,controls,scale}:{title:string;text:string;caption?:string;controls?:ReactNode;scale?:number}) {
  // Writing data: a block whose every line is "a | b | c" is a table; notes before or after it stay paragraphs.
  const blocks = text.split(/\n{2,}/).map(block => caption && block.split("\n").every(row => row.includes(" | ")) ? block.split("\n").map(row => row.split(" | ")) : block);
  const firstTable = blocks.findIndex(block => Array.isArray(block));
  return <section className="exam-passage" lang="en" style={scale && scale !== 1 ? { fontSize: scale + "em" } : undefined} data-scaled={scale && scale !== 1 ? "" : undefined}>
    <div className="passage-head"><h2>{title}</h2>{controls}</div>
    {blocks.map((rows, index) => Array.isArray(rows) ? <div className="table-scroll" key={index}><table>{index === firstTable ? <caption>{caption}</caption> : null}<thead><tr>{rows[0].map(cell => <th scope="col" key={cell}>{cell}</th>)}</tr></thead><tbody>{rows.slice(1).map(row => <tr key={row[0]}>{row.map((cell, i) => i === 0 ? <th scope="row" key={i}>{cell}</th> : <td key={i}>{cell}</td>)}</tr>)}</tbody></table></div> : <p key={index}>{rows}</p>)}
  </section>;
}

export type OptionItem = { value: string; content: ReactNode };
// `compact` is for letter-only answers whose text is printed on a scanned page.
export function AnswerOptions({name,options,selected,disabled,onSelect,struck,onStrike,correctValue,lang="en",compact=false,labels}:{name:string;options:OptionItem[];selected:string|undefined;disabled?:boolean;onSelect:(value:string)=>void;struck?:string[];onStrike?:(value:string)=>void;correctValue?:string;lang?:string;compact?:boolean;labels?:string[]}) {
  return <fieldset className="answer-options" data-compact={compact?"":undefined} disabled={disabled}><legend className="sr-only">Select one answer</legend>{options.map((option, i) => {
    const out = struck?.includes(option.value);
    const outcome = correctValue === undefined ? undefined : option.value === correctValue ? "correct" : option.value === selected ? "wrong" : undefined;
    const label = labels?.[i] ?? String.fromCharCode(65 + i);
    return <div className="answer-row" key={option.value} data-out={out ? "" : undefined} data-outcome={outcome}>
      <label className={"answer-option " + (selected === option.value ? "selected" : "")}><input type="radio" name={name} checked={selected === option.value} onChange={() => onSelect(option.value)}/><span className="option-letter">{label}</span><span lang={lang}>{option.content}</span></label>
      {onStrike ? <button type="button" className="answer-strike" aria-pressed={Boolean(out)} aria-label={label + " хувилбарыг " + (out ? "сэргээх" : "хасах")} title={out ? "Сэргээх" : "Хасах"} onClick={() => onStrike(option.value)}>{out ? "↺" : "✕"}</button> : null}
    </div>;
  })}</fieldset>;
}

export function MathTools() {
  return <section className="exam-tools"><div><h2>Desmos graphing calculator</h2><p className="fine-print">Интернет шаардлагатай. Өөрийн зөвшөөрөгдсөн тооны машиныг мөн ашиглаж болно.</p><iframe title="Desmos graphing calculator" src="https://www.desmos.com/calculator?embed" loading="lazy"/></div><div><h2>Reference</h2><p>Circle: A = πr², C = 2πr<br/>Rectangle: A = ℓw<br/>Triangle: A = ½bh<br/>Right triangle: a² + b² = c²<br/>45°–45°–90°: x, x, x√2<br/>30°–60°–90°: x, x√3, 2x<br/>Rectangular prism: V = ℓwh<br/>Cylinder: V = πr²h<br/>Cone: V = ⅓πr²h<br/>Sphere: V = ⁴⁄₃πr³<br/>Rectangular pyramid: V = ⅓ℓwh<br/>Triangle angles: 180°<br/>Full circle: 360° = 2π radians</p></div></section>;
}

export const shortcutHint = "Товчлуур: ← → шилжих · A–E сонгох · F тэмдэглэх";
