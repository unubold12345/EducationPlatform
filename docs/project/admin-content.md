# Content, admin and reporting

Part of the [project guide](../PROJECT.md) (was PROJECT.md section 6). "Section N" in the text means that old numbering; the guide maps it to files.

- `/admin` is protected and offers an overview (with an attention row and section directory), users,
  attempts (mocks / withdrawn official papers), subscriptions, payments (plan orders / single-exam
  purchases), prices, content, audit history, CSV exports and a system status page (`tab=settings`,
  labelled "Систем"). Its sidebar groups these by purpose and each section states what it is for. Every
  list has search, filters and numbered pagination with totals (20 rows per page).
- `/admin/users/[id]` is the user record: account facts, sign-in methods, totals paid, active plans,
  IP addresses and other accounts seen on the same IP, admin notes, and paginated activity
  (sign-ups, sign-ins with IP/device, password changes), payments, attempts, live sessions and admin
  history. Actions: note, grant/extend or expire a month, grant AI credits for this month, sign out everywhere, suspend/unsuspend.
- Suspension (`User.suspendedAt`) is admin-only (`input:false`), signs the user out, is refused at
  session creation (`ACCOUNT_SUSPENDED`) and by `getSession`/`apiUser`. Admins and the acting admin
  cannot be suspended. `UserEvent` keeps the durable activity record because sessions are deleted on
  sign-out; logging never blocks sign-in. Activity starts from the 2026-10-30 migration.
- Monthly plan prices are editable in the Prices tab (`PlanPrice`, ₮1,000–₮1,000,000 in steps of
  ₮100, reason required, audited). New and unpaid orders use the current price; paid orders keep their
  amount. Missing rows fall back to `subscriptions/plans.ts`. The single-mock price stays ₮10,000 in
  code. The same tab edits the AI credit pack (`CreditPack`, 10–100,000 credits for ₮1,000–₮1,000,000 in steps of ₮100,
  audited `set-credit-pack`); unpaid credit orders follow it and paid ones keep what they were bought at.
- Wrong answers and typos are fixed per question on `/admin/content/[key]` (searchable, paginated
  list; prompt, passage, options, answer key, explanation). Each fix is validated with the same shape
  and answer-key rules and published immediately as a new version by one admin (owner decision
  2026-10-30); it is blocked while an unpublished draft exists. Earlier attempts keep their version.
  The ЭЕШ mocks are fixed the same way; withdrawn official papers have no admin page.
- Existing catalog items are edited through `ContentDraft` → optional review → immutable `PublishedContent`.
  Runtime definitions must be read through `src/modules/content/published.ts`; never bypass version
  resolution in grading or new attempts.
- Exact-version stateless grading preserves prior results. Cross-version saved-attempt resume must
  keep the original attempt's content snapshot.
- Standards, IDs, types, counts, timers and media references stay fixed during editing. Creating new
  catalog items and replacing media remain unfinished.
- Default reports and exports exclude known reserved test domains and MOCK/LEGACY revenue. The
  explicit test view preserves test workflows. CSV exports return at most the latest 1,000 rows.
- Audit history contains actual actions across operational and test scopes.
