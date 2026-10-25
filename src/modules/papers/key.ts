// Factual answers and weights transcribed from БҮТ's public 2020 official key.
// Server services and tests only; the client receives a report after submission.
import type { PaperKey } from "./engine";
export const officialKey={
 choices:"BCDAEDCDAEDCBBCBEACDECCBDEDCDADACBEA".split(""),
 choiceMarks:Array.from({length:36},(_,i)=>i<11?1:i<25?2:3),
 // A digit pair receives its combined mark only when both positions match.
 fills:[
  {id:"2.1",digits:"8660834",groups:[{positions:[0],marks:1},{positions:[1],marks:1},{positions:[2],marks:1},{positions:[3,4],marks:2},{positions:[5],marks:1},{positions:[6],marks:1}]},
  {id:"2.2",digits:"9544553",groups:Array.from({length:7},(_,i)=>({positions:[i],marks:1}))},
  {id:"2.3",digits:"5835874",groups:[{positions:[0],marks:1},{positions:[1],marks:1},{positions:[2],marks:1},{positions:[3,4],marks:2},{positions:[5,6],marks:2}]},
  {id:"2.4",digits:"2693423",groups:Array.from({length:7},(_,i)=>({positions:[i],marks:1}))},
 ],
 sourceUrls:[1,2,3].map(i=>`http://help.eec.mn/modelItems/2020Key/mat/mat-${i}.jpg`),
 version:"eec-2020-A-key-v1",
};

const singleDigits=()=>Array.from({length:7},(_,i)=>({positions:[i],marks:1}));
function variantKey(variant:string,choices:string,digits:string[]):PaperKey {
 return {
  choices:choices.split(" "),choiceMarks:[...officialKey.choiceMarks],
  fills:digits.map((answer,i)=>({id:`2.${i+1}`,digits:answer,groups:i===2?officialKey.fills[2].groups:i===0&&variant==="C"?officialKey.fills[0].groups:singleDigits()})),
  sourceUrls:[...officialKey.sourceUrls],version:`eec-2020-${variant}-key-v1`,
 };
}
// Transcribed column by column from mat-1.jpg (1–24), mat-2.jpg (25–36, 2.1)
// and mat-3.jpg (2.2–2.4). B/D 2.1 score d and e separately; A/C score de together.
export const officialKeys:Record<string,PaperKey>={
 A:officialKey,
 B:variantKey("B","C B D A C E A D C B D C E A E D C B D C B D A E D C E A D B E A D E A D",["8644828","9544555","4035827","2693633"]),
 C:variantKey("C","B C D E C B A A E D C B D A E D A C B D A E D C C C E C D C A E D B E D",["8660834","9544555","5835874","2693633"]),
 D:variantKey("D","B D E A C B D A E D C B D C D C B D B E A E A B D E A A C B B A E C D E",["8644828","9544553","4035827","2693423"]),
};
