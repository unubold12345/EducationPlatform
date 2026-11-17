// Local-only fixture for disposable subscription QA; never imported by the app.
//   expire <userId> <program>   ends one of the QA account's plans now
//   expire-purchase <userId> <slug>   ends the QA account's 7-day mock purchase now (qa-sub-* or qa-pay-* accounts)
//   legacy <userId> ielts|sat   gives the QA account a running plan of a retired kind (bought before 2026-11-13)
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
const target=new URL(process.env.DATABASE_URL);
if(target.hostname!=="127.0.0.1"||target.port!=="51214"||target.pathname!=="/template1")throw Error("Unexpected test database");
const [action,userId,program]=process.argv.slice(2);
const db=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL,max:1})});
try {
  const user=await db.user.findUniqueOrThrow({where:{id:userId},select:{email:true}});
  const disposable=user.email.endsWith("@example.invalid")&&(user.email.startsWith("qa-sub-")||(action==="expire-purchase"&&user.email.startsWith("qa-pay-")));
  if(!disposable)throw Error("Only disposable subscription QA may be changed");
  if(action==="expire-purchase"){
    const changed=await db.mockPurchase.updateMany({where:{userId,examSlug:program,status:"PAID",expiresAt:{not:null}},data:{expiresAt:new Date(Date.now()-1000)}});
    if(changed.count!==1)throw Error("No 7-day purchase to end");
    console.log(JSON.stringify({expired:true}));
  } else if(action==="expire"&&["sat","ielts","entrance","language","language_basic"].includes(program)){
    await db.subscription.update({where:{userId_program:{userId,program}},data:{startsAt:new Date(Date.now()-3600_000),endsAt:new Date(Date.now()-1000)}});
    console.log(JSON.stringify({expired:true}));
  } else if(action==="legacy"&&["sat","ielts"].includes(program)){
    const startsAt=new Date(Date.now()-3600_000),endsAt=new Date(Date.now()+7*86400_000);
    await db.subscription.upsert({where:{userId_program:{userId,program}},create:{userId,program,startsAt,endsAt},update:{startsAt,endsAt}});
    console.log(JSON.stringify({legacy:true}));
  } else throw Error("Unknown fixture action");
}finally{await db.$disconnect();}
