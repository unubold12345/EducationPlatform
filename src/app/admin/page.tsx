import "./admin.css";
import { findExam } from "@/modules/exams/definitions";
import { adminUserScope,realPaymentScope } from "@/modules/admin/data-scope";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Prisma } from "@/generated/prisma/client";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/db";
import { isAdmin,contentCatalog,databaseLatency } from "@/modules/admin/service";
import { subscriptionPlans } from "@/modules/subscriptions/plans";
import { planPrices } from "@/modules/subscriptions/prices";
import { pageInfo,parsePage } from "@/modules/admin/paging";
import { AdminShell,Pager,StatusPill,SubTabs,adminGroups,adminTabInfo,adminTabs,auditActions,auditLabel,adminDate as date,money,statusLabel,type AdminTab } from "@/modules/admin/ui";
import { AdminPriceForm } from "@/components/admin-price-form";
import { AdminCreditForm } from "@/components/admin-credit-form";
import { creditAllowances } from "@/modules/credits/service";
import { creditMonths, creditUsage } from "@/modules/admin/credits";
import { AI_ACTIONS, CREDIT_USD, DEEPSEEK_PRICE, creditPeriod, creditRangeLabel, defaultAllowances, formatCredits, formatUsd, isAiAction } from "@/modules/credits/pricing";

export const metadata:Metadata={title:"Удирдлагын төв",robots:{index:false,follow:false}};
const one=(value:string|string[]|undefined)=>typeof value==="string"?value:"";
const StatusLabelText=({status}:{status:string})=>statusLabel(status);

