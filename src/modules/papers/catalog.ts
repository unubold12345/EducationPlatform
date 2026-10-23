// Only metadata and original-source addresses. Never put answer keys here.
export const officialPaper={
 slug:"eec-math-2020-a",title:"ЭЕШ 2020 · Математик · А хувилбар",program:"entrance" as const,
 year:2020,variant:"A",seconds:6000,pages:8,totalMarks:100,
 sourceUrl:"http://help.eec.mn/",publisher:"Боловсролын үнэлгээний төв",
 pageUrls:Array.from({length:8},(_,i)=>`http://help.eec.mn/modelItems/2020/mat/A/${i+1}.jpg`),
 timingSource:"https://dornodedu.mn/dornodedu/wp-content/uploads/2024/04/%D0%AD%D0%95%D0%A8-2020-%D1%82%D0%B0%D0%B9%D0%BB%D0%B0%D0%BD.pdf",
};
export function findOfficialPaper(slug:string){return slug===officialPaper.slug?officialPaper:undefined;}
export const paperSlots=[...Array.from({length:36},(_,i)=>({id:String(i+1),label:String(i+1),kind:"choice" as const})),...Array.from({length:4},(_,i)=>({id:`2.${i+1}`,label:`2.${i+1}`,kind:"digits" as const}))];
