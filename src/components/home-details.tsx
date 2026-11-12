import Image from "next/image";
import Link from "next/link";
import type { Program } from "@/modules/programs/catalog";
import { programs } from "@/modules/programs/catalog";
import { examDefinitions } from "@/modules/exams/definitions";
import { entranceCounts, entranceTotal } from "@/modules/exams/entrance/catalog";
import { jlptMocks } from "@/modules/exams/jlpt/catalog";
import { hskMocks } from "@/modules/exams/hsk/catalog";
import { MOCK_PRICE_LABEL } from "@/modules/exams/pricing";
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

const formats: Record<string, { href: string; artwork: keyof typeof homeArtwork; alt?: string; label: string; summary: string; facts: [string, string][] }> = {
  sat: { href: "/exams/sat", artwork: "stemCover", label: "THINK BIG. START HERE.", summary: "Унших, бичих, математикийн бэлтгэлээ нэгтгэ.", facts: [["Бүтэн mock", String(count("sat"))], ["Асуулт", "98 · 4 модуль"], ["Хугацаа", "2ц 14м + 10м завсарлага"]] },
  ielts: { href: "/exams/ielts", artwork: "languageCover", label: "FIND YOUR OWN VOICE.", summary: "Сонсох, унших, бичих, ярих. Дөрвөн чадвар, нэг зорилго.", facts: [["Бүтэн mock", String(count("ielts"))], ["Listening · Reading", "40 + 40 асуулт"], ["Writing · Speaking", "2 бичвэр · 3 хэсэг"]] },
  entrance: { href: "/exams/eesh", artwork: "studyHero", label: "ЧИНИЙ ДАРААГИЙН ШАТ.", summary: "Математик, физик, хими, биологи, англи хэл. Их сургуулийн эхний алхам.", facts: [["Математик", `${subjectCounts.math} mock · 100 минут`], ["Физик", `${subjectCounts.physics} mock · 100 минут`], ["Хими", `${subjectCounts.chemistry} mock · 100 минут`], ["Биологи", `${subjectCounts.biology} mock · 80 минут`], ["Англи хэл", `${subjectCounts.english} mock · 80 минут`]] },
  jlpt: { href: "/exams/jlpt", artwork: "japaneseCover", label: "A NEW LANGUAGE. A NEW WORLD.", summary: "N5-аас N4 рүү. Япон хэлний сууриа алхам алхмаар.", facts: [["N5", "3 mock · 67 асуулт · 90 минут"], ["N4", "3 mock · 85 асуулт · 115 минут"], ["Сонсгол", "Япон бичлэг · 3 үе шат"]] },
  // No Chinese artwork exists yet; the language photo is reused with a neutral description.
  hsk: { href: "/exams/hsk", artwork: "languageCover", alt: "Чихэвчтэй оюутан хэлний бэлтгэл хийж байна", label: "STEP BY STEP.", summary: "Хятад хэлний анхны алхам. Сонсох, унших, бүх ханз pinyin-тэй.", facts: [["HSK 1", `${hskMocks.length} mock · 40 асуулт · 32 минут`], ["Сонсох", "20 асуулт · 15 минут"], ["Унших", "20 асуулт · 17 минут"]] },
};

