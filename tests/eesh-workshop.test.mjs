import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { EESH_DRILL_SIZE, SHARED_ENGLISH_DOMAINS, domainTrends, drillChoices, drillEligible, drillFilter, drillHref, drillValue, eeshProgress, formatRuns, pickDrill, topicsOf, weakest } from "../src/modules/eesh-workshop/contracts.ts";
import { eeshInsights, eeshSubjects, eeshTopicIndex } from "../src/modules/eesh-workshop/insights.ts";
import { eeshForecast } from "../src/modules/eesh-workshop/forecast.ts";
import { WORKSHOP_EXAMS } from "../src/modules/language-decks/catalog.ts";
import { inWorkspace, workspaceTab } from "../src/modules/workspace/paths.ts";
import { mocksFor } from "../src/modules/exams/entrance/catalog.ts";
import { findExam } from "../src/modules/exams/definitions.ts";
import { mockPractice } from "../src/modules/exam-practice/form.ts";

const text = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const SUBJECTS = ["math", "physics", "chemistry", "biology", "english"];
// A seeded random source, so the drill's picks are repeatable here.
const seeded = seed => () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const practiceOf = slug => mockPractice(findExam(slug)).form.questions;

test("the ЭЕШ insights are built from the current papers and packs", () => {
  const run = spawnSync(process.execPath, ["scripts/build-eesh-insights.mjs", "--check"], { encoding: "utf8" });
  assert.equal(run.status, 0, run.stderr || run.stdout);
});

test("the insights, topic index and forecast carry no question text or answers", () => {
  for (const path of ["src/modules/eesh-workshop/insights.json", "src/modules/eesh-workshop/topic-index.json", "src/modules/eesh-workshop/forecast.json"]) {
    const raw = text(path);
    assert.doesNotMatch(raw, /"(prompt|options|answers?|answerDisplay|explanation|passage)"/);
    for (const subject of SUBJECTS) {
      const paper = findExam(mocksFor(subject)[0].slug);
      for (const question of paper.stages[0].questions.slice(0, 5)) if (question.prompt.length > 24) assert.equal(raw.includes(question.prompt), false, path + " holds a prompt");
    }
  }
  // The client drill gets only names and counts; the insights and service stay on the server.
  assert.doesNotMatch(text("src/modules/eesh-workshop/drill.tsx"), /insights|service|topic-index/);
});

test("each subject's format changes are the ones the papers show", () => {
  const runs = subject => formatRuns(eeshInsights(subject));
  // Mathematics: one format since 2015; 2020 has no paper.
  assert.deepEqual(runs("math").map(run => [run.from, run.to, run.missing, run.format.part1.count, run.format.part2.points]), [[2015, 2026, [2020], 36, 28]]);
  // Physics: 80 + 20 until 2016, 76 + 24 from 2017.
  assert.deepEqual(runs("physics").map(run => [run.from, run.to, run.format.part1.points, run.format.part2.points]), [[2015, 2016, 80, 20], [2017, 2026, 76, 24]]);
  assert.deepEqual(runs("physics")[1].notes, ["I хэсгийн оноо 80 → 76", "II хэсгийн оноо 20 → 24"]);
  // Biology: 46 choice items in 2026, 50 before.
  assert.deepEqual(runs("biology").map(run => [run.from, run.to, run.format.part1.count]), [[2020, 2025, 50], [2026, 2026, 46]]);
  // English: listening (12 points) only in 2018–2019.
  const english = runs("english");
  assert.equal(english[0].format.listening, 12);
  assert.ok(english.find(run => run.from === 2020).notes.includes("Хасагдсан: Сонсож ойлгох"));
  for (const insights of eeshSubjects()) for (const format of insights.formats) {
    assert.equal(format.part1.points + format.part2.points + format.listening, format.points, `${insights.subject} ${format.year}`);
  }
});

