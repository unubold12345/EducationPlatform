# Notifications

Part of the [project guide](../PROJECT.md). An in-app inbox for signed-in students; there is no email copy and no mobile push.

## What a student sees

- A **Мэдэгдэл** row in the Workspace rail, above the account row, with the unread count. It opens the inbox beside the
  rail (`#wsp-notify`); with the rail collapsed the count sits on the bell icon. On phones (960px and below) the top bar has a
  bell too, and the inbox covers the whole screen as its own page; the menu's row closes the menu and opens the same page.
- The inbox lists the newest 30 notices. A notice with a link opens its page, is marked read and closes the inbox; one without
  a link is marked read in place. **Бүгдийг уншсан** marks everything read. Escape, the close button, a click outside and a
  route change close it.
- The admin frame has no bell.

## Notices

| Kind | When | Opens | Key |
| --- | --- | --- | --- |
| `plan-paid`, `plan-renewed` | the request that marks a plan order PAID (renewed = bought while the plan was active) | `/workspace/plans` | `order:<id>` |
| `mock-paid` | the request that marks a single-mock purchase PAID | `/exams/<slug>` | `order:<id>` |
| `credits-paid` | the request that marks a credit-pack order PAID | `/workspace/plans#credits` | `order:<id>` |
| `plan-granted` | an admin grants a month (`grant-month`) | `/workspace/plans` | none |
| `plan-ending` | an active plan has 3 days or less left | `/subscribe/<program>` (a retired plan: `/workspace/plans`) | `plan-ending:<program>:<end>` |
| `announcement` | an admin sends a message | the admin's link, or nothing | `announcement:<id>` (to everyone), none (to one member) |

Not reported: declined payments, exam results, AI credit levels, an admin ending a plan or granting credits.

## How it works

- Tables `Notification` and `Announcement` (migration `20261115200000_notifications`, additive). `Notification` is unique on
  `(userId, dedupeKey)`; every write goes through `notify()` in `src/modules/notifications/service.ts`, which uses
  `createMany … skipDuplicates`, so a repeated confirm or two tabs never add a second notice.
- Purchase notices are written **inside the payment transaction**, by the request that flips the order to PAID
  (`subscriptions/service.ts`, `credits/purchase.ts`, `exams/payments.ts`), and the admin grant inside `adminMutation`.
- There is no scheduled job. `plan-ending` reminders and announcements to everyone are added when the student's inbox is
  read (`syncInbox` in `GET /api/notifications`). A renewal moves the plan's end, so the renewed plan gets a new reminder later.
- An announcement to everyone is **one `Announcement` row**; it is copied into an inbox the first time that account reads
  its inbox within 30 days, and only for accounts created before it was sent. An announcement to one member (by email) is
  written to that inbox at once. Withdrawing deletes the row and every copy.
- Notices older than 90 days are deleted when the inbox is read.
- Texts, limits and input checks are in `rules.ts` (no server imports; the browser and the unit tests read it). A notice's
  link must be a path on this site (`safeHref`): no other host, scheme, backslash or whitespace.
- The shell's first badge is `unreadNotifications()` in `shellAccount` (0 if the table cannot be read). `useInbox`
  (`client.tsx`) reads the inbox once the shell is on the page, again when that server figure changes (the checkout pages call
  `router.refresh()` after a payment) and when the tab regains focus after a minute. Marking read is shown at once and then
  replaced by the server's count.

## Routes

- `GET /api/notifications`: the signed-in student's `{ items, unread }`. Verified session; every query is scoped to the user.
- `POST /api/notifications`: `{"action":"read","ids":[1–50 ids]}` or `{"action":"read-all"}`. Same origin; any other shape is 400.
  Ids that belong to another account change nothing.
- `POST /api/admin/announcements`: `{"action":"send",title,body,href?,email?}` or `{"action":"withdraw","id"}`. Same origin,
  admin only; membership is rechecked inside the transaction (demo accounts are never admins on the hosted site). Title 3–80
  characters, text 5–500, link up to 200. Audited as `announce` and `withdraw-announcement`.

## Admin

`/admin?tab=announcements` (Мэдэгдэл, under Хүмүүс): the send form, then the announcements sent to everyone with how many
inboxes each reached and how many read it, and a **Буцаах** button. Messages to one member appear only in the audit log.

## Checks

Unit: `tests/notifications.test.mjs`. Browser: `npm run check -- notifications` (`tests/notifications_smoke.py`, with
`tests/notifications_fixture.mjs` moving a `qa-notify-` account's plan end for the reminder case).

## Limits

- The mobile app can call `GET /api/notifications` like any signed-in client, but it has no screen for it and nothing is pushed.
- A student who never opens the Workspace within 30 days of an announcement does not receive it.
- The "reached / read" figures count inbox copies, so they drop as 90-day-old notices are deleted.
