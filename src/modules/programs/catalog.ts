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
    color: "blue", symbol: "x²", status: "9 бүтэн mock",
    audience: "Гадаад их сургуульд орох бол",
    highlights: ["9 бүтэн Digital SAT mock", "Reading & Writing + Math", "Хариу, тайлбартай үр дүн"],
    topics: ["Reading and Writing", "Algebra", "Advanced Math", "Problem-Solving and Data Analysis", "Geometry and Trigonometry"],
    available: true,
  },
  {
    slug: "ielts", title: "IELTS", subtitle: "Англи хэлний бэлтгэл",
    description: "Бүтэн Academic mock, бичих болон ярих workshop-оор бэлдээрэй.",
    color: "purple", symbol: "Aa", status: "12 бүтэн mock + 4 workshop",
    audience: "Гадаадад суралцах, цагаачлах бол",
    highlights: ["12 бүтэн Academic mock", "Writing, Speaking workshop", "Listening, Reading, Writing, Speaking"],
    topics: ["Listening", "Academic Reading", "Writing", "Speaking"], available: true,
  },
  {
    slug: "entrance", title: "Элсэлтийн шалгалт", subtitle: "Их сургуулийн эхний алхам",
    description: "ЭЕШ-ийн математик, физик, хими, биологи, англи хэлний 194 бүтэн mock. 2015–2026 оны жишиг бүтэцтэй, хугацаатай бэлтгэл.",
    color: "green", symbol: "∑", status: "194 бүтэн mock",
    audience: "Монголын их сургуульд орох бол",
    highlights: ["Математик · 55 mock", "Физик · 60 mock", "Хими · 18 mock", "Биологи · 21 mock", "Англи хэл · 40 mock"],
    topics: ["Математик", "Физик", "Хими", "Биологи", "Англи хэл"], available: true,
  },
];

export function findProgram(slug: string) {
  return programs.find((program) => program.slug === slug);
}
