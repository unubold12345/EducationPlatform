// Builds the website's ЭЕШ mock content from the offline MockExmps JSON packs.
// Input : MockExmps/{Math,Physics,English,Biology,Chemistry}/<year>/mock-*.json  (never served)
// Output: assets/entrance-mocks/<subject>/<slug>.json  (server-side content, includes answers)
//         public/exam-assets/eesh/<subject>/<slug>/*.svg (diagrams only)
//         src/modules/exams/entrance/catalog.json (metadata; client-safe)
//
// Run: node scripts/build-entrance-mocks.mjs                      (every subject)
//      node scripts/build-entrance-mocks.mjs biology chemistry    (only those subjects' content and figures;
//                                                                  the catalog is always rebuilt from every pack)
// The committed Math/Physics output was adjusted after generation (diagram sizes), so a full rebuild
// rewrites it. Name the subjects you changed rather than rebuilding everything.
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
  // Draft packs with three forms per year (Chemistry has no 2024 reference, so no 2024 forms).
  biology: { ru: "Биологи", title: "ЭЕШ · Биологи", dir: "Biology", file: /^mock-(\d+)\.json$/, yearDir: /^\d{4}$/, forms: 3 },
  chemistry: { ru: "Хими", title: "ЭЕШ · Хими", dir: "Chemistry", file: /^mock-(\d+)\.json$/, yearDir: /^\d{4}$/, forms: 3 },
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

