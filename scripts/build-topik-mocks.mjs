// Convert the offline TOPIK forms (MockExmps/TOPIK/topik-i|topik-ii/mock-0N.json, checked by
// MockExmps/TOPIK/_source/validate.py) into private site definitions in assets/topik, answer-free pictures in
// public/exam-assets/topik and a client-safe catalogue. Never ship MockExmps itself. The paper's blocks, printed
// instructions, examples (보기) and item points come from MockExmps/TOPIK/_source/structure.json.
// Run after editing a form; if its listening scripts changed, run `python scripts/generate-topik-audio.py` and then
// this script again, because the recorded item timings feed the Listening stage.
// `--allow-missing-audio` builds a form whose recording is not made yet (development only: the stage then plays nothing).
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join('MockExmps', 'TOPIK');
const structure = JSON.parse(readFileSync(join(root, '_source', 'structure.json'), 'utf8'));
const target = join('assets', 'topik');
const pictureDir = join('public', 'exam-assets', 'topik');
const audioCatalogFile = join('src', 'modules', 'exams', 'topik', 'audio-catalog.json');
const audio = existsSync(audioCatalogFile) ? JSON.parse(readFileSync(audioCatalogFile, 'utf8')) : {};
const allowMissingAudio = process.argv.includes('--allow-missing-audio');
// `--only=topik1-mock-01,topik2-mock-01` builds just those forms (a form still being written is skipped).
const only = process.argv.find(arg => arg.startsWith('--only='))?.slice(7).split(',');
mkdirSync(target, { recursive: true });
// Pictures are copied fresh; with --only, only those forms' folders are cleared.
for (const dir of only ? only.map(slug => join(pictureDir, slug)) : [pictureDir]) rmSync(dir, { recursive: true, force: true });

const CIRCLED = ['①', '②', '③', '④'];
// The recording is cut into four part tracks (the audio routes serve parts 1–4); the generator uses the same split.
const LISTENING_PARTS = { I: [[1, 14], [15, 21], [22, 26], [27, 30]], II: [[1, 16], [17, 30], [31, 40], [41, 50]] };
const partOf = (level, number) => 1 + LISTENING_PARTS[level].findIndex(([from, to]) => number >= from && number <= to);

