// What the dashboard tells a student about the real exam they set as a goal: structure, timing, scoring, dates,
// published statistics and tips. Pure and client-safe. Facts were checked against the organisers' pages and
// reports in November 2026 (sources are named on each card); figures the organisers do not publish are left out.
import { mnDate, nextJlptDay } from "./dates.ts";
import type { GoalExam } from "./exams.ts";

export const INFO_CHECKED = "2026 оны 11-р сар";

export type InfoPart = { name: string; native?: string; items?: string; minutes: string; detail: string };
export type InfoStat = { value: string; label: string };
export type ExamInfo = {
  title: string; organizer: string; summary: string;
  parts: InfoPart[]; totalTime: string; totalItems?: string;
  scale: string; pass?: string; scoring: string[];
  facts: { label: string; value: string }[];
  stats: { title: string; items: InfoStat[]; note?: string; source?: string };
  tips: string[];
  /** A caveat shown above the structure, when the organiser is changing the format. */
  note?: string;
  links: { label: string; href: string }[];
};

// ---------------------------------------------------------------- SAT

const sat = (): ExamInfo => ({
  title: "Digital SAT",
  organizer: "College Board (АНУ)",
  summary: "АНУ болон дэлхийн олон их сургууль элсэлтэд ашигладаг шалгалт. Bluebook аппаар бүрэн цахимаар өгнө; хэсэг бүр хоёр модультай бөгөөд 2-р модулийн хүндрэл 1-р модулийн гүйцэтгэлээс хамаарна.",
  parts: [
    { name: "Reading and Writing", items: "54 (2 × 27)", minutes: "64 (2 × 32)", detail: "Богино текст бүрт нэг асуулт: үгийн утга, текстийн бүтэц, нотолгоо, дүрэм, цэг таслал." },
    { name: "Завсарлага", minutes: "10", detail: "Хоёр хэсгийн хооронд." },
    { name: "Math", items: "44 (2 × 22)", minutes: "70 (2 × 35)", detail: "Алгебр, ахисан математик, өгөгдөл ба статистик, геометр, тригонометр. Desmos тооны машин бүх модульд." },
  ],
  totalTime: "2 ц 14 мин + 10 мин завсарлага", totalItems: "98",
  scale: "400–1600 (хэсэг бүр 200–800)",
  scoring: [
    "Буруу хариултад оноо хасахгүй — хоосон бүү орхи.",
    "Хэсэг бүрийн 4 асуулт нь туршилтынх, оноонд орохгүй; аль нь болохыг мэдэгдэхгүй.",
    "2-р модулийн хүнд эсвэл хялбар хувилбарыг 1-р модулийн үр дүнгээр сонгоно.",
  ],
  facts: [
    { label: "Хэлбэр", value: "Шалгалтын төвд, Bluebook суулгасан зөөврийн компьютер эсвэл таблетаар" },
    { label: "Олон улсын товууд", value: "Жилд 7 удаа: 3, 5, 6, 8, 10, 11, 12-р сар" },
    { label: "Давтан өгөх", value: "Болно; олон сургууль хэсэг бүрийн хамгийн өндөр оноог тооцдог (superscore)" },
  ],
  stats: {
    title: "2025 оны төгсөгчид (АНУ)",
    items: [
      { value: "2,004,965", label: "шалгуулагч" },
      { value: "1029", label: "дундаж нийт оноо" },
      { value: "521 / 508", label: "дундаж RW / Math" },
      { value: "531 / 528", label: "2019 оны дундаж RW / Math" },
    ],
    source: "College Board, SAT Suite Annual Report 2025",
  },
  tips: [
    "Цаг: Reading and Writing-д асуулт бүрт ≈71 сек, Math-д ≈95 сек.",
    "1-р модульд анхаарал хандуул — 2-р модулийн түвшин түүнээс шалтгаална.",
    "Desmos-ыг урьдчилан дадлагажуул: систем тэгшитгэл, график, квадрат функц.",
    "Bluebook-ийн албан practice тестүүдийг шалгалтын өмнө ажилла.",
  ],
  links: [{ label: "satsuite.collegeboard.org", href: "https://satsuite.collegeboard.org/sat" }],
});

