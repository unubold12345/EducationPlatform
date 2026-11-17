# TOEFL iBT mocks on the site: build plan

Date: 2026-11-18
Status: plan only, nothing built. Written by Claude Code (Opus 5.5) after reading the code listed below.
Scope: put the nine offline forms in `MockExmps/TOEFL` (2026 format, with recordings) on the site as timed mocks with
practice mode, results, access and audio. One agent can build it from this file, in the order of section 5.

## 1. What ships

- `/exams/toefl` hub with nine mocks `toefl-01` … `toefl-09`, a TOEFL row on `/exams`, a briefing page per mock.
- A timed sitting in the 2026 order: Reading Module 1 → routed Module 2 (Lower or Upper) → Listening Module 1 →
  routed Module 2 → Writing (Build a Sentence, email, academic discussion) → Speaking (Listen and Repeat, interview).
  About 85 minutes on the Lower routes, 89 on the Upper routes.
- Server-authoritative timers and routing, audio that plays once on a server clock, per-item speaking recordings.
- Results with raw Reading /50 and Listening /47 (and the module taken), Build a Sentence /10, writing and speaking
  stored for review with the pack's model answers. No band score (ETS publishes no raw-to-band table).
- Practice mode (both second modules, replayable clips, transcript after a check) and the practice assistant.
- Access: ₮10,000 per mock for 7 days, or the Гадаад хэл Basic / Pro plan. No schema change, no migration.

Not in this plan (section 7): AI scoring of writing and speaking, a free half-length TOEFL mock, the mobile app,
a homepage tile, early finish of a section.

## 2. Owner decisions (the build uses the default unless the owner says otherwise)

| # | Question | Default |
| --- | --- | --- |
| D1 | Release before a teacher's review? | Yes, as unreviewed practice like every other mock; but first listen to the 23 `word` rows in `MockExmps/TOEFL/AUDIO.md` ("Machine check") and fix any real fault in the pack. |
| D2 | Which plans open TOEFL? | Гадаад хэл Basic and Pro (they open "every mock that is not ЭЕШ"); ₮10,000 / 7 days per mock otherwise. |
| D3 | Listening pace | Server clock: each clip plays once, then a fixed answer window (20 s after a Choose a Response prompt, 25 s per question after a set), exactly the pack's ADMINISTRATION timing. The alternative, self-paced listening (student presses Next), needs per-clip start times in the attempt state; not recommended. |
| D4 | Module 2 length | Its own length per route (Lower about 8 min, Upper about 10.5 min) through a new optional `variantSeconds`. Alternative: pad Lower to Upper's length with checking time (no engine change; Lower takers wait 2.5 min). |
| D5 | Finish a section early | No, the same as SAT ("Эрт дуусгах боломжгүй"). |
| D6 | Writing and speaking scores | None in v1: stored, shown with model answers, "pending review". AI scoring is a later task (section 7) that needs credit prices. |
| D7 | Layout of the new screens | The owner picks from 2–3 wireframes per screen before UI code: Complete the Words, Build a Sentence, a listening item, a speaking item, the hub. Sans-serif, one accent colour (`--blue`). |
| D8 | Where TOEFL appears | `/exams` row and `/exams/toefl` hub, Workspace home tile. Homepage tile later. |
| D9 | Repository visibility | The forms' keys go into `assets/toefl/` like every other mock; open item 1 (make the repository private) still applies. |

## 3. What exists (read before building)

- Engine: `src/modules/exams/engine.ts` (stages chain on deadlines; `variants: {lower, higher}` routed at a fixed
  65 % in `expireStages`; `validateExamEdit` checks only the current stage; `makeReport` names sections per program).
  Types in `types.ts`. Service `service.ts` (`publicMock` copies an explicit list of question fields to the client).
- Program pattern to copy: HSK (`src/modules/exams/hsk/`: `catalog.json` + `catalog.ts`, `content.ts` lazy loader of
  `assets/hsk/<slug>.json`, `briefing.tsx`, `section.tsx`, `view.tsx`, `results.tsx`, `practice-audio.tsx`, `hsk.css`;
  builder `scripts/build-hsk-mocks.mjs`; hub `src/app/exams/hsk/page.tsx`; tests `tests/hsk.test.mjs`, `tests/hsk_smoke.py`).
- Registration: `definitions.ts` (`findExam`, `allExamSlugs`), `src/app/exams/[slug]/page.tsx` (briefing per program),
  `runner.tsx` (section and results per program), `start-client.tsx` (headphone/microphone check per program).
