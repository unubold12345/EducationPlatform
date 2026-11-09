-- AI credits: a monthly usage counter and a charge ledger per student. Additive: no existing table or row changes.
-- CreateTable
CREATE TABLE "CreditPeriod" (
    "userId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "used" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditPeriod_pkey" PRIMARY KEY ("userId","period")
);

-- CreateTable
CREATE TABLE "CreditCharge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'HELD',
    "promptTokens" INTEGER NOT NULL DEFAULT 0,
    "cachedTokens" INTEGER NOT NULL DEFAULT 0,
    "completionTokens" INTEGER NOT NULL DEFAULT 0,
    "costMicroUsd" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settledAt" TIMESTAMP(3),

    CONSTRAINT "CreditCharge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CreditCharge_userId_createdAt_idx" ON "CreditCharge"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CreditCharge_createdAt_idx" ON "CreditCharge"("createdAt");

-- AddForeignKey
ALTER TABLE "CreditPeriod" ADD CONSTRAINT "CreditPeriod_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditCharge" ADD CONSTRAINT "CreditCharge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

