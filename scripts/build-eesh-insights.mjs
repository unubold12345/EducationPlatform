// Builds the ЭЕШ Workshop's year-by-year insights from the site's ЭЕШ papers and the offline packs they were written from:
//   src/modules/eesh-workshop/insights.json     client-safe: formats, changes, topic points by year, recurring topics
//   src/modules/eesh-workshop/topic-index.json  which topic each question number tests, per subject and year (no answers)
//   src/modules/eesh-workshop/forecast.json     client-safe: next year's predicted paper (scripts/eesh-insights/forecast.mjs)
// Inputs: assets/entrance-mocks/<subject>/*.json (the served papers, for formats, domains and drill counts),
// MockExmps/<Subject>/<year>/ (blueprint.json and mock-0N.json: the skill each item tests) and the topic grouping in
// scripts/eesh-insights/topics.json. English has no skill tags; its task types come from each task's directions (RULES).
// The forecast names exercise types by the Mongolian skill labels in scripts/eesh-insights/skills-mn.json.
// Run `node scripts/build-eesh-insights.mjs` after an ЭЕШ paper or pack changes; `--check` fails when the outputs are stale.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { backtest, chooseSettings, composition, domainPoints, ranked, round1, round3, share, topicChances, topicCounts, votePositions, yearCounts, yearDomains, yearPositions } from "./eesh-insights/forecast.mjs";

const PAPERS = join("assets", "entrance-mocks");
const FREE = join("assets", "free-mocks");
const PACKS = { math: "Math", physics: "Physics", chemistry: "Chemistry", biology: "Biology", english: "English" };
const SUBJECTS = ["math", "physics", "chemistry", "biology", "english"];
const LABELS = { math: "Математик", physics: "Физик", chemistry: "Хими", biology: "Биологи", english: "Англи хэл" };
const OUT = join("src", "modules", "eesh-workshop", "insights.json");
const INDEX = join("src", "modules", "eesh-workshop", "topic-index.json");
const FORECAST = join("src", "modules", "eesh-workshop", "forecast.json");
const SKILL_LABELS = join("scripts", "eesh-insights", "skills-mn.json");
const TOPICS = JSON.parse(readFileSync(join("scripts", "eesh-insights", "topics.json"), "utf8"));
// English shared-text tasks: the drill leaves them out (it shows one question at a time, without the passage).
const SHARED_ENGLISH = ["Уншиж ойлгох", "Хэсэг II", "Сонсож ойлгох"];
// Shown under the subject's charts: what the numbers can and cannot say.
const NOTES = {
  math: "2020 оны mock байхгүй. 2022–2026 оны mock-ууд албан ёсны хувилбарын хэвлэмэл хуулбар дээр суурилсан.",
  physics: "Физикийн mock бүр тухайн оны албан ёсны хувилбарын сэдвийн дарааллыг дагадаг (2016: D хувилбар). 2024 оны хувилбар олдоогүй тул 2024 оны mock 2026 оны дарааллыг дагадаг, таамагт ороогүй. 2015, 2017, 2021, 2022 оны II хэсгийн даалгавар олдоогүй тул 2026 оныхыг дагадаг.",
  chemistry: "2024 оны mock байхгүй. 2020–2023 оны II хэсэг урьдчилсан хувилбар.",
  biology: "Сэдвийн тооцоонд зөвхөн I хэсэг (сонгох даалгавар) орсон. 2024 оны албан ёсны хувилбарын бүтэн эх олдоогүй.",
  english: "2021 оны албан ёсны англи хэлний хувилбар олдоогүй тул mock байхгүй.",
};

// Years whose mocks copy another year's sequence because no paper of their own was found (year → the year copied): they stay
// in the charts and the drill, with the subject's note, and are left out of the forecast.
const COPIED = { physics: { 2024: 2026 } };

