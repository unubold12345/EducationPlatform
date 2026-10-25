import { englishPapers } from "./english-catalog.ts";
import structures from "./english-structure.json" with {type:"json"};
import type { OfficialPaper,PaperSlot } from "./catalog";

// Public layouts contain counts and weights only. Answers are loaded by the server service.
export const englishExams:OfficialPaper[]=englishPapers.map(paper=>{
 const structure=structures[paper.slug as keyof typeof structures];
 return {slug:paper.slug,title:`ЭЕШ ${paper.year} · Англи хэл · ${paper.variant} хувилбар`,program:"entrance",subject:"english",year:paper.year,variant:paper.variant,seconds:4800,pages:paper.pages.length,totalMarks:structure.totalMarks,sourceUrl:paper.sourceUrl,publisher:"Боловсролын үнэлгээний төв",pageUrls:paper.pages,timingSource:paper.year<=2011?"https://www.eec.mn/post/326":"https://ed.khs.gov.mn/news/48/single/243",timingNote:paper.year<2011?"80 минутын дадлага; хуучин жилийн анхны хугацааг тусад нь баталгаажуулаагүй.":"80 минутын нэг тасралтгүй хугацаа.",slots:structure.slots as PaperSlot[],scoringNote:structure.scoringNote,categoryPath:"/exams/eec-english#year-"+paper.year};
});
