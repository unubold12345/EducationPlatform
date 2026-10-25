import { findOfficialPaper } from "@/modules/papers/catalog";
import { keyForPaper } from "@/modules/papers/key";
import Link from "next/link";
import { notFound,redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { isAdmin } from "@/modules/admin/service";
import { getExercise,getExam,getWorkshop,sourceContent } from "@/modules/content/published";
import { getDb } from "@/lib/db";
import { ContentEditor } from "@/components/content-editor";


import { AdminAction } from "@/components/admin-action";
export const metadata={title:"Контентын дотоод хяналт",robots:{index:false,follow:false}};
export default async function ContentPreview({params}:{params:Promise<{key:string}>}) {
  const session=await getSession();if(!session)redirect("/login?next=%2Fadmin");
  if(!await isAdmin(session.user.id))notFound();
  const {key}=await params;
  const officialPaper=findOfficialPaper(key);
  const officialKey=officialPaper?keyForPaper(officialPaper):null;
  if(officialPaper&&officialKey)return <div className="container page-space admin-preview"><Link href="/admin?tab=content">← Контентын хяналт</Link><p className="eyebrow">БҮТ · ЭХ МАТЕРИАЛ · ЗӨВХӨН УНШИХ</p><h1>{officialPaper.title}</h1><p>Албан эх хуудсыг өөрчлөхгүй. Асуулт, томьёо, зураг архив дээрх эхээрээ харагдана. Платформын хариулт, онооны түлхүүрийг доорх эхтэй тулгаж хянана.</p><AdminAction target={key} content/><section className="settings-card"><h2>Эх хуудсууд · {officialPaper.seconds/60} минут</h2>{officialPaper.pageUrls.map((url,i)=><p key={url}><a href={url} target="_blank" rel="noreferrer">БҮТ · {i+1}-р хуудас ↗</a></p>)}</section><section className="settings-card"><h2>Түлхүүр · {officialPaper.totalMarks} оноо</h2><p>{officialKey.choices.map((answer,i)=>`${i+1}: ${answer} (${officialKey.choiceMarks[i]})`).join(" · ")}</p>{officialKey.fills.map(q=><p key={q.id}>{q.id}: {q.digits} · {q.groups.reduce((sum,g)=>sum+g.marks,0)} оноо</p>)}{officialKey.sourceUrls.map((url,i)=><p key={url}><a href={url} target="_blank" rel="noreferrer">Албан түлхүүрийн {i+1}-р хуудас ↗</a></p>)}</section></div>;
  const [set,exam,task]=await Promise.all([getExercise(key),getExam(key),getWorkshop(key)]);
  if(!set&&!exam&&!task)notFound();
  const [draft,versions]=await Promise.all([getDb().contentDraft.findUnique({where:{key}}),getDb().publishedContent.findMany({where:{key},orderBy:{version:"desc"},take:5})]);
  const initial=JSON.parse(JSON.stringify(draft?.body??versions[0]?.body??sourceContent(key)));
  const questions=set?set.questions.map(item=>({id:item.id,prompt:item.prompt,options:item.options,answer:item.options[item.correct],explanation:item.explanation,section:set.title})):exam?exam.stages.flatMap(stage=>[
    ...stage.questions.map(item=>({...item,section:stage.title,answer:item.answers.join(" / ")})),
    ...Object.entries(stage.variants??{}).flatMap(([branch,items])=>items.map(item=>({...item,section:stage.title+" · "+branch,answer:item.answers.join(" / ")}))),
  ]):[];
  return <div className="container page-space admin-preview"><Link href="/admin?tab=content" className="text-link">← Контентын хяналт</Link><p className="eyebrow">ЗӨВХӨН АДМИН · ЭХ МАТЕРИАЛЫН ХЯНАЛТ</p><h1>{set?.title??exam?.title??task?.title}</h1><p className="admin-help">Оригинал сургалтын материал. Энэ хуудас бүх хариу, тайлбарыг эрхтэй хянагчид үзүүлнэ. Суралцагчийн хадгалсан хувилбар өөрчлөгдөхгүй.</p><AdminAction target={key} content/>
    <ContentEditor contentKey={key} initial={initial} provenance={draft?.provenance??versions[0]?.provenance??""} revision={draft?.revision??0} status={draft?.status??"DRAFT"} history={versions.map(record=>({...record,body:JSON.parse(JSON.stringify(record.body)),createdAt:record.createdAt.toISOString()}))}/>
    {exam&&<section className="settings-card"><h2>Бүтэц ба хугацаа · v{exam.version}</h2>{exam.stages.map(stage=><div key={stage.id}><h3>{stage.title} · {stage.seconds/60} минут</h3><p>{stage.instructions}</p>{stage.passages?.map(passage=><details key={passage.title}><summary>{passage.title}</summary><p className="admin-passage">{passage.text}</p></details>)}</div>)}<h3>Бүтцийн эх сурвалж</h3>{exam.sources.map(source=><p key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a></p>)}</section>}
    {questions.map((item,index)=><article className="settings-card" key={item.section+item.id}><p className="eyebrow">{item.section} · {index+1}</p><h2>{item.id}</h2>{"passage" in item&&item.passage&&<p className="admin-passage">{item.passage}</p>}<p className="admin-passage">{item.prompt}</p>{item.options&&<ol type="A">{item.options.map((option,i)=><li key={i}>{option}</li>)}</ol>}<details><summary>Хариу ба тайлбар</summary><p><strong>{item.answer||"Мэргэжлийн хүний үнэлгээ шаардлагатай"}</strong></p><p>{item.explanation}</p></details></article>)}
    {task&&<section className="settings-card"><h2>{task.minutes} минут · {task.skill}</h2><p>{task.prompt}</p>{"table" in task&&task.table&&<pre>{JSON.stringify(task.table,null,2)}</pre>}<h3>Хяналтын жагсаалт</h3><ul>{task.checklist.map(line=><li key={line}>{line}</li>)}</ul><h3>Жишиг хариулт</h3><p className="admin-passage">{task.model}</p></section>}
  </div>;
}
