import type { OfficialPaper } from "./catalog";
import type { gradePaper,PaperResponses } from "./engine";
export type PublicPaperAttempt={id:string;paper:OfficialPaper;status:string;revision:number;deadline:string;serverNow:string;responses:PaperResponses;finishedAt:string|null;report:ReturnType<typeof gradePaper>|null;keySources:string[]};
