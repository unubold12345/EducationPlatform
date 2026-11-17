"use client";
import { Fragment, useEffect, useState } from "react";

// The homepage headline types itself once, slowly, and leaves a blinking caret after the last letter.
// Untyped letters stay in the layout (hidden), so nothing moves while it types; the heading's name is
// always the full sentence for screen readers and tests.
const LINES = ["Том зорилго.", "Өдөр бүрийн", "жижиг алхам."];
const STARTS = LINES.map((_, index) => LINES.slice(0, index).reduce((n, line) => n + line.length, 0));
const TOTAL =LINES.reduce((n, line) => n + line.length, 0);

export function HeroTyping() {
  const [typed, setTyped] = useState(0);
  useEffect(() => {
    if (typed >= TOTAL) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lineEnd = STARTS.includes(typed);
    const wait = still ? 0 : typed === 0 ? 600 : lineEnd ? 560 : 105 + (typed * 37) % 60;
    const timer = setTimeout(() => setTyped(still ? TOTAL : typed + 1), wait);
    return () => clearTimeout(timer);
  }, [typed]);

  return <h1 aria-label={LINES.join(" ")}>{LINES.map((line, index) => {
    const from = STARTS[index], shown = Math.max(0, Math.min(line.length, typed - from));
    // The caret sits on the line being typed; once a line is full it moves to the next one.
    const caret = typed >= TOTAL ? index === LINES.length - 1 : typed >= from && typed < from + line.length;
    const Line = index === 1 ? "span" : "em";
    return <Fragment key={line}>
      {index > 0 && <br />}
      <Line className="hero-type-line" aria-hidden="true">{line.slice(0, shown)}{caret && <i className="hero-type-caret" />}<span className="hero-type-rest">{line.slice(shown)}</span></Line>
    </Fragment>;
  })}</h1>;
}
