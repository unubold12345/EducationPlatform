-- Admin AI credits: monthly bonus grants and editable allowances. Additive: existing rows keep bonus 0.
-- AlterTable
ALTER TABLE "CreditPeriod" ADD COLUMN     "bonus" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "CreditAllowance" (
    "key" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditAllowance_pkey" PRIMARY KEY ("key")
);

