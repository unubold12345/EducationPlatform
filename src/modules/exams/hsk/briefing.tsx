import Link from 'next/link';
import type { ExamDefinition } from '../types';
import { ExamStart } from '../start-client';
import { PracticeEntry } from '@/modules/exam-practice/entry';
import { MOCK_PRICE_LABEL } from '../pricing';
import { listeningParts } from '../audio-files';
import './hsk.css';
export function HskBriefing({exam,hasAccess,loggedIn,activeAttemptId}:{exam:ExamDefinition;hasAccess:boolean;loggedIn:boolean;activeAttemptId?:string}){
 const recordedMinutes=Math.ceil(listeningParts(exam.slug).reduce((sum,seconds)=>sum+seconds,0)/60);
 const minutes=exam.stages.reduce((sum,stage)=>sum+stage.seconds,0)/60;
 return <div className="container page-space hsk-hub">
  <Link className="text-link" href="/exams/hsk">← HSK 1</Link>
  <header className="hsk-hub-head"><p className="eyebrow">汉语水平考试 · HSK 1 · БҮТЭН MOCK</p><h1>{exam.title}</h1><p>{exam.description}. Сонсох → унших. Албан бүтцээр бэлдэж, алдсан хэсгээ цаггүй горимд давтаарай.</p></header>
  <div className="exam-briefing-layout"><section><h2>Хэсэг ба хугацаа</h2><ol className="exam-stage-plan">{exam.stages.map(stage=><li key={stage.id}><strong>{stage.title}</strong><span>{stage.questions.length} асуулт · {stage.seconds/60} мин</span></li>)}</ol>
   <h2>Бүтэц</h2><ul className="hsk-structure"><li><strong>Сонсох 1–20</strong>: зураг ба хэллэг (√/×), зураг сонгох, яриаг зурагтай холбох, богино асуулт.</li><li><strong>Унших 21–40</strong>: зураг ба үг (√/×), өгүүлбэрийг зурагтай холбох, асуулт-хариулт, хоосон зай нөхөх.</li><li>Бүх ханз pinyin-тэй (нууж болно). Хэсэг бүр жишээтэй.</li></ul>
   <p className="hsk-note">Сонсох: дөрвөн бичлэг, ойролцоогоор {recordedMinutes} минутын хятад хиймэл audio; асуулт бүрийг хоёр удаа уншина. Цагтай горимд нэг удаа тоглоно; үлдсэн хугацаанд хариугаа шалгана. Refresh хийвэл серверийн байрлалаас үргэлжилнэ. Дадлагад тухайн асуултыг дахин сонсож, шалгасны дараа текстийг харна.</p>
  </section><aside><p>{exam.points} асуулт · {minutes} минут · {MOCK_PRICE_LABEL}</p>{activeAttemptId?<Link className="button" href={'/exams/attempts/'+activeAttemptId}>Нээлттэй шалгалтаа үргэлжлүүлэх →</Link>:null}<ExamStart slug={exam.slug} program="hsk" hasAccess={hasAccess} loggedIn={loggedIn}/><PracticeEntry slug={exam.slug} hasAccess={hasAccess}/></aside></div>
  <section><h2>Эхлэхээс өмнө</h2><ul><li>Хэсэг дуусахаас өмнө цаг алгасах, дууссан хэсэг рүү буцах боломжгүй.</li><li>Хариу автоматаар хадгалагдана. Нээлттэй шалгалтын үеэр дадлага, AI туслах хаалттай.</li><li>Зөв хариултын тоо (40-өөс), хэсэг бүрийн 100 онооны дадлагын хөрвүүлэлт (зөв × 5). Албан HSK оноо, тэнцсэн эсэх биш.</li><li>Бүх асуулт, зураг эх зохиомжтой; хятад хэлний багшийн хяналт, аудионы хүний сонсголын шалгалт хүлээгдэж байна.</li></ul></section>
  <details><summary>Бүтцийн эх сурвалж</summary>{exam.sources.map(source=><p key={source.url}><a className="text-link" href={source.url} target="_blank" rel="noopener noreferrer">{source.label} ↗</a></p>)}</details>
 </div>;
}