const problems = [];
const fail = message => problems.push(message);
const read = path => JSON.parse(readFileSync(path, "utf8"));
const round = value => Math.round(value * 10) / 10;
const sum = list => list.reduce((total, value) => total + value, 0);
const mostCommon = list => [...list.reduce((map, value) => map.set(value, (map.get(value) ?? 0) + 1), new Map())].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))[0]?.[0];
const formNumber = form => Number(String(form).replace(/\D/g, ""));
const SKILLS_MN = existsSync(SKILL_LABELS) ? read(SKILL_LABELS) : {};
const cyrillic = text => /[А-Яа-яӨөҮүЁё]/.test(text);
/** The exercise type a skill tag names, in Mongolian (physics tags and Part II task titles already are). */
function skillLabel(subject, skill) {
  if (!skill) return null;
  if (subject === "physics" || cyrillic(skill)) return skill;
  const label = SKILLS_MN[subject]?.[skill];
  if (!label) fail(`${subject}: skill "${skill}" has no Mongolian label in ${SKILL_LABELS}`);
  return label ?? skill;
}
// Site numbers are "1".."46" for Part I and "2.1a".."2.4h" for the parts of a Part II task.
const taskOf = number => /^(\d+\.\d+)[a-z]$/.exec(number)?.[1] ?? number;

/** English task type from a task's section and directions. Order matters: the first match wins. */
const RULES = [
  [/listening/i, "listening", "section"],
  [/underlined (part|word).*(correct|not correct)|identify .*underlined/i, "error-id"],
  [/key ?word|transformed/i, "transform"],
  [/linking words/i, "grammar-gap"],
  [/phrasal|particle/i, "phrasal"],
  [/idiom/i, "idioms"],
  [/prefix|suffix|word forms?\b|correct form/i, "word-building"],
  [/synonym|antonym|opposite|similar meaning/i, "synonyms"],
  [/definition/i, "definitions"],
  [/collocation|preposition|different meanings/i, "collocation"],
  [/beginnings|ending|match the jobs|combine each phrase|column a/i, "matching"],
  [/conversation|response|reaction|polite|situation|suggestion|answer for each question|goes with the answers|solution to the problem/i, "conversation"],
];
function englishTopic(group) {
  const section = group.section ?? "", text = group.instructions ?? "";
  for (const [pattern, topic, field] of RULES) if (pattern.test(field === "section" ? section : text)) return topic;
  if (/READING/.test(section)) return /summary|blank|gap|fill|complete/i.test(text) ? "reading-gap" : "reading-mc";
  if (/PART II/.test(section)) return /passage|text|paragraph|story|survey/i.test(text) ? "reading-gap" : "vocab-gap";
  if (/GRAMMAR/.test(section)) return "grammar-gap";
  if (/VOCABULARY/.test(section)) return "vocab-gap";
  if (/COMMUNICATION/.test(section)) return "conversation";
  fail(`English task type unknown: ${section} · ${text.slice(0, 60)}`);
  return "vocab-gap";
}

function papersOf(subject) {
  const folder = join(PAPERS, subject);
  return readdirSync(folder).filter(name => name.endsWith(".json")).sort().map(name => read(join(folder, name)))
    .sort((a, b) => a.year - b.year || formNumber(a.form) - formNumber(b.form));
}
const packFile = (subject, year, name) => join("MockExmps", PACKS[subject], String(year), name);
const packItems = mock => Array.isArray(mock.questions) ? mock.questions : mock.sections.flatMap(section => section.questions ?? []);
const packTasks = mock => Array.isArray(mock.questions) ? [] : mock.sections.flatMap(section => section.tasks ?? []);
function topicOfSkill(subject, skill, where) {
  const topic = TOPICS[subject].skills?.[skill];
  if (!topic) fail(`${where}: skill "${skill}" has no topic in scripts/eesh-insights/topics.json`);
  return topic;
}

/** number → topic for one paper, from the pack form it was written from (English: from each task's directions). */
function paperTopics(subject, paper) {
  const map = {};
  if (subject === "english") {
    for (const group of paper.groups) {
      const topic = englishTopic(group);
      for (const question of paper.questions) if (question.groupId === group.id) map[question.number] = topic;
    }
    return map;
  }
  const file = packFile(subject, paper.year, `mock-${String(formNumber(paper.form)).padStart(2, "0")}.json`);
  if (!existsSync(file)) { fail(`${paper.slug}: no pack form ${file}`); return map; }
  const mock = read(file), bySkill = new Map();
  for (const item of packItems(mock)) bySkill.set(String(item.number ?? item.id), item.skill);
  for (const task of packTasks(mock)) bySkill.set(String(task.id), task.skill ?? task.topic);
  for (const question of paper.questions) {
    const skill = bySkill.get(question.number) ?? bySkill.get(taskOf(question.number));
    // Biology's Part II tasks carry free-text topics the grouping does not cover; Part I is what the drill uses.
    if (!skill) { if (question.groupId === "part-1") fail(`${paper.slug} #${question.number}: no skill in ${file}`); continue; }
    if (subject === "biology" && question.groupId !== "part-1") continue;
    const topic = TOPICS[subject].skills?.[skill];
    if (topic) map[question.number] = topic;
    else if (question.groupId === "part-1" || subject !== "biology") fail(`${paper.slug} #${question.number}: skill "${skill}" has no topic`);
  }
  return map;
}

