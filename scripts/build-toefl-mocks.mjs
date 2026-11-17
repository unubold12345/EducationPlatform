// Convert the offline TOEFL iBT pack (MockExmps/TOEFL, never deployed) into site content:
//   assets/toefl/toefl-NN.json             private definitions with keys, scripts and model answers
//   assets/toefl-audio/toefl-NN-<id>.mp3   the pack's recordings, copied unchanged (hashes match its audio-manifest.json)
//   assets/toefl-audio/manifest.json       file, SHA-256, seconds, pack revision and source hash of every copy
//   src/modules/exams/toefl/catalog.json   client-safe catalogue (no answers, scripts or models)
//   src/modules/exams/toefl/timeline.json  client-safe clip timing per form: listening modules and speaking stages
// Listening and speaking lengths come from the recordings' durations and the pack's pauses (ADMINISTRATION.md); none
// is hard-coded. Run `node scripts/build-toefl-mocks.mjs` after any change to the pack or its recordings. The build
// stops on any failed assertion and writes nothing.
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PACK = join("MockExmps", "TOEFL");
const CONTENT = join("assets", "toefl");
const AUDIO = join("assets", "toefl-audio");
const MODULE = join("src", "modules", "exams", "toefl");
const FORMS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
// Speaking: seconds a stage allows for its clip to load, the beep, and the answer time printed in ADMINISTRATION.md.
const SLACK = 2, BEEP = 1, INTRO_TAIL = 3;
const REPEAT_SECONDS = [8, 8, 10, 10, 10, 12, 12], INTERVIEW_SECONDS = 45;
const RESPONSE_PAUSE = 20, SET_PAUSE_PER_QUESTION = 25;
const LETTERS = ["A", "B", "C", "D"];
const SOURCES = [{ label: "ETS — TOEFL iBT test specifications (January 2026 format)", url: "https://www.in.ets.org/content/dam/ets-org/pdfs/toefl/toefl-ibt-test-specifications-2026.pdf" }];

const problems = [];
const fail = message => problems.push(message);
const pad = number => String(number).padStart(2, "0");
const round = value => Math.round(value * 100) / 100;
const sha256 = data => createHash("sha256").update(data).digest("hex");
const read = path => JSON.parse(readFileSync(path, "utf8"));

function choice(id, item, extra) {
  const index = LETTERS.indexOf(item.answer);
  if (index < 0 || !item.options?.[index]) fail(`${id}: key ${item.answer} is not one of its options`);
  if (new Set(item.options).size !== item.options.length) fail(`${id}: repeated option text`);
  return { id, number: String(item.number), kind: "choice", options: item.options, optionLabels: LETTERS.slice(0, item.options.length), answers: [item.options[index]], explanation: item.why ?? "", ...extra };
}