// ---------------------------------------------------------------- IELTS

const ielts = (level: string): ExamInfo => {
  const general = level === "general";
  return {
    title: general ? "IELTS General Training" : "IELTS Academic",
    organizer: "British Council, IDP IELTS, Cambridge University Press & Assessment",
    summary: general
      ? "Цагаачлал, ажил, дунд боловсролын зорилгоор өгдөг хувилбар. Listening, Speaking нь Academic-тай ижил; Reading, Writing нь өдөр тутмын болон ажлын сэдэвтэй."
      : "Их сургууль, магистрт элсэх, мэргэжлийн бүртгэлд шаардагддаг англи хэлний шалгалт. Дөрвөн чадварыг тус бүрд нь 0–9 band-аар үнэлнэ.",
    parts: [
      { name: "Listening", items: "40 · 4 хэсэг", minutes: "≈30", detail: "Харилцан яриа, монолог, академик лекц. Цаасан хувилбарт +10 мин хуулах хугацаа, компьютерт 2 мин шалгах хугацаа." },
      { name: "Reading", items: "40 · 3 хэсэг", minutes: "60", detail: general ? "Зар, гарын авлага, ажлын баримт бичиг, төгсгөлд нь нэг урт текст. Нэмэлт хуулах хугацаа байхгүй." : "Ном, сэтгүүл, сониноос авсан гурван урт текст. Нэмэлт хуулах хугацаа байхгүй." },
      { name: "Writing", items: "2 даалгавар", minutes: "60", detail: general ? "Task 1: захидал (≥150 үг). Task 2: эссэ (≥250 үг); Task 2 хоёр дахин их жинтэй." : "Task 1: график, хүснэгт, процесс тайлбарлах (≥150 үг). Task 2: эссэ (≥250 үг); Task 2 хоёр дахин их жинтэй." },
      { name: "Speaking", items: "3 хэсэг", minutes: "11–14", detail: "Шалгагчтай нүүр тулан: танилцах асуултууд, 1 мин бэлтгэлтэй 2 минутын илтгэл, хэлэлцүүлэг." },
    ],
    totalTime: "≈2 ц 45 мин", totalItems: "80 асуулт + 2 бичлэг + ярилцлага",
    scale: "0–9 band, 0.5 алхамтай",
    scoring: [
      "Нийт band = 4 чадварын дундаж, ойрын 0.5 руу тоймлоно (6.25 → 6.5, 6.75 → 7.0).",
      "Writing: Task Achievement/Response, Coherence and Cohesion, Lexical Resource, Grammatical Range and Accuracy.",
      "Speaking: Fluency and Coherence, Lexical Resource, Grammatical Range and Accuracy, Pronunciation.",
      general
        ? "Ойролцоо хөрвүүлэлт: Listening 30/40 ≈ 7.0, 23/40 ≈ 6.0; General Reading-д илүү олон зөв хэрэгтэй: 34/40 ≈ 7.0, 30/40 ≈ 6.0."
        : "Ойролцоо хөрвүүлэлт: Listening 30/40 ≈ 7.0, 23/40 ≈ 6.0; Academic Reading 30/40 ≈ 7.0, 23/40 ≈ 6.0 (тест бүрт бага зэрэг өөр).",
    ],
    facts: [
      { label: "Хэлбэр", value: "Компьютер эсвэл цаасаар; Speaking үргэлж шалгагчтай" },
      { label: "Дүн", value: "Компьютерээр 1–5 хоногт, цаасаар 13 хоногт" },
      { label: "Хүчинтэй", value: "Ихэнх байгууллага 2 жил хүлээн авна" },
      { label: "Давтан өгөх", value: "Хязгааргүй; зарим төвд нэг чадварыг дахин өгөх (One Skill Retake) боломжтой" },
    ],
    stats: {
      title: "Дэлхийн дундаж, 2024–2025",
      items: [
        { value: "6.45", label: "Listening" },
        { value: "6.32", label: "Academic Reading" },
        { value: "6.05", label: "General Reading" },
      ],
      source: "ielts.org, Test statistics 2024–2025",
    },
    tips: [
      "Listening-д хариултыг сонссон даруйдаа бич; зөв бичиглэл, ганц/олон тоо оноонд нөлөөлнө.",
      "Reading-д асуулт бүрт ≈1.5 мин; True/False/Not Given-д зөвхөн текстэд бичигдсэнийг үнэл.",
      "Writing-д Task 1-д 20 мин, Task 2-т 40 мин; үгийн доод хязгаараас бүү дутаа.",
      "Speaking Part 2-ын 1 минутад 3–4 гол санаагаа тэмдэглэ.",
    ],
    links: [{ label: "ielts.org", href: "https://ielts.org" }],
  };
};