- Audio: one folder, one reader and one route segment per recording set (Vercel 250 MB per function):
  `audio-files.ts`, `audio-handlers.ts`, `audio-response-*.ts`, routes under `src/app/api/mock-attempts/[id]/audio/*`
  and `src/app/api/exam-practice/[slug]/audio/*`, tracing in `next.config.ts`. Range responses: `audio-range.ts`.
- Speaking recordings: `MockRecording` (one per attempt and stage id), upload `PUT /api/mock-attempts/<id>/recordings/<stageId>`
  (speaking stages only; start computed from `createdAt` + earlier stages' seconds; 2-minute upload grace; 8 MB).
  Recorder `speaking-recorder.tsx` records from mount to stage end.
- Access: `subscriptions/plans.ts` (`exams` list per plan), `subscriptions/mock-access.ts`, `exams/payments.ts`
  (generic by slug), `src/app/checkout/[slug]/page.tsx` (label per program).
- Practice: `src/modules/exam-practice/form.ts` (program branches), `types.ts` (`PracticeSubject`), `workspace.tsx`.
- Other program lists: `workspace/programs.ts` (`Record<ExamProgram,…>`, compile error until filled),
  `src/app/workspace/review/page.tsx`, `src/app/workspace/page.tsx`, `workspace/chat-contract.ts` (`CHAT_SUBJECTS`),
  `workspace/review.tsx` (score note), `admin/service.ts` (content list), `src/app/exams/page.tsx`.
- Content editing: `content/validation.ts` (`immutable` field set), `content/fix.ts` (handles `variants`).
- Pack: `MockExmps/TOEFL/mock-NN/mock.json`, `mock-NN/audio/*.mp3` + `audio-manifest.json` (durations, SHA-256,
  revision, per-module timing), `ADMINISTRATION.md` (pauses, routing 21/35 and 20/32), `AUDIO.md`.
- Rules: `AGENTS.md`, `docs/OPERATIONS.md` (checks table), `node_modules/next/dist/docs/` before any route or page code.

## 4. Design

### 4.1 Identity

- Program `toefl` (add to `ExamProgram`). Slugs `toefl-01` … `toefl-09`. Workspace prefix `toefl-`, label `TOEFL`.
- Question ids, unique across forms (practice results and hub progress count by prefix):
  Reading `toefl01-r1-01…35`, `toefl01-r2l-36…50`, `toefl01-r2u-36…50`; Listening `toefl01-l1-01…32`,
  `toefl01-l2l-33…47`, `toefl01-l2u-33…47`; Writing `toefl01-w-01…12`; Speaking `toefl01-s-01…11`.
  `number` carries the printed number. Domains: `Reading`, `Listening`, `Writing`, `Speaking`.
- `upper` in the pack maps to the engine's `higher`.

### 4.2 Stages (20 per form)

| Stage id | Kind | Seconds | Content |
| --- | --- | --- | --- |
| `toefl-r1` | questions | 1200 | Complete the Words ×2 (10 gaps each), Read in Daily Life ×4, Academic Passage ×1: 35 items |
| `toefl-r2` | questions, `variants`, `routeAt: 21` | 540 | Lower or Upper, 15 items |
| `toefl-l1` | listening | timeline total (1148–1212) | 12 Choose a Response, 4 conversations, 2 announcements, 2 talks: 32 items |
| `toefl-l2` | listening, `variants`, `routeAt: 20`, `variantSeconds` | about 480 / 620 | Lower or Upper, 15 items |
| `toefl-w-build` | questions | 360 | Build a Sentence, 10 items |
| `toefl-w-email` | writing | 420 | Write an Email |
| `toefl-w-discussion` | writing | 600 | Academic Discussion (minWords 100, as the pack prints) |
| `toefl-s-repeat-intro` | preparation | scenario clip + 3 | scenario text, picture description, narrator clip |
| `toefl-s-repeat-1…7` | speaking | clip + 2 slack + 1 beep + 8/8/10/10/10/12/12 | one sentence each, recorded |
| `toefl-s-interview-intro` | preparation | scenario clip + 3 | scenario, narrator clip |
| `toefl-s-interview-1…4` | speaking | clip + 2 slack + 45 | one question each, recorded |

The builder computes every listening and speaking length from the MP3 durations; it never hard-codes them.
Routing thresholds come from `mock.json` `routing` (Reading 21 of 35, Listening 20 of 32).

### 4.3 Item mapping (pack → `ExamQuestion`)

| Pack item | Question | Grading | Display data (answer-free) |
| --- | --- | --- | --- |
| Complete the Words gap (`text` "pla[nts]") | `short`, `matcher: "text"`, `answers: ["nts"]`, `answerDisplay: "plants"` | exact letters, case-insensitive | `question.toefl.gap = {prefix: "pla", missing: 3}`; group `toefl.segments` = paragraph text with `{q: id}` at each gap |
| Read in Daily Life question | `choice`, `answers: [option text]` | existing | group `toefl = {layout: "daily", format, heading, text}`, `pageMode: "group"` |
| Academic question | `choice` | existing | group `toefl = {layout: "academic", title, paragraphs}` (numbered), `pageMode: "group"` |
| Choose a Response | `choice`; `prompt` = "Choose the best response."; spoken line in `listening.script` | existing | group `kind: "listening"`, `toefl = {layout: "response", clip}` |
| Conversation / announcement / talk question | `choice`; `listening.script` = the whole script ("Woman: …") on each question | existing | group `toefl = {layout: "set", setting, clip}` (the printed intro line) |
| Build a Sentence | `short`, `matcher: "text"`, `answers: [used chips in order, joined by one space]`, `answerDisplay` = full sentence | exact, case-insensitive, end punctuation ignored | `question.toefl.build = {context, prefix, chips (pack `display` order), slots, end}` |
| Email, discussion | `essay` | pending | group `toefl = {layout: "email", scenario, to, subject, bullets}` / `{layout: "discussion", course, professor, students}` |
| Listen and Repeat, interview | `speaking`, `answers: []` | pending | `question.toefl.clip`; `explanation` = target sentence / model answer |

Explanations: the pack's `why`; Build a Sentence: the grammar focus and the full sentence; writing: the model
response. The response for a choice is the option text (as now). Answers, `listening`, `answerDisplay`, `why` and
models stay server-side until a result or a practice check.

Builder assertions (fail the build): 10 gaps per Complete the Words parse and equal the pack's `answers`; every
Build key, joined with `prefix` and `end`, reproduces the pack's `answer` and uses each chip at most once; every
choice key is one of its options; counts 35/15/15, 32/15/15, 10+2, 7+4; ids unique; no key, script or model text in
the client catalogue, the timeline or any `toefl` display field.

### 4.4 Engine additions (opt-in; SAT, IELTS, JLPT, HSK and ЭЕШ behave exactly as now)

1. `ExamStage.routeAt?: number`: correct non-pretest answers in the previous stage needed for `higher`.
   `expireStages` uses it instead of 65 % when present.
2. `ExamStage.variantSeconds?: {lower: number; higher: number}`: the deadline after routing uses the route's length.
   Add `stageSeconds(state, index)` and use it in `expireStages`, in `publicMock`'s `timeline`, and in the recordings
   upload route (which today adds up `stages[].seconds`; it must add up the route-aware lengths).
3. `ExamQuestion.window?: {start: number; end: number}` (seconds from stage start). `validateExamEdit(state, input, now)`
   rejects a changed value for a question outside `[start, end + 5]`; an unchanged value is always accepted, so a
   full-stage save after a window closed still works. `service.ts` passes `now`; `publicMock` passes `window`.
4. `makeReport`: section names for `toefl` = Reading, Listening, Writing, Speaking (by `domain`).
5. Types `ToeflItem` (`gap`, `build`, `clip`) on `ExamQuestion.toefl` and `ToeflGroup` (`layout` plus the fields of
   4.3) on `ExamGroup.toefl`, beside the HSK ones. `publicMock` and the practice form copy question `toefl` and pass
   groups unchanged, so group `toefl` must never hold answers or scripts (the builder test checks this).

### 4.5 Audio

- Files: copy the pack's MP3s unchanged (64 kbps, 24 kHz mono, about 65 MB for nine forms) to
  `assets/toefl-audio/toefl-NN-<recording id>.mp3`; no second lossy encode, so hashes match the pack's
  `audio-manifest.json`. `assets/toefl-audio/manifest.json` keeps file, SHA-256, seconds, pack revision and source hash.
- Timeline (client-safe, `src/modules/exams/toefl/timeline.json`, written by the builder): per slug and module
  (`l1`, `l2-lower`, `l2-higher`) a list of `{clip, start, seconds, windowEnd, questions: [ids]}`; per speaking stage
  its clip and length. A module's length = last `windowEnd`. Question `window`s in the definitions come from it.
- Route: `/api/mock-attempts/<id>/audio/toefl?clip=<recording id>` and `/api/exam-practice/<slug>/audio/toefl?clip=…`,
  reader `audio-response-toefl.ts`, handlers in `toefl/audio.ts` (not the shared part-based `audio-handlers.ts`);
  `AudioSet` gains `toefl`; tracing in `next.config.ts` for both route patterns (`./assets/toefl-audio/*.mp3`).
- Clip ids are checked against the allowlist for that slug (no user input reaches a path).
- During a sitting only the clip playing now is served: on a listening stage, the clip whose
  `[start − 1, start + seconds + 5]` contains the elapsed stage time, on the route the attempt took; on a speaking or
  intro stage, that stage's clip in its first `seconds + 5`. After the attempt finishes, any clip of that form (review).
  Practice: any clip after `authorizePracticeAudio`. Same access and active-sitting rules as the other sets.
- Audio revision: definitions carry `audioRevision: 1`. A later fix to a clip adds files with an `-r2` suffix and a
  `timeline-v2.json`; attempts keep the revision in their snapshot (the JLPT pattern). Never overwrite released files.

### 4.6 Screens (layouts chosen by the owner, D7)

- Hub `/exams/toefl`: nine cards (number, theme, 50 / 47 / 12 / 11 items, about 88 min, access label, practice
  progress, open attempt), like `src/app/exams/hsk/page.tsx`.
- Briefing (`toefl/briefing.tsx`): format and times, routing in one sentence, headphones and microphone needed,
  raw scores only, "not ETS material; TOEFL and TOEFL iBT are registered trademarks of ETS", access gate.
- Start: headphone check and microphone check (as IELTS) in `start-client.tsx`.
- Session (`toefl/section.tsx`, chosen in `runner.tsx`):
  - Reading: passage pane plus questions; Complete the Words as one paragraph with letter boxes after each prefix
    (one box per missing letter, keyboard moves between boxes, response = typed letters).
  - Listening: one item at a time on the clock. During a clip: the set's printed intro ("Listen to a conversation
    between…") and "Listen". When the clip ends: its question(s) and the window countdown. When the window ends the
    item locks and the next clip starts. Refresh resumes at the elapsed position. No pause, replay or going back.
  - Build a Sentence: the other speaker's line, `prefix`, `slots` empty boxes, chips to tap into boxes (tap a filled
    box to return its chip); response = chips in box order joined by spaces. Keyboard operable.
  - Email and discussion: the existing essay editor with the task panel and a word count.
  - Speaking: intro stage shows the scenario (and the picture description) while the narrator clip plays. Each item:
    clip plays, beep (Web Audio), recording until 0.5 s before the deadline, upload with the existing
    `uploadRecording`. A new `startAt` option on the recorder (or a TOEFL recorder) starts after the clip.
