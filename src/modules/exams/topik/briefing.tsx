import Link from 'next/link';
import type { ExamDefinition } from '../types';
import { ExamStart } from '../start-client';
import type { BriefingAccess } from '@/modules/subscriptions/briefing-access';
import { PracticeEntry } from '@/modules/exam-practice/entry';
import { MOCK_PRICE_TERM } from '../pricing';
import { listeningParts } from '../audio-files';
import { TOPIK_LEVELS, topikLevel, topikMocks, topikName } from './catalog';
import './topik.css';

export function TopikBriefing({exam,gate,loggedIn}:{exam:ExamDefinition;gate:BriefingAccess;loggedIn:boolean}){
 const level=topikLevel(exam.slug);
 const recordedMinutes=Math.ceil(listeningParts(exam.slug).reduce((sum,seconds)=>sum+seconds,0)/60);
 const minutes=exam.stages.reduce((sum,stage)=>sum+stage.seconds,0)/60;
 const count=exam.stages.reduce((sum,stage)=>sum+stage.questions.length,0);
 // The hub card shows three lines of the topic list; the whole list is here.
 const topics=topikMocks.find(mock=>mock.slug===exam.slug)?.topics;
 return <div className="container page-space topik-hub">
  <Link className="text-link" href="/exams/topik">← TOPIK</Link>
  <header className="topik-hub-head"><p className="eyebrow" lang="ko">한국어능력시험 · {topikName(level)} · БҮТЭН MOCK</p><h1>{exam.title}</h1><p>{exam.description}. Албан PBT шалгалтын хэсэг, хугацаа, заавар, асуултын дараалал, оноогоор.</p>{topics?<p><strong>Сэдвүүд:</strong> {topics}</p>:null}</header>
  <div className="exam-briefing-layout"><section><h2>Хэсэг ба хугацаа</h2><ol className="exam-stage-plan">{exam.stages.map(stage=><li key={stage.id}><strong>{stage.title}</strong><span>{stage.questions.length} асуулт · {stage.seconds/60} мин</span></li>)}</ol>
   <h2>Бүтэц</h2>{level===1?<ul className="topik-structure">
    <li><strong>듣기 1–30</strong>: асуултын хариулт, үргэлжлэх үг, газар, сэдэв, зураг, агуулга таарах, гол санаа, зарлал, яриа, ярилцлага. Бүх бичлэгийг хоёр удаа уншина.</li>
    <li><strong>읽기 31–70</strong>: сэдэв, хоосон зай (нөхцөл, үг, үйл үг), зар мэдээ, агуулга, гол санаа, богино бичвэрүүд, дараалал, өгүүлбэр байрлуулах.</li>
    <li>Асуулт бүр 2–4 оноо (албан хуудасны адил); 200 оноо. 1-р түвшин {TOPIK_LEVELS[1][0].min}, 2-р түвшин {TOPIK_LEVELS[1][1].min}-өөс.</li>
   </ul>:<ul className="topik-structure">
    <li><strong>듣기 1–50</strong>: зураг ба график, дараагийн үг, дараагийн үйлдэл, агуулга, гол санаа, ярилцлага, мэтгэлцээн, лекц, баримтат нэвтрүүлэг. 1–20-ыг нэг удаа, 21–50-ыг хоёр удаа уншина.</li>
    <li><strong>쓰기 51–54</strong>: хоёр өгүүлбэр нөхөх (10 + 10), график тайлбарлах 200–300 тэмдэгт (30), санал бодлын эссэ 600–700 тэмдэгт (50).</li>
    <li><strong>읽기 1–50</strong>: хэлзүй, зар, график, дараалал, хоосон зай, сонины гарчиг, сэдэв, өгүүлбэр байрлуулах, уран зохиол, нийтлэл.</li>
    <li>Асуулт бүр 2 оноо, бичих 100; нийт 300. 3-р түвшин {TOPIK_LEVELS[2][0].min}, 4-р {TOPIK_LEVELS[2][1].min}, 5-р {TOPIK_LEVELS[2][2].min}, 6-р {TOPIK_LEVELS[2][3].min}-аас.</li>
   </ul>}
   <p className="topik-note">Сонсох: дөрвөн бичлэг дараалан, ойролцоогоор {recordedMinutes} минутын солонгос хиймэл audio. Цагтай горимд нэг удаа тоглоно; хуудас тоглож буй асуулт руу шилжинэ. Refresh хийвэл серверийн байрлалаас үргэлжилнэ. Дадлагад тухайн бичлэгийг дахин сонсож, шалгасны дараа текстийг харна.</p>
  </section><aside><p>{count} асуулт · {minutes} минут · {gate.free?'Үнэгүй':MOCK_PRICE_TERM}</p>{gate.activeAttemptId?<Link className="button" href={'/exams/attempts/'+gate.activeAttemptId}>Нээлттэй шалгалтаа үргэлжлүүлэх →</Link>:null}<ExamStart slug={exam.slug} program="topik" hasAccess={gate.hasAccess} loggedIn={loggedIn} free={gate.free} pick={gate.pick} plan={gate.plan} pickedUntil={gate.pickedUntil}/><PracticeEntry slug={exam.slug} hasAccess={gate.practice} locked={gate.locked}/></aside></div>
  <section><h2>Эхлэхээс өмнө</h2><ul><li>Хэсэг дуусахаас өмнө цаг алгасах, дууссан хэсэг рүү буцах боломжгүй. Шалгалтыг хүссэн үедээ зогсоож болох ч зогсоосон оролдлогын хариу, оноо хадгалагдахгүй.{level===2?' Албан шалгалтын 1-р цагийн адил сонсох, бичих хэсэг дараалан, дараа нь унших.':' Сонсох дуусмагц унших хэсэг эхэлнэ.'}</li><li>Хариу автоматаар хадгалагдана. Нээлттэй шалгалтын үеэр дадлага, AI туслах хаалттай.</li><li>{level===2?'Сонсох, унших хэсгийг асуултын оноогоор автоматаар бодно. Бичих хэсгийг дууссаны дараа жишиг хариу, шалгуураар өөрөө үнэлж, AI-тай задлаж болно.':'Асуулт бүрийн албан оноогоор (2, 3, 4) бодно.'} Албан TOPIK оноо, түвшин биш.</li><li>Бүх асуулт, бичвэр, зураг эх зохиомжтой; албан TOPIK-ийн нийтэлсэн асуултыг хуулаагүй. Солонгос хэлний багшийн хяналт хүлээгдэж байна.</li></ul></section>
  <details><summary>Бүтцийн эх сурвалж</summary>{exam.sources.map(source=><p key={source.url}><a className="text-link" href={source.url} target="_blank" rel="noopener noreferrer">{source.label} ↗</a></p>)}</details>
 </div>;
}
