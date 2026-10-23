import { adminUserScope,realPaymentScope } from "@/modules/admin/data-scope";
import { apiUser,apiFailure,privateJson } from "@/lib/api";
import { assertAdmin } from "@/modules/admin/service";
import { getDb } from "@/lib/db";
export async function GET(request:Request) {
  try{
    const user=await apiUser(request);await assertAdmin(user.id);
    const kind=new URL(request.url).searchParams.get("kind");
    const db=getDb();const take=1000;
    const testData=new URL(request.url).searchParams.get("data")==="test";const scope=adminUserScope(testData);
    let rows:Record<string,unknown>[];
    if(kind==="users")rows=await db.user.findMany({where:scope,take,orderBy:{createdAt:"desc"},select:{id:true,name:true,email:true,createdAt:true}});
    else if(kind==="subscriptions")rows=await db.subscription.findMany({where:{user:scope},take,orderBy:{createdAt:"desc"},select:{id:true,userId:true,program:true,startsAt:true,endsAt:true}});
    else if(kind==="payments")rows=await db.subscriptionOrder.findMany({where:{...(testData?{provider:"MOCK"}:{user:scope,...realPaymentScope})},take,orderBy:{createdAt:"desc"},select:{id:true,userId:true,program:true,amountMnt:true,currency:true,provider:true,status:true,createdAt:true}});
    else if(kind==="audit")rows=await db.adminAudit.findMany({take,orderBy:{createdAt:"desc"},select:{id:true,actorId:true,action:true,target:true,reason:true,createdAt:true}});
    else return privateJson({error:"Экспортын төрөл буруу."},400);
    const keys=rows.length?Object.keys(rows[0]):["No records"];
    const cell=(value:unknown)=>{let text=value instanceof Date?value.toISOString():String(value??"");if(/^[\s]*[=+\-@]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';};
    const csv="\uFEFF"+[keys.map(cell).join(","),...rows.map(row=>keys.map(key=>cell(row[key])).join(","))].join("\r\n");
    await db.adminAudit.create({data:{actorId:user.id,action:"export-"+kind,target:kind,reason:"Admin requested CSV export (latest 1000 maximum)",details:{count:rows.length,scope:testData?"test":"real"}}});
    return new Response(csv,{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":`attachment; filename="education-${kind}.csv"`,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
  }catch(error){return apiFailure(error);}
}