// ---------------------------------------------------------------- TOEFL

const toefl = (): ExamInfo => ({
  title: "TOEFL iBT (2026 формат)",
  organizer: "ETS (АНУ)",
  summary: "2026 оны 1-р сарын 21-нээс шинэ формат: ≈1.5 цаг, Reading ба Listening нь дасан зохицох модультай, оноо 1–6 шатлалаар.",
  parts: [
    { name: "Reading", items: "≈50", minutes: "≈30", detail: "Complete the Words, Read in Daily Life, Read an Academic Passage." },
    { name: "Listening", items: "≈47", minutes: "≈29", detail: "Listen and Choose a Response, Conversation, Announcement, Academic Talk." },
    { name: "Writing", items: "12", minutes: "≈23", detail: "Build a Sentence (10), Write an Email, Academic Discussion." },
    { name: "Speaking", items: "11", minutes: "≈8", detail: "Listen and Repeat (7), Take an Interview (4)." },
  ],
  totalTime: "≈1.5 цаг", totalItems: "≈120",
  scale: "Хэсэг бүр 1–6 (0.5 алхамтай); нийт оноо нь 4 хэсгийн дундаж",
  scoring: [
    "Тайланд CEFR түвшин (A1–C2) хамт гарна.",
    "2028 оны 1-р сар хүртэлх шилжилтийн хугацаанд хуучин 0–120 шкалтай дүйцэх оноог мөн гаргана.",
    "Reading, Listening-ийн 2-р модуль 1-р модулийн гүйцэтгэлээр хүнд эсвэл хялбар болно.",
  ],
  facts: [
    { label: "Хэлбэр", value: "Шалгалтын төвд эсвэл гэрээсээ (Home Edition)" },
    { label: "Дүн", value: "72 цагийн дотор" },
    { label: "Хүчинтэй", value: "2 жил" },
  ],
  stats: { title: "Статистик", items: [], note: "Шинэ форматын дэлхийн дундаж оноог ETS хараахан нийтлээгүй байна." },
  tips: [
    "Build a Sentence: үйл үг, туслах үгээ эхэлж олоод өгүүлбэрээ угсар.",
    "Email-д даалгаврын бүх шаардлагад хариул; эелдэг эхлэл, төгсгөлтэй бич.",
    "Listen and Repeat-д өгүүлбэрийг утгын хэсгээр нь санаж, хэмнэлийг нь давт.",
    "Interview-ийн хариулт бүрт 45 сек: санаа, жишээ, дүгнэлт.",
  ],
  links: [{ label: "ets.org/toefl", href: "https://www.ets.org/toefl.html" }],
});

// ---------------------------------------------------------------- JLPT

