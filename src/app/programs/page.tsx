import type { Metadata } from "next";
import Link from "next/link";
import { programs } from "@/modules/programs/catalog";
import { ProgramSpotlight } from "@/components/program-spotlight";
import { LawTestRecommendation } from "@/components/lawtest";
export const metadata: Metadata = { title: "Хөтөлбөрүүд" };

const steps = [
  { title: "Хөтөлбөрөө сонго", copy: "Зорилгодоо тохирох шалгалтаа сонго. Хөтөлбөр бүр өөр өөрийн замтай." },
  { title: "Богино багцаар бод", copy: "8 бодлогын багц. Хариугаа хадгаад, өөрийн хурдаар үргэлжлүүл." },
  { title: "Тайлбараар бататга", copy: "Алдсан бодлогоо алхам алхмаар ойлгоод, дахин оролдож шалга." },
];

export default function ProgramsPage() {
  return <div className="container page-space programs-page">
    <header className="programs-hero">
      <div className="page-intro">
        <p className="eyebrow">ХӨТӨЛБӨРҮҮД</p>
        <h1>Аль шалгалтад<br /><span>бэлдэх вэ?</span></h1>
        <p>Гурван замаас сонго. Багц дасгал, тайлбар, бүтэн шалгалт — нэг дор. Эхлэхэд бүртгэл шаардлагагүй жишиг дасгал бий.</p>
      </div>
      <Link className="programs-free-card" href="/practice">
        <span className="eyebrow">ЭХЛЭЭД ҮЗЭЭД ШИЙД</span>
        <span className="programs-free-copy">
          <strong>3 бодлогын үнэгүй жишиг</strong>
          <span>SAT алгебрийн богино дасгал. Хариултаа шалгаад, тайлбарыг хараарай.</span>
        </span>
        <span className="programs-free-foot">
          <span className="button">Жишиг дасгал эхлэх <span aria-hidden="true">→</span></span>
          <small>Бүртгэлгүй · ~2 минут</small>
        </span>
      </Link>
    </header>

    <div className="programs-meta" aria-label="Хөтөлбөрийн товч"><div><strong>80</strong><span>Багц дасгалын асуулт</span></div><div><strong>04</strong><span>Writing & Speaking workshop</span></div><div><strong>04</strong><span>Шалгалтын ангилал</span></div></div>

    <div className="program-grid program-picker">{programs.map((program, index) => <ProgramSpotlight key={program.slug} program={program} index={index} />)}</div>

    <section className="programs-steps" aria-labelledby="programs-steps-heading">
      <div><p className="eyebrow">ХЭРХЭН БЭЛДЭХ ВЭ</p><h2 id="programs-steps-heading">Нэг алхамаас<br />эхэл. Дараа нь<br />өдөр бүр.</h2></div>
      <ol>{steps.map((step, index) => <li key={step.title}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><div><h3>{step.title}</h3><p>{step.copy}</p></div></li>)}</ol>
    </section>

    <LawTestRecommendation />
  </div>;
}
