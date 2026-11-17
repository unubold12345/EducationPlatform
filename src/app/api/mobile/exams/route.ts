import { apiFailure, apiUser, privateJson } from "@/lib/api";
import { examDefinitions } from "@/modules/exams/definitions";
import { entranceCounts, entranceTotal } from "@/modules/exams/entrance/catalog";
import { hskMocks } from "@/modules/exams/hsk/catalog";
import { MOCK_PRICE_LABEL } from "@/modules/exams/pricing";
import type { HubProgramme, HubReply } from "./contracts";

// The mobile app's counterpart of /exams (src/app/exams/page.tsx): one row per programme with the same counts,
// facts and wording. Read-only catalogue data; no account data is read beyond the session check.
export async function GET(request: Request) {
  try {
    await apiUser(request);
    const subjects = entranceCounts();
    const sat = examDefinitions.filter(exam => exam.program === "sat").length;
    const ielts = examDefinitions.filter(exam => exam.program === "ielts").length;
    const picks = (plan: string) => `Эсвэл ${plan} багцаар сард 15 mock`;
    const programmes: HubProgramme[] = [
      {
        id: "sat", title: "Digital SAT",
        copy: "Reading & Writing-ээс Math хүртэл. Модуль бүрийн цаг, завсарлага болон сонгох/тоон хариулттай.",
        facts: [{ label: "Агуулга", value: "98 асуулт · 4 модуль" }, { label: "Хугацаа", value: "2ц 14м + 10м завсарлага" }],
        chips: ["R&W · 64м", "Break · 10м", "Math · 70м"],
        count: sat, href: "/exams/sat", cta: "Mock сонгох", planNote: picks("Гадаад хэл"),
      },
      {
        id: "ielts", title: "IELTS Academic",
        copy: "Listening, Reading, Writing, Speaking. Бичлэг сонсож, эх уншиж, эсээ бичиж, яриагаа бичүүлээрэй.",
        facts: [{ label: "Агуулга", value: "80 асуулт + 2 Writing task + Speaking" }, { label: "Хугацаа", value: "32м Listening · 60м Reading · 60м Writing · 12м Speaking" }],
        chips: ["Listen · 32м", "Read · 60м", "Write · 60м", "Speak · 12м"],
        count: ielts, href: "/exams/ielts", cta: "Mock сонгох", planNote: picks("Гадаад хэл"),
      },
      {
        id: "eesh", sub: "Элсэлтийн ерөнхий шалгалт", title: "ЭЕШ",
        copy: "Математик, физик 2015–2026; хими, биологи 2020–2026; англи хэл 2018–2026. Жил, хувилбараар эрэмбэлсэн бүтэн mock.",
        facts: [{ label: "Агуулга", value: "5 хичээл · 100 оноо" }, { label: "Хугацаа", value: "80–100 минут" }],
        chips: [],
        subjects: [
          { label: "Математик", count: subjects.math, href: "/exams/eesh?subject=math" },
          { label: "Физик", count: subjects.physics, href: "/exams/eesh?subject=physics" },
          { label: "Хими", count: subjects.chemistry, href: "/exams/eesh?subject=chemistry" },
          { label: "Биологи", count: subjects.biology, href: "/exams/eesh?subject=biology" },
          { label: "Англи хэл", count: subjects.english, href: "/exams/eesh?subject=english" },
        ],
        count: entranceTotal, href: "/exams/eesh", cta: `Бүх ${entranceTotal} mock`, planNote: "Эсвэл ЭЕШ сарын багц, хязгааргүй",
      },
      {
        id: "jlpt", sub: "日本語能力試験", title: "JLPT N5・N4",
        copy: "Түвшин бүрт 3 mock. Үгийн сан, хэлзүй, унших ба япон аудиотой сонсох хэсэг. Алдсан чадвараа цаггүй давтаарай.",
        facts: [{ label: "Агуулга", value: "N5 · 67 / N4 · 85 асуулт" }, { label: "Хугацаа", value: "N5 · 90м / N4 · 115м" }],
        chips: ["語彙", "文法・読解", "聴解"], count: 6, href: "/exams/jlpt", cta: "Mock сонгох", planNote: picks("Гадаад хэл"),
      },
      {
        id: "hsk", sub: "汉语水平考试", title: "HSK 1",
        copy: "Хятад хэлний анхан шат. Хятад аудиотой сонсох, зурагтай унших даалгавар; бүх ханз pinyin-тэй. Алдсан хэсгээ цаггүй давтаарай.",
        facts: [{ label: "Агуулга", value: "40 асуулт · 8 хэсэг" }, { label: "Хугацаа", value: "15м сонсох · 17м унших" }],
        chips: ["听力 · 15м", "阅读 · 17м"], count: hskMocks.length, href: "/exams/hsk", cta: "Mock сонгох", planNote: picks("Гадаад хэл"),
      },
    ];
    const reply: HubReply = {
      priceLabel: MOCK_PRICE_LABEL,
      note: "Бүх даалгаврыг энэ сайтад зориулж зохиосон; College Board, IELTS, JLPT, HSK, БҮТ-ийн албан материал биш. SAT, IELTS-ийн албан оноо, band тооцохгүй.",
      programmes,
    };
    return privateJson(reply);
  } catch (error) { return apiFailure(error); }
}
