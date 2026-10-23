// Trusted local expiry fixture; never exposed as an app endpoint.
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
const target=new URL(process.env.DATABASE_URL);
if(target.hostname!=="127.0.0.1"||target.port!=="51214"||target.pathname!=="/template1")throw Error("Unexpected database");
const [action,id]=process.argv.slice(2);const db=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL,max:1})});
try{const row=await db.paperAttempt.findUniqueOrThrow({where:{id},include:{user:{select:{email:true}}}});
 if(!["expire","expire-plan"].includes(action)||!row.user.email.startsWith("qa-paper-")||!row.user.email.endsWith("@example.invalid")||row.slug!=="eec-math-2020-a")throw Error("Only isolated paper QA may be expired");
 if(action==="expire")await db.paperAttempt.update({where:{id},data:{deadline:new Date(Date.now()-1000)}});
 else await db.subscription.update({where:{userId_program:{userId:row.userId,program:"entrance"}},data:{startsAt:new Date(Date.now()-3600000),endsAt:new Date(Date.now()-1000)}});
 console.log(JSON.stringify({expired:true}));
}finally{await db.$disconnect();}