const only = new Set(process.argv.slice(2));
for (const name of only) if (!(name in SUBJECTS)) { console.error(`Unknown subject "${name}". Subjects: ${Object.keys(SUBJECTS).join(", ")}`); process.exit(1); }
let writing = true;
function writeText(file, content) {
  if (!writing) return;
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
  const title = clean(source.title || alt || ({ math: "Математикийн зураг", physics: "Физикийн зураг", biology: "Биологийн зураг", chemistry: "Химийн зураг" }[subject] ?? "Зураг"));
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

// ------------------------------------------------------- Biology and Chemistry
// Both packs share one schema: sections[0] holds A–E questions, sections[1] holds Part II tasks
// whose parts are single numbers (a digit code, a choice number or a computed value).
const biologyDomainRules = [
  [/^(abo|dihybrid|monohybrid|epistasis|genotype|hw|karyotype|mutation|selection|variation|gamete|pcr|dnafingerprint|electrophoresis|geneticengineering|biotechnology)$|удамшил|генетик|харди|генийн|аллель|хи-квадрат/i, "Удамшил, хувьсал"],
  [/^(agestructure|carboncycle|conservation|ecosystem|growth|nitrogen|pollution|population|resources|sampling|temperature|watercycle)$|экологи|симпсон|спирман|бохирдол/i, "Экологи"],
  [/^(aerobic|anaerobic|energy|respirationsteps|fermenter|atp)$|амьсгал/i, "Амьсгал, энерги"],
  [/^(leaf|mineral|photosynthesis|plantgroups|plantkey|root|symplast|transpiration|transportplant|xerophyte|chloroplast)$|ургамал|усны потенциал/i, "Ургамал"],
  [/^(archaea|classes|fungi|mollusc|taxon|vertebrate|worms)$|ангилал/i, "Ангилал зүй"],
  [/^(airway|bloodcells|bloodvessel|brain|breathing|cardiaccycle|circulation|dialysis|digestion|eye|gastransport|heart|hormones|immunity|kidneydisease|lung|lymphocyte|memory|nephron|neuron|nutrition|pressure|pulse|reflex|sinoatrial|smoking|urea|urine|urinetest|waterbalance|antibiotic|infection|virus)$|мэдрэл|даавар|хоол боловсруулах/i, "Хүний физиологи"],
];
const chemistryDomainRules = [
  [/^(equilibrium|le-chatelier|kp-industrial|reversible|rate|reaction-rate|collision|catalysis|maxwell|ph$)|тэнцвэр|хурд/i, "Урвалын хурд, тэнцвэр"],
  [/^(alkene|alcohol|aromatic|carbonyl|carboxylic|ester|isomer|mechanism|organic|polymer|addition-polymers|condensation-polymers|petroleum|cracking|fermentation|iodoform|nomenclature|chirality|free-radical|oxidative-cleavage|dehydration|biomolecules|functional-group|oxidation-isomers)|органик|алкен/i, "Органик хими"],
  [/^(energetics|enthalpy|hess|bond-enthalpy|calorimetry|energy-cycle|thermochemistry|combustion-equations|fuels)/i, "Термохими"],
  [/^(redox|oxidation-states|half-equations|electrolysis|electrochemistry|electroplating|reactivity|metal-extraction|displacement)|металл/i, "Исэлдэн ангижрал, металл"],
  [/^(atomic-structure|electron-configuration|ionisation|isoelectronic|nuclide|periodic|group2|ionic-radius|transition-metals)|үелэх/i, "Атом, үелэх систем"],
  [/^(bonding|vsepr|sigma-pi|polarity|ionic-bonding|metallic-bonding|lattice|structure-|boiling-points|states-of-matter)|холбоо/i, "Химийн холбоо, бүтэц"],
  [/(-tests|flame-tests|chromatography|separation|lab-techniques|qualitative-analysis|precipitat|solubility|salt-preparation|gas-identification|gas-preparation|gas-handling|conductivity|electrolytes|ionic-equations|acid-reactions)|ион ба хий/i, "Шинжилгээ, лабораторийн арга"],
  [/^(mole|stoichiometry|avogadro|dilution|empirical|formula-|gas-volume|gas-density|molar-volume|ideal-gas|real-gases|limiting|purity|mixture|alloy|composition|combustion-analysis|titration|industrial-calculation|atomic-mass|relative-atomic-mass|organic-chain-calculation)/i, "Химийн тооцоо"],
];
function scienceDomain(subject, ...labels) {
  const rules = subject === "biology" ? biologyDomainRules : chemistryDomainRules;
  for (const label of labels) for (const [pattern, name] of rules) if (label && pattern.test(label)) return name;
  return subject === "biology" ? "Эс, молекул" : "Хими ба нийгэм";
}
/** Read a pack figure (an SVG file next to the year's JSON) into the shared figure writer. */
/**
 * Biology's generic "№ | Бүтэц / жишээ" tables only restate the numbered items already listed in the prompt,
 * and their small text is hard to read on a phone. A table of that template whose every word is already in the
 * question or its options is left out; any table or drawing that adds information is kept.
 */
function repeatsPrompt(figure, yearDir, text) {
  if (!figure?.path) return false;
  const file = join(yearDir, figure.path);
  if (!existsSync(file)) return false;
  const svg = readFileSync(file, "utf8");
  if (!svg.includes("Бүтэц / жишээ")) return false;
  const words = value => (value.toLowerCase().match(/[\p{L}\p{N}.,%°+-]+/gu) ?? []).map(word => word.replace(/[.,]+$/, "")).filter(Boolean);
  const decode = value => value.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
  const cells = words(decode([...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map(match => match[1]).join(" "))).filter(word => !["№", "бүтэц", "жишээ"].includes(word));
  const known = new Set(words(text));
  return cells.length > 0 && cells.every(word => known.has(word));
}
function packFigure(figure, subject, slug, key, yearDir) {
  if (!figure?.path) return undefined;
  const file = join(yearDir, figure.path);
  if (!existsSync(file)) { fail(`${slug} ${key}: missing figure ${figure.path}`); return undefined; }
  return figureFrom({ svg: readFileSync(file, "utf8"), title: figure.alt }, subject, slug, key, figure.alt);
}
const scienceSpec = {
  biology: { prefix: "b", label: "Биологи", genitive: "биологийн", minutes: 80, forms: 3, partTwoNote: "Хоёрдугаар хэсгийн дэд асуулт бүрт тоон хариу эсвэл сонголтын дугаарыг бичнэ." },
  chemistry: { prefix: "c", label: "Хими", genitive: "химийн", minutes: 100, forms: 3, partTwoNote: "Хоёрдугаар хэсгийн a–h нүд бүрт нэг цифр бичнэ." },
};
// The Biology pack's generator joined case endings to ordinary nouns with a hyphen ("Шош-ийн"). Mongolian writes that
// hyphen only after abbreviations, units and numbers (ДНХ-ийн, АДГ-ээс, 5 мин-д), so these are spelled out here.
// Each form was checked by hand; whole phrases come first where a term was also capitalised mid-sentence.
const biologyPhrases = [
  ["Утааны Нүүрстөрөгчийн дутуу исэл-ийн", "Утааны нүүрстөрөгчийн дутуу ислийн"],
  ["Утааны Карциноген-ийн", "Утааны карциногены"],
  ["Утааны Никотин-ийн", "Утааны никотины"],
  [". хонь-д", ". Хонинд"],
];
const biologyWords = {
  "шош-ийн": "шошны", "шош-тай": "шоштой", "шош-ийг": "шошийг",
  "хулуу-ийн": "хулууны", "хулуу-тай": "хулуутай", "хулуу-ийг": "хулууг",
  "наранцэцэг-ийн": "наранцэцгийн", "наранцэцэг-тай": "наранцэцэгтэй", "наранцэцэг-ийг": "наранцэцгийг",
  "хорхой-ийн": "хорхойн", "метафаз-ыг": "метафазыг", "анафаз-ыг": "анафазыг", "телофаз-ыг": "телофазыг",
  "эс-д": "эсэд", "эс-ийн": "эсийн", "үр-ийн": "үрийн", "хөрөнгө-ийн": "хөрөнгийн", "бактер-ийн": "бактерийн",
  "мөөг-ийн": "мөөгийн", "планари-ийн": "планарийн", "туулай-д": "туулайд", "гахай-д": "гахайд", "хонь-д": "хонинд",
  "инсулин-ийн": "инсулины", "даавар-ийн": "дааврын", "уураг-ийн": "уургийн", "булчин-д": "булчинд",
  "амсар-аар": "амсраар", "хана-аар": "ханаар", "судас-аар": "судсаар", "тос-ыг": "тосыг", "хөгц-ийн": "хөгцийн",
  "исэл-ийн": "ислийн", "карциноген-ийн": "карциногены", "никотин-ийн": "никотины", "пепсин-д": "пепсинд",
  "амилаза-д": "амилазад", "трипсин-д": "трипсинд", "наймаалж-ийг": "наймаалжийг", "сөөг-ийн": "сөөгийн",
  "хясаа-ийг": "хясааг", "бут-ийн": "бутын", "хумс-ийг": "хумсыг", "өөх-ыг": "өөхийг", "өвс-ийн": "өвсний",
  "бүлэг-тэй": "бүлэгтэй", "саруул-д": "Саруулд", "тэмүүлэн-д": "Тэмүүлэнд", "энхжин-д": "Энхжинд",
  "иш-д": "ишинд", "амьсгал-д": "амьсгалд", "ой-д": "ойд", "мөчир-д": "мөчирт", "дарамт-д": "дарамтад",
  "хээр-д": "хээрт", "үндэс-д": "үндсэнд", "алим-ийн": "алимны", "хомсдол-д": "хомсдолд", "газар-д": "газарт",
  "нуур-аас": "нуураас", "рашаан-аас": "рашаанаас", "орчин-аас": "орчноос",
};
const hyphenCase = /([А-ЯӨҮЁа-яөүё]+)-(ийн|ын|ийг|ыг|д|т|аас|ээс|оос|өөс|тай|тэй|той|аар|ээр|оор|өөр)(?=[\s.,;:?!)]|$)/gu;
const biologyWord = new RegExp(Object.keys(biologyWords).sort((a, b) => b.length - a.length).join("|"), "giu");
function biologyText(text) {
  let out = text;
  for (const [from, to] of biologyPhrases) out = out.replaceAll(from, to);
  return out.replace(biologyWord, match => {
    const fixed = biologyWords[match.toLocaleLowerCase("mn")];
    // Keep a capital at the start of a sentence; names (Саруул) are capitalised in the table itself.
    return match[0] !== match[0].toLocaleLowerCase("mn") ? fixed[0].toLocaleUpperCase("mn") + fixed.slice(1) : fixed;
  });
}
/** Every string in a Biology form, reworded; anything still hyphenated on an ordinary noun fails the build. */
function rewordBiology(value, slug) {
  if (typeof value === "string") {
    const out = biologyText(value);
    for (const match of out.matchAll(hyphenCase)) if (!/^[А-ЯӨҮЁ]{2,}$/u.test(match[1]) && match[1] !== "мин") fail(`${slug}: unreviewed hyphenated form "${match[0]}"`);
    return out;
  }
  if (Array.isArray(value)) return value.map(item => rewordBiology(item, slug));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, rewordBiology(item, slug)]));
  return value;
}

