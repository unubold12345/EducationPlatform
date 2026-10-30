import "dotenv/config";
import { defineConfig } from "prisma/config";
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  // Prisma CLI (migrate/seed) prefers the direct connection: Neon's pooled address runs in
  // transaction mode, which migrations do not support. The app itself always uses DATABASE_URL.
  datasource: { url: process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL, shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL },
});

