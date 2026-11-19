// The ЭЕШ Workshop's next-year forecast (owner request 2026-11-20: a predicted 2027 paper, "what exercises can be in",
// accurate or not). Pure functions over each year's paper as positions (Part I questions, Part II tasks).
//
// Method:
// - Every known year votes for the topic, domain and skill at each position of the latest paper. Recent years count more
//   (weight halves every `half` years).
// - A year with a different number of questions is lined up with the latest paper by sequence alignment
//   (Needleman–Wunsch on the topics) before it votes.
// - A position's votes are shrunk toward its neighbours' topics in the latest paper, so no position reads as certain.
// - Topic chances, expected points and domain points follow from the same votes or from per-year shares, whichever
//   predicted better.
// The settings are the ones that best predicted the last three known years from the years before each (`backtest`), and
// those scores are published with the forecast.

const sum = list => list.reduce((total, value) => total + value, 0);
const round1 = value => Math.round(value * 10) / 10;
const round3 = value => Math.round(value * 1000) / 1000;
const mean = list => (list.length ? sum(list) / list.length : 0);
export const taskOf = number => /^(\d+\.\d+)[a-z]$/.exec(number)?.[1] ?? number;
const add = (map, key, value) => { if (key != null && value) map[key] = (map[key] ?? 0) + value; };
const share = map => { const total = sum(Object.values(map)); return total ? Object.fromEntries(Object.entries(map).map(([key, value]) => [key, value / total])) : {}; };
const ranked = map => Object.entries(map).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
const top = map => ranked(map)[0]?.[0] ?? null;
const byPosition = (a, b) => a.part - b.part || (a.part === 1 ? Number(a.pos) - Number(b.pos) : a.pos.localeCompare(b.pos));

/** One year as positions. `papers`: the year's forms, each a list of items {number, part, points, domain, topic, skill}.
 * A Part II task (2.1a, 2.1b …) is one position; it counts for the topic, domain and skill most of its points test. */
export function yearPositions(year, papers, format) {
  const forms = papers.length, positions = new Map();
  for (const items of papers) {
    const groups = new Map();
    for (const item of items) {
      const pos = item.part === 2 ? taskOf(item.number) : item.number;
      (groups.get(pos) ?? groups.set(pos, []).get(pos)).push(item);
    }
    for (const [pos, list] of groups) {
      const entry = positions.get(pos) ?? positions.set(pos, { pos, part: list[0].part, points: 0, topics: {}, domains: {}, skills: {} }).get(pos);
      entry.points += sum(list.map(item => item.points)) / forms;
      const mode = field => { const votes = {}; for (const item of list) add(votes, item[field], item.points || 1); return top(votes); };
      add(entry.topics, mode("topic"), 1 / forms);
      add(entry.domains, mode("domain"), 1 / forms);
      add(entry.skills, mode("skill"), 1 / forms);
    }
  }
  return { year, format, positions: [...positions.values()].sort(byPosition) };
}

/** Global alignment of two position lists on their main topics (same domain is a weaker match). Returns b index → a index. */
function align(a, b) {
  const GAP = -2, ta = a.map(p => [top(p.topics), top(p.domains)]), tb = b.map(p => [top(p.topics), top(p.domains)]);
  const score = (i, j) => (ta[i][0] && ta[i][0] === tb[j][0] ? 3 : ta[i][1] && ta[i][1] === tb[j][1] ? 1 : -1);
  const m = a.length, n = b.length, S = Array.from({ length: m + 1 }, () => new Float64Array(n + 1));
  for (let i = 1; i <= m; i++) S[i][0] = i * GAP;
  for (let j = 1; j <= n; j++) S[0][j] = j * GAP;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) S[i][j] = Math.max(S[i - 1][j - 1] + score(i - 1, j - 1), S[i - 1][j] + GAP, S[i][j - 1] + GAP);
  const pairs = new Map();
  for (let i = m, j = n; i > 0 && j > 0;) {
    if (S[i][j] === S[i - 1][j - 1] + score(i - 1, j - 1)) { pairs.set(j - 1, i - 1); i--; j--; }
    else if (S[i][j] === S[i - 1][j] + GAP) i--;
    else j--;
  }
  return pairs;
}

/** Which past position stands for each position of the reference paper. `mode` "equal": same number in a part with the same
 * count, alignment otherwise; "align": always alignment. */
export function lineUp(past, ref, mode) {
  const out = new Map();
  for (const part of [1, 2]) {
    const a = past.positions.filter(p => p.part === part), b = ref.positions.filter(p => p.part === part);
    if (past === ref || (mode === "equal" && a.length === b.length)) {
      const same = new Map(a.map(p => [p.pos, p]));
      for (const p of b) if (same.has(p.pos)) out.set(p, same.get(p.pos));
      continue;
    }
    for (const [j, i] of align(a, b)) out.set(b[j], a[i]);
  }
  return out;
}

