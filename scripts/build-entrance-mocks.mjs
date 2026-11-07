// Builds the website's ЭЕШ mock content from the offline MockExmps JSON packs.
// Input : MockExmps/{Math,Physics,English}/<year>/mock-*.json  (never served)
// Output: assets/entrance-mocks/<subject>/<slug>.json  (server-side content, includes answers)
//         public/exam-assets/eesh/<subject>/<slug>/*.svg (diagrams only)
//         src/modules/exams/entrance/catalog.json (metadata; client-safe)
//
// Run: node scripts/build-entrance-mocks.mjs
// The output is deterministic: rerunning on unchanged sources rewrites identical files.
import { createHash } from "node:crypto";import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const ROOT = resolve(process.cwd());
const SOURCE = join(ROOT, "MockExmps");
const CONTENT = join(ROOT, "assets", "entrance-mocks");
const PUBLIC = join(ROOT, "public", "exam-assets", "eesh");
const CATALOG = join(ROOT, "src", "modules", "exams", "entrance", "catalog.json");
const CATALOG_TS = join(ROOT, "src", "modules", "exams", "entrance", "catalog-data.ts");

const SUBJECTS = {
  math: { ru: "Математик", title: "ЭЕШ · Математик", dir: "Math", file: /^mock-(\d+)\.json$/, yearDir: /^\d{4}$/ },
  physics: { ru: "Физик", title: "ЭЕШ · Физик", dir: "Physics", file: /^mock-(\d+)\.json$/, yearDir: /^\d{4}$/ },
  english: { ru: "Англи хэл", title: "ЭЕШ · Англи хэл", dir: "English", file: /^mock-(\d+)\.json$/, yearDir: /^\d{4}$/ },
};

const problems = [];
const summary = { mocks: 0, questions: 0, figures: 0, points: {} };
const hashes = [];
const slugSeen = new Set();
const questionIds = new Set();

const readJson = file => JSON.parse(readFileSync(file, "utf8"));
const fail = message => { problems.push(message); };
const clean = value => String(value ?? "").replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").trim();
const asciiNumber = text => String(text).replaceAll("−", "-").replaceAll("–", "-").replaceAll("—", "-");
const numericAnswer = text => /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:\/\d+(?:\.\d+)?)?$/.test(asciiNumber(String(text).trim()));

function writeText(file, content) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content, "utf8");
  hashes.push([file, createHash("sha256").update(content).digest("hex")]);
}
function writeJson(file, value) {
  writeText(file, JSON.stringify(value, null, 2) + "\n");
}

/** Split points into whole numbers that add up to the task total (largest remainder). */
function allocate(total, count) {
  if (!count) return [];
  const base = Math.floor(total / count);
  const extra = total - base * count;
  return Array.from({ length: count }, (_, index) => base + (index < extra ? 1 : 0));
}

function figureFrom(source, subject, slug, key, alt) {
  const svg = source?.svg;
  if (typeof svg !== "string" || !svg.includes("<svg")) return undefined;
  if (/<script|foreignObject|javascript:|\son\w+=/i.test(svg)) {
    fail(`${slug} ${key}: unsafe SVG`);
    return undefined;
  }
  const root = /<svg\b([^>]*)>/i.exec(svg)?.[1] ?? "";
  const width = Number(/\bwidth="([\d.]+)"/i.exec(root)?.[1]);
  const height = Number(/\bheight="([\d.]+)"/i.exec(root)?.[1]);
  const box = /\bviewBox="([^"]+)"/i.exec(root)?.[1];
  let w = Number.isFinite(width) ? width : 0;
  let h = Number.isFinite(height) ? height : 0;
  if ((!w || !h) && box) {
    const parts = box.split(/[\s,]+/).map(Number);
    if (parts.length === 4) { w = parts[2]; h = parts[3]; }
  }
  const file = key.replace(/[^a-z0-9-]/gi, "-");
  const src = `/exam-assets/eesh/${subject}/${slug}/${file}.svg`;
  writeText(join(PUBLIC, subject, slug, file + ".svg"), svg.endsWith("\n") ? svg : svg + "\n");
  summary.figures += 1;
  const title = clean(source.title || alt || (subject === "math" ? "Математикийн зураг" : "Физикийн зураг"));
  return { kind: "image", src, alt: title, width: Math.round(w) || undefined, height: Math.round(h) || undefined };
}

