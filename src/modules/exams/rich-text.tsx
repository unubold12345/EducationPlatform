"use client";
import { Fragment, type ReactNode } from "react";

// English paper markup: **bold**, *italic* and <u>underline</u> from the offline JSON.
// Everything is rendered as React text, so no author string becomes HTML.
const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|<u>[^<]+<\/u>)/g;
function inline(text: string): ReactNode[] {
  return text.split(pattern).filter(Boolean).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("<u>") && part.endsWith("</u>")) return <u key={index}>{part.slice(3, -4)}</u>;
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) return <em key={index}>{part.slice(1, -1)}</em>;
    return <Fragment key={index}>{part}</Fragment>;
  });
}
export function RichText({ text, className }: { text: string; className?: string }) {
  return <span className={"rich-text " + (className ?? "")}>{text.split("\n").map((line, index) => <Fragment key={index}>{index ? <br /> : null}{inline(line)}</Fragment>)}</span>;
}
