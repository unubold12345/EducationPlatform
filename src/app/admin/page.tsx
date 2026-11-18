import "./admin.css";
import { findExam } from "@/modules/exams/definitions";
import { MOCK_PRICE_LABEL, MOCK_PURCHASE_DAYS } from "@/modules/exams/pricing";
import { adminUserScope,realPaymentScope } from "@/modules/admin/data-scope";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import type { Prisma } from "@/generated/prisma/client";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/db";
import { isAdmin,contentCatalog,databaseLatency } from "@/modules/admin/service";
import { allPlans, findAnyPlan, subscriptionPlans } from "@/modules/subscriptions/plans";
import { planPrices, planSales } from "@/modules/subscriptions/prices";
import { pageInfo,parsePage } from "@/modules/admin/paging";
import { AdminShell,How,Metrics,Pager,StatusPill,SubTabs,adminTabInfo,adminTabs,auditActions,auditLabel,adminDate as date,money,statusLabel,type AdminTab } from "@/modules/admin/ui";
import { AdminPicker } from "@/components/admin-row";
import { AdminPriceForm } from "@/components/admin-price-form";
import { AdminCreditForm } from "@/components/admin-credit-form";
import { AdminCreditPacksForm } from "@/components/admin-credit-pack-form";
import { AdminSaleForm } from "@/components/admin-sale-form";
import { creditAllowances } from "@/modules/credits/service";
import { creditPacks } from "@/modules/credits/purchase";
import { creditMonths, creditUsage } from "@/modules/admin/credits";
import { AdminAnnouncementForm, AdminAnnouncementWithdraw } from "@/components/admin-announcement-form";
import { NOTIFICATION_LIMITS, announcementKey } from "@/modules/notifications/rules";
import { AI_ACTIONS, CREDIT_USD, DEEPSEEK_PRICE, DEFAULT_CREDIT_PACKS, creditPeriod, creditRangeLabel, defaultAllowances, formatCredits, formatUsd, isAiAction } from "@/modules/credits/pricing";

export const metadata:Metadata={title:"Удирдлагын төв",robots:{index:false,follow:false}};
const one=(value:string|string[]|undefined)=>typeof value==="string"?value:"";
const StatusLabelText=({status}:{status:string})=>statusLabel(status);
// Sections whose lists can be switched between real members and test accounts.
const scopedTabs:readonly AdminTab[]=["overview","users","subscriptions","payments","attempts","credits"];
type Filters={name:string;value:string;options:readonly (readonly [string,string])[]};

