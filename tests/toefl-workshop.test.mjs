import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { examTasks, findWritingPrompt, promptBody, validWritingInput, writingExam, writingMessages, writingPrompts, writingTasks } from "../src/modules/writing-lab/contracts.ts";
import { EXPERT_LIMITS, criterionLabel, expertMinWords, expertSystem, normalizeExpertReview, reviewExam, scoreScale, scoreText, toeflScore, validExpertInput } from "../src/modules/writing-lab/expert.ts";
import { BUILD_SETS, buildCorrect, buildDisplay, buildTask, findBuildSet, placedBoxes, rebuiltAnswer } from "../src/modules/writing-lab/build-sentence.ts";
import {
  INTERVIEWS, INTERVIEW_MIN_WORDS, INTERVIEW_SECONDS, INTERVIEW_SHAPE, REPEAT_SETS, SPEAKING_WORDS_PER_SECOND, TRANSCRIPT_LIMIT, interviewMessages, normalizeInterviewReport, repeatDiff, scoreRepeat,
  parseInterviewJson, spokenSeconds, validInterviewInput,
} from "../src/modules/toefl-speaking/contracts.ts";
import { speakingVoices } from "../src/modules/speaking-lab/contracts.ts";
import { inWorkspace, workspaceTab } from "../src/modules/workspace/paths.ts";

