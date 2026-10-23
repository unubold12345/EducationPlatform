// Explicit local operator command. Never imported by the application or exposed as an API.
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
const base=new URL(process.env.BETTER_AUTH_URL??"");const target=new URL(process.env.DATABASE_URL??"");
if(process.env.AUTH_LOCAL_PILOT!=="true"||!["localhost","127.0.0.1","[::1]"].includes(base.hostname)||target.hostname!=="127.0.0.1"||target.port!=="51214"||target.pathname!=="/template1")throw Error("Requires the independent EducationPlatform local pilot.");
const email=process.argv[2];if(!email||!email.endsWith("@example.invalid"))throw Error("Supply an existing local test email ending in @example.invalid.");
const db=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL,max:1})});
try{
  await db.$transaction(async tx=>{
    const user=await tx.user.findUniqueOrThrow({where:{email},select:{id:true}});
    if(await tx.adminMembership.findUnique({where:{userId:user.id}}))return;
    await tx.adminMembership.create({data:{userId:user.id}});
    await tx.adminAudit.create({data:{actorId:"LOCAL_OPERATOR",action:"grant-admin",target:user.id,reason:"Explicit guarded local operator provisioning",details:{email}}});
  });
  console.log("Local admin membership ready for "+email);
}finally{await db.$disconnect();}
