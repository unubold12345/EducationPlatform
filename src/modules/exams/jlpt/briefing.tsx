import Link from 'next/link';
import type { ExamDefinition } from '../types';
import { ExamStart } from '../start-client';
import type { BriefingAccess } from '@/modules/subscriptions/briefing-access';
import { PracticeEntry } from '@/modules/exam-practice/entry';
import { MOCK_PRICE_LABEL } from '../pricing';
import { listeningParts } from '../audio-files';
import './jlpt.css';
export function JlptBriefing({exam,gate,loggedIn}:{exam:ExamDefinition;gate:BriefingAccess;loggedIn:boolean}){
 const level=exam.slug.includes('-n4-')?'N4':'N5';
 const recordedMinutes=Math.ceil(listeningParts(exam.slug).reduce((sum,seconds)=>sum+seconds,0)/60);
 return <div className="container page-space jlpt-hub">
  <Link className="text-link" href={'/exams/jlpt?level='+level}>← JLPT {level}</Link>
  <header className="jlpt-hub-head"><p className="eyebrow">日本語 · {level} · {gate.free?'ҮНЭГҮЙ ХАГАС MOCK':'БҮТЭН MOCK'}</p><h1>{exam.title}</h1><p>Үгийн сан → хэлзүй, унших → сонсох. Албан бүтцээр бэлдэж, алдсан чадвараа цаггүй горимд давтаарай.</p></header>
  <div className="exam-briefing-layout"><section><h2>Хэсэг ба хугацаа</h2><ol className="exam-stage-plan">{exam.stages.map(stage=><li key={stage.id}><strong>{stage.title}</strong><span>{stage.questions.length} асуулт · {stage.seconds/60} мин</span></li>)}</ol>
   <h2>Богино, төвлөрсөн дадлага</h2><p>Нэг чадвараа сонгоно. Хариугаа шалгаад тайлбар үзнэ. Алдсан / тэмдэгтэй асуултаа шүүж, дахин ажиллана. Унших эх, холбогдох асуултууд нэг дор; ханзын нэмэлт уншлагыг нууж болно.</p>
   <p className="jlpt-note">Listening: {listeningParts(exam.slug).length} бүлэг, ойролцоогоор {recordedMinutes} минутын япон хиймэл audio. Цагтай горимд нэг удаа; үлдсэн хугацаанд хариугаа шалгана. Refresh хийвэл серверийн байрлалаас үргэлжилнэ. Дадлагад тухайн асуултын эхнээс дахин сонсож, шалгасны дараа текстийг харна. Зургийн оронд нөхцөлийн текст ашигласан.</p>
  </section><aside><p>{exam.points} асуулт · {exam.stages.reduce((sum,stage)=>sum+stage.seconds,0)/60} минут · {gate.free?'Үнэгүй':MOCK_PRICE_LABEL}</p>{gate.activeAttemptId?<Link className="button" href={'/exams/attempts/'+gate.activeAttemptId}>Нээлттэй шалгалтаа үргэлжлүүлэх →</Link>:null}<ExamStart slug={exam.slug} program="jlpt" hasAccess={gate.hasAccess} loggedIn={loggedIn} free={gate.free} pick={gate.pick} plan={gate.plan} pickedUntil={gate.pickedUntil}/><PracticeEntry slug={exam.slug} hasAccess={gate.practice} locked={gate.locked}/></aside></div>
  <section><h2>Эхлэхээс өмнө</h2><ul><li>Хэсэг дуусахаас өмнө цаг алгасах, дууссан хэсэг рүү буцах боломжгүй.</li><li>Хариу автоматаар хадгалагдана. Нээлттэй шалгалтын үеэр дадлага, AI туслах хаалттай.</li><li>Raw оноо, чадвар бүрийн зөв хариултыг харуулна. Албан JLPT оноо, pass/fail биш.</li><li>Бүх асуулт эх зохиомжтой; япон хэлний багшийн хяналт, аудионы хүний сонсголын шалгалт хүлээгдэж байна.</li></ul></section>
  <details><summary>Бүтцийн эх сурвалж</summary>{exam.sources.map(source=><p key={source.url}><a className="text-link" href={source.url} target="_blank" rel="noopener noreferrer">{source.label} ↗</a></p>)}</details>
 </div>;
}
