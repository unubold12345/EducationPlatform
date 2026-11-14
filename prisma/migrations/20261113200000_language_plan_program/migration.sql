-- The Гадаад хэл plan (program "language", owner rule 2026-11-13) joins the programs a subscription and its orders
-- may name. The original CHECK constraints (20261023020000_program_subscriptions) allowed only entrance, ielts and sat.
-- Only those two constraints change: retired IELTS and SAT rows stay valid, and no row is touched.
-- Any CHECK on these tables that names "program" is dropped by lookup, so an unexpected constraint name cannot leave
-- the old list in place; the replacements have fixed names.
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

ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_program_check" CHECK ("program" IN ('entrance', 'language', 'ielts', 'sat'));

ALTER TABLE "SubscriptionOrder" ADD CONSTRAINT "SubscriptionOrder_program_check" CHECK ("program" IN ('entrance', 'language', 'ielts', 'sat'));
