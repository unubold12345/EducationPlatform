# Pricing, plans, picks and the access rule

Part of the [project guide](../PROJECT.md) (was PROJECT.md section 4). "Section N" in the text means that old numbering; the guide maps it to files.

Owner rule 2026-11-13: only three plans — the free account, ЭЕШ and Гадаад хэл.

| Item | Price | Access rule |
| --- | --- | --- |
| Free account | 0 | The ten free half-length mocks, Workspace tools with 100 AI credits a month, a 100-word vocabulary bank and 5 saved file exams; full mocks by per-exam purchase |
| ЭЕШ (`entrance`) | 40,000 MNT/month | All 194 ЭЕШ papers, sittings and practice, no limit |
| Гадаад хэл (`language`) | 60,000 MNT/month | Any mock that is not ЭЕШ (SAT, IELTS, JLPT, HSK): 15 picks a plan month; a picked mock can be sat again and practised until that plan month ends. The IELTS workshops, a 3,000-word bank and 15 saved file exams |
| Full mock | 10,000 MNT each | Per-exam purchase of any paid mock, including retakes; free mocks are never sold |
| Yellow credit pack | 5,000 MNT for 1,000 credits | Admin-editable size and price; purchased ("yellow") credits never expire |
| Vocabulary space | 200 yellow credits per 100 words | Permanent bank space, yellow credits only (owner rule 2026-11-13; code constant `VOCABULARY_SPACE`) |

Monthly plan prices and the credit pack above are the defaults; admins can change them in `/admin?tab=pricing`. Each plan also adds
AI credits for every month of the plan (ЭЕШ 1,500, Гадаад хэл 3,000), kept until the plan ends, on top of 100 free credits a month; see
"AI credits" in section 7.

- **Retired plans.** The IELTS and SAT plans (60,000 each) are no longer sold, renewed or granted (`legacyPlans` in
  `subscriptions/plans.ts`; `/subscribe/ielts|sat` 404). A subscription bought before the change keeps its old rule until it ends: every
  mock of its programme with no picks, its AI credits (3,000 / 2,000), a 3,000-word bank, 15 saved exams and, for IELTS, the workshops.
  Admins can still end one (`expire-plan`); the profile offers Гадаад хэл instead of renewal. No data was migrated.
- **Picks.** `MockPick` (migration `20261113190000_mock_picks_and_vocabulary_space`; `20261113200000_language_plan_program` adds
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
