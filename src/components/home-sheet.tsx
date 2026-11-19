import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { pricedPlans } from "@/modules/subscriptions/prices";
import { FREE_MONTHLY_CREDITS } from "@/modules/credits/pricing";
import { MOCK_PRICE_LABEL, MOCK_PURCHASE_DAYS } from "@/modules/exams/pricing";
import { VOCABULARY_LIMITS } from "@/modules/vocabulary/contracts";
import { MY_EXAM_LIMITS } from "@/modules/my-exams/contracts";
import { speakingLabEnabled, writingLabEnabled, listeningLabEnabled, readingLabEnabled } from "@/lib/local-pilot";
import { LawTestRecommendation } from "@/components/lawtest";
import { HomeAtmosphere } from "@/components/home-atmosphere";
import { HomeMotion } from "@/components/home-motion";
import { HomeDemoVideo } from "@/components/home-demo-video";
import { HomeTry, type TryExam } from "@/components/home-try";
import { HOME_ART_STYLE, homeArtwork } from "@/components/home-art";
import { AXIS_MINUTES, clock, freeMockTotal, homeExams, partKinds, totalMocks } from "@/components/home-data";

// Homepage since 2026-11-20 (owner: new layout, no typing headline, more detail; same colours and background).
// The first screen is a sample question to answer; the rest is the exams' real structure, the product films, the
// Workspace, plans by goal and questions. Restore the previous page: artifacts/design-backup-2026-11-20-home/restore.ps1.
type Plans = Awaited<ReturnType<typeof pricedPlans>>;
type Plan = Plans[number];
const mnt = (value: number) => "₮" + value.toLocaleString("en-US");