/** Every question of one paper with its part, points, domain, topic and skill: the forecast's input. */
function paperItems(subject, paper) {
  const groups = new Map(paper.groups.map(group => [group.id, group])), topics = paperTopics(subject, paper), skills = new Map();
  const file = subject === "english" ? null : packFile(subject, paper.year, `mock-${String(formNumber(paper.form)).padStart(2, "0")}.json`);
  if (file && existsSync(file)) {
    const mock = read(file);
    for (const item of packItems(mock)) skills.set(String(item.number ?? item.id), item.skill);
    for (const task of packTasks(mock)) skills.set(String(task.id), task.skill ?? task.topic);
  }
  return paper.questions.map(question => ({
    number: question.number, part: isPart2(subject, groups.get(question.groupId)) ? 2 : 1, points: Number(question.points ?? 1), domain: question.domain,
    topic: topics[question.number] ?? null, skill: skills.get(question.number) ?? skills.get(taskOf(question.number)) ?? null,
  }));
}

/** The skills of one year's reference paper, with points: what was on that year's ЭЕШ. */
function yearSkills(subject, year, firstPaper) {
  if (subject === "english") {
    return firstPaper.groups.map(group => ({ topic: englishTopic(group), points: sum(firstPaper.questions.filter(q => q.groupId === group.id).map(q => Number(q.points ?? 1))), questions: firstPaper.questions.filter(q => q.groupId === group.id).length }));
  }
  if (subject === "physics") {
    return packItems(read(packFile(subject, year, "mock-01.json"))).map(item => ({ topic: topicOfSkill(subject, item.skill, `physics ${year}`), points: Number(item.points ?? 1), questions: 1 }));
  }
  const blueprint = read(packFile(subject, year, "blueprint.json"));
  if (subject === "math") return blueprint.mapping.map(entry => ({ topic: topicOfSkill(subject, entry.skill, `math ${year}`), points: Number(entry.points ?? 1), questions: 1 }));
  if (subject === "chemistry") return [...blueprint.items.map(item => ({ skill: item.skill, points: item.points })), ...(blueprint.tasks ?? []).map(task => ({ skill: task.skill ?? task.topic ?? task.title, points: task.points ?? 8 }))]
    .map(entry => ({ topic: topicOfSkill(subject, entry.skill, `chemistry ${year}`), points: Number(entry.points ?? 1), questions: 1 }));
  return blueprint.partI.items.map(item => ({ topic: topicOfSkill(subject, item.authoringSkill, `biology ${year}`), points: Number(item.points ?? 1), questions: 1 }));
}

const isPart2 = (subject, group) => subject === "english" ? /PART II/.test(group?.section ?? "") : group?.id !== "part-1";
/** The drill's rule, on stored papers (src/modules/eesh-workshop/contracts.ts applies the same rule to practice questions). */
function drillable(subject, paper, question) {
  const group = paper.groups.find(item => item.id === question.groupId);
  if (question.kind !== "choice" || !question.options?.length || question.passage) return false;
  if (group?.context || question.context || group?.wordBank?.length || group?.figure || group?.kind === "listening") return false;
  if (subject === "english") return !SHARED_ENGLISH.includes(question.domain);
  return !(group?.instructions && group.pageMode === "group");
}

