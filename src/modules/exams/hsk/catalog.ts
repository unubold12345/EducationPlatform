import data from './catalog.json' with { type: 'json' };
/** Client-safe HSK 1–2 catalogue written by scripts/build-hsk-mocks.mjs (no answers or listening texts). */
export const hskMocks = data as {slug:string;level:number;number:number;title:string;titleZh:string;titlePinyin:string;titleEn:string;theme:string;questions:number;minutes:number;recordedMinutes:number}[];
export const hskSlugs = () => hskMocks.map(mock=>mock.slug);
/** The HSK level of a paid or free mock slug (hsk1-mock-01, hsk2-mock-03, hsk1-free). */
export const hskLevel = (slug:string) => Number(/^hsk(\d)-/.exec(slug)?.[1] ?? 1);
