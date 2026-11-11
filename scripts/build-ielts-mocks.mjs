// Builds the website's IELTS Academic mocks 07–12 from the offline authoring pack.
// Input : MockExmps/IELTS/mock-XX/mock.json, writing-1.svg and audio/part-N.mp3 (never served; the pack stays local)
// Output: src/modules/exams/ielts-forms.json      server-side form content with answers and scripts
//         src/modules/exams/ielts-forms-audio.json answer-free audio catalogue (file prefix and part lengths)
//         assets/ielts-forms/ielts-XX-part-N.mp3  re-encoded recordings, served only through the /audio/forms routes
//         assets/ielts-forms/manifest.json        source/output hashes and durations for provenance
//         public/ielts-mocks/mock-XX-*.svg         Writing Task 1 visuals and the two Listening plans
//
// Run: node scripts/build-ielts-mocks.mjs   (needs ffmpeg and ffprobe on PATH)
// The recordings are re-encoded to 48 kbps mono and kept in their own folder, which only the /audio/forms routes
// bundle (each Vercel function must stay under 250 MB). A recording is re-encoded only when its source hash changes.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const ROOT = resolve(process.cwd());
const SOURCE = join(ROOT, "MockExmps", "IELTS");
const FORMS = join(ROOT, "src", "modules", "exams", "ielts-forms.json");
const AUDIO_CATALOG = join(ROOT, "src", "modules", "exams", "ielts-forms-audio.json");
const AUDIO_DIR = join(ROOT, "assets", "ielts-forms");
const MANIFEST = join(AUDIO_DIR, "manifest.json");
const PUBLIC = join(ROOT, "public", "ielts-mocks");
const PAPERS = [7, 8, 9, 10, 11, 12];
const BITRATE = "48k";

const problems = [];
const fail = message => problems.push(message);
const sha256 = data => createHash("sha256").update(data).digest("hex");
const clean = value => String(value ?? "").replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").trim();
const pad = number => String(number).padStart(2, "0");
function write(file, content) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content, "utf8");
}

/** Accept the usual written variants of a time or a date as well as the printed key. */
function answerVariants(answers) {
  const out = [];
  for (const raw of answers.map(clean)) {
    out.push(raw);
    if (raw.includes("’")) out.push(raw.replace(/’/g, "'"));
    const time = /^(\d{1,2}):(\d{2})$/.exec(raw);
    if (time) out.push(`${time[1]}.${time[2]}`, `${Number(time[1])}:${time[2]}`);
    const date = /^(\d{1,2}) ([A-Z][a-z]+)$/.exec(raw);
    // Ordinals only where English uses "th" (4th–20th, 24th–30th); never "1th" or "22th".
    const day = date ? Number(date[1]) : 0;
    if (date) out.push(`${date[2]} ${date[1]}`, ...((day >= 4 && day <= 20) || (day >= 24 && day <= 30) ? [`${date[1]}th ${date[2]}`] : []));
  }
  return [...new Set(out)];
}

const verdicts = {
  "true-false-not-given": ["TRUE", "FALSE", "NOT GIVEN"],
  "yes-no-not-given": ["YES", "NO", "NOT GIVEN"],
};

