import archive from "../../../assets/papers/english-archive.json";

// A paper is visible only when its complete source and matching key column were reviewed.
export const englishPapers=archive.papers.filter(paper=>paper.pages.length>0&&paper.keyPages.length>0&&paper.keyVariants.includes(paper.variant));
export type EnglishArchivePaper=(typeof englishPapers)[number];
export const englishYears=[...new Set(englishPapers.map(paper=>paper.year))].sort((a,b)=>b-a);
export function findEnglishPaper(slug:string){return englishPapers.find(paper=>paper.slug===slug);}
