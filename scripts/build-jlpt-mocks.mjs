// Convert offline authoring packs to private site definitions. Never ship MockExmps itself.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
const target=join(process.cwd(),'assets','jlpt');
mkdirSync(target,{recursive:true});
const labels={
 'kanji-reading':'漢字の読み · Ханзын уншлага','orthography':'表記 · Зөв бичлэг',
 context:'文脈 · Үг сонгох',paraphrase:'言い換え · Ижил утга',usage:'用法 · Үгийн хэрэглээ',
 'grammar-form':'文法 · Хэлзүй','sentence-order':'文の組み立て · Өгүүлбэр бүтээх',
 'text-grammar':'文章の文法 · Эхийн хэлзүй','short-reading':'短文 · Богино эх',
 'medium-reading':'中文 · Дунд эх','information-retrieval':'情報検索 · Мэдээлэл олох',
 'task-comprehension':'課題理解 · Үйлдэл сонгох','key-points':'ポイント理解 · Гол мэдээлэл',
 'verbal-expressions':'発話表現 · Юу хэлэх вэ','quick-response':'即時応答 · Шуурхай хариу',
};
const catalog=[];
for(const level of ['N5','N4'])for(let number=1;number<=3;number++){
 const source=JSON.parse(readFileSync(join('MockExmps','JLPT',level,`mock-0${number}`,'mock.json'),'utf8'));
 const slug=source.id;
 const definition={slug,version:1,program:'jlpt',title:`JLPT ${level} · Mock 0${number}`,description:source.theme,
  points:source.itemCount,notes:['Албан бус, эх зохиомжтой дадлагын mock. Япон хэлний багшийн хяналт хүлээгдэж байна.','Listening нь хиймэл япон дуу хоолойтой. Зургийн оронд нөхцөлийн текст ашигласан.','Raw зөв хариултын тоо; JLPT-ийн 180 оноо, тэнцсэн эсэхийг тооцохгүй.'],
  sources:source.referenceUrls.slice(0,2).map((url,i)=>({label:i?'JLPT · шинэчилсэн бүтэц':'JLPT · албан бүтэц',url})),stages:[]};
 for(const section of source.sections){
  const listening=section.id==='L';
  const stage={id:`jlpt-${section.id.toLowerCase()}`,title:section.id==='V'?'文字・語彙 · Үгийн сан':section.id==='G'?'文法・読解 · Хэлзүй, унших':'聴解 · Сонсох',
   kind:listening?'listening':'questions',seconds:section.minutes*60,
   instructions:listening?'Бичлэг нэг удаа, серверийн цагтай зэрэг тоглоно. 1–2-р бүлгийн сонголт бичгээр; 3–4-р бүлгийн сонголт зөвхөн дуугаар. Дууссан хэсэг рүү буцахгүй.':'Нэг зөв хариу сонгоно. ★ нь гурав дахь хоосон зай. Одоогийн хэсэг дотор чөлөөтэй шилжинэ. Цаг дуусахад дараагийн хэсэг автоматаар эхэлнэ.',
   groups:[],questions:[]};
  for(const group of section.groups){
   const groupId=`${stage.id}-${group.number}`;
   stage.groups.push({id:groupId,title:labels[group.type],section:labels[group.type],instructions:group.instructions,pageMode:'single'});
   for(const q of group.questions){
    const spoken=listening&&q.delivery==='spoken-options';
    const item={id:q.id,number:section.id+String(q.number).padStart(2,'0'),domain:labels[group.type],kind:'choice',points:1,groupId,
     prompt:group.type==='quick-response'?'音声を聞いて、返事を選んでください。':q.prompt,
     options:spoken?q.choices.map((_,i)=>String(i+1)):q.choices,
     optionLabels:q.choices.map((_,i)=>String(i+1)),
     answers:[spoken?String(q.answer):q.choices[q.answer-1]],
     answerDisplay:`${q.answer}. ${q.choices[q.answer-1]}`,
     explanation:q.explanation+(q.solutionSentence?`\n${q.solutionSentence}`:''),
     ...(q.passage?{passage:q.passage}:{}),
     ...(listening?{listening:{part:group.number,script:q.examinerReadout}}:{})};
    // Printed questions are not supplied for listening groups 1–2; only the recording asks them.
    if(listening&&!spoken)item.prompt='音声の質問に答えてください。';
    stage.questions.push(item);
   }
  }
  definition.stages.push(stage);
 }
 const count=definition.stages.reduce((sum,s)=>sum+s.questions.length,0);
 if(count!==source.itemCount)throw Error(slug+' count');
 writeFileSync(join(target,slug+'.json'),JSON.stringify(definition,null,2)+'\n');
 catalog.push({slug,level,number,title:definition.title,theme:source.theme,questions:count,minutes:level==='N5'?90:115});
}
writeFileSync(join('src','modules','exams','jlpt','catalog.json'),JSON.stringify(catalog,null,2)+'\n');
console.log('Built six private JLPT definitions, 456 questions.');
