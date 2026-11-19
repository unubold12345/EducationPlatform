# AI credits and image input

Part of the [project guide](../PROJECT.md) (was PROJECT.md section 7). "Section N" in the text means that old numbering; the guide maps it to files.

### AI credits (2026-11-09)

- The owner asked for every AI feature to spend credits priced from DeepSeek. `src/modules/credits/pricing.ts` is the one price
  list: DeepSeek Flash peak list prices (USD 0.006 / 0.30 / 1.20 per million cache-hit input, cache-miss input and output tokens,
  checked 2026-11-09 on the official pricing page) and 1 credit = USD 0.001. Each action has a token budget (output = the
  provider `max_tokens` the service sends; input = a generous prompt estimate, all priced as cache misses); its fixed cost is
  the budget's cost rounded up: chat 5, review coach 6, practice assistant 5, SAT math tutor 3, Essay Studio ideas 3 /
  grammar 5 / feedback 6, Speaking Lab reply 3 / report 9, vocabulary import 4–47 (sold with a margin, below), file-to-exam 10–80 (two credits a question, sold with a margin, below) and its retry 5–40,
  Reading Lab practice 4–17 (priced by length, below) and its retry 2–8, roadmap structure 5–8 (`roadmapCredits`: 2,500 prompt tokens plus a reply
  budget of 2,800 + 55 per plan week, which is also that call's `max_tokens`; the length is known before the call, so the price
  is exact up front: 5 up to 13 weeks, 6 to 28, 7 to 43, 8 beyond).
  Changing a price or budget there changes the charge, the badges and the plans page together.
- Vocabulary import is sold with a margin (owner rule 2026-11-11: an AI action should earn, not only cover its DeepSeek cost),
  and priced by what the student receives rather than by tokens. `vocabularyImportCredits` = 3 credits + 0.5 per new word for
  words 1–20, 0.4 for words 21–60 and 0.3 for words 61–120, rounded up (10 words = 8, 20 = 13, 40 = 21, 120 = 47, the listed
  maximum), and never less than twice the DeepSeek peak list cost of that scan (`vocabularyImportCostNano`: 1,500 prompt tokens
  + one token per two characters read or 1,024 per page photo + 66 output tokens per word), so 10 words from a full
  45,000-character file cost 16. Against that cost model the price is about 4–5× on ordinary files and at least 2× in the worst
  case. The maximum for the chosen count on a full-length file is held first (10 words 16, 20 → 18, 40 → 21, 120 → 47); the
  charge settles to the new words found and the rest returns in the same transaction. Words already in the bank cost nothing.
  The badge shows "хамгийн ихдээ N"; the page no longer explains how the price is worked out. `MARGIN_ACTIONS` lists the
  actions sold this way; every other action is still priced at its token budget's cost.
- An exam from a file is priced by its questions and sold with a margin (owner request 2026-11-12; it was 13 or 17 at cost).
  `examCredits` = 2 credits per question delivered (5 = 10, 10 = 20, 20 = 40, 40 = 80, the listed maximum since 2026-11-15), and
  never less than twice the DeepSeek peak list cost of that exam (`examCostNano`: per reply, 1,500 prompt tokens + one token per two
  characters read or 1,024 per page photo, plus 800 + 360 output tokens per question, which is also a reply's `max_tokens`; an exam
  above 20 questions is two replies and each reads the material again), so 5 questions from a full 45,000-character file cost 21
  and 10 cost 25. The hold is the most the chosen count can cost (a document at the full-file price: 5 → 21, 10 → 25, 15 → 30,
  20 → 40, 21 → 51, 30 → 60, 40 → 80; page photos by their number: 10 → 20, 40 → 80) and the charge settles to the questions
  delivered and the text read. The 2 and the margin are code constants (`EXAM_PRICE`); the owner did not name a figure.
  The retired `exam-10`/`exam-20` ids stay in the price list only so earlier charges keep their name in admin reports.
- Reading Lab price since 2026-11-17 (owner request to raise it): like an exam from a file, `READING_PRICE` = 2 credits per
  question delivered, never below 2× the practice's DeepSeek peak cost (`readingPracticeCostNano`, the token rates below);
  "reading-practice" joined `MARGIN_ACTIONS`. 12 questions = 24 (28 from a full 45,000-character file), 24 = 48; listed
  range 14–48 (was 4–17). The hold for a document is the full-file price for the chosen count; retries stay half (7–24).
  The figures in the next two bullets are the cost basis and the history before this change.
