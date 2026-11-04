// Explicit operator command. Never imported by the application or exposed as an API.
// Owner removed practice exercises (2026-11-05). This lists, then with --apply permanently deletes, their
// saved attempts, question bank and old published versions. Mocks, official papers, workshops, purchases,
// plans, accounts and audit history are not touched. Dry run by default.
//
//   Local preview:   node --import tsx scripts/purge-exercises.mjs
//   Hosted preview:  set DATABASE_URL to the direct Neon address, then add --confirm-host=<database hostname>
//   Delete:          the same command plus --apply. Back up first; this cannot be undone.
import "dotenv/config";
import { readFileSync } from "node:fs";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { examDefinitions } from "../src/modules/exams/definitions.ts";
import { allOfficialPapers } from "../src/modules/papers/catalog.ts";

const target=new URL(process.env.DATABASE_URL??"");
const local=["localhost","127.0.0.1","[::1]"].includes(target.hostname);
const confirmed=process.argv.find(arg=>arg.startsWith("--confirm-host="))?.slice("--confirm-host=".length);
if(!local&&confirmed!==target.hostname)throw Error(`Hosted database ${target.hostname}: repeat its hostname with --confirm-host= to continue.`);
const apply=process.argv.includes("--apply");

// guided.ts is server-only, so its slugs are read as text. Stop rather than risk deleting workshop edits.
const workshops=[...readFileSync(new URL("../src/modules/workshops/guided.ts",import.meta.url),"utf8").matchAll(/slug: "([^"]+)"/g)].map(match=>match[1]);
if(workshops.length!==4)throw Error("Expected 4 workshops; refusing to continue.");
const keep=[...examDefinitions.map(exam=>exam.slug),...allOfficialPapers.map(paper=>paper.slug),...workshops];
if(keep.length<50)throw Error("Unexpected catalog size; refusing to continue.");
const contentWhere={key:{notIn:keep}};

const db=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL,max:1})});
try{
  const [attempts,items,students,exams,examItems,versions,questions,topics,subjects,programs,drafts,reviews,published,keys,mocks,papers,users]=await Promise.all([
    db.attempt.count(),db.attemptItem.count(),db.attempt.findMany({distinct:["userId"],select:{userId:true}}).then(rows=>rows.length),
    db.exam.count(),db.examItem.count(),db.questionVersion.count(),db.question.count(),db.topic.count(),db.subject.count(),db.program.count(),
    db.contentDraft.count({where:contentWhere}),db.contentReview.count({where:contentWhere}),db.publishedContent.count({where:contentWhere}),
    db.publishedContent.findMany({where:contentWhere,distinct:["key"],select:{key:true}}).then(rows=>rows.map(row=>row.key)),
    db.mockAttempt.count(),db.paperAttempt.count(),db.user.count(),
  ]);
  console.log(`Database host: ${target.hostname}`);
  console.log(`Will delete: attempts ${attempts} (${items} answers, ${students} students) · exams ${exams} (${examItems} items) · question versions ${versions} · questions ${questions} · topics ${topics} · subjects ${subjects} · programs ${programs} · drafts ${drafts} · reviews ${reviews} · published versions ${published}`);
  if(keys.length)console.log("Published keys to delete:",keys.join(", "));
  console.log(`Will keep: users ${users} · mock attempts ${mocks} · paper attempts ${papers} · purchases, plans, audit history`);
  if(!apply){console.log("Dry run; nothing was deleted. Add --apply to delete.");process.exit(0);}
  const deleted=await db.$transaction([
    db.attempt.deleteMany(),db.exam.deleteMany(),db.questionVersion.deleteMany(),db.question.deleteMany(),
    db.topic.deleteMany(),db.subject.deleteMany(),db.program.deleteMany(),
    db.contentDraft.deleteMany({where:contentWhere}),db.contentReview.deleteMany({where:contentWhere}),db.publishedContent.deleteMany({where:contentWhere}),
  ]);
  console.log("Deleted",deleted.map(result=>result.count).join(" · "));
}finally{await db.$disconnect();}
