// Local-only expiry fixture for disposable subscription QA; never imported by the app.
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
const target=new URL(process.env.DATABASE_URL);
if(target.hostname!=="127.0.0.1"||target.port!=="51214"||target.pathname!=="/template1")throw Error("Unexpected test database");
const [action,userId,program]=process.argv.slice(2);
const db=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL,max:1})});
try {
  const user=await db.user.findUniqueOrThrow({where:{id:userId},select:{email:true}});
  if(!user.email.startsWith("qa-sub-")||!user.email.endsWith("@example.invalid")||!["sat","ielts","entrance"].includes(program)||action!=="expire")throw Error("Only disposable subscription QA may be expired");
  await db.subscription.update({where:{userId_program:{userId,program}},data:{startsAt:new Date(Date.now()-3600_000),endsAt:new Date(Date.now()-1000)}});
  console.log(JSON.stringify({expired:true}));
}finally{await db.$disconnect();}
