# Content, admin and reporting

Part of the [project guide](../PROJECT.md) (was PROJECT.md section 6). "Section N" in the text means that old numbering; the guide maps it to files.

- `/admin` is protected and offers an overview (metrics, this month's AI line, an attention list, newest users
  and latest admin actions), users, attempts (mocks / withdrawn official papers), subscriptions, payments (plan
  orders / single-exam purchases / credit orders), prices, AI credits, content, audit history, CSV exports and a
  system status page (`tab=settings`, labelled "Систем"). Its sidebar groups these by purpose.
- **Layout (owner choice 2026-11-18: tabs, one job per screen).** The Workspace rail and top bar are unchanged.
  Every screen has the same order: title with a one-line purpose, a tab bar (`SubTabs`, each tab a link with its
  own address), one toolbar (search, a filter, CSV on the right), then one table or list. Lists have numbered
  pagination with totals (20 rows per page). Long background rules sit in a closed "Яаж үйлчилдэг вэ" block.
  Tabs per section: users by status (`filter`); subscriptions by plan, payments by product, attempts by type,
  content by program (`kind`); announcements `kind=sent` (the form is the default tab); prices
  `kind=plans|sales|credits|packs|history`; AI credits `view=ledger` with the month in a picker (`kind`);
  system `kind=notes`.
- Settings lists (plan price, sale, monthly AI credits) are one row per plan; "Засах" opens the editor inside
  the row (`src/components/admin-row.tsx`). The credit pack list is itself the form.
- `/admin/users/[id]` is the user record. It opens on "Тойм": account facts, sign-in methods, totals paid, active
  plans, AI credits, IP addresses and other accounts seen on the same IP, with the action form and admin notes
  beside them. Each history is its own tab (`view=activity|payments|attempts|credits|sessions|admin`): sign-ups and
  sign-ins with IP/device and password changes, payments, attempts, AI charges, live sessions, admin history.
  Actions: note, grant/extend or expire a month, grant AI credits for this month, sign out everywhere, suspend/unsuspend.
- Suspension (`User.suspendedAt`) is admin-only (`input:false`), signs the user out, is refused at
  session creation (`ACCOUNT_SUSPENDED`) and by `getSession`/`apiUser`. Admins and the acting admin
  cannot be suspended. `UserEvent` keeps the durable activity record because sessions are deleted on
  sign-out; logging never blocks sign-in. Activity starts from the 2026-10-30 migration.
- Monthly plan prices are editable in the Prices section (`PlanPrice`, ₮1,000–₮1,000,000 in steps of
  ₮100, reason required, audited). New and unpaid orders use the current price; paid orders keep their
  amount. Missing rows fall back to `subscriptions/plans.ts`. The single-mock price stays ₮10,000 in
  code and is shown there as a fixed row. The same section edits sales, the monthly AI credit amounts and the AI
  credit packs (`CreditPack`, 10–100,000 credits for ₮1,000–₮1,000,000 in steps of ₮100, audited
  `set-credit-packs`); unpaid credit orders follow it and paid ones keep what they were bought at. Its History tab
  is one paginated list of all four kinds of change (`set-price`, `set-sale`, `set-credits`, `set-credit-packs`),
  filtered by kind and searched by reason; each list shows its latest change with a link to that history.
- Wrong answers and typos are fixed per question on `/admin/content/[key]` (searchable, paginated
  list; prompt, passage, options, answer key, explanation). Each fix is validated with the same shape
  and answer-key rules and published immediately as a new version by one admin (owner decision
  2026-10-30); it is blocked while an unpublished draft exists. Earlier attempts keep their version.
  The ЭЕШ mocks are fixed the same way; withdrawn official papers have no admin page. The record's tabs
  (`view=questions|editor|review|structure|history`) hold the question list, the full editor, the review status,
  the structure or workshop task, and the latest changes; it opens on the questions, or the editor when the
  material has none.
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
