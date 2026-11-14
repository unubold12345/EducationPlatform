export const dynamic = "force-dynamic";
import { pricedPlan } from "@/modules/subscriptions/prices";
import { salePlanFor } from "@/modules/subscriptions/plans";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { programs, findProgram } from "@/modules/programs/catalog";
import { getWorkshop } from "@/modules/content/published";
import { examDefinitions } from "@/modules/exams/definitions";
import { ENTRANCE_SUBJECT_ORDER, entranceCounts, entranceSubjectFormats, entranceSubjectHrefs, entranceSubjectLabels, entranceTotal, entranceYears } from "@/modules/exams/entrance/catalog";
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
  const mockCount = slug === "entrance" ? entranceTotal : examDefinitions.filter(exam => exam.program === slug).length;
  // SAT and IELTS come with the Гадаад хэл plan (15 mocks a month); ЭЕШ has its own plan (owner rule 2026-11-13).
  const plan = (await pricedPlan(salePlanFor(slug)?.program))!;
  const mock = slug === "sat" ? {
    eyebrow: "БҮТЭН ШАЛГАЛТ · DIGITAL SAT",
    title: "98 асуулт. Бодит хугацаа.",
    copy: "Reading & Writing 2 модуль, Math 2 модуль. Серверийн цаг, хадгалагдах хариулт, эцсийн дүн.",
    facts: ["98 асуулт", "2ц 14м + 10м завсарлага", "₮10,000 эсвэл Гадаад хэл багц"],
    href: "/exams/sat",
    cta: "Бүтэн шалгалт үзэх",
  } : slug === "ielts" ? {
    eyebrow: "БҮТЭН ШАЛГАЛТ · IELTS ACADEMIC",
    title: "Дөрвөн чадвар. Нэг бүтэн оролдлого.",
    copy: "Listening, Reading, Writing, Speaking. Бүтэн Academic mock, серверийн цаг, хадгалагдах хариулт.",
    facts: ["4 чадвар", "Listening 40 · Reading 40", "₮10,000 эсвэл Гадаад хэл багц"],
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
          <div><dt>Бүтэн mock</dt><dd>{mockCount}</dd></div>
          {slug === "ielts" ? <div><dt>Workshop</dt><dd>{workshops.length}</dd></div> : null}
          <div><dt>{plan.title} багц</dt><dd>₮{plan.amountMnt.toLocaleString("en-US")}{plan.mockPicks ? <small> · сард {plan.mockPicks} mock</small> : null}</dd></div>
        </dl>
        <Link className="button" href={mock?.href ?? "/exams/eesh"}>Шалгалт эхлэх <span aria-hidden="true">→</span></Link>
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
        <div><p className="eyebrow">ЭЕШ-ИЙН БҮТЭЦТЭЙ MOCK</p><h2 id="program-official-heading">Бүтэн дадлагын шалгалтууд</h2></div>
        <p>{mockCount} mock</p>
      </div>
      <div className="program-official-grid">
        {ENTRANCE_SUBJECT_ORDER.map(subject => <Link key={subject} className="program-official-card" href={entranceSubjectHrefs[subject]}>
          <span className="eyebrow">{entranceSubjectLabels[subject].toUpperCase()}</span>
          <strong>{entranceCounts()[subject]} mock · {Math.min(...entranceYears(subject))}–{Math.max(...entranceYears(subject))} оны жишиг бүтэц</strong>
          <span>{entranceSubjectFormats[subject]}. Цагтай шалгалт, оноотой үр дүн, AI туслахтай дадлагын горим.</span>
          <span className="text-link">Шалгалтууд үзэх <span aria-hidden="true">→</span></span>
        </Link>)}
      </div>
      <p className="fine-print source-note">Бүх даалгаврыг энэ сайтад зориулж зохиосон; БҮТ-ийн албан материал биш.</p>
    </section> : null}

    {slug === "sat" ? <p className="fine-print source-note">Сэдвийн ангилал: <a href="https://satsuite.collegeboard.org/sat/whats-on-the-test/math/overview" target="_blank" rel="noopener noreferrer">College Board — Math overview ↗</a>.</p> : null}
  </div>;
}
