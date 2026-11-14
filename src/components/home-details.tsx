import Image from "next/image";
import Link from "next/link";
import type { Program } from "@/modules/programs/catalog";
import { programs } from "@/modules/programs/catalog";
import { examDefinitions } from "@/modules/exams/definitions";
import { entranceCounts, entranceTotal } from "@/modules/exams/entrance/catalog";
import { jlptMocks } from "@/modules/exams/jlpt/catalog";
import { hskMocks } from "@/modules/exams/hsk/catalog";
import { MOCK_PRICE_LABEL } from "@/modules/exams/pricing";
import { freeMocks } from "@/modules/exams/free/catalog";
import { FREE_MONTHLY_CREDITS } from "@/modules/credits/pricing";
import { salePlanFor } from "@/modules/subscriptions/plans";
import type { pricedPlans } from "@/modules/subscriptions/prices";
import { speakingLabEnabled, writingLabEnabled, listeningLabEnabled, readingLabEnabled } from "@/lib/local-pilot";
import { homeArtwork } from "@/components/home-art";
import { HomeDemoVideo } from "@/components/home-demo-video";

type Plans = Awaited<ReturnType<typeof pricedPlans>>;
const count = (program: string) => examDefinitions.filter(exam => exam.program === program).length;
const subjectCounts = entranceCounts();
// Every mock on the site: SAT and IELTS definitions plus the ЭЕШ, JLPT and HSK catalogues.
export const totalMocks = examDefinitions.length + entranceTotal + jlptMocks.length + hskMocks.length;
export const labCount = () => [speakingLabEnabled(), writingLabEnabled(), listeningLabEnabled(), readingLabEnabled()].filter(Boolean).length;

export const homePrograms: Program[] = [...programs, {
  slug: "jlpt", title: "JLPT", subtitle: "Япон хэл · N5 ба N4", symbol: "あ", color: "blue",
  status: `${jlptMocks.length} бүтэн mock`, audience: "Япон хэлний сууриа бататгах бол",
  description: "N5, N4 түвшний үгийн сан, хэлзүй, унших, сонсох бэлтгэл.",
  topics: ["Үгийн сан", "Хэлзүй", "Унших", "Сонсох"],
  highlights: ["3 N5 + 3 N4 mock", "Япон сонсголын бичлэг"], available: true,
}, {
  slug: "hsk", title: "HSK", subtitle: "Хятад хэл · HSK 1", symbol: "汉", color: "blue",
  status: `${hskMocks.length} бүтэн mock`, audience: "Хятад хэлний анхан шатаа бататгах бол",
  description: "HSK 1 түвшний сонсох, унших бэлтгэл.",
  topics: ["Сонсох", "Унших", "Зурагтай даалгавар", "Pinyin"],
  highlights: [`${hskMocks.length} HSK 1 mock`, "Хятад сонсголын бичлэг"], available: true,
}];

const formats: Record<string, { href: string; artwork: keyof typeof homeArtwork; summary: string; facts: [string, string][] }> = {
  sat: { href: "/exams/sat", artwork: "stemCover", summary: "Унших, бичих, математикийн бэлтгэлээ нэгтгэ.", facts: [["Бүтэн mock", String(count("sat"))], ["Асуулт", "98 · 4 модуль"], ["Хугацаа", "2ц 14м + 10м завсарлага"]] },
  ielts: { href: "/exams/ielts", artwork: "languageCover", summary: "Сонсох, унших, бичих, ярих. Дөрвөн чадвар, нэг зорилго.", facts: [["Бүтэн mock", String(count("ielts"))], ["Listening · Reading", "40 + 40 асуулт"], ["Writing · Speaking", "2 бичвэр · 3 хэсэг"]] },
  entrance: { href: "/exams/eesh", artwork: "eeshCover", summary: "Математик, физик, хими, биологи, англи хэл. 2015–2026 оны бүтэцтэй, хугацаатай mock.", facts: [["Математик", `${subjectCounts.math} mock · 100 минут`], ["Физик", `${subjectCounts.physics} mock · 100 минут`], ["Хими", `${subjectCounts.chemistry} mock · 100 минут`], ["Биологи", `${subjectCounts.biology} mock · 80 минут`], ["Англи хэл", `${subjectCounts.english} mock · 80 минут`]] },
  jlpt: { href: "/exams/jlpt", artwork: "japaneseCover", summary: "N5-аас N4 рүү. Япон хэлний сууриа алхам алхмаар.", facts: [["N5", "3 mock · 67 асуулт · 90 минут"], ["N4", "3 mock · 85 асуулт · 115 минут"], ["Сонсгол", "Япон бичлэг · 3 үе шат"]] },
  hsk: { href: "/exams/hsk", artwork: "hskCover", summary: "Хятад хэлний анхны алхам. Сонсох, унших, бүх ханз pinyin-тэй.", facts: [["HSK 1", `${hskMocks.length} mock · 40 асуулт · 32 минут`], ["Сонсох", "20 асуулт · 15 минут"], ["Унших", "20 асуулт · 17 минут"]] },
};

