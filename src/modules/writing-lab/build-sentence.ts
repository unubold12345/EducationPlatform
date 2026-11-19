// TOEFL iBT Build a Sentence practice for the TOEFL Essay Studio (owner request 2026-11-19). Original items written for the
// studio (none is taken from the nine TOEFL mocks), checked in the browser with no AI: the placed boxes either rebuild the
// reply or they do not. Pure and dependency-free: Node's test runner imports this file directly.
import {buildSlots} from "../exams/toefl/slots.ts";

export type BuildFocus="statement"|"negation"|"yes_no_question"|"wh_question"|"embedded_question"|"perfect"|"passive"|"relative_clause"|"comparative"|"conditional"|"request"|"suggestion"|"advice"|"reported_speech"|"superlative";
/**
 * One item. `chips` are the reply's boxes in the right order; `prefix` and `suffix` are printed around the boxes; `extra` is one
 * box that does not belong. `answer` is the whole reply, which the chips, prefix and suffix must rebuild exactly.
 */
export type BuildItem={id:string;context:string;answer:string;chips:string[];prefix?:string;suffix?:string;extra?:string;focus:BuildFocus};
export type BuildSet={id:string;title:string;items:BuildItem[]};

/** What to look at when an item is wrong, in Mongolian. */
export const BUILD_FOCUS:Record<BuildFocus,string>={
 statement:"Хүүрнэх өгүүлбэр: өгүүлэгдэхүүн → үйл үг → тусагдахуун → нэмэлт.",
 negation:"Үгүйсгэл: туслах үйл үг + not (didn't, doesn't) үндсэн үйл үгийн өмнө.",
 yes_no_question:"Тийм/үгүй асуулт: туслах үйл үг өгүүлэгдэхүүний өмнө (Did you…? Was it…?).",
 wh_question:"Асуух үгтэй асуулт: асуух үг → туслах үйл үг → өгүүлэгдэхүүн → үйл үг.",
 embedded_question:"Шууд бус асуулт: if/when-ийн дараа энгийн дараалал (…if it will happen, …if they are included).",
 perfect:"Төгс цаг: have/has + been эсвэл үйл үгийн III хэлбэр.",
 passive:"Үйлдэгдэх хэв: be + үйл үгийн III хэлбэр (was moved, are being repaired).",
 relative_clause:"Тодотгол өгүүлбэр: that/whose хэсэг тодотгож буй нэрийнхээ дараа, үндсэн үйл үг сүүлд.",
 comparative:"Харьцуулалт: харьцуулах зэрэг + than + харьцуулж буй зүйл.",
 conditional:"Нөхцөл: If хэсэг нөхцөлийг, үндсэн хэсэг (will/would) үр дүнг хэлнэ.",
 request:"Хүсэлт: Could you / Do you want me to + үйл үгийн үндсэн хэлбэр.",
 suggestion:"Санал: How about + нэр үг.",
 advice:"Зөвлөгөө: You should + үйл үгийн үндсэн хэлбэр.",
 reported_speech:"Дам яриа: said (that) + өгүүлэгдэхүүн + өнгөрсөн цагийн үйл үг.",
 superlative:"Онцлох зэрэг: the best + нэр үг + тодотгол хэсэг.",
};

