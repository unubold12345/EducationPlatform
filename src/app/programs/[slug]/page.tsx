export const dynamic = "force-dynamic";
import { pricedPlan } from "@/modules/subscriptions/prices";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { programs, findProgram } from "@/modules/programs/catalog";
import { getExercises, getWorkshop } from "@/modules/content/published";
import { SpeakingInvitation } from "@/components/speaking-invitation";
import { guidedTasks } from "@/modules/exercises/guided";

export function generateStaticParams() { return programs.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: findProgram(slug)?.title ?? "Хөтөлбөр олдсонгүй" };
}

export default async function ProgramPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const program = findProgram(slug);
  if (!program) notFound();
  const exerciseSets = await getExercises();
  const workshops = await Promise.all(guidedTasks.map(task => getWorkshop(task.slug).then(value => value!)));
  const sets = exerciseSets.filter(set => set.program === slug);
  const plan = (await pricedPlan(slug))!;
  const totalQuestions = sets.reduce((sum, set) => sum + set.questions.length, 0);
  const totalMinutes = sets.reduce((sum, set) => sum + set.minutes, 0);
  const firstSet = sets[0];
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
          <div><dt>Дасгалын багц</dt><dd>{sets.length}</dd></div>
          <div><dt>Нийт асуулт</dt><dd>{totalQuestions}</dd></div>
          <div><dt>Нийт хугацаа</dt><dd>~{totalMinutes} мин</dd></div>
          {slug === "ielts" ? <div><dt>Workshop</dt><dd>{workshops.length}</dd></div> : null}
          <div><dt>Сарын эрх</dt><dd>₮{plan.amountMnt.toLocaleString("en-US")}</dd></div>
        </dl>
        {firstSet ? <Link className="button" href={"/exercises/" + firstSet.slug}>Эхний багцаас эхлэх <span aria-hidden="true">→</span></Link> : null}
        <Link className="text-link program-sample-link" href="/practice">Жишиг дасгал эхлэх <span aria-hidden="true">→</span></Link>
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

    <section className="program-sets" aria-labelledby="program-sets-heading">
      <div className="library-heading">
        <div><p className="eyebrow">АЛХАМ 1 · СЭДЭВЧИЛСЭН ДАСГАЛ</p><h2 id="program-sets-heading">Дасгалын багцууд</h2></div>
        <p>{sets.length} багц · {totalQuestions} асуулт</p>
      </div>
      <div className="set-deck">{sets.map((set, index) => <Link className="exercise-row set-card" href={"/exercises/" + set.slug} key={set.slug}>
        <span className="set-card-top"><span className="exercise-count" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><span className="set-subject">{set.subject}</span></span>
        <h3>{set.title}</h3>
        <p>{set.description}</p>
        <span className="set-card-foot"><span className="exercise-meta">{set.questions.length} асуулт · ~{set.minutes} минут</span><span className="exercise-open">Эхлэх <span aria-hidden="true">→</span></span></span>
      </Link>)}</div>
    </section>

    {slug === "ielts" ? <section className="guided-library program-workshops" aria-labelledby="program-workshops-heading">
      <div className="library-heading">
        <div><p className="eyebrow">АЛХАМ 2 · ӨӨРИЙН ҮГЭЭР</p><h2 id="program-workshops-heading">Writing &amp; Speaking workshop</h2></div>
        <p>{workshops.length} даалгавар</p>
      </div>
      <div className="workshop-grid">{workshops.map(task => <Link className="workshop-link" key={task.slug} href={"/workshops/" + task.slug}>
        <p className="eyebrow">{task.skill} · ~{task.minutes} минут</p>
        <h3>{task.title}</h3>
        <p>Даалгавар, жишиг хариу, өөрийгөө шалгах жагсаалт</p>
        <span className="text-link">Дасгал нээх <span aria-hidden="true">→</span></span>
      </Link>)}</div>
      <p className="fine-print source-note">Энэ сан нь Reading, хэлний суурь, Writing болон Speaking дасгалтай. Listening дасгал хараахан нэмэгдээгүй. <a href="https://ielts.org/take-a-test/test-types/ielts-academic-test" target="_blank" rel="noopener noreferrer">IELTS Academic-ийн хэсгүүдтэй танилцах ↗</a></p>
    </section> : null}

    {slug === "entrance" ? <section className="program-official" aria-labelledby="program-official-heading">
      <div className="library-heading">
        <div><p className="eyebrow">АЛХАМ 2 · АЛБАН ЁСНЫ МАТЕРИАЛ</p><h2 id="program-official-heading">Бодит шалгалтууд</h2></div>
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

    <section className="program-plan-banner" aria-labelledby="program-plan-heading">
      <div>
        <p className="eyebrow">БҮГД НЭГ ЭРХЭД</p>
        <h2 id="program-plan-heading">Бүх бэлтгэл · ₮{plan.amountMnt.toLocaleString("en-US")} / сар</h2>
        <p>Энэ хөтөлбөрийн бүх дасгал{slug !== "entrance" ? ", бүтэн mock шалгалт" : ""} нэг сарын эрхэд багтана.</p>
        <ul className="program-plan-features">{plan.features.map(feature => <li key={feature}>{feature}</li>)}</ul>
      </div>
      <div className="program-plan-action">
        <Link className="button" href={"/subscribe/" + slug}>Сарын багц сонгох <span aria-hidden="true">→</span></Link>
        <p className="fine-print">Туршилтын (симуляцлагдсан) төлбөр. Картын мэдээлэл шаардахгүй.</p>
      </div>
    </section>

    <section className="practice-guidance program-next">
      <div><p className="eyebrow">ДАРААГИЙН АЛХАМ</p><h2>Алдаагаа ойлгоод дахин оролд.</h2><p>Идэвхтэй сарын багцаар бүх дасгалыг тайлбартай нь хийнэ. Бүртгэлдээ хадгалах горимыг сонговол дараа үргэлжлүүлж, үр дүнгээ эргэн харна.</p></div>
      <Link className="button secondary" href="/dashboard">Миний бэлтгэл <span aria-hidden="true">→</span></Link>
    </section>

    <details className="program-notes">
      <summary>Тэмдэглэл ба эх сурвалж</summary>
      <p className="fine-print source-note">Өөрсдийн зохиосон сэдэвчилсэн дасгалууд. Багшийн хяналт хүлээгдэж буй туршилтын агуулга. Бүтэн mock шалгалт, албан ёсны оноо эсвэл band үнэлгээ биш.</p>
      {slug === "sat" ? <p className="fine-print source-note">Сэдвийн ангилал: <a href="https://satsuite.collegeboard.org/sat/whats-on-the-test/math/overview" target="_blank" rel="noopener noreferrer">College Board — Math overview ↗</a>.</p> : null}
      {slug === "entrance" ? <p className="fine-print source-note">Математик, англи хэл, физикийн суурь чадварын дасгал. Тухайн жилийн ЭШ-ийн албан ёсны блюпринт, бүрэн сэдвийн хамрах хүрээг орлохгүй.</p> : null}
    </details>
  </div>;
}