export function HomeProgramDetails({ plans }: { plans: Plans }) {
  return <><div className="home-detail-list">{homePrograms.map(program => {
    // SAT, IELTS, JLPT and HSK come with the Гадаад хэл plan (15 mocks a month); ЭЕШ has its own plan.
    const format = formats[program.slug], plan = plans.find(item => item.program === salePlanFor(program.slug)?.program);
    return <article className={"home-program-detail home-program-" + program.slug} id={"program-" + program.slug} key={program.slug} data-reveal>
      <div className="home-program-image"><Image src={homeArtwork[format.artwork].src} alt={homeArtwork[format.artwork].alt} fill sizes="(max-width: 620px) 100vw, 50vw" /><i aria-hidden="true">{program.symbol}</i></div>
      <div className="home-program-copy"><header><div><p className="eyebrow">{program.subtitle}</p><h3>{program.slug === "entrance" ? "ЭЕШ" : program.title}</h3></div><span className="status">{program.status}</span></header><p className="home-program-summary">{format.summary}</p>
        <details className="home-program-more"><summary>Бүтэц, хугацаа <span aria-hidden="true">+</span></summary><dl>{format.facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><ul className="home-topic-list">{program.topics.map(topic => <li key={topic}>{topic}</li>)}</ul></details>
        <footer><p>{plan ? <><strong>₮{plan.amountMnt.toLocaleString("en-US")}</strong> / сар <small>{plan.title}{plan.mockPicks ? ` · сард ${plan.mockPicks} mock` : " · хязгааргүй"}</small></> : <><strong>{MOCK_PRICE_LABEL}</strong> / mock</>}</p><Link className="text-link" href={format.href}>Шалгалтууд <span aria-hidden="true">↗</span></Link></footer>
      </div>
    </article>;
  })}</div><p className="home-section-note">Бэлтгэлийн материал: албан ёсны шалгалт, SAT scaled score, IELTS band, JLPT эсвэл HSK тэнцсэн дүн биш. ЭЕШ, JLPT, HSK материал багшийн хяналт хүлээж байна.</p></>;
}

const workspaceFeatures = [
  { mark: "✳", title: "AI туслах", text: "Бодлого, эссэ, үгээ асуу. Зургаар ч болно." },
  { mark: "Aa", title: "Үгсийн сан", text: "Файлаас үг ялгаж, quiz-ээр цээжил." },
  { mark: "▤", title: "Файлаас шалгалт", text: "PDF, Word, зургаас 5–40 асуулт." },
  { mark: "↗", title: "Миний үр дүн", text: "Алдаа бүрээ AI багштай задал." },
];

const demos = [
  { id: "exam-practice", number: "01", title: "Сонго. Бод. Шалга.", text: "Шалгалтын сангаас цаггүй дадлага хүртэл.", transcript: "Шалгалтын санг нээнэ → SAT mock сонгоно → цаггүй дадлагад хариулна → тайлбарыг шалгана.", href: "/exams", link: "Шалгалтуудыг нээх" },
  { id: "workspace-review", number: "02", title: "Алдаа бүр дараагийн алхам.", text: "Workspace, хадгалсан дүн, асуулт бүрийн тайлбар.", transcript: "Workspace-ийн нүүрийг нээнэ → Review рүү орно → жишээ дансны дууссан mock-ийг нээнэ → асуулт болон тайлбарыг харна. Энэ нь бичлэгт зориулсан туршилтын дүн.", href: "/workspace/review", link: "Workspace нээх" },
  { id: "workshop", number: "03", title: "Өөрийн үгээр илэрхийл.", text: "Speaking хамтрагчаа сонгоод, Essay Studio-д бич.", transcript: "Workshop-ийг нээнэ → Speaking-ийн хамтрагч, хэсгийг сонгоно → Essay Studio-ийн даалгаврыг нээж, жишээ бичвэр бичнэ. AI хариу эсвэл үнэлгээ дуудаагүй.", href: "/workspace/workshop", link: "Workshop нээх" },
];

export function HomeWorkspaceDetails() {
  return <section className="section home-workspace-details" id="workspace" aria-labelledby="home-workspace-heading">
    <div className="section-heading" data-reveal><h2 id="home-workspace-heading">Бэлтгэл чинь ингэж өрнөнө.</h2></div>
    <div className="home-demo-grid" id="demos">{demos.map(demo => <article className="home-demo-card" key={demo.id} data-reveal><div className="home-demo-heading"><span>{demo.number}</span><h3 id={demo.id + "-heading"}>{demo.title}</h3></div><div className="home-demo-screen"><HomeDemoVideo id={demo.id} /></div><div className="home-demo-footer"><p id={demo.id + "-description"}>{demo.text}</p><Link className="text-link" href={demo.href}>{demo.link} ↗</Link></div><p className="sr-only">Бичлэгийн алхмууд: {demo.transcript}</p></article>)}</div>
    <div className="home-feature-grid">{workspaceFeatures.map(feature => <article key={feature.title} data-reveal><span className="home-feature-mark" aria-hidden="true">{feature.mark}</span><div><h3>{feature.title}</h3><p>{feature.text}</p></div></article>)}</div>
  </section>;
}

export function HomeWorkshopDetails() {
  const labs = [
    { enabled: speakingLabEnabled(), mark: "◌", title: "Speaking Lab", text: "6 AI хамтрагч · Дуугаар ярилц · 3 хэсэг", href: "/labs/ielts-speaking" },
    { enabled: writingLabEnabled(), mark: "Aa", title: "Essay Studio", text: "Эссэ · Захидал · AI засвар, үнэлгээ", href: "/labs/ielts-writing" },
    { enabled: listeningLabEnabled(), mark: "≋", title: "Listening Lab", text: "2 тест · Давтаж сонс · Тексттэй харьцуул", href: "/labs/ielts-listening" },
    { enabled: readingLabEnabled(), mark: "¶", title: "Reading Lab", text: "5 текст · 7 төрлийн асуулт · Өөрийн файлаас", href: "/labs/ielts-reading" },
  ].filter(lab => lab.enabled);
  return <section className="section home-workshop-details" id="workshop" aria-labelledby="home-workshop-heading">
    <div className="home-workshop-layout"><div className="home-workshop-photo" data-reveal><Image src={homeArtwork.workshopCover.src} alt={homeArtwork.workshopCover.alt} fill sizes="(max-width: 800px) 100vw, 45vw" /></div><div className="home-workshop-copy" data-reveal><p className="eyebrow">Workshop</p><h2 id="home-workshop-heading">Мэддэг үгээ<br />өөрийн үг болго.</h2><p>Ярьж, бичиж, сонсож, уншиж дад.<br />Чадвар бүрт өөрийн орон зай.</p><div className="home-lab-grid">{labs.map(lab => <Link className="home-lab-card" href={lab.href} key={lab.href} prefetch={false}><span className="home-feature-mark" aria-hidden="true">{lab.mark}</span><div><h3>{lab.title}</h3><p>{lab.text}</p></div><span aria-hidden="true">↗</span></Link>)}</div><Link className="text-link" href="/workspace/workshop">Бүх Workshop-ийг үзэх ↗</Link></div></div>
  </section>;
}

export function HomePlans({ plans }: { plans: Plans }) {
  return <section className="section home-plans" id="plans" aria-labelledby="home-plans-heading">
    <div className="section-heading" data-reveal><h2 id="home-plans-heading">Нэг mock. Эсвэл бүтэн сар.</h2><Link className="text-link" href="/workspace/plans">Багцуудыг харьцуулах ↗</Link></div>
    <div className="home-plan-grid"><article className="home-plan-card" data-program="free" data-reveal><div className="home-plan-top"><span className="subject-symbol" aria-hidden="true">✦</span><span>01 / ҮНЭГҮЙ</span></div><h3>Үнэгүй</h3><p className="home-plan-price"><strong>₮0</strong><span>/ сар</span></p><ul><li>{freeMocks.length} үнэгүй хагас mock: SAT, IELTS, ЭЕШ, JLPT, HSK</li><li>Сар бүр {FREE_MONTHLY_CREDITS} AI кредит</li><li>Үгсийн сан, файлаас шалгалт</li></ul><Link className="button secondary" href="/register">Үнэгүй бүртгүүлэх <span aria-hidden="true">↗</span></Link></article>{plans.map((plan, index) => <article className="home-plan-card" key={plan.program} data-reveal><div className="home-plan-top"><span className="subject-symbol" aria-hidden="true">{plan.symbol}</span><span>0{index + 2} / САРЫН БАГЦ</span></div><h3>{plan.title}</h3><p className="home-plan-price"><strong>₮{plan.amountMnt.toLocaleString("en-US")}</strong><span>/ сар</span></p><ul>{plan.features.slice(0, 3).map(feature => <li key={feature}>{feature}</li>)}</ul><Link className="button secondary" href={"/subscribe/" + plan.program}>Багц сонгох <span aria-hidden="true">↗</span></Link></article>)}</div>
    <div className="home-single-plan" data-reveal><span aria-hidden="true">↗</span><div><h3>Нэг mock-оос эхэлж болно.</h3><p>{totalMocks} mock · Дахин өгөх, цаггүй дадлага багтана.</p></div><strong>{MOCK_PRICE_LABEL}<small>/ нэг mock</small></strong><Link className="text-link" href="/exams">Шалгалт сонгох ↗</Link></div>
    <p className="home-section-note">Туршилтын төлбөр · Бодит мөнгө суутгахгүй · Автоматаар сунгахгүй.</p>
  </section>;
}

const questions = [
  ["Шалгалт ба дадлага ямар ялгаатай вэ?", "Шалгалт хэсэг бүрийн хугацаатай. Дадлагад цаггүй ажиллаж, хариулсныхаа дараа тайлбарыг үзэж болно. Хоёр горимд ижил mock-ийн эрх үйлчилнэ."],
  ["Сарын багц юуг нээх вэ?", "ЭЕШ багц бүх ЭЕШ mock-ийг хязгааргүй нээнэ. Гадаад хэл багцаар SAT, IELTS, JLPT, HSK-ийн mock-оос сар бүр 15-ыг сонгож, тэр сардаа хэдэн ч удаа өгч, дадлага хийнэ; 4 Workshop даалгавар багтана. Үнэгүй бүртгэлд шалгалт бүрийн хагас mock бий."],
  ["AI туслахыг үнэгүй ашиглаж болох уу?", "Баталгаажсан бүртгэл бүр сар бүр 100 AI кредит авна. Сарын багц нэмэлт кредиттэй. Кредитийг тусад нь авч болно: хугацаагүй, AI-д зарцуулагдаж, үгсийн сангийн байнгын багтаамж авна. Хугацаатай шалгалтын үеэр AI хаалттай."],
  ["Хуудсаа хаавал цаг зогсох уу?", "Үгүй. Хугацаатай mock-ийн цаг үргэлжилнэ. Хадгалсан хариугаа үргэлжлүүлж болно; хугацаа дууссан хэсгийг өөрчлөхгүй."],
  ["Багц дуусвал үр дүнгээ үзэж болох уу?", "Болно. Багцтай үед эхэлсэн шалгалтаа үргэлжлүүлж, өмнөх үр дүнгээ үзнэ. Шинээр эхлэхэд хүчинтэй багц эсвэл тухайн mock-ийн эрх хэрэгтэй."],
];

export function HomeQuestions() {
  return <section className="section home-questions" id="questions" aria-labelledby="home-questions-heading"><div className="section-heading" data-reveal><h2 id="home-questions-heading">Түгээмэл асуулт</h2></div><div className="home-question-list">{questions.map(([question, answer]) => <details key={question} data-reveal><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>;
}