- Reading Lab practices are priced by length (owner rule 2026-11-10) with the same hold-and-settle: `readingPracticeCredits` =
  1,500 prompt tokens + the larger of one token per two characters of material or 1,024 per page photo (input), plus 600 + 2 per
  passage word + 200 per question (output). The rates fill the 24,000/8,000 budget, so a full 45,000-character file with a
  1,300-word passage and 24 questions costs the listed 17 (15 with 14 questions before 2026-11-15). The reply budget follows the
  count the student chose (`readingOutputTokens`: 5,600 tokens for 12 questions, 8,000 for 24). The hold is the maximum for the
  material's known size and that count (pasted text by its length, photos by count, a document at 14 for 12 questions and 17 for
  24); the charge settles to what was read and written. The first live call (1,935 characters,
  351-word passage, 12 questions, $0.0027 real) now costs 6 instead of 15; a malformed-reply retry is not charged.
- A JLPT/HSK/TOPIK reading text (Workshop → Унших дасгал, 2026-11-19; [language-reading](./language-reading.md)) is
  priced by the length chosen, at 2× the DeepSeek peak list cost of its budget, and `language-reading` is in `MARGIN_ACTIONS`.
  `languageReadingCredits` uses 5,000 prompt tokens and a reply of 300 + 240 tokens per sentence for the length's most
  sentences, which is also the call's `max_tokens`. Short (4–6 sentences) is 8, medium (7–10) is 10 and long (11–15) is 13;
  the listed range is 8–13. The price is known before the call, so the hold is the charge. A second call after a reply that
  broke the level's script rules is included in the price, and when both calls fail the hold is refunded. Live calls
  (2026-11-19) cost about 0.4–3.5 credits, so the price is about 4–20× the real cost. The owner did not name a figure.
- Retries cost half (owner decision 2026-11-15; `RETRY_PRICE.percent` = 50, a code constant). `examRetryCredits` = half of
  `examCredits` for the kept text and the questions delivered, rounded up, and never below the DeepSeek peak list cost of the
  retry itself, which also reads the replaced prompts (85 tokens each): 10 questions = 10, 20 = 20, 40 = 40 on ordinary files;
  5 from a full-length file = 11. `readingRetryCredits` = half of what a new practice with the saved passage and that many
  questions costs, rounded up (a 900-word passage with 24 questions: 5; the listed range is 2–8). Reading Lab is sold at cost, so
  at peak hours a retry can cost DeepSeek a little more than the student pays (the owner chose half price knowing this); it
  always covers the off-peak cost. Both are their own actions (`exam-retry`, `reading-retry`, listed in `RETRY_ACTIONS`) in the
  ledger and the admin's credit reports. The text and the count are known before the call, so the hold is the price; it settles
  to the questions delivered and is refunded on any failure. A retry is only ever priced and run by the server for the
  student's own row: an exam that still has its kept text, or a practice with its saved passage.
- Where credits come from (owner rule 2026-11-09; pure rules in `credits/buckets.ts`):
  - Free: 100 per Ulaanbaatar calendar month for every verified account, plus any admin bonus (`CreditPeriod`); they lapse on the 1st.
  - Plan: each active plan's `aiCredits` for its subscription term (`CreditPlanTerm`, keyed by `Subscription.startsAt`, which stays
    fixed while a plan is renewed before it ends). Every billing month of the term adds the plan's credits when that month begins;
    unused ones carry over and lapse only when the subscription ends. Nothing resets on the 1st. A plan bought again after it
    lapsed starts a new term with fresh credits. Plans stack; per-mock purchases add none.
  - Purchased ("yellow", 2026-11-13): the credit packs (default list since 2026-11-20: 200 credits ₮3,000, 500 ₮6,000, 1,000 ₮12,000, no discount above 500; was ₮5 a credit for 200–5,000; an admin saves the whole list, 1–12 packs, in the Prices tab and the student picks one on the plans page; one `CreditPack` row per pack, key `p<credits>`; simulated payment like the plans; `CreditOrder`,
    `CreditWallet`). They never lapse, are shown apart from the month's and plan's credits (a yellow chip in the rail meter, a yellow
    row on the plans page) and are the only credits that buy permanent vocabulary space. Receipts carry `yellow` (credits left); a reply
    without it keeps the page's figure.
  - A charge takes whatever lapses first (month or plan, by end date) and purchased credits last; `CreditCharge.parts` records the
    split, so a refund or a settle returns credits to where they came from (purchased first on a settle).
  - After this change deployed, plan credits already spent in the current month stay counted against that month's free credits,
    so students with a plan get their plan amount afresh once (a one-time gain in their favour).
