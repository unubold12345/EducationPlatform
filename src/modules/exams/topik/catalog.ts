import data from './catalog.json' with { type: 'json' };
/** Client-safe TOPIK Ⅰ and Ⅱ catalogue written by scripts/build-topik-mocks.mjs (no answers or listening scripts). */
export const topikMocks = data as {slug:string;level:1|2;number:number;title:string;theme:string;topics:string;themeEn:string;questions:number;minutes:number;recordedMinutes:number;audio:boolean}[];
export const topikSlugs = () => topikMocks.map(mock=>mock.slug);
/** The TOPIK level of a mock slug: 1 for TOPIK Ⅰ (topik1-mock-01), 2 for TOPIK Ⅱ. */
export const topikLevel = (slug:string):1|2 => /^topik2-/.test(slug) ? 2 : 1;
export const topikName = (level:1|2) => level===2 ? 'TOPIK Ⅱ' : 'TOPIK Ⅰ';
/** Practice cut scores out of 200 (TOPIK Ⅰ: levels 1–2) or 300 (TOPIK Ⅱ: levels 3–6), as NIIED publishes them. */
export const TOPIK_LEVELS = { 1: [{level:1,min:80},{level:2,min:140}], 2: [{level:3,min:120},{level:4,min:150},{level:5,min:190},{level:6,min:230}] } as const;
export function topikGrade(level:1|2,score:number):number|null {
 const reached=TOPIK_LEVELS[level].filter(step=>score>=step.min).at(-1);
 return reached?reached.level:null;
}
