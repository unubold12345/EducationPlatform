// Explicit local operator command. Never imported by the application or exposed as an API.
// Owner removed the 2026 Dornod papers entirely (2026-10-29): lists, then with --apply deletes, every
// local row tied to their slugs. Audit history is kept. Dry run by default.
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
const base=new URL(process.env.BETTER_AUTH_URL??"");const target=new URL(process.env.DATABASE_URL??"");
if(process.env.AUTH_LOCAL_PILOT!=="true"||!["localhost","127.0.0.1","[::1]"].includes(base.hostname)||target.hostname!=="127.0.0.1"||target.port!=="51214"||target.pathname!=="/template1")throw Error("Requires the independent EducationPlatform local pilot.");
const apply=process.argv.includes("--apply");
const prefix={startsWith:"dornod-2026"};
const db=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL,max:1})});
try{
  const [attempts,purchases,reviews,drafts,published]=await Promise.all([
    db.paperAttempt.findMany({where:{slug:prefix},select:{id:true,slug:true,status:true,user:{select:{email:true}}}}),
    db.mockPurchase.findMany({where:{examSlug:prefix},select:{id:true,examSlug:true,status:true,user:{select:{email:true}}}}),
    db.contentReview.count({where:{key:prefix}}),
    db.contentDraft.count({where:{key:prefix}}),
    db.publishedContent.count({where:{key:prefix}}),
  ]);
  for(const row of attempts)console.log("attempt",row.id,row.slug,row.status,row.user.email);
  for(const row of purchases)console.log("purchase",row.id,row.examSlug,row.status,row.user.email);
  console.log(`attempts ${attempts.length} · purchases ${purchases.length} · content reviews ${reviews} · drafts ${drafts} · published ${published}`);
  if(!apply){console.log("Dry run. Re-run with --apply to delete.");process.exit(0);}
  const deleted=await db.$transaction([
    db.paperAttempt.deleteMany({where:{slug:prefix}}),
    db.mockPurchase.deleteMany({where:{examSlug:prefix}}),
    db.contentReview.deleteMany({where:{key:prefix}}),
    db.contentDraft.deleteMany({where:{key:prefix}}),
    db.publishedContent.deleteMany({where:{key:prefix}}),
  ]);
  console.log("Deleted",deleted.map(result=>result.count).join(" · "));
}finally{await db.$disconnect();}
