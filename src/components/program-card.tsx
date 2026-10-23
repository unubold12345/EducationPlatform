import Link from "next/link";
import type { Program } from "@/modules/programs/catalog";

export function ProgramCard({ program }: { program: Program }) {
  return <Link href={"/programs/" + program.slug} className={"program-card " + program.color}>
    <div className="card-top"><span className="subject-symbol" aria-hidden="true">{program.symbol}</span><span className="status">{program.status}</span></div>
    <p className="eyebrow">{program.subtitle}</p>
    <h3>{program.title}</h3><p className="card-description">{program.description}</p>
    <span className="card-link">Хөтөлбөртэй танилцах <span aria-hidden="true">↗</span></span>
  </Link>;
}

