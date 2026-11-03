import type { ExerciseProgram, ExerciseSet } from "./types.ts";
export type ExerciseItem = [prompt:string,options:string[],answer:string,explanation:string];
export function exerciseSet(slug:string,program:ExerciseProgram,title:string,subject:string,description:string,minutes:number,items:ExerciseItem[]):ExerciseSet {
  return {slug,examId:slug+"-v1",program,title,subject,description,minutes,questions:items.map(([prompt,options,answer,explanation],index)=>{
    if(!options.includes(answer)||new Set(options).size!==options.length)throw Error("Invalid exercise options: "+slug+" question "+(index+1));
    const offset=(slug.length+index)%options.length;
    const ordered=[...options.slice(offset),...options.slice(0,offset)];
    return {id:`${slug}-q${index+1}-v1`,prompt,options:ordered,correct:ordered.indexOf(answer),explanation};
  })};
}