// Every section is one screen per job: a tab bar under the title, then one toolbar and one table or list.
export default async function AdminPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const session=await getSession();if(!session)redirect("/login?next=%2Fadmin");
  if(!await isAdmin(session.user.id))return <div className="container page-space"><p className="eyebrow">403 · ХАНДАЛТ ХЯЗГААРЛАГДСАН</p><h1>Админ эрх шаардлагатай.</h1><p>Энэ бүртгэл удирдлагын эрхгүй байна.</p><Link className="button primary" href="/workspace">Workspace руу</Link></div>;
  const params=await searchParams;
  const tab:AdminTab=adminTabs.some(([key])=>key===params.tab)?params.tab as AdminTab:"overview";
  const q=one(params.q).trim().slice(0,100);
  const testData=params.data==="test";
  const requested=parsePage(params.page);
  const filter=one(params.filter);const kind=one(params.kind);
  const view=tab==="credits"?one(params.view):"";
  const now=new Date();const db=getDb();
  const searchFilter:Prisma.UserWhereInput=q?{OR:[{email:{contains:q,mode:"insensitive"}},{name:{contains:q,mode:"insensitive"}},{id:q}]}:{};
  const userFilter:Prisma.UserWhereInput={AND:[adminUserScope(testData),searchFilter]};
  const paymentScope=testData?{provider:{in:["MOCK","LEGACY"]}}:realPaymentScope;
  const actionFilter=tab==="credits"?one(params.action):"";
  const link=(patch:Record<string,string|number>={})=>"/admin?"+new URLSearchParams(Object.entries({tab,q,data:testData?"test":"",filter,kind,view,action:actionFilter,...patch}).filter(([,value])=>value!==""&&value!==undefined).map(([key,value])=>[key,String(value)]));
  const data=testData?"&data=test":"";
  const name=session.user.name;
  const title=adminTabs.find(([key])=>key===tab)![1];
  const scoped=scopedTabs.includes(tab);
  const scope=<div className="admin-data-scope" role="group" aria-label="Өгөгдөл"><Link aria-current={!testData?"page":undefined} href={link({data:""})}>Бодит</Link><Link aria-current={testData?"page":undefined} href={link({data:"test"})}>Туршилт</Link></div>;
  const testBanner=testData&&<p className="admin-test-banner">Туршилтын өгөгдөл: тест бүртгэл, дуурайлгасан төлбөр. Бодит орлого биш.</p>;
  const frame=(children:ReactNode,actions?:ReactNode)=><AdminShell tab={tab} title={title} name={name} description={adminTabInfo[tab]} actions={actions} {...(scoped?{testData,scope}:{})}>{scoped&&testBanner}{children}</AdminShell>;
  const empty=(text:string)=><p className="admin-empty">{text}{!testData&&<> <Link href={link({data:"test"})}>Туршилтын өгөгдөл харах →</Link></>}</p>;
  const none=(text:string)=><p className="admin-empty">{text}</p>;
  // One bar per list: search, an optional filter, then the export on the right.
  const toolbar=(placeholder:string,options:{filters?:Filters;exportKind?:string;exportLabel?:string;chip?:ReactNode}={})=>{
    const {filters,exportKind,exportLabel,chip}=options;
    const hidden:[string,string][]=[["tab",tab],["data",testData?"test":""],["kind",kind],["view",view],["action",actionFilter],["filter",filters?"":filter]];
    return <div className="admin-toolbar">
      <form className="admin-search" action="/admin" key={[tab,kind,view,q,filter].join("|")}>
        {hidden.filter(([,value])=>value).map(([key,value])=><input key={key} type="hidden" name={key} value={value}/>)}
        <label className="sr-only" htmlFor="admin-search">Хайх</label>
        <input id="admin-search" name="q" defaultValue={q} maxLength={100} placeholder={placeholder}/>
        {filters&&<select name={filters.name} aria-label="Шүүлтүүр" defaultValue={filters.value}>{filters.options.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>}
        <button className="button secondary">Хайх</button>
        {(q||(filters&&filter))&&<Link className="text-link" href={link({q:"",...(filters?{filter:""}:{})})}>Цэвэрлэх</Link>}
      </form>
      {chip}
      {exportKind&&<a className="admin-export" title={"Сүүлийн 1,000 мөр: "+exportLabel} href={"/api/admin/export?kind="+exportKind+data}>CSV татах ↓</a>}
    </div>;
  };
  const table=(head:readonly string[],rows:ReactNode[],whenEmpty:ReactNode)=><div className="admin-table-wrap"><table><thead><tr>{head.map((cell,index)=><th key={index}>{cell}</th>)}</tr></thead><tbody>{rows}</tbody></table>{!rows.length&&whenEmpty}</div>;
  const userLink=(user:{id:string;email:string;name?:string})=><Link href={"/admin/users/"+user.id}>{user.name?<><strong>{user.name}</strong><small>{user.email}</small></>:user.email}</Link>;

  if(tab==="overview") {
    const [usersTotal,newUsers,activePlans,mockTotal,paperCount,paidMocks,paidPlans,suspended,pending,drafts,audits,recentUsers]=await Promise.all([
      db.user.count({where:userFilter}),db.user.count({where:{AND:[userFilter,{createdAt:{gte:new Date(now.getTime()-7*864e5)}}]}}),
      db.subscription.count({where:{startsAt:{lte:now},endsAt:{gt:now},user:userFilter}}),db.mockAttempt.count({where:{user:userFilter}}),db.paperAttempt.count({where:{user:userFilter}}),
      db.mockPurchase.aggregate({where:{status:"PAID",...paymentScope,user:userFilter},_sum:{amountMnt:true}}),db.subscriptionOrder.aggregate({where:{status:"PAID",...paymentScope,user:userFilter},_sum:{amountMnt:true}}),
      db.user.count({where:{AND:[userFilter,{suspendedAt:{not:null}}]}}),db.subscriptionOrder.count({where:{status:"PENDING",...paymentScope,user:userFilter}}),
      db.contentDraft.count({where:{status:{not:"PUBLISHED"}}}),
      db.adminAudit.findMany({orderBy:[{createdAt:"desc"},{id:"desc"}],take:5}),
      db.user.findMany({where:userFilter,orderBy:[{createdAt:"desc"},{id:"desc"}],take:5,select:{id:true,name:true,email:true,createdAt:true}}),
    ]);
    const ai=await creditUsage(creditPeriod(now.getTime()),userFilter).catch(()=>null);
    const attention=[["Түр хаасан бүртгэл",suspended,"/admin?tab=users&filter=suspended"+data],["Хүлээгдэж буй захиалга",pending,"/admin?tab=payments&kind=orders&filter=PENDING"+data],["Нийтлээгүй ноорог",drafts,"/admin?tab=content&filter=draft"]] as const;
    return frame(<>
      <Metrics items={[["Нийт хэрэглэгч",usersTotal,`+${newUsers} энэ 7 хоногт`],["Идэвхтэй сарын эрх",activePlans],["Шалгалт",mockTotal+paperCount,"оролдлого"],[testData?"Туршилтын төлбөр":"Бодит төлбөр",money((paidMocks._sum.amountMnt??0)+(paidPlans._sum.amountMnt??0)),testData?"Бодит орлого биш":"нийт"]]}/>
      {ai&&<Link className="admin-ai-strip" href={"/admin?tab=credits"+data}><span>AI · энэ сар</span><strong>{formatCredits(ai.spentCredits)} кредит</strong><span>{ai.spentCount} үйлдэл · {ai.users} хэрэглэгч</span><span>Бодит DeepSeek зардал {formatUsd(ai.costMicroUsd)}</span><em>Дэлгэрэнгүй →</em></Link>}
      <div className="admin-board">
        <section className="ws-card"><div className="ws-card-head"><h3>Анхаарах зүйл</h3></div><ul className="admin-attention">{attention.map(([label,count,href])=><li key={label}><Link className={count?"has-items":""} href={href}><strong>{count}</strong><span>{label}</span></Link></li>)}</ul></section>
        <section className="ws-card"><div className="ws-card-head"><h3>Шинэ хэрэглэгчид</h3><Link className="text-link" href={"/admin?tab=users"+data}>Бүгд</Link></div>{recentUsers.length?<ul className="admin-log">{recentUsers.map(user=><li key={user.id}>{userLink(user)}<small>{date(user.createdAt)}</small></li>)}</ul>:empty("Хэрэглэгч алга.")}</section>
        <section className="ws-card"><div className="ws-card-head"><h3>Сүүлийн админ үйлдэл</h3><Link className="text-link" href="/admin?tab=audit">Бүгд</Link></div>{audits.length?<ul className="admin-log">{audits.map(row=><li key={row.id}><strong>{auditLabel(row.action)}</strong><span>{row.reason}</span><small>{date(row.createdAt)}</small></li>)}</ul>:none("Үйлдэл алга.")}</section>
      </div>
    </>);
  }

  if(tab==="users") {
    const groups=[["","Бүгд"],["plan","Идэвхтэй эрхтэй"],["paid","Төлбөр төлсөн"],["unverified","Баталгаажаагүй"],["suspended","Түр хаасан"],["admin","Админ"]] as const;
    const status:Prisma.UserWhereInput=filter==="suspended"?{suspendedAt:{not:null}}:filter==="admin"?{adminMembership:{isNot:null}}:filter==="plan"?{subscriptions:{some:{startsAt:{lte:now},endsAt:{gt:now}}}}:filter==="unverified"?{emailVerified:false}:filter==="paid"?{OR:[{subscriptionOrders:{some:{status:"PAID"}}},{mockPurchases:{some:{status:"PAID"}}}]}:{};
    const where:Prisma.UserWhereInput={AND:[userFilter,status]};
    const info=pageInfo(await db.user.count({where}),requested);
    const users=await db.user.findMany({where,skip:info.skip,take:info.size,orderBy:[{createdAt:"desc"},{id:"desc"}],select:{id:true,name:true,email:true,emailVerified:true,createdAt:true,suspendedAt:true,adminMembership:{select:{userId:true}},_count:{select:{sessions:true,mockAttempts:true,paperAttempts:true}},subscriptions:{select:{program:true,endsAt:true,startsAt:true}}}});
    const lastSeen=users.length?await db.userEvent.groupBy({by:["userId"],where:{userId:{in:users.map(user=>user.id)},type:"sign-in"},_max:{createdAt:true}}):[];
    return frame(<>
      <SubTabs items={groups} current={groups.some(([key])=>key===filter)?filter:""} href={key=>link({filter:key,page:1})}/>
      {toolbar("Нэр, имэйл эсвэл ID-аар хайх…",{exportKind:"users",exportLabel:"хэрэглэгчид"})}
      {table(["Хэрэглэгч","Төлөв","Бүртгүүлсэн / сүүлд","Эрх","Явц"],users.map(user=>{const seen=lastSeen.find(row=>row.userId===user.id)?._max.createdAt;return <tr key={user.id}>
        <td>{userLink(user)}</td>
        <td><span className={"ws-pill "+(user.suspendedAt?"bad":user.adminMembership?"info":"")}>{user.suspendedAt?"Хаасан":user.adminMembership?"Админ":"Суралцагч"}</span>{!user.emailVerified&&<small>Имэйл баталгаажаагүй</small>}</td>
        <td>{date(user.createdAt)}<small>{seen?"Сүүлд: "+date(seen):"Нэвтрэлтийн бүртгэлгүй"}</small></td>
        <td>{user.subscriptions.filter(plan=>plan.startsAt<=now&&plan.endsAt>now).map(plan=><small key={plan.program}>{plan.program.toUpperCase()} → {date(plan.endsAt)}</small>)}{!user.subscriptions.some(plan=>plan.startsAt<=now&&plan.endsAt>now)&&<small>—</small>}</td>
        <td>{user._count.mockAttempts+user._count.paperAttempts} шалгалт<small>{user._count.sessions} идэвхтэй сесс</small></td>
      </tr>;}),empty("Хэрэглэгч олдсонгүй."))}
      <Pager info={info} href={page=>link({page})} label="хэрэглэгч"/>
    </>);
  }

  if(tab==="subscriptions") {
    const state:Prisma.SubscriptionWhereInput=filter==="active"?{startsAt:{lte:now},endsAt:{gt:now}}:filter==="expired"?{endsAt:{lte:now}}:{};
    const where:Prisma.SubscriptionWhereInput={user:userFilter,...state,...(kind?{program:kind}:{})};
    const info=pageInfo(await db.subscription.count({where}),requested);
    const rows=await db.subscription.findMany({where,skip:info.skip,take:info.size,orderBy:[{endsAt:"desc"},{id:"desc"}],select:{id:true,program:true,startsAt:true,endsAt:true,user:{select:{id:true,name:true,email:true}}}});
    return frame(<>
      <SubTabs items={[["","Бүх багц"],...allPlans.map(plan=>[plan.program,plan.shortTitle+(subscriptionPlans.some(sale=>sale.program===plan.program)?"":" (хуучин)")] as const)]} current={kind} href={key=>link({kind:key,page:1})}/>
      {toolbar("Нэр эсвэл имэйлээр хайх…",{filters:{name:"filter",value:filter,options:[["","Бүх төлөв"],["active","Идэвхтэй"],["expired","Дууссан"]]},exportKind:"subscriptions",exportLabel:"сарын эрх"})}
      {table(["Хэрэглэгч","Багц","Хугацаа","Төлөв"],rows.map(row=><tr key={row.id}><td>{userLink(row.user)}</td><td>{findAnyPlan(row.program)?.title??row.program.toUpperCase()}</td><td>{date(row.startsAt)}<small>→ {date(row.endsAt)}</small></td><td><span className={"ws-pill "+(row.startsAt<=now&&row.endsAt>now?"ok":"")}>{row.startsAt<=now&&row.endsAt>now?"Идэвхтэй":"Дууссан"}</span></td></tr>),empty("Сарын эрх олдсонгүй."))}
      <Pager info={info} href={page=>link({page})}/>
    </>);
  }

  if(tab==="payments") {
    const current=kind==="purchases"?"purchases":kind==="credits"?"credits":"orders";
    const statusWhere=["PAID","DECLINED","PENDING"].includes(filter)?{status:filter}:{};
    const base={user:userFilter,...paymentScope};
    const [orderTotal,purchaseTotal,creditTotal]=await Promise.all([db.subscriptionOrder.count({where:{...base,...statusWhere}}),db.mockPurchase.count({where:{...base,...statusWhere}}),db.creditOrder.count({where:{...base,...statusWhere}})]);
    const info=pageInfo(current==="orders"?orderTotal:current==="credits"?creditTotal:purchaseTotal,requested);
    const rows=current==="credits"
      ?(await db.creditOrder.findMany({where:{...base,...statusWhere},skip:info.skip,take:info.size,orderBy:[{createdAt:"desc"},{id:"desc"}],select:{id:true,credits:true,status:true,provider:true,amountMnt:true,createdAt:true,paidAt:true,user:{select:{id:true,email:true}}}})).map(row=>({...row,label:formatCredits(row.credits)+" AI кредит"}))
      :current==="orders"
      ?(await db.subscriptionOrder.findMany({where:{...base,...statusWhere},skip:info.skip,take:info.size,orderBy:[{createdAt:"desc"},{id:"desc"}],select:{id:true,program:true,status:true,provider:true,amountMnt:true,createdAt:true,paidAt:true,user:{select:{id:true,email:true}}}})).map(row=>({...row,label:row.program.toUpperCase()+" · сарын эрх"}))
      :(await db.mockPurchase.findMany({where:{...base,...statusWhere},skip:info.skip,take:info.size,orderBy:[{createdAt:"desc"},{id:"desc"}],select:{id:true,examSlug:true,status:true,provider:true,amountMnt:true,createdAt:true,paidAt:true,user:{select:{id:true,email:true}}}})).map(row=>({...row,label:findExam(row.examSlug)?.title??"Хасагдсан албан материал · "+row.examSlug}));
    return frame(<>
      <SubTabs items={[["orders","Сарын багцын захиалга",orderTotal],["purchases","Нэг шалгалтын эрх",purchaseTotal],["credits","AI кредит",creditTotal]]} current={current} href={key=>link({kind:key,page:1})}/>
      {toolbar("Хэрэглэгчийн нэр эсвэл имэйл…",{filters:{name:"filter",value:filter,options:[["","Бүх төлөв"],["PAID","Төлөгдсөн"],["PENDING","Хүлээгдэж байна"],["DECLINED","Амжилтгүй"]]},...(current==="orders"?{exportKind:"payments",exportLabel:"сарын багцын захиалга"}:{})})}
      {table(["Огноо","Хэрэглэгч","Бүтээгдэхүүн","Дүн","Төлөв","Баримт"],rows.map(row=><tr key={row.id}><td>{date(row.createdAt)}{row.paidAt&&<small>Төлсөн: {date(row.paidAt)}</small>}</td><td>{userLink(row.user)}</td><td>{row.label}</td><td><strong>{money(row.amountMnt)}</strong></td><td><StatusPill status={row.status}/></td><td><code>{row.id}</code><small>{row.provider}</small></td></tr>),empty(testData?"Гүйлгээ олдсонгүй.":"Бодит төлбөр хараахан холбогдоогүй."))}
      <Pager info={info} href={page=>link({page})} label="гүйлгээ"/>
    </>);
  }

  if(tab==="attempts") {
    const current=kind==="papers"?"papers":"mocks";
    const statusWhere=["IN_PROGRESS","SUBMITTED"].includes(filter)?{status:filter as "IN_PROGRESS"|"SUBMITTED"}:{};
    const where={user:userFilter,...statusWhere};
    const [mockTotal,paperTotal]=await Promise.all([db.mockAttempt.count({where}),db.paperAttempt.count({where})]);
    const info=pageInfo(current==="mocks"?mockTotal:paperTotal,requested);
    const page={where,skip:info.skip,take:info.size,orderBy:[{createdAt:"desc" as const},{id:"desc" as const}]};
    const rows=current==="mocks"
      ?(await db.mockAttempt.findMany({...page,select:{id:true,slug:true,status:true,createdAt:true,updatedAt:true,subscriptionAccess:true,user:{select:{id:true,email:true}}}})).map(row=>({...row,label:findExam(row.slug)?.title??row.slug,result:row.subscriptionAccess?"Сарын эрхээр":"Нэг удаагийн эрхээр"}))
      :(await db.paperAttempt.findMany({...page,select:{id:true,slug:true,status:true,createdAt:true,updatedAt:true,user:{select:{id:true,email:true}}}})).map(row=>({...row,label:"Хасагдсан албан материал · "+row.slug,result:"—"}));
    return frame(<>
      <SubTabs items={[["mocks","Бүтэн mock",mockTotal],["papers","Хасагдсан албан материал",paperTotal]]} current={current} href={key=>link({kind:key,page:1})}/>
      {toolbar("Хэрэглэгчийн нэр эсвэл имэйл…",{filters:{name:"filter",value:filter,options:[["","Бүх төлөв"],["IN_PROGRESS","Үргэлжилж байна"],["SUBMITTED","Дууссан"]]}})}
      {table(["Эхэлсэн","Суралцагч","Материал","Төлөв","Сүүлд"],rows.map(row=><tr key={row.id}><td>{date(row.createdAt)}</td><td>{userLink(row.user)}</td><td>{row.label}<small><code>{row.id}</code></small></td><td><StatusPill status={row.status}/><small>{row.result}</small></td><td>{date(row.updatedAt)}</td></tr>),empty("Оролдлого олдсонгүй."))}
      <Pager info={info} href={page=>link({page})} label="оролдлого"/>
    </>);
  }

  if(tab==="announcements") {
    const sent=kind==="sent";
    const total=await db.announcement.count();
    const tabs=<SubTabs items={[["","Шинэ мэдэгдэл"],["sent","Илгээсэн",total]]} current={sent?"sent":""} href={key=>link({kind:key,q:"",filter:""})}/>;
    if(!sent)return frame(<>{tabs}
      <div className="admin-split">
        <AdminAnnouncementForm/>
        <aside className="ws-card admin-aside"><h3>Хэнд, хэрхэн хүрэх вэ</h3><ul>
          <li>Суралцагчийн Workspace-ийн хажуу цэсний «Мэдэгдэл» хэсэгт харагдана; имэйл илгээхгүй.</li>
          <li>Бүгдэд илгээсэн мэдэгдэл {NOTIFICATION_LIMITS.announcementDays} хоногийн дотор Workspace нээсэн, илгээхээс өмнө бүртгүүлсэн хэрэглэгчдэд хүрнэ.</li>
          <li>Нэг хэрэглэгчид илгээсэн нь <Link href="/admin?tab=audit&filter=announce">үйлдлийн түүхэнд</Link> бүртгэгдэнэ.</li>
        </ul></aside>
      </div>
    </>);
    const info=pageInfo(total,requested);
    const rows=await db.announcement.findMany({skip:info.skip,take:info.size,orderBy:[{createdAt:"desc"},{id:"desc"}]});
    const keys=rows.map(row=>announcementKey(row.id));
    const [reached,read]=rows.length?await Promise.all([db.notification.groupBy({by:["dedupeKey"],where:{dedupeKey:{in:keys}},_count:{_all:true}}),db.notification.groupBy({by:["dedupeKey"],where:{dedupeKey:{in:keys},readAt:{not:null}},_count:{_all:true}})]):[[],[]];
    const count=(list:typeof reached,id:string)=>list.find(row=>row.dedupeKey===announcementKey(id))?._count._all??0;
    return frame(<>{tabs}
      {table(["Огноо","Мэдэгдэл","Хүрсэн / уншсан",""],rows.map(row=><tr key={row.id}><td>{date(row.createdAt)}</td><td><strong>{row.title}</strong><small>{row.body}</small>{row.href&&<small><code>{row.href}</code></small>}</td><td>{count(reached,row.id)} / {count(read,row.id)}<small><code>{row.authorId}</code></small></td><td><AdminAnnouncementWithdraw id={row.id} title={row.title}/></td></tr>),<p className="admin-empty">Бүгдэд илгээсэн мэдэгдэл алга. <Link href={link({kind:""})}>Шинэ мэдэгдэл илгээх →</Link></p>)}
      <Pager info={info} href={page=>link({page})} label="мэдэгдэл"/>
    </>);
  }

  if(tab==="content") {
    const [reviews,drafts,published]=await Promise.all([db.contentReview.findMany(),db.contentDraft.findMany({select:{key:true,status:true,updatedAt:true}}),db.publishedContent.findMany({distinct:["key"],orderBy:{version:"desc"},select:{key:true,version:true,createdAt:true}})]);
    const needle=q.toLowerCase();
    const items=contentCatalog().filter(item=>(!kind||item.program===kind)&&(!needle||[item.key,item.title,item.kind].some(text=>text.toLowerCase().includes(needle)))&&(filter!=="draft"||drafts.some(row=>row.key===item.key&&row.status!=="PUBLISHED"))&&(filter!=="edited"||published.some(row=>row.key===item.key)));
    const info=pageInfo(items.length,requested);
    const programs=[...new Set(contentCatalog().map(item=>item.program))];
    return frame(<>
      <SubTabs items={[["","Бүгд"],...programs.map(program=>[program,program==="entrance"?"Элсэлт":program.toUpperCase()] as const)]} current={kind} href={key=>link({kind:key,page:1})}/>
      {toolbar("Гарчиг, төрөл эсвэл түлхүүрээр хайх…",{filters:{name:"filter",value:filter,options:[["","Бүх материал"],["edited","Засварласан"],["draft","Нийтлээгүй ноорогтой"]]}})}
      {table(["Материал","Төрөл","Хувилбар","Ноорог / хяналт",""],items.slice(info.skip,info.skip+info.size).map(item=>{const review=reviews.find(row=>row.key===item.key);const draft=drafts.find(row=>row.key===item.key);const current=published.find(row=>row.key===item.key);return <tr key={item.key}>
        <td><Link href={"/admin/content/"+item.key}><strong>{item.title}</strong><small>{item.key}</small></Link></td>
        <td>{item.program.toUpperCase()} · {item.kind}<small>{item.count} асуулт</small></td>
        <td>v{current?.version??1}<small>{current?date(current.createdAt):"Эх хувилбар"}</small></td>
        <td>{draft?<StatusPill status={draft.status}/>:"—"}<small>Хяналт: <StatusLabelText status={review?.status??"PENDING"}/></small></td>
        <td><Link className="admin-small-button" href={"/admin/content/"+item.key}>Засах →</Link></td>
      </tr>;}),none("Материал олдсонгүй."))}
      <Pager info={info} href={page=>link({page})} label="материал"/>
    </>);
  }

  if(tab==="pricing") {
    const views=[["plans","Багцын үнэ"],["sales","Хямдрал"],["credits","AI кредит"],["packs","Кредит багц"],["history","Түүх"]] as const;
    const current=views.find(([key])=>key===kind)?.[0]??"plans";
    const tabs=<SubTabs items={views} current={current} href={key=>link({kind:key,q:"",filter:""})}/>;
    // The four kinds of price change, described the same way in the History tab and under each list.
    const changeKinds:Record<string,string>={"set-price":"Багцын үнэ","set-sale":"Хямдрал","set-credits":"AI кредит","set-credit-packs":"Кредит багц","set-credit-pack":"Кредит багц"};
    const planName=(program:unknown)=>findAnyPlan(program)?.title??String(program??"—");
    const packText=(value:unknown)=>{const pack=value as {credits?:number;amountMnt?:number}|null;return `${formatCredits(pack?.credits??0)} кредит · ${money(pack?.amountMnt??0)}`;};
    const packList=(value:unknown)=>Array.isArray(value)?value.map(item=>`${formatCredits((item as {credits?:number}).credits??0)} / ${money((item as {amountMnt?:number}).amountMnt??0)}`).join(", "):value==="default"?"анхны багцууд":"—";
    const change=(row:{action:string;details:unknown}):[what:string,text:string]=>{
      const d=(row.details??{}) as Record<string,unknown>;
      if(row.action==="set-price")return [planName(d.program),`${money(Number(d.before??0))} → ${money(Number(d.after??0))}`];
      if(row.action==="set-sale"){const before=d.before as {amount?:number|null}|undefined,after=d.after as {amount?:number|null;endsAt?:string|null}|undefined;return [planName(d.program),`${before?.amount?money(before.amount):"—"} → ${after?.amount?money(after.amount)+(after.endsAt?" · "+date(new Date(after.endsAt)):""):"цуцалсан"}`];}
      if(row.action==="set-credits")return [d.key==="free"?"Үнэгүй":planName(d.key),`${formatCredits(Number(d.before??0))} → ${formatCredits(Number(d.after??0))} кредит`];
      if(row.action==="set-credit-pack")return ["Кредит багц",`${packText(d.before)} → ${packText(d.after)}`];
      return ["Кредит багцууд",`${packList(d.before)} → ${packList(d.after)}`];
    };
    const lastChange=async(actions:string[],label:string)=>{
      const row=await db.adminAudit.findFirst({where:{action:{in:actions}},orderBy:[{createdAt:"desc"},{id:"desc"}]});
      const [what,text]=row?change(row):["",""];
      return <p className="admin-last"><span>{row?<>Сүүлийн өөрчлөлт · {date(row.createdAt)} · {what}: {text}</>:"Өөрчлөлт хийгээгүй. Анхны утга үйлчилж байна."}</span><Link href={link({kind:"history",filter:actions[0],q:""})}>{label} →</Link></p>;
    };

    if(current==="plans") {
      const [prices,sales,last]=await Promise.all([planPrices(),planSales(),lastChange(["set-price"],"Үнийн түүх")]);
      const saleCell=(program:string)=>{const sale=sales[program];const live=!!sale?.saleAmountMnt&&sale.saleAmountMnt<prices[program]&&!(sale.saleEndsAt&&sale.saleEndsAt.getTime()<=now.getTime());return live?<Link className="ws-pill info" href={link({kind:"sales"})}>{money(sale.saleAmountMnt!)}</Link>:"—";};
      return frame(<>{tabs}
        <ul className="admin-rows">
          <li className="admin-row-head" aria-hidden="true"><span>Багц</span><span>Одоогийн үнэ</span><span>Хямдрал</span><span/></li>
          {subscriptionPlans.map(plan=><AdminPriceForm key={plan.program} program={plan.program} title={plan.title} amount={prices[plan.program]} fallback={plan.amountMnt} sale={saleCell(plan.program)}/>)}
          <li className="admin-row"><div className="admin-row-main"><strong className="admin-cell-title">Нэг mock шалгалт</strong><span className="admin-cell" data-label="Одоогийн үнэ"><b>{MOCK_PRICE_LABEL}</b> / {MOCK_PURCHASE_DAYS} хоног</span><span className="admin-cell" data-label="Хямдрал">—</span><span className="admin-row-locked">Кодонд тогтмол</span></div></li>
        </ul>
        {last}
        <How><p>Шинэ болон төлөгдөөгүй захиалгад шууд үйлчилнэ. Төлөгдсөн захиалга анхны дүнгээрээ үлдэнэ.</p><p>Нэг mock шалгалт төлсөн мөчөөс {MOCK_PURCHASE_DAYS} хоногийн турш нээлттэй, дараа нь дахин авна. 2026-11-17-ноос өмнөх худалдан авалт хугацаагүй хэвээр.</p></How>
      </>);
    }

    if(current==="sales") {
      const [prices,sales,last]=await Promise.all([planPrices(),planSales(),lastChange(["set-sale"],"Хямдралын түүх")]);
      return frame(<>{tabs}
        <ul className="admin-rows">
          <li className="admin-row-head" aria-hidden="true"><span>Багц</span><span>Энгийн үнэ</span><span>Хямдрал</span><span/></li>
          {subscriptionPlans.map(plan=><AdminSaleForm key={plan.program} program={plan.program} title={plan.title} regular={prices[plan.program]} sale={sales[plan.program]?.saleAmountMnt??null} saleEndsAt={sales[plan.program]?.saleEndsAt?.toISOString()??null} ended={Boolean(sales[plan.program]?.saleEndsAt&&sales[plan.program]!.saleEndsAt!.getTime()<=now.getTime())}/>)}
        </ul>
        {last}
        <How><p>Хямдралтай үнийг Багцууд хуудас, шалгалтын хуудас, нүүр хуудсанд энгийн үнийн хажууд (зураастай) харуулж, шинэ захиалгад хямдралтай үнээр авна.</p><p>Дуусах өдрийг (Улаанбаатарын цагаар, тэр өдрийн төгсгөл хүртэл) заавал өгөх албагүй; өгөөгүй бол «Хямдрал цуцлах» хүртэл үргэлжилнэ. Төлөгдсөн захиалга анхны дүнгээрээ үлдэнэ.</p></How>
      </>);
    }

    if(current==="credits") {
      const [allowances,last]=await Promise.all([creditAllowances(),lastChange(["set-credits"],"Кредитийн түүх")]);
      const defaults=defaultAllowances();
      return frame(<>{tabs}
        <ul className="admin-rows admin-credit-allowances">
          <li className="admin-row-head" aria-hidden="true"><span>Хэнд</span><span>Сарын кредит</span><span>Анхны хэмжээ</span><span/></li>
          {([["free","Үнэгүй (бүх бүртгэл)"],...subscriptionPlans.map(plan=>[plan.program,plan.title] as const)] as const).map(([key,label])=><AdminCreditForm key={key} allowanceKey={key} title={label} credits={allowances[key as keyof typeof allowances]} fallback={defaults[key as keyof typeof defaults]}/>)}
        </ul>
        {last}
        <How><p>Үнэгүй кредит бүх баталгаажсан бүртгэлд сар бүрийн 1-нд шинэчлэгдэнэ. Багцын кредит багцын сар бүр нэмэгдэж, ашиглаагүй нь багц дуустал хадгалагдана; багц дуусахад тэглэгдэнэ.</p><p>Өөрчлөлт одоогийн үлдэгдэлд шууд нөлөөлнө; зарцуулсан кредит буцахгүй. Үйлдэл бүрийн кредитийн үнэ DeepSeek-ийн токены үнээр кодонд тогтмол (<Link href="/admin?tab=credits">AI кредит</Link>).</p></How>
      </>);
    }

    if(current==="packs") {
      const [packs,last]=await Promise.all([creditPacks(),lastChange(["set-credit-packs","set-credit-pack"],"Кредит багцын түүх")]);
      return frame(<>{tabs}
        <div className="admin-narrow"><AdminCreditPacksForm packs={packs} defaults={DEFAULT_CREDIT_PACKS} custom={JSON.stringify(packs)!==JSON.stringify(DEFAULT_CREDIT_PACKS)}/>
        {last}
        <How><p>Суралцагч Багцууд хуудаснаас эдгээр багцын аль нэгийг туршилтын төлбөрөөр авна. Багц нэмэх, хасах, өөрчлөхдөө жагсаалтыг бүхэлд нь хадгална.</p><p>Худалдаж авсан кредит хугацаагүй, сарын болон багцын кредитийн дараа AI-д зарцуулагдана; үгсийн сангийн байнгын багтаамж авахад зөвхөн худалдаж авсан кредит ашиглана. Шинэ болон төлөгдөөгүй захиалгад шууд үйлчилнэ; төлөгдсөн захиалга анхны хэмжээ, дүнгээрээ үлдэнэ.</p></How></div>
      </>);
    }

    const types=[["set-price","Багцын үнэ"],["set-sale","Хямдрал"],["set-credits","AI кредит"],["set-credit-packs","Кредит багц"]] as const;
    const picked=types.find(([key])=>key===filter)?.[0]??"";
    const actions=picked==="set-credit-packs"?["set-credit-packs","set-credit-pack"]:picked?[picked]:Object.keys(changeKinds);
    const where:Prisma.AdminAuditWhereInput={action:{in:actions},...(q?{reason:{contains:q,mode:"insensitive"}}:{})};
    const info=pageInfo(await db.adminAudit.count({where}),requested);
    const rows=await db.adminAudit.findMany({where,skip:info.skip,take:info.size,orderBy:[{createdAt:"desc"},{id:"desc"}]});
    return frame(<>{tabs}
      {toolbar("Шалтгаанаар хайх…",{filters:{name:"filter",value:picked,options:[["","Бүх өөрчлөлт"],...types]}})}
      {table(["Огноо","Төрөл","Юу","Өмнө → дараа","Шалтгаан"],rows.map(row=>{const [what,text]=change(row);return <tr key={row.id}><td>{date(row.createdAt)}</td><td><span className="ws-pill">{changeKinds[row.action]}</span></td><td>{what}</td><td>{text}</td><td>{row.reason}<small><code>{row.actorId}</code></small></td></tr>;}),none("Өөрчлөлт алга. Анхны утгууд үйлчилж байна."))}
      <Pager info={info} href={page=>link({page})} label="өөрчлөлт"/>
    </>);
  }

  if(tab==="credits") {
    const months=await creditMonths();
    const period=months.includes(kind)?kind:creditPeriod(now.getTime());
    const ledger=view==="ledger";
    const picker=<AdminPicker label="Сар" value={period} options={months.map(month=>[month,month,link({kind:month,page:1})] as const)}/>;
    const ledgerTotal=await db.creditCharge.count({where:{period,user:userFilter}});
    const tabs=<SubTabs items={[["","Тойм"],["ledger","Үйлдлүүд",ledgerTotal]]} current={ledger?"ledger":""} href={key=>link({view:key,q:"",filter:"",action:""})}/>;

    if(!ledger) {
      const usage=await creditUsage(period,userFilter);
      const cover=usage.costMicroUsd?usage.valueMicroUsd/usage.costMicroUsd:null;
      return frame(<>{tabs}
        <Metrics items={[
          ["Зарцуулсан кредит",formatCredits(usage.spentCredits),`${usage.spentCount} үйлдэл · ${usage.users} хэрэглэгч`],
          ["Бодит DeepSeek зардал",formatUsd(usage.costMicroUsd),"Оргил цагийн үнээр, амжилтгүй дуудлага орсон"],
          ["Кредитийн үнэ цэнэ",formatUsd(usage.valueMicroUsd),cover===null?"Зардал бүртгэгдээгүй":`Бодит зардлын ${cover.toFixed(1)} дахин`],
          ["Буцаасан",formatCredits(usage.refundedCredits),`${usage.refundedCount} амжилтгүй үйлдэл${usage.heldCount?` · ${usage.heldCount} боловсруулж байна`:""}`],
        ]}/>
        <div className="admin-split admin-split-wide">
          <section className="admin-block"><h3>Үйлдлээр</h3>{usage.byAction.length?table(["Үйлдэл","Тоо","Кредит","Бодит зардал"],usage.byAction.map(row=><tr key={row.action}><td><Link href={link({view:"ledger",action:row.action,page:1})}><strong>{AI_ACTIONS[row.action].label}</strong><small>{AI_ACTIONS[row.action].area} · {creditRangeLabel(row.action)} кредит</small></Link></td><td>{row.spent}{row.refunded?<small>{row.refunded} буцаасан</small>:null}</td><td>{formatCredits(row.credits)}</td><td>{formatUsd(row.costMicroUsd)}<small>{row.spent?"дунджаар "+formatUsd(Math.round(row.costMicroUsd/(row.spent+row.refunded)))+" / үйлдэл":""}</small></td></tr>),null):<div className="admin-table-wrap">{none("Энэ сард AI үйлдэл алга.")}</div>}</section>
          <section className="admin-block"><h3>Хамгийн их зарцуулсан</h3><div className="ws-card">{usage.top.length?<ul className="admin-log">{usage.top.map(row=><li key={row.userId}>{userLink({id:row.userId,email:row.email,name:row.name})}<span>{formatCredits(row.credits)} кредит · {row.actions} үйлдэл</span><small>{formatUsd(row.costMicroUsd)}</small></li>)}</ul>:none("Хэрэглэгч алга.")}</div></section>
        </div>
        <How title="Кредитийн үнэ"><p>1 кредит = ${CREDIT_USD} ({DEEPSEEK_PRICE.model}, оргил цагийн үнэ: оролт ${DEEPSEEK_PRICE.inputCacheMiss}, гаралт ${DEEPSEEK_PRICE.output} / 1M токен, {DEEPSEEK_PRICE.checkedOn}). Сарын хэмжээг <Link href="/admin?tab=pricing&kind=credits">Үнэ › AI кредит</Link> хэсэгт, нэг хэрэглэгчид урамшууллыг түүний хуудаснаас олгоно.</p></How>
      </>,picker);
    }

    const statusWhere=["SPENT","REFUNDED","HELD"].includes(filter)?{status:filter}:{};
    const where:Prisma.CreditChargeWhereInput={period,user:userFilter,...statusWhere,...(isAiAction(actionFilter)?{action:actionFilter}:{})};
    const info=pageInfo(await db.creditCharge.count({where}),requested);
    const rows=await db.creditCharge.findMany({where,skip:info.skip,take:info.size,orderBy:[{createdAt:"desc"},{id:"desc"}],select:{id:true,action:true,credits:true,status:true,promptTokens:true,cachedTokens:true,completionTokens:true,costMicroUsd:true,createdAt:true,user:{select:{id:true,email:true,name:true}}}});
    const chargeStatus=(status:string)=>status==="SPENT"?<span className="ws-pill ok">Зарцуулсан</span>:status==="REFUNDED"?<span className="ws-pill">Буцаасан</span>:<span className="ws-pill info">Боловсруулж байна</span>;
    const chip=isAiAction(actionFilter)?<Link className="admin-chip" href={link({action:"",page:1})} title="Энэ шүүлтүүрийг арилгах">{AI_ACTIONS[actionFilter].label} ×</Link>:null;
    return frame(<>{tabs}
      {toolbar("Хэрэглэгчийн нэр эсвэл имэйл…",{filters:{name:"filter",value:filter,options:[["","Бүх төлөв"],["SPENT","Зарцуулсан"],["REFUNDED","Буцаасан"],["HELD","Боловсруулж байна"]]},exportKind:"credits",exportLabel:"AI кредитийн үйлдлүүд",chip})}
      {table(["Огноо","Хэрэглэгч","Үйлдэл","Кредит / төлөв","Токен / бодит зардал"],rows.map(row=><tr key={row.id}><td>{date(row.createdAt)}</td><td>{userLink(row.user)}</td><td>{isAiAction(row.action)?<>{AI_ACTIONS[row.action].label}<small>{AI_ACTIONS[row.action].area}</small></>:row.action}</td><td><strong>{row.status==="REFUNDED"?"0":"−"+row.credits}</strong> {chargeStatus(row.status)}</td><td>{formatCredits(row.promptTokens)} → {formatCredits(row.completionTokens)}<small>{row.cachedTokens?formatCredits(row.cachedTokens)+" кэш · ":""}{formatUsd(row.costMicroUsd)}</small></td></tr>),empty("AI үйлдэл олдсонгүй."))}
      <Pager info={info} href={page=>link({page})} label="үйлдэл"/>
    </>,picker);
  }

  if(tab==="audit") {
    const actions=auditActions.map(([key])=>key);
    const where:Prisma.AdminAuditWhereInput={...(actions.includes(filter)?{action:filter}:{}),...(q?{OR:[{target:{contains:q}},{action:{contains:q}},{reason:{contains:q,mode:"insensitive"}},{actorId:q}]}:{})};
    const info=pageInfo(await db.adminAudit.count({where}),requested);
    const audits=await db.adminAudit.findMany({where,skip:info.skip,take:info.size,orderBy:[{createdAt:"desc"},{id:"desc"}]});
    return frame(<>
      {toolbar("Зорилт, шалтгаан эсвэл админы ID…",{filters:{name:"filter",value:filter,options:[["","Бүх үйлдэл"],...auditActions]},exportKind:"audit",exportLabel:"үйлдлийн түүх"})}
      {table(["Огноо","Үйлдэл","Шалтгаан","Гүйцэтгэгч"],audits.map(row=><tr key={row.id}><td>{date(row.createdAt)}</td><td><strong>{auditLabel(row.action)}</strong><small>{row.target}</small></td><td>{row.reason}<details><summary>Өөрчлөлтийн мэдээлэл</summary><pre>{JSON.stringify(row.details,null,2)}</pre></details></td><td><code>{row.actorId}</code></td></tr>),none("Бүртгэгдсэн үйлдэл алга."))}
      <Pager info={info} href={page=>link({page})} label="үйлдэл"/>
    </>);
  }

  // System: a live snapshot to decide when to upgrade hosting, with the standing notes on their own tab.
  const notes=kind==="notes";
  const tabs=<SubTabs items={[["","Төлөв"],["notes","Тэмдэглэл"]]} current={notes?"notes":""} href={key=>link({kind:key})}/>;
  if(notes)return frame(<>{tabs}
    <div className="admin-notes">
      <section className="ws-card"><h3>Хэзээ өргөжүүлэх вэ</h3><ul><li>Өгөгдлийн сангийн хариу байнга 400 ms-ээс дээш эсвэл Neon CPU 80%+ бол Neon-ийн хэмжээг (CU) нэмэх, autoscaling асаах.</li><li>Өдөр бүр бодит хэрэглэгчтэй болмогц Neon-ийн 5 минутын autosuspend-ийг унтраах.</li><li>Бодит төлбөр авч эхлэхэд Vercel Pro руу шилжих.</li><li>Ярианы лабораторийн дуу хоолой, хөрвүүлэлт хамгийн их тооцоолол шаардана; өсөлттэй үед гадны үйлчилгээ рүү шилжүүлэх.</li></ul></section>
      <section className="ws-card"><h3>Аюулгүй байдал</h3><ul><li>Админ эрх сервер дээр шалгагдана.</li><li>Үйлдэл бүрийн шалтгаан, түүх хадгалагдана.</li><li>Хэрэглэгчид өөртөө админ эрх олгох боломжгүй.</li><li>Түр хаасан бүртгэл нэвтэрч чадахгүй, бүх сесс нь хаагдана.</li><li>Нэвтрэлт бүрийн IP, төхөөрөмж хэрэглэгчийн хуудсанд хадгалагдана.</li></ul></section>
      <section className="ws-card"><h3>Хяналт</h3><p>Гадны uptime монитор (жишээ нь UptimeRobot) <code>/api/health</code>-ийг 1–5 минут тутам шалгана: 200 бол хэвийн, 503 бол өгөгдлийн сан холбогдохгүй байна.</p></section>
      <section className="ws-card"><h3>Нээлтийн өмнөх ажил</h3><p>Мэргэжлийн IELTS үнэлгээ, бодит төлбөр/буцаалт, нөөц сэргээх туршилт хараахан бэлэн биш.</p></section>
    </div>
  </>);
  const dbMs=await databaseLatency();
  const hour=new Date(now.getTime()-36e5),day=new Date(now.getTime()-864e5);
  const [signInsHour,signInsDay,signUpsDay,activeDay,sessions,mocksLive,papersLive,limited]=await Promise.all([
    db.userEvent.count({where:{type:"sign-in",createdAt:{gte:hour}}}),db.userEvent.count({where:{type:"sign-in",createdAt:{gte:day}}}),
    db.userEvent.count({where:{type:"sign-up",createdAt:{gte:day}}}),db.userEvent.groupBy({by:["userId"],where:{createdAt:{gte:day}}}).then(rows=>rows.length),
    db.session.count({where:{expiresAt:{gt:now}}}),db.mockAttempt.count({where:{status:"IN_PROGRESS"}}),db.paperAttempt.count({where:{status:"IN_PROGRESS"}}),
    db.rateLimit.findMany({where:{lastRequest:{gte:BigInt(now.getTime()-6e4)}},orderBy:{count:"desc"},take:5,select:{key:true,count:true}}),
  ]);
  return frame(<>{tabs}
    <Metrics wide items={[["Өгөгдлийн сангийн хариу",dbMs+" ms",dbMs<100?"Хэвийн":dbMs<400?"Удаашралтай":"Удаан"],["Нэвтрэлт · 1 цаг",signInsHour,signInsDay+" · 24 цаг"],["Идэвхтэй хэрэглэгч · 24 цаг",activeDay,signUpsDay+" шинэ бүртгэл"],["Хүчинтэй сесс",sessions],["Явагдаж буй шалгалт",mocksLive+papersLive,mocksLive+" mock · "+papersLive+" албан материал"]]}/>
    <section className="admin-block"><h3>Хамгийн их хүсэлт · сүүлийн 1 минут</h3><div className="ws-card">{limited.length?<ul className="admin-log">{limited.map(row=><li key={row.key}><code>{row.key}</code><small>{row.count} хүсэлт</small></li>)}</ul>:none("Сүүлийн 1 минутад хүсэлт бүртгэгдээгүй.")}</div></section>
  </>);
}
