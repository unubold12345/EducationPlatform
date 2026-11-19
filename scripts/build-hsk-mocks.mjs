// Convert the offline HSK 3.0 pack (MockExmps/HSK3: HSK 1 and HSK 2, six forms each) into private site definitions,
// answer-free pictures and a client-safe catalogue. Never ship MockExmps itself. Run after `python -B
// MockExmps/HSK3/_source/build.py`; if a listening text changed, first run `python scripts/generate-hsk3-audio.py`,
// whose timings feed the Listening stage. The HSK 2.0 packs (MockExmps/HSK, MockExmps/HSK2) are the source of the
// items HSK 3.0 kept; this script also copies the 2.0 example pictures the free HSK 1 mock still shows.
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const pack = join('MockExmps', 'HSK3');
const target = join('assets', 'hsk');
const pictures = join('public', 'exam-assets', 'hsk');
mkdirSync(target, { recursive: true });
rmSync(pictures, { recursive: true, force: true });
mkdirSync(join(pictures, 'examples'), { recursive: true });

const audio = JSON.parse(readFileSync(join('src', 'modules', 'exams', 'hsk', 'audio-catalog.json'), 'utf8'));
// Stage minutes: the HSK 3.0 papers take about 40 (HSK 1) and 60 (HSK 2) minutes (owner, 2026-11-19). Listening follows the
// recording (about 11 and 15 minutes, then checking time); Reading takes the rest: HSK 1 15 + 25, HSK 2 20 + 30 + 10.
const STAGES = {
  1: [['hsk-l', 15], ['hsk-r', 25]],
  2: [['hsk-l', 20], ['hsk-r', 30], ['hsk-w', 10]],
};
const STAGE_TITLES = { 'hsk-l': '听力 · Сонсох', 'hsk-r': '阅读 · Унших', 'hsk-w': '书写 · Бичих' };
const COUNT_WORDS = { 2: 'Хоёр', 3: 'Гурван', 4: 'Дөрвөн', 5: 'Таван' };
const themes = {
  1: { 1: 'Сургуулийн өдөр, гэр бүл, хоол, дэлгүүр', 2: 'Амралтын өдөр, цаг агаар, гэр бүл, аялал', 3: 'Гэр, найз нөхөд, өдөр тутмын хэвшил, богино аялал', 4: 'Шинэ найз, хичээл, хоол, цаг', 5: 'Дэлгүүр, үнэ, хувцас, цаг агаар', 6: 'Өдөр тутмын хэвшил, ажил, унаа, эрүүл мэнд' },
  2: { 1: 'Спорт, эрүүл мэнд, эмч, өдөр тутмын хэвшил', 2: 'Ажил, зам тээвэр, зочид буудал, аялал', 3: 'Төрсөн өдөр, гэр бүл, дэлгүүр, цаг агаар', 4: 'Шалгалт, хичээл, хобби, найзууд', 5: 'Өвөө эмээ, гэр бүл, хоол, гэр', 6: 'Амралтын өдөр, хотоор, зам, цаг агаар' },
};

// Pictures are text-free original SVGs (no answer words); the shared examples are copied once.
const copied = new Set();
function picture(entry, slug) {
  const shared = entry.image.startsWith('../examples/');
  const name = entry.image.split('/').at(-1);
  const folder = shared ? 'examples' : slug;
  const out = join(pictures, folder, name);
  if (!copied.has(out)) {
    const body = readFileSync(shared ? join(pack, 'examples', name) : join(pack, slug, 'images', name));
    if (!/^<svg[^>]*viewBox="0 0 480 360"/.test(body.toString('utf8'))) throw Error(`${name}: expected a 480×360 SVG`);
    mkdirSync(join(pictures, folder), { recursive: true });
    writeFileSync(out, body);
    copied.add(out);
  }
  return { ...(entry.label ? { label: entry.label } : {}), src: `/exam-assets/hsk/${folder}/${name}`, alt: entry.alt };
}
const line = entry => ({ ...(entry.label ? { label: entry.label } : {}), text: entry.text, pinyin: entry.pinyin });
const spoken = turns => turns.map(turn => `${turn.speaker ? turn.speaker + '：' : ''}${turn.text}\n${turn.pinyin}`).join('\n');
const printed = (item, slug) => ({
  ...(item.pictures ? { pictures: item.pictures.map(entry => picture(entry, slug)) } : {}),
  ...(item.choices ? { choices: item.choices.map(line) } : {}),
  ...(item.line ? { line: line(item.line) } : {}),
  ...(item.statement ? { statement: line(item.statement) } : {}),
  ...(item.compose ? { compose: item.compose } : {}),
  ...(item.blank ? { blank: item.blank } : {}),
});
const promptOf = (item, set) => item.line ? (item.statement ? `${item.line.text}\n★ ${item.statement.text}` : item.line.text)
  : item.compose ? `${item.compose.word} (${item.compose.pinyin})` : item.blank ? `${item.blank.before}（${item.blank.hint}）${item.blank.after}` : set.prompt;

