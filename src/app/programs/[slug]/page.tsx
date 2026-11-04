export const dynamic = "force-dynamic";
import { pricedPlan } from "@/modules/subscriptions/prices";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { programs, findProgram } from "@/modules/programs/catalog";
import { getWorkshop } from "@/modules/content/published";
import { examDefinitions } from "@/modules/exams/definitions";
import { allOfficialPapers } from "@/modules/papers/catalog";
import { SpeakingInvitation } from "@/components/speaking-invitation";
import { guidedTasks } from "@/modules/workshops/guided";

export function generateStaticParams() { return programs.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: findProgram(slug)?.title ?? "Хөтөлбөр олдсонгүй" };
}

export default async function ProgramPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const program = findProgram(slug);
  if (!program) notFound();
  const workshops = await Promise.all(guidedTasks.map(task => getWorkshop(task.slug).then(value => value!)));
  const mockCount = examDefinitions.filter(exam => exam.program === slug).length;
  const plan = (await pricedPlan(slug))!;
  const mock = slug === "sat" ? {
    eyebrow: "БҮТЭН ШАЛГАЛТ · DIGITAL SAT",
    title: "98 асуулт. Бодит хугацаа.",
    copy: "Reading & Writing 2 модуль, Math 2 модуль. Серверийн цаг, хадгалагдах хариулт, эцсийн дүн.",
    facts: ["98 асуулт", "2ц 14м + 10м завсарлага", "₮10,000 эсвэл SAT эрх"],
    href: "/exams/sat",
    cta: "Бүтэн шалгалт үзэх",
  } : slug === "ielts" ? {
    eyebrow: "БҮТЭН ШАЛГАЛТ · IELTS ACADEMIC",
    title: "Дөрвөн чадвар. Нэг бүтэн оролдлого.",
    copy: "Listening, Reading, Writing, Speaking. Бүтэн Academic mock, серверийн цаг, хадгалагдах хариулт.",
    facts: ["4 чадвар", "Listening 40 · Reading 40", "₮10,000 эсвэл IELTS эрх"],
    href: "/exams/ielts",
    cta: "Бүтэн шалгалт үзэх",
  } : null;

  return <div className="container page-space program-library program-detail-page">
    <nav className="program-breadcrumb" aria-label="Хөтөлбөрийн зам">
      <Link className="text-link" href="/programs">← Бүх хөтөлбөр</Link>
      <span aria-hidden="true">/</span>
      <span>{program.title}</span>
    </nav>

    <section className={"program-detail program-hero " + program.color}>
      <div className="program-hero-copy">
        <p className="eyebrow">{program.subtitle}</p>
        <h1>{program.title}</h1>
        <p className="detail-description">{program.description}</p>
        <p className="program-audience"><span aria-hidden="true">◉</span>{program.audience}</p>
        <ul className="program-topics" aria-label="Сэдвүүд">{program.topics.map(topic => <li key={topic}>{topic}</li>)}</ul>
      </div>
      <span className="program-hero-mark" aria-hidden="true">{program.symbol}</span>
      <aside className="program-facts" aria-label="Хөтөлбөрийн товч мэдээлэл">
        <div className="program-facts-head"><span className="eyebrow">НЭГ ХАРААСАЙ</span><span className="status">{program.status}</span></div>
        <dl>
          {slug === "entrance" ? <div><dt>Албан хувилбар</dt><dd>{allOfficialPapers.length}</dd></div> : <div><dt>Бүтэн mock</dt><dd>{mockCount}</dd></div>}
          {slug === "ielts" ? <div><dt>Workshop</dt><dd>{workshops.length}</dd></div> : null}
          <div><dt>Сарын эрх</dt><dd>₮{plan.amountMnt.toLocaleString("en-US")}</dd></div>
        </dl>
        <Link className="button" href={mock?.href ?? "/exams/eec-math-2020"}>Шалгалт эхлэх <span aria-hidden="true">→</span></Link>
      </aside>
    </section>

    {mock ? <section className="program-mock-card" aria-labelledby="program-mock-heading">
      <div>
        <p className="eyebrow">{mock.eyebrow}</p>
        <h2 id="program-mock-heading">{mock.title}</h2>
        <p>{mock.copy}</p>
        <div className="program-mock-facts">{mock.facts.map(fact => <span key={fact}>{fact}</span>)}</div>
      </div>
      <Link className="button secondary" href={mock.href}>{mock.cta} <span aria-hidden="true">→</span></Link>
    </section> : null}

    {slug === "ielts" ? <SpeakingInvitation /> : null}

    {slug === "ielts" ? <section className="guided-library program-workshops" aria-labelledby="program-workshops-heading">
      <div className="library-heading">
        <div><p className="eyebrow">ӨӨРИЙН ҮГЭЭР</p><h2 id="program-workshops-heading">Writing &amp; Speaking workshop</h2></div>
        <p>{workshops.length} даалгавар</p>
      </div>
      <div className="workshop-grid">{workshops.map(task => <Link className="workshop-link" key={task.slug} href={"/workshops/" + task.slug}>
        <p className="eyebrow">{task.skill} · ~{task.minutes} минут</p>
        <h3>{task.title}</h3>
        <p>Даалгавар, жишиг хариу, өөрийгөө шалгах жагсаалт</p>
        <span className="text-link">Даалгавар нээх <span aria-hidden="true">→</span></span>
      </Link>)}</div>
      <p className="fine-print source-note">Бичих, ярих чадварыг бүтэн шалгалтаас гадуур бэлтгэх даалгаврууд. <a href="https://ielts.org/take-a-test/test-types/ielts-academic-test" target="_blank" rel="noopener noreferrer">IELTS Academic-ийн хэсгүүдтэй танилцах ↗</a></p>
    </section> : null}

    {slug === "entrance" ? <section className="program-official" aria-labelledby="program-official-heading">
      <div className="library-heading">
        <div><p className="eyebrow">АЛБАН ЁСНЫ МАТЕРИАЛ</p><h2 id="program-official-heading">Бодит шалгалтууд</h2></div>
        <p>2 архив</p>
      </div>
      <div className="program-official-grid">
        <Link className="program-official-card" href="/exams/eec-math-2020">
          <span className="eyebrow">ЭЕШ 2020 · МАТЕМАТИК</span>
          <strong>A, B, C, D хувилбар</strong>
          <span>36 сонгох + 4 бичих даалгавар · 100 минут. Сарын багцад багтсан.</span>
          <span className="text-link">Албан шалгалт нээх <span aria-hidden="true">→</span></span>
        </Link>
        <Link className="program-official-card" href="/exams/eec-english">
          <span className="eyebrow">ЭЕШ · АНГЛИ ХЭЛ</span>
          <strong>37 хувилбар · 10 жил</strong>
          <span>Баталгаажсан эх материал, таарсан хариуны түлхүүр. Хугацаатай бүтэн шалгалт.</span>
          <span className="text-link">Англи хэлний шалгалтууд <span aria-hidden="true">→</span></span>
        </Link>
      </div>
    </section> : null}

    {slug === "sat" ? <p className="fine-print source-note">Сэдвийн ангилал: <a href="https://satsuite.collegeboard.org/sat/whats-on-the-test/math/overview" target="_blank" rel="noopener noreferrer">College Board — Math overview ↗</a>.</p> : null}
  </div>;
}
