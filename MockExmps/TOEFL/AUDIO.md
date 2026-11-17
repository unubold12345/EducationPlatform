# Recordings - TOEFL iBT practice forms 01-09

Synthetic recordings of every Listening and Speaking script in this pack, made locally with Kokoro-82M stock voices. They are practice audio, not ETS recordings, and no person has listened to them yet. Never play them to a test taker before the matching module starts, and never show `examiner.md` or these manifests.

## Files

Each `mock-NN/audio/` folder holds one MP3 per recording (24 kHz mono) and `audio-manifest.json` (file, voice per speaker, duration, SHA-256 of the file and of its exact source text, speech-only renderings, revision). File names follow the paper:

| Recording | File |
| --- | --- |
| Choose a Response, question 1 of Module 1 | `listening-m1-01-response.mp3` |
| Conversation, questions 13-14 | `listening-m1-13-conversation.mp3` |
| Announcement or talk, Module 2 Upper, from question 40 | `listening-m2-upper-40-talk.mp3` |
| Listen and Repeat scenario, then sentence 1 | `speaking-01-repeat-scenario.mp3`, `speaking-01-repeat.mp3` |
| Interview scenario, then question 8 | `speaking-08-interview-scenario.mp3`, `speaking-08-interview.mp3` |

The files contain speech only (0.3 s of lead-in, 0.6 s at the end). The administrator adds the pauses of [ADMINISTRATION.md](ADMINISTRATION.md): 20 s after a Choose a Response prompt, 25 s per question after a set, the Listen and Repeat windows (8, 8, 10, 10, 10, 12, 12 s, after a beep the administrator sounds) and 45 s per interview answer. The set intros ("Listen to a conversation between...") are printed on the candidate paper and are not spoken.

## Voices

| Code | Kokoro voice | Note |
| --- | --- | --- |
| F-US | `af_heart` | American |
| M-US | `am_michael` | American |
| F-UK | `bf_emma` | British |
| M-UK | `bm_george` | British |
| F-AU | `bf_isabella` | second British woman; Kokoro has no Australian voice |
| M-AU | `bm_fable` | second British man; Kokoro has no Australian voice |
| scenario lines | `am_fenrir` or `af_bella` | narrator of the other gender than the supervisor or interviewer who speaks next |

British voices are read with British (en-gb) phonemes, American voices with American (en-us) phonemes. The Australian accent itself is therefore not represented; every conversation still has two clearly different voices (always a woman and a man).

Speech-only renderings (the scripts are unchanged; each manifest records the spoken text next to the source): `Dr.` as "Doctor"; `Mr.` as "Mister"; `Mrs.` as "Missus"; `Ms.` as "Miz"; `Room 204` as "Room two oh four"; `Statistics 210` as "Statistics two ten"; `Taipei 101` as "Taipei one oh one".

Pronunciation corrections: espeak-ng, which turns text into phonemes for Kokoro, reads some words wrongly in context. The generator corrects those phonemes, never the text: 'Excuse me' is the verb, /z/; 'use the/this' is the verb, /z/; 'anyone uses' is the verb, /z/; 'the octopus uses' is the verb, /z/; 'factories close' is the verb, /z/; 'applications close' is the verb, /z/; 'she live there' is the verb live; 'hardly live without' is the verb live; 'friends live far away' is the verb live; 'the last thing you read' is past tense; 'have you actually read' is the participle; 'he's used to' (accustomed) has /s/; a teen quantity ('fifteen minutes') keeps its stress on -teen, so it is not heard as 'fifty'. Each corrected recording lists its corrections in the manifest.

## Forms

Sitting time = recordings + administration pauses, against the module times of the blueprint.