/** One authored item → one site question. Choice answers are stored as the option text, as in Mocks 01–06. */
function question(paper, section, group, item, base) {
  const id = `${section}-${pad(paper)}-${item.number}`;
  const explanation = clean(item.explanation) === clean(item.evidence)
    ? `Evidence: “${clean(item.evidence)}”`
    : `${clean(item.explanation)} Evidence: “${clean(item.evidence)}”`;
  const common = { id, number: String(item.number), domain: section === "il" ? "Listening" : "Academic Reading", explanation, ...base };
  const kind = group.kind;
  if (kind === "completion") {
    if (!/_{3,}/.test(item.prompt)) fail(`${id}: completion without a gap`);
    // "ONE WORD AND/OR A NUMBER" allows a number beside the word ("19 October"), so the limit counts it.
    const maxWords = (group.maxWords ?? 2) + (group.numbersAllowed ? 1 : 0);
    const answers = answerVariants(item.answers);
    if (answers.some(answer => answer.split(/\s+/).length > maxWords)) fail(`${id}: an accepted answer is longer than ${maxWords} words`);
    return { ...common, kind: "short", answers, maxWords, prompt: clean(item.prompt) };
  }
  if (item.answers.length !== 1) fail(`${id}: ${kind} with ${item.answers.length} answers`);
  const key = clean(item.answers[0]);
  if (verdicts[kind]) {
    const options = verdicts[kind];
    if (!options.includes(key)) fail(`${id}: answer ${key} not in ${options}`);
    return { ...common, kind: "choice", prompt: clean(item.prompt), options, answers: [key] };
  }
  if (kind === "multiple-choice") {
    const options = (item.options ?? []).map(clean);
    const labels = options.map((_, index) => String.fromCharCode(65 + index));
    const answer = options[labels.indexOf(key)];
    if (!answer) fail(`${id}: answer ${key} not among ${labels}`);
    if (new Set(options).size !== options.length) fail(`${id}: repeated option`);
    return { ...common, kind: "choice", prompt: clean(item.prompt), options, optionLabels: labels, answers: [answer] };
  }
  if (kind === "matching" || kind === "headings") {
    const bank = Object.entries(group.bank ?? {}).map(([label, text]) => [label, clean(text)]);
    if (!bank.length) fail(`${id}: ${kind} without a bank`);
    // "Paragraph" and "Location on the plan" repeat for every letter; name the letter instead.
    const uniform = new Set(bank.map(([, text]) => text)).size === 1;
    const options = bank.map(([label, text]) => uniform ? `${text.replace(/ on the plan$/i, "")} ${label}` : text);
    const labels = bank.map(([label]) => label);
    const answer = options[labels.indexOf(key)];
    if (!answer) fail(`${id}: answer ${key} not in bank ${labels}`);
    return { ...common, kind: "choice", prompt: clean(item.prompt), options, ...(uniform ? {} : { optionLabels: labels }), answers: [answer] };
  }
  fail(`${id}: unknown kind ${kind}`);
  return { ...common, kind: "short", answers: item.answers, prompt: clean(item.prompt) };
}

/** A pack table ("| a | b |" rows) becomes the site's pipe rows; other lines stay as written. */
function visualText(markdown) {
  const lines = clean(markdown).split("\n").filter(line => !/^!\[.*\]\(.*\)$/.test(line.trim()));
  return clean(lines.filter(line => !/^\|\s*:?-{3,}/.test(line.trim()))
    .map(line => line.trim().startsWith("|") ? line.trim().replace(/^\|\s*|\s*\|$/g, "").split(/\s*\|\s*/).join(" | ") : line)
    .join("\n").replace(/\n{3,}/g, "\n\n"));
}

