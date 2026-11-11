import type { Metadata } from "next";
import { programs } from "@/modules/programs/catalog";
import { ProgramSpotlight } from "@/components/program-spotlight";
import { LawTestRecommendation } from "@/components/lawtest";
export const metadata: Metadata = { title: "Хөтөлбөрүүд" };

const steps = [
  { title: "Хөтөлбөрөө сонго", copy: "Зорилгодоо тохирох шалгалтаа сонго. Хөтөлбөр бүр өөр өөрийн замтай." },
  { title: "Бүтэн шалгалт өг", copy: "Бодит хугацаатай шалгалт. Хариу чинь хадгалагдаж, орхисон газраасаа үргэлжилнэ." },
  { title: "Дүнгээ шинжил", copy: "Алдсан асуултаа хараад, дараагийн шалгалтаа илүү сайн өг." },
];

export default function ProgramsPage() {
  return <div className="container page-space programs-page">
    <h1 className="sr-only">Хөтөлбөрүүд</h1>

    <div className="programs-meta" aria-label="Хөтөлбөрийн товч"><div><strong>212</strong><span>Бүтэн mock шалгалт</span></div><div><strong>194</strong><span>ЭЕШ mock</span></div><div><strong>04</strong><span>Writing & Speaking workshop</span></div></div>

    <div className="program-grid program-picker">{programs.map((program, index) => <ProgramSpotlight key={program.slug} program={program} index={index} />)}</div>

    <section className="programs-steps" aria-labelledby="programs-steps-heading">
      <div><p className="eyebrow">ХЭРХЭН БЭЛДЭХ ВЭ</p><h2 id="programs-steps-heading">Нэг алхамаас<br />эхэл. Дараа нь<br />өдөр бүр.</h2></div>
      <ol>{steps.map((step, index) => <li key={step.title}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><div><h3>{step.title}</h3><p>{step.copy}</p></div></li>)}</ol>
    </section>

    <LawTestRecommendation />
  </div>;
}
