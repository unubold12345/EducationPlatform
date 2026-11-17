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
 const heard=exam.stages.find(stage=>stage.id==='hsk-l')?.questions.length??20;
 const read=exam.stages.find(stage=>stage.id==='hsk-r')?.questions.length??20;
 // Each section is out of 100, so an item's worth depends on the section's length (HSK 2: 35 heard, 25 read).
 const perItem=[...new Set([heard,read].map(count=>Number((100/Math.max(1,count)).toFixed(2))))].join(' / ');
 const level=hskLevel(exam.slug);
 return <div className="container page-space hsk-hub">
  <Link className="text-link" href="/exams/hsk">← HSK</Link>
  <header className="hsk-hub-head"><p className="eyebrow">汉语水平考试 · HSK {level} · {gate.free?'ҮНЭГҮЙ ХАГАС MOCK':'БҮТЭН MOCK'}</p><h1>{exam.title}</h1><p>{exam.description}. Сонсох → унших. Албан бүтцээр бэлдэж, алдсан хэсгээ цаггүй горимд давтаарай.</p></header>
  <div className="exam-briefing-layout"><section><h2>Хэсэг ба хугацаа</h2><ol className="exam-stage-plan">{exam.stages.map(stage=><li key={stage.id}><strong>{stage.title}</strong><span>{stage.questions.length} асуулт · {stage.seconds/60} мин</span></li>)}</ol>
   <h2>Бүтэц</h2><ul className="hsk-structure">{level===2?<><li><strong>Сонсох 1–{heard}</strong>: зураг ба өгүүлбэр (√/×), яриаг зурагтай холбох, богино яриа, урт яриа.</li><li><strong>Унших {heard+1}–{heard+read}</strong>: өгүүлбэрийг зурагтай холбох, хоосон зай нөхөх, текст ба ★ өгүүлбэр (√/×), өгүүлбэр холбох.</li></>:<><li><strong>Сонсох 1–{heard}</strong>: зураг ба хэллэг (√/×), зураг сонгох, яриаг зурагтай холбох, богино асуулт.</li><li><strong>Унших {heard+1}–{heard+read}</strong>: зураг ба үг (√/×), өгүүлбэрийг зурагтай холбох, асуулт-хариулт, хоосон зай нөхөх.</li></>}<li>Бүх ханз pinyin-тэй (нууж болно). Хэсэг бүр жишээтэй.</li></ul>
   <p className="hsk-note">Сонсох: дөрвөн бичлэг, ойролцоогоор {recordedMinutes} минутын хятад хиймэл audio; асуулт бүрийг хоёр удаа уншина. Цагтай горимд нэг удаа тоглоно; үлдсэн хугацаанд хариугаа шалгана. Refresh хийвэл серверийн байрлалаас үргэлжилнэ. Дадлагад тухайн асуултыг дахин сонсож, шалгасны дараа текстийг харна.</p>
  </section><aside><p>{exam.points} асуулт · {minutes} минут · {gate.free?'Үнэгүй':MOCK_PRICE_TERM}</p>{gate.activeAttemptId?<Link className="button" href={'/exams/attempts/'+gate.activeAttemptId}>Нээлттэй шалгалтаа үргэлжлүүлэх →</Link>:null}<ExamStart slug={exam.slug} program="hsk" hasAccess={gate.hasAccess} loggedIn={loggedIn} free={gate.free} pick={gate.pick} plan={gate.plan} pickedUntil={gate.pickedUntil}/><PracticeEntry slug={exam.slug} hasAccess={gate.practice} locked={gate.locked}/></aside></div>
  <section><h2>Эхлэхээс өмнө</h2><ul><li>Хэсэг дуусахаас өмнө цаг алгасах, дууссан хэсэг рүү буцах боломжгүй.</li><li>Хариу автоматаар хадгалагдана. Нээлттэй шалгалтын үеэр дадлага, AI туслах хаалттай.</li><li>Зөв хариултын тоо ({heard+read}-өөс), хэсэг бүрийн 100 онооны дадлагын хөрвүүлэлт (зөв × {perItem}). Албан HSK оноо, тэнцсэн эсэх биш.</li><li>Бүх асуулт, зураг эх зохиомжтой; хятад хэлний багшийн хяналт, аудионы хүний сонсголын шалгалт хүлээгдэж байна.</li></ul></section>
  <details><summary>Бүтцийн эх сурвалж</summary>{exam.sources.map(source=><p key={source.url}><a className="text-link" href={source.url} target="_blank" rel="noopener noreferrer">{source.label} ↗</a></p>)}</details>
 </div>;
}