export async function HomeSheet() {
  const plans = await pricedPlans();
  const tryExams: TryExam[] = homeExams.map(exam => {
    const first = exam.levels[0];
    return { slug: exam.slug, name: exam.name, href: exam.href, free: exam.free, full: `Бүтэн ${exam.levels.length > 1 ? first.name : exam.name}: ${clock(first.minutes)}` };
  });
  return <>
    <HomeAtmosphere variant="orbit" />
    <HomeMotion className={"home-page home-art-" + HOME_ART_STYLE}>
      <section className="home-hero" aria-labelledby="home-hero-title">
        <div className="home-hero-card">
          <div className="home-hero-copy">
            <h1 id="home-hero-title"><span>Жинхэнэ шалгалт шиг.</span> <span>Алдаа бүр тайлбартай.</span></h1>
            <p className="home-hero-lead">SAT, IELTS, TOEFL, ЭЕШ, JLPT, HSK, TOPIK-ийн {totalMocks} бүтэн mock. Хэсэг бүр өөрийн цагтай; дуусахад асуулт бүрийн тайлбар, AI багш нээгдэнэ.</p>
            <div className="home-hero-actions"><Link className="button" href="/workspace">Бэлтгэлээ эхлэх</Link><Link className="home-hero-watch" href="#demos"><span aria-hidden="true">▶</span>Хэрхэн ажилладгийг харах</Link></div>
            <ul className="home-hero-free" aria-label="Үнэгүй бүртгэлд">
              <li><strong>{freeMockTotal}</strong>үнэгүй хагас mock</li>
              <li><strong>{FREE_MONTHLY_CREDITS}</strong>AI кредит сар бүр</li>
              <li><strong>{homeExams.length}</strong>шалгалт нэг Workspace-д</li>
            </ul>
          </div>
          <HomeTry exams={tryExams} />
          <nav className="launch-panel" aria-label="Шалгалтууд">{homeExams.map(exam => <Link key={exam.slug} href={exam.href}><span className="home-launch-symbol" aria-hidden="true">{exam.symbol}</span><strong>{exam.name}</strong><small>{exam.mocks} mock</small></Link>)}</nav>
        </div>
      </section>

      <section className="home-structure" id="programs" aria-labelledby="programs-heading">
        <header className="home-head"><h2 id="programs-heading">Шалгалт бүрийн бүтэц</h2><p>Хэсэг бүрийн хугацаа, дараалал жинхэнэ шалгалтынхтай ижил. Mock бүрийг цагтай эсвэл цаггүй дадлагаар өгнө.</p></header>
        <div className="home-chart">
          <div className="home-chart-axis" aria-hidden="true"><span /><span className="home-axis-ticks">{[0, 30, 60, 90, 120, 150, 180].map(minute => <i key={minute} style={{ left: (minute / AXIS_MINUTES) * 100 + "%" }}>{minute === 180 ? "180 мин" : minute}</i>)}</span><span /></div>
          {homeExams.map(exam => <article className="home-exam" id={"program-" + exam.program} key={exam.slug} data-reveal>
            <Link className="home-exam-name" href={exam.href}><span className="home-exam-symbol" aria-hidden="true">{exam.symbol}</span><span><strong>{exam.name}</strong><small>{exam.who}</small></span></Link>
            <div className="home-exam-levels">{exam.levels.map(level => <div className="home-level" key={level.name}>
              <span className="home-level-name">{level.name}</span>
              <ol className="home-bar" aria-label={`${exam.name} ${level.name}, нийт ${clock(level.minutes)}`}>{level.parts.map((part, index) => <li key={index} data-kind={part.kind} data-tight={part.minutes < 15 || undefined} style={{ "--w": (part.minutes / AXIS_MINUTES) * 100 + "%" } as CSSProperties} title={`${part.label}, ${part.minutes} мин`}><span>{part.label}</span><span className="sr-only">, {part.minutes} минут</span></li>)}</ol>
              <span className="home-level-time">{clock(level.minutes)}</span>
              <p className="home-level-detail">{level.detail}</p>
            </div>)}</div>
            <p className="home-exam-count"><strong>{exam.mocks}</strong> бүтэн mock{exam.free ? <small>{exam.free} үнэгүй хагас mock</small> : null}</p>
          </article>)}
        </div>
        <ul className="home-legend" aria-label="Өнгөний тайлбар">{partKinds.map(item => <li key={item.kind} data-kind={item.kind}><i aria-hidden="true" />{item.label}</li>)}</ul>
        <p className="home-note">Бүх даалгаврыг энэ сайтад зориулж зохиосон бэлтгэлийн материал: College Board, IELTS, ETS, JLPT, HSK, TOPIK, БҮТ-ийн албан материал биш, албан оноо, band тооцохгүй. Ихэнх нь багшийн хяналт хүлээж байна.</p>
      </section>

      <HomeFilms />
      <HomeTools />
      <HomePlans plans={plans} />
      <HomeQuestions />

      <section className="home-close" aria-labelledby="home-close-title" data-reveal>
        <div><h2 id="home-close-title">Эхний mock-оо өнөөдөр өг.</h2><p>Бүртгэл үнэгүй. {freeMockTotal} хагас mock, сар бүр {FREE_MONTHLY_CREDITS} AI кредит шууд нээгдэнэ.</p></div>
        <div className="home-close-actions"><Link className="button" href="/register">Үнэгүй бүртгүүлэх</Link><Link className="home-close-link" href="/workspace">Workspace нээх</Link></div>
      </section>
      <div data-reveal><LawTestRecommendation /></div>
    </HomeMotion>
  </>;
}