type JlptLevel = "n5" | "n4" | "n3" | "n2" | "n1";
const JLPT: Record<JlptLevel, { summary: string; parts: [string, string, number][]; total: number; pass: number; words: string; examinees: string; certified: string; rate: string }> = {
  n5: { summary: "Хамгийн суурь түвшин: хирагана, катакана, үндсэн ханз, энгийн өгүүлбэр, удаан ярьсныг ойлгох.",
    parts: [["言語知識（文字・語彙）", "Үсэг, үгсийн сан", 20], ["言語知識（文法）・読解", "Дүрэм, унших", 40], ["聴解", "Сонсох", 30]], total: 90, pass: 80,
    words: "≈800 үг, ≈100 ханз", examinees: "79,483", certified: "39,925", rate: "50.2%" },
  n4: { summary: "Суурь япон хэл: өдөр тутмын сэдвээр бичсэнийг уншиж, удаан ярьсныг ойлгох.",
    parts: [["言語知識（文字・語彙）", "Үсэг, үгсийн сан", 25], ["言語知識（文法）・読解", "Дүрэм, унших", 55], ["聴解", "Сонсох", 35]], total: 115, pass: 90,
    words: "≈1,500 үг, ≈300 ханз", examinees: "194,015", certified: "67,054", rate: "34.6%" },
  n3: { summary: "Дунд түвшин: өдөр тутмын нөхцөлд бараг хэвийн хурдтай ярьсныг ойлгох, сонины гарчиг унших.",
    parts: [["言語知識（文字・語彙）", "Үсэг, үгсийн сан", 30], ["言語知識（文法）・読解", "Дүрэм, унших", 70], ["聴解", "Сонсох", 40]], total: 140, pass: 95,
    words: "≈3,750 үг, ≈650 ханз", examinees: "249,389", certified: "77,767", rate: "31.2%" },
  n2: { summary: "Ахисан дунд түвшин: өдөр тутам болон өргөн сэдвээр ойлгох; Японд ажил, сургуульд түгээмэл шаардлага.",
    parts: [["言語知識（文字・語彙・文法）・読解", "Үсэг, үг, дүрэм, унших", 105], ["聴解", "Сонсох", 50]], total: 155, pass: 90,
    words: "≈6,000 үг, ≈1,000 ханз", examinees: "232,364", certified: "76,712", rate: "33.0%" },
  n1: { summary: "Хамгийн дээд түвшин: сонин, нийтлэл, лекц, хэвийн хурдтай ярианы нарийн утгыг ойлгох.",
    parts: [["言語知識（文字・語彙・文法）・読解", "Үсэг, үг, дүрэм, унших", 110], ["聴解", "Сонсох", 55]], total: 165, pass: 100,
    words: "≈10,000 үг, ≈2,000 ханз", examinees: "121,233", certified: "36,124", rate: "29.8%" },
};

const jlpt = (level: string, today: string): ExamInfo => {
  const key = (level in JLPT ? level : "n5") as JlptLevel;
  const data = JLPT[key];
  const basic = key === "n5" || key === "n4";
  const next = nextJlptDay(today);
  return {
    title: "JLPT " + key.toUpperCase(),
    organizer: "Japan Foundation, JEES (Япон)",
    summary: data.summary,
    parts: data.parts.map(([native, name, minutes]) => ({ name, native, minutes: String(minutes), detail: "" })),
    totalTime: `${data.total} мин`,
    scale: basic ? "0–180: 言語知識・読解 0–120, 聴解 0–60" : "0–180: 言語知識 0–60, 読解 0–60, 聴解 0–60",
    pass: basic ? `Нийт ≥${data.pass}; 言語知識・読解 ≥38, 聴解 ≥19` : `Нийт ≥${data.pass}; хэсэг бүр ≥19`,
    scoring: [
      "Оноо нь шкалчилсан (scaled) оноо — зөв хариултын тоо биш.",
      "Нийт оноо хүрсэн ч аль нэг хэсэгт босгоос доош бол тэнцэхгүй.",
      "Бүх асуулт сонгох хариулттай; буруу хариултад оноо хасахгүй.",
    ],
    facts: [
      { label: "Хэзээ", value: "Жилд 2 удаа: 7, 12-р сарын эхний Ням гараг (зарим хотод зөвхөн нэг удаа)" },
      { label: "Дараагийн шалгалт", value: mnDate(next, true) },
      { label: "Дүн", value: "Шалгалтаас ≈2 сарын дараа" },
      { label: "Хүчинтэй", value: "Гэрчилгээ хугацаагүй" },
      { label: "Үгийн сан", value: data.words + " (хуучин албан удирдамжаар ойролцоо)" },
    ],
    stats: {
      title: "2025 оны 12-р сарын шалгалт (Япон + гадаад)",
      items: [
        { value: data.rate, label: "тэнцсэн хувь" },
        { value: data.examinees, label: "шалгуулагч" },
        { value: data.certified, label: "гэрчилгээ авсан" },
        { value: "33.9%", label: "бүх түвшний дундаж" },
      ],
      source: "jlpt.jp, Statistics: 2025 оны 12-р сар",
    },
    tips: [
      "Хэсэг бүрийн босгыг санаж, сул хэсгээ орхихгүй — нэг хэсэг унавал бүхэлдээ тэнцэхгүй.",
      "Ханзыг үгээр нь цээжил: дуудлага, утга, жишээ өгүүлбэр.",
      basic ? "聴解-д зураг, сонголтуудыг яриа эхлэхээс өмнө харж амжаарай." : "読解-д урт текстийн асуултыг эхэлж уншаад, дараа нь текстээс хай.",
      "Mock-ыг бодит хугацаагаар нь өгч, 文法・読解-ын цагийн хуваарьт дасгал.",
    ],
    links: [{ label: "jlpt.jp", href: "https://www.jlpt.jp/e/" }],
  };
};