- Results (`toefl/results.tsx`): Reading x/50 and Listening x/47 with "Module 2: Upper/Lower", Build x/10, writing
  and speaking "pending review" with the student's text, their recordings (existing GET route) and the model
  answers; review list with transcripts. A Lower route note: "Lower module: practice at B1 or below" (pack README).
- Practice (`exam-practice`): a `toefl` branch in `form.ts` (sections per module and route, `toefl` display data,
  transcript = the question's script after a check) and TOEFL views in `workspace.tsx` (clip player with replay;
  speaking shows the target sentence or model answer after "check").

## 5. Build order

Each phase ends green before the next. Claim the work in `docs/ACTIVE_WORK.md` first; the decks agent holds
`build + 3001` and `prisma/schema.prisma`, the mobile agent holds `src/app/api/mobile/**`, `src/lib/auth.ts`,
`src/lib/api.ts`. This plan touches none of those files and needs no migration.

**Phase 0. Preconditions.** Owner answers D1–D9 (or accepts the defaults); the 23 `word` recordings are heard and
any fix is made in the pack (`generate_audio.py --forms N --items …`, then `validate_audio.py` and `build.py`).
Read `node_modules/next/dist/docs/` on route handlers and dynamic segments.

**Phase 1. Builder.** `scripts/build-toefl-mocks.mjs` reads `MockExmps/TOEFL/mock-NN/mock.json` and the audio
manifests and writes `assets/toefl/toefl-NN.json` (definitions with keys and scripts), `assets/toefl-audio/*`,
`src/modules/exams/toefl/catalog.json` (slug, number, title, theme, item counts, minutes) and `timeline.json`, with
the assertions of 4.3. `src/modules/exams/toefl/catalog.ts` and `content.ts` (lazy loader, as HSK).
Add `./assets/toefl/*.json` to the `/*` tracing list. Done: `node scripts/build-toefl-mocks.mjs` passes its
assertions twice with identical output; `tests/toefl.test.mjs` covers the build output.

