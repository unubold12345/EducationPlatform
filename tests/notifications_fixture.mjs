// Local-only fixture for disposable notification QA; never imported by the app.
//   ending <userId> <program>   moves the QA account's plan end to two days from now
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
const target=new URL(process.env.DATABASE_URL);
if(target.hostname!=="127.0.0.1"||target.port!=="51214"||target.pathname!=="/template1")throw Error("Unexpected test database");
const [action,userId,program]=process.argv.slice(2);
const db=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL,max:1})});
try {
  const user=await db.user.findUniqueOrThrow({where:{id:userId},select:{email:true}});
  if(!user.email.startsWith("qa-notify-")||!user.email.endsWith("@example.invalid"))throw Error("Only disposable notification QA may be changed");
  if(action==="ending"&&["entrance","language"].includes(program)){
    await db.subscription.update({where:{userId_program:{userId,program}},data:{endsAt:new Date(Date.now()+2*86400_000)}});
    console.log(JSON.stringify({ending:true}));
  } else throw Error("Unknown fixture action");
}finally{await db.$disconnect();}