const catalog = [];
const ids = new Set();
for (const level of [1, 2]) {
  for (const number of [1, 2, 3, 4, 5, 6]) {
    const slug = `hsk${level}-mock-0${number}`;
    const source = JSON.parse(readFileSync(join(pack, slug, 'mock.json'), 'utf8'));
    if (source.id !== slug || source.level !== level) throw Error(`${slug}: pack id ${source.id}`);
    const heard = source.stages.find(stage => stage.id === 'hsk-l').sets.reduce((sum, set) => sum + set.items.length, 0);
    if (Object.keys(audio[slug]?.questions ?? {}).length !== heard) throw Error(`${slug}: run scripts/generate-hsk3-audio.py first (no item timings)`);
    const recorded = audio[slug].seconds.reduce((sum, seconds) => sum + seconds, 0);
    const listeningSeconds = STAGES[level][0][1] * 60;
    if (recorded > listeningSeconds - 60) throw Error(`${slug}: ${recorded}s of audio leaves under a minute to check`);
    const total = level === 1 ? 40 : 60;
    const definition = {
      slug, version: 2, program: 'hsk', title: `HSK ${level} · Mock 0${number}`,
      description: `${source.title} · ${themes[level][number]}`,
      points: total,
      notes: [
        'HSK 3.0 (2026 оны шинэ бүтэц, шинэ үгийн сан) дээр суурилсан албан бус, эх зохиомжтой дадлагын mock. Хятад хэлний багшийн хяналт хүлээгдэж байна.',
        'Сонсох хэсэг нь хиймэл (Kokoro) хятад дуу хоолойтой; асуулт бүрийг хоёр удаа уншина.',
        `Raw зөв хариултын тоо ба хэсэг бүрийн 100 онооны дадлагын хөрвүүлэлт (${STAGES[level].length * 100}-аас); HSK-ийн албан оноо, тэнцсэн эсэх биш.`,
      ],
      sources: [
        { label: `Chinese Testing International · HSK ${level}`, url: `https://www.chinesetest.cn/HSK/${level}` },
        { label: 'HSK 3.0 үгийн сан (HSK 1–2: 300 + 200 үг)', url: 'https://hsk.wordswing.com/vocabulary/' },
      ],
      stages: [],
    };
    for (const [stageId, minutes] of STAGES[level]) {
      const sets = source.stages.find(stage => stage.id === stageId).sets;
      const partCount = new Set(sets.map(set => set.key.slice(0, 2))).size;
      const count = sets.reduce((sum, set) => sum + set.items.length, 0);
      const stage = {
        id: stageId, title: STAGE_TITLES[stageId], kind: stageId === 'hsk-l' ? 'listening' : 'questions', seconds: minutes * 60,
        instructions: stageId === 'hsk-l'
          ? `Бичлэг нэг удаа, серверийн цагтай зэрэг тоглоно; асуулт бүрийг хоёр удаа уншина. ${COUNT_WORDS[partCount]} хэсэг дараалан тоглоно. Бичлэг дууссаны дараах хугацаанд хариугаа шалгана. Цаг дуусахад Унших хэсэг эхэлнэ.`
          : stageId === 'hsk-r'
            ? `${COUNT_WORDS[partCount]} хэсэг, ${count} асуулт, ${minutes} минут. Хэсгүүдийн хооронд чөлөөтэй шилжинэ. Цаг дуусахад ${level === 2 ? 'Бичих хэсэг эхэлнэ' : 'шалгалт дуусна'}.`
            : `${COUNT_WORDS[partCount]} хэсэг, ${count} асуулт, ${minutes} минут: ханзны дутуу бүрдлийг сонгох, pinyin-аар ханз бичих (хятад гарын оролт хэрэгтэй). Цаг дуусахад шалгалт дуусна.`,
        groups: [], questions: [],
      };
      for (const set of sets) {
        const example = set.example ? { ...printed(set.example, slug), ...(set.example.answerLine ? { answerLine: line(set.example.answerLine) } : {}), answer: set.example.answer } : undefined;
        stage.groups.push({
          id: set.id, title: set.title, section: stage.title, instructions: `${set.task}\n${set.note}`, pageMode: 'group',
          hsk: { layout: set.layout, ...(set.pictures ? { pictures: set.pictures.map(entry => picture(entry, slug)) } : {}), ...(set.choices ? { choices: set.choices.map(line) } : {}), ...(example ? { example } : {}) },
        });
        for (const item of set.items) {
          const id = `hsk${level}-0${number}-${String(item.n).padStart(2, '0')}`;
          if (ids.has(id)) throw Error('duplicate ' + id);
          ids.add(id);
          const kind = item.kind ?? 'choice';
          const question = {
            id, number: String(item.n), domain: set.domain, kind, points: 1, groupId: set.id, prompt: promptOf(item, set),
            options: item.options, optionLabels: item.options, answers: [item.answer], answerDisplay: item.answerDisplay, explanation: item.explanation,
            ...(kind === 'short' ? { matcher: 'text' } : {}),
            hsk: printed(item, slug),
            ...(item.turns ? { listening: { part: Number(set.key[1]), script: spoken(item.turns) } } : {}),
          };
          if (!question.options.length) { delete question.options; delete question.optionLabels; }
          if (kind === 'choice' && !question.options.includes(question.answers[0])) throw Error(`${id}: answer ${question.answers[0]} not in options`);
          if (stageId === 'hsk-l' && audio[slug].questions[id]?.part !== question.listening.part) throw Error(`${id}: no audio timing`);
          if (!Object.keys(question.hsk).length) delete question.hsk;
          stage.questions.push(question);
        }
      }
      definition.stages.push(stage);
    }
    const count = definition.stages.reduce((sum, stage) => sum + stage.questions.length, 0);
    if (count !== total) throw Error(`${slug}: ${count} questions`);
    writeFileSync(join(target, slug + '.json'), JSON.stringify(definition, null, 2) + '\n');
    catalog.push({ slug, level, number, title: definition.title, titleZh: source.title, titlePinyin: source.titlePinyin, titleEn: source.titleEn, theme: themes[level][number], questions: count, minutes: STAGES[level].reduce((sum, [, minutes]) => sum + minutes, 0), recordedMinutes: Math.ceil(recorded / 60) });
  }
}

// The free half-length HSK 1 mock (scripts/build-free-mocks.mjs) still shows the HSK 2.0 example pictures.
const free = join('assets', 'free-mocks', 'hsk1-free.json');
if (existsSync(free)) {
  for (const name of new Set([...readFileSync(free, 'utf8').matchAll(/\/exam-assets\/hsk\/examples\/([a-z0-9-]+\.svg)/g)].map(match => match[1]))) {
    const out = join(pictures, 'examples', name);
    if (!copied.has(out)) { writeFileSync(out, readFileSync(join('MockExmps', 'HSK', 'examples', name))); copied.add(out); }
  }
}
writeFileSync(join('src', 'modules', 'exams', 'hsk', 'catalog.json'), JSON.stringify(catalog, null, 2) + '\n');
console.log(`Built ${catalog.length} private HSK 3.0 definitions (${ids.size} questions) and ${copied.size} answer-free pictures.`);
