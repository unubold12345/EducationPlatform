# Pricing, plans, picks and the access rule

Part of the [project guide](../PROJECT.md) (was PROJECT.md section 4). "Section N" in the text means that old numbering; the guide maps it to files.

Owner rules 2026-11-13 and 2026-11-17: the free account and three plans — ЭЕШ, Гадаад хэл Basic and Гадаад хэл Pro.

| Item | Price | Access rule |
| --- | --- | --- |
| Free account | 0 | The ten free half-length mocks, Workspace tools with 100 AI credits a month, a 100-word vocabulary bank and 5 saved file exams; full mocks by per-exam purchase |
| ЭЕШ (`entrance`) | 29,900 MNT/month | All 194 ЭЕШ papers, sittings and practice, no limit; 1,200 AI credits a month, a 500-word bank, 5 saved file exams |
| Гадаад хэл Basic (`language_basic`) | 29,900 MNT/month | Every mock that is not ЭЕШ (SAT, IELTS, TOEFL, JLPT, HSK, TOPIK), sittings and practice, no limit; the IELTS workshops; 1,200 AI credits a month, a 1,500-word bank, 5 saved file exams |
| Гадаад хэл Pro (`language`, was "Гадаад хэл") | 59,900 MNT/month | The same mocks and workshops as Basic; 3,000 AI credits a month, a 3,000-word bank, 15 saved file exams |
| Full mock | 10,000 MNT per 7 days | One-time purchase of any paid mock: sittings (retakes too) and practice for 7 days from payment, then it is bought again; free mocks are never sold |
| Yellow credit packs | 200 / 500 / 1,000 / 2,000 / 5,000 credits at 5 MNT a credit | An admin-edited list of 1–12 packs; purchased ("yellow") credits never expire |
| Vocabulary space | 200 yellow credits per 100 words | Permanent bank space, yellow credits only (owner rule 2026-11-13; code constant `VOCABULARY_SPACE`) |

Monthly plan prices and the credit packs above are the defaults; admins can change them in `/admin?tab=pricing`. Each plan also adds
AI credits for every month of the plan (ЭЕШ 1,200, Basic 1,200, Pro 3,000), kept until the plan ends, on top of 100 free credits a month;
see "AI credits" in section 7. Migration `20261117100000_basic_plan_sales_and_pack_list` moves any admin-set ЭЕШ / Pro price or ЭЕШ credit
row to the new figures (rows that do not exist follow the code defaults).

- **Basic and Pro** (`subscriptions/plans.ts`) share one rule: no picks. Until 2026-11-17 Гадаад хэл opened 15 picked mocks a month; the pick
  machinery (`mockPicks`, `MockPick`, `/api/mock-picks`, `pick-client.tsx`) stays but no plan on sale sets it, so `mockAccess` returns
  `plan` for every covered mock and picking an open mock is a no-op. Limits take the largest active plan. Basic is not sold while Pro is active
  (409 in `createSubscriptionOrder`); the cheapest plan covering a programme (`salePlanFor`) is the one the "or take the plan" links offer.
- **Plan sales.** `PlanPrice.saleAmountMnt` / `saleEndsAt`: an admin sets a sale price below the regular one (whole hundreds) and an optional last
  day (end of that day in Ulaanbaatar); `chargedPrice` returns the sale price while it runs, never a higher one. `pricedPlans()` / `pricedPlan()`
  return `amountMnt` (what is charged), `regularMnt` and `onSale`; orders store the charged amount and confirmation compares it again (a sale
  that ended or was cancelled meanwhile gives 409; the next order follows the current price). The plans page, subscribe page, programme pages and
  homepage show the regular price struck through beside the sale price. Changing the regular price to or below the sale clears the sale.
  Admin: `set-sale` in `/admin?tab=pricing` (audited with a reason; `amount: null` cancels).
- **Mock purchases last 7 days** (`MockPurchase.expiresAt`, `MOCK_PURCHASE_DAYS`). Payment sets `expiresAt = paidAt + 7 days`; the same row (one per
  student and mock) is reset to pending and bought again after it lapses (payment history keeps only the latest purchase). Rows from before the
  rule have a null expiry and stay open for good. A sitting started under a purchase with an expiry is flagged `subscriptionAccess`, so it can be
  finished and reviewed after the 7 days; new sittings and practice close. The profile lists the end and a "Дахин авах" link. The mobile
  routes `api/mobile/billing/checkout/*` and `api/mobile/profile` still read `status === "PAID"` and are not yet expiry-aware.

- **Retired plans.** The IELTS and SAT plans (60,000 each) are no longer sold, renewed or granted (`legacyPlans` in
  `subscriptions/plans.ts`; `/subscribe/ielts|sat` 404). A subscription bought before the change keeps its old rule until it ends: every
  mock of its programme with no picks, its AI credits (3,000 / 2,000), a 3,000-word bank, 15 saved exams and, for IELTS, the workshops.
  Admins can still end one (`expire-plan`); the profile offers Гадаад хэл Basic instead of renewal. No data was migrated.
- **Picks (dormant since 2026-11-17).** `MockPick` (migration `20261113190000_mock_picks_and_vocabulary_space`; `20261113200000_language_plan_program` adds
  `language` to the `program` CHECK constraints of `Subscription` and `SubscriptionOrder`) records each pick with its plan month: the
  subscription's start stepped by billing months (`planMonth`, the same steps a renewal adds), ending at the next step or when the plan
  ends. The briefing offers "Сонгох" (`POST /api/mock-picks`, same origin, verified session, `{ slug }` only); the server counts the
  month's picks under a row lock on the subscription, never uses a pick for a mock that is already open (free, bought, an unlimited plan
  or already picked), and refuses the 16th with 409. Starting a sitting never picks implicitly. Picks reset with the next plan month, and a
  plan bought again after it lapsed starts a new month. Hubs show each mock's state (bought, in the plan, picked, can be picked).
- **One access rule** (`subscriptions/mock-access.ts`): free mock, purchase, a plan with no picks that covers the programme, or this
  month's pick. Start, read, save, check, audio, practice and the review coach all use it; the briefing pages show the same decision.

Local checkout is explicitly simulated: no real money, card details or payment provider. Hosted
payments are also simulated under `HOSTED_MOCK_PAYMENTS`. A matching active plan or a prior
per-exam/per-paper purchase is checked server-side on every new start, read, edit, audio, recording
and grading path. Never grant global paid access.