// The three product films, in the order a student meets them. Steps are the films' own captions (docs/HOMEPAGE_MEDIA.md).
const films = [
  { id: "exam-practice", title: "Шалгалтаа өг, эсвэл цаггүй бод.", text: "Mock бүр хоёр горимтой: цагтай шалгалт, эсвэл хариулт бүрийг шууд шалгадаг дадлага.", steps: ["Шалгалтаа сонго", "Бүтэн mock-оо нээ", "Дадлагын горим: цаггүй", "Хариулаад шууд шалга", "Алдаа бүр тайлбартай"], transcript: "Шалгалтын санг нээнэ → SAT mock сонгоно → цаггүй дадлагад хариулна → тайлбарыг шалгана.", href: "/exams", link: "Шалгалтуудыг нээх" },
  { id: "workspace-review", title: "Дүнгээ задал.", text: "Өгсөн mock бүр Workspace-д хадгалагдана: оноо, сул чадвар, асуулт бүрийн тайлбар, AI багш.", steps: ["Бүх бэлтгэл нэг дор", "Өгсөн шалгалтаа нээ", "Оноо, сул чадвараа хар", "Асуулт бүр тайлбартай"], transcript: "Workspace-ийн нүүрийг нээнэ → Review рүү орно → жишээ дансны дууссан mock-ийг нээнэ → асуулт болон тайлбарыг харна. Энэ нь бичлэгт зориулсан туршилтын дүн.", href: "/workspace/review", link: "Миний үр дүн" },
  { id: "workshop", title: "Чадвар бүрээ тусад нь дад.", text: "Сул хэсгээ Workshop-д давт: AI хамтрагчтай ярь, эссэгээ засуул, сонсголоо дахин сонс.", steps: ["Workshop: дөрвөн чадвар", "Speaking: AI хамтрагчаа сонго", "Writing: бичээд зөвлөгөө ав", "Listening: таван бүрэн тест"], transcript: "Workshop-ийг нээнэ → Speaking-ийн хамтрагч, хэсгийг сонгоно → Essay Studio-ийн даалгаврыг нээж, жишээ бичвэр бичнэ. AI хариу эсвэл үнэлгээ дуудаагүй.", href: "/workspace/workshop", link: "Workshop нээх" },
];

function HomeFilms() {
  return <section className="home-films" id="demos" aria-labelledby="home-films-heading">
    <header className="home-head"><h2 id="home-films-heading">Mock-оос дараагийн алхам хүртэл</h2><p>Бичлэг бүр сайтын жинхэнэ дэлгэцээс бүтсэн, дуугүй тоглоно.</p></header>
    <ol className="home-film-list">{films.map((film, index) => <li className="home-film" key={film.id} data-reveal>
      <div className="home-film-copy">
        <span className="home-film-number" aria-hidden="true">{index + 1}</span>
        <h3 id={film.id + "-heading"}>{film.title}</h3>
        <p id={film.id + "-description"}>{film.text}</p>
        <ol className="home-film-steps">{film.steps.map(step => <li key={step}>{step}</li>)}</ol>
        <Link className="text-link" href={film.href}>{film.link}</Link>
      </div>
      <div className="home-demo-screen"><HomeDemoVideo id={film.id} /></div>
      <p className="sr-only">Бичлэгийн алхмууд: {film.transcript}</p>
    </li>)}</ol>
  </section>;
}

const tools = [
  { mark: "✳", title: "AI туслах", text: "Бодлого, эссэ, үгээ асуу; зургаар ч болно. Цагтай шалгалтын үеэр хаалттай." },
  { mark: "Aa", title: "Үгсийн сан", text: "Файлаас үг ялгаж, Leitner давталт, quiz-ээр цээжил." },
  { mark: "▤", title: "Файлаас шалгалт", text: "PDF, Word эсвэл хуудасны зургаас 5–40 асуулттай шалгалт." },
  { mark: "↗", title: "Миний үр дүн", text: "Өгсөн mock бүрийн оноо, сул чадвар, асуулт бүрийн тайлбар." },
  { mark: "◷", title: "Хянах самбар", text: "Шалгалтын өдрөө тоолж, өдөр бүрийн ажлаа төлөвлө." },
  { mark: "◉", title: "Мэдэгдэл", text: "Худалдан авалт, багцын сануулга, зарлал нэг дор." },
];

