"use client";
import type { ExamFigure } from "./types";
import { MathFigure } from "./math-figure";

/** Stored SVG diagrams are shown as images: their internal <style> never leaks into the page. */
export function ExamFigureView({ figure, className }: { figure: ExamFigure; className?: string }) {
  if (figure.kind === "image") return <figure className={"exam-figure image-figure " + (className ?? "")}>
    {/* A local, self-contained SVG; next/image would only re-encode it. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={figure.src} alt={figure.alt} width={figure.width} height={figure.height} loading="lazy" decoding="async" />
    {figure.expandable?<figcaption><a href={figure.src} style={{color:"#1d4ed8"}} target="_blank" rel="noopener noreferrer">View full-size diagram ↗</a></figcaption>:null}
  </figure>;
  return <MathFigure figure={figure} />;
}
