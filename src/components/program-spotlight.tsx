import Link from "next/link";
import type { Program } from "@/modules/programs/catalog";

// Student-facing program card used on /programs. Keeps the `.program-card`
// class consumed by existing browser checks while adding a scannable layout.
export function ProgramSpotlight({ program, index }: { program: Program; index: number }) {
  return <Link href={"/programs/" + program.slug} className={"program-card program-spotlight " + program.color}>
    <div className="spotlight-top">
      <span className="spotlight-symbol" aria-hidden="true">{program.symbol}</span>
      <span className="spotlight-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
    </div>
    <p className="eyebrow">{program.subtitle}</p>
    <h3>{program.title}</h3>
    <p className="card-description">{program.description}</p>
    <p className="spotlight-audience"><span aria-hidden="true">◉</span>{program.audience}</p>
    <ul className="spotlight-list">{program.highlights.map(item => <li key={item}>{item}</li>)}</ul>
    <div className="spotlight-foot">
      <span className="status">{program.status}</span>
      <span className="card-link">Хөтөлбөр нээх <span aria-hidden="true">→</span></span>
    </div>
  </Link>;
}
