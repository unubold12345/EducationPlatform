import Link from 'next/link';
import type { ExamDefinition } from '../types';
import { ExamStart } from '../start-client';
import type { BriefingAccess } from '@/modules/subscriptions/briefing-access';
import { PracticeEntry } from '@/modules/exam-practice/entry';
import { MOCK_PRICE_TERM } from '../pricing';
import { toeflMocks } from './catalog';
import './toefl.css';

const minutes=(seconds:number)=>Math.round(seconds/60*10)/10;
/** One TOEFL form's briefing: the 2026 order and times, routing in one sentence, equipment, raw scores and the access gate. */
export function ToeflBriefing({exam,gate,loggedIn}:{exam:ExamDefinition;gate:BriefingAccess;loggedIn:boolean}){
 const mock=toeflMocks.find(item=>item.slug===exam.slug);
 const speaking=exam.stages.filter(stage=>stage.id.startsWith('toefl-s-')).reduce((sum,stage)=>sum+stage.seconds,0);
 const stage=(id:string)=>exam.stages.find(item=>item.id===id);
 const l2=stage('toefl-l2');
 const rows:[string,string,string][]=[
  ['Reading · Module 1','Complete the Words, Read in Daily Life, Academic Passage · 35 асуулт',`${minutes(stage('toefl-r1')?.seconds??0)} мин`],
  ['Reading · Module 2','Lower эсвэл Upper · 15 асуулт',`${minutes(stage('toefl-r2')?.seconds??0)} мин`],
  ['Listening · Module 1','Choose a Response, Conversation, Announcement, Academic Talk · 32 асуулт',`${minutes(stage('toefl-l1')?.seconds??0)} мин`],
  ['Listening · Module 2','Lower эсвэл Upper · 15 асуулт',l2?.variantSeconds?`${minutes(l2.variantSeconds.lower)} / ${minutes(l2.variantSeconds.higher)} мин`:''],
  ['Writing · Build a Sentence','10 өгүүлбэр',`${minutes(stage('toefl-w-build')?.seconds??0)} мин`],
  ['Writing · Write an Email','1 даалгавар',`${minutes(stage('toefl-w-email')?.seconds??0)} мин`],
  ['Writing · Academic Discussion','1 даалгавар · 100+ үг',`${minutes(stage('toefl-w-discussion')?.seconds??0)} мин`],
  ['Speaking','Listen and Repeat 7 · Take an Interview 4',`≈${Math.round(speaking/60)} мин`],
 ];
 return <div className="container page-space toefl-hub">
  <Link className="text-link" href="/exams/toefl">← TOEFL iBT</Link>
  <header className="toefl-hub-head"><p className="eyebrow">TOEFL iBT · 2026 ФОРМАТ · БҮТЭН MOCK</p><h1>{exam.title}</h1><p>{mock?.theme}. Reading, Listening нь эхний модулийн дүнгээр Lower эсвэл Upper хоёрдугаар модуль руу шилжинэ. Нийт ойролцоогоор {mock?.minutes.lower}–{mock?.minutes.higher} минут.</p></header>
  <div className="exam-briefing-layout"><section><h2>Хэсэг ба хугацаа</h2><ol className="exam-stage-plan toefl-plan">{rows.map(([title,detail,time])=><li key={title}><strong>{title}</strong><span>{detail} · {time}</span></li>)}</ol>
   <p className="toefl-note">Чиглүүлэлт: Reading Module 1-ийн 35-аас {stage('toefl-r2')?.routeAt} буюу түүнээс дээш, Listening Module 1-ийн 32-оос {l2?.routeAt} буюу түүнээс дээш зөв бол Upper модуль. Энэ нь ил тод дадлагын босго; ETS-ийн албан алгоритм биш.</p>
   <p className="toefl-note">Listening: бичлэг бүр нэг удаа тоглоно. Дууссаны дараа асуулт гарч, Choose a Response-д 20 секунд, бусад бичлэгт асуулт тутамд 25 секунд өгнө; хугацаа дуусахад тухайн асуулт түгжигдэнэ. Speaking: өгүүлбэр эсвэл асуултыг сонсож, дохионы дараа ярина; микрофон бичлэг хийж таны бүртгэлд хадгална. Дуу нь хиймэл (synthetic) бөгөөд Америк, Британи хэллэгтэй.</p>
  </section><aside><p>{(mock?.questions.reading??50)+(mock?.questions.listening??47)+(mock?.questions.writing??12)+(mock?.questions.speaking??11)} асуулт · {mock?.minutes.lower}–{mock?.minutes.higher} мин · {MOCK_PRICE_TERM}</p>{gate.activeAttemptId?<Link className="button" href={'/exams/attempts/'+gate.activeAttemptId}>Нээлттэй шалгалтаа үргэлжлүүлэх →</Link>:null}<ExamStart slug={exam.slug} program="toefl" hasAccess={gate.hasAccess} loggedIn={loggedIn} free={gate.free} pick={gate.pick} plan={gate.plan} pickedUntil={gate.pickedUntil}/><PracticeEntry slug={exam.slug} hasAccess={gate.practice} locked={gate.locked}/></aside></div>
  <section><h2>Эхлэхээс өмнө</h2><ul><li>Чихэвч, микрофон шаардлагатай. Чимээгүй газар сууна уу.</li><li>Хэсэг бүр өөрийн цагтай; хэсгийг эрт дуусгах, дууссан хэсэг рүү буцах боломжгүй. Шалгалтыг хүссэн үедээ зогсоож болох ч зогсоосон оролдлогын хариу, оноо хадгалагдахгүй. Refresh хийсэн ч цаг үргэлжилнэ.</li><li>Хариу автоматаар хадгалагдана. Нээлттэй шалгалтын үеэр дадлага, AI туслах хаалттай.</li><li>Үр дүн: Reading /50, Listening /47, Build a Sentence /10 зөв хариултын тоо. Имэйл, хэлэлцүүлэг, Speaking-ийг шалгалтын дараа AI ETS-ийн 0–5 шалгуураар үнэлж, жишиг хариуг харуулна.</li><li>Бүх асуулт, бичлэг энэ сайтад зориулж зохиосон; багш хараахан хянаагүй. ETS-ийн материал биш; TOEFL, TOEFL iBT нь ETS-ийн бүртгэлтэй тэмдэг.</li></ul></section>
  <details><summary>Бүтцийн эх сурвалж</summary>{exam.sources.map(source=><p key={source.url}><a className="text-link" href={source.url} target="_blank" rel="noopener noreferrer">{source.label} ↗</a></p>)}</details>
 </div>;
}
