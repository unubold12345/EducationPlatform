import { regionalPapers } from "./regional.ts";
import { englishExams } from "./english-exams.ts";
// Only metadata and original-source addresses. Never put answer keys here.
export const officialPaperCategory={slug:"eec-math-2020",title:"ЭЕШ 2020 · Математик"};
export const officialPapers=["A","B","C","D"].map(variant=>({
 slug:`eec-math-2020-${variant.toLowerCase()}`,title:`ЭЕШ 2020 · Математик · ${variant==="A"?"А":variant} хувилбар`,program:"entrance" as const,
 year:2020,variant,seconds:6000,pages:8,totalMarks:100,
 sourceUrl:"http://help.eec.mn/",publisher:"Боловсролын үнэлгээний төв",
 pageUrls:Array.from({length:8},(_,i)=>`http://help.eec.mn/modelItems/2020/mat/${variant}/${i+1}.jpg`),
 timingSource:"https://dornodedu.mn/dornodedu/wp-content/uploads/2024/04/%D0%AD%D0%95%D0%A8-2020-%D1%82%D0%B0%D0%B9%D0%BB%D0%B0%D0%BD.pdf",
}));
export type {PaperSlot} from "./layout.ts";
export {paperSlots,slotsForPaper} from "./layout.ts";
import type {PaperSlot} from "./layout.ts";
export type OfficialPaper=(typeof officialPapers)[number]&{subject?:"math"|"english";slots?:PaperSlot[];scoringNote?:string;categoryPath?:string;timingNote?:string;regional?:boolean;sourceNote?:string};
export const allOfficialPapers:OfficialPaper[]=[...officialPapers,...englishExams,...regionalPapers];
// Preserve the original A export and slug for existing purchases and attempts.
export const officialPaper=officialPapers[0];
export function findOfficialPaper(slug:string){return allOfficialPapers.find(paper=>paper.slug===slug);}