const mathDomainRules = [
  [/probability|statistic|histogram|dispersion|mean|median|frequency|bayes|combinat|random/i, "Магадлал, статистик"],
  [/trigonometr|sine|cosine|tangent|radian|angle/i, "Тригонометр"],
  [/triangle|circle|polygon|geometry|vector|plane|cuboid|prism|pyramid|trapezoid|parallelogram|tangent|inscribed|circumscribed|coordinate|cevian|area|volume/i, "Геометр"],
  [/function|derivative|integral|limit|graph|tangent line|maximum|minimum|monoton|continu/i, "Функц, анализ"],
  [/log|matrix|sequence|progress|equation|inequality|polynomial|expression|algebra|complex|binomial|system of/i, "Алгебр"],
];
function mathDomain(skill) {
  for (const [pattern, name] of mathDomainRules) if (pattern.test(skill)) return name;
  return "Тоо, илэрхийлэл";
}
const physicsDomainRules = [
  [/Хэмжилт/i, "Хэмжилт"],
  [/дулаан|температур|хий|халах|молекул|изохор/i, "Молекул ба дулаан"],
  [/хэлхээ|гүйдэл|цахилгаан|конденсатор|багтаамж|кулон|соронзон|логик|булийн|өсгөгч|цэнэг/i, "Цахилгаан ба соронзон"],
  [/долгион|хэлбэлзэл|гармоник|дууны/i, "Хэлбэлзэл ба долгион"],
  [/гэрэл|оптик|нүд|хугарал|гэрэлтүүлэг/i, "Оптик"],
  [/атом|фотон|изотоп|цацраг|квант/i, "Атом, квант"],
];
function physicsDomain(skill) {
  for (const [pattern, name] of physicsDomainRules) if (pattern.test(skill)) return name;
  return "Механик";
}
const englishDomain = title => {
  const text = String(title).toUpperCase();
  if (text.includes("GRAMMAR") || text.startsWith("2.")) return "Дүрэм, хэл зүй";
  if (text.includes("VOCABULARY")) return "Үгсийн сан";
  if (text.includes("COMMUNICATION")) return "Харилцаа";
  if (text.includes("READING")) return "Уншиж ойлгох";
  if (text.includes("LISTENING")) return "Сонсож ойлгох";
  return "Хэлний чадвар";
};

