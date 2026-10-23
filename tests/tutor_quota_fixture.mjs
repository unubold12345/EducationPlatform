// Only modifies this increment's reserved QA tutor counter, never student scores.
import "dotenv/config";
import {PrismaClient} from "../src/generated/prisma/client.ts";
import {PrismaPg} from "@prisma/adapter-pg";
import {tutorDay} from "../src/modules/tutor/contracts.ts";
const target=new URL(process.env.DATABASE_URL);
if(target.hostname!=="127.0.0.1"||target.port!=="51214"||target.pathname!=="/template1")throw Error("Unexpected database");
const db=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL,max:1,idleTimeoutMillis:1000})});
try {
 const [action,userId]=process.argv.slice(2),user=await db.user.findUniqueOrThrow({where:{id:userId}});
 if(!user.email.startsWith("qa-exam-ai-")||!user.email.endsWith("@example.invalid")||!["exhaust","unlock"].includes(action))throw Error("Only isolated tutor QA quota");
 const key=`education-tutor:${userId}:${tutorDay(Date.now())}`;
 await db.rateLimit.update({where:{key},data:action==="exhaust"?{count:30,lastRequest:BigInt(0)}:{lastRequest:BigInt(0)}});
 console.log("QA tutor quota updated");
}finally{await db.$disconnect();}
