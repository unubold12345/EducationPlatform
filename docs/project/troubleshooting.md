# Troubleshooting and provider setup

Full text of the known problems and provider notes summarised in [OPERATIONS.md](../OPERATIONS.md) sections 4 and 5.

## Known problems

- **Database port drift.** If another app holds 51214 when `db:start` runs, Prisma saves the new port in `%LOCALAPPDATA%\prisma-dev-nodejs\Data\education-platform\server.json` (`--db-port` is ignored for an existing server); `.env` and the fixtures expect 51214. Fix, with owner approval: `db:stop`, set `databasePort`, the `exports.database` URLs and the URL inside the base64 `ppg` api_key back to 51214, `db:start`. Happened 2026-11-08 (Edge, 51217); restored the same day.
- **Local database drops** (`P1017`, `P1001`, `ECONNREFUSED`, or `{"database":"down"}`; every suite then fails). Run `npm run db:stop`,
  wait a few seconds, `npm run db:start`; never reset. Transient `P2028` or `08P01`: rerun once. Cause not proven; suspect
  below. It dropped three times on 2026-11-04/05, then stayed up through two runs after the log was set aside; it has dropped
  again during `check:all` runs since (2026-11-13, 2026-11-15).
- **Local change log grows forever.** `prisma-dev-nodejs/Data/durable-streams/education-platform` is Prisma's one-way copy of every
  write, has no retention setting, and our app does not use it; each `check:all` adds about 60 MB. Above about 1 GB: stop the
  database, move that folder elsewhere and start again; Prisma recreates it. Moved aside 2026-11-05 at 2.8 GB with identical row counts;
  the old copy is `Data/durable-streams-log-backup-2026-11-05`, for the owner to delete. Moved again 2026-11-18 at 8.7 GB
  (identical row counts) to `Data/durable-streams-log-backup-20261118-endmock`, also for the owner to delete.
- **Only one app on the local database.** PGlite uses one connection, so stop other previews before running suites.
  2026-11-19: it also dropped the connection after any failed statement (`select 1/0` then `select 1` → ECONNRESET), so
  code that catches a unique-key error and reads again (a repeated recording upload) answered 503 and `exams_smoke` failed
  at its duplicate-upload check. `tests/mock_fixture.mjs` retries its first read on P1017. `db:stop`, `db:start` fixed it.
- **`next dev` console error on a missing exam.** `/exams/<unknown slug>` (the `notFound()` in `ExamPage`) logs "Failed to
  execute 'measure' on 'Performance': 'ExamPage' cannot have a negative time stamp" in every fresh browser on `next dev`
  (2026-11-19, dev 3011), so `exams_smoke`'s final `pageerror` check fails there. The production build (3001) shows none.
- **Build replaces `.next`.** Restart any running preview after a build. If `next dev` reload-loops, delete `.next/dev`.
- **Vercel build.** It runs `scripts/vercel-build.mjs`: generate, `migrate deploy`, `next build`, with no seed; about 2 minutes.
  Fonts are fetched from Google at build time. A pooled `DATABASE_URL` without a direct URL only warns. A build that fails with
  no app error can be transient (`47dc518`; an empty commit fixed it. `1581b65`: `migrate deploy` lock timeout `P1002`; a redeploy from Vercel fixed it). Vercel logs need a signed-in session.
- **Hosted email.** Enabling a sender enforces verification for every non-demo account. Do not bulk-mark rows verified.

## Provider notes

- **Gmail:** `GMAIL_USER` plus a 16-character App Password in `.env.local`; restart the app. Verify with one small SMTP check.
- **Resend:** remove the Gmail values, set `RESEND_API_KEY` and a verified `AUTH_EMAIL_FROM`.
- **Hosted Google:** set the ID/secret pair in Vercel; callback is `<site>/api/auth/callback/google`.
- Never print, commit or paste secret values. Hosted and real-provider checks need explicit owner authorization.
