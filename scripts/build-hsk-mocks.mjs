// Convert the offline HSK 1 pack (MockExmps/HSK) into private site definitions, answer-free pictures and a
// client-safe catalogue. Never ship MockExmps itself. Run after editing the pack, then
// `python scripts/generate-hsk-audio.py` if the listening texts changed (its timings feed the Listening stage).
import { mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const pack = join('MockExmps', 'HSK');
const target = join('assets', 'hsk');
const pictures = join('public', 'exam-assets', 'hsk');
mkdirSync(target, { recursive: true });
rmSync(pictures, { recursive: true, force: true });
mkdirSync(join(pictures, 'examples'), { recursive: true });

const audio = JSON.parse(readFileSync(join('src', 'modules', 'exams', 'hsk', 'audio-catalog.json'), 'utf8'));
const LISTENING_SECONDS = 15 * 60, READING_SECONDS = 17 * 60;
const parts = {
  L1: { title: '第一部分 · Зураг ба хэллэг', domain: '听力一 · Зураг, хэллэг (√/×)', task: '听录音，判断对错。', note: 'Хэллэгийг хоёр удаа сонсоно. Зурагтай таарч байвал √, таарахгүй бол × сонгоно.', prompt: 'Сонссон хэллэг зурагтай таарч байна уу?' },
  L2: { title: '第二部分 · Зураг сонгох', domain: '听力二 · Өгүүлбэр, зураг', task: '听录音，选择相应的图片。', note: 'Өгүүлбэрийг хоёр удаа сонсоно. Гурван зургаас тохирохыг сонгоно.', prompt: 'Сонссон өгүүлбэрт тохирох зургийг сонгоно уу.' },
  L3: { title: '第三部分 · Яриа ба зураг', domain: '听力三 · Яриа, зураг', task: '听录音，选择相应的图片。', note: 'Хоёр хүний богино яриаг хоёр удаа сонсоно. Зургаан зургаас тохирохыг сонгоно; нэг зураг илүү.', prompt: 'Сонссон яриад тохирох зургийг сонгоно уу.' },
  L4: { title: '第四部分 · Хариулт сонгох', domain: '听力四 · Богино асуулт', task: '听录音，选择答案。', note: 'Өгүүлбэр ба асуултыг хоёр удаа сонсоно. Асуулт бичигдээгүй; гурван хариултаас зөвийг сонгоно.', prompt: 'Сонссон асуултын хариултыг сонгоно уу.' },
  R1: { title: '第一部分 · Зураг ба үг', domain: '阅读一 · Зураг, үг (√/×)', task: '判断对错。', note: 'Үг зурагтай таарч байвал √, таарахгүй бол × сонгоно.' },
  R2: { title: '第二部分 · Өгүүлбэр ба зураг', domain: '阅读二 · Өгүүлбэр, зураг', task: '选择相应的图片。', note: 'Өгүүлбэр бүрт тохирох зургийг A–F-ээс сонгоно; нэг зураг илүү.' },
  R3: { title: '第三部分 · Асуулт ба хариулт', domain: '阅读三 · Асуулт, хариулт', task: '选择相应的回答。', note: 'Асуулт бүрт тохирох хариултыг A–F-ээс сонгоно; нэг хариулт илүү.' },
  R4: { title: '第四部分 · Хоосон зай нөхөх', domain: '阅读四 · Үг нөхөх', task: '选词填空。', note: 'Хоосон зайд тохирох үгийг A–F-ээс сонгоно; нэг үг илүү.' },
};
const themes = {
  1: 'Сургуулийн өдөр, гэр бүл, хоол, дэлгүүр',
  2: 'Амралтын өдөр, цаг агаар, гэр бүл, аялал',
  3: 'Гэр, найз нөхөд, өдөр тутмын хэвшил, богино аялал',
};

// Pictures are text-free original SVGs (no answer words); the shared examples are copied once.
const copied = new Set();
function picture(file, slug, item, label) {
  const shared = file.startsWith('../examples/');
  const name = file.split('/').at(-1);
  const folder = shared ? 'examples' : slug;
  const out = join(pictures, folder, name);
  if (!copied.has(out)) {
    const body = readFileSync(shared ? join(pack, 'examples', name) : join(pack, slug.replace('hsk1-', ''), file));
    if (!/^<svg[^>]*viewBox="0 0 480 360"/.test(body.toString('utf8'))) throw Error(`${file}: expected a 480×360 SVG`);
    mkdirSync(join(pictures, folder), { recursive: true });
    writeFileSync(out, body);
    copied.add(out);
  }
  return { ...(label ? { label } : {}), src: `/exam-assets/hsk/${folder}/${name}`, alt: item.alt };
}
const figure = (item, slug) => { const { src, alt } = picture(item.image, slug, item); return { kind: 'image', src, alt, width: 480, height: 360 }; };
const line = (text, pinyin, label) => ({ ...(label ? { label } : {}), text, pinyin });
const choices = list => list.map(option => line(option.text, option.pinyin, option.label));
const labels = list => list.map(option => option.label);
const spoken = turns => turns.map(([text, pinyin]) => `${text}\n${pinyin}`).join('\n');

const catalog = [];
const ids = new Set();
for (const number of [1, 2, 3]) {
  const source = JSON.parse(readFileSync(join(pack, `mock-0${number}`, 'mock.json'), 'utf8'));
  const slug = `hsk1-mock-0${number}`;
  if (source.id !== slug) throw Error(`${slug}: pack id ${source.id}`);
  const listened = Object.values(audio[slug]?.questions ?? {});
  if (listened.length !== 20) throw Error(`${slug}: run scripts/generate-hsk-audio.py first (no item timings)`);
  const recorded = audio[slug].seconds.reduce((sum, seconds) => sum + seconds, 0);
  if (recorded > LISTENING_SECONDS - 60) throw Error(`${slug}: ${recorded}s of audio leaves under a minute to check`);
  const definition = {
    slug, version: 1, program: 'hsk', title: `HSK 1 · Mock 0${number}`,
    description: `${source.title} · ${themes[number]}`,
    points: 40,
    notes: [
      'Албан бус, эх зохиомжтой дадлагын mock. Хятад хэлний багшийн хяналт хүлээгдэж байна.',
      'Сонсох хэсэг нь хиймэл (Kokoro) хятад дуу хоолойтой; асуулт бүрийг хоёр удаа уншина.',
      'Raw зөв хариултын тоо ба ×5 дадлагын оноо (200-аас); HSK-ийн албан оноо, тэнцсэн эсэх биш.',
    ],
    sources: [
      { label: 'Chinese Testing International · HSK 1', url: 'https://www.chinesetest.cn/HSK/1' },
      { label: 'HSK 1 албан жишиг материал (бүтэц)', url: 'https://www.chinesetest.cn/userfiles/file/HSK1.pdf' },
    ],
    stages: [],
  };
  const listening = {
    id: 'hsk-l', title: '听力 · Сонсох', kind: 'listening', seconds: LISTENING_SECONDS,
    instructions: 'Бичлэг нэг удаа, серверийн цагтай зэрэг тоглоно; асуулт бүрийг хоёр удаа уншина. Дөрвөн хэсэг дараалан тоглоно. Бичлэг дууссаны дараах хугацаанд хариугаа шалгана. Цаг дуусахад Унших хэсэг автоматаар эхэлнэ.',
    groups: [], questions: [],
  };
  const reading = {
    id: 'hsk-r', title: '阅读 · Унших', kind: 'questions', seconds: READING_SECONDS,
    instructions: 'Дөрвөн хэсэг, 20 асуулт, 17 минут. Хэсгүүдийн хооронд чөлөөтэй шилжинэ. Цаг дуусахад шалгалт дуусна.',
    groups: [], questions: [],
  };
  const add = (stage, partKey, partNumber, group, example, items, build) => {
    const meta = parts[partKey];
    const groupId = `${stage.id}-${partNumber}`;
    stage.groups.push({ id: groupId, title: meta.title, section: stage.title, instructions: `${meta.task}\n${meta.note}`, pageMode: 'group', hsk: { ...group, example } });
    for (const item of items) {
      const id = `hsk1-0${number}-${String(item.n).padStart(2, '0')}`;
      if (ids.has(id)) throw Error('duplicate ' + id);
      ids.add(id);
      const question = { id, number: String(item.n), domain: meta.domain, kind: 'choice', points: 1, groupId, ...build(item, meta) };
      if (!question.options.includes(question.answers[0])) throw Error(`${id}: answer ${question.answers[0]} not in options`);
      if (stage === listening && !audio[slug].questions[id]) throw Error(`${id}: no audio timing`);
      stage.questions.push(question);
    }
  };
  const judge = ['√', '×'];
  const L = source.listening, R = source.reading, ex = source.examples;
  add(listening, 'L1', 1, {}, { pictures: [picture(ex.listening.part1.image, slug, ex.listening.part1)], answer: ex.listening.part1.answer }, L.part1, (item, meta) => ({
    prompt: meta.prompt, options: judge, optionLabels: judge, answers: [item.answer], answerDisplay: item.answer, explanation: item.explanation,
    figure: figure(item, slug), listening: { part: 1, script: spoken([[item.phrase, item.pinyin]]) },
  }));
  add(listening, 'L2', 2, {}, { pictures: ex.listening.part2.options.map(option => picture(option.image, slug, option, option.label)), answer: ex.listening.part2.answer }, L.part2, (item, meta) => ({
    prompt: meta.prompt, options: labels(item.options), optionLabels: labels(item.options), answers: [item.answer], answerDisplay: item.answer, explanation: item.explanation,
    hsk: { pictures: item.options.map(option => picture(option.image, slug, option, option.label)) },
    listening: { part: 2, script: spoken([[item.sentence, item.pinyin]]) },
  }));
  const exampleL3 = ex.listening.part3.pictures.find(p => p.label === ex.listening.part3.answer);
  add(listening, 'L3', 3, { pictures: L.part3.pictures.map(p => picture(p.image, slug, p, p.label)) }, { pictures: [picture(exampleL3.image, slug, exampleL3, exampleL3.label)], answer: ex.listening.part3.answer }, L.part3.items, (item, meta) => ({
    prompt: meta.prompt, options: labels(L.part3.pictures), optionLabels: labels(L.part3.pictures), answers: [item.answer], answerDisplay: item.answer, explanation: item.explanation,
    listening: { part: 3, script: spoken(item.dialogue.map(turn => [`${turn.speaker}：${turn.text}`, turn.pinyin])) },
  }));
  add(listening, 'L4', 4, {}, { choices: choices(ex.listening.part4.options), answer: ex.listening.part4.answer }, L.part4, (item, meta) => {
    const chosen = item.options.find(option => option.label === item.answer);
    return {
      prompt: meta.prompt, options: labels(item.options), optionLabels: labels(item.options), answers: [item.answer], answerDisplay: `${item.answer} · ${chosen.text} (${chosen.pinyin})`, explanation: item.explanation,
      hsk: { choices: choices(item.options) },
      listening: { part: 4, script: spoken([[item.statement, item.statementPinyin], [`问：${item.question}`, `Wèn: ${item.questionPinyin}`]]) },
    };
  });
  add(reading, 'R1', 1, {}, { pictures: [picture(ex.reading.part1.image, slug, ex.reading.part1)], line: line(ex.reading.part1.word, ex.reading.part1.pinyin), answer: ex.reading.part1.answer }, R.part1, item => ({
    prompt: item.word, options: judge, optionLabels: judge, answers: [item.answer], answerDisplay: item.answer, explanation: item.explanation,
    figure: figure(item, slug), hsk: { line: line(item.word, item.pinyin) },
  }));
  const exampleR2 = ex.reading.part2.pictures.find(p => p.label === ex.reading.part2.answer);
  add(reading, 'R2', 2, { pictures: R.part2.pictures.map(p => picture(p.image, slug, p, p.label)) }, { pictures: [picture(exampleR2.image, slug, exampleR2, exampleR2.label)], line: line(ex.reading.part2.sentence, ex.reading.part2.pinyin), answer: ex.reading.part2.answer }, R.part2.items, item => ({
    prompt: item.sentence, options: labels(R.part2.pictures), optionLabels: labels(R.part2.pictures), answers: [item.answer], answerDisplay: item.answer, explanation: item.explanation,
    hsk: { line: line(item.sentence, item.pinyin) },
  }));
  const exampleR3 = ex.reading.part3.options.find(o => o.label === ex.reading.part3.answer);
  add(reading, 'R3', 3, { choices: choices(R.part3.options) }, { line: line(ex.reading.part3.question, ex.reading.part3.pinyin), answerLine: line(exampleR3.text, exampleR3.pinyin, exampleR3.label), answer: ex.reading.part3.answer }, R.part3.items, item => {
    const chosen = R.part3.options.find(option => option.label === item.answer);
    return {
      prompt: item.question, options: labels(R.part3.options), optionLabels: labels(R.part3.options), answers: [item.answer], answerDisplay: `${item.answer} · ${chosen.text}`, explanation: item.explanation,
      hsk: { line: line(item.question, item.pinyin) },
    };
  });
  const exampleR4 = ex.reading.part4.options.find(o => o.label === ex.reading.part4.answer);
  add(reading, 'R4', 4, { choices: choices(R.part4.options) }, { line: line(ex.reading.part4.sentence, ex.reading.part4.pinyin), answerLine: line(exampleR4.text, exampleR4.pinyin, exampleR4.label), answer: ex.reading.part4.answer }, R.part4.items, item => {
    const chosen = R.part4.options.find(option => option.label === item.answer);
    return {
      prompt: item.sentence, options: labels(R.part4.options), optionLabels: labels(R.part4.options), answers: [item.answer], answerDisplay: `${item.answer} · ${chosen.text}`, explanation: item.explanation,
      hsk: { line: line(item.sentence, item.pinyin) },
    };
  });
  definition.stages.push(listening, reading);
  const count = definition.stages.reduce((sum, stage) => sum + stage.questions.length, 0);
  if (count !== 40 || listening.questions.length !== 20) throw Error(`${slug}: ${count} questions`);
  writeFileSync(join(target, slug + '.json'), JSON.stringify(definition, null, 2) + '\n');
  catalog.push({ slug, number, title: definition.title, titleZh: source.title, titlePinyin: source.titlePinyin, titleEn: source.titleEn, theme: themes[number], questions: count, minutes: (LISTENING_SECONDS + READING_SECONDS) / 60, recordedMinutes: Math.ceil(recorded / 60) });
}
writeFileSync(join('src', 'modules', 'exams', 'hsk', 'catalog.json'), JSON.stringify(catalog, null, 2) + '\n');
console.log(`Built three private HSK 1 definitions (120 questions) and ${copied.size} answer-free pictures.`);