const weightOf = (settings, refYear) => year => (settings.half >= 99 ? 1 : 0.5 ** ((refYear - year) / settings.half));

/** The forecast's votes for each position of the latest known paper (`history` ends with it). */
export function votePositions(history, settings) {
  const ref = history.at(-1), weight = weightOf(settings, ref.year);
  const slots = ref.positions.map(position => ({ ref: position, total: 0, topics: {}, domains: {}, skills: {} }));
  for (const year of history) {
    const map = lineUp(year, ref, settings.align), w = weight(year.year);
    for (const slot of slots) {
      const past = map.get(slot.ref);
      if (!past) continue;
      slot.total += w;
      for (const [key, value] of Object.entries(share(past.topics))) add(slot.topics, key, w * value);
      for (const [key, value] of Object.entries(share(past.domains))) add(slot.domains, key, w * value);
      // Skills are kept per topic, so a position's exercise types follow its likely topic ("" for a task with no topic, such
      // as biology's Part II).
      const main = top(past.topics) ?? "";
      for (const [key, value] of Object.entries(share(past.skills))) add(slot.skills, main + "\u0000" + key, w * value);
    }
  }
  // Shrink toward the neighbours' topics in the latest paper: a shifted item most often belongs to the next one's topic.
  return slots.map((slot, j) => {
    const prior = {}, domainPrior = {};
    for (const k of [j - 1, j + 1]) {
      const near = slots[k]?.ref;
      if (!near || near.part !== slot.ref.part) continue;
      for (const [key, value] of Object.entries(share(near.topics))) add(prior, key, value / 2);
      for (const [key, value] of Object.entries(share(near.domains))) add(domainPrior, key, value / 2);
    }
    const blend = (votes, base) => {
      const priorTotal = sum(Object.values(base)), b = priorTotal ? settings.beta : 0, out = {};
      for (const [key, value] of Object.entries(votes)) add(out, key, value);
      for (const [key, value] of Object.entries(base)) add(out, key, (b * value) / priorTotal);
      return share(out);
    };
    return { pos: slot.ref.pos, part: slot.ref.part, points: slot.ref.points, topics: blend(slot.topics, prior), domains: blend(slot.domains, domainPrior), skills: slot.skills };
  });
}

/** Points per domain in one year's paper. */
export const yearDomains = year => {
  const out = {};
  for (const position of year.positions) for (const [key, value] of Object.entries(share(position.domains))) add(out, key, value * position.points);
  return out;
};
/** Share of the year's forms in which each topic appears at least once. */
const yearTopics = year => {
  const out = {};
  for (const position of year.positions) for (const [key, value] of Object.entries(position.topics)) out[key] = Math.min(1, Math.max(out[key] ?? 0, value));
  return out;
};

/** The chance each topic appears next year. "years": weighted share of past years it appeared in; "positions": at least one
 * position draws it (positions taken as independent). */
export function topicChances(history, slots, topicIds, settings) {
  const ref = history.at(-1), out = {};
  if (settings.topicMethod === "positions") {
    for (const id of topicIds) out[id] = 1 - slots.reduce((product, slot) => product * (1 - (slot.topics[id] ?? 0)), 1);
    return out;
  }
  const weight = weightOf({ half: settings.topicHalf }, ref.year), seen = history.map(year => [weight(year.year), yearTopics(year)]);
  const total = sum(seen.map(([w]) => w));
  for (const id of topicIds) out[id] = (sum(seen.map(([w, topics]) => w * (topics[id] ?? 0))) + settings.topicBeta * 0.5) / (total + settings.topicBeta);
  return out;
}

/** Expected questions per topic in each part next year. "positions": the positions' chances added up; "years": each year's
 * count, recent years weighted, scaled to the latest paper's size of that part. */
export function topicCounts(history, slots, settings) {
  const ref = history.at(-1), out = { 1: {}, 2: {} };
  if (settings.countMethod === "positions") {
    for (const slot of slots) for (const [key, value] of Object.entries(slot.topics)) add(out[slot.part], key, value);
    return out;
  }
  const weight = weightOf({ half: settings.countHalf }, ref.year);
  for (const part of [1, 2]) {
    const size = ref.positions.filter(p => p.part === part).length;
    let total = 0;
    for (const year of history) {
      const positions = year.positions.filter(p => p.part === part);
      if (!positions.length) continue;
      const w = weight(year.year), scale = size / positions.length;
      total += w;
      for (const position of positions) for (const [key, value] of Object.entries(share(position.topics))) add(out[part], key, w * value * scale);
    }
    for (const key of Object.keys(out[part])) out[part][key] /= total || 1;
  }
  return out;
}

