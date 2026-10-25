export const dynamic="force-dynamic";
import { findSubscriptionPlan } from "@/modules/subscriptions/plans";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { programs, findProgram } from "@/modules/programs/catalog";
import { getExercises,getWorkshop } from "@/modules/content/published";
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
  const exerciseSets=await getExercises();
  const workshops=await Promise.all(guidedTasks.map(task=>getWorkshop(task.slug).then(value=>value!)));
  const sets = exerciseSets.filter(set => set.program === slug);
  const plan = findSubscriptionPlan(slug)!;
  const total = sets.reduce((sum, set) => sum + set.questions.length, 0);
  return <div className="container page-space program-library">
    <Link className="text-link" href="/programs">← Хөтөлбөрүүд</Link>
    <section className={"program-detail " + program.color}>
      <div><p className="eyebrow">{program.subtitle}</p><h1>{program.title}</h1><p className="detail-description">{program.description}</p><span className="status">{program.status}</span></div>
      <span className="detail-symbol" aria-hidden="true">{program.symbol}</span>
    </section>
    {slug !== "entrance" ? <div className="program-exam-banner"><div><p className="eyebrow">Бүтэн шалгалтын горим</p><h2>{slug === "sat" ? "Digital SAT · 98 асуулт" : "IELTS Academic · Бүх 4 чадвар"}</h2><p>Стандарт хэсэг, хугацаа, хадгалагдах хариулттай.</p></div><Link className="button" href={slug === "sat" ? "/exams/sat-full-01" : "/exams/ielts-academic-01"}>Бүтэн шалгалт үзэх →</Link></div> : null}
    {slug === "ielts" && <SpeakingInvitation />}
    <div className="library-heading"><div><p className="eyebrow">Сонго · Бод · Тайлбартай нь шалга</p><h2>Өнөөдрийн бэлтгэлээ сонго.</h2></div><p>{sets.length} багц / {total} асуулт</p></div>
    <div className="exercise-list">{sets.map((set, index) => <Link className="exercise-row" href={"/exercises/" + set.slug} key={set.slug}>
      <span className="exercise-count" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
      <div><p className="eyebrow">{set.subject}</p><h3>{set.title}</h3><p>{set.description}</p><span className="exercise-meta">{set.questions.length} асуулт · ~{set.minutes} минут · Тайлбартай хариу</span></div>
      <span className="exercise-open">Эхлэх <span aria-hidden="true">→</span></span>
    </Link>)}</div>
    {slug === "ielts" ? <section className="guided-library"><div className="library-heading"><div><p className="eyebrow">Өөрийн үгээр хариулаарай</p><h2>Writing & Speaking workshop</h2></div><p>4 даалгавар</p></div>
      <div className="workshop-grid">{workshops.map(task => <Link className="workshop-link" key={task.slug} href={"/workshops/" + task.slug}><p className="eyebrow">{task.skill} · ~{task.minutes} минут</p><h3>{task.title}</h3><p>Даалгавар, жишиг хариу, өөрийгөө шалгах жагсаалт</p><span className="text-link">Дасгал нээх →</span></Link>)}</div>
      <p className="fine-print source-note">Энэ сан нь Reading, хэлний суурь, Writing болон Speaking дасгалтай. Listening дасгал хараахан нэмэгдээгүй. <a href="https://ielts.org/take-a-test/test-types/ielts-academic-test" target="_blank" rel="noopener noreferrer">IELTS Academic-ийн хэсгүүдтэй танилцах ↗</a></p>
    </section> : null}
    <section className="program-plan-banner"><div><h2>Бүх бэлтгэл · ₮{plan.amountMnt.toLocaleString("en-US")} / сар</h2><p>Энэ хөтөлбөрийн бүх дасгал{slug!=="entrance"?", бүтэн mock шалгалт":""} нэг сарын эрхэд багтана.</p></div><Link className="button" href={"/subscribe/"+slug}>Сарын багц сонгох →</Link></section>
    {slug==="entrance"&&<section className="program-exam-banner"><div><h2>ЭЕШ 2020 · Математик</h2><p>A, B, C, D хувилбар · 36 + 4 даалгавар · 100 минут. Сарын багцад багтсан.</p></div><Link className="button" href="/exams/eec-math-2020">Албан шалгалт нээх →</Link></section>}
    {slug==="entrance"&&<section className="program-exam-banner regional-exam-entry"><div><h2>2026 · Дорнод · Онлайн сорил-4</h2><p>Математик, Англи хэл · Хугацаатай, хариутай бүсийн сорилууд.</p></div><Link className="button" href="/exams/dornod-2026">2026 оны сорилууд →</Link></section>}
    {slug==="entrance"&&<section className="program-exam-banner english-archive-entry"><div><h2>ЭЕШ · Англи хэл</h2><p>Өмнөх оны шалгалтууд · Баталгаажсан эх материал, таарсан хариуны түлхүүр.</p></div><Link className="button" href="/exams/eec-english">Англи хэлний шалгалтууд →</Link></section>}
    <div className="practice-guidance"><div><h2>Алдаагаа ойлгоод дахин оролд.</h2><p>Идэвхтэй сарын багцаар бүх дасгалыг тайлбартай нь хийнэ. Бүртгэлдээ хадгалах горимыг сонговол дараа үргэлжлүүлж, үр дүнгээ эргэн харна.</p></div><Link className="button secondary" href="/dashboard">Миний бэлтгэл →</Link></div>
    <p className="fine-print source-note">Өөрсдийн зохиосон сэдэвчилсэн дасгалууд. Багшийн хяналт хүлээгдэж буй туршилтын агуулга. Бүтэн mock шалгалт, албан ёсны оноо эсвэл band үнэлгээ биш.</p>
    {slug === "sat" ? <p className="fine-print source-note">Сэдвийн ангилал: <a href="https://satsuite.collegeboard.org/sat/whats-on-the-test/math/overview" target="_blank" rel="noopener noreferrer">College Board — Math overview ↗</a>. Богино танилцах хувилбар: <Link href="/practice">Жишиг дасгал эхлэх →</Link></p> : null}
    {slug === "entrance" ? <p className="fine-print source-note">Математик, англи хэл, физикийн суурь чадварын дасгал. Тухайн жилийн ЭШ-ийн албан ёсны блюпринт, бүрэн сэдвийн хамрах хүрээг орлохгүй.</p> : null}
  </div>;
}
