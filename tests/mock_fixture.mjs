// Trusted local test fixture, never imported by the application or exposed as an API.
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { stageFor } from "../src/modules/exams/engine.ts";
const target=new URL(process.env.DATABASE_URL);
if(target.hostname!=="127.0.0.1"||target.port!=="51214"||target.pathname!=="/template1")throw Error("Unexpected test database");
const db=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL,max:1,idleTimeoutMillis:1000})});
try{
 const [action,id,offset]=process.argv.slice(2);
 const row=await db.mockAttempt.findUniqueOrThrow({where:{id},include:{user:{select:{email:true}}}});
 if(!row.user.email.startsWith("qa-exam-")||!row.user.email.endsWith("@example.invalid"))throw Error("Fixture can only access its disposable QA attempts");
 const state=row.state;
 if(action==="answers"){
  const stage=stageFor(state);
  console.log(JSON.stringify({stageId:stage?.id,responses:Object.fromEntries((stage?.questions??[]).map(q=>[q.id,q.answers[0]??"Practice response for human review."]))}));
 }else if(action==="deadline"){
  if(state.finishedAt)throw Error("Attempt is complete");
  const milliseconds=Number(offset??"-1");if(!Number.isFinite(milliseconds)||milliseconds>10000||milliseconds< -10000)throw Error("Invalid fixture offset");
  const end=Date.now()+milliseconds;
  state.deadline=new Date(end).toISOString();state.stageStartedAt=new Date(end-stageFor(state).seconds*1000).toISOString();
  await db.mockAttempt.update({where:{id},data:{state,revision:{increment:1}}});console.log(JSON.stringify({adjusted:true}));
 }else throw Error("Unknown fixture action");
}finally{await db.$disconnect();}
