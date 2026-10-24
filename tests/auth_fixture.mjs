// Trusted local QA fixture: no runtime endpoint and no hosted database support.
import "dotenv/config";
import { Client } from "pg";
import { readFileSync } from "node:fs";
const url=new URL(process.env.DATABASE_URL);
if(url.hostname!=="127.0.0.1"||url.port!=="51214"||url.pathname!=="/template1")throw Error("Unexpected fixture database");
const input=JSON.parse(readFileSync(0,"utf8"));
if(input.action!=="expire-reset"||!/^qa-auth-recovery-[a-f0-9]+@example\.invalid$/.test(input.email)||!/^\w{16,128}$/.test(input.token))throw Error("Fixture supports only reserved QA reset tokens");
const db=new Client({connectionString:process.env.DATABASE_URL});await db.connect();
try{
 const result=await db.query('UPDATE "Verification" SET "expiresAt"=now()-interval \'1 minute\' WHERE identifier=$1 AND value=(SELECT id FROM "User" WHERE email=$2)',["reset-password:"+input.token,input.email]);
 if(result.rowCount!==1)throw Error("QA verification record missing");console.log(JSON.stringify({expired:true}));
}finally{await db.end();}
