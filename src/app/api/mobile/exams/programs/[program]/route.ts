import { ApiError, apiFailure, apiUser, privateJson } from "@/lib/api";
import { getDb } from "@/lib/db";
import { getExam } from "@/modules/content/published";
import { examDefinitions } from "@/modules/exams/definitions";
import {
  ENTRANCE_SUBJECT_ORDER, entranceCounts, entranceSubjectFormats, entranceSubjectHrefs, entranceSubjectLabels, entranceTotal,
  entranceYears, isEntranceSubject, mocksForYear,
} from "@/modules/exams/entrance/catalog";
import { freeMocksOf } from "@/modules/exams/free/catalog";
import { hskMocks, hskSlugs } from "@/modules/exams/hsk/catalog";
import { jlptMocks, jlptSlugs } from "@/modules/exams/jlpt/catalog";
import { MOCK_PRICE_LABEL } from "@/modules/exams/pricing";
import { hubAccess, hubLabel } from "@/modules/subscriptions/mock-access";
import type { CollectionReply, EeshReply, HskReply, HubMock, JlptReply } from "../../contracts";

type Context = { params: Promise<{ program: string }> };

// The mobile app's counterpart of the programme hubs: /exams/sat, /exams/ielts (modules/exams/collection.tsx),
// /exams/jlpt, /exams/hsk (their page.tsx) and /exams/eesh (modules/exams/entrance/hub.tsx). Each branch reads
// what its page reads, with the same queries and the same hubAccess() display rule. Read-only; the briefing and
// every start, read and practice request decide access again.

const collections = {
  sat: { title: "Digital SAT шалгалтууд", eyebrow: "Digital SAT · БҮТЭН MOCK", summary: "98 асуулт · 2ц 14м + 10м завсарлага", card: "54 Reading & Writing · 44 Math", plan: "Гадаад хэл" },
  ielts: { title: "IELTS Academic шалгалтууд", eyebrow: "IELTS Academic · БҮТЭН MOCK", summary: "Listening, Reading, Writing, Speaking · 2ц 44м", card: "40 Listening · 40 Reading + Writing, Speaking", plan: "Гадаад хэл" },
} as const;

async function collection(program: "sat" | "ielts"): Promise<CollectionReply> {
  const text = collections[program];
  const definitions = examDefinitions.filter(exam => exam.program === program);
  const exams = await Promise.all(definitions.map(exam => getExam(exam.slug).then(value => value!)));
  return {
    kind: "collection", program, eyebrow: text.eyebrow, title: text.title, summary: `${exams.length} бүтэн mock · ${text.summary}`,
    free: freeMocksOf(program),
    mocks: exams.map(exam => ({ slug: exam.slug, title: exam.title, name: "Full Mock " + exam.slug.slice(-2), detail: text.card })),
    note: `Нэг mock-ийн эрх ${MOCK_PRICE_LABEL} · Эсвэл ${text.plan} сарын багцаар сард 15 mock сонгоно. Эрхэд цагтай шалгалт болон цаггүй, AI туслахтай дадлагын горим хоёул багтана.`,
  };
}

/** The student's practice progress, open sittings and hub access for one programme's mocks, as the hub pages read them. */
async function hubRows(userId: string, slugs: string[], examProgram: "jlpt" | "hsk") {
  const [practice, attempts] = await Promise.all([
    getDb().practiceSession.findMany({ where: { userId, slug: { in: slugs } }, select: { slug: true, results: true } }),
    getDb().mockAttempt.findMany({ where: { userId, slug: { in: slugs }, status: "IN_PROGRESS" }, select: { id: true, slug: true } }),
  ]);
  // Bought, a plan, or this Гадаад хэл month's pick; the briefing and the API decide again.
  const access = await hubAccess(userId, slugs, examProgram);
  return (slug: string, idPrefix: string) => {
    const results = practice.find(row => row.slug === slug)?.results;
    const state = access.state(slug);
    return {
      access: hubLabel(state, MOCK_PRICE_LABEL), state, practice: access.practice(slug),
      activeAttemptId: attempts.find(row => row.slug === slug)?.id ?? null,
      checked: results && typeof results === "object" ? Object.keys(results).filter(id => id.startsWith(idPrefix)).length : 0,
    };
  };
}

const jlptThemes: Record<string, string> = {
  "jlpt-n5-01": "Шинэ сурагч, амралтын өдрийн аялал", "jlpt-n5-02": "Гэр, дэлгүүр, гэр бүлийн уулзалт", "jlpt-n5-03": "Өдрийн аялал, өдөр тутмын амьдрал",
  "jlpt-n4-01": "Олон нийтийн үйл ажиллагаа, суралцах төлөвлөгөө", "jlpt-n4-02": "Аялал, ажил, нийтийн үйлчилгээ", "jlpt-n4-03": "Эрүүл мэнд, зарлал, шинэ чадвар",
};