function HomeTools() {
  const labs = [
    { enabled: speakingLabEnabled(), mark: "◌", title: "Speaking Lab", text: "AI хамтрагчтай дуугаар ярилц: IELTS-ийн 3 хэсэг, TOEFL-ийн Interview", href: "/labs/ielts-speaking" },
    { enabled: writingLabEnabled(), mark: "Aa", title: "Essay Studio", text: "IELTS, TOEFL-ийн эссэ, захидал; AI засвар, үнэлгээ", href: "/labs/ielts-writing" },
    { enabled: listeningLabEnabled(), mark: "≋", title: "Listening Lab", text: "5 бүрэн тест, mock-уудын сонсгол, тексттэй харьцуул", href: "/labs/ielts-listening" },
    { enabled: readingLabEnabled(), mark: "¶", title: "Reading Lab", text: "5 текст, 7 төрлийн асуулт, өөрийн материалаас дасгал", href: "/labs/ielts-reading" },
    { enabled: true, mark: "∑", title: "ЭЕШ Workshop", text: "Сэдэв бүрийн оноо, давтагддаг сэдэв, 2027 оны таамаглал", href: "/workspace/workshop?exam=eesh" },
    { enabled: true, mark: "あ", title: "Ази хэлний Workshop", text: "JLPT, HSK, TOPIK-ийн үгс, кана, pinyin, хангыль, унших", href: "/workspace/workshop?exam=jlpt" },
  ].filter(lab => lab.enabled);
  return <section className="home-tools" id="workspace" aria-labelledby="home-tools-heading">
    <div className="home-workshop-photo" data-reveal><Image src={homeArtwork.workshopCover.src} alt={homeArtwork.workshopCover.alt} fill sizes="(max-width: 860px) 100vw, 40vw" /></div>
    <div className="home-tools-copy">
      <h2 id="home-tools-heading">Workspace: бэлтгэлийн бүх хэрэгсэл нэг дор</h2>
      <p className="home-tools-lead">Нэвтэрсний дараа mock, AI туслах, үгсийн сан, үр дүн чинь нэг цонхонд байна.</p>
      <ul className="home-tool-list">{tools.map(tool => <li key={tool.title}><span className="home-tool-mark" aria-hidden="true">{tool.mark}</span><div><h3>{tool.title}</h3><p>{tool.text}</p></div></li>)}</ul>
      <h3 className="home-tools-sub" id="workshop">Workshop</h3>
      <div className="home-lab-grid">{labs.map(lab => <Link className="home-lab-card" href={lab.href} key={lab.href} prefetch={false}><span className="home-tool-mark" aria-hidden="true">{lab.mark}</span><span><strong>{lab.title}</strong><small>{lab.text}</small></span></Link>)}</div>
    </div>
  </section>;
}

function PlanRow({ plan }: { plan: Plan }) {
  return <div className="home-plan" data-program={plan.program}>
    <h4 className="home-plan-name">{plan.title}</h4>
    <p className="home-plan-price">{plan.onSale ? <s aria-label="Энгийн үнэ">{mnt(plan.regularMnt)}</s> : null}<strong>{mnt(plan.amountMnt)}</strong><span>/ сар</span></p>
    <Link className="home-plan-link" href={"/subscribe/" + plan.program}>Сонгох<span className="sr-only">: {plan.title}</span></Link>
  </div>;
}

