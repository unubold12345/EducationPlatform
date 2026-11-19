import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { allExamSlugs, findExam } from "../src/modules/exams/definitions.ts";
import { mockPractice } from "../src/modules/exam-practice/form.ts";
import { isLabSkill, labFor, labView, sectionSkill } from "../src/modules/exam-practice/skills.ts";
import { inWorkspace, workspaceTab } from "../src/modules/workspace/paths.ts";

const text = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const skillCounts = slug => {
  const { form } = mockPractice(findExam(slug));
  const counts = {};
  for (const section of form.sections) {
    const skill = sectionSkill(form.subject, section) ?? "other";
    counts[skill] = (counts[skill] ?? 0) + form.questions.filter(question => question.section === section.id).length;
  }
  return counts;
};

test("a mock's sections split by skill: the labs open listening, reading and (HSK, TOPIK) writing, nothing of SAT or ЭЕШ", () => {
  // Owner request 2026-11-19: the mocks' listening and reading in the Listening and Reading labs; JLPT/HSK/TOPIK reading and
  // writing in their own workshops.
  const slugs = allExamSlugs();
  for (const slug of slugs.filter(slug => /^ielts-academic-\d\d$/.test(slug))) assert.deepEqual([skillCounts(slug).listening, skillCounts(slug).reading], [40, 40], slug);
  for (const slug of slugs.filter(slug => /^toefl-\d\d$/.test(slug))) assert.deepEqual([skillCounts(slug).listening, skillCounts(slug).reading], [62, 65], slug);
  // JLPT reading is the 読解 part of the second paper (短文, 中文, 情報検索), not its grammar.
  const { form } = mockPractice(findExam("jlpt-n5-01"));
  assert.deepEqual(form.sections.filter(section => sectionSkill("jlpt", section) === "reading").map(section => section.id), ["jlpt-g-4", "jlpt-g-5", "jlpt-g-6"]);
  for (const slug of slugs.filter(slug => /^(jlpt-n[45]|hsk[12]|topik[12])-/.test(slug))) {
    const counts = skillCounts(slug);
    assert.ok(counts.reading > 0 && counts.listening > 0, slug);
    // Writing: HSK 2's 书写 and TOPIK Ⅱ's 쓰기 only; JLPT has no writing paper.
    assert.equal(counts.writing ?? 0, /^hsk2-/.test(slug) ? 10 : /^topik2-/.test(slug) ? 4 : 0, slug);
  }
  for (const slug of slugs.filter(slug => /^sat-/.test(slug))) assert.deepEqual(Object.keys(skillCounts(slug)), ["other"], slug);
  assert.equal(sectionSkill("eesh-english", { id: "x", title: "Reading", kind: "questions" }), null);
});

test("each lab opens only its exams' skills, and the lab view keeps the student's other answers and flags", () => {
  assert.deepEqual(labFor("listening", "ielts"), { title: "Сонсгол лаб", href: "/labs/ielts-listening", asian: false });
  assert.deepEqual(labFor("reading", "toefl"), { title: "TOEFL уншлага", href: "/labs/toefl-reading", asian: false });
  assert.deepEqual(labFor("reading", "hsk"), { title: "Унших workshop", href: "/labs/reading/hsk", asian: true });
  assert.deepEqual(labFor("writing", "topik"), { title: "Бичих workshop", href: "/labs/writing/topik", asian: true });
  for (const [skill, subject] of [["writing", "jlpt"], ["listening", "jlpt"], ["listening", "hsk"], ["reading", "sat"], ["writing", "ielts"], ["writing", "toefl"], ["reading", "eesh-english"]]) {
    assert.equal(labFor(skill, subject), null, skill + " " + subject);
  }
  assert.ok(isLabSkill("listening") && !isLabSkill("speaking") && !isLabSkill("toString"));
  const { form } = mockPractice(findExam("ielts-academic-01"));
  const view = { form, responses: { a: "1" }, flags: ["x"], reveals: {} };
  const reading = labView(view, "reading");
  assert.deepEqual(reading.form.sections.map(section => section.id), ["ielts-reading"]);
  assert.ok(reading.form.questions.every(question => question.section === "ielts-reading") && reading.form.questions.length === 40);
  assert.equal(reading.responses, view.responses);
  assert.equal(reading.flags, view.flags);
  assert.equal(labView({ ...view, form: mockPractice(findExam("sat-full-01")).form }, "reading"), null);
});

