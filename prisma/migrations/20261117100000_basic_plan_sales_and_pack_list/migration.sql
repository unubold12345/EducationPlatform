-- Owner pricing changes 2026-11-17. Additive: new nullable columns, a wider CHECK on the plan program and
-- a re-keyed credit pack row; no table is dropped and no paid order or purchase changes.
-- 1. The Гадаад хэл Basic plan (program "language_basic") may be named by a subscription and its orders.
DO $$
DECLARE c record;
BEGIN
  FOR c IN
    SELECT conrelid::regclass AS tbl, conname FROM pg_constraint
    WHERE contype = 'c'
      AND conrelid IN ('"Subscription"'::regclass, '"SubscriptionOrder"'::regclass)
      AND pg_get_constraintdef(oid) LIKE '%program%'
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', c.tbl, c.conname);
  END LOOP;
END $$;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_program_check" CHECK ("program" IN ('entrance', 'language', 'language_basic', 'ielts', 'sat'));
ALTER TABLE "SubscriptionOrder" ADD CONSTRAINT "SubscriptionOrder_program_check" CHECK ("program" IN ('entrance', 'language', 'language_basic', 'ielts', 'sat'));

-- 2. Plan sales: a sale price (and optional end) beside the regular price.
ALTER TABLE "PlanPrice" ADD COLUMN "saleAmountMnt" INTEGER, ADD COLUMN "saleEndsAt" TIMESTAMP(3);

-- 3. One-time mock purchases last 7 days. Earlier paid purchases keep a null expiry (permanent).
ALTER TABLE "MockPurchase" ADD COLUMN "expiresAt" TIMESTAMP(3);

-- 4. New regular prices and monthly credits where an admin row already overrides the code default
--    (ЭЕШ 29,900 and 1,200 credits; Гадаад хэл / Pro 59,900). Rows that do not exist follow the new code defaults.
UPDATE "PlanPrice" SET "amountMnt" = 29900 WHERE "program" = 'entrance';
UPDATE "PlanPrice" SET "amountMnt" = 59900 WHERE "program" = 'language';
UPDATE "CreditAllowance" SET "credits" = 1200 WHERE "key" = 'entrance';

-- 5. Credit packs are now a list. The old single "default" row is dropped when it only repeated the code default
--    (1,000 credits for 5,000, so the new default list applies); a customised one is kept under the key "p<credits>".
DELETE FROM "CreditPack" WHERE "key" = 'default' AND "credits" = 1000 AND "amountMnt" = 5000;
UPDATE "CreditPack" SET "key" = 'p' || "credits" WHERE "key" = 'default';