| Form | Recordings | Module 1 (18 min) | Lower (7 min) | Upper (11 min) | Speaking (8 min) | Manifest |
| --- | --- | --- | --- | --- | --- | --- |
| 01 | 51 | 19:08 (speech 6:48) | 7:57 (speech 2:17) | 10:22 (speech 4:22) | 5:46 (speech 1:36) | [audio-manifest.json](mock-01/audio/audio-manifest.json) |
| 02 | 51 | 19:20 (speech 7:00) | 7:51 (speech 2:11) | 10:16 (speech 4:16) | 5:47 (speech 1:37) | [audio-manifest.json](mock-02/audio/audio-manifest.json) |
| 03 | 51 | 19:31 (speech 7:11) | 7:59 (speech 2:19) | 10:29 (speech 4:29) | 5:45 (speech 1:35) | [audio-manifest.json](mock-03/audio/audio-manifest.json) |
| 04 | 51 | 19:28 (speech 7:08) | 7:55 (speech 2:15) | 10:34 (speech 4:34) | 5:50 (speech 1:40) | [audio-manifest.json](mock-04/audio/audio-manifest.json) |
| 05 | 51 | 19:30 (speech 7:10) | 8:03 (speech 2:23) | 10:18 (speech 4:18) | 5:43 (speech 1:33) | [audio-manifest.json](mock-05/audio/audio-manifest.json) |
| 06 | 51 | 19:11 (speech 6:51) | 8:05 (speech 2:25) | 10:25 (speech 4:25) | 5:45 (speech 1:35) | [audio-manifest.json](mock-06/audio/audio-manifest.json) |
| 07 | 51 | 20:12 (speech 7:52) | 8:05 (speech 2:25) | 10:32 (speech 4:32) | 5:52 (speech 1:42) | [audio-manifest.json](mock-07/audio/audio-manifest.json) |
| 08 | 51 | 19:32 (speech 7:12) | 7:56 (speech 2:16) | 10:29 (speech 4:29) | 5:52 (speech 1:42) | [audio-manifest.json](mock-08/audio/audio-manifest.json) |
| 09 | 51 | 19:58 (speech 7:38) | 8:02 (speech 2:22) | 10:15 (speech 4:15) | 6:01 (speech 1:51) | [audio-manifest.json](mock-09/audio/audio-manifest.json) |

## Machine check

Last run 2026-11-18: **needs review**. 459 recordings in 9 forms: files, manifests, hashes, source-text hashes, voices, decoding and durations passed. Whisper round trip: 419 recordings match their script word for word after normalisation; 23 differ in ordinary words (30 word errors in 22718 words, 0.13%) and 17 only in the spelling of names (26 name differences in all).

Recordings that need a human ear: Whisper's transcript differs from the script in the words shown. `word` rows come first, because a mispronounced or swallowed word would show there; `name` rows differ only in how a personal or place name is spelled. Some rows are Whisper's own mistakes, but each should be heard once.

