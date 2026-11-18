import { Fragment, type ReactNode } from "react";

// The paper's marks inside a Korean text: 【underlined】, a lettered gap ( ㉠ ) and an empty blank (    ).
const MARKS = /【([^】]*)】|\(\s*([㉠㉡㉢㉣])\s*\)|\(\s{2,}\)/g;

function marked(line: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  let at = 0, index = 0;
  for (const match of line.matchAll(MARKS)) {
    if (match.index > at) out.push(line.slice(at, match.index));
    const id = `${key}-${index++}`;
    if (match[1] !== undefined) out.push(<u key={id} className="topik-underline">{match[1]}</u>);
    else if (match[2]) out.push(<span key={id} className="topik-gap" aria-label={`хоосон зай ${match[2]}`}>( {match[2]} )</span>);
    else out.push(<span key={id} className="topik-blank" aria-label="хоосон зай">(<span aria-hidden="true">{"  "}</span>)</span>);
    at = match.index + match[0].length;
  }
  if (at < line.length) out.push(line.slice(at));
  return out;
}

/** Korean as printed: one paragraph per line, with the paper's underlines, lettered gaps and blanks. */
export function KoreanText({ text, inline = false }: { text: string; inline?: boolean }) {
  const lines = text.split("\n");
  if (inline) return <span lang="ko">{lines.map((line, i) => <Fragment key={i}>{i ? <br/> : null}{marked(line, String(i))}</Fragment>)}</span>;
  return <div className="topik-text" lang="ko">{lines.map((line, i) => line.trim() ? <p key={i}>{marked(line, String(i))}</p> : null)}</div>;
}

/** Characters as TOPIK counts them on manuscript paper: spaces count, line breaks do not. */
export const topikChars = (text: string) => [...text.replace(/\r?\n/g, "")].length;
