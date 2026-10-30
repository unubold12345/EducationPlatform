import "./admin.css";
import { findOfficialPaper } from "@/modules/papers/catalog";
import { findExam } from "@/modules/exams/definitions";
import { adminUserScope,realPaymentScope } from "@/modules/admin/data-scope";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Prisma } from "@/generated/prisma/client";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/db";
import { isAdmin,contentCatalog } from "@/modules/admin/service";
import { subscriptionPlans } from "@/modules/subscriptions/plans";
import { planPrices } from "@/modules/subscriptions/prices";
import { pageInfo,parsePage } from "@/modules/admin/paging";
import { AdminShell,Pager,SubTabs,adminTabs,adminDate as date,money,statusLabel,type AdminTab } from "@/modules/admin/ui";
import { AdminPriceForm } from "@/components/admin-price-form";

export const metadata:Metadata={title:"Удирдлагын төв",robots:{index:false,follow:false}};
const one=(value:string|string[]|undefined)=>typeof value==="string"?value:"";

export default async function AdminPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const session=await getSession();if(!session)redirect("/login?next=%2Fadmin");
  if(!await isAdmin(session.user.id))return <div className="container page-space"><p className="eyebrow">403 · ХАНДАЛТ ХЯЗГААРЛАГДСАН</p><h1>Админ эрх шаардлагатай.</h1><p>Энэ бүртгэл удирдлагын эрхгүй байна.</p><Link className="button primary" href="/dashboard">Миний бэлтгэл рүү</Link></div>;
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
  const link=(patch:Record<string,string|number>={})=>"/admin?"+new URLSearchParams(Object.entries({tab,q,data:testData?"test":"",filter,kind,...patch}).filter(([,value])=>value!==""&&value!==undefined).map(([key,value])=>[key,String(value)]));
  const name=session.user.name;
  const title=adminTabs.find(([key])=>key===tab)![1];
  const scopeBar=<div className="admin-data-scope"><Link aria-current={!testData?"page":undefined} href={"/admin?tab="+tab}>Бодит өгөгдөл</Link><Link aria-current={testData?"page":undefined} href={"/admin?tab="+tab+"&data=test"}>Туршилтын өгөгдөл</Link><p>{testData?"Зөвхөн тест бүртгэл ба дуурайлгасан төлбөр. Бодит орлого биш.":"Тест бүртгэл, дуурайлгасан төлбөрийг хассан."}</p></div>;
  const search=(placeholder:string,filters?:{name:string;value:string;options:[string,string][]})=><form className="admin-search" action="/admin"><input type="hidden" name="tab" value={tab}/>{testData&&<input type="hidden" name="data" value="test"/>}{kind&&<input type="hidden" name="kind" value={kind}/>}<label className="sr-only" htmlFor="admin-search">Хайх</label><input id="admin-search" name="q" defaultValue={q} maxLength={100} placeholder={placeholder}/>{filters&&<select name={filters.name} aria-label="Шүүлтүүр" defaultValue={filters.value}>{filters.options.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>}<button className="button secondary">Хайх</button>{(q||filter)&&<Link className="text-link" href={"/admin?tab="+tab+(testData?"&data=test":"")+(kind?"&kind="+kind:"")}>Цэвэрлэх</Link>}</form>;
  const exportLink=(what:string,label:string)=><a className="admin-export" href={"/api/admin/export?kind="+what+(testData?"&data=test":"")}>CSV татах · {label} · сүүлийн 1,000 ↓</a>;
  const userLink=(user:{id:string;email:string;name?:string})=><Link href={"/admin/users/"+user.id}>{user.name?<><strong>{user.name}</strong><small>{user.email}</small></>:user.email}</Link>;

  if(tab==="overview") {
    const [usersTotal,newUsers,activePlans,attemptTotal,mockTotal,paperCount,paidMocks,paidPlans,suspended,pending,drafts,audits,recentUsers]=await Promise.all([
      db.user.count({where:userFilter}),db.user.count({where:{AND:[userFilter,{createdAt:{gte:new Date(now.getTime()-7*864e5)}}]}}),
      db.subscription.count({where:{startsAt:{lte:now},endsAt:{gt:now},user:userFilter}}),db.attempt.count({where:{user:userFilter}}),db.mockAttempt.count({where:{user:userFilter}}),db.paperAttempt.count({where:{user:userFilter}}),
      db.mockPurchase.aggregate({where:{status:"PAID",...paymentScope,user:userFilter},_sum:{amountMnt:true}}),db.subscriptionOrder.aggregate({where:{status:"PAID",...paymentScope,user:userFilter},_sum:{amountMnt:true}}),
      db.user.count({where:{AND:[userFilter,{suspendedAt:{not:null}}]}}),db.subscriptionOrder.count({where:{status:"PENDING",...paymentScope,user:userFilter}}),
      db.contentDraft.count({where:{status:{not:"PUBLISHED"}}}),
      db.adminAudit.findMany({orderBy:[{createdAt:"desc"},{id:"desc"}],take:6}),
      db.user.findMany({where:userFilter,orderBy:[{createdAt:"desc"},{id:"desc"}],take:6,select:{id:true,name:true,email:true,createdAt:true}}),
    ]);
    return <AdminShell tab={tab} title={title} name={name} testData={testData}>{scopeBar}
      <div className="admin-metrics">{([["Нийт хэрэглэгч",usersTotal,`+${newUsers} энэ 7 хоногт`],["Идэвхтэй сарын эрх",activePlans,""],["Дасгал / шалгалт",`${attemptTotal} / ${mockTotal+paperCount}`,"оролдлого"],[testData?"Туршилтын төлбөр":"Бодит төлбөр",money((paidMocks._sum.amountMnt??0)+(paidPlans._sum.amountMnt??0)),"нийт"]] as const).map(([label,value,sub])=><article key={label}><p>{label}</p><strong>{value}</strong>{sub&&<small>{sub}</small>}</article>)}</div>
      <div className="admin-attention">
        <Link href={"/admin?tab=users&filter=suspended"+(testData?"&data=test":"")}><strong>{suspended}</strong><span>Түр хаасан бүртгэл</span></Link>
        <Link href={"/admin?tab=payments&kind=orders&filter=PENDING"+(testData?"&data=test":"")}><strong>{pending}</strong><span>Хүлээгдэж буй захиалга</span></Link>
        <Link href="/admin?tab=content&filter=draft"><strong>{drafts}</strong><span>Нийтлээгүй ноорог</span></Link>
        <Link href="/admin?tab=pricing"><strong>₮</strong><span>Сарын үнэ өөрчлөх</span></Link>
      </div>
      <div className="admin-columns">
        <section><div className="admin-section-heading"><h3>Шинэ хэрэглэгчид</h3><Link href="/admin?tab=users">Бүгд →</Link></div><ul className="admin-log">{recentUsers.map(user=><li key={user.id}>{userLink(user)}<small>{date(user.createdAt)}</small></li>)}</ul>{!recentUsers.length&&<p className="admin-empty">Хэрэглэгч алга.</p>}</section>
        <section><div className="admin-section-heading"><h3>Сүүлийн админ үйлдэл</h3><Link href="/admin?tab=audit">Бүгд →</Link></div><ul className="admin-log">{audits.map(row=><li key={row.id}><strong>{row.action}</strong> · {row.reason}<small>{date(row.createdAt)} · {row.target}</small></li>)}</ul>{!audits.length&&<p className="admin-empty">Үйлдэл алга.</p>}</section>
      </div>
      <p className="fine-print">{testData?"Энэ хэсгийн төлбөр нь зөвхөн туршилтынх.":"Бодит төлбөр хараахан холбогдоогүй. Дуурайлгасан төлбөрийг орлогод тооцохгүй."}</p>
    </AdminShell>;
  }

  if(tab==="users") {
    const status:Prisma.UserWhereInput=filter==="suspended"?{suspendedAt:{not:null}}:filter==="admin"?{adminMembership:{isNot:null}}:filter==="plan"?{subscriptions:{some:{startsAt:{lte:now},endsAt:{gt:now}}}}:filter==="unverified"?{emailVerified:false}:filter==="paid"?{OR:[{subscriptionOrders:{some:{status:"PAID"}}},{mockPurchases:{some:{status:"PAID"}}}]}:{};
    const where:Prisma.UserWhereInput={AND:[userFilter,status]};
    const info=pageInfo(await db.user.count({where}),requested);
    const users=await db.user.findMany({where,skip:info.skip,take:info.size,orderBy:[{createdAt:"desc"},{id:"desc"}],select:{id:true,name:true,email:true,emailVerified:true,createdAt:true,suspendedAt:true,adminMembership:{select:{userId:true}},_count:{select:{sessions:true,attempts:true,mockAttempts:true,paperAttempts:true}},subscriptions:{select:{program:true,endsAt:true,startsAt:true}}}});
    const lastSeen=users.length?await db.userEvent.groupBy({by:["userId"],where:{userId:{in:users.map(user=>user.id)},type:"sign-in"},_max:{createdAt:true}}):[];
    return <AdminShell tab={tab} title={title} name={name} testData={testData}>{scopeBar}
      {search("Нэр, имэйл эсвэл ID-аар хайх…",{name:"filter",value:filter,options:[["","Бүх хэрэглэгч"],["plan","Идэвхтэй эрхтэй"],["paid","Төлбөр төлсөн"],["unverified","Имэйл баталгаажаагүй"],["suspended","Түр хаасан"],["admin","Админ"]]})}
      {exportLink("users","хэрэглэгчид")}
      <div className="admin-table-wrap"><table><thead><tr><th>Хэрэглэгч</th><th>Төлөв</th><th>Бүртгүүлсэн / сүүлд</th><th>Эрх</th><th>Явц</th></tr></thead><tbody>{users.map(user=>{const seen=lastSeen.find(row=>row.userId===user.id)?._max.createdAt;return <tr key={user.id}>
        <td>{userLink(user)}</td>
        <td><span className={"admin-badge"+(user.suspendedAt?" bad":"")}>{user.suspendedAt?"Хаасан":user.adminMembership?"Админ":"Суралцагч"}</span>{!user.emailVerified&&<small>Имэйл баталгаажаагүй</small>}</td>
        <td>{date(user.createdAt)}<small>{seen?"Сүүлд: "+date(seen):"Нэвтрэлтийн бүртгэлгүй"}</small></td>
        <td>{user.subscriptions.filter(plan=>plan.startsAt<=now&&plan.endsAt>now).map(plan=><small key={plan.program}>{plan.program.toUpperCase()} → {date(plan.endsAt)}</small>)}{!user.subscriptions.some(plan=>plan.startsAt<=now&&plan.endsAt>now)&&<small>—</small>}</td>
        <td>{user._count.attempts} дасгал · {user._count.mockAttempts+user._count.paperAttempts} шалгалт<small>{user._count.sessions} идэвхтэй сесс</small></td>
      </tr>;})}</tbody></table>{!users.length&&<p className="admin-empty">Хэрэглэгч олдсонгүй.</p>}</div>
      <Pager info={info} href={page=>link({page})} label="хэрэглэгч"/>
    </AdminShell>;
  }

  if(tab==="subscriptions") {
    const state:Prisma.SubscriptionWhereInput=filter==="active"?{startsAt:{lte:now},endsAt:{gt:now}}:filter==="expired"?{endsAt:{lte:now}}:{};
    const where:Prisma.SubscriptionWhereInput={user:userFilter,...state,...(kind?{program:kind}:{})};
    const info=pageInfo(await db.subscription.count({where}),requested);
    const rows=await db.subscription.findMany({where,skip:info.skip,take:info.size,orderBy:[{endsAt:"desc"},{id:"desc"}],select:{id:true,program:true,startsAt:true,endsAt:true,user:{select:{id:true,name:true,email:true}}}});
    return <AdminShell tab={tab} title={title} name={name} testData={testData}>{scopeBar}
      <SubTabs items={[["","Бүх багц"],...subscriptionPlans.map(plan=>[plan.program,plan.shortTitle] as const)]} current={kind} href={key=>link({kind:key,page:1})}/>
      {search("Нэр эсвэл имэйлээр хайх…",{name:"filter",value:filter,options:[["","Бүх төлөв"],["active","Идэвхтэй"],["expired","Дууссан"]]})}
      {exportLink("subscriptions","сарын эрх")}
      <p className="admin-help">Эрх олгох, сунгах, дуусгахыг хэрэглэгчийн хуудаснаас хийнэ. Өмнөх төлбөрийн баримт өөрчлөгдөхгүй.</p>
      <div className="admin-table-wrap"><table><thead><tr><th>Хэрэглэгч</th><th>Багц</th><th>Хугацаа</th><th>Төлөв</th></tr></thead><tbody>{rows.map(row=><tr key={row.id}><td>{userLink(row.user)}</td><td>{row.program.toUpperCase()}</td><td>{date(row.startsAt)}<small>→ {date(row.endsAt)}</small></td><td><span className="admin-badge">{row.startsAt<=now&&row.endsAt>now?"Идэвхтэй":"Дууссан"}</span></td></tr>)}</tbody></table>{!rows.length&&<p className="admin-empty">Сарын эрх олдсонгүй.</p>}</div>
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
      :(await db.mockPurchase.findMany({where:{...base,...statusWhere},skip:info.skip,take:info.size,orderBy:[{createdAt:"desc"},{id:"desc"}],select:{id:true,examSlug:true,status:true,provider:true,amountMnt:true,createdAt:true,paidAt:true,user:{select:{id:true,email:true}}}})).map(row=>({...row,label:findExam(row.examSlug)?.title??findOfficialPaper(row.examSlug)?.title??row.examSlug}));
    return <AdminShell tab={tab} title={title} name={name} testData={testData}>{scopeBar}
      <SubTabs items={[["orders","Сарын багцын захиалга",orderTotal],["purchases","Нэг шалгалтын эрх",purchaseTotal]]} current={view} href={key=>link({kind:key,page:1})}/>
      {search("Хэрэглэгчийн нэр эсвэл имэйл…",{name:"filter",value:filter,options:[["","Бүх төлөв"],["PAID","Төлөгдсөн"],["PENDING","Хүлээгдэж байна"],["DECLINED","Амжилтгүй"]]})}
      {view==="orders"&&exportLink("payments","сарын багцын захиалга")}
      <p className="admin-help">{testData?"Дуурайлгасан төлбөрийн хадгалсан баримтууд. Бодит мөнгө суутгаагүй.":"Бодит төлбөрийн үйлчилгээ хараахан холбогдоогүй. Туршилтын гүйлгээ энд харагдахгүй."}</p>
      <div className="admin-table-wrap"><table><thead><tr><th>Огноо</th><th>Хэрэглэгч</th><th>Бүтээгдэхүүн</th><th>Дүн / төлөв</th><th>Баримт</th></tr></thead><tbody>{rows.map(row=><tr key={row.id}><td>{date(row.createdAt)}{row.paidAt&&<small>Төлсөн: {date(row.paidAt)}</small>}</td><td>{userLink(row.user)}</td><td>{row.label}</td><td>{money(row.amountMnt)}<small>{statusLabel(row.status)}</small></td><td><code>{row.id}</code><small>{row.provider}</small></td></tr>)}</tbody></table>{!rows.length&&<p className="admin-empty">Гүйлгээ олдсонгүй.</p>}</div>
      <Pager info={info} href={page=>link({page})} label="гүйлгээ"/>
    </AdminShell>;
  }

  if(tab==="attempts") {
    const view=kind==="mocks"||kind==="papers"?kind:"exercises";
    const statusWhere=["IN_PROGRESS","SUBMITTED"].includes(filter)?{status:filter as "IN_PROGRESS"|"SUBMITTED"}:{};
    const where={user:userFilter,...statusWhere};
    const [exerciseTotal,mockTotal,paperTotal]=await Promise.all([db.attempt.count({where}),db.mockAttempt.count({where}),db.paperAttempt.count({where})]);
    const info=pageInfo(view==="exercises"?exerciseTotal:view==="mocks"?mockTotal:paperTotal,requested);
    const page={where,skip:info.skip,take:info.size,orderBy:[{createdAt:"desc" as const},{id:"desc" as const}]};
    const rows=view==="exercises"
      ?(await db.attempt.findMany({...page,select:{id:true,title:true,status:true,score:true,total:true,createdAt:true,updatedAt:true,user:{select:{id:true,email:true}}}})).map(row=>({...row,label:row.title,result:row.status==="SUBMITTED"?`${row.score??0} / ${row.total}`:"—"}))
      :view==="mocks"
      ?(await db.mockAttempt.findMany({...page,select:{id:true,slug:true,status:true,createdAt:true,updatedAt:true,subscriptionAccess:true,user:{select:{id:true,email:true}}}})).map(row=>({...row,label:findExam(row.slug)?.title??row.slug,result:row.subscriptionAccess?"Сарын эрхээр":"Нэг удаагийн эрхээр"}))
      :(await db.paperAttempt.findMany({...page,select:{id:true,slug:true,status:true,createdAt:true,updatedAt:true,user:{select:{id:true,email:true}}}})).map(row=>({...row,label:findOfficialPaper(row.slug)?.title??row.slug,result:"—"}));
    return <AdminShell tab={tab} title={title} name={name} testData={testData}>{scopeBar}
      <SubTabs items={[["exercises","Дасгал",exerciseTotal],["mocks","Бүтэн mock",mockTotal],["papers","Албан материал",paperTotal]]} current={view} href={key=>link({kind:key,page:1})}/>
      {search("Хэрэглэгчийн нэр эсвэл имэйл…",{name:"filter",value:filter,options:[["","Бүх төлөв"],["IN_PROGRESS","Үргэлжилж байна"],["SUBMITTED","Дууссан"]]})}
      <p className="admin-help">Хадгалсан хариулт, хугацаа, оноог эндээс өөрчлөхгүй. IELTS бичих, ярих хэсэг автоматаар band авахгүй.</p>
      <div className="admin-table-wrap"><table><thead><tr><th>Эхэлсэн</th><th>Суралцагч</th><th>Материал</th><th>Төлөв / оноо</th><th>Сүүлд</th></tr></thead><tbody>{rows.map(row=><tr key={row.id}><td>{date(row.createdAt)}</td><td>{userLink(row.user)}</td><td>{row.label}<small><code>{row.id}</code></small></td><td>{statusLabel(row.status)}<small>{row.result}</small></td><td>{date(row.updatedAt)}</td></tr>)}</tbody></table>{!rows.length&&<p className="admin-empty">Оролдлого олдсонгүй.</p>}</div>
      <Pager info={info} href={page=>link({page})} label="оролдлого"/>
    </AdminShell>;
  }

  if(tab==="content") {
    const [reviews,drafts,published]=await Promise.all([db.contentReview.findMany(),db.contentDraft.findMany({select:{key:true,status:true,updatedAt:true}}),db.publishedContent.findMany({distinct:["key"],orderBy:{version:"desc"},select:{key:true,version:true,createdAt:true}})]);
    const needle=q.toLowerCase();
    const items=contentCatalog().filter(item=>(!kind||item.program===kind)&&(!needle||[item.key,item.title,item.kind].some(text=>text.toLowerCase().includes(needle)))&&(filter!=="draft"||drafts.some(row=>row.key===item.key&&row.status!=="PUBLISHED"))&&(filter!=="edited"||published.some(row=>row.key===item.key)));
    const info=pageInfo(items.length,requested);
    const programs=[...new Set(contentCatalog().map(item=>item.program))];
    return <AdminShell tab={tab} title={title} name={name}>
      <SubTabs items={[["","Бүгд"],...programs.map(program=>[program,program==="entrance"?"Элсэлт":program.toUpperCase()] as const)]} current={kind} href={key=>link({kind:key,page:1})}/>
      {search("Гарчиг, төрөл эсвэл түлхүүрээр хайх…",{name:"filter",value:filter,options:[["","Бүх материал"],["edited","Засварласан"],["draft","Нийтлээгүй ноорогтой"]]})}
      <p className="admin-help">Буруу хариу, үсгийн алдааг материалын хуудсанд асуулт тус бүрээр засаж нийтэлнэ. Шинэ хувилбар зөвхөн шинэ оролдлогод үйлчилнэ.</p>
      <div className="admin-table-wrap"><table><thead><tr><th>Материал</th><th>Төрөл</th><th>Хувилбар</th><th>Ноорог / хяналт</th><th></th></tr></thead><tbody>{items.slice(info.skip,info.skip+info.size).map(item=>{const review=reviews.find(row=>row.key===item.key);const draft=drafts.find(row=>row.key===item.key);const current=published.find(row=>row.key===item.key);return <tr key={item.key}>
        <td><Link href={"/admin/content/"+item.key}><strong>{item.title}</strong><small>{item.key}</small></Link></td>
        <td>{item.program.toUpperCase()} · {item.kind}<small>{item.count} асуулт</small></td>
        <td>v{current?.version??1}<small>{current?date(current.createdAt):"Эх хувилбар"}</small></td>
        <td>{draft?statusLabel(draft.status):"—"}<small>{statusLabel(review?.status??"PENDING")}</small></td>
        <td><Link className="admin-small-button" href={"/admin/content/"+item.key}>Засах →</Link></td>
      </tr>;})}</tbody></table>{!items.length&&<p className="admin-empty">Материал олдсонгүй.</p>}</div>
      <Pager info={info} href={page=>link({page})} label="материал"/>
    </AdminShell>;
  }

  if(tab==="pricing") {
    const [prices,history]=await Promise.all([planPrices(),db.adminAudit.findMany({where:{action:"set-price"},orderBy:[{createdAt:"desc"},{id:"desc"}],take:20})]);
    return <AdminShell tab={tab} title={title} name={name}>
      <p className="admin-help">Сарын багцын үнийг өөрчилбөл шинэ захиалгад шууд үйлчилнэ. Төлөгдсөн захиалга анхны дүнгээрээ үлдэнэ; төлөгдөөгүй захиалга шинэ үнээр шинэчлэгдэнэ.</p>
      <div className="admin-prices">{subscriptionPlans.map(plan=><AdminPriceForm key={plan.program} program={plan.program} title={plan.title} amount={prices[plan.program]} fallback={plan.amountMnt}/>)}</div>
      <div className="admin-section-heading"><h3>Үнийн өөрчлөлтийн түүх</h3></div>
      <div className="admin-table-wrap"><table><thead><tr><th>Огноо</th><th>Багц</th><th>Өмнө → дараа</th><th>Шалтгаан</th></tr></thead><tbody>{history.map(row=>{const d=row.details as {program?:string;before?:number;after?:number};return <tr key={row.id}><td>{date(row.createdAt)}</td><td>{d.program?.toUpperCase()}</td><td>{money(d.before??0)} → {money(d.after??0)}</td><td>{row.reason}<small><code>{row.actorId}</code></small></td></tr>;})}</tbody></table>{!history.length&&<p className="admin-empty">Үнэ өөрчлөгдөөгүй. Анхны үнэ үйлчилж байна.</p>}</div>
      <p className="fine-print">Нэг mock шалгалтын үнэ ₮10,000 хэвээр (кодонд тогтмол).</p>
    </AdminShell>;
  }

  if(tab==="audit") {
    const actions=["grant-month","expire-plan","revoke-sessions","suspend","unsuspend","add-note","set-price","content-fix","content-save","content-review","content-publish","review-content"];
    const where:Prisma.AdminAuditWhereInput={...(actions.includes(filter)?{action:filter}:{}),...(q?{OR:[{target:{contains:q}},{action:{contains:q}},{reason:{contains:q,mode:"insensitive"}},{actorId:q}]}:{})};
    const info=pageInfo(await db.adminAudit.count({where}),requested);
    const audits=await db.adminAudit.findMany({where,skip:info.skip,take:info.size,orderBy:[{createdAt:"desc"},{id:"desc"}]});
    return <AdminShell tab={tab} title={title} name={name}>
      {search("Зорилт, шалтгаан эсвэл админы ID…",{name:"filter",value:filter,options:[["","Бүх үйлдэл"],...actions.map(action=>[action,action] as [string,string])]})}
      {exportLink("audit","үйлдлийн түүх")}
      <p className="admin-help">Өөрчлөлт бүрийн шалтгаан, гүйцэтгэгч, зорилт. Энэ интерфэйсээс түүхийг засах, устгах боломжгүй.</p>
      <div className="admin-table-wrap"><table><thead><tr><th>Огноо</th><th>Үйлдэл / зорилт</th><th>Шалтгаан</th><th>Гүйцэтгэгч</th></tr></thead><tbody>{audits.map(row=><tr key={row.id}><td>{date(row.createdAt)}</td><td><strong>{row.action}</strong><small>{row.target}</small></td><td>{row.reason}<details><summary>Өөрчлөлтийн мэдээлэл</summary><pre>{JSON.stringify(row.details,null,2)}</pre></details></td><td><code>{row.actorId}</code></td></tr>)}</tbody></table>{!audits.length&&<p className="admin-empty">Бүртгэгдсэн үйлдэл алга.</p>}</div>
      <Pager info={info} href={page=>link({page})} label="үйлдэл"/>
    </AdminShell>;
  }

  return <AdminShell tab={tab} title={title} name={name}><div className="admin-settings-grid">
    <section className="settings-card"><h3>Аюулгүй байдал</h3><ul><li>Админ эрх сервер дээр шалгагдана.</li><li>Үйлдэл бүрийн шалтгаан, түүх хадгалагдана.</li><li>Хэрэглэгчид өөртөө админ эрх олгох боломжгүй.</li><li>Түр хаасан бүртгэл нэвтэрч чадахгүй, бүх сесс нь хаагдана.</li><li>Нэвтрэлт бүрийн IP, төхөөрөмж хэрэглэгчийн хуудсанд хадгалагдана.</li></ul></section>
    <section className="settings-card"><h3>Нээлтийн өмнөх ажил</h3><p>Мэргэжлийн IELTS үнэлгээ, бодит төлбөр/буцаалт, нөөц сэргээх туршилт хараахан бэлэн биш. Сарын үнийг “Үнэ” хэсгээс өөрчилнө.</p></section>
  </div></AdminShell>;
}
