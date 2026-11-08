import { Fragment, type ReactNode } from "react";
import { markdownBlocks } from "./markdown-blocks";

// A small Markdown subset for AI replies: paragraphs, headings, bullet and numbered lists, **bold**,
// *italic* and `code`. Every string is rendered as React text, so no model output ever becomes HTML.
const inlinePattern = /(\*\*[^*\n]+\*\*|`[^`\n]+`|\*[^*\s][^*\n]*\*)/g;
function inline(text: string): ReactNode[] {
  return text.split(inlinePattern).filter(Boolean).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) return <code key={index}>{part.slice(1, -1)}</code>;
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) return <em key={index}>{part.slice(1, -1)}</em>;
    return <Fragment key={index}>{part}</Fragment>;
  });
}
function lines(text: string) {
  return text.split("\n").map((line, index) => <Fragment key={index}>{index ? <br /> : null}{inline(line)}</Fragment>);
}

export function Markdown({ text }: { text: string }) {
  return <div className="wsp-md">{markdownBlocks(text).map((block, index) => {
    if (block.kind === "h") return <p key={index} className="wsp-md-h">{inline(block.text)}</p>;
    if (block.kind === "p") return <p key={index}>{lines(block.text)}</p>;
    const items = block.items.map((item, i) => <li key={i}>{lines(item)}</li>);
    return block.kind === "ul" ? <ul key={index}>{items}</ul> : <ol key={index} start={block.start}>{items}</ol>;
  })}</div>;
}
