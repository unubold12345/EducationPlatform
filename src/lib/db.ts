import "server-only";
import { Prisma, PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// The generated models and their columns. It changes only when `prisma generate` runs after a schema change,
// and it is the same in every copy of this module (the dev server can load one per route).
const SCHEMA = Object.entries(Prisma)
  .filter(([name]) => name.endsWith("ScalarFieldEnum"))
  .map(([name, fields]) => name + ":" + Object.keys(fields as object).join(","))
  .sort().join("|");

const globalDb = globalThis as unknown as { educationDb?: PrismaClient; educationDbSchema?: string };
export function getDb() {
  if (globalDb.educationDb && globalDb.educationDbSchema === SCHEMA) return globalDb.educationDb;
  // A running dev server keeps the client across reloads; after `prisma generate` that cached client does not
  // know the new tables or columns, so it is closed and replaced instead of failing until a restart.
  if (globalDb.educationDb) void globalDb.educationDb.$disconnect().catch(() => {});
  if (!process.env.DATABASE_URL) throw new Error("EducationPlatform DATABASE_URL is not configured.");
  // The embedded local PGlite server needs serialized connections to avoid protocol errors.
  const max = process.env.AUTH_LOCAL_PILOT === "true" ? 1 : 5;
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, max, idleTimeoutMillis: 1000, connectionTimeoutMillis: 5000 });
  globalDb.educationDb = new PrismaClient({ adapter });
  globalDb.educationDbSchema = SCHEMA;
  return globalDb.educationDb;
}
