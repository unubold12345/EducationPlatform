export type PaperKey={choices:string[];choiceMarks:number[];fills:{id:string;digits:string;groups:{positions:number[];marks:number}[]}[];sourceUrls:string[];version:string};
export type PaperResponses=Record<string,string>;
export function validPaperResponses(value:unknown):value is PaperResponses {
 if(!value||typeof value!=="object"||Array.isArray(value))return false;
 return Object.entries(value).every(([key,answer])=>typeof answer==="string"&&(/^(?:[1-9]|[12][0-9]|3[0-6])$/.test(key)?/^[A-E]?$/.test(answer):/^2\.[1-4]$/.test(key)&&/^[0-9_]{0,7}$/.test(answer)));
}
export function gradePaper(key:PaperKey,responses:PaperResponses) {
 const choices=key.choices.map((answer,i)=>({id:String(i+1),selected:responses[String(i+1)]??"",answer,marks:responses[String(i+1)]===answer?key.choiceMarks[i]:0,maxMarks:key.choiceMarks[i]}));
 const fills=key.fills.map(item=>{
  const selected=(responses[item.id]??"").padEnd(7,"_");
  const groups=item.groups.map(group=>({...group,marks:group.positions.every(position=>selected[position]===item.digits[position])?group.marks:0,maxMarks:group.marks}));
  return {id:item.id,selected,answer:item.digits,marks:groups.reduce((sum,group)=>sum+group.marks,0),maxMarks:7,groups};
 });
 return {score:choices.reduce((sum,item)=>sum+item.marks,0)+fills.reduce((sum,item)=>sum+item.marks,0),total:100,choices,fills};
}
