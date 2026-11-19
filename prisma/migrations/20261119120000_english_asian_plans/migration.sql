-- Owner rule 2026-11-19: Гадаад хэл Basic / Pro split into Англи хэл Basic / Pro (SAT, IELTS, TOEFL) and Ази хэл Basic / Pro
-- (JLPT, HSK, TOPIK). The four new programs may be named by a subscription and its orders. Additive: only the two CHECK
-- constraints are widened; language_basic and language stay valid (retired, kept until they end) and no row is touched.
-- Any CHECK on these tables that names "program" is dropped by lookup, as in 20261117100000_basic_plan_sales_and_pack_list.
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
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_program_check" CHECK ("program" IN ('entrance', 'english_basic', 'english_pro', 'asian_basic', 'asian_pro', 'language', 'language_basic', 'ielts', 'sat'));
ALTER TABLE "SubscriptionOrder" ADD CONSTRAINT "SubscriptionOrder_program_check" CHECK ("program" IN ('entrance', 'english_basic', 'english_pro', 'asian_basic', 'asian_pro', 'language', 'language_basic', 'ielts', 'sat'));
