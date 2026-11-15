# Practice mode, timed sitting tools and the SAT math tutor

Part of the [project guide](../PROJECT.md) (was PROJECT.md section 7). "Section N" in the text means that old numbering; the guide maps it to files.

### Practice mode and its assistant

- `/exams/<slug>/practice` opens any of the 167 mocks without a clock. Access is the same as the timed
  exam (matching plan or per-exam purchase), checked on every read, save, check, audio and AI request. The owner asked for this
  on 2026-11-06.
- SAT practice covers all 147 authored items, both Module 2 routes included. IELTS has replayable audio, the part's transcript
  after a check, both Writing tasks and all Speaking prompts (with the AI examiner where the Speaking Lab is enabled; section 7,
  "AI examiner in the IELTS mocks"); recordings are not stored here. ЭЕШ Mathematics and Physics
  have Mongolian prompts, the scratchpad and the imported paper's section structure; ЭЕШ English shows its conversation,
  word bank or reading passage beside the question and keeps the printed Part II choices.
- One `PracticeSession` per student and exam (`responses`, `flags`, `results`), created on the first save. It is not an attempt:
  it never appears in exam history, reports or admin scores. **Дахин эхлэх** deletes only that row.
- Answers, explanations, keys and transcripts stay on the server (`exam-practice/form.ts`) until the student checks that question.
  The first check is recorded and the answer locks until the student retries it. Writing and speaking stay editable.
- While the student has an open timed sitting, on any exam, practice pages, answers, audio and AI are all refused
  (`exams/active-sitting.ts`, also used by the tutor). Sittings whose deadline passed while closed are settled first and do not block.
- Assistant: `POST /api/exam-practice/<slug>/assistant`, 60 requests per student per Ulaanbaatar day with one in flight, sharing the
  tutor's provider code. The page sends only the question id and the student's words; the server adds the question, the saved
  answer and, only after a check, the key, explanation and transcript. Before a check the prompt forbids stating or confirming the answer.
- Limits: ЭЕШ answers and explanations are this site's own, not an official key, and the prompt says so; for Mathematics the
  model works without a calculator, for Physics it keeps units and g = 10 m/s², and it must say when it disagrees. It gives no IELTS bands.

### Timed sitting tools

SAT and IELTS keep the always-visible question strip, keyboard shortcuts (arrows, A–E or 1–5, F), option elimination,
passage text size and time notices. The ЭЕШ workspace is intentionally leaner: a stacked header with timer and
answer-sheet count, a slide-over sheet grouped by printed section, keyboard next/previous and A–E, a flag per item,
and a shared task page for constructed or Part II tasks. The booklet, bubble sheet and separate answer-sheet buttons
of the retired Mathematics design are gone. Polls and saves send `?have=<stageId>` so the server omits stage text the
page already holds. Results add per-skill totals, review filters and a link to practice.

### DeepSeek mathematics tutor

- Fixed endpoint `https://api.deepseek.com/chat/completions`; server-side `DEEPSEEK_API_KEY`.
- Available for completed SAT Math mock review, in Mongolian or English.
- Supports next-step hints, worked explanations, typed working, mistake review and one ungraded
  similar follow-up question.
- Each question has an **AI туслах** button. Clicking it slides a chat drawer in from the right
  (portalled to `<body>`, closes on ×, backdrop or Escape). Nothing renders or is sent on page load
  or on opening; a request is sent only when the student presses a suggestion chip or sends a message,
  and the composer states that the problem and the student's answer go to DeepSeek. The former
  consent checkbox and fine-print notes were removed at the owner's request (2026-10-29).
- Prompts contain only the relevant problem, options, selected answer, authorized reference
  explanation and at most four bounded prior turns. No account identity, cookies, scratchpad or full
  history is sent.
- 30 attempts per student per Ulaanbaatar day, a 90-second reservation lease, a 60-second provider
  timeout and a 3-second cooldown. Failed provider attempts count.
- Requests are denied while the same user has an active mock sitting. Timers,
  grading, answers and immutable results are untouched.
- Conversations are temporary page state and are not saved to the account. Answers are learning
  feedback, never official grading. ЭЕШ and IELTS mocks are outside this tutor; practice mode's assistant covers them.
