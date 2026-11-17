# Running a TOEFL iBT practice test from this pack

The real test is taken on a computer in one sitting of about 1 hour 25 minutes, with no break. This pack is paper
and script based, so one person (the administrator) keeps time, plays or reads the recordings and marks Module 1.

## Files

| File | Who sees it | Contents |
| --- | --- | --- |
| `mock-NN/candidate.md` | test taker | every printed text, question and answer choice; no keys, no listening scripts |
| `mock-NN/examiner.md` | administrator | every recording script (Listening and Speaking) with voice codes and pauses |
| `mock-NN/answers.md` | administrator | keys, explanations, model responses, scoring descriptors, routing rule |
| `mock-NN/mock.json` | nobody during a sitting | the same content as structured data, keys included |
| `mock-NN/audio/` | administrator plays them | one MP3 per recording, named by module and question number |

The recordings are listed in [AUDIO.md](AUDIO.md). Each file is speech only: play it once, then allow the pauses
below. The set intros ("Listen to a conversation between...") are printed on the candidate paper, not spoken.
The recordings are synthetic and no person has checked them yet; if one is unclear, read its script from
`examiner.md` instead (two readers for conversations). Never show the scripts to the test taker.

## Order and timing

| Step | What happens | Time |
| --- | --- | --- |
| 1 | Reading Module 1, questions 1-35 | 20 min |
| 2 | Mark the 35 answers; 21 or more correct: Upper, otherwise Lower | (administrator) |
| 3 | Reading Module 2 (Lower **or** Upper), questions 36-50 | 9 min |
| 4 | Listening Module 1, questions 1-32 | about 18 min |
| 5 | Mark the 32 answers; 20 or more correct: Upper, otherwise Lower | (administrator) |
| 6 | Listening Module 2 (Lower **or** Upper), questions 33-47 | about 7 min (Lower) or 11 min (Upper) |
| 7 | Writing: Build a Sentence, questions 1-10 | 6 min |
| 8 | Writing: Write an Email | 7 min |
| 9 | Writing: Write for an Academic Discussion | 10 min |
| 10 | Speaking: Listen and Repeat, 7 sentences | about 3 min |
| 11 | Speaking: Take an Interview, 4 questions | about 5 min |

Reading: one clock per module; the test taker may move back and forward inside the module but may not return to
Module 1 after step 1. Complete the Words answers are typed or written letter by letter; a word is right only if
every letter is right.

Listening: every recording is played once. After a Choose a Response sentence allow 20 seconds. After a
conversation, announcement or talk allow 25 seconds per question. The test taker may take notes.

Writing: each of the three tasks has its own clock. Unused time does not carry over.

Speaking: record the test taker. Each part starts with its scenario recording (`speaking-01-repeat-scenario.mp3`,
`speaking-08-interview-scenario.mp3`), read by a narrator. In Listen and Repeat play a sentence, sound a beep, and allow 8, 8, 10, 10, 10, 12
and 12 seconds; the sentence is said once. In the interview there is no preparation time; allow 45 seconds per
answer and then go straight to the next question.

## Scoring

- Reading and Listening: 1 point per correct answer (Reading /50, Listening /47). There is no penalty for wrong
  answers. The real test contains unscored trial items, so only 35 points count in each section, and it reports a
  band from 1 to 6 in half steps. ETS has not published a raw-to-band table for this format, so the pack reports
  raw scores only. As a guide to the level reached, ETS aligns the bands with the CEFR: 6 = C2, 5 and 5.5 = C1,
  4 and 4.5 = B2, 3 and 3.5 = B1, 2 and 2.5 = A2, 1 and 1.5 = A1.
- The routing rule (about 60 % of Module 1) is this pack's own. Third-party guides report that a test taker who is
  routed to the Lower module cannot reach the top bands; treat a Lower-module result as "B1 or below" practice.
- Build a Sentence: 1 point per sentence with every box in place.
- Email and Academic Discussion: 0 to 5 each, with the descriptors in `answers.md`. On the real test these are
  scored by ETS's automated engine.
- Speaking: 0 to 5 for each of the 11 responses, with the descriptors in `answers.md`.

## What differs from the real test

- On screen, Build a Sentence is drag and drop, Choose a Response shows a photo of the speaker, and the interview
  is a video of the interviewer.
- The real routing thresholds, the unscored items and the band conversion are not public.
- The recordings are synthetic (Kokoro stock voices). American and British accents are heard; the Australian
  parts are read by two further British voices, because the engine has no Australian voice.
- These forms have had no teacher review and no trial with learners, so their difficulty is not calibrated.