function formatOf(subject, paper) {
  const groups = new Map(paper.groups.map(group => [group.id, group]));
  const part1 = paper.questions.filter(q => !isPart2(subject, groups.get(q.groupId)) && q.domain !== "Сонсож ойлгох");
  const part2 = paper.questions.filter(q => isPart2(subject, groups.get(q.groupId)));
  const listening = paper.questions.filter(q => q.domain === "Сонсож ойлгох");
  const tasks = subject === "english" ? part2.length : new Set(part2.map(q => taskOf(q.number))).size;
  const points = list => sum(list.map(q => Number(q.points ?? 1)));
  return { minutes: paper.durationMinutes, points: paper.points, part1: { count: part1.length, points: points(part1) }, part2: { count: tasks, points: points(part2) }, listening: points(listening) };
}
const sameFormat = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function changeNotes(subject, previous, current, domainsBefore, domainsNow) {
  const notes = [];
  if (!previous) return notes;
  if (current.year - previous.year > 1) notes.push(current.year - previous.year === 2 ? `${previous.year + 1} оны mock байхгүй` : `${previous.year + 1}–${current.year - 1} онд mock байхгүй`);
  const part1 = subject === "english" ? "I хэсгийн асуулт" : "Сонгох асуулт", part2 = subject === "english" ? "II хэсгийн асуулт" : "II хэсгийн даалгавар";
  if (previous.minutes !== current.minutes) notes.push(`Хугацаа ${previous.minutes} → ${current.minutes} минут`);
  if (previous.part1.count !== current.part1.count) notes.push(`${part1} ${previous.part1.count} → ${current.part1.count}`);
  if (previous.part1.points !== current.part1.points) notes.push(`I хэсгийн оноо ${previous.part1.points} → ${current.part1.points}`);
  if (previous.part2.count !== current.part2.count) notes.push(`${part2} ${previous.part2.count} → ${current.part2.count}`);
  if (previous.part2.points !== current.part2.points) notes.push(`II хэсгийн оноо ${previous.part2.points} → ${current.part2.points}`);
  for (const domain of domainsNow) if (!domainsBefore.includes(domain)) notes.push(`Шинэ хэсэг: ${domain}`);
  for (const domain of domainsBefore) if (!domainsNow.includes(domain)) notes.push(`Хасагдсан: ${domain}`);
  return notes;
}

