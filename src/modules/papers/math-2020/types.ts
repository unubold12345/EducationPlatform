// Public question content for the 2020 Mathematics papers. Text uses $...$ for KaTeX.
// Answers stay in key.ts; nothing in this folder may contain them.
export type PaperFigure=
 |{kind:"venn";shade:"A"|"B"}
 |{kind:"piecewise";scale:number;bend:[number,number];end:[number,number]}
 |{kind:"derivative";labels:[string,string,string,string,string]}
 |{kind:"power";n:5|6}
 |{kind:"trig";fn:"sin"|"cos";a:number;b:number}
 |{kind:"parallelogram";ab:string;ad:string;e:string}
 |{kind:"square";arrow:"OP"|"PM"}
 |{kind:"lshape"}
 |{kind:"pond";ab:number}
 |{kind:"pentagon"}
 |{kind:"grid"};
export type PaperTable={rows:string[][]};
export type PaperExtras={data?:string;figure?:PaperFigure;table?:PaperTable};
export type PaperQuestion=PaperExtras&{id:string;page:number;marks:number;prompt:string;options:string[]};
export type PaperFill=Pick<PaperExtras,"figure">&{id:string;page:number;marks:number;prompt:string;work:string};
export type PaperVariantContent={choices:PaperQuestion[];fills:PaperFill[]};
// Options are written as bare LaTeX unless they hold Mongolian text or their own $...$.
const option=(value:string)=>value.includes("$")||/[А-Яа-яӨөҮүЁё]/.test(value)?value:`$${value}$`;
export const q=(id:string,page:number,marks:number,prompt:string,options:string,extras:PaperExtras={}):PaperQuestion=>({id,page,marks,prompt,options:options.split(/\s\|\s/).map(value=>option(value.trim())),...extras});
export const fill=(id:string,page:number,prompt:string,work:string,extras:Pick<PaperExtras,"figure">={}):PaperFill=>({id,page,marks:7,prompt,work,...extras});
