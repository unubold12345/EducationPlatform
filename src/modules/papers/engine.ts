export type PaperKey={choices:string[];choiceMarks:number[];fills:{id:string;digits:string;groups:{positions:number[];marks:number}[]}[];sourceUrls:string[];version:string};
export type PaperResponses=Record<string,string>;
export function validPaperResponses(value:unknown,key?:PaperKey):value is PaperResponses {
 if(!value||typeof value!=="object"||Array.isArray(value))return false;
 if(!key)return Object.entries(value).every(([id,answer])=>typeof answer==="string"&&(/^(?:[1-9]|[12][0-9]|3[0-6])$/.test(id)?/^[A-E]?$/.test(answer):/^2\.[1-4]$/.test(id)&&/^[0-9_]{0,7}$/.test(answer)));
 return Object.entries(value).every(([id,answer])=>{
  if(typeof answer!=="string")return false;
  const index=Number(id)-1;
  if(Number.isInteger(index)&&String(index+1)===id&&index>=0&&index<key.choices.length)return /^[A-E]?$/.test(answer);
  const fill=key.fills.find(item=>item.id===id);
  return Boolean(fill&&answer.length<=fill.digits.length&&/^[0-9_]*$/.test(answer));
 });
}
export function gradePaper(key:PaperKey,responses:PaperResponses) {
 const choices=key.choices.map((answer,i)=>({id:String(i+1),selected:responses[String(i+1)]??"",answer,marks:responses[String(i+1)]===answer?key.choiceMarks[i]:0,maxMarks:key.choiceMarks[i]}));
 const fills=key.fills.map(item=>{
  const selected=(responses[item.id]??"").padEnd(item.digits.length,"_");
  const groups=item.groups.map(group=>({...group,marks:group.positions.every(position=>selected[position]===item.digits[position])?group.marks:0,maxMarks:group.marks}));
  return {id:item.id,selected,answer:item.digits,marks:groups.reduce((sum,group)=>sum+group.marks,0),maxMarks:item.groups.reduce((sum,g)=>sum+g.marks,0),groups};
 });
 return {score:choices.reduce((sum,item)=>sum+item.marks,0)+fills.reduce((sum,item)=>sum+item.marks,0),total:key.choiceMarks.reduce((sum,marks)=>sum+marks,0)+key.fills.flatMap(item=>item.groups).reduce((sum,g)=>sum+g.marks,0),choices,fills};
}