const SECTION = {
  listening: { key: 'l', ko: '듣기', mn: 'Сонсох' },
  writing: { key: 'w', ko: '쓰기', mn: 'Бичих' },
  reading: { key: 'r', ko: '읽기', mn: 'Унших' },
};
// Mongolian names for the results' "what to review" list and a one-line note under each Korean instruction.
const TASKS = {
  answer: ['Хариулт сонгох', 'Асуултыг сонсоод тохирох хариултыг сонгоно.'],
  continue: ['Үргэлжлэх үг', 'Сонссон үгийн дараа хэлэх үгийг сонгоно.'],
  place: ['Газар таних', 'Яриа хаана болж байгааг сонгоно.'],
  topic: ['Сэдэв таних', 'Юуны тухай ярьж (бичиж) байгааг сонгоно.'],
  picture: ['Зураг сонгох', 'Сонссон агуулгад таарах зургийг (графикийг) сонгоно.'],
  match: ['Агуулга таарах', 'Агуулгатай таарч байгаа өгүүлбэрийг сонгоно.'],
  'woman-idea': ['Эмэгтэйн гол санаа', 'Эмэгтэйн гол санааг сонгоно.'],
  'man-idea': ['Эрэгтэйн гол санаа', 'Эрэгтэйн гол санааг сонгоно.'],
  announcement: ['Мэдээлэл, зарлал', 'Сонсоод асуултуудад хариулна.'],
  dialogue: ['Урт яриа', 'Сонсоод асуултуудад хариулна.'],
  interview: ['Ярилцлага', 'Сонсоод асуултуудад хариулна.'],
  'next-line': ['Дараагийн үг', 'Яриаг сонсоод дараа нь хэлэх үгийг сонгоно.'],
  'next-action': ['Дараагийн үйлдэл', 'Эмэгтэй дараа нь юу хийхийг сонгоно.'],
  debate: ['Мэтгэлцээн', 'Мэтгэлцээнийг сонсоод асуултуудад хариулна.'],
  lecture: ['Лекц', 'Лекцийг сонсоод асуултуудад хариулна.'],
  speech: ['Илтгэл, үг хэлэх', 'Сонсоод асуултуудад хариулна.'],
  program: ['Танин мэдэхүйн нэвтрүүлэг', 'Нэвтрүүлгийг сонсоод асуултуудад хариулна.'],
  talk: ['Ярилцлага, хэлэлцүүлэг', 'Ярилцлагыг сонсоод асуултуудад хариулна.'],
  documentary: ['Баримтат нэвтрүүлэг', 'Баримтат нэвтрүүлгийг сонсоод асуултуудад хариулна.'],
  blank: ['Хоосон зай нөхөх', '(    )-д орох хамгийн тохирох үгийг сонгоно.'],
  'doc-not': ['Таарахгүйг олох', 'Уншаад агуулгатай ТААРАХГҮЙ өгүүлбэрийг сонгоно.'],
  'main-idea': ['Гол санаа', 'Уншаад гол санааг сонгоно.'],
  passage: ['Бичвэр унших', 'Уншаад асуултуудад хариулна.'],
  doc: ['Баримт бичиг', 'Уншаад асуултуудад хариулна.'],
  order: ['Дараалал', 'Өгүүлбэрүүдийг зөв дараалалд оруулсан хувилбарыг сонгоно.'],
  'blank-grammar': ['Хэлзүйн хэлбэр', '(    )-д орох хэлзүйн хэлбэрийг сонгоно.'],
  similar: ['Ойролцоо утга', 'Доогуур зурсан хэсэгтэй утга ойролцоо хэлбэрийг сонгоно.'],
  'what-about': ['Юуны тухай вэ', 'Бичвэр юуны тухай болохыг сонгоно.'],
  'blank-content': ['Агуулга нөхөх', '(    )-д орох агуулгыг сонгоно.'],
  essay: ['Эссэ', 'Уншаад асуултуудад хариулна.'],
  headline: ['Сонины гарчиг', 'Сонины гарчгийг хамгийн сайн тайлбарласныг сонгоно.'],
  theme: ['Бичвэрийн сэдэв', 'Бичвэрийн сэдвийг сонгоно.'],
  insert: ['Өгүүлбэр байрлуулах', 'Өгөгдсөн өгүүлбэр орох байрыг сонгоно.'],
  story: ['Уран зохиол', 'Уншаад асуултуудад хариулна.'],
  'sentence-gaps': ['Өгүүлбэр нөхөж бичих', '㉠, ㉡-д тохирох өгүүлбэрийг тус бүр бичнэ.'],
  'graph-essay': ['Хүснэгт, графикаар бичих', 'Өгөгдсөн мэдээллээр 200–300 тэмдэгтийн бичвэр бичнэ (гарчиггүй).'],
};
const WRITING_TASK = { 54: ['Санал бодлын эссэ', 'Сэдвээр 600–700 тэмдэгтийн эссэ бичнэ; асуултыг хуулж бичихгүй.'] };

const range = (from, to) => from === to ? `[${from}]` : `[${from}～${to}]`;
const spokenLabel = turns => { const order = [...new Set(turns.map(turn => turn.speaker))]; return speaker => ['가', '나'][order.indexOf(speaker)] ?? speaker; };
const transcript = turns => turns.map(turn => `${turn.speaker}: ${turn.text}`).join('\n');