async function jlpt(userId: string): Promise<JlptReply> {
  const row = await hubRows(userId, jlptSlugs(), "jlpt");
  const free = freeMocksOf("jlpt");
  return {
    kind: "jlpt", program: "jlpt", eyebrow: "日本語能力試験 · ЯПОН ХЭЛ", title: "JLPT N5・N4",
    summary: "Түвшнээ сонгоод, нэг бүтэн mock эсвэл нэг чадварт төвлөрөн бэлдээрэй. Хариу, тэмдэглэсэн асуулт, дадлагын явц таны бүртгэлд хадгалагдана.",
    note: "",
    levels: (["N5", "N4"] as const).map(level => ({
      level, label: `${level} · ${level === "N5" ? "Анхан шат" : "Суурь шат"}`,
      format: level === "N5" ? "21 үгийн сан · 22 хэлзүй, унших · 24 сонсох · 90 минут" : "28 үгийн сан · 29 хэлзүй, унших · 28 сонсох · 115 минут",
      free: free.find(mock => mock.level === level) ?? null,
      mocks: jlptMocks.filter(mock => mock.level === level).map((mock): HubMock => ({
        slug: mock.slug, eyebrow: `${level} · MOCK 0${mock.number}`, title: `Mock 0${mock.number}`, theme: jlptThemes[mock.slug] ?? "",
        questions: mock.questions, minutes: mock.minutes, listening: "Япон audio", ...row(mock.slug, `${level}-0${mock.number}-`),
      })),
    })),
  };
}

async function hsk(userId: string): Promise<HskReply> {
  const row = await hubRows(userId, hskSlugs(), "hsk");
  return {
    kind: "hsk", program: "hsk", eyebrow: "汉语水平考试 · ХЯТАД ХЭЛ", title: "HSK 1",
    summary: "Хятад хэлний анхан шатны HSK 1 шалгалтын бүтэн mock. Сонсох хэсэг хятад audio-той, бүх ханз pinyin-тэй. Хариу, тэмдэглэсэн асуулт, дадлагын явц таны бүртгэлд хадгалагдана.",
    format: "20 сонсох (≈15 мин) · 20 унших (17 мин) · 40 асуулт · 32 минут", note: "",
    free: freeMocksOf("hsk")[0] ?? null,
    mocks: hskMocks.map((mock): HubMock => ({
      slug: mock.slug, eyebrow: `HSK 1 · MOCK 0${mock.number}`, title: mock.titleZh, subtitle: mock.titlePinyin, theme: mock.theme,
      questions: mock.questions, minutes: mock.minutes, listening: "Хятад audio", ...row(mock.slug, `hsk1-0${mock.number}-`),
    })),
  };
}

function eesh(requested: string | null): EeshReply {
  if (requested !== null && !isEntranceSubject(requested)) throw new ApiError(404, "Шалгалт олдсонгүй.");
  const subject = requested ?? "math";
  const counts = entranceCounts();
  const years = entranceYears(subject);
  const firstYear = Math.min(...years), lastYear = Math.max(...years);
  return {
    kind: "eesh", program: "eesh", subject, eyebrow: `ЭЛСЭЛТИЙН ЕРӨНХИЙ ШАЛГАЛТ · ${firstYear}–${lastYear}`, title: "ЭЕШ-ийн бүтэн mock",
    summary: `${entranceSubjectLabels[subject]}: жил, хувилбараар эрэмбэлсэн ${counts[subject]} бүтэн дадлагын шалгалт. Хугацаатай эсвэл цаггүй дадлагаар бэлдээрэй.`,
    facts: [{ label: "Хөтөлбөр", value: String(ENTRANCE_SUBJECT_ORDER.length) }, { label: "Бүтэн mock", value: String(entranceTotal) }, { label: "Он", value: String(years.length) }],
    subjects: ENTRANCE_SUBJECT_ORDER.map(item => ({ subject: item, label: entranceSubjectLabels[item], count: counts[item], format: entranceSubjectFormats[item], href: entranceSubjectHrefs[item] })),
    free: freeMocksOf("entrance").filter(mock => mock.subject === subject),
    years: years.map(year => ({
      year,
      mocks: mocksForYear(subject, year).map(mock => ({ slug: mock.slug, form: mock.form, questionCount: mock.questionCount, points: mock.points, durationMinutes: mock.durationMinutes })),
    })),
    note: "Нэг mock-ийн эрх ₮10,000 · ЭЕШ сарын багцад бүх ЭЕШ mock хязгааргүй багтана. Бүх даалгаврыг энэ сайтад зориулж зохиосон; БҮТ-ийн албан материал биш.",
  };
}

export async function GET(request: Request, { params }: Context) {
  try {
    const user = await apiUser(request);
    const program = (await params).program;
    if (program === "sat" || program === "ielts") return privateJson(await collection(program));
    if (program === "jlpt") return privateJson(await jlpt(user.id));
    if (program === "hsk") return privateJson(await hsk(user.id));
    if (program === "eesh") return privateJson(eesh(new URL(request.url).searchParams.get("subject")));
    throw new ApiError(404, "Шалгалт олдсонгүй.");
  } catch (error) { return apiFailure(error); }
}
