// Factual answers and weights transcribed from БҮТ's public 2020 official key.
// Server services and tests only; the client receives a report after submission.
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
