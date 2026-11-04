import { variantA } from "./a.ts";
import { variantB } from "./b.ts";
import { variantC } from "./c.ts";
import { variantD } from "./d.ts";
import type { PaperVariantContent } from "./types.ts";
const r=String.raw;
// Page 1 is identical in all four variants. The sine rule's "sin x" is printed so in the source.
export const mathFormulaSheet={
 title:"Даалгавар гүйцэтгэхэд хэрэглэгдэх зарим томьёо",
 items:[
  r`Синусын теорем: $\frac{a}{\sin x}=\frac{b}{\sin\beta}=\frac{c}{\sin\gamma}=2R$`,
  r`Өгөгдлийн шинжилгээ: Арифметик дундаж $\bar x=\frac{\sum x}{n}$; Стандарт хазайлт $\text{С.Х}=\sqrt{\frac1n\sum x^2-\left(\bar x\right)^2}$`,
  r`$y=f(x)$ функцийн графикийн $M_0\left(x_0;y_0\right)$ цэгт татсан шүргэгч шулууны тэгшитгэл нь $y-y_0=m\left(x-x_0\right)$ байна.`,
 ],
};
export const mathPartOneNote="Даалгаврыг гүйцэтгээд зөвхөн нэг зөв хариултыг сонгож хариултын хуудсанд зааврын дагуу будаарай. Зураг бодит хэмжээгээр өгөөгүй гэдгийг санаарай!";
const variants:Record<string,PaperVariantContent>={"eec-math-2020-a":variantA,"eec-math-2020-b":variantB,"eec-math-2020-c":variantC,"eec-math-2020-d":variantD};
// Resolved by slug, so saved attempts whose snapshots hold only page URLs show the same paper.
export function mathPaperContent(slug:string):PaperVariantContent|null{return Object.hasOwn(variants,slug)?variants[slug]:null;}
