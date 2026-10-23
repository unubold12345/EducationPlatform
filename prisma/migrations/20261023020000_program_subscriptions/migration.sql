ALTER TABLE "MockAttempt" ADD COLUMN "subscriptionAccess" BOOLEAN NOT NULL DEFAULT false;
CREATE TABLE "Subscription" (
 "id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
 "program" TEXT NOT NULL CHECK ("program" IN ('entrance','ielts','sat')),
 "startsAt" TIMESTAMP(3) NOT NULL, "endsAt" TIMESTAMP(3) NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "Subscription_period_check" CHECK ("endsAt">"startsAt")
);
CREATE UNIQUE INDEX "Subscription_userId_program_key" ON "Subscription"("userId","program");
CREATE TABLE "SubscriptionOrder" (
 "id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
 "program" TEXT NOT NULL CHECK ("program" IN ('entrance','ielts','sat')),
 "amountMnt" INTEGER NOT NULL CHECK ("amountMnt">0), "currency" TEXT NOT NULL DEFAULT 'MNT',
 "provider" TEXT NOT NULL DEFAULT 'MOCK', "status" TEXT NOT NULL DEFAULT 'PENDING' CHECK ("status" IN ('PENDING','DECLINED','PAID')),
 "activeKey" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "paidAt" TIMESTAMP(3),
 "periodStart" TIMESTAMP(3), "periodEnd" TIMESTAMP(3)
);
CREATE UNIQUE INDEX "SubscriptionOrder_activeKey_key" ON "SubscriptionOrder"("activeKey");
CREATE INDEX "SubscriptionOrder_userId_createdAt_idx" ON "SubscriptionOrder"("userId","createdAt");