function HomePlans({ plans }: { plans: Plans }) {
  const pick = (...programs: string[]) => programs.map(program => plans.find(plan => plan.program === program)).filter((plan): plan is Plan => Boolean(plan));
  const entrance = homeExams.find(exam => exam.program === "entrance");
  const mocksOf = (...programs: string[]) => homeExams.filter(exam => programs.includes(exam.program)).reduce((total, exam) => total + exam.mocks, 0);
  const paths = [
    { goal: "Монголын их сургууль", art: homeArtwork.eeshCover, exams: ["ЭЕШ"], text: `Математик, физик, хими, биологи, англи хэлний ${entrance?.mocks ?? 0} mock. Сэдэв бүрийн оноо, таамаглалтай ЭЕШ Workshop.`, plans: pick("entrance") },
    { goal: "Гадаадын их сургууль", art: homeArtwork.languageCover, exams: ["SAT", "IELTS", "TOEFL"], text: `SAT, IELTS, TOEFL-ийн ${mocksOf("sat", "ielts", "toefl")} mock, IELTS ба TOEFL-ийн Workshop. Pro-д AI кредит, багтаамж илүү.`, plans: pick("english_basic", "english_pro") },
    { goal: "Ази хэл", art: homeArtwork.japaneseCover, exams: ["JLPT", "HSK", "TOPIK"], text: `JLPT, HSK, TOPIK-ийн ${mocksOf("jlpt", "hsk", "topik")} mock, үгийн сан, кана, pinyin, хангыль, унших, бичих Workshop.`, plans: pick("asian_basic", "asian_pro") },
  ];
  const ordered = pick("entrance", "english_basic", "english_pro", "asian_basic", "asian_pro");
  const cell = (value: number) => value ? value.toLocaleString("en-US") : "—";
  const rows: [string, string, (plan: Plan) => string][] = [
    ["Сарын үнэ", "₮0", plan => mnt(plan.amountMnt)],
    ["Нээх mock", `${freeMockTotal} хагас mock`, plan => plan.program === "entrance" ? `${entrance?.mocks ?? 0} ЭЕШ mock` : plan.program.startsWith("english") ? "SAT, IELTS, TOEFL" : "JLPT, HSK, TOPIK"],
    ["AI кредит, сар бүр", cell(FREE_MONTHLY_CREDITS), plan => cell(FREE_MONTHLY_CREDITS + plan.aiCredits)],
    ["Үгсийн сан, үг", cell(VOCABULARY_LIMITS.freeWords), plan => cell(plan.vocabularyWords)],
    ["Файлаас шалгалт хадгалах", cell(MY_EXAM_LIMITS.freeExams), plan => cell(plan.savedExams)],
    ["Шинжээчийн эссэ үнэлгээ, сард", "—", plan => cell(plan.expertReviews)],
  ];
  return <section className="home-paths" id="plans" aria-labelledby="home-plans-heading">
    <header className="home-head"><h2 id="home-plans-heading">Зорилгоосоо эхэл</h2><p>Сарын багц тухайн зорилгын бүх mock-ийг хязгааргүй нээнэ. Эсвэл нэг mock-оор эхэл.</p></header>
    <div className="home-path-grid">{paths.map(path => <article className="home-path" key={path.goal} data-reveal>
      <div className="home-path-photo"><Image src={path.art.src} alt={path.art.alt} fill sizes="(max-width: 860px) 100vw, 33vw" /></div>
      <div className="home-path-body">
        <ul className="home-path-exams" aria-label="Шалгалтууд">{path.exams.map(name => <li key={name}>{name}</li>)}</ul>
        <h3>{path.goal}</h3>
        <p>{path.text}</p>
        <div className="home-path-plans">{path.plans.map(plan => <PlanRow plan={plan} key={plan.program} />)}</div>
      </div>
    </article>)}</div>
    <div className="home-plan-extra">
      <div className="home-plan" data-program="free"><h4 className="home-plan-name">Үнэгүй</h4><p className="home-plan-price"><strong>₮0</strong><span>/ сар</span></p><p className="home-plan-what">{freeMockTotal} хагас mock, сар бүр {FREE_MONTHLY_CREDITS} AI кредит, үгсийн сан, файлаас шалгалт</p><Link className="home-plan-link" href="/register">Бүртгүүлэх</Link></div>
      <div className="home-plan" data-program="single"><h4 className="home-plan-name">Нэг mock</h4><p className="home-plan-price"><strong>{MOCK_PRICE_LABEL}</strong><span>/ {MOCK_PURCHASE_DAYS} хоног</span></p><p className="home-plan-what">Дурын нэг mock: дахин өгөх, цаггүй дадлага багтана</p><Link className="home-plan-link" href="/exams">Шалгалт сонгох</Link></div>
    </div>
    <details className="home-compare">
      <summary>Багцуудын хязгаарыг харьцуулах<span aria-hidden="true">+</span></summary>
      <div className="home-compare-scroll"><table>
        <thead><tr><th scope="col"><span className="sr-only">Багц</span></th><th scope="col">Үнэгүй</th>{ordered.map(plan => <th scope="col" key={plan.program}>{plan.title}</th>)}</tr></thead>
        <tbody>{rows.map(([label, free, value]) => <tr key={label}><th scope="row">{label}</th><td>{free}</td>{ordered.map(plan => <td key={plan.program}>{value(plan)}</td>)}</tr>)}</tbody>
      </table></div>
    </details>
    <p className="home-note">Туршилтын төлбөр: бодит мөнгө суутгахгүй, автоматаар сунгахгүй.</p>
  </section>;
}