export function HomeProgramDetails({ plans }: { plans: Plans }) {
  return <><div className="home-detail-list">{homePrograms.map(program => {
    const format = formats[program.slug], plan = plans.find(item => item.program === program.slug);
    return <article className={"home-program-detail home-program-" + program.slug} id={"program-" + program.slug} key={program.slug} data-reveal>
      <div className="home-program-image"><Image src={homeArtwork[format.artwork].src} alt={format.alt ?? homeArtwork[format.artwork].alt} fill sizes="(max-width: 620px) 100vw, 50vw" /><span>{format.label}</span><i aria-hidden="true">{program.symbol}</i></div>
      <div className="home-program-copy"><header><div><p className="eyebrow">{program.subtitle}</p><h3>{program.slug === "entrance" ? "ЭЕШ · University Prep" : program.title}</h3></div><span className="status">{program.status}</span></header><p className="home-program-summary">{format.summary}</p>
        <details className="home-program-more"><summary>Бүтэц, хугацаа <span aria-hidden="true">+</span></summary><dl>{format.facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><ul className="home-topic-list">{program.topics.map(topic => <li key={topic}>{topic}</li>)}</ul></details>
        <footer><p>{plan ? <><strong>₮{plan.amountMnt.toLocaleString("en-US")}</strong> / сар</> : <><strong>{MOCK_PRICE_LABEL}</strong> / mock <small>{program.title} сарын багцгүй</small></>}</p><Link className="text-link" href={format.href}>Шалгалтууд <span aria-hidden="true">↗</span></Link></footer>
      </div>
    </article>;
  })}</div><p className="home-section-note">Бэлтгэлийн материал · Албан ёсны шалгалт, SAT scaled score, IELTS band эсвэл JLPT, HSK тэнцсэн дүн биш. ЭЕШ, JLPT, HSK материалын багшийн хяналт хүлээгдэж байна.</p></>;
}

const workspaceFeatures = [
  { mark: "◷", title: "Хугацаатай mock", text: "Шалгалтын хэмнэлд дас." },
  { mark: "∞", title: "Цаггүй дадлага", text: "Өөрийн хурдаар ойлго." },
  { mark: "✳", title: "AI туслах", text: "Алдсан алхмаа тайлбарлуул." },
  { mark: "↗", title: "Миний үр дүн", text: "Юугаа давтахаа ол." },
];

const demos = [
  { id: "exam-practice", number: "01", title: "Сонго. Бод. Шалга.", text: "Шалгалтын сангаас цаггүй дадлага хүртэл.", transcript: "Шалгалтын санг нээнэ → SAT mock сонгоно → цаггүй дадлагад хариулна → тайлбарыг шалгана.", href: "/exams", link: "Шалгалтуудыг нээх" },
  { id: "workspace-review", number: "02", title: "Алдаа бүр дараагийн алхам.", text: "Workspace, хадгалсан дүн, асуулт бүрийн тайлбар.", transcript: "Workspace-ийн нүүрийг нээнэ → Review рүү орно → жишээ дансны дууссан mock-ийг нээнэ → асуулт болон тайлбарыг харна. Энэ нь бичлэгт зориулсан туршилтын дүн.", href: "/workspace/review", link: "Workspace нээх" },
  { id: "workshop", number: "03", title: "Өөрийн үгээр илэрхийл.", text: "Speaking хамтрагчаа сонгоод, Essay Studio-д бич.", transcript: "Workshop-ийг нээнэ → Speaking-ийн хамтрагч, хэсгийг сонгоно → Essay Studio-ийн даалгаврыг нээж, жишээ бичвэр бичнэ. AI хариу эсвэл үнэлгээ дуудаагүй.", href: "/workspace/workshop", link: "Workshop нээх" },
];

export function HomeWorkspaceDetails() {
  return <section className="section home-workspace-details" id="workspace" aria-labelledby="home-workspace-heading">
    <div className="section-heading" data-reveal><div><p className="eyebrow">ТАЙЛБАРЛАХААС ИЛҮҮ ХАРУУЛЪЯ</p><h2 id="home-workspace-heading">Бэлтгэл чинь ингэж өрнөнө.</h2></div><p>Бодит сайтын богино бичлэгүүд.<br />Автоматаар давтагдана · Дуугүй.</p></div>
    <div className="home-demo-grid" id="demos">{demos.map(demo => <article className="home-demo-card" key={demo.id} data-reveal><div className="home-demo-heading"><span>{demo.number}</span><h3 id={demo.id + "-heading"}>{demo.title}</h3></div><div className="home-demo-screen"><HomeDemoVideo id={demo.id} /></div><div className="home-demo-footer"><p id={demo.id + "-description"}>{demo.text}</p><Link className="text-link" href={demo.href}>{demo.link} ↗</Link></div><details className="home-demo-transcript"><summary>Бичлэгийн алхмууд</summary><p>{demo.transcript}</p></details></article>)}</div>
    <div className="home-feature-grid">{workspaceFeatures.map(feature => <article key={feature.title} data-reveal><span className="home-feature-mark" aria-hidden="true">{feature.mark}</span><div><h3>{feature.title}</h3><p>{feature.text}</p></div></article>)}</div>
    <p className="home-section-note">Бичлэгүүд жишээ данстай. AI туслах хугацаатай шалгалтын үеэр хаалттай.</p>
  </section>;
}

export function HomeWorkshopDetails() {
  const labs = [
    { enabled: speakingLabEnabled(), mark: "◌", title: "Speaking Lab", text: "AI хамтрагч · Ярианы 3 хэсэг", href: "/labs/ielts-speaking" },
    { enabled: writingLabEnabled(), mark: "Aa", title: "Essay Studio", text: "Эссэ · Захидал · Чөлөөт бичвэр", href: "/labs/ielts-writing" },
    { enabled: listeningLabEnabled(), mark: "≋", title: "Listening Lab", text: "2 тест · Давтаж сонс · Тексттэй харьцуул", href: "/labs/ielts-listening" },
    { enabled: readingLabEnabled(), mark: "¶", title: "Reading Lab", text: "5 текст · 7 төрлийн асуулт · Өөрийн файлаас", href: "/labs/ielts-reading" },
  ].filter(lab => lab.enabled);
  return <section className="section home-workshop-details" id="workshop" aria-labelledby="home-workshop-heading">
    <div className="home-workshop-layout"><div className="home-workshop-photo" data-reveal><Image src={homeArtwork.languageCover.src} alt={homeArtwork.languageCover.alt} fill sizes="(max-width: 800px) 100vw, 45vw" /><span>YOUR WORDS.<br />YOUR WORLD.</span></div><div className="home-workshop-copy" data-reveal><p className="eyebrow">WORKSHOP · ХЭЛНИЙ БЭЛТГЭЛ</p><h2 id="home-workshop-heading">Мэддэг үгээ<br />өөрийн үг болго.</h2><p>Ярьж, бичиж, сонсож, уншиж дад.<br />Чадвар бүрт өөрийн орон зай.</p><div className="home-lab-grid">{labs.map(lab => <Link className="home-lab-card" href={lab.href} key={lab.href} prefetch={false}><span className="home-feature-mark" aria-hidden="true">{lab.mark}</span><div><h3>{lab.title}</h3><p>{lab.text}</p></div><span aria-hidden="true">↗</span></Link>)}</div><Link className="text-link" href="/workspace/workshop">Бүх Workshop-ийг үзэх ↗</Link><details className="home-workshop-more"><summary>Хөтөлсөн даалгавар ба AI үнэлгээний тухай</summary><p>IELTS сарын багцад Writing Task 1, Task 2, Speaking Part 2, Part 3-ын 4 хөтөлсөн даалгавар багтана. Студийн AI зөвлөмж, band нь албан ёсны үнэлгээ биш.</p></details></div></div>
  </section>;
}

export function HomePlans({ plans }: { plans: Plans }) {
  return <section className="section home-plans" id="plans" aria-labelledby="home-plans-heading">
    <div className="section-heading" data-reveal><div><p className="eyebrow">ӨӨРИЙН ХЭМНЭЛД ТААРУУЛ</p><h2 id="home-plans-heading">Нэг mock. Эсвэл бүтэн сар.</h2></div><Link className="text-link" href="/workspace/plans">Багцуудыг харьцуулах ↗</Link></div>
    <div className="home-plan-grid">{plans.map((plan, index) => <article className="home-plan-card" key={plan.program} data-reveal><div className="home-plan-top"><span className="subject-symbol" aria-hidden="true">{plan.symbol}</span><span>0{index + 1} / САРЫН БАГЦ</span></div><h3>{plan.title}</h3><p className="home-plan-price"><strong>₮{plan.amountMnt.toLocaleString("en-US")}</strong><span>/ сар</span></p><ul>{plan.features.slice(0, 3).map(feature => <li key={feature}>{feature}</li>)}</ul><Link className="button secondary" href={"/subscribe/" + plan.program}>Багц сонгох <span aria-hidden="true">↗</span></Link></article>)}</div>
    <div className="home-single-plan" data-reveal><span aria-hidden="true">↗</span><div><h3>Нэг mock-оос эхэлж болно.</h3><p>{totalMocks} mock · Дахин өгөх, цаггүй дадлага багтана.</p></div><strong>{MOCK_PRICE_LABEL}<small>/ нэг mock</small></strong><Link className="text-link" href="/exams">Шалгалт сонгох ↗</Link></div>
    <p className="home-section-note">Туршилтын төлбөр · Бодит мөнгө суутгахгүй · Автоматаар сунгахгүй. Сарын эрх дараагийн сарын ижил өдөр хүртэл; эрт сунгавал үлдсэн хугацаан дээр нэмэгдэнэ.</p>
  </section>;
}

const questions = [
  ["Шалгалт ба дадлага ямар ялгаатай вэ?", "Шалгалт хэсэг бүрийн хугацаатай. Дадлагад цаггүй ажиллаж, хариулсныхаа дараа тайлбарыг үзэж болно. Хоёр горимд ижил mock-ийн эрх үйлчилнэ."],
  ["Сарын багц бүх хөтөлбөрийг нээх үү?", "Багц зөвхөн өөрийн хөтөлбөрийг нээнэ. IELTS багцад 4 хөтөлсөн Workshop даалгавар багтана. JLPT, HSK сарын багцгүй, нэг mock-ийн эрхтэй."],
  ["Хуудсаа хаавал цаг зогсох уу?", "Үгүй. Хугацаатай mock-ийн цаг үргэлжилнэ. Хадгалсан хариугаа үргэлжлүүлж болно; хугацаа дууссан хэсгийг өөрчлөхгүй."],
  ["Багц дуусвал үр дүнгээ үзэж болох уу?", "Болно. Багцтай үед эхэлсэн шалгалтаа үргэлжлүүлж, өмнөх үр дүнгээ үзнэ. Шинээр эхлэхэд хүчинтэй багц эсвэл тухайн mock-ийн эрх хэрэгтэй."],
];

export function HomeQuestions() {
  return <section className="section home-questions" id="questions" aria-labelledby="home-questions-heading"><div className="section-heading" data-reveal><div><p className="eyebrow">МЭДЭХЭД ИЛҮҮДЭХГҮЙ</p><h2 id="home-questions-heading">Эхлэхээсээ өмнө.</h2></div></div><div className="home-question-list">{questions.map(([question, answer]) => <details key={question} data-reveal><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>;
}