const escapeXml = text => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
/** The pack draws its Listening plans in fixed-width text; keep that layout exactly in an SVG. */
function planSvg(visual, title) {
  const caption = clean(visual.split("```")[0]);
  const art = (/```text\n([\s\S]*?)```/.exec(visual)?.[1] ?? "").replace(/\s+$/, "").split("\n");
  if (art.length < 3) fail(`${title}: plan drawing missing`);
  const width = Math.max(...art.map(line => line.length));
  const charWidth = 12, lineHeight = 26;
  const w = Math.max(640, width * charWidth + 60);
  // Wrap the caption to the drawing's width (about 8.5 px per character at 17 px Arial).
  const perLine = Math.floor((w - 60) / 8.5), captionLines = [];
  for (const word of caption.split(/\s+/)) {
    const last = captionLines.length - 1;
    if (last >= 0 && (captionLines[last] + " " + word).length <= perLine) captionLines[last] += " " + word;
    else captionLines.push(word);
  }
  const top = 46 + captionLines.length * 24, h = top + art.length * lineHeight + 30;
  const captionRows = captionLines.map((line, index) => `<text x="30" y="${36 + index * 24}">${escapeXml(line)}</text>`).join("");
  const rows = art.map((line, index) => `<text x="30" y="${top + index * lineHeight}" xml:space="preserve">${escapeXml(line)}</text>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img"><title>${escapeXml(title)}</title>`
    + `<rect width="${w}" height="${h}" fill="white"/><g font-family="Arial, sans-serif" font-size="17" fill="#18232c">${captionRows}</g>`
    + `<g font-family="Consolas, 'Courier New', monospace" font-size="20" fill="#18232c">${rows}</g></svg>\n`;
}

function svgSize(svg) {
  const root = /<svg\b([^>]*)>/i.exec(svg)?.[1] ?? "";
  return { width: Number(/\bwidth="([\d.]+)"/.exec(root)?.[1]) || undefined, height: Number(/\bheight="([\d.]+)"/.exec(root)?.[1]) || undefined };
}
function safeSvg(svg, label) {
  if (/<script|foreignObject|javascript:|\son\w+=/i.test(svg)) fail(`${label}: unsafe SVG`);
  return svg.endsWith("\n") ? svg : svg + "\n";
}

const previous = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8")) : { files: [] };
const manifest = { generatedBy: "scripts/build-ielts-mocks.mjs", encoding: `MP3 ${BITRATE} mono, 24 kHz (ffmpeg, bit-exact flags)`, source: "MockExmps/IELTS audio (Kokoro-82M stock voices; see the pack's audio-manifest.json)", files: [] };
const audio = {};
const forms = [];

function encode(source, target) {
  const sourceHash = sha256(readFileSync(source));
  const known = previous.files.find(file => file.file === target.slice(AUDIO_DIR.length + 1));
  if (known && known.sourceSha256 === sourceHash && existsSync(target) && sha256(readFileSync(target)) === known.sha256) return { sourceHash, seconds: known.seconds, hash: known.sha256 };
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", source, "-map_metadata", "-1", "-ac", "1", "-ar", "24000", "-b:a", BITRATE, "-fflags", "+bitexact", "-flags:a", "+bitexact", target]);
  const seconds = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", target], { encoding: "utf8" }).trim());
  if (!Number.isFinite(seconds) || seconds < 60) fail(`${target}: bad duration ${seconds}`);
  return { sourceHash, seconds: Math.round(seconds * 100) / 100, hash: sha256(readFileSync(target)) };
}

for (const paper of PAPERS) {
  const folder = join(SOURCE, `mock-${pad(paper)}`);
  const mock = JSON.parse(readFileSync(join(folder, "mock.json"), "utf8"));
  const slug = `ielts-academic-${pad(paper)}`;
  if (Number(mock.number) !== paper) fail(`${slug}: number ${mock.number}`);

  // Listening: four parts of ten. Each part's script is stored once; the loader attaches it to the questions privately.
  const listening = [];
  const scripts = mock.listening.map((part, index) => `Part ${index + 1} · ${clean(part.title)}\n\n${clean(part.script)}`);
  for (const [index, part] of mock.listening.entries()) {
    const partNumber = index + 1;
    let figure;
    if (part.visual) {
      const svg = planSvg(part.visual, `Listening Part ${partNumber} plan`);
      const file = `mock-${pad(paper)}-listening-plan.svg`;
      write(join(PUBLIC, file), svg);
      figure = { kind: "image", src: `/ielts-mocks/${file}`, alt: clean(part.visual.split("```")[0]) + " Boxes are labelled A–F.", ...svgSize(svg), expandable: true };
    }
    for (const group of part.groups) for (const item of group.items) {
      const built = question(paper, "il", group, item, { listeningPart: partNumber });
      // "Part N · Title\nitem: instruction" lets the Listening view show the title and instruction once per part.
      built.prompt = `Part ${partNumber} · ${clean(part.title)}\n${built.prompt}: ${clean(group.instruction)}`;
      if (figure && group.kind === "matching") built.figure = figure;
      listening.push(built);
    }
    if (listening.length !== partNumber * 10) fail(`${slug} Listening Part ${partNumber}: ${listening.length} questions so far`);
  }

  // Reading: three passages with lettered paragraphs.
  const passages = mock.reading.map((passage, index) => ({
    title: `Reading passage ${index + 1} · ${clean(passage.title)}`,
    text: Object.entries(passage.paragraphs).map(([letter, text]) => `${letter}. ${clean(text)}`).join("\n\n"),
  }));
  const reading = [];
  for (const [index, passage] of mock.reading.entries()) for (const group of passage.groups) for (const item of group.items) {
    const built = question(paper, "ir", group, item, { passage: passages[index].title });
    built.prompt = `${clean(group.instruction)}\n${built.prompt}`;
    reading.push(built);
  }
  if (listening.length !== 40 || reading.length !== 40) fail(`${slug}: ${listening.length} Listening / ${reading.length} Reading`);
  for (const [section, list] of [["Listening", listening], ["Reading", reading]]) {
    const numbers = list.map(item => Number(item.number));
    if (numbers.some((number, index) => number !== index + 1)) fail(`${slug} ${section}: numbering ${numbers.join(",")}`);
  }

  // Writing: Task 1 shows the pack's original SVG beside its accessible data.
  const [task1, task2] = mock.writing;
  const visualFile = `mock-${pad(paper)}-writing-1.svg`;
  const visualSvg = safeSvg(readFileSync(join(folder, "writing-1.svg"), "utf8"), slug);
  write(join(PUBLIC, visualFile), visualSvg);
  const visualTitle = clean(/<title>([^<]*)<\/title>/.exec(visualSvg)?.[1] ?? "Writing Task 1 visual");
  const [minimum1, minimum2] = mock.writingMinimumWords ?? [150, 250];
  const humanReview = "A qualified human reviewer should assess task achievement or response, coherence and cohesion, lexical resource and grammatical range and accuracy. No automatic band is assigned.";
  const writing = [
    { id: `iw-${pad(paper)}-1`, domain: "Writing", kind: "essay", minWords: minimum1, answers: [],
      prompt: `You should spend about 20 minutes on this task. ${clean(task1.prompt)}`, passage: visualText(task1.visual),
      figure: { kind: "image", src: `/ielts-mocks/${visualFile}`, alt: visualTitle, ...svgSize(visualSvg), expandable: true },
      explanation: `${clean(task1.guidance)} ${humanReview}` },
    { id: `iw-${pad(paper)}-2`, domain: "Writing", kind: "essay", minWords: minimum2, answers: [],
      prompt: `You should spend about 40 minutes on this task. ${clean(task2.prompt)}`,
      explanation: `${clean(task2.guidance)} ${humanReview} Task 2 carries twice the weight of Task 1.` },
  ];

  // Speaking: three familiar topics, the cue card with its rounding-off questions, then the discussion.
  const speakingNote = "A qualified human should review fluency and coherence, vocabulary, grammar and pronunciation. This recorded simulation does not assign an automatic band score.";
  const speak = (id, prompt) => ({ id: `is-${pad(paper)}-${id}`, domain: "Speaking", kind: "speaking", answers: [], prompt, explanation: speakingNote });
  const part1 = Object.entries(mock.speaking.part1).flatMap(([topic, prompts], topicIndex) => prompts.map((prompt, index) => speak(`p1-${topicIndex + 1}-${index + 1}`, `${topic} · ${clean(prompt)}`)));
  const card = mock.speaking.part2;
  const cue = `${clean(card.cue)} You should say: ${card.points.map(clean).join("; ")}; and explain ${clean(card.explain)}`;
  const speaking = {
    part1,
    notes: speak("notes", cue),
    part2: [speak("p2", cue), ...card.followups.map((prompt, index) => speak(`p2-follow-${index + 1}`, `Rounding-off question: ${clean(prompt)}`))],
    part3: mock.speaking.part3.map((prompt, index) => speak(`p3-${index + 1}`, clean(prompt))),
  };

  // Audio: the four part recordings, re-encoded for serving.
  const prefix = `ielts-${pad(paper)}`;
  const seconds = [];
  for (const part of [1, 2, 3, 4]) {
    const source = join(folder, "audio", `part-${part}.mp3`);
    const target = join(AUDIO_DIR, `${prefix}-part-${part}.mp3`);
    const result = encode(source, target);
    seconds.push(result.seconds);
    manifest.files.push({ file: `${prefix}-part-${part}.mp3`, slug, part, seconds: result.seconds, sha256: result.hash, sourceFile: `MockExmps/IELTS/mock-${pad(paper)}/audio/part-${part}.mp3`, sourceSha256: result.sourceHash, bytes: readFileSync(target).length });
  }
  const total = seconds.reduce((sum, value) => sum + value, 0);
  if (total > 1800) fail(`${slug}: recordings run ${total}s, longer than the 30-minute Listening stage`);
  audio[slug] = { prefix, seconds };

  const readingTitles = mock.reading.map(passage => clean(passage.title).toLowerCase().replace(/^(a|an|the) /, "")).join("; ");
  forms.push({
    slug, paper, title: `IELTS Academic · Full Mock ${pad(paper)}`,
    description: `Original practice form ${pad(paper)}: four synthetic Listening recordings, three Reading passages (${readingTitles}), two Writing tasks and a recorded Speaking simulation. Teacher review and learner calibration remain pending.`,
    listening, scripts, reading, passages, writing, speaking,
  });
}

if (problems.length) {
  console.error(problems.slice(0, 40).join("\n"));
  console.error(`BUILD FAILED: ${problems.length} problem(s)`);
  process.exit(1);
}
write(FORMS, JSON.stringify(forms, null, 1) + "\n");
write(AUDIO_CATALOG, JSON.stringify(audio, null, 2) + "\n");
write(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
const bytes = manifest.files.reduce((sum, file) => sum + file.bytes, 0);
console.log(`Built ${forms.length} IELTS forms, ${forms.length * 80} objective questions, ${manifest.files.length} recordings (${(bytes / 1e6).toFixed(1)} MB).`);