/** Whole questions per topic that add up to `size` (largest remainder), for showing the paper's make-up. */
export function composition(counts, size) {
  const entries = Object.entries(counts).filter(([, v]) => v > 0), total = sum(entries.map(([, v]) => v));
  if (!total || !size) return {};
  const scaled = entries.map(([key, v]) => [key, (v * size) / total]), out = Object.fromEntries(scaled.map(([key, v]) => [key, Math.floor(v)]));
  let left = size - sum(Object.values(out));
  for (const [key] of [...scaled].sort((a, b) => (b[1] % 1) - (a[1] % 1) || b[1] - a[1] || a[0].localeCompare(b[0]))) { if (left <= 0) break; out[key] += 1; left -= 1; }
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v > 0));
}
/** Questions per topic in each part of one known year. */
export const yearCounts = year => {
  const out = { 1: {}, 2: {} };
  for (const position of year.positions) for (const [key, value] of Object.entries(share(position.topics))) add(out[position.part], key, value);
  return out;
};

/** Points per domain next year, scaled to the latest paper's total. */
export function domainPoints(history, slots, settings) {
  const ref = history.at(-1), totalPoints = sum(ref.positions.map(p => p.points)), years = history.map(year => [year.year, yearDomains(year)]);
  const names = [...new Set(years.flatMap(([, row]) => Object.keys(row)))];
  const raw = {};
  if (settings.domainMethod === "positions") for (const slot of slots) for (const [key, value] of Object.entries(slot.domains)) add(raw, key, value * slot.points);
  else for (const name of names) {
    const series = years.map(([year, row]) => [year, row[name] ?? 0]);
    if (settings.domainMethod === "last") raw[name] = series.at(-1)[1];
    else if (settings.domainMethod === "mean3") raw[name] = mean(series.slice(-3).map(([, v]) => v));
    else {
      const weight = weightOf({ half: 2 }, ref.year), ws = series.map(([year]) => weight(year)), W = sum(ws);
      const level = sum(series.map(([, v], i) => ws[i] * v)) / W;
      if (settings.domainMethod === "weighted") raw[name] = level;
      else {
        // Weighted least-squares trend, projected one year on and halved toward the weighted level.
        const mx = sum(series.map(([year], i) => ws[i] * year)) / W;
        const sxx = sum(series.map(([year], i) => ws[i] * (year - mx) ** 2)), sxy = sum(series.map(([year, v], i) => ws[i] * (year - mx) * (v - level)));
        const slope = sxx ? sxy / sxx : 0;
        raw[name] = Math.max(0, (level + (level + slope * (ref.year + 1 - mx))) / 2);
      }
    }
  }
  const total = sum(Object.values(raw));
  return Object.fromEntries(Object.entries(raw).filter(([, v]) => v > 0).map(([key, value]) => [key, total ? (value * totalPoints) / total : 0]));
}

/** How well a forecast made from `history` matches the year after it (`actual`). */
export function score(history, actual, settings, topicIds) {
  const ref = history.at(-1), slots = votePositions(history, settings), map = lineUp(actual, ref, settings.align);
  let hit1 = 0, hit2 = 0, brier = 0, count = 0, hitPart2 = 0, countPart2 = 0;
  slots.forEach((slot, j) => {
    const real = map.get(ref.positions[j]);
    if (!real || !Object.keys(real.topics).length || !Object.keys(slot.topics).length) return;
    const truth = share(real.topics), order = ranked(slot.topics).map(([key]) => key);
    count += 1;
    hit1 += truth[order[0]] ?? 0;
    if (slot.part === 2) { countPart2 += 1; hitPart2 += truth[order[0]] ?? 0; }
    hit2 += (truth[order[0]] ?? 0) + (truth[order[1]] ?? 0);
    const keys = new Set([...Object.keys(truth), ...Object.keys(slot.topics)]);
    brier += sum([...keys].map(key => ((slot.topics[key] ?? 0) - (truth[key] ?? 0)) ** 2));
  });
  const chances = topicChances(history, slots, topicIds, settings), seen = yearTopics(actual);
  const predicted = domainPoints(history, slots, settings), realDomains = yearDomains(actual);
  const domains = [...new Set([...Object.keys(predicted), ...Object.keys(realDomains)])];
  const likely = topicIds.filter(id => chances[id] >= 0.5), appeared = topicIds.filter(id => (seen[id] ?? 0) >= 0.5);
  // Make-up: of the real paper's questions, how many the shown composition (whole questions per topic and part) covers.
  const counts = topicCounts(history, slots, settings), real = yearCounts(actual);
  let covered = 0, questions = 0;
  for (const part of [1, 2]) {
    const shown = composition(counts[part], ref.positions.filter(p => p.part === part).length);
    for (const [key, value] of Object.entries(real[part])) { questions += value; covered += Math.min(value, shown[key] ?? 0); }
  }
  return {
    year: actual.year,
    positions: count,
    top1: count ? hit1 / count : null,
    top2: count ? hit2 / count : null,
    top1Part2: countPart2 ? hitPart2 / countPart2 : null,
    makeup: questions ? covered / questions : null,
    positionBrier: count ? brier / count : null,
    topicBrier: mean(topicIds.map(id => (chances[id] - (seen[id] ?? 0)) ** 2)),
    caught: appeared.filter(id => chances[id] >= 0.5).length, appeared: appeared.length,
    likelyRight: likely.filter(id => (seen[id] ?? 0) >= 0.5).length, likely: likely.length,
    domainError: mean(domains.map(name => Math.abs((predicted[name] ?? 0) - (realDomains[name] ?? 0)))),
    sameFormat: JSON.stringify(actual.format) === JSON.stringify(ref.format),
  };
}