const text = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const words = value => (value.trim().match(/[A-Za-z0-9'’-]+/g) ?? []).length;
const EMAIL = "Dear Professor Lee, I am writing because I missed the study group meeting on Tuesday. ".repeat(6);

// ---------- Writing: the TOEFL tasks in the Essay Studio ----------

test("the Essay Studio carries the two TOEFL writing tasks next to the IELTS ones", () => {
  assert.deepEqual(examTasks("toefl"), ["email", "discussion"]);
  assert.ok(!examTasks("ielts").includes("email") && examTasks("ielts").includes("essay"));
  assert.equal(writingTasks.email.minutes, 7);
  assert.equal(writingTasks.discussion.minutes, 10);
  for (const task of ["email", "discussion"]) assert.equal(writingExam(task), "toefl");
  const toefl = writingPrompts.filter(prompt => writingExam(prompt.task) === "toefl");
  assert.equal(toefl.filter(prompt => prompt.task === "email").length, 8);
  assert.equal(toefl.filter(prompt => prompt.task === "discussion").length, 8);
  assert.equal(new Set(writingPrompts.map(prompt => prompt.id)).size, writingPrompts.length, "prompt ids are unique");
  for (const prompt of toefl) {
    if (prompt.task === "email") {
      assert.ok(prompt.to && prompt.subject, prompt.id);
      assert.equal(prompt.points?.length, 3, prompt.id);
      assert.match(promptBody(prompt), /Write an email to .+\. Subject: .+\. In your email, do the following:\n- .+\n- .+\n- .+$/, prompt.id);
    } else {
      assert.ok(prompt.course && prompt.professor, prompt.id);
      assert.equal(prompt.students?.length, 2, prompt.id);
      const body = promptBody(prompt);
      for (const student of prompt.students) assert.ok(body.includes(`${student.name}: ${student.post}`), prompt.id);
      assert.ok(body.includes(`${prompt.professor}: ${prompt.text}`), prompt.id);
    }
  }
});

test("TOEFL tasks get ideas and the grammar check, never the IELTS band feedback", () => {
  const base = { task: "email", promptId: "t-email-study-group", topic: "", essay: EMAIL, language: "mn" };
  assert.ok(findWritingPrompt("t-email-study-group"));
  assert.ok(validWritingInput({ ...base, action: "grammar" }));
  assert.ok(validWritingInput({ ...base, action: "ideas", essay: "" }));
  assert.equal(validWritingInput({ ...base, action: "feedback" }), false, "an IELTS band estimate on a TOEFL task");
  assert.equal(validWritingInput({ ...base, action: "grammar", promptId: "e-online-school" }), false, "an IELTS prompt under a TOEFL task");
  assert.equal(validWritingInput({ ...base, action: "grammar", task: "discussion" }), false, "an email prompt under the discussion task");
  const [system, user] = writingMessages({ ...base, action: "grammar" });
  assert.match(system.content, /the TOEFL iBT/);
  assert.match(system.content, /Write an Email/);
  assert.doesNotMatch(system.content, /IELTS/);
  assert.match(JSON.parse(user.content).prompt, /Subject:/, "the coach sees the whole task, not only its situation");
});

test("the expert review scores TOEFL responses on the ETS 0-5 scale", () => {
  assert.equal(reviewExam("report"), "ielts");
  assert.equal(reviewExam("discussion"), "toefl");
  assert.equal(expertMinWords("email"), EXPERT_LIMITS.toeflMinWords);
  assert.equal(expertMinWords("essay"), EXPERT_LIMITS.minWords);
  assert.equal(scoreScale("email"), 5);
  assert.equal(scoreScale("essay"), 9);
  assert.equal(scoreText(4, "discussion"), "4");
  assert.equal(scoreText(6.5, "essay"), "6.5");
  assert.equal(criterionLabel("task", "email"), "Task completion");
  assert.equal(criterionLabel("task", "discussion"), "Contribution");
  assert.equal(criterionLabel("coherence", "email"), "Development & organization");
  assert.notEqual(criterionLabel("task", "essay"), "Task completion", "the IELTS labels are unchanged");
  assert.equal(toeflScore({ task: 4, coherence: 4, lexical: 3, grammar: 3 }), 4, "3.5 rounds up");
  assert.equal(toeflScore({ task: 4, coherence: 3, lexical: 3, grammar: 3 }), 3);

  const input = { task: "email", promptId: "t-email-study-group", topic: "", essay: EMAIL, language: "mn" };
  assert.ok(words(EMAIL) >= EXPERT_LIMITS.toeflMinWords && words(EMAIL) < EXPERT_LIMITS.minWords);
  assert.ok(validExpertInput(input), "a TOEFL email needs fewer words than an IELTS essay");
  assert.equal(validExpertInput({ ...input, task: "essay", promptId: "e-online-school" }), false);

  const system = expertSystem("mn", "toefl");
  assert.match(system, /ETS TOEFL iBT Writing rater/);
  assert.match(system, /each 0 to 5 in whole points/);
  assert.doesNotMatch(system, /band descriptors/);
  assert.match(expertSystem("mn"), /IELTS Writing examiner/, "the IELTS examiner is the default");

  const model = "Dear Professor Lee, I am sorry that I missed our meeting. ".repeat(6);
  const review = normalizeExpertReview({ summary: "Сайн.", bands: { task: 4.6, coherence: 12, lexical: -1, grammar: 3 }, criteria: [], model_answer: model }, EMAIL, "toefl");
  assert.deepEqual(review.bands, { task: 5, coherence: 5, lexical: 0, grammar: 3 }, "whole points, clamped to 0-5");
  assert.equal(review.overall, 3, "the TOEFL score is the rounded mean (13 / 4 = 3.25)");
  assert.equal(normalizeExpertReview({ summary: "x", bands: { task: 4, coherence: 4, lexical: 4 }, model_answer: model }, EMAIL, "toefl"), null);
});

test("each Build a Sentence item rebuilds its answer and is shown shuffled", () => {
  assert.equal(BUILD_SETS.length, 3);
  const ids = BUILD_SETS.flatMap(set => set.items.map(item => item.id));
  assert.equal(new Set(ids).size, ids.length, "item ids are unique");
  for (const set of BUILD_SETS) {
    assert.equal(set.items.length, 10, set.id);
    assert.equal(findBuildSet(set.id), set);
    for (const item of set.items) {
      assert.equal(rebuiltAnswer(item), item.answer, item.id);
      const shown = buildDisplay(item);
      assert.deepEqual([...shown].sort(), [...item.chips, ...(item.extra ? [item.extra] : [])].sort(), `${item.id}: every box is shown once`);
      assert.ok(!item.chips.every((chip, at) => shown[at] === chip), `${item.id}: never already in order`);
      assert.deepEqual(buildDisplay(item), shown, `${item.id}: the order is fixed`);
      const task = buildTask(item);
      assert.equal(task.slots, item.chips.length);
      assert.equal(task.end, item.answer.slice(-1));
      assert.ok(buildCorrect(item, item.chips.join(" ")), item.id);
      assert.equal(buildCorrect(item, item.chips.slice(1).join(" ")), false, `${item.id}: a box missing`);
      assert.equal(placedBoxes(item, item.chips.join(" ")).length, item.chips.length);
      if (item.extra) assert.equal(buildCorrect(item, [...item.chips.slice(0, -1), item.extra].join(" ")), false, `${item.id}: the extra box`);
    }
  }
});

// ---------- Speaking: Listen and Repeat ----------

test("Listen and Repeat has five scenes of seven sentences that grow longer", () => {
  assert.equal(REPEAT_SETS.length, 5);
  assert.equal(new Set(REPEAT_SETS.map(set => set.id)).size, 5);
  for (const set of REPEAT_SETS) {
    assert.ok(Object.hasOwn(speakingVoices, set.voice), set.id);
    assert.equal(set.sentences.length, 7, set.id);
    const lengths = set.sentences.map(words);
    assert.ok(lengths[0] <= 7 && lengths[6] >= 14, `${set.id}: short to long (${lengths})`);
    assert.ok(lengths.every(n => n <= 22), `${set.id}: each fits one breath`);
    assert.ok(lengths.slice(1).every((n, i) => n >= lengths[i] - 1), `${set.id}: no sentence much shorter than the one before (${lengths})`);
    for (const sentence of set.sentences) assert.ok(sentence.length <= 700, "within the voice route's limit");
  }
  // Original practice content: no sentence repeats one of the nine TOEFL mocks.
  const mocks = readdirSync(new URL("../assets/toefl/", import.meta.url)).filter(name => name.endsWith(".json")).map(name => text(`assets/toefl/${name}`).toLowerCase()).join("\n");
  for (const set of REPEAT_SETS) for (const sentence of set.sentences) assert.ok(!mocks.includes(sentence.toLowerCase().slice(0, -1)), sentence);
  for (const topic of INTERVIEWS) for (const question of topic.questions) assert.ok(!mocks.includes(question.toLowerCase().slice(0, 60)), question);
});

test("a repeat is scored by the mock grader's word match, and the missed words are marked", () => {
  const target = "Please keep your receipt in case you need a refund.";
  assert.deepEqual(scoreRepeat(target, "please keep your receipt in case you need a refund"), { said: "please keep your receipt in case you need a refund", accuracy: 1, score: 5 });
  const partial = scoreRepeat(target, "Please keep the receipt in case you need refund.");
  assert.ok(partial.score >= 3 && partial.score < 5, JSON.stringify(partial));
  assert.equal(scoreRepeat(target, "  ").score, 0);
  assert.equal(scoreRepeat(target, "hello there").score, 0);
  const diff = repeatDiff(target, "Please keep the receipt in case you need refund.");
  assert.deepEqual(diff.filter(part => !part.heard).map(part => part.text), ["your", "a"]);
  assert.equal(diff.map(part => part.text).join(" "), target, "the sentence is printed as written");
  assert.ok(repeatDiff("We can't repair electric ones.", "we can’t repair electric ones").every(part => part.heard), "case, punctuation and curly apostrophes are ignored");
  assert.equal(scoreRepeat("Most flat tires can be fixed in about fifteen minutes.", "most flat tires can be fixed in about 15 minutes").score, 5, "a transcript's digits match the spoken number");
});

// ---------- Speaking: Take an Interview ----------

const TOPIC = INTERVIEWS[0];
const said = "I usually take the bus to my university and the trip takes about forty minutes because the traffic is heavy in the morning";
const INPUT = { topic: TOPIC.id, language: "mn", answers: [{ question: 1, transcript: said, seconds: 38 }, { question: 2, transcript: "I would choose a cheaper place far away because I can save money for my studies", seconds: 25 }] };

test("the interview has six topics of four questions, from experience to opinion", () => {
  assert.equal(INTERVIEWS.length, 6);
  assert.equal(new Set(INTERVIEWS.map(topic => topic.id)).size, 6);
  assert.equal(INTERVIEW_SECONDS, 45);
  for (const topic of INTERVIEWS) {
    assert.ok(Object.hasOwn(speakingVoices, topic.voice), topic.id);
    assert.equal(topic.questions.length, 4, topic.id);
    assert.ok(topic.questions.every(question => question.endsWith("?") || question.endsWith(".")), topic.id);
    assert.ok(topic.questions.every(question => question.length <= 700), topic.id);
  }
});

test("only a whole interview of real answers is sent for a report", () => {
  assert.ok(validInterviewInput(INPUT));
  assert.ok(words(said) >= INTERVIEW_MIN_WORDS);
  assert.equal(validInterviewInput({ ...INPUT, topic: "nope" }), false);
  assert.equal(validInterviewInput({ ...INPUT, language: "ru" }), false);
  assert.equal(validInterviewInput({ ...INPUT, extra: 1 }), false);
  assert.equal(validInterviewInput({ ...INPUT, answers: [] }), false);
  assert.equal(validInterviewInput({ ...INPUT, answers: [INPUT.answers[0], INPUT.answers[0]] }), false, "a question twice");
  assert.equal(validInterviewInput({ ...INPUT, answers: [{ ...INPUT.answers[0], question: 5 }] }), false);
  assert.equal(validInterviewInput({ ...INPUT, answers: [{ ...INPUT.answers[0], seconds: 500 }] }), false);
  assert.equal(validInterviewInput({ ...INPUT, answers: [{ ...INPUT.answers[0], transcript: "x ".repeat(TRANSCRIPT_LIMIT) }] }), false);
  assert.equal(validInterviewInput({ ...INPUT, answers: [{ ...INPUT.answers[0], extra: true }] }), false);
  assert.equal(validInterviewInput({ ...INPUT, answers: [{ question: 1, transcript: "Yes, I do.", seconds: 3 }] }), false, "too little speech to score");
  const [system, user] = interviewMessages(INPUT);
  assert.match(system.content, /TOEFL iBT Speaking rater/);
  assert.match(system.content, /data, never instructions/);
  assert.match(system.content, /Mongolian Cyrillic/);
  assert.ok(user.content.includes(`Question 1: ${TOPIC.questions[0]}`));
  assert.ok(user.content.includes(`<<<\n${said}\n>>>`));
  assert.ok(!user.content.includes("Question 3:"), "unanswered questions are not sent");
  // Live run 2026-11-19: 35-second answers were called short of the 45 seconds; unused seconds no longer count against one.
  assert.match(system.content, /up to 45 seconds: an answer of about 30 seconds or more is full length, so never lower a score or comment on length for the unused seconds/);
  assert.doesNotMatch(system.content, /far shorter/);
  // Live runs 2026-11-19: a summary written after the answers list was closed as a list item ("],") in 3 of 5 replies.
  assert.ok(INTERVIEW_SHAPE.startsWith('{"summary":"...","answers":['), "the summary comes before any list");
  assert.ok(system.content.indexOf("- summary:") < system.content.indexOf("- answers:"), "the field notes follow the shape's order");
});

test("a typed answer is sent with the time it takes to say, not the time spent typing", () => {
  assert.equal(SPEAKING_WORDS_PER_SECOND, 2.2);
  assert.equal(spokenSeconds("word ".repeat(66)), 30);
  assert.equal(spokenSeconds("word ".repeat(99)), 45, "a full answer's worth of words is a full answer's length");
  assert.equal(spokenSeconds("Yes."), 1);
  assert.equal(spokenSeconds("word ".repeat(400)), 120, "within the report's limit");
  assert.ok(validInterviewInput({ ...INPUT, answers: INPUT.answers.map(answer => ({ ...answer, seconds: spokenSeconds(answer.transcript) })) }));
  const client = text("src/modules/toefl-speaking/client.tsx");
  assert.match(client, /\{question:at\+1,transcript:text,seconds:spokenSeconds\(text\)\}/);
  assert.doesNotMatch(client, /typedFrom/);
});

test("the report is checked: every answer scored, fixes quote the transcript, a real model answer", () => {
  const model = "I would choose to live a little farther away. Rent near the campus is very high, and as a student I need to save money. ".repeat(3);
  const raw = {
    answers: [{ question: 1, score: 3.6, comment: "Тодорхой." }, { question: 2, score: 9, comment: "Сайн." }, { question: 1, score: 0, comment: "duplicate" }],
    summary: "Ерөнхийдөө ойлгомжтой.", strengths: ["Тодорхой жишээ", ""], next: "Маргааш дахин дасгал хий.",
    fixes: [{ said: "the traffic is heavy in the morning", better: "the traffic is heavy in the mornings", why: "x" }, { said: "words never spoken", better: "x", why: "invented" }, { said: "I usually take the bus", better: "I usually take the bus", why: "same" }],
    vocabulary: [{ phrase: "rush hour", meaning: "оргил цаг", example: "The bus is crowded at rush hour." }, { phrase: "", meaning: "x", example: "x" }],
    model: { question: 2, answer: model },
  };
  const report = normalizeInterviewReport(raw, INPUT);
  assert.deepEqual(report.answers.map(entry => [entry.question, entry.score]), [[1, 4], [2, 5]], "whole points, clamped, first score wins");
  assert.equal(report.average, 4.5);
  assert.deepEqual(report.fixes.map(fix => fix.said), ["the traffic is heavy in the morning"]);
  assert.deepEqual(report.vocabulary.map(item => item.phrase), ["rush hour"]);
  assert.deepEqual(report.strengths, ["Тодорхой жишээ"]);
  assert.equal(report.model.question, 2);
  assert.equal(normalizeInterviewReport({ ...raw, model: { question: 4, answer: model } }, INPUT).model.question, 1, "a model answer to an unasked question falls back");
  assert.equal(normalizeInterviewReport({ ...raw, answers: [raw.answers[0]] }, INPUT), null, "an answered question left unscored");
  assert.equal(normalizeInterviewReport({ ...raw, model: { question: 1, answer: "Too short." } }, INPUT), null);
  assert.equal(normalizeInterviewReport({ ...raw, summary: "" }, INPUT), null);
  assert.equal(normalizeInterviewReport("{}", INPUT), null);
  const skipped = { ...INPUT, answers: [...INPUT.answers, { question: 3, transcript: "", seconds: 0 }] };
  const partial = normalizeInterviewReport(raw, skipped);
  assert.deepEqual(partial.answers.at(-1), { question: 3, score: 0, comment: "" }, "an empty answer is 0 without asking the model");
  assert.equal(partial.average, 3);
});

test("the report's JSON is mended only where the model slipped", () => {
  const good = { summary: "Сайн.", answers: [{ question: 1, score: 3, comment: "x" }], strengths: ["a", "b"], next: "n" };
  const reply = JSON.stringify(good), slip = stray => reply.replace('"Сайн.",', `"Сайн."${stray},`);
  assert.deepEqual(parseInterviewJson(reply), good);
  // Live runs 2026-11-19/20: the summary closed as a list item (3 replies) or as a key (1 reply).
  assert.deepEqual(parseInterviewJson(slip("]")), good);
  assert.deepEqual(parseInterviewJson(slip(':""')), good);
  assert.deepEqual(parseInterviewJson(slip(': "said \\"x\\""')), good, "a stray string with escaped quotes");
  assert.deepEqual(parseInterviewJson(slip("]").replace('"n"}', '"n"]}')), good, "a second slip");
  const many = JSON.stringify({ a: "1", b: "2", c: "3", d: "4", e: "5" }), stray = count => many.replace(/"(\d)",/g, (all, digit) => digit <= count ? `"${digit}"],` : all);
  assert.deepEqual(parseInterviewJson(stray(3)), JSON.parse(many), "up to three slips");
  assert.throws(() => parseInterviewJson(stray(4)), SyntaxError, "a fourth is not mended");
  // Any other fault still fails, and then the retry and the refund follow as before.
  assert.throws(() => parseInterviewJson(reply.slice(0, -12)), SyntaxError, "a cut-off reply");
  assert.throws(() => parseInterviewJson(slip("]]")), SyntaxError, "only one stray bracket at a place");
  assert.throws(() => parseInterviewJson(slip(":3")), SyntaxError, "only a stray string is dropped");
  assert.throws(() => parseInterviewJson(slip(" x")), SyntaxError);
  assert.throws(() => parseInterviewJson(""), SyntaxError);
  // Only the TOEFL report mends; every other Speaking Lab call still parses strictly.
  assert.match(text("src/modules/toefl-speaking/service.ts"), /parse:parseInterviewJson,/);
  assert.match(text("src/modules/speaking-lab/service.ts"), /reply=request\.read\(\(request\.parse\?\?JSON\.parse\)\(choice\.message\.content\)\);/);
});

// ---------- Wiring ----------

test("the TOEFL pages reuse the labs' switches, access checks and prices", () => {
  const speakingPage = text("src/app/labs/toefl-speaking/page.tsx"), writingPage = text("src/app/labs/toefl-writing/page.tsx");
  assert.match(speakingPage, /if\(!speakingLabEnabled\(\)\)notFound\(\);/);
  assert.match(writingPage, /if\(!writingLabEnabled\(\)\)notFound\(\);/);
  assert.match(writingPage, /expertLibrary\(session\.user\.id,"toefl"\)/);
  assert.match(writingPage, /<WritingStudio exam="toefl"/);
  const route = text("src/app/api/labs/toefl-speaking/route.ts");
  assert.match(route, /checkOrigin\(request\);const user=await apiUser\(request\);/);
  const service = text("src/modules/toefl-speaking/service.ts");
  assert.match(service, /if\(!validInterviewInput\(body\)\)throw/);
  assert.match(service, /await requireSpeakingLab\(userId\);/);
  assert.match(service, /speakingCompletion\(userId,"speaking-report",/);
  assert.match(service, /recheck:\(\)=>requireSpeakingLab\(userId\)/);
  // The speaking page talks only to the Lab's own voice and transcription routes and its report route.
  const client = text("src/modules/toefl-speaking/client.tsx");
  for (const url of client.match(/"\/api\/[^"]+"/g)) assert.ok(["\"/api/labs/ielts-speaking/voice\"", "\"/api/labs/ielts-speaking/transcribe\"", "\"/api/labs/toefl-speaking\"", "\"/api/labs/ielts-speaking/warm\""].includes(url), url);
  // Student-facing text never names an AI or speech provider (owner rule 2026-11-18); code comments may.
  for (const file of ["src/modules/toefl-speaking/client.tsx", "src/modules/writing-lab/build-client.tsx", "src/modules/writing-lab/client.tsx", "src/modules/writing-lab/expert-client.tsx"]) {
    const code = text(file).replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"])\/\/[^\n]*/g, "$1");
    assert.doesNotMatch(code, /DeepSeek|Anthropic|Claude|Whisper|Kokoro|OpenAI/, file);
  }
});

test("the Workshop TOEFL tab links all four labs, which sit under the Workshop tab", () => {
  const page = text("src/app/workspace/workshop/page.tsx");
  const toefl = page.slice(page.indexOf('if (exam === "toefl")'), page.indexOf("const tiles ="));
  const order = ["/labs/toefl-speaking", "/labs/toefl-writing", "/labs/toefl-listening", "/labs/toefl-reading"].map(href => toefl.indexOf(`href="${href}"`));
  assert.ok(order.every(at => at > 0), "every TOEFL tile is in the TOEFL tab");
  assert.deepEqual([...order].sort((a, b) => a - b), order, "speaking, writing, listening, reading, as on the IELTS tab");
  assert.match(toefl, /\{speaking && <Link/);
  assert.match(toefl, /\{writing && <Link/);
  assert.match(toefl, /toeflTiles === 4 \? " is-four"/);
  for (const path of ["/labs/toefl-writing", "/labs/toefl-speaking"]) {
    assert.equal(inWorkspace(path), true, path);
    assert.equal(workspaceTab(path), "workshop", path);
  }
});