test("the lab mock page is practice mode narrowed to a skill: the same access, sitting block and, for JLPT/HSK/TOPIK, the plan", () => {
  const page = text("src/app/labs/mock/[skill]/[slug]/page.tsx");
  assert.match(page, /if \(!isLabSkill\(skill\)\) notFound\(\);/);
  assert.match(page, /view = await practiceView\(user\.id, slug\)/);
  assert.match(page, /error instanceof TimedSittingOpen/);
  assert.match(page, /status === 402\) redirect\("\/exams\/" \+ slug\)/);
  assert.match(page, /if \(!lab \|\| !narrowed\) notFound\(\);/);
  assert.ok(page.indexOf("if (lab.asian)") < page.indexOf("<PracticeWorkspace"), "the Ази хэл plan is checked before the page renders");
  assert.match(page, /studyGate\(user\.id/);
  // In a lab, "Дахин эхлэх" retries only the questions shown, never the whole practice session (DELETE).
  const workspace = text("src/modules/exam-practice/workspace.tsx");
  const start = workspace.indexOf("async function resetAll"), reset = workspace.slice(start, workspace.indexOf('method:"DELETE"', start));
  assert.ok(reset.includes("if(lab){") && /await retry\(ids\);[^\n]*return;/.test(reset), "the lab branch returns before the DELETE");
  // The lists read access from the hub rule and send a locked mock to its briefing, not into the lab.
  const lists = text("src/modules/exam-practice/lab-mocks.ts");
  assert.match(lists, /hubAccess\(userId, slugs, exam\)/);
  assert.match(lists, /href: kind !== "locked" && userId \? `\/labs\/mock\/\$\{skill\}\/\$\{mock\.slug\}` : "\/exams\/" \+ mock\.slug/);
  const writing = text("src/app/labs/writing/[exam]/page.tsx");
  assert.match(writing, /const gate = await studyGate\(user\.id, exam, page\.title\);\n\s*if \(gate\) return gate;\n\s*return <LabMockPage/);
  // Only HSK and TOPIK, by own key: /labs/writing/toString is a 404, not a page.
  assert.match(writing, /Object\.hasOwn\(WRITING, value\)/);
  assert.match(writing, /if \(!isWritingExam\(exam\)\) notFound\(\);/);
  assert.match(text("src/app/labs/ielts-listening/page.tsx"), /<ListeningLab mocks=\{await labMocks\(session\?\.user\.id,"ielts","listening"\)\}\/>/);
  // Inside the reading page's own column, under the AI texts.
  assert.match(text("src/app/labs/reading/[exam]/page.tsx"), /<LanguageReading userId=\{user\.id\} exam=\{exam\}><LabMockSection title="Mock-ийн уншлага" mocks=\{await labMocks\(user\.id, exam, "reading"\)\} \/><\/LanguageReading>/);
  for (const skill of ["listening", "reading"]) assert.match(text(`src/app/labs/toefl-${skill}/page.tsx`), new RegExp(`labMocks\\(session\\?\\.user\\.id, "toefl", "${skill}"\\)`));
});

test("the new lab pages sit in the Workspace under the Workshop tab", () => {
  for (const path of ["/labs/toefl-listening", "/labs/toefl-reading", "/labs/writing/hsk", "/labs/mock/listening/ielts-academic-01", "/labs/mock/reading/toefl-01"]) {
    assert.equal(inWorkspace(path), true, path);
    assert.equal(workspaceTab(path), "workshop", path);
  }
});
