export type PaperSlot={id:string;label:string;kind:"choice"|"digits";marks?:number;options?:string[];length?:number;cellLabels?:string[]};
export const paperSlots:PaperSlot[]=[...Array.from({length:36},(_,i)=>({id:String(i+1),label:String(i+1),kind:"choice" as const})),...Array.from({length:4},(_,i)=>({id:`2.${i+1}`,label:`2.${i+1}`,kind:"digits" as const}))];
// Older immutable Mathematics snapshots have no layout; preserve their original answer sheet.
export function slotsForPaper(paper:{slots?:PaperSlot[]}):PaperSlot[]{return paper.slots??paperSlots;}