export const BUILD_SETS:BuildSet[]=[
 {id:"campus",title:"Сургуулийн амьдрал",items:[
  {id:"campus-01",context:"Did you finish the lab report?",answer:"Not yet, I still need to add the final graph.",prefix:"Not yet,",chips:["I","still need","to add","the final","graph"],focus:"statement"},
  {id:"campus-02",context:"The bookstore is having a sale this week.",answer:"Do you know if textbooks are included?",chips:["do you","know","if","textbooks","are","included"],extra:"does",focus:"embedded_question"},
  {id:"campus-03",context:"I heard the professor changed the exam date.",answer:"Was it moved to next week?",chips:["was it","moved","to","next week"],extra:"did",focus:"passive"},
  {id:"campus-04",context:"Why weren't you at the meeting yesterday?",answer:"Sorry, I had to go to the dentist.",prefix:"Sorry,",chips:["I","had","to go","to","the dentist"],extra:"going",focus:"statement"},
  {id:"campus-05",context:"This coffee machine never works.",answer:"I know, it has been broken since Monday.",prefix:"I know,",chips:["it","has","been","broken"],suffix:"since Monday",focus:"perfect"},
  {id:"campus-06",context:"Can I borrow your notes from Tuesday?",answer:"Sure, but I will need them back before the quiz.",prefix:"Sure, but",chips:["I","will need","them","back"],suffix:"before the quiz",focus:"statement"},
  {id:"campus-07",context:"Where should we meet for the project?",answer:"How about the study room on the second floor?",chips:["how about","the","study room","on","the second floor"],focus:"suggestion"},
  {id:"campus-08",context:"I can't decide which elective to take.",answer:"The one that Professor Lee teaches is really popular.",chips:["the one","that","Professor Lee","teaches","is","really popular"],extra:"who",focus:"relative_clause"},
  {id:"campus-09",context:"My laptop battery died during class.",answer:"Did you forget to charge it last night?",chips:["did you","forget","to charge","it"],suffix:"last night",extra:"charging",focus:"yes_no_question"},
  {id:"campus-10",context:"The library closes at six on Saturdays.",answer:"Oh, I didn't realize it closed so early.",prefix:"Oh,",chips:["I","didn't","realize","it","closed","so early"],focus:"negation"},
 ]},
 {id:"daily",title:"Ажил, өдөр тутам",items:[
  {id:"daily-01",context:"How was your first day at the new job?",answer:"It was busier than I expected.",chips:["it","was","busier","than","I","expected"],extra:"more",focus:"comparative"},
  {id:"daily-02",context:"I'm going to the post office later.",answer:"Could you mail this letter for me?",chips:["could you","mail","this letter","for me"],extra:"to mail",focus:"request"},
  {id:"daily-03",context:"Have you seen the new art exhibit downtown?",answer:"No, but my sister said it was amazing.",prefix:"No, but",chips:["my sister","said","it","was","amazing"],focus:"reported_speech"},
  {id:"daily-04",context:"The train was forty minutes late this morning.",answer:"Did they say if it will happen again?",chips:["did they","say","if","it","will happen","again"],extra:"will it",focus:"embedded_question"},
  {id:"daily-05",context:"Our manager wants the report by Thursday.",answer:"That doesn't give us much time.",chips:["that","doesn't","give","us","much time"],focus:"negation"},
  {id:"daily-06",context:"I'm thinking about selling my old bike.",answer:"How much are you going to ask for it?",chips:["how much","are you","going to","ask","for it"],extra:"do",focus:"wh_question"},
  {id:"daily-07",context:"The new café on Maple Street just opened.",answer:"I have already been there twice.",chips:["I","have","already","been","there"],suffix:"twice",focus:"perfect"},
  {id:"daily-08",context:"Do you need help carrying those boxes?",answer:"Thanks, the big one is too heavy for me.",prefix:"Thanks,",chips:["the big one","is","too heavy","for me"],focus:"statement"},
  {id:"daily-09",context:"Why is the street closed today?",answer:"I think the water pipes are being repaired this week.",prefix:"I think",chips:["the water pipes","are","being","repaired"],suffix:"this week",extra:"repairing",focus:"passive"},
  {id:"daily-10",context:"I missed the bus again this morning.",answer:"If you leave five minutes earlier, you will catch it.",prefix:"If you leave five minutes earlier,",chips:["you","will","catch","it"],extra:"would",focus:"conditional"},
 ]},
 {id:"study",title:"Хичээл, төлөвлөгөө",items:[
  {id:"study-01",context:"Are you taking any classes this summer?",answer:"Yes, I signed up for an online statistics course.",prefix:"Yes,",chips:["I","signed up","for","an online","statistics course"],focus:"statement"},
  {id:"study-02",context:"The professor posted the reading list.",answer:"How many books do we have to read?",chips:["how many","books","do we","have to","read"],extra:"are",focus:"wh_question"},
  {id:"study-03",context:"I'm worried about my presentation tomorrow.",answer:"You should practice it in front of a friend.",chips:["you","should","practice","it","in front of","a friend"],extra:"to",focus:"advice"},
  {id:"study-04",context:"Is Professor Kim's office hour still on Tuesday?",answer:"No, it was changed to Wednesday afternoon.",prefix:"No,",chips:["it","was","changed","to","Wednesday afternoon"],focus:"passive"},
  {id:"study-05",context:"Did you enjoy the guest lecture?",answer:"Yes, it was the best talk I have attended this year.",prefix:"Yes,",chips:["it","was","the best","talk","I have","attended"],suffix:"this year",extra:"better",focus:"superlative"},
  {id:"study-06",context:"I don't know where to find a part-time job.",answer:"Have you checked the job board in the student center?",chips:["have you","checked","the job board","in","the student center"],focus:"perfect"},
  {id:"study-07",context:"Why did you change your major?",answer:"I realized that I enjoyed economics more.",chips:["I","realized","that","I","enjoyed","economics","more"],focus:"statement"},
  {id:"study-08",context:"Who is going to lead the discussion next week?",answer:"The student whose notes we borrowed is leading it.",chips:["the student","whose","notes","we","borrowed","is","leading it"],extra:"who",focus:"relative_clause"},
  {id:"study-09",context:"Should I print the essay or send it by email?",answer:"The professor prefers that we submit it online.",chips:["the professor","prefers","that","we","submit","it","online"],focus:"statement"},
  {id:"study-10",context:"I'm not sure I can finish the project alone.",answer:"Do you want me to check your outline first?",chips:["do you","want","me","to check","your outline"],suffix:"first",extra:"I",focus:"request"},
 ]},
];