function subjectInsights(subject) {
  const papers = papersOf(subject);
  const years = [...new Set(papers.map(paper => paper.year))].sort((a, b) => a - b);
  const byYear = new Map(years.map(year => [year, papers.filter(paper => paper.year === year)]));
  const topicLabels = new Map(TOPICS[subject].topics.map(topic => [topic.id, topic.label]));
  const index = {};

  // Format per year: every form of a year should match; a mismatch is reported, not averaged away.
  const formats = years.map(year => {
    const list = byYear.get(year).map(paper => formatOf(subject, paper));
    if (list.some(format => !sameFormat(format, list[0]))) fail(`${subject} ${year}: forms differ in format`);
    return { year, forms: list.length, ...list[0] };
  });

  // Points per domain per year, averaged over the year's forms.
  const domainYear = new Map();
  for (const year of years) for (const paper of byYear.get(year)) for (const question of paper.questions) {
    const key = question.domain;
    if (!domainYear.has(key)) domainYear.set(key, new Map());
    const row = domainYear.get(key);
    row.set(year, (row.get(year) ?? 0) + Number(question.points ?? 1) / byYear.get(year).length);
  }
  const early = years.slice(0, 3), late = years.slice(-3);
  const domains = [...domainYear].map(([name, row]) => ({
    name,
    points: Object.fromEntries(years.map(year => [String(year), round(row.get(year) ?? 0)])),
    total: round(sum([...row.values()])),
    early: round(sum(early.map(year => row.get(year) ?? 0)) / early.length),
    late: round(sum(late.map(year => row.get(year) ?? 0)) / late.length),
    drill: 0,
  })).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
  const changes = formats.map((format, i) => {
    const present = year => domains.filter(domain => (domain.points[String(year)] ?? 0) > 0).map(domain => domain.name);
    return { year: format.year, notes: changeNotes(subject, formats[i - 1], format, i ? present(formats[i - 1].year) : [], present(format.year)) };
  }).filter(change => change.notes.length);

  // Topic index (per year when every form agrees, else per paper) and the drill's counts.
  // A topic's domain is the one its Part I questions carry most (a Part II task's many parts would outweigh them).
  const topicDomains = new Map(), partTwoDomains = new Map(), drillTopics = new Map();
  const note = (map, topic, domain) => (map.get(topic) ?? map.set(topic, []).get(topic)).push(domain);
  for (const year of years) {
    const maps = byYear.get(year).map(paper => ({ paper, map: paperTopics(subject, paper) }));
    const same = maps.every(item => JSON.stringify(item.map) === JSON.stringify(maps[0].map));
    for (const { paper, map } of maps) {
      if (!same) index[paper.slug] = map;
      for (const question of paper.questions) {
        const topic = map[question.number];
        if (topic && !topicLabels.has(topic)) fail(`${paper.slug}: topic ${topic} is not listed`);
        if (topic) note(isPart2(subject, paper.groups.find(group => group.id === question.groupId)) ? partTwoDomains : topicDomains, topic, question.domain);
        if (drillable(subject, paper, question)) {
          domains.find(domain => domain.name === question.domain).drill += 1;
          if (topic) drillTopics.set(topic, (drillTopics.get(topic) ?? 0) + 1);
        }
      }
    }
    if (same) index[String(year)] = maps[0].map;
  }

  // Recurring topics: in how many years each appeared on the reference paper, and with how many points.
  const perYear = new Map(years.map(year => [year, yearSkills(subject, year, byYear.get(year)[0])]));
  const topics = TOPICS[subject].topics.map(({ id, label }) => {
    const seen = years.filter(year => perYear.get(year).some(entry => entry.topic === id));
    const pointsIn = year => sum(perYear.get(year).filter(entry => entry.topic === id).map(entry => entry.points));
    const questionsIn = year => sum(perYear.get(year).filter(entry => entry.topic === id).map(entry => entry.questions));
    return {
      id, label, domain: mostCommon(topicDomains.get(id) ?? []) ?? mostCommon(partTwoDomains.get(id) ?? []) ?? "",
      years: seen,
      questions: sum(years.map(questionsIn)),
      points: round(sum(years.map(pointsIn))),
      recent: round(sum(late.map(pointsIn)) / late.length),
      drill: drillTopics.get(id) ?? 0,
    };
  }).filter(topic => topic.questions > 0)
    .sort((a, b) => b.years.length - a.years.length || b.recent - a.recent || b.points - a.points || a.label.localeCompare(b.label));
  for (const topic of topics) if (!topic.domain) fail(`${subject} ${topic.id}: no question on the site carries this topic`);

  // The subject's free paper joins the domain drill (it has no topic tags).
  const free = read(join(FREE, `eesh-${subject}-free.json`));
  const freeDomains = {};
  for (const question of free.questions) if (drillable(subject, free, question)) freeDomains[question.domain] = (freeDomains[question.domain] ?? 0) + 1;

  // Each year as positions (Part I questions, Part II tasks), for the forecast; a copied year would count its source twice.
  const copied = COPIED[subject] ?? {};
  const history = formats.filter(({ year }) => !(year in copied)).map(({ year, minutes, points, part1, part2, listening }) => yearPositions(year, byYear.get(year).map(paper => paperItems(subject, paper)), { minutes, points, part1, part2, listening }));

  return {
    insights: { subject, label: LABELS[subject], years, papers: papers.length, formats, changes, domains, topics, note: NOTES[subject], free: { slug: free.slug, domains: freeDomains } },
    index,
    history,
  };
}

/** Next year's paper for one subject: format, the likely topic and exercise at each position, domain points and each
 * topic's chance, with the backtest that says how far to trust it. */