/** Backtest targets: each of the last `count` known years that has at least `minPrior` years before it. */
export const targetsOf = (history, count = 3, minPrior = 3) => history.map((year, i) => i).filter(i => i >= minPrior).slice(-count);

const GRID = {
  half: [1, 2, 3, 5, 99], align: ["equal", "align"], beta: [0, 0.25, 0.5, 1, 2],
  topic: [{ topicMethod: "positions" }, ...[1, 2, 3, 5, 99].flatMap(topicHalf => [0.5, 1, 2].map(topicBeta => ({ topicMethod: "years", topicHalf, topicBeta })))],
  domainMethod: ["positions", "last", "mean3", "weighted", "trend"],
  count: [{ countMethod: "positions" }, ...[1, 2, 3, 5, 99].map(countHalf => ({ countMethod: "years", countHalf }))],
};

/** Picks the settings that best predicted the backtest years, one component at a time, averaged over subjects and years.
 * `cases`: [{history (all known years), topicIds}] for the subjects whose topics change by year. */
export function chooseSettings(cases) {
  const runs = settings => cases.flatMap(({ history, topicIds }) => targetsOf(history).map(i => score(history.slice(0, i), history[i], settings, topicIds)));
  const avg = (list, field) => mean(list.map(run => run[field]).filter(value => value != null));
  let best = { half: 3, align: "equal", beta: 0.5, topicMethod: "years", topicHalf: 3, topicBeta: 1, domainMethod: "weighted", countMethod: "years", countHalf: 3 };
  const pick = (options, metric, better) => {
    let chosen = null, chosenValue = null;
    for (const option of options) {
      const value = avg(runs({ ...best, ...option }), metric);
      if (chosenValue === null || better(value, chosenValue)) { chosen = option; chosenValue = value; }
    }
    best = { ...best, ...chosen };
  };
  pick(GRID.half.flatMap(half => GRID.align.map(alignMode => ({ half, align: alignMode }))), "top1", (a, b) => a > b + 1e-9);
  pick(GRID.beta.map(beta => ({ beta })), "positionBrier", (a, b) => a < b - 1e-9);
  pick(GRID.topic, "topicBrier", (a, b) => a < b - 1e-9);
  pick(GRID.domainMethod.map(domainMethod => ({ domainMethod })), "domainError", (a, b) => a < b - 1e-9);
  pick(GRID.count, "makeup", (a, b) => a > b + 1e-9);
  return best;
}

/** The published backtest of one subject with the chosen settings. */
export function backtest(history, topicIds, settings) {
  const runs = targetsOf(history).map(i => score(history.slice(0, i), history[i], settings, topicIds));
  const avg = field => { const list = runs.map(run => run[field]).filter(value => value != null); return list.length ? mean(list) : null; };
  const r3 = value => (value == null ? null : round3(value));
  return {
    years: runs.map(run => ({ year: run.year, positions: run.positions, top1: run.top1 == null ? null : round3(run.top1), top2: run.top2 == null ? null : round3(run.top2), top1Part2: run.top1Part2 == null ? null : round3(run.top1Part2), makeup: run.makeup == null ? null : round3(run.makeup), domainError: round1(run.domainError), caught: run.caught, appeared: run.appeared, likelyRight: run.likelyRight, likely: run.likely, sameFormat: run.sameFormat })),
    top1: r3(avg("top1")), top2: r3(avg("top2")), top1Part2: r3(avg("top1Part2")), makeup: r3(avg("makeup")), domainError: round1(avg("domainError") ?? 0),
  };
}

export { ranked, share, round1, round3, sum };
