import "dotenv/config";
import {PrismaClient} from "../src/generated/prisma/client.ts";
import {PrismaPg} from "@prisma/adapter-pg";
const target=new URL(process.env.DATABASE_URL);
if(target.hostname!=="127.0.0.1"||target.port!=="51214"||target.pathname!=="/template1")throw Error("Expected local QA database");
const db=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL,max:1})});
try{
 const row=await db.paperAttempt.findUniqueOrThrow({where:{id:process.argv[2]},include:{user:{select:{email:true}}}});
 if(!row.user.email.startsWith("qa-english-")||!row.user.email.endsWith("@example.invalid")||row.slug!=="eec-english-2020-a")throw Error("Only isolated English QA may expire");
 await db.paperAttempt.update({where:{id:row.id},data:{deadline:new Date(Date.now()-1000)}});
 console.log("Expired isolated English QA sitting");
}finally{await db.$disconnect();}