- `chargeCredits` (`credits/service.ts`) wraps every DeepSeek call: after validation, access and provider-key checks it holds
  the cost (or, with `settle`, the most it can cost; never above the listed price) under a per-student row lock on
  `CreditWallet` (`SELECT … FOR UPDATE`), with a compare-and-set on each bucket's `used`, then runs the existing daily quota and
  provider call. A `settle` result lowers `CreditCharge.credits` to the final price and returns the difference while marking
  the charge SPENT; a failing settle keeps the hold. Any failure
  (402 not enough credits happens first; 429 busy/quota, provider errors, malformed output, too little file text, a timed
  sitting opening meanwhile) refunds the hold; credits are kept only when the student receives the result. `CreditCharge`
  records each action (HELD/SPENT/REFUNDED) with DeepSeek's reported prompt, cached and completion tokens and the list cost
  in micro-dollars, so real cost can be compared with credits charged. Daily request quotas stay as abuse limits.
- Every AI reply carries a `credits` receipt (spent, balance, allowance). `credits/client.tsx` keeps the balance in the
  Workspace shell, shows it in the rail ("AI кредит", linking to `/workspace/plans#credits`) and renders `CreditCost`
  badges beside each AI action with the remaining balance or a "хүрэлцэхгүй" warning. The meter's total is every available
  credit; its maximum is the month's and the plan terms' credits plus unspent purchased credits. The plans page shows each
  plan's credits and one "AI кредит нэмэх" row (`#credits`): the balance, the pack and an inline simulated purchase. The price
  list, rules and charge history were removed from it at the owner's request (2026-11-09); every AI button still shows its cost.
- Admin (2026-11-09): `/admin?tab=credits` shows a month's credits spent and refunded, the real DeepSeek list cost (failed calls
  included) against the credits' value, usage by action, the top students and every charge (search, status/action filters,
  CSV `kind=credits`); the overview has a one-line summary. On `/admin/users/[id]` the facts show this month's balance and an
  "AI кредит" view lists the student's charges (credit orders appear under payments and in the Payments tab's "AI кредит"
  list); "AI кредит олгох" adds 1–10,000 bonus credits to the current month only
  (`CreditPeriod.bonus`, audited `grant-credits`). The Prices tab edits the free and per-plan monthly amounts (0–100,000,
  `CreditAllowance`, audited `set-credits`); missing rows fall back to the code defaults, and charging, the plans page and the
  user record read the same table. The hold's compare-and-set runs as one SQL statement that includes the bonus.
- If the credit tables are missing (migration not applied), Workspace pages still render
  without the meter, but AI actions fail. Vercel applies migrations on deploy. Since 2026-11-09 `getDb()` (`src/lib/db.ts`)
  replaces a cached client whose generated models or columns differ, so a running dev server picks up `prisma generate`
  without a restart (before that, the admin Prices tab failed with `db.creditPack` undefined).

### AI usage log (2026-11-20)

- Every paid provider request is one `AiCall` row: provider, model, origin (`app` or `script`), source (the credit action
  such as `exam`, or `mock-grading`, `speaking-voice`, `script:build-language-decks.mjs`), environment (`local`, `preview`,
  `hosted`), student and credit charge, HTTP status, duration, tokens (prompt, cached, completion, reasoning) or units
  (Kokoro characters, Whisper milliseconds), and the cost in micro-USD with its basis (`provider`, `tokens` or `none`).
- Site code calls `aiFetch(provider, url, init, facts)` from `src/modules/ai-usage/server.ts`; the DeepInfra helpers take
  `aiFetcher(...)` and the Claude SDK path calls `recordAiCall`. `chargeCredits` runs the work inside
  `withAiContext({ userId, source: action, chargeId })`, and mock grading opens its own (`mock-grading`), so services pass
  nothing extra. Usage is read from a copy of the JSON answer; callers are unchanged. A failed insert never breaks the
  feature: the row goes to the server log and, locally, to `artifacts/ai-usage-unsaved.jsonl` (`npm run ai:usage -- flush`).