| Form | Recording | Kind | Differences / words | Script says | Whisper heard |
| --- | --- | --- | --- | --- | --- |
| 02 | `listening-m2-lower-34-response` | word | 1/7 | this bag | this bug |
| 09 | `listening-m1-02-response` | word | 1/7 | new roommate | new roommates |
| 01 | `listening-m1-03-response` | word | 1/8 | i opened the | i open the |
| 09 | `listening-m1-12-response` | word | 1/11 | all this studying | all the studying |
| 09 | `listening-m2-upper-38-announcement` | word | 3/108 | all master and / all theses are | all masters and / all the seas are |
| 02 | `listening-m1-19-conversation` | word | 2/110 | it i would put | it put |
| 09 | `listening-m2-upper-36-conversation` | word | 2/114 | bit harsh i / exchange fee the | bit harshy i / exchange fees the |
| 02 | `listening-m2-upper-44-talk` | word | 3/229 | hear but listen / i goed to / says goed the | hear listen / i go to / says goad the |
| 09 | `listening-m2-lower-40-conversation` | word | 2/82 | mr banda is / share mine thanks | mr bander is / share mind thanks |
| 09 | `listening-m2-lower-44-announcement` | word | 1/89 | cap see you | cap say you |
| 05 | `listening-m2-upper-38-announcement` | word | 1/105 | good afternoon this | good afternoons this |
| 04 | `listening-m2-upper-38-announcement` | word | 1/107 | good afternoon this | good afternoons this |
| 03 | `listening-m2-upper-44-talk` | word | 3/221 | he meant / ties are acquaintances / to granovetter had | he he meant / ties or acquaintances / to granovita had |
| 03 | `listening-m2-upper-38-announcement` | word | 1/111 | good afternoon a | good afternoons a |
| 07 | `listening-m1-15-conversation` | word | 1/112 | you would just | you just |
| 07 | `listening-m1-13-conversation` | word | 1/121 | it it is | it there is |
| 07 | `listening-m2-upper-36-conversation` | word | 2/138 | dr castellan has / yeah when | dr casselin has / yeah and when |
| 08 | `listening-m1-25-talk` | word | 1/218 | too and here | too here |
| 09 | `listening-m1-25-talk` | word | 1/218 | walk on | walk on on |
| 03 | `listening-m2-upper-40-talk` | word | 1/222 | they mixed lime | they mix lime |
| 09 | `listening-m2-upper-44-talk` | word | 1/225 | who tells | who who tells |
| 06 | `listening-m2-upper-44-talk` | word | 4/226 | named milman parry tried / footed achille or / fingered dawn readers | named millman perry tried / footed achilles or / fingered don readers |
| 09 | `listening-m1-29-talk` | word | 1/234 | right and our | right our |
| 05 | `listening-m2-upper-36-conversation` | name | 2/134 | from dmitri about / professor mensah into | from dimitri about / professor mensa into |
| 05 | `listening-m2-upper-44-talk` | name | 2/228 | marcel mauss that / s mauss argued | marcel morse that / s morse argued |
| 06 | `listening-m2-upper-36-conversation` | name | 2/131 | professor aldous do / in kirra what | professor aldus do / in cura what |
| 01 | `listening-m1-13-conversation` | name | 1/98 | name elena petrova | name ilina petrova |
| 01 | `listening-m2-upper-38-announcement` | name | 1/113 | amara nwosu originally | amara enwasu originally |
| 01 | `listening-m2-upper-40-talk` | name | 1/221 | by hermann ebbinghaus | by herman ebbinghaus |
| 02 | `listening-m2-lower-40-conversation` | name | 1/76 | hi sofia do | hi sophia do |
| 03 | `listening-m1-15-conversation` | name | 1/89 | and mei do | and may do |
| 03 | `listening-m2-lower-40-conversation` | name | 1/88 | am sofia | am sophia |
| 05 | `listening-m1-17-conversation` | name | 1/111 | professor hartmann do | professor hartman do |
| 05 | `listening-m2-lower-40-conversation` | name | 1/82 | hi sofia are | hi sophia are |
| 06 | `listening-m1-15-conversation` | name | 1/95 | so pilar birthday | so pillars birthday |
| 06 | `listening-m2-lower-42-announcement` | name | 1/92 | of pendlow for | of pendlo for |
| 06 | `listening-m2-lower-46-announcement` | name | 1/86 | mr olsen class | mr olson class |
| 08 | `listening-m1-08-response` | name | 1/13 | dr castellano would | dr casalano would |
| 08 | `listening-m2-lower-40-conversation` | name | 1/87 | hi camila i | hi camilla i |
| 09 | `listening-m1-17-conversation` | name | 1/118 | professor szabo thanks | professor sharbo thanks |

What the checks of 2026-11-18 showed about these rows: a doubled word ("who who tells") is Whisper repeating itself; `goed` in form 02's talk is a child's error the script quotes on purpose; the British voices end a sentence that stands alone with a breathy release that Whisper hears as a plural *s* ("Good afternoons" in three announcements; heard correctly when the greeting runs into the next sentence). Listen most carefully for swallowed short words ("and", "but", "I'd"), lost endings (-ed, -s) and vowels ("bag" heard as "bug").

Full results, per recording, are in [audio-validation.json](audio-validation.json).

## Regenerate

The generator needs Python 3.12 with `kokoro-onnx`, `onnxruntime` and `numpy`, plus FFmpeg on PATH; it uses the fp32 `onnx-community/Kokoro-82M-v1.0-ONNX` model cached for the Speaking Lab (`artifacts/speaking-voice-cache`) and the voice tables in `node_modules/kokoro-js/voices`. No network or API key is used. The validator needs `faster-whisper` (models `small.en` and `medium.en`) and FFmpeg.

```powershell
& "$env:TEMP/education-free-audio-py312/Scripts/python.exe" -B MockExmps/TOEFL/_source/generate_audio.py
& "$env:TEMP/education-free-audio-py312/Scripts/python.exe" -B MockExmps/TOEFL/_source/generate_audio.py --forms 3 --items "listening-m1-13-*"
python -B MockExmps/TOEFL/_source/validate_audio.py
python -B MockExmps/TOEFL/_source/build.py
```

Re-runnable per form (`--forms`) and per recording (`--items`, shell-style patterns). A recording is made again only when its script, voices, settings, model or voice tables changed; its `revision` in the manifest then goes up by one, so a corrected script yields a new revision of just that file. Synthesised sentences are cached in the system temp folder (`education-toefl-offline-tts-cache`).

Model: `onnx-community/Kokoro-82M-v1.0-ONNX onnx/model.onnx (fp32)` (SHA-256 `8fbea51ea711f2af...`), kokoro-onnx 0.6.1, onnxruntime 1.31.1.