/** Complete the Words: "pla[nts]" becomes a gap with prefix "pla" and three missing letters. */
function completeWords(form, module, item, groupId) {
  const segments = [], questions = [];
  const pattern = /([A-Za-z]*)\[([A-Za-z']+)\]/g;
  let last = 0, match, index = 0;
  while ((match = pattern.exec(item.text))) {
    const number = item.numbers[0] + index;
    const id = `toefl${pad(form)}-${module}-${pad(number)}`;
    const [, prefix, missing] = match;
    const word = prefix + missing;
    if (word !== item.answers[index]) fail(`${id}: gap ${word} differs from the pack answer ${item.answers[index]}`);
    segments.push(item.text.slice(last, match.index));
    segments.push({ q: id });
    last = match.index + match[0].length;
    questions.push({ id, number: String(number), domain: "Reading", groupId, kind: "short", matcher: "text", prompt: `Complete the word: ${prefix}${"_".repeat(missing.length)}`,
      answers: [missing], answerDisplay: word, explanation: `The complete word is "${word}".`, toefl: { gap: { prefix, missing: missing.length } } });
    index++;
  }
  segments.push(item.text.slice(last));
  if (questions.length !== 10) fail(`${groupId}: ${questions.length} gaps, expected 10`);
  if (item.numbers[1] !== item.numbers[0] + questions.length - 1) fail(`${groupId}: numbers ${item.numbers} do not match ${questions.length} gaps`);
  const group = { id: groupId, title: "Complete the Words", section: "Reading", instructions: "Fill in the missing letters in the paragraph. Each box stands for one letter.", pageMode: "group", toefl: { layout: "words", segments: segments.filter(part => part !== "") } };
  return { group, questions };
}

function readingModule(form, module, items) {
  const groups = [], questions = [];
  items.forEach((item, itemIndex) => {
    const groupId = `toefl${pad(form)}-${module}-g${itemIndex + 1}`;
    if (item.type === "complete_words") {
      const built = completeWords(form, module, item, groupId);
      groups.push(built.group); questions.push(...built.questions);
    } else if (item.type === "daily_life") {
      groups.push({ id: groupId, title: "Read in Daily Life", section: "Reading", instructions: item.heading, context: item.text, pageMode: "group", toefl: { layout: "daily", format: item.format, heading: item.heading, text: item.text } });
      for (const question of item.questions) questions.push(choice(`toefl${pad(form)}-${module}-${pad(question.number)}`, question, { domain: "Reading", groupId, prompt: question.q }));
    } else if (item.type === "academic") {
      groups.push({ id: groupId, title: "Read an Academic Passage", section: "Reading", instructions: "Read the passage and answer the questions.", context: item.paragraphs.join("\n\n"), contextTitle: item.title, pageMode: "group", toefl: { layout: "academic", title: item.title, paragraphs: item.paragraphs } });
      for (const question of item.questions) questions.push(choice(`toefl${pad(form)}-${module}-${pad(question.number)}`, question, { domain: "Reading", groupId, prompt: question.q }));
    } else fail(`form ${form}: unknown reading item ${item.type}`);
  });
  return { groups, questions };
}

const scriptText = item => Array.isArray(item.script) ? item.script.map(([speaker, line]) => `${speaker}: ${line}`).join("\n") : item.script;
const settingOf = item => item.setting ?? (item.type === "talk" ? `Listen to a talk in a ${item.subject.toLocaleLowerCase("en")} class.` : "");
const setTitle = { conversation: "Listen to a Conversation", announcement: "Listen to an Announcement", talk: "Listen to an Academic Talk" };

/** One listening module: its groups and questions, and the clip timeline that sets each question's answer window. */
function listeningModule(form, module, packModule, items, recordings) {
  const groups = [], questions = [], timeline = [];
  const clips = recordings.filter(recording => recording.section === "listening" && recording.module === packModule);
  let start = 0;
  items.forEach((item, itemIndex) => {
    const groupId = `toefl${pad(form)}-${module}-g${pad(itemIndex + 1)}`;
    const numbers = item.type === "choose_response" ? [item.number] : item.questions.map(question => question.number);
    const clip = clips.find(recording => recording.questions.join() === numbers.join());
    if (!clip) { fail(`${groupId}: no recording for questions ${numbers}`); return; }
    const pause = item.type === "choose_response" ? RESPONSE_PAUSE : SET_PAUSE_PER_QUESTION * numbers.length;
    if (clip.pauseAfterSeconds !== pause) fail(`${clip.id}: pause ${clip.pauseAfterSeconds}, ADMINISTRATION.md says ${pause}`);
    const window = { start: round(start), end: round(start + clip.seconds + pause) };
    const ids = numbers.map(number => `toefl${pad(form)}-${module}-${pad(number)}`);
    timeline.push({ clip: clip.id, start: window.start, seconds: clip.seconds, windowEnd: window.end, questions: ids });
    if (item.type === "choose_response") {
      groups.push({ id: groupId, title: "Listen and Choose a Response", section: "Listening", kind: "listening", instructions: "Listen to the speaker. Choose the best response.", toefl: { layout: "response", clip: clip.id } });
      questions.push(choice(ids[0], item, { domain: "Listening", groupId, prompt: "Choose the best response.", listening: { part: module === "l1" ? 1 : 2, script: item.prompt }, window }));
    } else {
      const setting = settingOf(item);
      if (!setting) fail(`${groupId}: no printed introduction`);
      groups.push({ id: groupId, title: setTitle[item.type], section: "Listening", kind: "listening", instructions: setting, toefl: { layout: "set", setting, clip: clip.id } });
      const script = scriptText(item);
      item.questions.forEach((question, index) => questions.push(choice(ids[index], question, { domain: "Listening", groupId, prompt: question.q, listening: { part: module === "l1" ? 1 : 2, script }, window })));
    }
    start = window.end;
  });
  if (timeline.length !== clips.length) fail(`form ${form} ${module}: ${timeline.length} clips used of ${clips.length}`);
  return { groups, questions, timeline, seconds: Math.ceil(start) };
}

function buildSentence(form, item) {
  const id = `toefl${pad(form)}-w-${pad(item.number)}`;
  const end = /[.?!]$/.exec(item.answer)?.[0] ?? "";
  const rebuilt = [item.prefix, ...item.chips, item.suffix].filter(Boolean).join(" ") + end;
  // A comma between two boxes (form 04 item 10) is printed punctuation, not a box.
  const plain = text => text.toLocaleLowerCase("en").replaceAll(",", "");
  if (plain(rebuilt) !== plain(item.answer)) fail(`${id}: "${rebuilt}" does not rebuild "${item.answer}"`);
  const pool = [...item.display];
  for (const chip of item.chips) { const at = pool.indexOf(chip); if (at < 0) fail(`${id}: chip "${chip}" is not among the boxes`); else pool.splice(at, 1); }
  if (pool.length > 1 || (pool.length === 1 && pool[0] !== item.extra)) fail(`${id}: unexpected spare boxes ${pool}`);
  return { id, number: String(item.number), domain: "Writing", groupId: `toefl${pad(form)}-w-build`, kind: "short", matcher: "text", prompt: "Make an appropriate sentence.", context: item.context,
    answers: [item.chips.join(" ")], answerDisplay: item.answer, explanation: `Grammar focus: ${item.focus.replaceAll("_", " ")}. ${item.answer}`,
    toefl: { build: { context: item.context, ...(item.prefix ? { prefix: item.prefix } : {}), ...(item.suffix ? { suffix: item.suffix } : {}), end, chips: item.display, slots: item.chips.length } } };
}

function speakingStages(form, pack, recordings, timeline) {
  const byId = id => recordings.find(recording => recording.id === id) ?? (fail(`form ${form}: no recording ${id}`), { id, seconds: 0 });
  const stages = [];
  const repeatIntro = byId("speaking-01-repeat-scenario");
  const introSeconds = clip => Math.ceil(clip.seconds + INTRO_TAIL);
  stages.push({ id: "toefl-s-repeat-intro", title: "Speaking · Listen and Repeat", seconds: introSeconds(repeatIntro), kind: "preparation", questions: [],
    instructions: "Listen to the introduction. Then listen to each sentence and repeat it once after the beep. Each sentence is said once.",
    groups: [{ id: `toefl${pad(form)}-s-repeat`, title: "Listen and Repeat", section: "Speaking", instructions: pack.repeat.scenario, toefl: { layout: "speaking-intro", part: "repeat", scenario: pack.repeat.scenario, picture: pack.repeat.picture, clip: repeatIntro.id } }] });
  timeline["toefl-s-repeat-intro"] = { clip: repeatIntro.id, seconds: repeatIntro.seconds };
  if (pack.repeat.sentences.length !== 7) fail(`form ${form}: ${pack.repeat.sentences.length} repeat sentences`);
  pack.repeat.sentences.forEach((sentence, index) => {
    const number = index + 1;
    const clip = byId(`speaking-${pad(number)}-repeat`);
    if (clip.pauseAfterSeconds !== REPEAT_SECONDS[index]) fail(`${clip.id}: answer time ${clip.pauseAfterSeconds}, expected ${REPEAT_SECONDS[index]}`);
    const stageId = `toefl-s-repeat-${number}`;
    const seconds = Math.ceil(clip.seconds + SLACK + BEEP + REPEAT_SECONDS[index]);
    timeline[stageId] = { clip: clip.id, seconds: clip.seconds, answer: REPEAT_SECONDS[index] };
    stages.push({ id: stageId, title: `Speaking · Listen and Repeat ${number} of 7`, seconds, kind: "speaking", instructions: `Repeat the sentence once after the beep. You have ${REPEAT_SECONDS[index]} seconds.`,
      questions: [{ id: `toefl${pad(form)}-s-${pad(number)}`, number: String(number), domain: "Speaking", kind: "speaking", prompt: "Listen and repeat the sentence.", answers: [],
        explanation: `Target sentence: ${sentence}`, listening: { part: 3, script: sentence }, toefl: { clip: clip.id } }] });
  });
  const interviewIntro = byId("speaking-08-interview-scenario");
  stages.push({ id: "toefl-s-interview-intro", title: "Speaking · Take an Interview", seconds: introSeconds(interviewIntro), kind: "preparation", questions: [],
    instructions: "Listen to the introduction. Then answer each of the interviewer's four questions after the beep. You have 45 seconds for each answer and no preparation time.",
    groups: [{ id: `toefl${pad(form)}-s-interview`, title: "Take an Interview", section: "Speaking", instructions: pack.interview.scenario, toefl: { layout: "speaking-intro", part: "interview", scenario: pack.interview.scenario, clip: interviewIntro.id } }] });
  timeline["toefl-s-interview-intro"] = { clip: interviewIntro.id, seconds: interviewIntro.seconds };
  if (pack.interview.questions.length !== 4) fail(`form ${form}: ${pack.interview.questions.length} interview questions`);
  pack.interview.questions.forEach((question, index) => {
    const number = index + 8;
    const clip = byId(`speaking-${pad(number)}-interview`);
    if (clip.pauseAfterSeconds !== INTERVIEW_SECONDS) fail(`${clip.id}: answer time ${clip.pauseAfterSeconds}, expected ${INTERVIEW_SECONDS}`);
    const stageId = `toefl-s-interview-${index + 1}`;
    timeline[stageId] = { clip: clip.id, seconds: clip.seconds, answer: INTERVIEW_SECONDS };
    stages.push({ id: stageId, title: `Speaking · Interview question ${index + 1} of 4`, seconds: Math.ceil(clip.seconds + SLACK + BEEP + INTERVIEW_SECONDS), kind: "speaking",
      instructions: "Answer the interviewer's question after the beep. You have 45 seconds.",
      questions: [{ id: `toefl${pad(form)}-s-${pad(number)}`, number: String(number), domain: "Speaking", kind: "speaking", prompt: "Answer the interviewer's question.", answers: [],
        explanation: `Model answer: ${question.model}`, listening: { part: 3, script: question.q }, toefl: { clip: clip.id } }] });
  });
  return stages;
}

const mocks = [], timelines = {}, audioFiles = [];
const definitions = new Map();
for (const form of FORMS) {
  const folder = join(PACK, `mock-${pad(form)}`);
  const pack = read(join(folder, "mock.json"));
  const manifest = read(join(folder, "audio", "audio-manifest.json"));
  if (!manifest.complete) fail(`form ${form}: the audio manifest is not complete`);
  const recordings = manifest.recordings;
  const slug = `toefl-${pad(form)}`;
  const [readingRoute, readingTotal] = pack.routing.reading, [listeningRoute, listeningTotal] = pack.routing.listening;

  const r1 = readingModule(form, "r1", pack.reading.router);
  const r2l = readingModule(form, "r2l", pack.reading.lower);
  const r2u = readingModule(form, "r2u", pack.reading.upper);
  if (r1.questions.length !== 35 || readingTotal !== 35 || r2l.questions.length !== 15 || r2u.questions.length !== 15) fail(`form ${form}: reading counts ${r1.questions.length}/${r2l.questions.length}/${r2u.questions.length}`);
  const l1 = listeningModule(form, "l1", "router", pack.listening.router, recordings);
  const l2l = listeningModule(form, "l2l", "lower", pack.listening.lower, recordings);
  const l2u = listeningModule(form, "l2u", "upper", pack.listening.upper, recordings);
  if (l1.questions.length !== 32 || listeningTotal !== 32 || l2l.questions.length !== 15 || l2u.questions.length !== 15) fail(`form ${form}: listening counts ${l1.questions.length}/${l2l.questions.length}/${l2u.questions.length}`);
  const build = pack.writing.build.map(item => buildSentence(form, item));
  if (build.length !== 10) fail(`form ${form}: ${build.length} Build a Sentence items`);
  const speakingTimeline = {};
  const speaking = speakingStages(form, pack.speaking, recordings, speakingTimeline);
  const email = pack.writing.email, discussion = pack.writing.discussion;

  const stages = [
    { id: "toefl-r1", title: "Reading · Module 1", seconds: 1200, kind: "questions", groups: r1.groups, questions: r1.questions,
      instructions: "35 questions · 20 minutes. Complete the Words, Read in Daily Life and Read an Academic Passage. Move freely within this module. You cannot return to it after time ends." },
    { id: "toefl-r2", title: "Reading · Module 2", seconds: 540, kind: "questions", routeAt: readingRoute, groups: [...r2l.groups, ...r2u.groups], questions: [], variants: { lower: r2l.questions, higher: r2u.questions },
      instructions: "15 questions · 9 minutes. Your Module 1 result chose this module. Move freely within it until the timer ends." },
    { id: "toefl-l1", title: "Listening · Module 1", seconds: l1.seconds, kind: "listening", groups: l1.groups, questions: l1.questions,
      instructions: "32 questions. Each recording plays once. Its questions appear when it ends and lock when their time runs out. There is no pause, replay or going back." },
    { id: "toefl-l2", title: "Listening · Module 2", seconds: l2l.seconds, kind: "listening", routeAt: listeningRoute, variantSeconds: { lower: l2l.seconds, higher: l2u.seconds }, groups: [...l2l.groups, ...l2u.groups], questions: [], variants: { lower: l2l.questions, higher: l2u.questions },
      instructions: "15 questions. Your Module 1 result chose this module. Each recording plays once; its questions lock when their time runs out." },
    { id: "toefl-w-build", title: "Writing · Build a Sentence", seconds: 360, kind: "questions", groups: [{ id: `toefl${pad(form)}-w-build`, title: "Build a Sentence", section: "Writing", instructions: "Move the words in the boxes to create a grammatical sentence. Each blank takes one box. In some questions one box is not used." }], questions: build,
      instructions: "10 questions · 6 minutes. Build a reply to each line from the boxes. Unused time does not carry over." },
    { id: "toefl-w-email", title: "Writing · Write an Email", seconds: 420, kind: "writing",
      groups: [{ id: `toefl${pad(form)}-w-email`, title: "Write an Email", section: "Writing", instructions: email.scenario, toefl: { layout: "email", scenario: email.scenario, to: email.to, subject: email.subject, bullets: email.bullets } }],
      questions: [{ id: `toefl${pad(form)}-w-11`, number: "11", domain: "Writing", groupId: `toefl${pad(form)}-w-email`, kind: "essay", prompt: `Write an email to ${email.to}. Write as much as you can and in complete sentences.`, answers: [], explanation: `Model response:\n\n${email.model}` }],
      instructions: "7 minutes. Write the email the task describes. Your response is saved for review; it is not scored automatically." },
    { id: "toefl-w-discussion", title: "Writing · Academic Discussion", seconds: 600, kind: "writing",
      groups: [{ id: `toefl${pad(form)}-w-discussion`, title: "Write for an Academic Discussion", section: "Writing", instructions: `Your professor is teaching a class on ${discussion.course}. Write a post responding to the professor's question.`, toefl: { layout: "discussion", course: discussion.course, professor: discussion.professor, students: discussion.students } }],
      questions: [{ id: `toefl${pad(form)}-w-12`, number: "12", domain: "Writing", groupId: `toefl${pad(form)}-w-discussion`, kind: "essay", minWords: 100, prompt: "Express and support your opinion, and make a contribution to the discussion in your own words. An effective response will contain at least 100 words.", answers: [], explanation: `Model response:\n\n${discussion.model}` }],
      instructions: "10 minutes. Write a post for the class discussion. Your response is saved for review; it is not scored automatically." },
    ...speaking,
  ];
  const definition = { slug, version: 1, audioRevision: 1, program: "toefl", title: `TOEFL iBT · Mock ${pad(form)}`,
    description: `Original practice form in the January 2026 TOEFL iBT format: adaptive Reading and Listening, Writing and Speaking. Theme: ${pack.theme}.`,
    sources: SOURCES, notes: ["Not ETS material. TOEFL and TOEFL iBT are registered trademarks of ETS.", "Synthetic voices. Raw counts only; no band score."], stages };

  // Every id is unique and every listening and speaking clip is one of this form's recordings.
  const ids = stages.flatMap(stage => [...stage.questions, ...(stage.variants ? [...stage.variants.lower, ...stage.variants.higher] : [])].map(question => question.id));
  if (new Set(ids).size !== ids.length) fail(`${slug}: repeated question ids`);
  if (ids.length !== 35 + 30 + 32 + 30 + 12 + 11) fail(`${slug}: ${ids.length} questions`);
  const used = new Set([...l1.timeline, ...l2l.timeline, ...l2u.timeline].map(entry => entry.clip).concat(Object.values(speakingTimeline).map(entry => entry.clip)));
  if (used.size !== recordings.length) fail(`${slug}: ${used.size} of ${recordings.length} recordings used`);

  // No answer, script, explanation or model may reach a client file or a display field the sitting sends.
  const secrets = [];
  for (const stage of stages) for (const question of [...stage.questions, ...(stage.variants ? [...stage.variants.lower, ...stage.variants.higher] : [])]) {
    if (question.listening) secrets.push(...question.listening.script.split("\n").map(line => line.replace(/^[A-Za-z]+: /, "")));
    if (question.explanation) secrets.push(question.explanation);
    if (question.kind === "choice" && question.groupId?.includes("-l")) secrets.push(question.answers[0]);
  }
  const clientSide = JSON.stringify({ toefl: stages.flatMap(stage => (stage.groups ?? []).filter(group => group.kind === "listening" || stage.kind === "writing" || stage.kind === "preparation").map(group => group.toefl)), items: ids });
  for (const secret of secrets.filter(text => text.length >= 12)) if (clientSide.includes(secret)) fail(`${slug}: a display field holds private text "${secret.slice(0, 40)}"`);

  definitions.set(slug, definition);
  timelines[slug] = { l1: l1.timeline, "l2-lower": l2l.timeline, "l2-higher": l2u.timeline, speaking: speakingTimeline };
  const fixed = 1200 + 540 + 360 + 420 + 600 + speaking.reduce((sum, stage) => sum + stage.seconds, 0);
  mocks.push({ slug, number: form, title: definition.title, theme: pack.theme, questions: { reading: 50, listening: 47, writing: 12, speaking: 11 },
    minutes: { lower: Math.round((fixed + l1.seconds + l2l.seconds) / 60), higher: Math.round((fixed + l1.seconds + l2u.seconds) / 60) } });
  for (const recording of recordings) {
    const source = join(folder, "audio", recording.file);
    if (!existsSync(source)) { fail(`${slug}: missing ${recording.file}`); continue; }
    const data = readFileSync(source);
    if (sha256(data) !== recording.sha256) fail(`${slug}: ${recording.file} does not match its manifest hash`);
    audioFiles.push({ source, file: `${slug}-${recording.id}.mp3`, sha256: recording.sha256, seconds: recording.seconds, revision: recording.revision, sourceSha256: recording.sourceSha256 });
  }
}

const clientFiles = JSON.stringify({ mocks, timelines });
for (const definition of definitions.values()) for (const stage of definition.stages) for (const question of [...stage.questions, ...(stage.variants ? [...stage.variants.lower, ...stage.variants.higher] : [])]) {
  if (question.listening && question.listening.script.length >= 12 && clientFiles.includes(question.listening.script.slice(0, 40))) fail(`${question.id}: its script reached a client file`);
}

if (problems.length) {
  console.error(`build-toefl-mocks: ${problems.length} problem(s), nothing written:\n- ` + problems.join("\n- "));
  process.exit(1);
}
// Write only what changed, so a rerun (the unit test does one) leaves file times alone and the app build does not look stale.
const keep = new Set();
const put = (path, text) => { keep.add(path); if (!existsSync(path) || readFileSync(path, "utf8") !== text) writeFileSync(path, text); };
const copy = (source, path) => { keep.add(path); if (!existsSync(path) || !readFileSync(path).equals(readFileSync(source))) copyFileSync(source, path); };
mkdirSync(CONTENT, { recursive: true }); mkdirSync(AUDIO, { recursive: true }); mkdirSync(MODULE, { recursive: true });
for (const [slug, definition] of definitions) put(join(CONTENT, `${slug}.json`), JSON.stringify(definition) + "\n");
for (const file of audioFiles) copy(file.source, join(AUDIO, file.file));
put(join(AUDIO, "manifest.json"), JSON.stringify(audioFiles.map(({ source, ...file }) => ({ ...file, source: source.replaceAll("\\", "/") })), null, 1) + "\n");
put(join(MODULE, "catalog.json"), JSON.stringify(mocks, null, 2) + "\n");
put(join(MODULE, "timeline.json"), JSON.stringify(timelines) + "\n");
// Remove what an earlier build wrote and this one did not (a dropped form or recording).
for (const folder of [CONTENT, AUDIO]) for (const name of readdirSync(folder)) if (!keep.has(join(folder, name))) rmSync(join(folder, name));
const bytes = audioFiles.reduce((sum, file) => sum + readFileSync(join(AUDIO, file.file)).length, 0);
console.log(`build-toefl-mocks: ${definitions.size} mocks, ${audioFiles.length} recordings (${(bytes / 1048576).toFixed(1)} MB) in ${AUDIO}; minutes ${mocks.map(mock => mock.minutes.lower + "/" + mock.minutes.higher).join(", ")}`);
