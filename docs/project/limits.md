# Known limits

Part of the [project guide](../PROJECT.md) (was PROJECT.md section 11). "Section N" in the text means that old numbering; the guide maps it to files.

- See `OPERATIONS.md` for the current Git and hosted deployment state. A source push does not prove
  a hosted deployment or enable Google/email without the corresponding provider settings.
- Hosted Google and Gmail credentials are configured; a hosted verification email reached the owner
  inbox. A completed real Google login, consent and token exchange still require an owner-controlled
  browser session. See `OPERATIONS.md` for exact deployment/check evidence.
- There is no verified-email production onboarding, no live billing and no real payment provider.
- Scores are raw; SAT scaled scores and IELTS bands are not calculated. ЭЕШ papers report a 100-point
  practice total from printed item marks, not the official weighted ЭЕШ score. The Speaking Lab's and
  Essay Studio's bands are AI estimates only.
- All 194 imported ЭЕШ papers await teacher review, so their answers, explanations and the AI's answers
  about them are unverified. The 2022–2026 Mathematics and English references are third-party copies,
  not official БҮТ files.
- The 2018 and 2019 English listening sections have a script but no recording; they are labelled as
  transcript practice. No audio was synthesized for them.
- Creating new catalog items and replacing content media are unfinished.
- Content accuracy depends on manual review.
- Local PGlite works with single-connection settings; broad production concurrency and scale are
  unverified.
- AI and speech features depend on third-party models and local model caches; quality, latency and
  cost are not production-benchmarked. Provider retention is governed by the provider's terms.
- Vocabulary is generated from the uploaded text only: imported words can be incomplete or wrong, are not teacher-reviewed, and scans or photos are not OCR'd. A translation written in the document is kept; a fallback translation that the AI writes for a word with no meaning in the document may be inaccurate. The chosen word count is a strict maximum (the model may return fewer); the free-text selection request is only a preference.
- Vocabulary quiz scores are self-study feedback in the browser; they are not saved, graded or official results.
- Exams from a file are generated from the uploaded text only and are also unreviewed AI drafts. Their
  results and history are saved on the account, the timer runs on the student's device, the score is practice
  feedback rather than an official result, and scanned documents are refused because there is no OCR.
- Reading Lab samples are original practice texts awaiting teacher review; generated practices are unreviewed AI drafts made only
  from the student's material, and their scores are self-study feedback saved on the account, not band scores.
- The study roadmap is a rule-based schedule, not an adaptive or teacher-made plan; it links to mocks the student may still need to buy.
- Personal-data retention, account deletion policy, email deliverability and accessibility audits
  remain to be completed.
- This is a hosted test pilot, not a production education service.
