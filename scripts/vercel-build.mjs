import {spawnSync} from "node:child_process";
import {authFeatures} from "../src/lib/auth-features.ts";

// Fail at deployment time rather than publishing database-dependent pages that 500.
// Never print a connection string, auth secret or provider key in build logs.
for(const key of ["DATABASE_URL","BETTER_AUTH_URL","BETTER_AUTH_SECRET"]){
 if(!process.env[key]?.trim())throw new Error(`Missing deployment setting: ${key}`);
}
let database,auth;
try { database=new URL(process.env.DATABASE_URL);auth=new URL(process.env.BETTER_AUTH_URL); }
catch { throw new Error("Invalid deployment database or authentication URL."); }
const loopback=host=>["localhost","127.0.0.1","[::1]"].includes(host);
if(!["postgres:","postgresql:"].includes(database.protocol)||loopback(database.hostname))throw new Error("Vercel requires a hosted PostgreSQL database, not the local development database.");
// A pooled (PgBouncer) DATABASE_URL serves the app. Migrations prefer DIRECT_DATABASE_URL; without
// it they run through the pooler, which this Neon project has done successfully, so only warn.
if(database.hostname.includes("-pooler.")&&!process.env.DIRECT_DATABASE_URL?.trim())console.warn("Warning: pooled DATABASE_URL without DIRECT_DATABASE_URL; migrations will use the pooled connection.");
if(process.env.DIRECT_DATABASE_URL?.trim()){
 let direct;try{direct=new URL(process.env.DIRECT_DATABASE_URL);}catch{throw new Error("Invalid DIRECT_DATABASE_URL.");}
 if(!["postgres:","postgresql:"].includes(direct.protocol)||loopback(direct.hostname)||direct.hostname.includes("-pooler."))throw new Error("DIRECT_DATABASE_URL must be the hosted, non-pooled PostgreSQL address.");
}
if(auth.protocol!=="https:"||loopback(auth.hostname)||auth.username||auth.password||auth.pathname!=="/"||auth.search||auth.hash)throw new Error("BETTER_AUTH_URL must be the canonical HTTPS site origin.");
if(process.env.BETTER_AUTH_SECRET.length<32)throw new Error("BETTER_AUTH_SECRET must contain at least 32 characters.");
if(process.env.AUTH_HOSTED_PILOT!=="true")throw new Error("Explicit AUTH_HOSTED_PILOT opt-in is required for this test deployment.");
if(process.env.AUTH_REQUIRE_EMAIL_VERIFICATION==="true"&&!authFeatures(process.env).email)throw new Error("Email verification requires a configured sender.");
if(Boolean(process.env.GOOGLE_CLIENT_ID)!==Boolean(process.env.GOOGLE_CLIENT_SECRET))throw new Error("Google sign-in requires both OAuth credentials.");
for(const [script,args] of [
 ["node_modules/prisma/build/index.js",["generate"]],
 ["node_modules/prisma/build/index.js",["migrate","deploy"]],
 ["--import",["tsx","prisma/seed.ts"]],
 ["node_modules/next/dist/bin/next",["build"]],
]){
 const result=spawnSync(process.execPath,[script,...args],{stdio:"inherit",env:process.env});
 if(result.error)throw new Error("Unable to start a deployment build step.");
 if(result.status!==0)process.exit(result.status??1);
}
