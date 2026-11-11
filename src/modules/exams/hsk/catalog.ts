import data from './catalog.json' with { type: 'json' };
/** Client-safe HSK 1 catalogue written by scripts/build-hsk-mocks.mjs (no answers or listening texts). */
export const hskMocks = data as {slug:string;number:number;title:string;titleZh:string;titlePinyin:string;titleEn:string;theme:string;questions:number;minutes:number;recordedMinutes:number}[];
export const hskSlugs = () => hskMocks.map(mock=>mock.slug);