// ---------------------------------------------------------------- HSK

type HskData = { parts: [string, string, string, string][]; total: string; items: string; scale: string; pass: string; words: string };
const HSK: Record<number, HskData> = {
  1: { parts: [["听力", "Сонсох", "20", "≈15 (+3 хуулах)"], ["阅读", "Унших", "20", "≈17"]], total: "≈40 мин (хувийн мэдээлэл бөглөх 5 мин орно)", items: "40",
    scale: "200 (сонсох 100, унших 100)", pass: "≥120", words: "300 үг, 300 ханз (2026 стандарт)" },
  2: { parts: [["听力", "Сонсох", "35", "≈35 (+3 хуулах)"], ["阅读", "Унших", "25", "≈25"]], total: "≈55 мин (хувийн мэдээлэл бөглөх 5 мин орно)", items: "60",
    scale: "200 (сонсох 100, унших 100)", pass: "≥120", words: "500 үг (2026 стандарт)" },
  3: { parts: [["听力", "Сонсох", "40", "≈35"], ["阅读", "Унших", "30", "30"], ["书写", "Бичих", "10", "15"]], total: "≈90 мин", items: "80",
    scale: "300 (хэсэг бүр 100)", pass: "≥180", words: "600 үг (HSK 2.0)" },
  4: { parts: [["听力", "Сонсох", "45", "≈30"], ["阅读", "Унших", "40", "40"], ["书写", "Бичих", "15", "25"]], total: "≈105 мин", items: "100",
    scale: "300 (хэсэг бүр 100)", pass: "≥180", words: "1,200 үг (HSK 2.0)" },
  5: { parts: [["听力", "Сонсох", "45", "≈30"], ["阅读", "Унших", "45", "45"], ["书写", "Бичих", "10", "40"]], total: "≈125 мин", items: "100",
    scale: "300 (хэсэг бүр 100)", pass: "≥180", words: "2,500 үг (HSK 2.0)" },
  6: { parts: [["听力", "Сонсох", "50", "≈35"], ["阅读", "Унших", "50", "50"], ["书写", "Бичих (товчлон бичих)", "1", "45"]], total: "≈140 мин", items: "101",
    scale: "300 (хэсэг бүр 100)", pass: "≥180", words: "5,000+ үг (HSK 2.0)" },
};