function buildScience(subject, rawMock, year, number, yearDir) {
  const spec = scienceSpec[subject];
  const mock = subject === "biology" ? rewordBiology(rawMock, `${subject} ${year} ${number}`) : rawMock;
  const form = `${spec.prefix.toUpperCase()}${number}`;
  const slug = `eesh-${subject}-${year}-${spec.prefix}${number}`;
  if (slugSeen.has(slug)) fail(`duplicate slug ${slug}`);
  slugSeen.add(slug);
  if (mock.subject !== subject) fail(`${slug}: subject ${mock.subject}`);
  if (Number(mock.referenceYear) !== year) fail(`${slug}: referenceYear ${mock.referenceYear}`);
  if (Number(mock.durationMinutes) !== spec.minutes) fail(`${slug}: duration ${mock.durationMinutes}`);
  const [partOne, partTwo] = mock.sections ?? [];
  const groups = [{ id: "part-1", title: "Нэгдүгээр хэсэг · Сонгох даалгавар", section: "I хэсэг", instructions: "Даалгавар бүрт нэг зөв хариултыг сонго." }];
  const questions = [];
  const pushQuestion = question => {
    if (questionIds.has(question.id)) fail(`duplicate question ${question.id}`);
    questionIds.add(question.id);
    questions.push(question);
  };
  for (const [index, question] of (partOne?.questions ?? []).entries()) {
    const label = String(question.id ?? index + 1);
    if (question.type !== "multiple-choice") { fail(`${slug} q${label}: unknown type ${question.type}`); continue; }
    const raw = ["A", "B", "C", "D", "E"].map(letter => clean(question.options?.[letter] ?? ""));
    if (raw.some(value => !value)) fail(`${slug} q${label}: missing option`);
    // Table-style options ("ammonia | chlorine | …") name their columns so each row reads on its own.
    const columns = Array.isArray(question.optionColumns) ? question.optionColumns.map(clean) : null;
    const values = columns ? raw.map(value => value.split("|").map((cell, cellIndex) => `${columns[cellIndex] ?? ""}: ${cell.trim()}`).join(" · ")) : raw;
    if (new Set(values).size !== values.length) fail(`${slug} q${label}: repeated option`);
    const answer = optionByLetter(values, question.answer);
    if (!answer) fail(`${slug} q${label}: bad answer ${question.answer}`);
    if (clean(question.answerText) && optionByLetter(raw, question.answer) !== clean(question.answerText)) fail(`${slug} q${label}: answerText does not match key`);
    const redundant = subject === "biology" && repeatsPrompt(question.figure, yearDir, `${question.prompt} ${raw.join(" ")}`);
    if (redundant) summary.repeatedFigures = (summary.repeatedFigures ?? 0) + 1;
    const figure = redundant ? undefined : packFigure(question.figure, subject, slug, `q${label}`, yearDir);
    pushQuestion({
      id: `${slug}-q${label}`, number: label, groupId: "part-1", kind: "choice", points: Number(question.points) || 1,
      domain: scienceDomain(subject, question.skill), prompt: clean(question.prompt), options: values, optionLabels: ["A", "B", "C", "D", "E"],
      // A bare result such as "+6." reads better beside the option it explains.
      answers: [answer], answerDisplay: answer, explanation: clean(question.explanation).length < 12 ? `${answer}: ${clean(question.explanation)}` : clean(question.explanation), ...(figure ? { figure } : {}),
    });
  }
  for (const [taskIndex, task] of (partTwo?.tasks ?? []).entries()) {
    const taskId = `task-${taskIndex + 1}`;
    const printed = clean(task.id) || `2.${taskIndex + 1}`;
    const figure = packFigure(task.figure, subject, slug, `t${printed.replace(/\./g, "-")}`, yearDir);
    const choices = task.choices && typeof task.choices === "object" ? Object.entries(task.choices).map(([key, value]) => `${key}. ${clean(value)}`).join("\n") : "";
    const provisional = task.provisional || /provisional/i.test(String(task.referenceMatchStatus ?? ""));
    const instructions = [clean(task.prompt), choices ? `Сонголт:\n${choices}` : "", provisional ? "Тэмдэглэл: энэ оны албан II хэсгийн эх олдоогүй тул сэдэв, бүтцийг нь баримтлан зохиосон." : ""].filter(Boolean).join("\n\n");
    groups.push({ id: taskId, title: printed, section: "II хэсэг", pageMode: "group", instructions, ...(task.topic ? { contextTitle: clean(task.topic) } : {}), ...(figure ? { figure } : {}) });
    const parts = task.parts ?? [];
    if (!parts.length) fail(`${slug} ${printed}: no parts`);
    for (const [partIndex, item] of parts.entries()) {
      const letter = clean(item.id) || "abcdefgh"[partIndex];
      const answer = asciiNumber(clean(item.answer)).replace(",", ".");
      if (!numericAnswer(answer)) fail(`${slug} ${printed}${letter}: non-numeric answer ${item.answer}`);
      const prompt = clean(item.prompt);
      pushQuestion({
        id: `${slug}-${taskId}-${letter}`, number: `${printed}${letter}`, groupId: taskId, kind: "number", matcher: "numeric",
        points: Number(item.points) || 0, domain: scienceDomain(subject, task.topic, task.skill),
        prompt: /^\(?[a-h]\)?$/i.test(prompt) ? `(${letter}) нүд` : prompt,
        answers: [answer], answerDisplay: clean(item.answer), explanation: clean(item.explanation),
      });
    }
  }
  const total = questions.reduce((sum, question) => sum + question.points, 0);
  if (total !== 100 || Number(mock.totalPoints) !== 100) fail(`${slug}: points total ${total} (pack ${mock.totalPoints})`);
  summary.points.total = (summary.points.total ?? 0) + total;
  const choiceCount = questions.filter(question => question.groupId === "part-1").length;
  const taskCount = groups.length - 1;
  const instructions = (mock.instructions ?? []).map(clean).filter(Boolean);
  if (!instructions.length) instructions.push(`${spec.minutes} минут. Нийт 100 оноо.`, "I хэсгийн даалгавар бүрт A–E-ээс нэг хариу сонго.", spec.partTwoNote);
  return baseMock({
    slug, subject, year, form,
    title: `ЭЕШ · ${spec.label} · ${year} · ${form}`,
    description: `${year} оны ЭЕШ-ийн ${spec.genitive} бүтэцтэй, энэ сайтад зориулж зохиосон дадлагын шалгалт. ${choiceCount} сонгох, ${taskCount} бүтээх даалгавар; ${spec.minutes} минут.`,
    durationMinutes: spec.minutes, points: total, calculator: false, instructions, groups, questions,
    sourceNote: "Даалгавар, хариу, тайлбарыг энэ сайтад зориулж зохиосон; албан ЭЕШ-ийн асуулт, зураг, түлхүүр ашиглаагүй. Багшийн хяналт хүлээгдэж байна.",
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
const rebuilt = only.size ? [...only] : Object.keys(SUBJECTS);
for (const target of only.size ? rebuilt.flatMap(subject => [join(CONTENT, subject), join(PUBLIC, subject)]) : [CONTENT, PUBLIC]) {
  if (existsSync(target)) rmSync(target, { recursive: true, force: true });
}

const catalog = { generatedAt: "2026-11-10", subjects: {}, mocks: [] };
for (const [subject, spec] of Object.entries(SUBJECTS)) {
  const subjectDir = join(SOURCE, spec.dir);
  if (!existsSync(subjectDir)) { fail(`missing ${subjectDir}`); continue; }
  const years = readdirSync(subjectDir).filter(name => spec.yearDir.test(name)).map(Number).sort((a, b) => a - b);
  catalog.subjects[subject] = { label: spec.ru, title: spec.title, years: [...years].sort((a, b) => b - a) };
  writing = rebuilt.includes(subject);
  for (const year of years) {
    const yearDir = join(subjectDir, String(year));
    const files = readdirSync(yearDir).filter(name => spec.file.test(name)).sort((a, b) => Number(spec.file.exec(a)[1]) - Number(spec.file.exec(b)[1]));
    const expected = spec.forms ?? 5;
    if (files.length !== expected) fail(`${subject} ${year}: expected ${expected} mocks, found ${files.length}`);
    for (const file of files) {
      const number = Number(spec.file.exec(file)[1]);
      const mock = readJson(join(yearDir, file));
      const built = subject === "math" ? buildMath(mock, year, number) : subject === "physics" ? buildPhysics(mock, year, number)
        : subject === "biology" || subject === "chemistry" ? buildScience(subject, mock, year, number, yearDir) : buildEnglish(mock, year);
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
writing = true;
writeJson(CATALOG, catalog);
writeText(CATALOG_TS, "// Generated by scripts/build-entrance-mocks.mjs. Do not edit by hand.\n// Metadata only: no question text, answers or explanations.\nexport const entranceCatalog = " + JSON.stringify(catalog, null, 2) + ";\n");

console.log(JSON.stringify({ ...summary, problems: problems.length, problemsList: problems.slice(0, 40) }, null, 2));
if (problems.length) {
  console.error(`BUILD FAILED: ${problems.length} problem(s)`);
  process.exit(1);
}
console.log(`Built ${summary.mocks} mocks, ${summary.questions} questions, ${summary.figures} diagrams.`);