test("topic points by year add up to the paper, and the trends compare the first and last three years", () => {
  for (const insights of eeshSubjects()) {
    for (const year of insights.years) assert.equal(Math.round(insights.domains.reduce((sum, domain) => sum + domain.points[String(year)], 0)), 100, `${insights.subject} ${year}`);
    const trend = domainTrends(insights)[0], domain = insights.domains.find(item => item.name === trend.name);
    assert.equal(trend.delta, Math.round((domain.late - domain.early) * 10) / 10);
  }
  const math = eeshInsights("math").domains.find(domain => domain.name === "Тригонометр");
  assert.ok(math.late > math.early, "Trigonometry grew in the mathematics papers");
  // Physics follows each year's own paper (2026-11-20), so its topics are counted by year like the other subjects.
  assert.ok(eeshInsights("physics").topics.some(topic => topic.years.length > 0 && topic.years.length < eeshInsights("physics").years.length));
});

test("every recurring topic is named, ranked by years on the paper, and has a domain", () => {
  for (const insights of eeshSubjects()) {
    assert.ok(insights.topics.length >= 14, insights.subject);
    for (const topic of insights.topics) {
      assert.ok(topic.label && topic.domain && insights.domains.some(domain => domain.name === topic.domain), `${insights.subject} ${topic.id}`);
      assert.ok(topic.years.every(year => insights.years.includes(year)));
    }
    for (let i = 1; i < insights.topics.length; i++) assert.ok(insights.topics[i - 1].years.length >= insights.topics[i].years.length);
  }
});

test("the topic index names a topic for every Part I question of every paper", () => {
  for (const subject of SUBJECTS) for (const meta of mocksFor(subject)) {
    const topics = topicsOf(eeshTopicIndex, subject, meta.slug, meta.year);
    const paper = findExam(meta.slug);
    const partOne = paper.stages[0].questions.filter(question => subject === "english" || question.groupId === "part-1");
    for (const question of partOne) assert.ok(topics[question.number], `${meta.slug} #${question.number}`);
  }
});

test("the built drill counts match the drill rule on the practice questions", () => {
  for (const insights of eeshSubjects()) {
    const english = insights.subject === "english", byDomain = {}, byTopic = {};
    for (const meta of mocksFor(insights.subject)) {
      const topics = topicsOf(eeshTopicIndex, insights.subject, meta.slug, meta.year);
      for (const question of practiceOf(meta.slug).filter(item => drillEligible(item, english))) {
        byDomain[question.domain] = (byDomain[question.domain] ?? 0) + 1;
        if (topics[question.label]) byTopic[topics[question.label]] = (byTopic[topics[question.label]] ?? 0) + 1;
      }
    }
    for (const domain of insights.domains) assert.equal(domain.drill, byDomain[domain.name] ?? 0, `${insights.subject} ${domain.name}`);
    for (const topic of insights.topics) assert.equal(topic.drill, byTopic[topic.id] ?? 0, `${insights.subject} ${topic.id}`);
    const free = practiceOf(insights.free.slug).filter(item => drillEligible(item, english));
    assert.equal(Object.values(insights.free.domains).reduce((a, b) => a + b, 0), free.length);
  }
});

test("the drill takes only questions that stand alone", () => {
  const english = practiceOf(mocksFor("english").at(-1).slug);
  assert.ok(english.filter(question => SHARED_ENGLISH_DOMAINS.includes(question.domain)).every(question => !drillEligible(question, true)));
  assert.ok(english.filter(question => question.passage || question.context || question.wordBank?.length).every(question => !drillEligible(question, true)));
  const math = practiceOf(mocksFor("math")[0].slug);
  assert.equal(math.filter(question => drillEligible(question, false)).length, 36);
  assert.ok(math.filter(question => question.task).every(question => !drillEligible(question, false)), "Part II tasks stay in the full mock");
});

