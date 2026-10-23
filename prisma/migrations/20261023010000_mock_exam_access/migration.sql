CREATE TABLE "MockPurchase" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "examSlug" TEXT NOT NULL,
  "amountMnt" INTEGER NOT NULL DEFAULT 10000,
  "currency" TEXT NOT NULL DEFAULT 'MNT',
  "provider" TEXT NOT NULL DEFAULT 'MOCK',
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "paidAt" TIMESTAMP(3),
  CONSTRAINT "MockPurchase_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MockPurchase_amount_check" CHECK ("amountMnt" >= 0),
  CONSTRAINT "MockPurchase_status_check" CHECK ("status" IN ('PENDING','DECLINED','PAID')),
  CONSTRAINT "MockPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "MockPurchase_userId_examSlug_key" ON "MockPurchase"("userId", "examSlug");
-- Preserve access for existing saved attempts without changing their deadlines or contents.
INSERT INTO "MockPurchase" ("id", "userId", "examSlug", "amountMnt", "provider", "status", "paidAt")
SELECT 'legacy_' || md5("userId" || ':' || "slug"), "userId", "slug", 0, 'LEGACY', 'PAID', MIN("createdAt")
FROM "MockAttempt" GROUP BY "userId", "slug";