**Phase 2. Engine.** 4.4 items 1–5 in `types.ts`, `engine.ts`, `service.ts` and the recordings route. Tests in
`tests/toefl.test.mjs` (routing at 20 and 21, `variantSeconds` deadlines, windows: inside accepted, after grace
refused, unchanged resend accepted; full key = full raw marks, empty = 0) and a regression case in
`tests/exams.test.mjs` (SAT still routes at 65 %, deadlines unchanged).

**Phase 3. Registration and access.** `ExamProgram`; `findExam` / `allExamSlugs`; `plans.ts` `exams` and feature
text for Basic and Pro ("SAT, IELTS, TOEFL, JLPT, HSK"); `workspace/programs.ts`; review page lists;
`CHAT_SUBJECTS` and `PracticeSubject` (`toefl`); checkout label; `admin/service.ts` content list; `content/validation.ts`
(make `toefl` immutable, like `pictures`); `/exams` row and Workspace home tile (`src/app/workspace/page.tsx`);
`/exams/[slug]` routes `toefl` to its briefing; `workspace/review.tsx` score note ("raw Reading and Listening; no band").

**Phase 4. Audio.** 4.5: reader, handlers, two route files, `AudioSet`, tracing. Tests: allowlist, "playing now"
rule on both routes, finished attempt gets any clip, refusal during another open sitting.

