# IELTS Speaking Lab, the mock AI examiner and Essay Studio

Part of the [project guide](../PROJECT.md) (was PROJECT.md section 7). "Section N" in the text means that old numbering; the guide maps it to files.

### IELTS Speaking Lab

`/labs/ielts-speaking` is an experimental, `noindex` studio. The homepage and IELTS program show a
Speaking invitation only when the studio is enabled: local pilot, or hosted pilot with
`SPEAKING_LAB_ENABLED=true`. Sign-in and registration preserve the return path to the studio.
The studio stays separate from graded practice and exams (its examiner also runs inside the IELTS mocks; see the end of
this section). It requires login and explicit transcript/microphone
consent, uses DeepSeek for text conversation, Kokoro for local British English speech, Whisper for
transcription. Since 2026-11-12 the partner is shown as sound, not a face: a live voice wave on stage (`avatar.tsx`, a canvas) and
a small bar mark per partner in its own colour and pattern (`partner.tsx`; no image files or third-party artwork). It writes no attempts, scores,
subscriptions or chat history. Bands shown are transcript-only AI estimates, not official IELTS
scores; pronunciation is not assessed. Raw microphone recordings are not persisted.
- Two modes, sent to the server as `mode` with the chosen partner as `voice` (both validated against fixed lists).
  **Full mock test**: the partner is an AI examiner using standard IELTS framing, neutral and without praise, under exam
  conditions; the screen shows no tips, ideas or retries, and every correction arrives in the report's conversation review.
  **Practise one part**: a named conversational partner with its own manner (`speakingVoices[..].manner`) that reacts to what
  was said, with live tips, ideas and retries. Both prompts keep the AI/not-an-examiner disclosure and forbid an invented human life.
- Human touches are browser-side: after the first reply the page pre-loads three or four acknowledgement clips ("Okay.",
  "Thank you.") through the normal voice route and plays one the instant a spoken answer ends; the partner nods on pauses;
  the wave carries loudness from the centre outwards: the partner's colour while it speaks, green from the student's microphone
  while listening, a ripple while thinking, a row of dots when quiet, and a small pulse for the nod after an answer. A short
  request to repeat or explain (`isClarificationRequest`) is answered but does not count as a mock question, and keeps the cue card.
- The server drops a tip unless it quotes the answer it is attached to (`tipQuotesAnswer`); the model otherwise re-corrects earlier
  answers. Every answer sent to the model ends with a JSON-format cue, because a bare one-word answer returned an empty reply.

#### Hosted speech provider (2026-11-12)

Running Kokoro and Whisper inside the web server does not scale: each instance loads about 460 MB of models and
`serialized()` lets one sentence or one answer through at a time, so students queue behind each other. With the server-only
`DEEPINFRA_API_KEY` set, `speech-provider.ts` sends the work to DeepInfra instead: `hexgrad/Kokoro-82M` (the same six voice
ids, returned as MP3) and `openai/whisper-large-v3-turbo` (English fixed). Nothing else moves: the Lab, mock and practice
routes, their access checks before and after, the daily voice/transcription counts, the frame format and the device-voice
and typing fallbacks are unchanged, and there is no queue on this path. A provider failure is retried once, then becomes the
same 503 the page already handles. Without the key the local models serve as before (local development needs no key).
The student's audio leaves this server only for transcription, with no account data attached; the microphone notices say so.
Listed prices on 2026-11-12 (check before budgeting): about $0.99 per million characters and $0.0002 per audio minute, under
one US cent for a full mock; the daily limits cap a student at roughly $0.12 a day. Called live once from a script on
2026-11-12 (six distinct voices, 1.3–2.0 s a sentence, correct transcripts) and through the Lab's routes in a browser (ten voice requests at once in 3.2 s).

#### AI examiner in the IELTS mocks (2026-11-11)

The owner asked for the Speaking Lab inside the IELTS mock exams. In the four Speaking stages of all twelve mocks the Lab's
examiner (the same avatars, Kokoro voice, microphone loop and Whisper transcription) can conduct the test. George is the
default; since 2026-11-11 the student picks any of the six partners (start page, invitation, practice offer, or "Шалгагч солих"
in the stage). The choice lives in the browser (`education-mock-examiner-voice-v1`) and is sent as `voice` with each speech
request, validated against the fixed list; only the greeting names the examiner, and the words still come from the script.
- **Scripted, no language model during a sitting.** The examiner reads the mock's own authored questions from the attempt
  snapshot with standard framing ("Let's talk about …" per Part 1 topic in Mocks 07–12, the cue card on screen, the
  rounding-off questions, the Part 3 link), repeats a question on request (`isClarificationRequest` or the Repeat button),
  asks one fixed follow-up ("Why is that?") after a short answer and says "Thank you" as an answer ends. The rule that no AI
  answers while a timed sitting is open is unchanged: the Lab's own routes still return 403 during a mock.
