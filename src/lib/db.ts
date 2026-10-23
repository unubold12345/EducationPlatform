import "server-only";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalDb = globalThis as unknown as { educationDb?: PrismaClient };
export function getDb() {
  if (globalDb.educationDb) return globalDb.educationDb;
  if (!process.env.DATABASE_URL) throw new Error("EducationPlatform DATABASE_URL is not configured.");
  // The embedded local PGlite server needs serialized connections to avoid protocol errors.
  const max = process.env.AUTH_LOCAL_PILOT === "true" ? 1 : 5;
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, max, idleTimeoutMillis: 1000, connectionTimeoutMillis: 5000 });
  globalDb.educationDb = new PrismaClient({ adapter });
  return globalDb.educationDb;
}