function forecastOf(subject, history, info, settings) {
  const used = history, ref = used.at(-1);
  const topicIds = info.topics.map(topic => topic.id), labels = new Map(info.topics.map(topic => [topic.id, topic]));
  const slots = votePositions(used, settings);
  // A task with no topic (biology's Part II) shows its own area votes, unshrunk: with four tasks, the neighbours' pull named
  // the same area for all of them.
  const unshrunk = votePositions(used, { ...settings, beta: 0 });
  const chances = topicChances(used, slots, topicIds, settings);
  const next = domainPoints(used, slots, settings), last = yearDomains(ref);
  const test = backtest(history, topicIds, settings), spread = test?.domainError ?? 0;
  const pointsIn = (year, id) => year.positions.reduce((total, position) => total + (share(position.topics)[id] ?? 0) * position.points, 0);
  const questionsIn = (year, id) => year.positions.reduce((total, position) => total + (share(position.topics)[id] ?? 0), 0);
  const expected = {}, expectedQuestions = {}, topicSkills = {}, heads = {};
  for (const slot of slots) {
    for (const [id, p] of Object.entries(slot.topics)) { expected[id] = (expected[id] ?? 0) + p * slot.points; expectedQuestions[id] = (expectedQuestions[id] ?? 0) + p; }
    for (const [key, weight] of Object.entries(slot.skills)) { const [id, skill] = key.split("\u0000"); (topicSkills[id] ??= {})[skill] = (topicSkills[id][skill] ?? 0) + weight; }
    const head = ranked(slot.topics)[0]?.[0];
    if (head) (heads[head] ??= []).push(slot.pos);
  }
  const skillsOf = (votes, count) => { const list = ranked(votes ?? {}), total = list.reduce((sum, [, w]) => sum + w, 0); return list.slice(0, count).map(([skill, w]) => ({ label: skillLabel(subject, skill), share: round3(w / total) })); };
  const positions = slots.map((slot, j) => {
    const picks = ranked(slot.topics).filter(([, p], i) => i === 0 || p >= 0.05).slice(0, 3);
    const areas = picks.length ? [] : ranked(unshrunk[j].domains).filter(([, p], i) => i === 0 || p >= 0.05).slice(0, 3).map(([name, p]) => ({ name, p: round3(p) }));
    const head = picks[0]?.[0] ?? "", votes = {};
    for (const [key, weight] of Object.entries(slot.skills)) { const [id, skill] = key.split("\u0000"); if (id === head) votes[skill] = weight; }
    const before = ref.positions.find(position => position.pos === slot.pos);
    // The area shown is the likely topic's (a position's own area votes can disagree with it); a task with no topic keeps its own.
    return { pos: slot.pos, part: slot.part, points: round1(slot.points), picks: picks.map(([topic, p]) => ({ topic, p: round3(p) })), areas, domain: labels.get(head)?.domain ?? areas[0]?.name ?? ranked(slot.domains)[0]?.[0] ?? null, skills: skillsOf(votes, 2), last: before ? ranked(before.topics)[0]?.[0] ?? null : null, lastArea: before ? ranked(before.domains)[0]?.[0] ?? null : null };
  });
  const recent = used.slice(-3);
  const topics = info.topics.map(topic => {
    const p = chances[topic.id], points = expected[topic.id] ?? 0, lastPoints = pointsIn(ref, topic.id);
    const recentPoints = recent.reduce((total, year) => total + pointsIn(year, topic.id), 0) / recent.length;
    const trend = p === null ? null : !questionsIn(ref, topic.id) && p >= 0.5 ? "back" : points - recentPoints >= 1 ? "up" : points - recentPoints <= -1 ? "down" : "steady";
    return { id: topic.id, label: topic.label, domain: topic.domain, p: p === null ? null : round3(p), questions: round1(expectedQuestions[topic.id] ?? 0), points: round1(points), lastQuestions: round1(questionsIn(ref, topic.id)), lastPoints: round1(lastPoints), trend, positions: heads[topic.id] ?? [], skills: skillsOf(topicSkills[topic.id], 3), drill: topic.drill };
  }).filter(topic => topic.p === null ? topic.questions > 0 : topic.p >= 0.02 || topic.questions >= 0.05)
    .sort((a, b) => (b.p ?? 0) - (a.p ?? 0) || b.points - a.points || a.label.localeCompare(b.label));
  for (const position of positions) for (const pick of position.picks) if (!labels.has(pick.topic)) fail(`${subject} forecast: topic ${pick.topic} is not listed`);
  let stable = 1;
  while (stable < history.length && JSON.stringify(history.at(-1 - stable).format) === JSON.stringify(ref.format)) stable += 1;
  const domains = Object.entries(next).sort((a, b) => b[1] - a[1]).map(([name, points]) => ({ name, points: round1(points), last: round1(last[name] ?? 0), low: round1(Math.max(0, points - spread)), high: round1(points + spread) }));
  // The paper's make-up: whole questions per topic in each part (the backtest's "make-up" score measures this). A part with no
  // topics (biology's Part II) is counted by area instead, each year weighted as the topic chances are.
  const counts = topicCounts(used, slots, settings), lastCounts = yearCounts(ref);
  const areaCounts = (part, size) => {
    const out = {}, weight = year => (settings.topicHalf >= 99 ? 1 : 0.5 ** ((ref.year - year) / settings.topicHalf));
    let total = 0;
    for (const year of used) {
      const list = year.positions.filter(position => position.part === part);
      if (!list.length) continue;
      total += weight(year.year);
      for (const position of list) for (const [name, value] of Object.entries(share(position.domains))) out[name] = (out[name] ?? 0) + (weight(year.year) * value * size) / list.length;
    }
    return Object.fromEntries(Object.entries(out).map(([name, value]) => [name, value / (total || 1)]));
  };
  const lastAreas = part => { const out = {}; for (const position of ref.positions.filter(item => item.part === part)) for (const [name, value] of Object.entries(share(position.domains))) out[name] = (out[name] ?? 0) + value; return out; };
  const makeup = [1, 2].map(part => {
    const size = ref.positions.filter(position => position.part === part).length, byTopic = Object.keys(counts[part]).length > 0;
    const shown = composition(byTopic ? counts[part] : areaCounts(part, size), size), last = byTopic ? lastCounts[part] : lastAreas(part);
    const name = key => (byTopic ? labels.get(key)?.label : key) ?? key;
    return { part, size, by: byTopic ? "topic" : "area", items: Object.entries(shown).sort((a, b) => b[1] - a[1] || name(a[0]).localeCompare(name(b[0]))).map(([key, questions]) => ({ key, questions, last: round1(last[key] ?? 0) })) };
  }).filter(part => part.size);
  for (const part of makeup) for (const item of part.items) if (part.by === "topic" && !labels.has(item.key)) fail(`${subject} forecast: topic ${item.key} is not listed`);
  // Years left out (COPIED) and the papers the forecast does use.
  const skipped = Object.keys(COPIED[subject] ?? {}).map(Number).filter(year => info.years.includes(year));
  const papers = info.formats.filter(format => !skipped.includes(format.year)).reduce((total, format) => total + format.forms, 0);
  return { subject, label: LABELS[subject], target: ref.year + 1, from: history[0].year, to: ref.year, years: history.length, papers, skipped, format: ref.format, stable, makeup, positions, domains, topics, backtest: test };
}