**Phase 5. Screens.** Wireframes to the owner (D7), then 4.6: hub, briefing, start checks, session section,
results, practice views, `toefl.css`. Mongolian UI text, English exam content.

**Phase 6. Checks.** Add group `toefl: ["toefl"]` to `scripts/check.mjs` and `tests/toefl_smoke.py` (copy the
`hsk_smoke.py` pattern: hub, briefing, purchase and plan access, a full sitting through both routes with the
fixture clock, listening lock after a window, a speaking upload, results, practice check and transcript, 390 px
and 320 px widths). `tests/mock_fixture.mjs` only moves a stage to its deadline; add an `elapsed <attempt> <seconds>`
action (sets `stageStartedAt` and `deadline` so the stage has run that long) so the suite can answer each listening
item inside its window, and keep the fixture limited to disposable `qa-exam-*` rows. Run `npm run check`, `npm run check -- toefl practice billing`, then `npm run check:all`
(engine and exam lifecycle changed; the runner uses 3007 and the single local database, so agree a slot with the
other agents). After an authorized build, check `.next/server/app/api/**/audio/toefl/route.js.nft.json` stays well
under 250 MB.

**Phase 7. Docs.** `docs/project/assessments.md` (replace "TOEFL iBT, offline pack only" with the site section),
`PROJECT.md` product row and the ETS non-affiliation line, `pricing-access.md` table, `OPERATIONS.md` entry and open
item 8, `MockExmps/TOEFL/README.md` ("not on the site" lines). No commit or deploy without the owner's word.

## 6. Risks

| Risk | Mitigation |
| --- | --- |
| A shared engine change alters other mocks | All additions optional; regression tests for SAT routing and deadlines; `check:all` |
| Window rule rejects a late autosave | 5 s grace, unchanged values accepted, the page saves when a window closes |
| Speaking window shortened by slow clip loading | 2 s slack per stage; recording starts at the clip's end or its scheduled time, whichever first |
| Keys or scripts reach the client | `publicMock` field list, builder test that greps catalogue, timeline and display fields for answers and scripts |
| Audio bundle too large | own folder and route (about 65 MB); size check after build |
| 11 speaking recordings per sitting in Postgres | about 2 MB per sitting (250 s at 64 kbps), below IELTS's 12-minute stage recordings |
| Synthetic voices, no Australian accent, no teacher review | stated on the briefing; D1 listening first |

## 7. Later tasks (each its own decision)

- AI scoring: email and discussion on the 0–5 descriptors in `answers.md` through `chargeCredits` (DeepSeek, new
  credit action and price); speaking through the hosted speech provider's transcription, then the same rubric.
- A free half-length TOEFL mock in `MockExmps/Free` and `free/catalog.json`.
- Mobile app support (the mobile agent's routes and contracts list programs explicitly).
- Homepage and Workshop tiles; early finish of a section; a TOEFL Listening Lab.
