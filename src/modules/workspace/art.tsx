import type { ExamProgram } from "@/modules/exams/types";

// Small preview drawings for the programme cards, drawn for this site. Colours come from workspace.css.
export function ProgramArt({ program }: { program: ExamProgram }) {
  if (program === "sat") return <svg className="wsp-art" viewBox="0 0 240 132" aria-hidden="true">
    <rect x="22" y="14" width="196" height="104" rx="12" className="paper" />
    <rect x="38" y="30" width="112" height="7" rx="3.5" className="ink" /><rect x="38" y="44" width="150" height="5" rx="2.5" className="line" />
    {["A", "B", "C", "D"].map((letter, i) => <g key={letter} transform={`translate(38 ${60 + i * 13})`}>
      <circle cx="5" cy="4" r="5" className={i === 2 ? "fill" : "ring"} /><text x="5" y="7" textAnchor="middle" className={i === 2 ? "dot on" : "dot"}>{letter}</text>
      <rect x="16" y="1.5" width={[88, 70, 96, 62][i]} height="5" rx="2.5" className={i === 2 ? "accent" : "line"} />
    </g>)}
    <rect x="166" y="66" width="38" height="20" rx="10" className="badge" /><text x="185" y="80" textAnchor="middle" className="badge-text">R&amp;W</text>
  </svg>;
  if (program === "ielts") return <svg className="wsp-art" viewBox="0 0 240 132" aria-hidden="true">
    <rect x="22" y="14" width="196" height="104" rx="12" className="paper" />
    <path d="M44 74v-8a26 26 0 0 1 52 0v8" className="stroke" /><rect x="38" y="70" width="14" height="24" rx="6" className="ink" /><rect x="88" y="70" width="14" height="24" rx="6" className="ink" />
    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => { const h = [10, 18, 30, 22, 36, 24, 14, 26, 12][i]; return <rect key={i} x={118 + i * 9} y={66 - h / 2} width="5" height={h} rx="2.5" className="accent" />; })}
    <rect x="118" y="92" width="80" height="5" rx="2.5" className="line" /><rect x="118" y="104" width="56" height="5" rx="2.5" className="line" />
  </svg>;
  if (program === "entrance") return <svg className="wsp-art" viewBox="0 0 240 132" aria-hidden="true">
    <rect x="22" y="14" width="196" height="104" rx="12" className="paper" />
    {[0, 1, 2, 3, 4, 5].map(i => <path key={"v" + i} d={`M${46 + i * 28} 26v80`} className="grid" />)}
    {[0, 1, 2, 3].map(i => <path key={"h" + i} d={`M40 ${34 + i * 22}h160`} className="grid" />)}
    <path d="M120 26v82M40 90h160" className="axis" />
    <path d="M56 32Q120 152 184 32" className="curve" />
    <circle cx="88" cy="70" r="4" className="fill" /><circle cx="152" cy="70" r="4" className="fill" />
    <rect x="150" y="96" width="50" height="14" rx="7" className="badge" /><text x="175" y="106" textAnchor="middle" className="badge-text">y = x²</text>
  </svg>;
  return <svg className="wsp-art" viewBox="0 0 240 132" aria-hidden="true">
    <rect x="22" y="14" width="196" height="104" rx="12" className="paper" />
    <rect x="44" y="34" width="56" height="56" rx="12" className="tile" /><text x="72" y="74" textAnchor="middle" className="kana">あ</text>
    <rect x="112" y="34" width="56" height="56" rx="12" className="tile accent-tile" /><text x="140" y="74" textAnchor="middle" className="kana on">語</text>
    <rect x="180" y="46" width="22" height="22" rx="6" className="tile" /><text x="191" y="62" textAnchor="middle" className="kana small">ン</text>
    <rect x="44" y="100" width="124" height="5" rx="2.5" className="line" />
  </svg>;
}