const questions = [
  ["Шалгалт ба дадлага ямар ялгаатай вэ?", "Шалгалт хэсэг бүрийн хугацаатай. Дадлагад цаггүй ажиллаж, хариулсныхаа дараа тайлбарыг үзэж болно. Хоёр горимд ижил mock-ийн эрх үйлчилнэ."],
  ["Үнэгүй бүртгэлд юу багтах вэ?", `SAT, IELTS, ЭЕШ (хичээл бүрт), JLPT N5, N4, HSK 1-ийн ${freeMockTotal} хагас mock, сар бүр ${FREE_MONTHLY_CREDITS} AI кредит, үгсийн сан, файлаас шалгалт. TOEFL, TOPIK-д одоогоор үнэгүй mock байхгүй.`],
  ["Сарын багц юуг нээх вэ?", "ЭЕШ багц бүх ЭЕШ mock-ийг хязгааргүй нээнэ. Англи хэл Basic, Pro багц SAT, IELTS, TOEFL-ийн бүх mock, IELTS ба TOEFL workshop-ийг; Ази хэл Basic, Pro багц JLPT, HSK, TOPIK-ийн бүх mock, тэдгээрийн workshop-ийг хязгааргүй нээнэ; Pro нь AI кредит, үгсийн сан, файлаас шалгалтын багтаамж илүү. Нэг mock-ийг тусад нь авбал 7 хоногийн турш нээлттэй."],
  ["Оноо маань албан ёсны оноотой ижил үү?", "Үгүй. Mock зөв хариултын тоо, хэсэг бүрийн оноог харуулна; SAT scaled score, албан band тооцохгүй. IELTS, TOEFL-ийн Writing, Speaking-ийг AI шалгалтын дараа үнэлдэг бөгөөд энэ нь дадлагын тооцоо."],
  ["AI туслахыг үнэгүй ашиглаж болох уу?", "Баталгаажсан бүртгэл бүр сар бүр 100 AI кредит авна. Сарын багц нэмэлт кредиттэй. Кредитийг тусад нь авч болно: хугацаагүй, AI-д зарцуулагдаж, үгсийн сангийн байнгын багтаамж авна. Хугацаатай шалгалтын үеэр AI хаалттай."],
  ["Хуудсаа хаавал цаг зогсох уу?", "Үгүй. Хугацаатай mock-ийн цаг үргэлжилнэ. Хадгалсан хариугаа үргэлжлүүлж болно; хугацаа дууссан хэсгийг өөрчлөхгүй."],
  ["Багц дуусвал үр дүнгээ үзэж болох уу?", "Болно. Багцтай үед эхэлсэн шалгалтаа үргэлжлүүлж, өмнөх үр дүнгээ үзнэ. Шинээр эхлэхэд хүчинтэй багц эсвэл тухайн mock-ийн эрх хэрэгтэй."],
];

function HomeQuestions() {
  return <section className="home-faq" id="questions" aria-labelledby="home-questions-heading">
    <header className="home-head"><h2 id="home-questions-heading">Түгээмэл асуулт</h2></header>
    <div className="home-question-list">{questions.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div>
  </section>;
}
