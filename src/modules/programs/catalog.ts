export type Program = {
  slug: string; title: string; subtitle: string; description: string;
  color: "blue" | "purple" | "green"; symbol: string;
  status: string; topics: string[]; available: boolean;
  audience: string; highlights: string[];
};

export const programs: Program[] = [
  {
    slug: "sat", title: "SAT", subtitle: "Математикаас эхэлье",
    description: "Бодлогын цаадах учрыг ойлгож, алхам бүрээ тайлбартайгаар давтаарай.",
    color: "blue", symbol: "x²", status: "4 багц · 32 асуулт",
    audience: "Гадаад их сургуульд орох бол",
    highlights: ["4 сэдвийн 32 бодлого", "Бүтэн Digital SAT", "Алхам бүрийн тайлбар"],
    topics: ["Algebra", "Advanced Math", "Problem-Solving and Data Analysis", "Geometry and Trigonometry"],
    available: true,
  },
  {
    slug: "ielts", title: "IELTS", subtitle: "Англи хэлний бэлтгэл",
    description: "Унших эх, академик хэлний дасгал, бичих болон ярих даалгавраар бэлдээрэй.",
    color: "purple", symbol: "Aa", status: "24 асуулт + 4 даалгавар",
    audience: "Гадаадад суралцах, цагаачлах бол",
    highlights: ["Reading & Academic English", "Writing, Speaking workshop", "Бүтэн Academic mock"],
    topics: ["Academic Reading", "Vocabulary & Grammar", "Writing", "Speaking"], available: true,
  },
  {
    slug: "entrance", title: "Элсэлтийн шалгалт", subtitle: "Их сургуулийн эхний алхам",
    description: "Сонгосон хичээлийнхээ суурийг бататгаж, сэдэв бүрээр бэлдэх боломж.",
    color: "green", symbol: "∑", status: "3 хичээл · 24 асуулт",
    audience: "Монголын их сургуульд орох бол",
    highlights: ["Математик · Англи · Физик", "ЭЕШ 2020 A–D", "Англи хэлний архив"],
    topics: ["Математик", "Англи хэл", "Физик"], available: true,
  },
];

export function findProgram(slug: string) {
  return programs.find((program) => program.slug === slug);
}
