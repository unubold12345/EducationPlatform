# Local development and verification

Part of the [project guide](../PROJECT.md) (was PROJECT.md section 9-10). "Section N" in the text means that old numbering; the guide maps it to files.

Requirements: Node.js 24.x, npm 11 or newer, and a local PostgreSQL-compatible PGlite instance
managed by the project scripts.

```powershell
npm ci
npm run setup:env
npm run db:start
npm run db:migrate
npm run db:generate
npm run dev
```

The imported ЭЕШ content is already generated in `assets/entrance-mocks` and `public/exam-assets/eesh`.
After editing the offline packs in `MockExmps`, run `node scripts/build-entrance-mocks.mjs <subjects>` and commit the
regenerated JSON, SVG and catalogue. The script validates 194 forms, 100-point totals and diagram files.
IELTS Mocks 07–12: `node scripts/build-ielts-mocks.mjs` (needs ffmpeg/ffprobe and the local `MockExmps/IELTS` pack);
it re-encodes a recording only when its source hash changes.

Open <http://localhost:3001>. Local services:

| Service | Address / port | Notes |
| --- | --- | --- |
| App preview | 3001 | `npm run dev`, or production `npm run build` then `npm start` |
| Local database | 51214 (and 51215) | PGlite, database `template1`; never reset casually |
| Recovery QA server | 3002 | Optional, built app plus loopback outbox and synthetic Google credentials |

With `AUTH_LOCAL_PILOT=true`, the app uses a single database connection
(`max: 1`). This keeps PGlite stable locally; production connection behavior is not verified by that
setting. The local database is independent: do not point it at LawTest, hosted Neon, or production
data.

Ignored environment files hold real local values. `npm run setup:env` creates local files from
`.env.example` when needed. Never print, commit or paste secret values. Typical local keys:

- `BETTER_AUTH_URL=http://localhost:3001`
- `BETTER_AUTH_SECRET` (at least 32 characters)
- `AUTH_LOCAL_PILOT=true`
- `DATABASE_URL` pointing at the loopback database
- Optional: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`,
  `AUTH_HOSTED_GMAIL`, `RESEND_API_KEY`, `AUTH_EMAIL_FROM`, `AUTH_REQUIRE_EMAIL_VERIFICATION`, `DEEPSEEK_API_KEY`,
  `DEEPSEEK_MODEL`

Useful provisioning commands:

```powershell
npm run demo:accounts
npm run admin:grant -- qa-demo-01@example.invalid
```

The recovery QA server (`artifacts/start-auth-recovery.mjs`, port 3002) forces the loopback outbox and synthetic Google
credentials. Its launcher is ignored by git and absent on this PC.

## 10. Verification and delivery

`npm run check`, `check:push` and `check:all` (`scripts/check.mjs`) run lint, typecheck, unit tests and browser suites by area.
[OPERATIONS.md](../OPERATIONS.md) section 3 says which to run. Fixtures under `tests/` may alter only reserved QA rows and advance
deadlines; they must never add a runtime bypass, shorten a public exam or change a real learner's data.
