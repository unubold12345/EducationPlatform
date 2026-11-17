/** The chips a saved Build a Sentence response used, in order (chips may hold several words, so the words are matched back to boxes). */
export function buildSlots(value:string,chips:string[]):string[]{
 const words=value.trim().split(/\s+/).filter(Boolean);
 if(!words.length)return [];
 const used=new Set<number>();
 function walk(at:number):number[]|null{
  if(at===words.length)return [];
  for(let index=0;index<chips.length;index++){
   if(used.has(index))continue;
   const parts=chips[index].split(/\s+/);
   if(parts.every((part,offset)=>words[at+offset]?.toLocaleLowerCase('en')===part.toLocaleLowerCase('en'))){
    used.add(index);const rest=walk(at+parts.length);if(rest)return [index,...rest];used.delete(index);
   }
  }
  return null;
 }
 return (walk(0)??[]).map(index=>chips[index]);
}
