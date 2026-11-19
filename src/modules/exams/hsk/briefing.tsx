import Link from 'next/link';
import type { ExamDefinition } from '../types';
import { ExamStart } from '../start-client';
import type { BriefingAccess } from '@/modules/subscriptions/briefing-access';
import { PracticeEntry } from '@/modules/exam-practice/entry';
import { MOCK_PRICE_TERM } from '../pricing';
import { listeningParts } from '../audio-files';
import { hskLevel } from './catalog';
import './hsk.css';
export function HskBriefing({exam,gate,loggedIn}:{exam:ExamDefinition;gate:BriefingAccess;loggedIn:boolean}){
 const recordedMinutes=Math.ceil(listeningParts(exam.slug).reduce((sum,seconds)=>sum+seconds,0)/60);
 const minutes=exam.stages.reduce((sum,stage)=>sum+stage.seconds,0)/60;
 // Each section is out of 100, so an item's worth depends on the section's length (HSK 3.0 HSK 2: 25 / 25 / 10).
 const perItem=[...new Set(exam.stages.map(stage=>Number((100/Math.max(1,stage.questions.length)).toFixed(2))))].join(' / ');
 const heardParts=new Set((exam.stages.find(stage=>stage.id==='hsk-l')?.groups??[]).map(group=>group.title.split(' · ')[0])).size;
 // The paper's structure from its own groups: "第二部分 · Яриа ба зураг (6–10)" → "Яриа ба зураг", once per part.
 const plan=exam.stages.map(stage=>({stage,first:stage.questions[0]?.number,last:stage.questions.at(-1)?.number,parts:[...new Set((stage.groups??[]).map(group=>(group.title.split(' · ')[1]??group.title).replace(/\s*\([^)]*\)$/,'')))]}));
 const level=hskLevel(exam.slug);
 return <div className="container page-space hsk-hub">
  <Link className="text-link" href="/exams/hsk">← HSK</Link>
  <header className="hsk-hub-head"><p className="eyebrow">汉语水平考试 · HSK {level} · {gate.free?'ҮНЭГҮЙ ХАГАС MOCK':'БҮТЭН MOCK'}</p><h1>{exam.title}</h1><p>{exam.description}. {exam.stages.map(stage=>(stage.title.split(' · ')[1]??stage.title).toLowerCase()).join(' → ')}. Албан бүтцээр бэлдэж, алдсан хэсгээ цаггүй горимд давтаарай.</p></header>
  <div className="exam-briefing-layout"><section><h2>Хэсэг ба хугацаа</h2><ol className="exam-stage-plan">{exam.stages.map(stage=><li key={stage.id}><strong>{stage.title}</strong><span>{stage.questions.length} асуулт · {stage.seconds/60} мин</span></li>)}</ol>
   <h2>Бүтэц</h2><ul className="hsk-structure">{plan.map(({stage,first,last,parts})=><li key={stage.id}><strong>{stage.title.split(' · ')[1]??stage.title} {first}–{last}</strong>: {parts.join(', ').toLowerCase()}.</li>)}<li>Бүх ханз pinyin-тэй (нууж болно). Хэсэг бүр жишээтэй. Хэсэг бүр 100 оноо: зөв хариулт бүр {perItem}.</li>{exam.stages.some(stage=>stage.id==='hsk-w')?<li>Бичих хэсгийн сүүлийн даалгаварт ханзыг гараас бичнэ: хятад (pinyin) гарын оролт хэрэгтэй.</li>:null}</ul>
   <p className="hsk-note">Сонсох: {heardParts===3?'гурван':'дөрвөн'} бичлэг, ойролцоогоор {recordedMinutes} минутын хятад хиймэл audio; асуулт бүрийг хоёр удаа уншина. Цагтай горимд нэг удаа тоглоно; үлдсэн хугацаанд хариугаа шалгана. Refresh хийвэл серверийн байрлалаас үргэлжилнэ. Дадлагад тухайн асуултыг дахин сонсож, шалгасны дараа текстийг харна.</p>
  </section><aside><p>{exam.points} асуулт · {minutes} минут · {gate.free?'Үнэгүй':MOCK_PRICE_TERM}</p>{gate.activeAttemptId?<Link className="button" href={'/exams/attempts/'+gate.activeAttemptId}>Нээлттэй шалгалтаа үргэлжлүүлэх →</Link>:null}<ExamStart slug={exam.slug} program="hsk" hasAccess={gate.hasAccess} loggedIn={loggedIn} free={gate.free} pick={gate.pick} plan={gate.plan} pickedUntil={gate.pickedUntil}/><PracticeEntry slug={exam.slug} hasAccess={gate.practice} locked={gate.locked}/></aside></div>
  <section><h2>Эхлэхээс өмнө</h2><ul><li>Хэсэг дуусахаас өмнө цаг алгасах, дууссан хэсэг рүү буцах боломжгүй. Шалгалтыг хүссэн үедээ зогсоож болох ч зогсоосон оролдлогын хариу, оноо хадгалагдахгүй.</li><li>Хариу автоматаар хадгалагдана. Нээлттэй шалгалтын үеэр дадлага, AI туслах хаалттай.</li><li>Зөв хариултын тоо ({exam.points}-аас), хэсэг бүрийн 100 онооны дадлагын хөрвүүлэлт (зөв × {perItem}). Албан HSK оноо, тэнцсэн эсэх биш.</li><li>Бүх асуулт, зураг эх зохиомжтой; хятад хэлний багшийн хяналт, аудионы хүний сонсголын шалгалт хүлээгдэж байна.</li></ul></section>
  <details><summary>Бүтцийн эх сурвалж</summary>{exam.sources.map(source=><p key={source.url}><a className="text-link" href={source.url} target="_blank" rel="noopener noreferrer">{source.label} ↗</a></p>)}</details>
 </div>;
}