const insights = {}, index = {}, histories = {};
for (const subject of SUBJECTS) {
  const built = subjectInsights(subject);
  insights[subject] = built.insights;
  index[subject] = built.index;
  histories[subject] = built.history;
}
// The forecast's settings: what best predicted each subject's last three known years from the years before them. Physics
// does not take part: its 2024 copies 2026 and four years' Part II copy 2026's, so it would tune the others to copies.
const settings = chooseSettings(SUBJECTS.filter(subject => subject !== "physics").map(subject => ({ history: histories[subject], topicIds: insights[subject].topics.map(topic => topic.id) })));
const forecast = { settings, subjects: Object.fromEntries(SUBJECTS.map(subject => [subject, forecastOf(subject, histories[subject], insights[subject], settings)])) };
if (problems.length) {
  console.error(problems.slice(0, 40).join("\n") + (problems.length > 40 ? `\n… ${problems.length - 40} more` : ""));
  process.exit(1);
}
const outputs = [[OUT, JSON.stringify(insights, null, 1) + "\n"], [INDEX, JSON.stringify(index) + "\n"], [FORECAST, JSON.stringify(forecast) + "\n"]];
if (process.argv.includes("--check")) {
  const stale = outputs.filter(([path, text]) => !existsSync(path) || readFileSync(path, "utf8").replace(/\r\n/g, "\n") !== text);
  if (stale.length) { console.error("Stale: " + stale.map(([path]) => path).join(", ") + ". Run node scripts/build-eesh-insights.mjs."); process.exit(1); }
  console.log("ЭЕШ insights are current.");
} else {
  for (const [path, text] of outputs) writeFileSync(path, text);
  console.log(SUBJECTS.map(subject => `${subject}: ${insights[subject].years.length} years, ${insights[subject].papers} papers, ${insights[subject].topics.length} topics, ${sum(insights[subject].domains.map(d => d.drill))} drill questions`).join("\n"));
  console.log("forecast settings " + JSON.stringify(settings));
  for (const subject of SUBJECTS) { const test = forecast.subjects[subject].backtest; if (test) console.log(`${subject} backtest: make-up ${test.makeup} · top1 ${test.top1} (part II ${test.top1Part2}) top2 ${test.top2} domain ±${test.domainError} · ` + test.years.map(y => `${y.year} make-up ${y.makeup} top1 ${y.top1} (${y.positions} pos) caught ${y.caught}/${y.appeared} likely ${y.likelyRight}/${y.likely}${y.sameFormat ? "" : " format changed"}`).join("; ")); }
}