- Pricing (`src/modules/ai-usage/core.ts`): DeepSeek rates come from `credits/pricing.ts`, full price 01–04 and 06–10 UTC on
  weekdays and half otherwise (Chinese holidays are not listed, so they are priced as peak), with the v4-pro rates beside
  them. Claude Opus 5.5 is $4 / $20 per 1M (cache read $0.20, write $5); an unknown Claude model gets the dearest rate.
  DeepInfra uses its own `inference_status.cost` when given, else Whisper turbo $0.0002/min and Kokoro $0.99/1M characters.
  The model comes from the body (DeepSeek) or the URL path (DeepInfra, whose bodies name none). Only the provider's real
  host is billable, so the check runner's mock (127.0.0.1:8471) is recorded at $0. Failed calls cost $0; a timeout is
  shown as "cost unknown".
- Scripts use `aiFetch` from `scripts/lib/ai-call.mjs` (origin `script`, source `script:<file>`, agent from
  `AI_USAGE_AGENT`). It writes to the local database only (a non-localhost URL is refused) and falls back to the unsaved
  file. Python scripts use `ai_post_json` from `scripts/lib/ai_call.py`, which pipes each outcome to
  `node scripts/ai-usage.mjs record`. `AI_USAGE_LOG=off` turns recording off for unit tests that stub `fetch`.
- Balance check: `npm run ai:usage -- balance`, and the admin tab at most every 5 minutes, read DeepSeek's free
  `GET /user/balance` into `AiBalance`. For each pair of readings the tab compares the money that left the account with the
  DeepSeek cost recorded between them; a gap above $0.01 per segment is shown as unrecorded spend, and a rise is a top-up.
  Local and hosted share one key today, so each side counts the other's spend as unrecorded until they get separate keys.
- Admin `/admin?tab=ai` («AI зардал», Хяналт group): totals for 24 hours, 3, 7 or 30 days; site vs scripts; by source
  (each links to its calls), Ulaanbaatar day, top 10 students, provider and model; balance segments; environment and agent.
  «Дуудлагууд» lists calls with search (source, model, agent, email) and filters (site, script, failed, mock, provider).
- Guards in `tests/ai-usage.test.mjs`: pricing cases, and a scan that fails when a file in `src/`, `scripts/` or
  `MockExmps/` names a provider host and calls `fetch`/`urlopen` outside the recorders, when a Claude client is built
  without `recordAiCall`, or when a DeepInfra helper is called without `aiFetcher`.

### Image input (2026-11-09)

- The owner asked for image upload in the AI features once DeepSeek V4.1 Flash (build 1017) read images. `deepseek-flash`, the model every
  feature already calls, takes JPEG, PNG and WebP as `image_url` parts of a user message only (checked 2026-11-09 on DeepSeek's
  Vision guide; at most 1,024 input tokens per image). Shared rules: `src/modules/ai-images` (pure `contracts.ts`, browser `client.tsx`).
- Conversations: Workspace AI chat (and the home composer), the review coach, the practice assistant and the SAT math tutor (one shared
  drawer) accept up to three images on the student's latest message, by picker, paste or drop. Earlier turns stay text: the prompt asks
  the model to restate what it read, and only 128px previews are kept with the chat (on the account since 2026-11-13). An image-only
  message sends a readable default request. A photo never unlocks an answer: the practice "not checked" rules are unchanged.
- Study material: vocabulary import and exam-from-file accept one document or up to four page photos (4 MB together), sent as repeated
  `file` fields; `documents/upload.ts` proves every file by its signature before credits are held. Photos and documents cannot be mixed.
- The browser decodes each picture, resizes the longer side to 1,600px and re-encodes it as JPEG under 900 KB, which also drops camera
  metadata such as location. The server accepts only base64 data URLs whose declared type matches the bytes (no GIF, SVG or remote URLs),
  at most 3 MB decoded per message (body caps `CHAT_BODY_BYTES` / `ASSISTANT_BODY_BYTES`, under Vercel's 4.5 MB). Full images are never stored; only the chat's small previews are.
- Price: each image on a conversation adds `IMAGE_CREDITS` (2: 1,024 input tokens plus 600 output tokens for restating the picture,
  at the peak price; raised from 1 at the owner's request on 2026-11-09) to that reply, so chat is 5 → 7 with one photo; page photos
  replace document text, so imports and exams keep their listed maximum (vocabulary settles with 1,024 tokens per photo).
- One owner-approved live chat call (2026-11-09, synthetic worksheet photo) read the problem and the working, found the error and answered
  correctly in Mongolian; the whole request was 1,009 prompt tokens. Not verified: hosted behaviour and HEIC decoding outside Chromium.
