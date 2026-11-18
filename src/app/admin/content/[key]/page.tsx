import "../../admin.css";
import Link from "next/link";
import { notFound,redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { isAdmin,contentCatalog } from "@/modules/admin/service";
import { getExam,getWorkshop,sourceContent } from "@/modules/content/published";
import { editableQuestions } from "@/modules/content/fix";
import { getDb } from "@/lib/db";
import { ContentEditor } from "@/components/content-editor";
import { AdminAction } from "@/components/admin-action";
import { AdminQuestionFixer } from "@/components/admin-question-fixer";
import { AdminShell,SubTabs,adminDate,auditLabel,statusLabel } from "@/modules/admin/ui";
export const metadata={title:"Контент засах",robots:{index:false,follow:false}};
const HISTORY=20;
// One job per tab: fix a question, edit the whole material, set the review status, read the structure, see what changed.
export default async function ContentPreview({params,searchParams}:{params:Promise<{key:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const session=await getSession();if(!session)redirect("/login?next=%2Fadmin");
  if(!await isAdmin(session.user.id))notFound();
  const [{key},query]=await Promise.all([params,searchParams]);
  const back=<Link href="/admin?tab=content" className="text-link">← Бүх контент</Link>;
  const [exam,task]=await Promise.all([getExam(key),getWorkshop(key)]);
  if(!exam&&!task)notFound();
  const db=getDb();
  const changes={target:key,action:{startsWith:"content-"}};
  const [draft,versions,review,fixes,fixTotal]=await Promise.all([db.contentDraft.findUnique({where:{key}}),db.publishedContent.findMany({where:{key},orderBy:{version:"desc"},take:5}),db.contentReview.findUnique({where:{key}}),db.adminAudit.findMany({where:changes,orderBy:{createdAt:"desc"},take:HISTORY}),db.adminAudit.count({where:changes})]);
  const published=JSON.parse(JSON.stringify(versions[0]?.body??sourceContent(key)));
  const initial=JSON.parse(JSON.stringify(draft?.body??published));
  const questions=editableQuestions(published);
  const item=contentCatalog().find(entry=>entry.key===key);
  const views=[...(questions.length?[["questions","Асуулт",questions.length] as const]:[]),["editor","Бүтэн засварлагч"] as const,["review","Хяналт"] as const,["structure",exam?"Бүтэц":"Даалгавар"] as const,["history","Өөрчлөлт",fixTotal] as const];
  const view=views.find(([id])=>id===query.view)?.[0]??views[0][0];
  return <AdminShell tab="content" title={exam?.title??task?.title??key} name={session.user.name} actions={back}>
    <dl className="admin-facts admin-facts-strip">
      <div><dt>Төрөл</dt><dd>{item?`${item.program.toUpperCase()} · ${item.kind}`:"—"}</dd></div>
      <div><dt>Нийтлэгдсэн</dt><dd>v{versions[0]?.version??1}</dd></div>
      <div><dt>Ноорог</dt><dd>{draft?statusLabel(draft.status):"Алга"}</dd></div>
      <div><dt>Хяналт</dt><dd>{statusLabel(review?.status??"PENDING")}</dd></div>
      <div><dt>Асуулт</dt><dd>{questions.length||"—"}</dd></div>
      <div><dt>Үзэх</dt><dd><Link href={item?.href??"/"} target="_blank">Суралцагчийн хуудас ↗</Link></dd></div>
    </dl>
    <SubTabs items={views} current={view} href={id=>"/admin/content/"+key+"?view="+id}/>
    {view==="questions"&&<AdminQuestionFixer contentKey={key} questions={questions} revision={draft?.revision??0} draftPending={!!draft&&draft.status!=="PUBLISHED"}/>}
    {view==="editor"&&<ContentEditor contentKey={key} initial={initial} provenance={draft?.provenance??versions[0]?.provenance??""} revision={draft?.revision??0} status={draft?.status??"DRAFT"} history={versions.map(record=>({...record,body:JSON.parse(JSON.stringify(record.body)),createdAt:record.createdAt.toISOString()}))}/>}
    {view==="review"&&<section className="ws-card admin-narrow">
      <h3>Хяналтын төлөв</h3>
      <dl className="admin-facts"><div><dt>Одоо</dt><dd>{statusLabel(review?.status??"PENDING")}</dd></div>{review&&<div className="admin-fact-wide"><dt>Тэмдэглэл · {adminDate(review.updatedAt)}</dt><dd>{review.notes}</dd></div>}</dl>
      <AdminAction target={key} content inline/>
    </section>}
    {view==="structure"&&exam&&<section className="ws-card"><h3>Бүтэц ба хугацаа · v{exam.version}</h3>
      <ul className="admin-log">{exam.stages.map(stage=><li key={stage.id}><strong>{stage.title} · {stage.seconds/60} минут</strong><span>{stage.instructions}</span></li>)}</ul>
      {exam.sources.length>0&&<p className="admin-sources">{exam.sources.map(source=><a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a>)}</p>}
    </section>}
    {view==="structure"&&task&&<section className="ws-card admin-task"><h3>{task.minutes} минут · {task.skill}</h3><p>{task.prompt}</p><h4>Жишиг хариулт</h4><p className="admin-passage">{task.model}</p></section>}
    {view==="history"&&<>
      <div className="admin-table-wrap"><table><thead><tr><th>Огноо</th><th>Үйлдэл</th><th>Шалтгаан</th></tr></thead><tbody>{fixes.map(row=><tr key={row.id}><td>{adminDate(row.createdAt)}</td><td><strong>{auditLabel(row.action)}</strong></td><td>{row.reason}</td></tr>)}</tbody></table>{!fixes.length&&<p className="admin-empty">Өөрчлөлт хийгээгүй. Эх хувилбар үйлчилж байна.</p>}</div>
      {fixTotal>HISTORY&&<p className="admin-last"><span>Сүүлийн {HISTORY} өөрчлөлт</span><Link href={"/admin?tab=audit&q="+encodeURIComponent(key)}>Бүгд ({fixTotal}) →</Link></p>}
    </>}
  </AdminShell>;
}