test("the drill spreads ten questions over the years and skips checked ones", () => {
  const insights = eeshInsights("math"), topic = "logarithm";
  const papers = mocksFor("math").map(meta => ({ slug: meta.slug, year: meta.year, form: meta.form, questions: practiceOf(meta.slug), topics: topicsOf(eeshTopicIndex, "math", meta.slug, meta.year), checked: new Set() }));
  const picks = pickDrill(papers, { topic }, false, EESH_DRILL_SIZE, seeded(7));
  assert.equal(picks.length, EESH_DRILL_SIZE);
  assert.ok(picks.every(item => item.topic === topic && item.options.length && !("answers" in item) && !("explanation" in item)));
  // Never the same item number twice in one year (a year's forms are parallel versions of one item).
  assert.equal(new Set(picks.map(item => item.year + ":" + item.label)).size, picks.length);
  const years = insights.topics.find(item => item.id === topic).years.length;
  assert.ok(new Set(picks.map(item => item.year)).size >= Math.min(years, 8), "one year at a time");
  assert.deepEqual(pickDrill(papers, { topic }, false, EESH_DRILL_SIZE, seeded(7)), picks, "repeatable for one random source");
  // Checked questions do not come back.
  const checked = papers.map(paper => ({ ...paper, checked: new Set(picks.filter(item => item.slug === paper.slug).map(item => item.id)) }));
  const again = pickDrill(checked, { topic }, false, EESH_DRILL_SIZE, seeded(7));
  assert.equal(again.filter(item => picks.some(old => old.slug === item.slug && old.id === item.id)).length, 0);
  // A domain drill can use the free paper, which has no year.
  const free = { slug: insights.free.slug, year: null, form: "Үнэгүй", questions: practiceOf(insights.free.slug), topics: {}, checked: new Set() };
  const domain = Object.keys(insights.free.domains)[0];
  const fromFree = pickDrill([free], { domain }, false, EESH_DRILL_SIZE, seeded(3));
  assert.equal(fromFree.length, Math.min(EESH_DRILL_SIZE, insights.free.domains[domain]));
  assert.ok(fromFree.every(item => item.year === null && item.domain === domain));
  // English keeps the task's directions with the question.
  const english = mocksFor("english").map(meta => ({ slug: meta.slug, year: meta.year, form: meta.form, questions: practiceOf(meta.slug), topics: topicsOf(eeshTopicIndex, "english", meta.slug, meta.year), checked: new Set() }));
  const errorId = pickDrill(english, { topic: "error-id" }, true, EESH_DRILL_SIZE, seeded(5));
  assert.ok(errorId.length && errorId.every(item => /underlined/i.test(item.instructions ?? "")));
});

test("the drill accepts only a known topic or domain of the subject", () => {
  const insights = eeshInsights("chemistry");
  const params = query => new URLSearchParams(query);
  assert.deepEqual(drillFilter(insights, params("topic=equilibrium")), { topic: "equilibrium" });
  assert.deepEqual(drillFilter(insights, params("domain=Термохими")), { domain: "Термохими" });
  assert.equal(drillFilter(insights, params("topic=logarithm")), null);
  assert.equal(drillFilter(insights, params("topic=equilibrium&domain=Термохими")), null);
  assert.equal(drillFilter(insights, params("")), null);
  // English reading has no standalone question, so it is not offered.
  assert.equal(drillFilter(eeshInsights("english"), params("topic=reading-mc")), null);
  assert.equal(eeshInsights("history"), undefined);
});

