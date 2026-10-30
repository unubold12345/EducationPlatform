import "../../admin.css";
import { findOfficialPaper } from "@/modules/papers/catalog";
import { keyForPaper } from "@/modules/papers/key";
import Link from "next/link";
import { notFound,redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { isAdmin,contentCatalog } from "@/modules/admin/service";
import { getExercise,getExam,getWorkshop,sourceContent } from "@/modules/content/published";
import { editableQuestions } from "@/modules/content/fix";
import { getDb } from "@/lib/db";
import { ContentEditor } from "@/components/content-editor";
import { AdminAction } from "@/components/admin-action";
import { AdminQuestionFixer } from "@/components/admin-question-fixer";
import { AdminShell,adminDate,statusLabel } from "@/modules/admin/ui";
export const metadata={title:"Контент засах",robots:{index:false,follow:false}};
export default async function ContentPreview({params}:{params:Promise<{key:string}>}) {
  const session=await getSession();if(!session)redirect("/login?next=%2Fadmin");
  if(!await isAdmin(session.user.id))notFound();
  const {key}=await params;
  const back=<Link href="/admin?tab=content" className="text-link">← Бүх контент</Link>;
  const officialPaper=findOfficialPaper(key);
  const officialKey=officialPaper?keyForPaper(officialPaper):null;
  if(officialPaper&&officialKey)return <AdminShell tab="content" title={officialPaper.title} name={session.user.name} actions={back}>
    <p className="admin-help">БҮТ-ийн албан эх материал · зөвхөн унших. Асуулт, түлхүүрийг албан эх хуудастай тулгаж хянана; платформоос өөрчлөхгүй.</p>
    <AdminAction target={key} content/>
    <section className="admin-panel"><h3>Эх хуудсууд · {officialPaper.seconds/60} минут</h3>{officialPaper.pageUrls.map((url,i)=><p key={url}><a href={url} target="_blank" rel="noreferrer">БҮТ · {i+1}-р хуудас ↗</a></p>)}</section>
    <section className="admin-panel"><h3>Түлхүүр · {officialPaper.totalMarks} оноо</h3><p>{officialKey.choices.map((answer,i)=>`${i+1}: ${answer} (${officialKey.choiceMarks[i]})`).join(" · ")}</p>{officialKey.fills.map(q=><p key={q.id}>{q.id}: {q.digits} · {q.groups.reduce((sum,g)=>sum+g.marks,0)} оноо</p>)}{officialKey.sourceUrls.map((url,i)=><p key={url}><a href={url} target="_blank" rel="noreferrer">Албан түлхүүрийн {i+1}-р хуудас ↗</a></p>)}</section>
  </AdminShell>;
  const [set,exam,task]=await Promise.all([getExercise(key),getExam(key),getWorkshop(key)]);
  if(!set&&!exam&&!task)notFound();
  const db=getDb();
  const [draft,versions,review,fixes]=await Promise.all([db.contentDraft.findUnique({where:{key}}),db.publishedContent.findMany({where:{key},orderBy:{version:"desc"},take:5}),db.contentReview.findUnique({where:{key}}),db.adminAudit.findMany({where:{target:key,action:{startsWith:"content-"}},orderBy:{createdAt:"desc"},take:8})]);
  const published=JSON.parse(JSON.stringify(versions[0]?.body??sourceContent(key)));
  const initial=JSON.parse(JSON.stringify(draft?.body??published));
  const questions=editableQuestions(published);
  const item=contentCatalog().find(entry=>entry.key===key);
  return <AdminShell tab="content" title={set?.title??exam?.title??task?.title??key} name={session.user.name} actions={back}>
    <dl className="admin-facts">
      <div><dt>Төрөл</dt><dd>{item?`${item.program.toUpperCase()} · ${item.kind}`:"—"}</dd></div>
      <div><dt>Нийтлэгдсэн</dt><dd>v{versions[0]?.version??1}</dd></div>
      <div><dt>Ноорог</dt><dd>{draft?statusLabel(draft.status):"Алга"}</dd></div>
      <div><dt>Хяналт</dt><dd>{statusLabel(review?.status??"PENDING")}</dd></div>
      <div><dt>Асуулт</dt><dd>{questions.length||"—"}</dd></div>
      <div><dt>Үзэх</dt><dd><Link href={item?.href??"/"} target="_blank">Суралцагчийн хуудас ↗</Link></dd></div>
    </dl>
    {questions.length>0&&<><div className="admin-section-heading"><h3>Асуулт, хариу засах</h3><span>Засвар бүр шинэ хувилбар · өмнөх оролдлого хуучин хувилбараараа</span></div>
      <AdminQuestionFixer contentKey={key} questions={questions} revision={draft?.revision??0} draftPending={!!draft&&draft.status!=="PUBLISHED"}/></>}
    {fixes.length>0&&<details className="admin-panel"><summary>Сүүлийн өөрчлөлтүүд ({fixes.length})</summary><ul className="admin-log">{fixes.map(row=><li key={row.id}><strong>{row.action.replace("content-","")}</strong> · {adminDate(row.createdAt)} · {row.reason}</li>)}</ul></details>}
    <details className="admin-panel" open={!questions.length}><summary>Бүтэн засварлагч · гарчиг, заавар, эх, хүснэгт</summary>
      <ContentEditor contentKey={key} initial={initial} provenance={draft?.provenance??versions[0]?.provenance??""} revision={draft?.revision??0} status={draft?.status??"DRAFT"} history={versions.map(record=>({...record,body:JSON.parse(JSON.stringify(record.body)),createdAt:record.createdAt.toISOString()}))}/>
    </details>
    <details className="admin-panel"><summary>Хяналтын төлөв ба тэмдэглэл</summary>{review&&<p className="admin-help">{review.notes} · {adminDate(review.updatedAt)}</p>}<AdminAction target={key} content/></details>
    {exam&&<details className="admin-panel"><summary>Бүтэц ба хугацаа · v{exam.version}</summary>{exam.stages.map(stage=><div key={stage.id}><h4>{stage.title} · {stage.seconds/60} минут</h4><p className="admin-help">{stage.instructions}</p></div>)}{exam.sources.map(source=><p key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a></p>)}</details>}
    {task&&<section className="admin-panel"><h3>{task.minutes} минут · {task.skill}</h3><p>{task.prompt}</p><h4>Жишиг хариулт</h4><p className="admin-passage">{task.model}</p></section>}
  </AdminShell>;
}