/** The printed 보기: listening examples print their dialogue with 가/나, a question to answer leaves 나's line blank. */
function example(block, section) {
  const source = block.example;
  if (!source) return undefined;
  const out = { choices: source.options, answer: source.answer };
  if (source.script) {
    const label = spokenLabel(source.script);
    out.lines = source.script.map(turn => `${label(turn.speaker)}: ${turn.text}`);
    if (['answer', 'continue'].includes(block.task)) out.lines.push('나: ________________');
  }
  if (source.passage) out.passage = source.passage;
  if (section !== 'listening' && !source.passage) throw Error(`${block.from}: reading example without passage`);
  return out;
}

function material(source, keys) {
  const out = {};
  for (const key of keys) if (source[key] !== undefined) out[key] = source[key];
  return out;
}

const copied = new Set();
function picture(levelDir, number, slug, file, alt, missing) {
  const from = join(root, levelDir, `mock-0${number}`, file);
  const out = join(pictureDir, slug, file);
  if (!existsSync(from)) {
    if (!allowMissingAudio) throw Error(`${slug}: missing picture ${from}`);
    missing.push(from);
    return { src: '', alt };
  }
  const body = readFileSync(from, 'utf8');
  if (!/^<svg[^>]*viewBox="0 0 480 360"/.test(body)) throw Error(`${from}: expected a 480×360 SVG`);
  if (/<text\b/.test(body)) throw Error(`${from}: pictures carry no words`);
  if (!copied.has(out)) { mkdirSync(join(pictureDir, slug), { recursive: true }); copyFileSync(from, out); copied.add(out); }
  return { src: `/exam-assets/topik/${slug}/${file}`, alt };
}