- **Server checks** (`exams/speaking-examiner-service.ts`, routes under `/api/mock-attempts/<id>/speaking/`): `voice` and
  `transcribe` need the Lab switch, same origin, a verified session, the student's own IELTS attempt with access, and the
  server clock inside a Speaking stage (deadlines are applied to a copy first, so an ended stage is refused). The page never
  sends text to speak: it names script lines by key (`intro`, `q:<id>`, `follow:<n>`, …) and the server resolves them against
  the current stage. `warm` loads the speech models from the Writing stage on. The Lab's daily voice and transcription
  counts are shared.
- **Clock and answers.** Stages, deadlines and saving are the runner's. Each transcript is saved through the normal autosave
  as that question's response, prefixed `[Transcript] ` so it is told apart from typed notes; a follow-up answer goes on a new
  line. Recording stops seven seconds before a deadline so the transcript can still be saved, a new question is not started
  in a stage's last seconds, and after a reload the script resumes at the first unanswered question. The stored whole-stage
  recording is unchanged. Speaking stays "pending human review" in the mock's report; no band is stored.
- **Choice.** The IELTS start page has a third check, on by default ("Speaking-ийг AI шалгагчтай өгөх"); the choice lives in
  this browser per mock (`education-mock-examiner-v1:<slug>`). With no choice (an attempt opened elsewhere) the Speaking stage
  shows an invitation above the unchanged prompt view. The student can switch either way at any time. If the natural voice
  is slow or missing, the line is read by the device voice and shown on screen; if the microphone fails, the panel says so.
- **Report after the mock.** The results page offers the Lab's report for the examiner's transcripts
  (`POST …/speaking/report`, 9 credits as `speaking-report`, through the Lab's one provider call). It is the only DeepSeek
  call of the feature, is refused before the mock has finished and while any sitting is open, rebuilds the conversation from
  the submitted snapshot (the page sends only the feedback language, target band and measured timing) and returns transcript-only
  band estimates, fixes, vocabulary and a model answer. The report and the timing are kept in this browser
  (`education-mock-speaking-v1:<attemptId>`); asking again, or on another device, costs credits again.
- **Practice mode.** The IELTS Speaking sections of `/exams/<slug>/practice` offer the same examiner ("AI шалгагчтай эхлэх";
  opened by a click, off by default). There is no clock: the Part 2 preparation minute is given inside the section and
  can be ended early, its notes stay in this browser, a finished part can be done again (its saved answers are cleared),
  and no audio is stored. Transcripts are saved as the section's practice responses, so the practice assistant can read
  them too. Routes `/api/exam-practice/<slug>/speaking/{voice,transcribe,report}` (`exam-practice/speaking.ts`) run
  practice mode's own check on every request (entitlement to the exam, no open timed sitting) plus the Lab switch and
  IELTS only; the report is built from the saved practice responses and costs the same 9 credits.
- Pure rules and tests: `exams/speaking-examiner.ts`, `tests/speaking-examiner.test.mjs`. The examiner has no browser suite yet.

### Workshop Essay Studio

`/labs/ielts-writing` is an experimental, `noindex` writing studio linked from `/workspace/workshop`. It shares
the Speaking Lab pilot switch (local pilot, or hosted pilot with `SPEAKING_LAB_ENABLED=true`).
Students pick an IELTS Task 2 essay, a General Task 1 letter (18 original bank prompts) or free
writing, write with a live word target and optional soft timer, then ask DeepSeek for ideas, a quick
grammar check or full feedback. Corrections must quote the student's text exactly or they are
dropped on the server; each one can be applied, skipped or applied all at once. Full feedback shows
an unofficial four-criteria band estimate (overall computed server-side with IELTS half-band
rounding), vocabulary upgrades, strengths, next steps and one rewritten passage.
- Server checks: login, verified email, same origin, strict input shape, bank prompts resolved on the
  server, minimum words, active timed-exam denial (before and after the provider call), and a daily
  40-request budget with one request in flight per student.
- Drafts, results and band history live only in this browser (`education-writing-lab-v1`). No
  attempts, scores or essays are stored on the server.
- Live spelling and grammar underlines come from Harper (`harper.js` 2.10.0, Apache-2.0), which
  runs as WebAssembly in the page, so this check sends nothing over the network. The 16 MB wasm is a
  hashed static asset loaded lazily only while auto spelling is on. Students choose UK, US or off,
  apply suggestions from a popover, ignore an issue or add words to a per-browser dictionary.
  Harper's `WorkerLinter` cannot load the bundler-emitted wasm from its blob worker, so the studio
  uses `LocalLinter` on the main thread after a 320 ms typing pause.
