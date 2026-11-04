export type Program = {
  slug: string; title: string; subtitle: string; description: string;
  color: "blue" | "purple" | "green"; symbol: string;
  status: string; topics: string[]; available: boolean;
  audience: string; highlights: string[];
};

export const programs: Program[] = [
  {
    slug: "sat", title: "SAT", subtitle: "Унших, бичих ба математик",
    description: "Бүтэн Digital SAT mock-оор хугацаатай бэлдэж, хариугаа тайлбартай нь шалгаарай.",
    color: "blue", symbol: "x²", status: "6 бүтэн mock",
    audience: "Гадаад их сургуульд орох бол",
    highlights: ["6 бүтэн Digital SAT mock", "Reading & Writing + Math", "Хариу, тайлбартай үр дүн"],
    topics: ["Reading and Writing", "Algebra", "Advanced Math", "Problem-Solving and Data Analysis", "Geometry and Trigonometry"],
    available: true,
  },
  {
    slug: "ielts", title: "IELTS", subtitle: "Англи хэлний бэлтгэл",
    description: "Бүтэн Academic mock, бичих болон ярих workshop-оор бэлдээрэй.",
    color: "purple", symbol: "Aa", status: "6 бүтэн mock + 4 workshop",
    audience: "Гадаадад суралцах, цагаачлах бол",
    highlights: ["6 бүтэн Academic mock", "Writing, Speaking workshop", "Listening, Reading, Writing, Speaking"],
    topics: ["Listening", "Academic Reading", "Writing", "Speaking"], available: true,
  },
  {
    slug: "entrance", title: "Элсэлтийн шалгалт", subtitle: "Их сургуулийн эхний алхам",
    description: "ЭЕШ-ийн албан материалаар хугацаатай шалгалт өгч бэлдэх боломж.",
    color: "green", symbol: "∑", status: "41 албан хувилбар",
    audience: "Монголын их сургуульд орох бол",
    highlights: ["ЭЕШ 2020 Математик A–D", "Англи хэлний 37 хувилбар", "Хугацаатай, дүнтэй"],
    topics: ["Математик", "Англи хэл"], available: true,
  },
];

export function findProgram(slug: string) {
  return programs.find((program) => program.slug === slug);
}