function optionByLetter(options, letter) {
  const index = String(letter).charCodeAt(0) - 65;
  return options[index] ?? options.find(value => value === letter);
}
const superscriptDigits = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9" };
/** Physics occasionally writes 2π·1·10⁻⁶; store the number and keep the printed form for review. */
function scientificValue(text) {
  let value = asciiNumber(text).replaceAll("·", "*").replaceAll("π", "pi");
  value = value.replace(/10([⁻⁺]?)([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, (_, sign, digits) => "10^" + (sign === "⁻" ? "-" : "") + [...digits].map(digit => superscriptDigits[digit]).join(""));
  const match = /^([\d.]+)(?:\*?pi)?(?:\*([\d.]+))?\*10\^(-?\d+)$/.exec(value.replace(/\s+/g, ""));
  if (!match) return null;
  const coefficient = Number(match[1]) * (value.includes("pi") ? Math.PI : 1) * (match[2] ? Number(match[2]) : 1);
  const number = coefficient * 10 ** Number(match[3]);
  return Number.isFinite(number) ? number : null;
}
function physicsAnswer(answer) {
  const text = clean(answer);
  if (numericAnswer(text)) return { kind: "number", matcher: "numeric", answers: [text], answerDisplay: text };
  const scientific = scientificValue(text);
  if (scientific !== null) return { kind: "number", matcher: "numeric", answers: [String(scientific)], answerDisplay: `${text} ≈ ${scientific.toExponential(3)}` };
  const aliases = /төв.*рүү|рүү.*төв/i.test(text) ? [text, "төв рүү", "тойргийн төврүү", "төв рүү чиглэнэ"] : [text];
  return { kind: "short", matcher: "text", answers: [...new Set(aliases)], answerDisplay: text };
}

function baseMock({ slug, subject, year, form, title, description, durationMinutes, points, calculator, instructions, groups, questions, passages, sourceNote }) {
  return {
    slug, subject, year, form, title, description,
    durationMinutes, points, calculator, language: subject === "english" ? "en" : "mn",
    instructions, groups, questions, passages: passages ?? [], sourceNote,
  };
}

// ---------------------------------------------------------------- Mathematics
function buildMath(mock, year, number) {
  const form = `M${number}`;
  const variant = String(mock.mockVariant ?? form).toUpperCase();
  const slug = `eesh-math-${year}-m${number}`;
  if (slugSeen.has(slug)) fail(`duplicate slug ${slug}`);
  slugSeen.add(slug);
  const groups = [];
  const questions = [];
  const part = { id: "part-1", title: "Нэгдүгээр хэсэг · Сонгох даалгавар", section: "I хэсэг", instructions: "Даалгавар бүрт нэг зөв хариултыг сонго." };
  groups.push(part);
  let taskNumber = 0;
  for (const [index, question] of mock.questions.entries()) {
    const numberLabel = String(question.number ?? index + 1);
    if (question.type === "multiple_choice") {
      const options = question.options ?? {};
      const values = ["A", "B", "C", "D", "E"].map(letter => clean(options[letter] ?? ""));
      if (values.some(value => !value)) fail(`${slug} q${numberLabel}: missing option`);
      const answer = optionByLetter(values, question.answer);
      if (!answer) fail(`${slug} q${numberLabel}: bad answer ${question.answer}`);
      const id = `${slug}-q${numberLabel}`;
      if (questionIds.has(id)) fail(`duplicate question ${id}`);
      questionIds.add(id);
      const figure = figureFrom(question.figure?.displayPolicy === "question_figure" ? question.figure : undefined, "math", slug, `q${numberLabel}`, question.figure?.title);
      questions.push({
        id, number: numberLabel, groupId: "part-1", kind: "choice", points: Number(question.points) || 1,
        domain: mathDomain(question.skill ?? ""), prompt: clean(question.prompt), options: values, optionLabels: ["A", "B", "C", "D", "E"],
        answers: [answer], answerDisplay: answer, explanation: clean(question.solution), ...(figure ? { figure } : {}),
      });
      continue;
    }
    if (question.type !== "structured_response") { fail(`${slug} q${numberLabel}: unknown type ${question.type}`); continue; }
    taskNumber += 1;
    const taskId = `task-${taskNumber}`;
    const taskPoints = Number(question.points) || 0;
    const points = allocate(taskPoints, question.parts?.length ?? 0);
    const figure = figureFrom(question.figure?.displayPolicy === "question_figure" ? question.figure : undefined, "math", slug, `t${question.number.replace(/\./g, "-")}`, question.figure?.title);
    groups.push({
      id: taskId, title: `2.${taskNumber}`, section: "II хэсэг", pageMode: "group",
      instructions: clean(question.prompt), ...(figure ? { figure } : {}),
    });
    for (const [partIndex, item] of (question.parts ?? []).entries()) {
      const letter = "abcdefgh"[partIndex] ?? String(partIndex + 1);
      const id = `${slug}-${taskId}-${letter}`;
      if (questionIds.has(id)) fail(`duplicate question ${id}`);
      questionIds.add(id);
      const answer = clean(item.answer);
      const numeric = numericAnswer(answer);
      questions.push({
        id, number: `2.${taskNumber}${letter}`, groupId: taskId, kind: numeric ? "number" : "short",
        matcher: numeric ? "numeric" : "math", points: points[partIndex] ?? 0,
        domain: mathDomain(question.skill ?? ""), prompt: clean(item.prompt),
        answers: [answer], answerDisplay: answer,
        explanation: clean(question.solution),
      });
    }
  }
  const total = questions.reduce((sum, question) => sum + question.points, 0);
  if (total !== 100) fail(`${slug}: points total ${total}`);
  summary.points.total = (summary.points.total ?? 0) + total;
  return baseMock({
    slug, subject: "math", year, form: variant,
    title: `ЭЕШ · Математик · ${year} · ${variant}`,
    description: `${year} оны ЭЕШ-ийн математикийн бүтэцтэй, энэ сайтад зориулж зохиосон дадлагын шалгалт. 36 сонгох, 4 бодолт; тооцоолуур хэрэглэхгүй.`,
    durationMinutes: 100, points: total, calculator: false,
    instructions: [
      "Нэгдүгээр хэсэгт 36 даалгаврын A–E сонголтоос нэгийг сонгоно.",
      "Хоёрдугаар хэсгийн 4 бодолтын дэд асуултад хариугаа бичнэ. Бүхэл тоо, бутархай, интервал эсвэл илэрхийлэл бичиж болно.",
      "Тооцоолуур хэрэглэхгүй. Ноорог самбар нээлттэй.",
    ],
    groups, questions,
    sourceNote: mock.referenceProvenance?.kind === "third_party_transcription" ? "2022–2026 оны жишиг эх нь MathX-ийн нийтэлсэн транскрипц; албан БҮТ эх биш." : "Оноо, хэлбэрийг албан ЭЕШ-ийн бүтэцтэй тулгасан; даалгаврыг энэ сайтад зориулж зохиосон.",
  });
}

// ------------------------------------------------------------------- Physics
function buildPhysics(mock, year, number) {
  const form = `P${number}`;
  const variant = String(mock.mockVariant ?? form).toUpperCase();
  const slug = `eesh-physics-${year}-p${number}`;
  if (slugSeen.has(slug)) fail(`duplicate slug ${slug}`);
  slugSeen.add(slug);
  const groups = [{ id: "part-1", title: "Нэгдүгээр хэсэг · Сонгох даалгавар", section: "I хэсэг", instructions: "Даалгавар бүрт нэг зөв хариултыг сонго." }];
  const questions = [];
  let taskNumber = 0;
  for (const [index, question] of mock.questions.entries()) {
    const numberLabel = String(question.number ?? index + 1);
    if (question.type === "multiple_choice") {
      const values = ["A", "B", "C", "D", "E"].map(letter => clean(question.options?.[letter] ?? ""));
      if (values.some(value => !value)) fail(`${slug} q${numberLabel}: missing option`);
      const answer = optionByLetter(values, question.answer);
      if (!answer) fail(`${slug} q${numberLabel}: bad answer ${question.answer}`);
      const id = `${slug}-q${numberLabel}`;
      if (questionIds.has(id)) fail(`duplicate question ${id}`);
      questionIds.add(id);
      const figure = figureFrom(question.figure, "physics", slug, `q${numberLabel}`, question.figure?.title);
      questions.push({
        id, number: numberLabel, groupId: "part-1", kind: "choice", points: Number(question.points) || 1,
        domain: physicsDomain(question.skill ?? ""), prompt: clean(question.prompt), options: values, optionLabels: ["A", "B", "C", "D", "E"],
        answers: [answer], answerDisplay: answer, explanation: clean(question.solution), ...(figure ? { figure } : {}),
      });
      continue;
    }
    if (question.type !== "structured_response") { fail(`${slug} q${numberLabel}: unknown type ${question.type}`); continue; }
    taskNumber += 1;
    const taskId = `task-${taskNumber}`;
    const figure = figureFrom(question.figure, "physics", slug, `t${question.number.replace(/\./g, "-")}`, question.figure?.title);
    groups.push({
      id: taskId, title: `2.${taskNumber}`, section: "II хэсэг", pageMode: "group",
      instructions: clean(question.prompt), ...(figure ? { figure } : {}),
    });
    for (const [partIndex, item] of (question.parts ?? []).entries()) {
      const letter = "abcdefgh"[partIndex] ?? String(partIndex + 1);
      const id = `${slug}-${taskId}-${letter}`;
      if (questionIds.has(id)) fail(`duplicate question ${id}`);
      questionIds.add(id);
      const parsed = physicsAnswer(item.answer);
      questions.push({
        id, number: `2.${taskNumber}${letter}`, groupId: taskId, kind: parsed.kind,
        matcher: parsed.matcher, points: Number(item.points) || 0,
        domain: physicsDomain(question.skill ?? ""), prompt: clean(item.prompt),
        answers: parsed.answers, answerDisplay: parsed.answerDisplay, explanation: clean(question.solution),
      });
    }
  }
  const total = questions.reduce((sum, question) => sum + question.points, 0);
  if (total !== 100) fail(`${slug}: points total ${total}`);
  summary.points.total = (summary.points.total ?? 0) + total;
  return baseMock({
    slug, subject: "physics", year, form: variant,
    title: `ЭЕШ · Физик · ${year} · ${variant}`,
    description: `${year} оны ЭЕШ-ийн физикийн бүтэцтэй, энэ сайтад зориулж зохиосон дадлагын шалгалт. 46 сонгох, 4 бодолт; g = 10 м/с².`,
    durationMinutes: 100, points: total, calculator: false,
    instructions: [
      "Нэгдүгээр хэсэгт 46 даалгаврын A–E сонголтоос нэгийг сонгоно.",
      "Хоёрдугаар хэсгийн 4 бодолтын дэд асуултад тоон хариугаа бичнэ.",
      "Бүх тооцоонд g = 10 м/с². Зураг дээрх хэмжээс масштабтай биш.",
    ],
    groups, questions,
    sourceNote: "Даалгаврыг энэ сайтад зориулж зохиосон; албан ЭЕШ-ийн асуулт, зураг ашиглаагүй.",
  });
}

// ------------------------------------------------------------------- English
function buildEnglish(mock, year) {
  const number = Number(mock.mockNumber);
  const slug = `eesh-english-${year}-e${number}`;
  if (slugSeen.has(slug)) fail(`duplicate slug ${slug}`);
  slugSeen.add(slug);
  const groups = [];
  const questions = [];
  const passages = [];
  const seenPassages = new Set();
  let sectionOrder = 0;
  let total = 0;
  const pushQuestion = (data) => {
    if (questionIds.has(data.id)) fail(`duplicate question ${data.id}`);
    questionIds.add(data.id);
    total += data.points;
    questions.push(data);
  };
  function addPassage(title, text) {
    const cleanTitle = clean(title) || "Эх";
    if (!seenPassages.has(cleanTitle)) {
      seenPassages.add(cleanTitle);
      passages.push({ title: cleanTitle, text: clean(text) });
    }
    return cleanTitle;
  }
  function sectionGroup({ id, title, section, instructions, context, contextTitle, wordBank, figure, pageMode = "single", kind }) {
    groups.push({
      id, title, section, instructions: clean(instructions), pageMode,
      ...(context ? { context: clean(context) } : {}),
      ...(contextTitle ? { contextTitle: clean(contextTitle) } : {}),
      ...(wordBank ? { wordBank } : {}),
      ...(figure ? { figure } : {}),
      ...(kind ? { kind } : {}),
    });
  }

  for (const part of mock.parts ?? []) {
    const partName = clean(part.part) || `PART ${sectionOrder + 1}`;
    if (part.sections) {
      for (const section of part.sections) {
        sectionOrder += 1;
        const sectionTitle = clean(section.title) || partName;
        for (const [taskIndex, task] of (section.tasks ?? []).entries()) {
          const groupId = `p${sectionOrder}-t${taskIndex + 1}`;
          const isAudio = Boolean(task.audioScript);
          // A reading text is shown beside its questions; conversation/cloze text sits above them.
          const reading = /reading/i.test(sectionTitle) && Boolean(task.text) && !task.wordBank && !isAudio;
          if ((task.passageTitle && task.text) || reading) {
            const title = addPassage(task.passageTitle || task.title || `Passage ${taskIndex + 1}`, task.text);
            sectionGroup({ id: groupId, title: clean(task.title) || `Task ${taskIndex + 1}`, section: sectionTitle, instructions: task.instructions, kind: isAudio ? "listening" : undefined });
            for (const [questionIndex, question] of (task.questions ?? []).entries()) {
              const values = ["A", "B", "C", "D", "E"].map(letter => clean(question.options?.[letter] ?? "")).filter(Boolean);
              const answer = optionByLetter(values, question.answer);
              if (!answer) fail(`${slug} q${question.number}: bad answer`);
              pushQuestion({
                id: `${slug}-q${question.number}`, number: String(question.number ?? questionIndex + 1), groupId,
                kind: "choice", points: Number(question.points) || 1, domain: englishDomain(sectionTitle),
                prompt: clean(question.stem), passage: title, options: values, optionLabels: ["A", "B", "C", "D", "E"],
                answers: [answer], answerDisplay: answer, explanation: "",
              });
            }
            continue;
          }
          sectionGroup({
            id: groupId, title: clean(task.title) || `Task ${taskIndex + 1}`, section: sectionTitle,
            instructions: task.instructions, context: isAudio ? task.audioScript : task.text,
            contextTitle: isAudio ? "Listening script" : undefined,
            kind: isAudio ? "listening" : undefined,
          });
          for (const [questionIndex, question] of (task.questions ?? []).entries()) {
            const values = ["A", "B", "C", "D", "E"].map(letter => clean(question.options?.[letter] ?? "")).filter(Boolean);
            const answer = optionByLetter(values, question.answer);
            if (!answer) fail(`${slug} q${question.number}: bad answer`);
            pushQuestion({
              id: `${slug}-q${question.number}`, number: String(question.number ?? questionIndex + 1), groupId,
              kind: "choice", points: Number(question.points) || 1, domain: englishDomain(sectionTitle),
              prompt: clean(question.stem), options: values, optionLabels: ["A", "B", "C", "D", "E"],
              answers: [answer], answerDisplay: answer, explanation: "",
            });
          }
        }
      }
      continue;
    }

    // Part II: matching banks, cloze gaps and word boxes.
    if (!part.tasks) continue;
    sectionOrder += 1;
    for (const [taskIndex, task] of part.tasks.entries()) {
      const taskId = clean(task.id) || `2.${taskIndex + 1}`;
      const instructions = clean(task.instructions);
      const section = partName;
      // 1. groups (2025 2.2 and 2026 2.2)
      if (task.groups) {
        for (const [groupIndex, subgroup] of task.groups.entries()) {
          const groupId = `p${sectionOrder}-t${taskIndex + 1}-g${groupIndex + 1}`;
          const issued = subgroup.choices ? subgroup.choices.map(choice => ({ label: String(choice.number), text: clean(choice.text) })) : undefined;
          sectionGroup({ id: groupId, title: taskId, section, instructions: subgroup.instructions ?? instructions, wordBank: issued, pageMode: "group" });
          for (const [itemIndex, item] of (subgroup.items ?? []).entries()) {
            const options = subgroup.choices
              ? subgroup.choices.map(choice => clean(choice.text))
              : Object.values(item.choices ?? {}).map(value => clean(value));
            const labels = subgroup.choices
              ? subgroup.choices.map(choice => String(choice.number))
              : Object.keys(item.choices ?? {});
            const answerIndex = item.answer !== undefined ? Number(item.answer) : Number(subgroup.answer?.[item.label]);
            const answer = options.find((_, optionIndex) => Number(labels[optionIndex]) === answerIndex) ?? options[answerIndex - 1];
            if (!answer) fail(`${slug} ${taskId}${item.label}: bad answer`);
            const answerLabel = labels.find((label, optionIndex) => Number(label) === answerIndex && options[optionIndex] === answer);
            pushQuestion({
              id: `${slug}-${taskId.replace(/\./g, "-")}-${item.label}-${itemIndex}`, number: `${taskId}${item.label}`,
              groupId, kind: "choice", points: Number(task.pointsPerItem) || 1, domain: "Хэсэг II",
              prompt: clean(item.text), options, optionLabels: labels,
              compactOptions: Boolean(subgroup.choices), answers: [answer], answerDisplay: answerLabel ? `${answerLabel}. ${answer}` : answer, explanation: "",
            });
          }
        }
        continue;
      }
      // 2. matching items with a shared bank
      if (task.items && task.choices) {
        const groupId = `p${sectionOrder}-t${taskIndex + 1}`;
        const bank = task.choices.map(choice => ({ label: String(choice.number), text: clean(choice.text) }));
        const options = bank.map(choice => choice.text);
        const labels = bank.map(choice => choice.label);
        sectionGroup({ id: groupId, title: taskId, section, instructions, context: task.text, contextTitle: task.text ? taskId : undefined, wordBank: bank, pageMode: "group" });
        for (const [itemIndex, item] of task.items.entries()) {
          const answerIndex = Number(item.answer ?? task.answer?.[item.label]);
          const answer = options.find((_, optionIndex) => Number(labels[optionIndex]) === answerIndex) ?? options[answerIndex - 1];
          if (!answer) fail(`${slug} ${taskId}${item.label}: bad answer ${answerIndex}`);
          pushQuestion({
            id: `${slug}-${taskId.replace(/\./g, "-")}-${item.label}-${itemIndex}`, number: `${taskId}${item.label}`,
            groupId, kind: "choice", points: Number(task.pointsPerItem) || 1, domain: "Хэсэг II",
            prompt: clean(item.text), options, optionLabels: labels, compactOptions: true,
            answers: [answer], answerDisplay: `${labels.find((label, optionIndex) => Number(label) === answerIndex && options[optionIndex] === answer) ?? answerIndex}. ${answer}`, explanation: "",
          });
        }
        continue;
      }
      // 3. gaps, each gap with its own five options
      if (task.gaps && task.text) {
        const groupId = `p${sectionOrder}-t${taskIndex + 1}`;
        sectionGroup({ id: groupId, title: taskId, section, instructions, context: task.text, contextTitle: taskId, pageMode: "group" });
        for (const [gapIndex, gap] of task.gaps.entries()) {
          const entries = Object.entries(gap.choices ?? {});
          const options = entries.map(([, value]) => clean(value));
          const labels = entries.map(([label]) => label);
          const answer = options[Number(gap.answer) - 1];
          if (!answer) fail(`${slug} ${taskId}${gap.label}: bad answer ${gap.answer}`);
          pushQuestion({
            id: `${slug}-${taskId.replace(/\./g, "-")}-${gap.label}-${gapIndex}`, number: `${taskId}${gap.label}`,
            groupId, kind: "choice", points: Number(task.pointsPerItem) || 1, domain: "Хэсэг II",
            prompt: "", options, optionLabels: labels, answers: [answer], answerDisplay: `${labels[Number(gap.answer) - 1] ?? gap.answer}. ${answer}`, explanation: "",
          });
        }
        continue;
      }
      fail(`${slug} ${taskId}: unsupported Part II task`);
    }
  }
  if (total !== 100) fail(`${slug}: points total ${total}`);
  summary.points.total = (summary.points.total ?? 0) + total;
  const partOne = questions.filter(question => question.number && /^\d+$/.test(question.number)).length;
  const partTwo = questions.length - partOne;
  return baseMock({
    slug, subject: "english", year, form: `E${number}`,
    title: `ЭЕШ · Англи хэл · ${year} · Хувилбар ${number}`,
    description: `${year} оны ЭЕШ-ийн англи хэлний бүтэцтэй, энэ сайтад зориулж зохиосон дадлагын шалгалт. ${partOne} сонгох, ${partTwo} холбох, нөхөх даалгавар.`,
    durationMinutes: 80, points: total, calculator: false,
    instructions: [
      "Part I: A–E сонголтоос нэг зөв хариултыг сонго.",
      "Part II: үг, хэллэгийг тохируулан холбох эсвэл зөв хэлбэрийг сонго.",
      "Хариу автоматаар хадгалагдана. Хугацаа дуусахад эцэслэгдэнэ.",
    ],
    groups, questions, passages,
    sourceNote: "2022–2026 оны жишиг эх нь албан БҮТ-ийн эх биш, нийтэд нээлттэй хуулбар; 2018–2020 оны албан хувилбарын бүтцийг баримталсан.",
  });
}

// -------------------------------------------------------------------- driver
for (const target of [CONTENT, PUBLIC]) {
  if (existsSync(target)) rmSync(target, { recursive: true, force: true });
}

const catalog = { generatedAt: "2026-11-06", subjects: {}, mocks: [] };
for (const [subject, spec] of Object.entries(SUBJECTS)) {
  const subjectDir = join(SOURCE, spec.dir);
  if (!existsSync(subjectDir)) { fail(`missing ${subjectDir}`); continue; }
  const years = readdirSync(subjectDir).filter(name => spec.yearDir.test(name)).map(Number).sort((a, b) => a - b);
  catalog.subjects[subject] = { label: spec.ru, title: spec.title, years: [...years].sort((a, b) => b - a) };
  for (const year of years) {
    const yearDir = join(subjectDir, String(year));
    const files = readdirSync(yearDir).filter(name => spec.file.test(name)).sort((a, b) => Number(spec.file.exec(a)[1]) - Number(spec.file.exec(b)[1]));
    if (files.length !== 5) fail(`${subject} ${year}: expected 5 mocks, found ${files.length}`);
    for (const file of files) {
      const number = Number(spec.file.exec(file)[1]);
      const mock = readJson(join(yearDir, file));
      const built = subject === "math" ? buildMath(mock, year, number) : subject === "physics" ? buildPhysics(mock, year, number) : buildEnglish(mock, year);
      summary.mocks += 1;
      summary.questions += built.questions.length;
      const points = built.questions.reduce((sum, question) => sum + question.points, 0);
      catalog.mocks.push({
        slug: built.slug, subject, year, form: built.form, title: built.title,
        durationMinutes: built.durationMinutes, points, questionCount: built.questions.length,
        groupCount: built.groups.length, description: built.description,
      });
      writeJson(join(CONTENT, subject, `${built.slug}.json`), built);
    }
  }
}
catalog.mocks.sort((a, b) => a.subject.localeCompare(b.subject) || b.year - a.year || a.form.localeCompare(b.form));
writeJson(CATALOG, catalog);
writeText(CATALOG_TS, "// Generated by scripts/build-entrance-mocks.mjs. Do not edit by hand.\n// Metadata only: no question text, answers or explanations.\nexport const entranceCatalog = " + JSON.stringify(catalog, null, 2) + ";\n");

console.log(JSON.stringify({ ...summary, problems: problems.length, problemsList: problems.slice(0, 40) }, null, 2));
if (problems.length) {
  console.error(`BUILD FAILED: ${problems.length} problem(s)`);
  process.exit(1);
}
console.log(`Built ${summary.mocks} mocks, ${summary.questions} questions, ${summary.figures} diagrams.`);