test("weak topics come from the student's checked practice answers", () => {
  const insights = eeshInsights("math"), meta = mocksFor("math")[0];
  const questions = findExam(meta.slug).stages[0].questions.map(question => ({ id: question.id, number: question.number, domain: question.domain }));
  const topics = topicsOf(eeshTopicIndex, "math", meta.slug, meta.year);
  const results = Object.fromEntries(questions.slice(0, 12).map((question, i) => [question.id, { correct: i % 3 === 0 }]));
  results[questions[13].id] = { correct: null };
  results["unknown-id"] = { correct: true };
  const progress = eeshProgress(insights, [{ questions, topics, results }]);
  assert.equal(progress.checked, 12);
  assert.equal(progress.domains.reduce((sum, item) => sum + item.checked, 0), 12);
  assert.ok(progress.topics.every(item => insights.topics.some(topic => topic.id === item.id)));
  const list = weakest([{ checked: 4, correct: 3 }, { checked: 2, correct: 0 }, { checked: 5, correct: 1 }, { checked: 3, correct: 1 }]);
  assert.deepEqual(list, [{ checked: 5, correct: 1 }, { checked: 3, correct: 1 }, { checked: 4, correct: 3 }]);
});

test("ЭЕШ is a Workshop tab whose subject pages sit in the Workspace, and the drill keeps the server checks", () => {
  assert.ok(WORKSHOP_EXAMS.some(exam => exam.id === "eesh" && exam.label === "ЭЕШ"));
  assert.equal(inWorkspace("/labs/eesh/math"), true);
  assert.equal(workspaceTab("/labs/eesh/english"), "workshop");
  const page = text("src/app/workspace/workshop/page.tsx");
  assert.match(page, /exam === "eesh"/);
  assert.match(page, /"\/labs\/eesh\/" \+ insights\.subject/);
  const route = text("src/app/api/labs/eesh-drill/route.ts"), service = text("src/modules/eesh-workshop/service.ts");
  assert.match(route, /apiUser\(request\)/);
  assert.match(route, /drillFilter\(insights, params\)/);
  // The hub lookup only narrows; each paper used is checked again (access and open sitting), then answers go to the practice check.
  assert.match(service, /await requirePractice\(userId, slug\)/);
  assert.match(service, /activeTimedSitting\(userId\)/);
  assert.match(text("src/modules/eesh-workshop/drill.tsx"), /\/api\/exam-practice\/\$\{item\.slug\}\/check/);
});

test("«Дасгал» opens the drill page at the topic or area's own address, and sign-in returns there", () => {
  const math = eeshInsights("math");
  assert.equal(drillHref("math"), "/labs/eesh/math/drill");
  assert.equal(drillHref("math", "topic:logarithm"), "/labs/eesh/math/drill?topic=logarithm");
  assert.equal(drillHref("math", "domain:Функц, анализ"), "/labs/eesh/math/drill?domain=" + encodeURIComponent("Функц, анализ"));
  // Every picker value survives the trip through its address (the page reads ?topic= before ?domain=).
  for (const choice of drillChoices(math)) {
    const query = Object.fromEntries(new URL(drillHref("math", choice.value), "http://x").searchParams);
    assert.equal(drillValue(query), choice.value);
  }
  assert.equal(drillValue({ topic: "logarithm", domain: "Алгебр" }), "topic:logarithm");
  assert.equal(drillValue({ topic: "" }), undefined);
  assert.ok(drillChoices(math).every(choice => choice.count > 0 || choice.free > 0));
  assert.match(text("src/modules/eesh-workshop/view.tsx"), /href=\{drillHref\(subject, "topic:" \+ topic\.id\)\}/);
  assert.match(text("src/app/labs/eesh/[subject]/page.tsx"), /redirect\(drillHref\(insights\.subject, value\)\)/);
  // Sign-in may return only to the five exact drill paths (return-path.ts is server-only, so its text is checked).
  assert.ok(text("src/lib/return-path.ts").includes(String.raw`/^\/labs\/eesh\/(math|physics|chemistry|biology|english)\/drill$/.test(value)`));
});

