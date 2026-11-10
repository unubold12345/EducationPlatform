-- Plan credits per subscription term, purchased credits and the credit pack. Additive: one nullable column on
-- CreditCharge and four new tables; no existing row changes.
-- AlterTable
ALTER TABLE "CreditCharge" ADD COLUMN     "parts" JSONB;

-- CreateTable
CREATE TABLE "CreditPlanTerm" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "program" TEXT NOT NULL,
    "termStart" TIMESTAMP(3) NOT NULL,
    "used" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditPlanTerm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditWallet" (
    "userId" TEXT NOT NULL,
    "purchased" INTEGER NOT NULL DEFAULT 0,
    "used" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditWallet_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "CreditPack" (
    "key" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "amountMnt" INTEGER NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditPack_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "CreditOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "amountMnt" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MNT',
    "provider" TEXT NOT NULL DEFAULT 'MOCK',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "activeKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "CreditOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CreditPlanTerm_userId_program_termStart_key" ON "CreditPlanTerm"("userId", "program", "termStart");

-- CreateIndex
CREATE UNIQUE INDEX "CreditOrder_activeKey_key" ON "CreditOrder"("activeKey");

-- CreateIndex
CREATE INDEX "CreditOrder_userId_createdAt_idx" ON "CreditOrder"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "CreditPlanTerm" ADD CONSTRAINT "CreditPlanTerm_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditWallet" ADD CONSTRAINT "CreditWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditOrder" ADD CONSTRAINT "CreditOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
