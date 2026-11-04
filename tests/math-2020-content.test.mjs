import test from "node:test";
import assert from "node:assert/strict";
import { mathFormulaSheet,mathPaperContent } from "../src/modules/papers/math-2020/index.ts";
import { renderMathText } from "../src/modules/papers/math-render.ts";
import { officialKeys } from "../src/modules/papers/key.ts";
import { paperSlots } from "../src/modules/papers/layout.ts";
const variants=["A","B","C","D"];
const content=variant=>mathPaperContent("eec-math-2020-"+variant.toLowerCase());
const keyed=(variant,id)=>{const letter=officialKeys[variant].choices[Number(id)-1];return content(variant).choices[Number(id)-1].options["ABCDE".indexOf(letter)];};

test("every variant has all 40 questions, in the answer sheet's order and marks",()=>{
 for(const variant of variants){
  const {choices,fills}=content(variant),key=officialKeys[variant];
  assert.deepEqual([...choices,...fills].map(q=>q.id),paperSlots.map(slot=>slot.id));
  choices.forEach((q,i)=>{assert.equal(q.options.length,5,variant+q.id);assert.equal(q.marks,key.choiceMarks[i],variant+q.id);assert.equal(new Set(q.options).size,5,variant+q.id+" duplicate option");});
  fills.forEach((q,i)=>{assert.equal(q.marks,key.fills[i].groups.reduce((sum,group)=>sum+group.marks,0),variant+q.id);});
  assert.equal(choices.reduce((sum,q)=>sum+q.marks,0)+fills.reduce((sum,q)=>sum+q.marks,0),100);
 }
});

test("fill-in templates show every answer cell a to g",()=>{
 for(const variant of variants)for(const q of content(variant).fills){
  const cells=[...q.work.matchAll(/\\cell\{([a-g]+)\}/g)].map(match=>match[1]).join("");
  for(const letter of "abcdefg")assert.ok(cells.includes(letter),variant+q.id+" lacks "+letter);
 }
});

test("all questions, options and formulas render as valid math",()=>{
 const texts=[...mathFormulaSheet.items];
 for(const variant of variants){const {choices,fills}=content(variant);for(const q of choices)texts.push(q.prompt,...q.options,q.data??"");for(const q of fills)texts.push(q.prompt,q.work);}
 for(const text of texts){const html=renderMathText(text);assert.ok(!html.includes("katex-error"),text);assert.ok(!/\$/.test(html.replace(/<[^>]*>/g,"").replace(/&[a-z]+;/g,"")),text);}
});

test("public question data carries no answers or key fields",()=>{
 for(const variant of variants){
  const text=JSON.stringify(content(variant));
  for(const field of ['"answer"','"choices":"','"digits"','"correct"','"groups"'])assert.ok(!text.includes(field),variant+field);
  for(const q of content(variant).fills)assert.deepEqual(Object.keys(q).sort(),q.figure?["figure","id","marks","page","prompt","work"]:["id","marks","page","prompt","work"]);
 }
});

test("only the four exact Mathematics slugs resolve; other papers keep their page images",()=>{
 for(const slug of ["eec-english-2020-a","eec-math-2020","eec-math-2020-e","constructor","__proto__"])assert.equal(mathPaperContent(slug),null);
});

test("independently worked answers agree with the official key through the option order",()=>{
 const expected={1:{A:"$1$",B:"$1$",C:"$1$",D:"$1$"},7:{A:"$15$",B:"$29$",C:"$15$",D:"$29$"},13:{A:"$2$",B:"$4$",C:"$2$",D:"$4$"},21:{A:"$23$",B:"$25$",C:"$23$",D:"$25$"},28:{A:"$0$",B:"$4$",C:"$4$",D:"$0$"},29:{A:"$4$",B:"$2$",C:"$4$",D:"$2$"},30:{A:"$2$",B:"$1$",C:"$1$",D:"$2$"},33:{A:String.raw`$\frac{16}{45}$`,B:String.raw`$\frac{19}{50}$`,C:String.raw`$\frac{16}{45}$`,D:String.raw`$\frac{19}{50}$`},34:{A:String.raw`$32\pi$`,B:String.raw`$108\pi$`,C:String.raw`$108\pi$`,D:String.raw`$32\pi$`}};
 for(const [id,byVariant] of Object.entries(expected))for(const variant of variants)assert.equal(keyed(variant,id),byVariant[variant],variant+" Q"+id);
});

test("A14 and A22 are corrected from the printed key, and only they are",()=>{
 const printed="BCDAEDCDAEDCBBCBEACDECCBDEDCDADACBEA".split("");
 assert.deepEqual(officialKeys.A.corrections,[{id:"14",printed:"B",answer:"D"},{id:"22",printed:"C",answer:"A"}]);
 officialKeys.A.choices.forEach((answer,i)=>assert.equal(answer,officialKeys.A.corrections.find(item=>item.id===String(i+1))?.answer??printed[i]));
 for(const variant of ["B","C","D"])assert.equal(officialKeys[variant].corrections,undefined);
 const {a,b}={a:"$a$",b:"$b$"};
 for(const [variant,value] of [["A",b],["B",a],["C",a],["D",b]])assert.equal(keyed(variant,14),value);
 for(const variant of variants)assert.equal(keyed(variant,22),"$10$");
});