const hsk = (level: string): ExamInfo => {
  const n = Math.min(6, Math.max(1, Number(level.replace("hsk", "")) || 1));
  const data = HSK[n];
  return {
    title: "HSK " + n,
    organizer: "Chinese Testing International (CTI), Хятад",
    summary: n <= 2
      ? "Хятад хэлний түвшин тогтоох олон улсын шалгалт. HSK 3.0-ийн 2026 оны стандартаар үгийн жагсаалт шинэчлэгдсэн."
      : "Хятад хэлний түвшин тогтоох олон улсын шалгалт; Хятадын их сургуульд суралцах, тэтгэлэгт түгээмэл шаардлага.",
    note: n <= 2
      ? "HSK 3.0 руу шилжих үед эх сурвалжууд HSK 2-ын бүтцийг өөр өөрөөр тайлбарладаг (манай mock 书写 хэсэгтэй). Бүртгүүлэхдээ chinesetest.cn дээрх бүтцийг шалгаарай."
      : "Энд HSK 2.0-ийн бүтэц байна. HSK 3.0 (1–9 түвшин) руу шилжиж байгаа тул бүртгүүлэхдээ chinesetest.cn дээрх бүтцийг шалгаарай.",
    parts: data.parts.map(([native, name, items, minutes]) => ({ name, native, items, minutes, detail: "" })),
    totalTime: data.total, totalItems: data.items,
    scale: data.scale, pass: data.pass,
    scoring: [
      "Дүнгийн тайланд хэсэг бүрийн оноо ба нийт оноо гарна.",
      "Буруу хариултад оноо хасахгүй.",
    ],
    facts: [
      { label: "Хэлбэр", value: "Цаасан эсвэл компьютерээр" },
      { label: "Хэзээ", value: "Жилд олон удаа; Монгол дахь товыг шалгалтын төв зарлана" },
      { label: "Хүчинтэй", value: "Хятадад суралцах өргөдөлд 2 жил" },
      { label: "Үгийн сан", value: data.words },
    ],
    stats: { title: "Статистик", items: [], note: "CTI түвшин бүрийн тэнцэлтийн хувийг тогтмол нийтэлдэггүй." },
    tips: [
      "Үгийг пиньинь, аятай нь хамт цээжил — сонсох хэсэг ая ялгахаас эхэлдэг.",
      "Ханзыг бүрэлдэхүүн хэсгээр нь таньж сур: 亻, 女, 氵, 口, 木 …",
      "Өдөр бүр 10–15 мин богино сонсох дасгал: тоо, цаг, үнэ, өдрүүд.",
      "Хариултын хуудсанд шилжүүлэх хугацааг дасгалдаа оруул.",
    ],
    links: [{ label: "chinesetest.cn", href: "https://www.chinesetest.cn" }],
  };
};

// ---------------------------------------------------------------- TOPIK

