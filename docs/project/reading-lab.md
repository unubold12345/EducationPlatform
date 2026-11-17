# IELTS Reading Lab

Part of the [project guide](../PROJECT.md) (was PROJECT.md section 7). "Section N" in the text means that old numbering; the guide maps it to files.

### IELTS Reading Lab (2026-11-09)

- The owner asked for a Reading lab in the Workshop with five example practices and credit-paid practices made from the student's own
  files or text. `/labs/ielts-reading` is a Workshop tile, a home lab link and a sign-in return path; it shares the labs' pilot switch
  (`readingLabEnabled`) and is `noindex`. Module: `src/modules/reading-lab`.
- Samples (`samples.ts`): five original passages written for this site (urban heat islands, the takhi's return, sleep and memory, the
  spread of paper, bird navigation), ordered Band 5.5–6.5 to 7+, each six paragraphs of about 520–550 words with 12–13 questions across
  seven IELTS types (matching headings, matching information, matching features, True/False/Not Given, multiple choice, sentence and
  summary completion, including a word box). Every answer has a Mongolian explanation and, except NOT GIVEN, an exact quote from the
  passage; `tests/reading-lab.test.mjs` checks quotes, keys and word limits. Like the Listening Lab drills, they are open to guests and
  during a timed mock, use no AI, and are marked in the browser.
- Runner: IELTS-style split screen (lettered paragraphs in a sticky pane beside the questions; tabs on phones), an optional 20-minute
  timer that only warns, three text sizes, then a score card, the key, an explanation per question and highlighted, numbered evidence
  ("Текстээс харах" scrolls to it). Typed gaps forgive case, hyphens, articles and sentence punctuation; samples list spelling variants.
- Own practice: `POST /api/labs/ielts-reading` (same origin, verified session) takes pasted `text` (1,000–45,000 characters) or one
  document / up to four page photos (`readUploadedSource`, 4 MB), plus the explanation language (Mongolian or English) and, since
  2026-11-15, how many questions to write (`count`, 8–24 with a slider, default 12; a page that sends none gets 12; owner decision:
  24, was a fixed 12 with at most 14 kept). Credits (`reading-practice`, 4–17 by length; see "AI credits") are held before DeepSeek is called, settled to the practice delivered and
  refunded on any failure; the button shows the most the current material can cost ("хамгийн ихдээ N") and the practice shows what
  was spent; a
  15-per-Ulaanbaatar-day quota with one request in flight and the open-sitting rule (before and after the call) apply. The model writes
  an English passage of 450–900 words from the material only (translating non-English material), plus the chosen number of questions
  (fewer when the passage cannot support that many; at least 7 are required) in two or three of TRUE/FALSE/NOT GIVEN, four-option
  choice and two-word gaps. `parseGeneratedReading` keeps only gap answers copied from the
  passage and evidence found in it, groups questions by type, and refuses thin or single-type sets (one silent retry, started only within
  60 seconds).
- Retry (2026-11-15, owner request and decisions): "Шинэ асуулт" under the questions of the student's own practice writes new
  questions on the passage already saved with it, at half price (`reading-retry`; see "AI credits"), and replaces the old ones in
  place; the passage, title and source stay and the answers, results and attempt count are cleared. No schema change was needed:
  the passage is on the row. `POST …/practices/[id]/regenerate` (same origin, verified session, body exactly `{}`) asks for as
  many questions as the practice has (8–24), in its language; the reply has no passage, is read against the stored paragraphs
  with the same rules (gap answers and evidence must be in the passage; one question type or fewer than 70% usable is refused,
  with one silent retry), prompts that repeat a replaced question are dropped, and the new ids are ones the old set did not use,
  so answers from a page still showing the old questions are refused (400) rather than marked. The page prices the button with
  the same function the server holds (`readingRetryPrice`). It shares the 15-a-day quota and the open-sitting rule with a new
  practice; "Дахин оролдох" (the same questions again) stays free. Samples have no retry.
- Storage (2026-11-13; `ReadingPractice`, `ReadingSampleState`, migration `20261112200100_reading_lab_storage`): a generated practice
  is saved on the account with its key (`questions`); the browser gets only the passage and answer-free questions. The account holds
  20 practices; a full library is refused with 409 before credits are held, and counted again just before the row is written.
  Since 2026-11-17 the plan sets how many a student keeps (`readingPractices` in `subscriptions/plans.ts`, `practiceCapacity`
  in `state.ts`): free, ЭЕШ and Гадаад хэл Basic 5, Pro (and retired IELTS/SAT) 15; 20 stays the account ceiling for practices
  moved from a browser. Practices already saved above the plan's size are kept; only new ones are refused, with an upgrade hint
  (`practicesFullMessage`). The page gets the size from `readingLibrary(...).limit`; the mobile app still compares against 20.
  `POST …/grade` marks from the stored key by id; `PATCH …/practices/[id]` saves answers and the timer (0.6 s after a change, retried,
  sent on leaving) or clears for a retry; `DELETE` removes one; `PATCH …/samples/[id]` saves, checks (marked on the server) or clears a
  sample. Every request carries the number of checks the page has seen, so a stale tab gets 409 and a repeated check counts once.
  Guests keep sample progress in the browser's "guest" slot; the text size is a device setting (`education-reading-lab-text-v1`).
- Practices made before the move carry a sealed AES-256-GCM token (`reading-lab/token.ts`, bound to the student). On a signed-in
  visit the browser sends them once to `POST …/import`: only the token is believed (expired tokens accepted, owner required, keyed by
  its SHA-256 so it moves once), the paragraphs must match it, checked answers are marked again from the key and no browser score is
  kept; sample states move too. Moved items leave the browser. A page loaded before the move gets 409 "reload". No new tokens are made.
- PDF (2026-11-16, owner request and decisions): the runner's toolbar has a "PDF" button (icon only on phones) that prints the
  practice through the shared print sheet (`ReadingPdf`; see "Exams from a file"): the passage with lettered paragraphs, the
  questions with blanks and tick boxes, and a last page with the answers and explanations only while the answers are checked
  (after "Дахин оролдох" the page no longer holds the key, so it prints without one). Samples have the button too. There is no
  browser suite for this lab; it was checked by hand-run Playwright on a sample at 1280 and 390 px.
- From a topic (2026-11-17, owner request): a third tab "Сэдвээр (AI)" sends `topic` (at most 500 characters) instead of `file`
  or `text`; any two together get 400. An empty topic gets a random IELTS-style subject from `READING_TOPIC_IDEAS`.
  `readingMessages({ topic })` asks for an ORIGINAL 600–900 word, 5–7 paragraph Academic passage from widely accepted knowledge,
  with no invented statistics, studies, quotations or named researchers; the question rules are unchanged. Saved as
  `sourceKind "topic"`, `sourceName "Сэдэв: …"`; retries work as for any practice (they reuse the saved passage). Hold
  `readingPracticeHold(topic length, 0, count)` = 2 a question. Live DeepSeek run: 786 words, 7 paragraphs, 12 questions.
