// Local-only fixture for disposable subscription QA; never imported by the app.
//   expire <userId> <program>   ends one of the QA account's plans now
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
  if(!user.email.startsWith("qa-sub-")||!user.email.endsWith("@example.invalid"))throw Error("Only disposable subscription QA may be changed");
  if(action==="expire"&&["sat","ielts","entrance","language"].includes(program)){
    await db.subscription.update({where:{userId_program:{userId,program}},data:{startsAt:new Date(Date.now()-3600_000),endsAt:new Date(Date.now()-1000)}});
    console.log(JSON.stringify({expired:true}));
  } else if(action==="legacy"&&["sat","ielts"].includes(program)){
    const startsAt=new Date(Date.now()-3600_000),endsAt=new Date(Date.now()+7*86400_000);
    await db.subscription.upsert({where:{userId_program:{userId,program}},create:{userId,program,startsAt,endsAt},update:{startsAt,endsAt}});
    console.log(JSON.stringify({legacy:true}));
  } else throw Error("Unknown fixture action");
}finally{await db.$disconnect();}