test("the 2027 forecast follows the latest paper, adds up, and names only known topics and areas", () => {
  for (const subject of SUBJECTS) {
    const forecast = eeshForecast(subject), insights = eeshInsights(subject), latest = insights.formats.at(-1);
    assert.equal(forecast.target, insights.years.at(-1) + 1, subject);
    // Years whose mocks copy another year (physics 2024) are left out of the forecast.
    assert.equal(forecast.years, insights.years.length - forecast.skipped.length, subject);
    const { year, forms, ...format } = latest;
    assert.deepEqual(forecast.format, format, subject + " format");
    // Positions: every Part I question of the latest paper and each Part II task.
    const part1 = forecast.positions.filter(position => position.part === 1), part2 = forecast.positions.filter(position => position.part === 2);
    assert.equal(part1.length, latest.part1.count, subject + " Part I positions");
    assert.ok(part2.length >= 1 && part2.length <= latest.part2.count, subject + " Part II tasks");
    assert.ok(Math.abs(forecast.positions.reduce((total, position) => total + position.points, 0) - latest.points) < 0.5, subject + " position points");
    assert.ok(Math.abs(forecast.domains.reduce((total, domain) => total + domain.points, 0) - latest.points) < 0.1 * forecast.domains.length + 0.5, subject + " domain points");
    const topics = new Set(insights.topics.map(topic => topic.id)), areas = new Set(insights.domains.map(domain => domain.name));
    for (const block of forecast.makeup) {
      assert.equal(block.size, forecast.positions.filter(position => position.part === block.part).length, subject + " make-up size");
      assert.equal(block.items.reduce((total, item) => total + item.questions, 0), block.size, subject + " make-up adds up");
      for (const item of block.items) assert.ok(block.by === "topic" ? topics.has(item.key) : areas.has(item.key), subject + " make-up key " + item.key);
    }
    for (const position of forecast.positions) {
      for (const pick of position.picks) assert.ok(topics.has(pick.topic), subject + " pick " + pick.topic);
      for (const area of position.areas) assert.ok(areas.has(area.name), subject + " area " + area.name);
      assert.ok(position.picks.length || position.areas.length, subject + " position " + position.pos + " names something");
      // Exercise types are Mongolian (physics tags and Part II task titles already were; the rest are labelled in the build).
      for (const skill of position.skills) assert.match(skill.label, /[А-Яа-яӨөҮүЁё]/, subject + " skill " + skill.label);
    }
    for (const topic of forecast.topics) {
      assert.ok(topics.has(topic.id), subject + " topic " + topic.id);
      for (const skill of topic.skills) assert.match(skill.label, /[А-Яа-яӨөҮүЁё]/, subject + " skill " + skill.label);
      assert.ok(topic.p >= 0 && topic.p <= 1, subject + " chance " + topic.id);
    }
    for (const domain of forecast.domains) assert.ok(domain.low <= domain.points && domain.points <= domain.high, subject + " range " + domain.name);
    assert.equal(forecast.backtest.years.length, 3, subject + " backtest years");
    for (const run of forecast.backtest.years) assert.ok(run.year < forecast.target && run.makeup > 0 && run.makeup <= 1, subject + " backtest " + run.year);
    for (const year of forecast.skipped) assert.ok(!forecast.backtest.years.some(run => run.year === year), subject + " skipped " + year);
  }
  // Physics 2024 copies 2026 (no 2024 paper was found), so the forecast leaves it out.
  const physics = eeshForecast("physics");
  assert.deepEqual(physics.skipped, [2024]);
  assert.equal(physics.years, eeshInsights("physics").years.length - 1);
});

test("the forecast page is public, shows no provider name, and the subject page links to it", () => {
  const view = text("src/modules/eesh-workshop/forecast-view.tsx"), page = text("src/app/labs/eesh/[subject]/forecast/page.tsx");
  assert.doesNotMatch(view, /deepseek|openai|chatgpt|claude|gemini/i);
  assert.doesNotMatch(view + page, /service|topic-index|getSession/, "names and numbers only, no answers or account data");
  assert.match(page, /notFound\(\)/);
  assert.ok(text("src/modules/eesh-workshop/view.tsx").includes("href={`/labs/eesh/${subject}/forecast`}"), "the subject page links to its forecast");
  assert.equal(eeshForecast("history"), undefined);
});