const topik = (level: string): ExamInfo => {
  const two = level === "topik2";
  return {
    title: two ? "TOPIK Ⅱ" : "TOPIK Ⅰ",
    organizer: "NIIED — Солонгосын Олон улсын боловсролын хүрээлэн",
    summary: two
      ? "Дунд ба ахисан шат (3–6-р түвшин): Солонгосын их сургууль, ажил, визэнд түгээмэл шаардлага."
      : "Анхан шат (1–2-р түвшин): өдөр тутмын энгийн харилцааны солонгос хэл.",
    parts: two
      ? [
          { name: "Сонсох", native: "듣기", items: "50", minutes: "60", detail: "1-р цаг." },
          { name: "Бичих", native: "쓰기", items: "4", minutes: "50", detail: "1-р цаг. 51–52 өгүүлбэр нөхөх, 53 график тайлбар (200–300 үсэг), 54 эссэ (600–700 үсэг)." },
          { name: "Унших", native: "읽기", items: "50", minutes: "70", detail: "2-р цаг." },
        ]
      : [
          { name: "Сонсох", native: "듣기", items: "30", minutes: "40", detail: "Богино яриа, зар, мэдээлэл." },
          { name: "Унших", native: "읽기", items: "40", minutes: "60", detail: "Тэмдэг, зар, богино текст, дараалал." },
        ],
    totalTime: two ? "180 мин" : "100 мин", totalItems: two ? "104" : "70",
    scale: two ? "300 (хэсэг бүр 100)" : "200 (сонсох 100, унших 100)",
    pass: two ? "3-р түвшин ≥120 · 4 ≥150 · 5 ≥190 · 6 ≥230" : "1-р түвшин ≥80 · 2-р түвшин ≥140",
    scoring: [
      "Тэнцсэн/тэнцээгүй биш — нийт оноогоор түвшин тогтооно.",
      two ? "쓰기-ийн оноо: 51, 52 тус бүр 10, 53 — 30, 54 — 50." : "Асуулт бүр 3 эсвэл 4 оноотой.",
    ],
    facts: [
      { label: "Хэлбэр", value: "Цаасан (PBT); зарим оронд интернетээр (IBT)" },
      { label: "Хэзээ", value: "Солонгост жилд 6 удаа, гадаадад цөөн удаа; Монгол дахь товыг topik.go.kr-д зарлана" },
      { label: "Хүчинтэй", value: "Дүн гарснаас хойш 2 жил" },
    ],
    stats: { title: "Статистик", items: [], note: "NIIED түвшин бүрийн тэнцэлтийн статистикийг тогтмол нийтэлдэггүй." },
    tips: two
      ? [
          "54-т 600–700 үсгийн эссэ: оршил, гол хэсэг, дүгнэлт; -다 хэлбэрээр бич.",
          "53-т графикийн бүх тоог дурдаж, харьцуулж бич.",
          "읽기-д 50 асуулт 70 минут — асуулт бүрт ≈1.4 мин.",
        ]
      : [
          "듣기-д асуулт бүрийн сонголтыг яриа эхлэхээс өмнө уншиж амжаарай.",
          "읽기-д эхний асуултуудыг хурдан хийж, ард талын урт текстэд илүү цаг үлдээ.",
          "-아요/어요, -았/었어요, -(으)ㄹ 거예요 зэрэг үндсэн төгсгөлийг сайн тогтоо.",
        ],
    links: [{ label: "topik.go.kr", href: "https://www.topik.go.kr" }],
  };
};

// ---------------------------------------------------------------- ЭЕШ

type Subject = "math" | "physics" | "chemistry" | "biology" | "english";
const EESH: Record<Subject, { label: string; parts: InfoPart[]; total: string; items: string; tips: string[]; perfect?: InfoStat }> = {
  math: { label: "Математик", total: "100 мин, тооны машингүй", items: "36 + 4 даалгавар", perfect: { value: "43", label: "2026 онд математикт 800" },
    parts: [{ name: "Сонгох (A–E)", items: "36", minutes: "", detail: "Нэг зөв хариулттай." }, { name: "Нөхөх бодолт", items: "4 даалгавар", minutes: "", detail: "Олон хэсэгтэй; хэсэг бүр тусдаа оноотой." }],
    tips: ["36 сонгох асуултад ≈55 мин, 4 бодолтод ≈45 мин хуваарил.", "Тооны машингүй — бутархай, язгуур, логарифмыг гараар хурдан бодож дас.", "Бодолтыг бүтэн бодож чадахгүй ч эхний хэсгүүдийг нь нөх — тусдаа оноотой."] },
  physics: { label: "Физик", total: "100 мин", items: "46 + 4 даалгавар",
    parts: [{ name: "Сонгох (A–E)", items: "46", minutes: "", detail: "Нэг зөв хариулттай." }, { name: "Бодолт", items: "4 даалгавар", minutes: "", detail: "Тоон хариулттай." }],
    tips: ["g = 10 м/с² гэж тооцно.", "Нэгжээ SI системд шилжүүлээд бод.", "Томьёоны хүснэгтээ өөрөө бичиж цээжил: механик, цахилгаан, дулаан, оптик."] },
  chemistry: { label: "Хими", total: "100 мин", items: "40 + 4 даалгавар",
    parts: [{ name: "Сонгох (A–E)", items: "40", minutes: "", detail: "Нэг зөв хариулттай." }, { name: "Бүтээх", items: "4 даалгавар", minutes: "", detail: "Тэгшитгэл, тооцоо, бүтэц." }],
    tips: ["Урвалын тэгшитгэлээ тэнцүүлээд моль харьцаагаар бод.", "Үелэх системийн зүй тогтлыг сайн мэд.", "Органик нэгдлийн нэршил, изомерийг дасгалаар бататга."] },
  biology: { label: "Биологи", total: "80 мин", items: "46–50 + 4 даалгавар",
    parts: [{ name: "Сонгох (A–E)", items: "46–50", minutes: "", detail: "2026 онд 46, өмнөх жилүүдэд 50." }, { name: "Бүтээх", items: "4 даалгавар", minutes: "", detail: "Схем, генетикийн бодлого, тайлбар." }],
    tips: ["Асуулт бүрт ≈1 мин — эргэлзсэнээ тэмдэглээд дараа нь эргэж ир.", "Генетикийн бодлогод Пеннетийн торыг ашигла.", "Схем, зураг, хүснэгтийг уншиж тайлбарлах дасгал хий."] },
  english: { label: "Англи хэл", total: "Цаасан дээр хугацаа хэвлэгдээгүй (манай mock 80 мин)", items: "Part I + Part II", perfect: { value: "36", label: "2026 онд англи хэлэнд 800" },
    parts: [{ name: "Part I", minutes: "", detail: "Дүрэм, үгсийн сан, харилцаа, унших." }, { name: "Part II", minutes: "", detail: "Тохируулах, нөхөх даалгавар." }],
    tips: ["Part I-ийн дүрмийн асуултыг хурдан хийж, текстэд илүү цаг үлдээ.", "Цаг, хэв, холбоос үгийг давт.", "Өмнөх оны mock-уудыг цагтай нь өг."] },
};

