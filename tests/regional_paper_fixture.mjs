import "dotenv/config";
import {PrismaClient} from "../src/generated/prisma/client.ts";
import {PrismaPg} from "@prisma/adapter-pg";
const target=new URL(process.env.DATABASE_URL);
if(target.hostname!=="127.0.0.1"||target.port!=="51214"||target.pathname!=="/template1")throw Error("Expected local QA database");
const db=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL,max:1})});
try{
 const row=await db.paperAttempt.findUniqueOrThrow({where:{id:process.argv[2]},include:{user:{select:{email:true}}}});
 if(!row.user.email.startsWith("qa-regional-")||!row.user.email.endsWith("@example.invalid")||!["dornod-2026-math-online-4","dornod-2026-english-online-4"].includes(row.slug))throw Error("Only isolated regional QA may expire");
 await db.paperAttempt.update({where:{id:row.id},data:{deadline:new Date(Date.now()-1000)}});console.log("Expired isolated regional QA sitting");
}finally{await db.$disconnect();}