const catalog = [];
const ids = new Set();
for (const level of ['I', 'II']) {
  const spec = structure[level];
  const levelDir = level === 'I' ? 'topik-i' : 'topik-ii';
  const levelNumber = level === 'I' ? 1 : 2;
  for (const number of [1, 2, 3]) {
    const file = join(root, levelDir, `mock-0${number}.json`);
    if (!existsSync(file)) { console.warn(`skip ${file}: not written yet`); continue; }
    const form = JSON.parse(readFileSync(file, 'utf8'));
    const slug = `topik${levelNumber}-mock-0${number}`;
    if (only && !only.includes(slug)) continue;
    const formId = `topik-${level.toLowerCase()}-0${number}`;
    if (form.id !== formId) throw Error(`${file}: id ${form.id}, expected ${formId}`);
    const timings = audio[slug];
    const missing = [];
    if (!timings && !allowMissingAudio) throw Error(`${slug}: run scripts/generate-topik-audio.py first (no item timings)`);
    const title = `TOPIK ${level === 'I' ? 'Ⅰ' : 'Ⅱ'} · Mock 0${number}`;
    // themeMn is "Short title: situation, situation, …"; the hub card shows the title and the situations under it.
    const [theme, topics = ''] = form.themeMn.split(/:(.*)/s).map(part => part?.trim());
    const definition = {
      slug, version: 1, program: 'topik', title,
      description: `${spec.title} · ${theme}`,
      points: spec.total,
      notes: [
        'Албан бус, эх зохиомжтой дадлагын mock: албан TOPIK PBT-ийн бүтэц, заавар, асуултын дараалал, оноог дагасан шинэ агуулга.',
        level === 'I' ? 'Сонсох хэсэг хиймэл (VoxCPM2) солонгос дуу хоолойтой; бичлэг бүрийг хоёр удаа уншина.' : 'Сонсох хэсэг хиймэл (VoxCPM2) солонгос дуу хоолойтой; 1–20-ыг нэг удаа, 21–50-ыг хоёр удаа уншина.',
        level === 'I' ? 'Оноо 200-аас; 1-р түвшин 80, 2-р түвшин 140-өөс. Энэ нь дадлагын тооцоо, албан TOPIK түвшин биш.' : 'Сонсох, унших автоматаар (200-аас); бичих хэсгийг жишиг хариу, шалгуураар өөрөө эсвэл AI-аар үнэлнэ. Албан TOPIK түвшин биш.',
      ],
      sources: [
        { label: 'TOPIK 공식 누리집 (국립국제교육원 NIIED) · 시험 구성, 평가 기준, 공개 기출문제', url: 'https://www.topik.go.kr/' },
      ],
      stages: [],
    };
    let recorded = 0;
    for (const [section, blocks] of Object.entries(spec.sections)) {
      const meta = SECTION[section];
      const seconds = spec.minutes[section] * 60;
      const [first, last] = spec.numbering[section];
      const stage = {
        id: `topik-${meta.key}`, title: `${meta.ko} · ${meta.mn}`,
        kind: section === 'listening' ? 'listening' : section === 'writing' ? 'writing' : 'questions', seconds,
        instructions: section === 'listening'
          ? `${first}–${last}-р асуулт, ${spec.minutes[section]} минут. Бичлэг серверийн цагтай зэрэг нэг удаа тоглоно; хуудас тоглож буй асуулт руу шилжинэ. ${level === 'I' ? 'Бүх бичлэгийг хоёр удаа уншина.' : '1–20-ыг нэг удаа, 21–50-ыг хоёр удаа уншина.'} Цаг дуусахад дараагийн хэсэг автоматаар эхэлнэ.`
          : section === 'writing'
            ? `51–54-р асуулт, ${spec.minutes[section]} минут. 51–52-т өгүүлбэр, 53-т 200–300, 54-т 600–700 тэмдэгт (зай орно) бичнэ. Хариу автоматаар хадгалагдана; цаг дуусахад Унших хэсэг эхэлнэ.`
            : `${first}–${last}-р асуулт, ${spec.minutes[section]} минут. Блокуудын хооронд чөлөөтэй шилжинэ. Цаг дуусахад шалгалт дуусна.`,
        groups: [], questions: [],
      };
      const sets = form[section];
      if (!Array.isArray(sets)) throw Error(`${slug}: no ${section}`);
      const setOf = n => sets.find(set => set.numbers.includes(n));
      for (const block of blocks) {
        const groupId = `topik-${meta.key}-${String(block.from).padStart(2, '0')}`;
        const task = block.task === 'essay' && section === 'writing' ? WRITING_TASK[54] : TASKS[block.task];
        if (!task) throw Error(`no task name for ${block.task}`);
        const topic = block.task === 'graph-essay' ? setOf(53)?.writing?.topic : undefined;
        const instruction = block.instruction.replace('{topic}', topic ?? '');
        const plays = section === 'listening' ? spec.repeats[String(block.from)] : undefined;
        const group = {
          id: groupId, title: range(block.from, block.to), section: stage.title, pageMode: 'group',
          instructions: `${instruction}\n${task[1]}`,
          topik: { range: range(block.from, block.to), instruction, ...(plays ? { plays } : {}), ...(block.example ? { example: example(block, section) } : {}) },
        };
        if (block.set) {
          const set = setOf(block.from);
          if (!set || set.numbers.join() !== Object.keys(block.questions).join()) throw Error(`${slug} ${section} ${block.from}: set numbers`);
          Object.assign(group.topik, material(set, ['passage', 'doc', 'chart']));
        }
        stage.groups.push(group);
        for (const [key, spec_q] of Object.entries(block.questions)) {
          const n = Number(key);
          const set = setOf(n);
          if (!set) throw Error(`${slug} ${section} ${n}: no set`);
          const item = set.questions.find(q => q.number === n);
          if (!item) throw Error(`${slug} ${section} ${n}: no question`);
          const id = `topik${levelNumber}-0${number}-${meta.key}${String(n).padStart(2, '0')}`;
          if (ids.has(id)) throw Error('duplicate ' + id);
          ids.add(id);
          const own = block.set ? {} : material(set, ['passage', 'doc', 'chart']);
          const question = {
            id, number: String(n), domain: `${meta.ko} ${range(block.from, block.to)} · ${task[0]}`, groupId, points: spec_q.points,
            prompt: item.prompt ?? instruction,
          };
          if (section === 'writing') {
            const w = set.writing;
            question.kind = 'essay';
            question.answers = [];
            question.explanation = w.rubric;
            if (n === 51 || n === 52) {
              question.topik = { ...own, gaps: ['㉠', '㉡'] };
              question.answerDisplay = ['㉠', '㉡'].map(mark => `${mark} ${w.models[mark].join(' / ')}`).join('\n');
            } else if (n === 53) {
              question.topik = { topic: w.topic, charts: w.charts, notes: w.notes, chars: [200, 300] };
              question.answerDisplay = w.model;
            } else {
              question.topik = { prompt: w.prompt, bullets: w.bullets, chars: [600, 700] };
              question.answerDisplay = w.model;
            }
          } else {
            question.kind = 'choice';
            question.options = CIRCLED;
            question.optionLabels = CIRCLED;
            question.answers = [CIRCLED[item.answer - 1]];
            question.explanation = item.explanation;
            const print = { ...own, ...(item.prompt ? { line: item.prompt } : {}), ...(item.sentence ? { sentence: item.sentence } : {}) };
            if (item.pictures) {
              print.pictures = item.pictures.map((p, i) => picture(levelDir, number, slug, `${section[0]}${String(n).padStart(2, '0')}-${i + 1}.svg`, p.scene, missing));
              question.answerDisplay = CIRCLED[item.answer - 1];
            } else if (item.charts) {
              print.charts = item.charts;
              question.answerDisplay = `${CIRCLED[item.answer - 1]} ${item.charts[item.answer - 1].title}`;
            } else {
              print.choices = item.options;
              question.answerDisplay = `${CIRCLED[item.answer - 1]} ${item.options[item.answer - 1]}`;
            }
            question.topik = print;
          }
          if (section === 'listening') {
            const part = partOf(level, n);
            question.listening = { part, script: transcript(set.script) };
            const timing = timings?.questions?.[id];
            if (timings && timing?.part !== part) throw Error(`${id}: no audio timing for part ${part}`);
          }
          stage.questions.push(question);
        }
      }
      if (stage.questions.length !== spec.counts[section]) throw Error(`${slug} ${section}: ${stage.questions.length} questions`);
      if (section === 'listening' && timings) {
        recorded = timings.seconds.reduce((sum, value) => sum + value, 0);
        if (recorded > seconds - 60) throw Error(`${slug}: ${recorded}s of audio leaves under a minute`);
      }
      definition.stages.push(stage);
    }
    const scored = definition.stages.flatMap(stage => stage.questions).reduce((sum, q) => sum + q.points, 0);
    if (scored !== spec.total) throw Error(`${slug}: ${scored} points`);
    if (missing.length) console.warn(`${slug}: ${missing.length} pictures missing`);
    writeFileSync(join(target, slug + '.json'), JSON.stringify(definition, null, 1) + '\n');
    catalog.push({
      slug, level: levelNumber, number, title, theme, topics, themeEn: form.theme,
      questions: definition.stages.reduce((sum, stage) => sum + stage.questions.length, 0),
      minutes: Object.values(spec.minutes).reduce((sum, value) => sum + value, 0),
      recordedMinutes: Math.ceil(recorded / 60), audio: Boolean(timings),
    });
    console.log(`${slug}: ${definition.stages.map(s => `${s.id} ${s.questions.length}`).join(', ')}${timings ? '' : ' (no audio yet)'}`);
  }
}
// With --only, the forms not rebuilt keep their catalogue entries.
const catalogFile = join('src', 'modules', 'exams', 'topik', 'catalog.json');
if (only && existsSync(catalogFile)) catalog.push(...JSON.parse(readFileSync(catalogFile, 'utf8')).filter(entry => !only.includes(entry.slug) && existsSync(join(target, entry.slug + '.json'))));
catalog.sort((a, b) => a.level - b.level || a.number - b.number);
writeFileSync(catalogFile, JSON.stringify(catalog, null, 2) + '\n');
