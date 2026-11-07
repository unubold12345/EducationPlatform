"use client";
import { memo, useMemo } from "react";
import { mathHtml, mathSegments, optionTex } from "./math-typesetting";
import "katex/dist/katex.min.css";
import "./math-paper.css";

export const MathFormula = memo(function MathFormula({ text, literal = false }: { text: string; literal?: boolean }) {
  const html = useMemo(() => {
    try { return mathHtml(literal ? text : optionTex(text)); } catch { return null; }
  }, [text, literal]);
  // Only KaTeX's untrusted-mode output enters this sink; fallback/plain prose uses React escaping.
  return html ? <span className="math-inline" dangerouslySetInnerHTML={{ __html: html }} /> : <span>{text}</span>;
});

const cyrillic = /[А-Яа-яӨөҮүЁё]/;
const formulaSignal = /[=√²³⁴⁵π^∞≤≥≠±×÷·−]/;
/** A short line that is entirely a formula (no Mongolian prose) reads best through KaTeX. */
function formulaOnly(text: string) {
  return text.length <= 240 && !cyrillic.test(text) && formulaSignal.test(text) && !text.includes("$");
}
/** Many prompts start with a formula and add a Mongolian ending: ⁵√(√(49⁵))-ын утгыг ол. */
function leadingMath(text: string) {
  if (text.includes("$")) return null;
  const firstCyrillic = text.search(cyrillic);
  if (firstCyrillic <= 1) return null;
  const prefix = text.slice(0, firstCyrillic);
  const math = prefix.replace(/[-\s]+$/, "");
  if (math.length < 2 || math.length > 90 || !formulaSignal.test(math) || math.startsWith("{")) return null;
  return { math, rest: prefix.slice(math.length) + text.slice(firstCyrillic) };
}

export const MathText = memo(function MathText({ text }: { text: string }) {
  const segments = useMemo(() => mathSegments(text), [text]);
  const lead = useMemo(() => leadingMath(text), [text]);
  if (formulaOnly(text)) return <MathFormula text={text} />;
  if (lead) return <span className="math-text"><MathFormula text={lead.math} /><span>{lead.rest}</span></span>;
  return <span className="math-text">{segments.map((part, index) => part.math ? <MathFormula key={index} text={part.text} literal={!/^[-−]?\d+\/\d+$/.test(part.text)} /> : <span key={index}>{part.text}</span>)}</span>;
});