const eesh = (level: string): ExamInfo => {
  const key = (level in EESH ? level : "math") as Subject;
  const data = EESH[key];
  return {
    title: "ЭЕШ · " + data.label,
    organizer: "Боловсролын үнэлгээний төв (БҮТ)",
    summary: "Монголын их, дээд сургуульд элсэх шалгалт; одоо албан ёсоор «Элсэлтийн шалгалт (ЭШ)» гэж нэрлэдэг. Сургууль, мэргэжил бүр шаардах хичээл, босго оноогоо жил бүр зарладаг.",
    parts: data.parts,
    totalTime: data.total, totalItems: data.items,
    scale: "Анхны оноо (100 хүртэл) → хэмжээст оноо 200–800",
    scoring: [
      "Хэмжээст оноог тухайн жилийн бүх шалгуулагчийн дүнтэй харьцуулж тооцдог.",
      "Их, дээд сургуулийн босго оноог жил бүр зарлана.",
      "Манай mock анхны оноо (100) өгнө, хэмжээст оноо биш.",
    ],
    facts: [
      { label: "Хэзээ", value: "Жилд нэг удаа, 6-р сарын сүүлээр (2026 онд 6-р сарын 25–28)" },
      { label: "Хэлбэр", value: "Цаасан, хариултын хуудастай" },
      { label: "Бүтцийн эх сурвалж", value: "Өмнөх оны шалгалтын материал (манай mock-уудын суурь)" },
    ],
    stats: {
      title: "2025–2026 оны элсэлтийн шалгалт",
      items: [
        { value: "49,014", label: "2026 онд бүртгүүлсэн" },
        { value: "194", label: "2026 онд 800 оноо (бүх хичээл)" },
        ...(data.perfect ? [data.perfect] : []),
        { value: "40,338", label: "2025 онд шалгалт өгсөн (43,318 бүртгүүлснээс)" },
      ],
      source: "БҮТ-ийн мэдээллээр (ikon.mn, gogo.mn)",
    },
    tips: data.tips,
    links: [{ label: "eec.mn", href: "https://eec.mn" }, { label: "ЭЕШ Workshop: " + data.label, href: `/labs/eesh/${key}` }],
  };
};

export function examInfo(exam: GoalExam, level: string, today: string): ExamInfo {
  if (exam === "sat") return sat();
  if (exam === "ielts") return ielts(level);
  if (exam === "toefl") return toefl();
  if (exam === "jlpt") return jlpt(level, today);
  if (exam === "hsk") return hsk(level);
  if (exam === "topik") return topik(level);
  return eesh(level);
}