export const findBuildSet=(id:string)=>BUILD_SETS.find(set=>set.id===id);

// A fixed shuffle per item (a hash of its id), so the server and the browser print the same order.
function seeded(id:string){let h=2166136261;for(const c of id){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return()=>{h^=h<<13;h^=h>>>17;h^=h<<5;return (h>>>0)/4294967296;};}
/** The boxes in the order the student sees them: the chips and the extra box, shuffled, never already in order. */
export function buildDisplay(item:BuildItem):string[] {
 const boxes=[...item.chips,...(item.extra?[item.extra]:[])],random=seeded(item.id);
 for(let i=boxes.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[boxes[i],boxes[j]]=[boxes[j],boxes[i]];}
 if(boxes.slice(0,item.chips.length).every((chip,at)=>chip===item.chips[at]))boxes.push(boxes.shift()!);
 return boxes;
}
/** The item as the mock's Build a Sentence view prints it (`exams/toefl/view.tsx`). */
export function buildTask(item:BuildItem) {
 return {context:item.context,prefix:item.prefix,suffix:item.suffix,end:item.answer.slice(-1),chips:buildDisplay(item),slots:item.chips.length};
}
/** The boxes the student placed, in order (a saved reply is the placed boxes joined by spaces). */
export const placedBoxes=(item:BuildItem,value:string)=>buildSlots(value,buildDisplay(item));
/** Right only when every box is placed, in the reply's order. */
export function buildCorrect(item:BuildItem,value:string) {
 const placed=placedBoxes(item,value);
 return placed.length===item.chips.length&&placed.every((chip,at)=>chip.toLocaleLowerCase("en")===item.chips[at].toLocaleLowerCase("en"));
}
/** The reply the chips, prefix and suffix make, capitalised and punctuated as `answer` must be. */
export function rebuiltAnswer(item:BuildItem) {
 const text=[item.prefix,...item.chips,item.suffix].filter(Boolean).join(" ");
 return text.charAt(0).toLocaleUpperCase("en")+text.slice(1)+item.answer.slice(-1);
}
