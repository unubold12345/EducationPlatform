"use client";
import { memo, useId, type ReactNode } from "react";
import type { ExamFigure } from "./types";
import "./math-paper.css";

const label = (x: number, y: number, text: string, anchor: "start" | "middle" | "end" = "middle") => <text x={x} y={y} textAnchor={anchor} stroke="none" fill="currentColor">{text}</text>;
const line = (x1: number, y1: number, x2: number, y2: number, dashed = false) => <line x1={x1} y1={y1} x2={x2} y2={y2} strokeDasharray={dashed ? "4 4" : undefined} />;
const axes = (ox = 45, oy = 185) => <>{line(ox, oy, 300, oy)}{line(ox, oy, ox, 15)}<path d={`M295 ${oy - 3}l5 3-5 3M${ox - 3} 20l3-5 3 5`} />{label(306, oy + 5, "x")}{label(ox - 10, 16, "y")}{label(ox - 10, oy + 15, "O")}</>;

type SiteFigure = Exclude<ExamFigure, { kind: "image" }>;
function drawing({ kind, scale: k }: SiteFigure): { title: string; description: string; body: ReactNode } {
  switch (kind) {
    case "isosceles": return {
      title: "Адил хажуут гурвалжин ба багтсан тойрог",
      description: `Хоёр хажуу ${5 * k}, суурь ${6 * k}. Багтсан тойргийн радиус r үл мэдэгдэнэ.`,
      body: <><path d="M55 190L160 50 265 190Z" /><circle cx="160" cy="137.5" r="52.5" className="figure-secondary" />{line(160, 137.5, 160, 190, true)}<path d="M160 181h9v9" />{label(46, 202, "A")}{label(276, 202, "B")}{label(160, 36, "C")}{label(91, 113, String(5 * k))}{label(230, 113, String(5 * k))}{label(160, 210, String(6 * k))}{label(173, 170, "r")}</>,
    };
    case "tangents": return {
      title: "Тойргийн хөвч ба хоёр шүргэгч",
      description: `O төвтэй тойргийн радиус ${5 * k}, OM = ${3 * k}. M нь AB хөвчийн дундаж цэг; PA, PB нь шүргэгч.`,
      body: <><circle cx="110" cy="110" r="75" /><path d="M155 50L235 110 155 170Z" />{line(110, 110, 235, 110, true)}{line(110, 110, 155, 50)}<path d="M155 102h8v8" /><path d="M151 56l6 4 4-6" className="figure-secondary" />{label(99, 124, "O")}{label(156, 40, "A")}{label(156, 188, "B")}{label(249, 115, "P")}{label(165, 127, "M")}{label(118, 70, String(5 * k))}{label(132, 106, String(3 * k))}</>,
    };
    case "cevians": return {
      title: "Координатын гурвалжин дахь огтлолцсон хэрчмүүд",
      description: `A(0;0), B(${6 * k};0), C(0;${6 * k}). BD:DC = 1:2, AE = EC. AD ба BE нь P дээр огтлолцоно.`,
      body: <><path d="M75 185H235L75 25Z" /><path d="M75 185L181.67 131.67M235 185L75 105" />{label(52, 202, "A(0;0)")}{label(239, 205, `B(${6 * k};0)`)}{label(75, 16, `C(0;${6 * k})`)}{label(198, 130, "D")}{label(59, 109, "E")}{label(157, 136, "P")}{label(220, 150, "1")}{label(151, 80, "2")}<path d="M69 65h12M69 145h12" /></>,
    };
    case "parabola-rectangle": {
      const points = Array.from({ length: 61 }, (_, i) => { const t = -1 + i / 30; return `${160 + 110 * t},${185 - 140 * (1 - t * t)}`; }).join(" ");
      return { title: "Параболд багтсан тэгш өнцөгт", description: `y = ${k * k} − x² параболын доорх тэгш өнцөгт. Доод оройнууд (−x;0), (x;0), дээд ординат y үл мэдэгдэнэ.`, body: <>{axes(160)}<polyline points={points} /><path d="M99.5 185V87.35H220.5V185" /><path d="M99.5 185v5M220.5 185v5" />{label(99.5, 205, "−x")}{label(220.5, 205, "x")}{label(234, 81, "(x;y)", "start")}{label(100, 34, `y = ${k * k} − x²`)}{label(48, 202, `−${k}`)}{label(275, 202, String(k))}</> };
    }
    case "open-box": return {
      title: "Квадрат суурьтай таггүй сав", description: `Суурийн хоёр ирмэг x, өндөр h, эзлэхүүн ${8 * k ** 3}. Таг байхгүй.`,
      body: <><path d="M70 70H200L255 30H125ZM70 70V180H200V70M200 180L255 140V30" /><path d="M125 30V140L70 180M125 140H255" strokeDasharray="4 4" className="figure-secondary" />{label(135, 200, "x")}{label(238, 170, "x")}{label(272, 94, "h")}{label(160, 218, `V = ${8 * k ** 3}`)}</>,
    };
    case "circle-line": return {
      title: "Тойрог ба параметртэй шулууны огтлолцол", description: `x² + y² = ${k * k} тойрог, y = x + m шулуун. Зураг нь боломжит нэг байрлалыг харуулна; m-ийн утга өгөөгүй.`,
      body: <>{line(30, 110, 290, 110)}{line(160, 205, 160, 15)}<circle cx="160" cy="110" r="75" />{line(75, 205, 265, 15)}{label(151, 125, "O")}{label(295, 115, "x")}{label(150, 16, "y")}{label(235, 42, "y = x + m")}{label(88, 208, `x² + y² = ${k * k}`)}</>,
    };
    case "piecewise": {
      const px = (x: number) => 45 + 235 * x / (k + 2), py = (y: number) => 185 - 145 * y / (k * k + 2);
      const curve = Array.from({ length: 31 }, (_, i) => { const x = k * i / 30; return `${px(x)},${py(x * x)}`; }).join(" ");
      return { title: "Хэсэгчлэн өгсөн функцийн график", description: `0-ээс ${k} хүртэл y = x²; дараа нь (${k + 2};${k * k + 2}) хүртэл шулуун үргэлжилнэ.`, body: <>{axes()}<polyline points={curve} />{line(px(k), py(k * k), px(k + 2), py(k * k + 2))}<circle cx={px(k)} cy={py(k * k)} r="2.5" fill="currentColor" /><circle cx={px(k + 2)} cy={py(k * k + 2)} r="2.5" fill="currentColor" />{line(px(k), 185, px(k), py(k * k), true)}{label(px(k), 205, String(k))}{label(px(k + 2), 205, String(k + 2))}{label(px(k + 2) - 4, py(k * k + 2) - 10, `(${k + 2};${k * k + 2})`, "end")}</> };
    }
    case "absolute-area": return {
      title: "Модультай функцийн доорх талбай", description: `y = |x − ${k}| график; 0-ээс ${2 * k} хүртэлх талбайг зураасаар ялгав.`,
      body: <>{axes()}<path d="M45 185V55L160 185 275 55V185Z" className="figure-shade" /><path d="M45 55L160 185 275 55" />{label(160, 205, String(k))}{label(275, 205, String(2 * k))}{label(32, 59, String(k))}{label(223, 37, `y = |x − ${k}|`)}</>,
    };
    case "box-net": return {
      title: "Картоноос хайчилж нугалах хайрцгийн дэлгээс", description: `${6 * k} см талтай квадратын дөрвөн булангаас x талтай квадрат хайчилна. Тасархай шугам нь нугалах ирмэг.`,
      body: <><path d="M70 15H250V195H70Z" className="figure-secondary" strokeDasharray="4 4" /><path d="M100 15H220V45H250V165H220V195H100V165H70V45H100Z" /><path d="M100 45H220V165H100ZM100 15V45M220 15V45M100 165V195M220 165V195M70 45H100M220 45H250M70 165H100M220 165H250" strokeDasharray="4 4" />{label(84, 36, "x")}{label(238, 36, "x")}{label(160, 108, "Суурь")}{label(160, 215, `${6 * k} см`)}</>,
    };
    case "cubic-area": {
      const curve = Array.from({ length: 61 }, (_, i) => { const t = i / 60; return `${45 + 235 * t},${185 - 145 * (t * t * (1 - t)) / (4 / 27)}`; }).join(" ");
      return { title: "Куб функцээр хашигдсан талбай", description: `y = x²(${3 * k} − x), 0 ≤ x ≤ ${3 * k}; график ба Ox тэнхлэгийн хоорондох мужийг ялгасан.`, body: <>{axes()}<polygon points={`45,185 ${curve} 280,185`} className="figure-shade" /><polyline points={curve} />{label(280, 205, String(3 * k))}{label(160, 23, `y = x²(${3 * k} − x)`)}</> };
    }
    case "triangle-circles": return {
      title: "Гурвалжны багтсан ба багтаасан тойргууд", description: `AB = ${13 * k}, BC = ${14 * k}, CA = ${15 * k}. Том тойргийн төв O, багтсан тойргийн төв I; радиусууд өгөөгүй.`,
      body: <><circle cx="142" cy="119.625" r="89.375" className="figure-secondary" /><circle cx="131" cy="121" r="44" className="figure-secondary" /><path d="M65 165L120 33 219 165Z" />{line(131, 121, 131, 165, true)}{line(142, 119.625, 120, 33, true)}{label(120, 20, "A")}{label(53, 179, "B")}{label(231, 179, "C")}{label(77, 97, String(13 * k))}{label(190, 97, String(15 * k))}{label(143, 183, String(14 * k))}{label(153, 117, "O")}{label(119, 130, "I")}{label(139, 150, "r")}{label(142, 72, "R")}</>,
    };
  }
}

export const MathFigure = memo(function MathFigure({ figure }: { figure: ExamFigure }) {
  const id = useId();
  if (figure.kind === "image") return null;
  const data = drawing(figure);
  return <figure className="math-figure" data-figure={figure.kind}>
    <svg viewBox="0 0 320 230" role="img" aria-labelledby={id + "-title " + id + "-desc"}>
      <title id={id + "-title"}>{data.title}</title><desc id={id + "-desc"}>{data.description}</desc>
      <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">{data.body}</g>
    </svg>
    <figcaption>Зураг бодит хэмжээгээр өгөгдөөгүй.</figcaption>
  </figure>;
});