export default async function AdminPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const session=await getSession();if(!session)redirect("/login?next=%2Fadmin");
  if(!await isAdmin(session.user.id))return <div className="container page-space"><p className="eyebrow">403 · ХАНДАЛТ ХЯЗГААРЛАГДСАН</p><h1>Админ эрх шаардлагатай.</h1><p>Энэ бүртгэл удирдлагын эрхгүй байна.</p><Link className="button primary" href="/workspace">Workspace руу</Link></div>;
  const params=await searchParams;
  const tab:AdminTab=adminTabs.some(([key])=>key===params.tab)?params.tab as AdminTab:"overview";
  const q=one(params.q).trim().slice(0,100);
  const testData=params.data==="test";
  const requested=parsePage(params.page);
  const filter=one(params.filter);const kind=one(params.kind);
  const now=new Date();const db=getDb();
  const searchFilter:Prisma.UserWhereInput=q?{OR:[{email:{contains:q,mode:"insensitive"}},{name:{contains:q,mode:"insensitive"}},{id:q}]}:{};
  const userFilter:Prisma.UserWhereInput={AND:[adminUserScope(testData),searchFilter]};
  const paymentScope=testData?{provider:{in:["MOCK","LEGACY"]}}:realPaymentScope;
  const actionFilter=tab==="credits"?one(params.action):"";
  const link=(patch:Record<string,string|number>={})=>"/admin?"+new URLSearchParams(Object.entries({tab,q,data:testData?"test":"",filter,kind,action:actionFilter,...patch}).filter(([,value])=>value!==""&&value!==undefined).map(([key,value])=>[key,String(value)]));
  const name=session.user.name;
  const title=adminTabs.find(([key])=>key===tab)![1];
  const scope=<div className="admin-data-scope" role="group" aria-label="Өгөгдөл"><Link aria-current={!testData?"page":undefined} href={"/admin?tab="+tab}>Бодит</Link><Link aria-current={testData?"page":undefined} href={"/admin?tab="+tab+"&data=test"}>Туршилт</Link></div>;
  const testBanner=testData&&<p className="admin-test-banner">Туршилтын өгөгдөл: тест бүртгэл, дуурайлгасан төлбөр. Бодит орлого биш.</p>;
  const empty=(text:string)=><p className="admin-empty">{text}{!testData&&<> <Link href={"/admin?tab="+tab+"&data=test"}>Туршилтын өгөгдөл харах →</Link></>}</p>;
  const description=adminTabInfo[tab];
  const search=(placeholder:string,filters?:{name:string;value:string;options:[string,string][]})=><form className="admin-search" action="/admin"><input type="hidden" name="tab" value={tab}/>{testData&&<input type="hidden" name="data" value="test"/>}{kind&&<input type="hidden" name="kind" value={kind}/>}{actionFilter&&<input type="hidden" name="action" value={actionFilter}/>}<label className="sr-only" htmlFor="admin-search">Хайх</label><input id="admin-search" name="q" defaultValue={q} maxLength={100} placeholder={placeholder}/>{filters&&<select name={filters.name} aria-label="Шүүлтүүр" defaultValue={filters.value}>{filters.options.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>}<button className="button secondary">Хайх</button>{(q||filter)&&<Link className="text-link" href={"/admin?tab="+tab+(testData?"&data=test":"")+(kind?"&kind="+kind:"")}>Цэвэрлэх</Link>}</form>;
  const exportLink=(what:string,label:string)=><a className="admin-export" title={"Сүүлийн 1,000 мөр: "+label} href={"/api/admin/export?kind="+what+(testData?"&data=test":"")}>CSV татах ↓</a>;
  const userLink=(user:{id:string;email:string;name?:string})=><Link href={"/admin/users/"+user.id}>{user.name?<><strong>{user.name}</strong><small>{user.email}</small></>:user.email}</Link>;

  if(tab==="overview") {
    const [usersTotal,newUsers,activePlans,mockTotal,paperCount,paidMocks,paidPlans,suspended,pending,drafts,audits,recentUsers]=await Promise.all([
      db.user.count({where:userFilter}),db.user.count({where:{AND:[userFilter,{createdAt:{gte:new Date(now.getTime()-7*864e5)}}]}}),
      db.subscription.count({where:{startsAt:{lte:now},endsAt:{gt:now},user:userFilter}}),db.mockAttempt.count({where:{user:userFilter}}),db.paperAttempt.count({where:{user:userFilter}}),
      db.mockPurchase.aggregate({where:{status:"PAID",...paymentScope,user:userFilter},_sum:{amountMnt:true}}),db.subscriptionOrder.aggregate({where:{status:"PAID",...paymentScope,user:userFilter},_sum:{amountMnt:true}}),
      db.user.count({where:{AND:[userFilter,{suspendedAt:{not:null}}]}}),db.subscriptionOrder.count({where:{status:"PENDING",...paymentScope,user:userFilter}}),
      db.contentDraft.count({where:{status:{not:"PUBLISHED"}}}),
      db.adminAudit.findMany({orderBy:[{createdAt:"desc"},{id:"desc"}],take:6}),
      db.user.findMany({where:userFilter,orderBy:[{createdAt:"desc"},{id:"desc"}],take:6,select:{id:true,name:true,email:true,createdAt:true}}),
    ]);
    const ai=await creditUsage(creditPeriod(now.getTime()),userFilter).catch(()=>null);
    return <AdminShell tab={tab} title={title} name={name} testData={testData} scope={scope} description={description}>{testBanner}
      <div className="admin-metrics">{([["Нийт хэрэглэгч",usersTotal,`+${newUsers} энэ 7 хоногт`],["Идэвхтэй сарын эрх",activePlans,""],["Шалгалт",mockTotal+paperCount,"оролдлого"],[testData?"Туршилтын төлбөр":"Бодит төлбөр",money((paidMocks._sum.amountMnt??0)+(paidPlans._sum.amountMnt??0)),testData?"Бодит орлого биш":"нийт"]] as const).map(([label,value,sub])=><article key={label}><p>{label}</p><strong>{value}</strong>{sub&&<small>{sub}</small>}</article>)}</div>
      {ai&&<Link className="admin-ai-strip" href={"/admin?tab=credits"+(testData?"&data=test":"")}><span>AI · энэ сар</span><strong>{formatCredits(ai.spentCredits)} кредит</strong><span>{ai.spentCount} үйлдэл · {ai.users} хэрэглэгч</span><span>Бодит DeepSeek зардал {formatUsd(ai.costMicroUsd)}</span><em>Дэлгэрэнгүй →</em></Link>}
      <section className="admin-block"><h3>Анхаарах зүйл</h3><div className="admin-attention">
        {([["Түр хаасан бүртгэл",suspended,"/admin?tab=users&filter=suspended"+(testData?"&data=test":"")],["Хүлээгдэж буй захиалга",pending,"/admin?tab=payments&kind=orders&filter=PENDING"+(testData?"&data=test":"")],["Нийтлээгүй ноорог",drafts,"/admin?tab=content&filter=draft"]] as const).map(([label,count,href])=><Link key={label} className={count?"has-items":""} href={href}><strong>{count}</strong><span>{label}</span></Link>)}
      </div></section>
      <div className="admin-columns">
        <section className="ws-card"><div className="ws-card-head"><h3>Шинэ хэрэглэгчид</h3><Link className="text-link" href={"/admin?tab=users"+(testData?"&data=test":"")}>Бүгд</Link></div>{recentUsers.length?<ul className="admin-log">{recentUsers.map(user=><li key={user.id}>{userLink(user)}<small>{date(user.createdAt)}</small></li>)}</ul>:empty("Хэрэглэгч алга.")}</section>
        <section className="ws-card"><div className="ws-card-head"><h3>Сүүлийн админ үйлдэл</h3><Link className="text-link" href="/admin?tab=audit">Бүгд</Link></div>{audits.length?<ul className="admin-log">{audits.map(row=><li key={row.id}><strong>{auditLabel(row.action)}</strong><span>{row.reason}</span><small>{date(row.createdAt)}</small></li>)}</ul>:<p className="admin-empty">Үйлдэл алга.</p>}</section>
      </div>
      <section className="admin-block"><h3>Хэсгүүд</h3><div className="admin-directory">{adminGroups.flatMap(group=>group.tabs).map(key=><Link key={key} href={"/admin?tab="+key+(testData?"&data=test":"")}><strong>{adminTabs.find(([tabKey])=>tabKey===key)![1]}</strong><span>{adminTabInfo[key]}</span></Link>)}</div></section>
    </AdminShell>;
  }

  if(tab==="users") {
    const status:Prisma.UserWhereInput=filter==="suspended"?{suspendedAt:{not:null}}:filter==="admin"?{adminMembership:{isNot:null}}:filter==="plan"?{subscriptions:{some:{startsAt:{lte:now},endsAt:{gt:now}}}}:filter==="unverified"?{emailVerified:false}:filter==="paid"?{OR:[{subscriptionOrders:{some:{status:"PAID"}}},{mockPurchases:{some:{status:"PAID"}}}]}:{};
    const where:Prisma.UserWhereInput={AND:[userFilter,status]};
    const info=pageInfo(await db.user.count({where}),requested);
    const users=await db.user.findMany({where,skip:info.skip,take:info.size,orderBy:[{createdAt:"desc"},{id:"desc"}],select:{id:true,name:true,email:true,emailVerified:true,createdAt:true,suspendedAt:true,adminMembership:{select:{userId:true}},_count:{select:{sessions:true,mockAttempts:true,paperAttempts:true}},subscriptions:{select:{program:true,endsAt:true,startsAt:true}}}});
    const lastSeen=users.length?await db.userEvent.groupBy({by:["userId"],where:{userId:{in:users.map(user=>user.id)},type:"sign-in"},_max:{createdAt:true}}):[];
    return <AdminShell tab={tab} title={title} name={name} testData={testData} scope={scope} description={description}>{testBanner}
      {search("Нэр, имэйл эсвэл ID-аар хайх…",{name:"filter",value:filter,options:[["","Бүх хэрэглэгч"],["plan","Идэвхтэй эрхтэй"],["paid","Төлбөр төлсөн"],["unverified","Имэйл баталгаажаагүй"],["suspended","Түр хаасан"],["admin","Админ"]]})}
      {exportLink("users","хэрэглэгчид")}
      <div className="admin-table-wrap"><table><thead><tr><th>Хэрэглэгч</th><th>Төлөв</th><th>Бүртгүүлсэн / сүүлд</th><th>Эрх</th><th>Явц</th></tr></thead><tbody>{users.map(user=>{const seen=lastSeen.find(row=>row.userId===user.id)?._max.createdAt;return <tr key={user.id}>
        <td>{userLink(user)}</td>
        <td><span className={"ws-pill "+(user.suspendedAt?"bad":user.adminMembership?"info":"")}>{user.suspendedAt?"Хаасан":user.adminMembership?"Админ":"Суралцагч"}</span>{!user.emailVerified&&<small>Имэйл баталгаажаагүй</small>}</td>
        <td>{date(user.createdAt)}<small>{seen?"Сүүлд: "+date(seen):"Нэвтрэлтийн бүртгэлгүй"}</small></td>
        <td>{user.subscriptions.filter(plan=>plan.startsAt<=now&&plan.endsAt>now).map(plan=><small key={plan.program}>{plan.program.toUpperCase()} → {date(plan.endsAt)}</small>)}{!user.subscriptions.some(plan=>plan.startsAt<=now&&plan.endsAt>now)&&<small>—</small>}</td>
        <td>{user._count.mockAttempts+user._count.paperAttempts} шалгалт<small>{user._count.sessions} идэвхтэй сесс</small></td>
      </tr>;})}</tbody></table>{!users.length&&empty("Хэрэглэгч олдсонгүй.")}</div>
      <Pager info={info} href={page=>link({page})} label="хэрэглэгч"/>
    </AdminShell>;
  }

  if(tab==="subscriptions") {
    const state:Prisma.SubscriptionWhereInput=filter==="active"?{startsAt:{lte:now},endsAt:{gt:now}}:filter==="expired"?{endsAt:{lte:now}}:{};
    const where:Prisma.SubscriptionWhereInput={user:userFilter,...state,...(kind?{program:kind}:{})};
    const info=pageInfo(await db.subscription.count({where}),requested);
    const rows=await db.subscription.findMany({where,skip:info.skip,take:info.size,orderBy:[{endsAt:"desc"},{id:"desc"}],select:{id:true,program:true,startsAt:true,endsAt:true,user:{select:{id:true,name:true,email:true}}}});
    return <AdminShell tab={tab} title={title} name={name} testData={testData} scope={scope} description={description}>{testBanner}
      <SubTabs items={[["","Бүх багц"],...subscriptionPlans.map(plan=>[plan.program,plan.shortTitle] as const)]} current={kind} href={key=>link({kind:key,page:1})}/>
      {search("Нэр эсвэл имэйлээр хайх…",{name:"filter",value:filter,options:[["","Бүх төлөв"],["active","Идэвхтэй"],["expired","Дууссан"]]})}
      {exportLink("subscriptions","сарын эрх")}
      <div className="admin-table-wrap"><table><thead><tr><th>Хэрэглэгч</th><th>Багц</th><th>Хугацаа</th><th>Төлөв</th></tr></thead><tbody>{rows.map(row=><tr key={row.id}><td>{userLink(row.user)}</td><td>{row.program.toUpperCase()}</td><td>{date(row.startsAt)}<small>→ {date(row.endsAt)}</small></td><td><span className={"ws-pill "+(row.startsAt<=now&&row.endsAt>now?"ok":"")}>{row.startsAt<=now&&row.endsAt>now?"Идэвхтэй":"Дууссан"}</span></td></tr>)}</tbody></table>{!rows.length&&empty("Сарын эрх олдсонгүй.")}</div>
      <Pager info={info} href={page=>link({page})}/>
    </AdminShell>;
  }

  if(tab==="payments") {
    const view=kind==="purchases"?"purchases":"orders";
    const statusWhere=["PAID","DECLINED","PENDING"].includes(filter)?{status:filter}:{};
    const base={user:userFilter,...paymentScope};
    const [orderTotal,purchaseTotal]=await Promise.all([db.subscriptionOrder.count({where:{...base,...statusWhere}}),db.mockPurchase.count({where:{...base,...statusWhere}})]);
    const info=pageInfo(view==="orders"?orderTotal:purchaseTotal,requested);
    const rows=view==="orders"
      ?(await db.subscriptionOrder.findMany({where:{...base,...statusWhere},skip:info.skip,take:info.size,orderBy:[{createdAt:"desc"},{id:"desc"}],select:{id:true,program:true,status:true,provider:true,amountMnt:true,createdAt:true,paidAt:true,user:{select:{id:true,email:true}}}})).map(row=>({...row,label:row.program.toUpperCase()+" · сарын эрх"}))
      :(await db.mockPurchase.findMany({where:{...base,...statusWhere},skip:info.skip,take:info.size,orderBy:[{createdAt:"desc"},{id:"desc"}],select:{id:true,examSlug:true,status:true,provider:true,amountMnt:true,createdAt:true,paidAt:true,user:{select:{id:true,email:true}}}})).map(row=>({...row,label:findExam(row.examSlug)?.title??"Хасагдсан албан материал · "+row.examSlug}));
    return <AdminShell tab={tab} title={title} name={name} testData={testData} scope={scope} description={description}>{testBanner}
      <SubTabs items={[["orders","Сарын багцын захиалга",orderTotal],["purchases","Нэг шалгалтын эрх",purchaseTotal]]} current={view} href={key=>link({kind:key,page:1})}/>
      {search("Хэрэглэгчийн нэр эсвэл имэйл…",{name:"filter",value:filter,options:[["","Бүх төлөв"],["PAID","Төлөгдсөн"],["PENDING","Хүлээгдэж байна"],["DECLINED","Амжилтгүй"]]})}
      {view==="orders"&&exportLink("payments","сарын багцын захиалга")}
      <div className="admin-table-wrap"><table><thead><tr><th>Огноо</th><th>Хэрэглэгч</th><th>Бүтээгдэхүүн</th><th>Дүн</th><th>Төлөв</th><th>Баримт</th></tr></thead><tbody>{rows.map(row=><tr key={row.id}><td>{date(row.createdAt)}{row.paidAt&&<small>Төлсөн: {date(row.paidAt)}</small>}</td><td>{userLink(row.user)}</td><td>{row.label}</td><td><strong>{money(row.amountMnt)}</strong></td><td><StatusPill status={row.status}/></td><td><code>{row.id}</code><small>{row.provider}</small></td></tr>)}</tbody></table>{!rows.length&&empty(testData?"Гүйлгээ олдсонгүй.":"Бодит төлбөр хараахан холбогдоогүй.")}</div>
      <Pager info={info} href={page=>link({page})} label="гүйлгээ"/>
    </AdminShell>;
  }

  if(tab==="attempts") {
    const view=kind==="papers"?"papers":"mocks";
    const statusWhere=["IN_PROGRESS","SUBMITTED"].includes(filter)?{status:filter as "IN_PROGRESS"|"SUBMITTED"}:{};
    const where={user:userFilter,...statusWhere};
    const [mockTotal,paperTotal]=await Promise.all([db.mockAttempt.count({where}),db.paperAttempt.count({where})]);
    const info=pageInfo(view==="mocks"?mockTotal:paperTotal,requested);
    const page={where,skip:info.skip,take:info.size,orderBy:[{createdAt:"desc" as const},{id:"desc" as const}]};
    const rows=view==="mocks"
      ?(await db.mockAttempt.findMany({...page,select:{id:true,slug:true,status:true,createdAt:true,updatedAt:true,subscriptionAccess:true,user:{select:{id:true,email:true}}}})).map(row=>({...row,label:findExam(row.slug)?.title??row.slug,result:row.subscriptionAccess?"Сарын эрхээр":"Нэг удаагийн эрхээр"}))
      :(await db.paperAttempt.findMany({...page,select:{id:true,slug:true,status:true,createdAt:true,updatedAt:true,user:{select:{id:true,email:true}}}})).map(row=>({...row,label:"Хасагдсан албан материал · "+row.slug,result:"—"}));
    return <AdminShell tab={tab} title={title} name={name} testData={testData} scope={scope} description={description}>{testBanner}
      <SubTabs items={[["mocks","Бүтэн mock",mockTotal],["papers","Хасагдсан албан материал",paperTotal]]} current={view} href={key=>link({kind:key,page:1})}/>
      {search("Хэрэглэгчийн нэр эсвэл имэйл…",{name:"filter",value:filter,options:[["","Бүх төлөв"],["IN_PROGRESS","Үргэлжилж байна"],["SUBMITTED","Дууссан"]]})}
      <div className="admin-table-wrap"><table><thead><tr><th>Эхэлсэн</th><th>Суралцагч</th><th>Материал</th><th>Төлөв</th><th>Сүүлд</th></tr></thead><tbody>{rows.map(row=><tr key={row.id}><td>{date(row.createdAt)}</td><td>{userLink(row.user)}</td><td>{row.label}<small><code>{row.id}</code></small></td><td><StatusPill status={row.status}/><small>{row.result}</small></td><td>{date(row.updatedAt)}</td></tr>)}</tbody></table>{!rows.length&&empty("Оролдлого олдсонгүй.")}</div>
      <Pager info={info} href={page=>link({page})} label="оролдлого"/>
    </AdminShell>;
  }

  if(tab==="content") {
    const [reviews,drafts,published]=await Promise.all([db.contentReview.findMany(),db.contentDraft.findMany({select:{key:true,status:true,updatedAt:true}}),db.publishedContent.findMany({distinct:["key"],orderBy:{version:"desc"},select:{key:true,version:true,createdAt:true}})]);
    const needle=q.toLowerCase();
    const items=contentCatalog().filter(item=>(!kind||item.program===kind)&&(!needle||[item.key,item.title,item.kind].some(text=>text.toLowerCase().includes(needle)))&&(filter!=="draft"||drafts.some(row=>row.key===item.key&&row.status!=="PUBLISHED"))&&(filter!=="edited"||published.some(row=>row.key===item.key)));
    const info=pageInfo(items.length,requested);
    const programs=[...new Set(contentCatalog().map(item=>item.program))];
    return <AdminShell tab={tab} title={title} name={name} description={description}>
      <SubTabs items={[["","Бүгд"],...programs.map(program=>[program,program==="entrance"?"Элсэлт":program.toUpperCase()] as const)]} current={kind} href={key=>link({kind:key,page:1})}/>
      {search("Гарчиг, төрөл эсвэл түлхүүрээр хайх…",{name:"filter",value:filter,options:[["","Бүх материал"],["edited","Засварласан"],["draft","Нийтлээгүй ноорогтой"]]})}
      <div className="admin-table-wrap"><table><thead><tr><th>Материал</th><th>Төрөл</th><th>Хувилбар</th><th>Ноорог / хяналт</th><th></th></tr></thead><tbody>{items.slice(info.skip,info.skip+info.size).map(item=>{const review=reviews.find(row=>row.key===item.key);const draft=drafts.find(row=>row.key===item.key);const current=published.find(row=>row.key===item.key);return <tr key={item.key}>
        <td><Link href={"/admin/content/"+item.key}><strong>{item.title}</strong><small>{item.key}</small></Link></td>
        <td>{item.program.toUpperCase()} · {item.kind}<small>{item.count} асуулт</small></td>
        <td>v{current?.version??1}<small>{current?date(current.createdAt):"Эх хувилбар"}</small></td>
        <td>{draft?<StatusPill status={draft.status}/>:"—"}<small>Хяналт: <StatusLabelText status={review?.status??"PENDING"}/></small></td>
        <td><Link className="admin-small-button" href={"/admin/content/"+item.key}>Засах →</Link></td>
      </tr>;})}</tbody></table>{!items.length&&<p className="admin-empty">Материал олдсонгүй.</p>}</div>
      <Pager info={info} href={page=>link({page})} label="материал"/>
    </AdminShell>;
  }

  if(tab==="pricing") {
    const [prices,history,allowances,creditHistory]=await Promise.all([planPrices(),db.adminAudit.findMany({where:{action:"set-price"},orderBy:[{createdAt:"desc"},{id:"desc"}],take:20}),creditAllowances(),db.adminAudit.findMany({where:{action:"set-credits"},orderBy:[{createdAt:"desc"},{id:"desc"}],take:20})]);
    const defaults=defaultAllowances();
    return <AdminShell tab={tab} title={title} name={name} description={description}>
      <p className="admin-help">Шинэ болон төлөгдөөгүй захиалгад шууд үйлчилнэ. Төлөгдсөн захиалга анхны дүнгээрээ үлдэнэ.</p>
      <div className="admin-prices">{subscriptionPlans.map(plan=><AdminPriceForm key={plan.program} program={plan.program} title={plan.title} amount={prices[plan.program]} fallback={plan.amountMnt}/>)}</div>
      <h3 className="admin-subhead">Үнийн өөрчлөлтийн түүх</h3>
      <div className="admin-table-wrap"><table><thead><tr><th>Огноо</th><th>Багц</th><th>Өмнө → дараа</th><th>Шалтгаан</th></tr></thead><tbody>{history.map(row=>{const d=row.details as {program?:string;before?:number;after?:number};return <tr key={row.id}><td>{date(row.createdAt)}</td><td>{d.program?.toUpperCase()}</td><td>{money(d.before??0)} → {money(d.after??0)}</td><td>{row.reason}<small><code>{row.actorId}</code></small></td></tr>;})}</tbody></table>{!history.length&&<p className="admin-empty">Үнэ өөрчлөгдөөгүй. Анхны үнэ үйлчилж байна.</p>}</div>
      <p className="fine-print">Нэг mock шалгалтын үнэ ₮10,000 хэвээр (кодонд тогтмол).</p>
      <h3 className="admin-subhead" id="credit-allowances">AI кредит / сар</h3>
      <p className="admin-help">Үнэгүй кредит бүх баталгаажсан бүртгэлд, багцын кредит идэвхтэй багц бүрт нэмэгдэнэ. Энэ сарын үлдэгдэлд шууд нөлөөлнө; зарцуулсан кредит буцахгүй. Үйлдэл бүрийн кредитийн үнэ DeepSeek-ийн токены үнээр кодонд тогтмол (<Link href="/admin?tab=credits">AI кредит</Link>).</p>
      <div className="admin-prices admin-credit-allowances">{([["free","Үнэгүй (бүх бүртгэл)"],...subscriptionPlans.map(plan=>[plan.program,plan.title] as const)] as const).map(([key,label])=><AdminCreditForm key={key} allowanceKey={key} title={label} credits={allowances[key as keyof typeof allowances]} fallback={defaults[key as keyof typeof defaults]}/>)}</div>
      <h3 className="admin-subhead">Кредитийн хэмжээний түүх</h3>
      <div className="admin-table-wrap"><table><thead><tr><th>Огноо</th><th>Хэнд</th><th>Өмнө → дараа</th><th>Шалтгаан</th></tr></thead><tbody>{creditHistory.map(row=>{const d=row.details as {key?:string;before?:number;after?:number};return <tr key={row.id}><td>{date(row.createdAt)}</td><td>{d.key==="free"?"Үнэгүй":d.key?.toUpperCase()}</td><td>{formatCredits(d.before??0)} → {formatCredits(d.after??0)}</td><td>{row.reason}<small><code>{row.actorId}</code></small></td></tr>;})}</tbody></table>{!creditHistory.length&&<p className="admin-empty">Кредитийн хэмжээ өөрчлөгдөөгүй. Анхны хэмжээ үйлчилж байна.</p>}</div>
    </AdminShell>;
  }

  if(tab==="credits") {
    const months=await creditMonths();
    const period=months.includes(kind)?kind:creditPeriod(now.getTime());
    const usage=await creditUsage(period,userFilter);
    const statusWhere=["SPENT","REFUNDED","HELD"].includes(filter)?{status:filter}:{};
    const where:Prisma.CreditChargeWhereInput={period,user:userFilter,...statusWhere,...(isAiAction(params.action)?{action:params.action}:{})};
    const info=pageInfo(await db.creditCharge.count({where}),requested);
    const rows=await db.creditCharge.findMany({where,skip:info.skip,take:info.size,orderBy:[{createdAt:"desc"},{id:"desc"}],select:{id:true,action:true,credits:true,status:true,promptTokens:true,cachedTokens:true,completionTokens:true,costMicroUsd:true,createdAt:true,user:{select:{id:true,email:true,name:true}}}});
    const cover=usage.costMicroUsd?usage.valueMicroUsd/usage.costMicroUsd:null;
    const chargeStatus=(status:string)=>status==="SPENT"?<span className="ws-pill ok">Зарцуулсан</span>:status==="REFUNDED"?<span className="ws-pill">Буцаасан</span>:<span className="ws-pill info">Боловсруулж байна</span>;
    return <AdminShell tab={tab} title={title} name={name} testData={testData} scope={scope} description={description}>{testBanner}
      <SubTabs items={months.map(month=>[month,month] as const)} current={period} href={key=>link({kind:key,page:1})}/>
      <div className="admin-metrics">{([
        ["Зарцуулсан кредит",formatCredits(usage.spentCredits),`${usage.spentCount} үйлдэл · ${usage.users} хэрэглэгч`],
        ["Бодит DeepSeek зардал",formatUsd(usage.costMicroUsd),"Оргил цагийн үнээр, амжилтгүй дуудлага орсон"],
        ["Кредитийн үнэ цэнэ",formatUsd(usage.valueMicroUsd),cover===null?"Зардал бүртгэгдээгүй":`Бодит зардлын ${cover.toFixed(1)} дахин`],
        ["Буцаасан",formatCredits(usage.refundedCredits),`${usage.refundedCount} амжилтгүй үйлдэл${usage.heldCount?` · ${usage.heldCount} боловсруулж байна`:""}`],
      ] as const).map(([label,value,sub])=><article key={label}><p>{label}</p><strong>{value}</strong><small>{sub}</small></article>)}</div>
      <p className="admin-help">1 кредит = ${CREDIT_USD} ({DEEPSEEK_PRICE.model}, оргил цагийн үнэ: оролт ${DEEPSEEK_PRICE.inputCacheMiss}, гаралт ${DEEPSEEK_PRICE.output} / 1M токен, {DEEPSEEK_PRICE.checkedOn}). Сарын хэмжээг <Link href="/admin?tab=pricing#credit-allowances">Үнэ</Link> хэсэгт, нэг хэрэглэгчид урамшууллыг түүний хуудаснаас олгоно.</p>
      <section className="admin-block"><h3>Үйлдлээр</h3>{usage.byAction.length?<div className="admin-table-wrap"><table><thead><tr><th>Үйлдэл</th><th>Тоо</th><th>Кредит</th><th>Бодит зардал</th></tr></thead><tbody>{usage.byAction.map(row=><tr key={row.action}><td><Link href={link({action:row.action,page:1})}><strong>{AI_ACTIONS[row.action].label}</strong><small>{AI_ACTIONS[row.action].area} · {creditRangeLabel(row.action)} кредит</small></Link></td><td>{row.spent}{row.refunded?<small>{row.refunded} буцаасан</small>:null}</td><td>{formatCredits(row.credits)}</td><td>{formatUsd(row.costMicroUsd)}<small>{row.spent?"дунджаар "+formatUsd(Math.round(row.costMicroUsd/(row.spent+row.refunded)))+" / үйлдэл":""}</small></td></tr>)}</tbody></table></div>:<p className="admin-empty">Энэ сард AI үйлдэл алга.</p>}</section>
      <section className="ws-card"><div className="ws-card-head"><h3>Хамгийн их зарцуулсан</h3></div>{usage.top.length?<ul className="admin-log">{usage.top.map(row=><li key={row.userId}>{userLink({id:row.userId,email:row.email,name:row.name})}<span>{formatCredits(row.credits)} кредит · {row.actions} үйлдэл</span><small>{formatUsd(row.costMicroUsd)}</small></li>)}</ul>:<p className="admin-empty">Хэрэглэгч алга.</p>}</section>
      <h3 className="admin-subhead">Үйлдлүүд</h3>
      {search("Хэрэглэгчийн нэр эсвэл имэйл…",{name:"filter",value:filter,options:[["","Бүх төлөв"],["SPENT","Зарцуулсан"],["REFUNDED","Буцаасан"],["HELD","Боловсруулж байна"]]})}
      {exportLink("credits","AI кредитийн үйлдлүүд")}
      <div className="admin-table-wrap"><table><thead><tr><th>Огноо</th><th>Хэрэглэгч</th><th>Үйлдэл</th><th>Кредит / төлөв</th><th>Токен / бодит зардал</th></tr></thead><tbody>{rows.map(row=><tr key={row.id}><td>{date(row.createdAt)}</td><td>{userLink(row.user)}</td><td>{isAiAction(row.action)?<>{AI_ACTIONS[row.action].label}<small>{AI_ACTIONS[row.action].area}</small></>:row.action}</td><td><strong>{row.status==="REFUNDED"?"0":"−"+row.credits}</strong> {chargeStatus(row.status)}</td><td>{formatCredits(row.promptTokens)} → {formatCredits(row.completionTokens)}<small>{row.cachedTokens?formatCredits(row.cachedTokens)+" кэш · ":""}{formatUsd(row.costMicroUsd)}</small></td></tr>)}</tbody></table>{!rows.length&&empty("AI үйлдэл олдсонгүй.")}</div>
      <Pager info={info} href={page=>link({page})} label="үйлдэл"/>
    </AdminShell>;
  }

  if(tab==="audit") {
    const actions=auditActions.map(([key])=>key);
    const where:Prisma.AdminAuditWhereInput={...(actions.includes(filter)?{action:filter}:{}),...(q?{OR:[{target:{contains:q}},{action:{contains:q}},{reason:{contains:q,mode:"insensitive"}},{actorId:q}]}:{})};
    const info=pageInfo(await db.adminAudit.count({where}),requested);
    const audits=await db.adminAudit.findMany({where,skip:info.skip,take:info.size,orderBy:[{createdAt:"desc"},{id:"desc"}]});
    return <AdminShell tab={tab} title={title} name={name} description={description}>
      {search("Зорилт, шалтгаан эсвэл админы ID…",{name:"filter",value:filter,options:[["","Бүх үйлдэл"],...auditActions.map(([key,label])=>[key,label] as [string,string])]})}
      {exportLink("audit","үйлдлийн түүх")}
      <div className="admin-table-wrap"><table><thead><tr><th>Огноо</th><th>Үйлдэл</th><th>Шалтгаан</th><th>Гүйцэтгэгч</th></tr></thead><tbody>{audits.map(row=><tr key={row.id}><td>{date(row.createdAt)}</td><td><strong>{auditLabel(row.action)}</strong><small>{row.target}</small></td><td>{row.reason}<details><summary>Өөрчлөлтийн мэдээлэл</summary><pre>{JSON.stringify(row.details,null,2)}</pre></details></td><td><code>{row.actorId}</code></td></tr>)}</tbody></table>{!audits.length&&<p className="admin-empty">Бүртгэгдсэн үйлдэл алга.</p>}</div>
      <Pager info={info} href={page=>link({page})} label="үйлдэл"/>
    </AdminShell>;
  }

  // Settings: a live system snapshot to decide when to upgrade hosting, then the security notes.
  const dbMs=await databaseLatency();
  const hour=new Date(now.getTime()-36e5),day=new Date(now.getTime()-864e5);
  const [signInsHour,signInsDay,signUpsDay,activeDay,sessions,mocksLive,papersLive,limited]=await Promise.all([
    db.userEvent.count({where:{type:"sign-in",createdAt:{gte:hour}}}),db.userEvent.count({where:{type:"sign-in",createdAt:{gte:day}}}),
    db.userEvent.count({where:{type:"sign-up",createdAt:{gte:day}}}),db.userEvent.groupBy({by:["userId"],where:{createdAt:{gte:day}}}).then(rows=>rows.length),
    db.session.count({where:{expiresAt:{gt:now}}}),db.mockAttempt.count({where:{status:"IN_PROGRESS"}}),db.paperAttempt.count({where:{status:"IN_PROGRESS"}}),
    db.rateLimit.findMany({where:{lastRequest:{gte:BigInt(now.getTime()-6e4)}},orderBy:{count:"desc"},take:5,select:{key:true,count:true}}),
  ]);
  return <AdminShell tab={tab} title={title} name={name} description={description}>
    <div className="admin-metrics admin-metrics-wide">{([["Өгөгдлийн сангийн хариу",dbMs+" ms",dbMs<100?"Хэвийн":dbMs<400?"Удаашралтай":"Удаан"],["Нэвтрэлт · 1 цаг",signInsHour,signInsDay+" · 24 цаг"],["Идэвхтэй хэрэглэгч · 24 цаг",activeDay,signUpsDay+" шинэ бүртгэл"],["Хүчинтэй сесс",sessions,""],["Явагдаж буй шалгалт",mocksLive+papersLive,mocksLive+" mock · "+papersLive+" албан материал"]] as const).map(([label,value,sub])=><article key={label}><p>{label}</p><strong>{value}</strong>{sub&&<small>{sub}</small>}</article>)}</div>
    {limited.length>0&&<section className="ws-card admin-block"><div className="ws-card-head"><h3>Хамгийн их хүсэлт · сүүлийн 1 минут</h3></div><ul className="admin-log">{limited.map(row=><li key={row.key}><code>{row.key}</code><small>{row.count} хүсэлт</small></li>)}</ul></section>}
    <h3 className="admin-subhead">Тэмдэглэл</h3>
    <div className="admin-notes">
    <details className="admin-panel"><summary>Хэзээ өргөжүүлэх вэ</summary><ul><li>Өгөгдлийн сангийн хариу байнга 400 ms-ээс дээш эсвэл Neon CPU 80%+ бол Neon-ийн хэмжээг (CU) нэмэх, autoscaling асаах.</li><li>Өдөр бүр бодит хэрэглэгчтэй болмогц Neon-ийн 5 минутын autosuspend-ийг унтраах.</li><li>Бодит төлбөр авч эхлэхэд Vercel Pro руу шилжих.</li><li>Ярианы лабораторийн дуу хоолой, хөрвүүлэлт хамгийн их тооцоолол шаардана; өсөлттэй үед гадны үйлчилгээ рүү шилжүүлэх.</li></ul></details>
    <details className="admin-panel"><summary>Хяналт</summary><p>Гадны uptime монитор (жишээ нь UptimeRobot) <code>/api/health</code>-ийг 1–5 минут тутам шалгана: 200 бол хэвийн, 503 бол өгөгдлийн сан холбогдохгүй байна.</p></details>
    <details className="admin-panel"><summary>Аюулгүй байдал</summary><ul><li>Админ эрх сервер дээр шалгагдана.</li><li>Үйлдэл бүрийн шалтгаан, түүх хадгалагдана.</li><li>Хэрэглэгчид өөртөө админ эрх олгох боломжгүй.</li><li>Түр хаасан бүртгэл нэвтэрч чадахгүй, бүх сесс нь хаагдана.</li><li>Нэвтрэлт бүрийн IP, төхөөрөмж хэрэглэгчийн хуудсанд хадгалагдана.</li></ul></details>
    <details className="admin-panel"><summary>Нээлтийн өмнөх ажил</summary><p>Мэргэжлийн IELTS үнэлгээ, бодит төлбөр/буцаалт, нөөц сэргээх туршилт хараахан бэлэн биш.</p></details>
  </div></AdminShell>;
}
