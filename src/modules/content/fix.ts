// Pure single-question fixes shared by the admin question editor, the publishing service and tests.
// A fix may only change the wording, options, answer key, explanation or passage of an existing
// question; validation.ts still checks the whole body (IDs, counts, timers) before anything publishes.
export type QuestionPath = (string | number)[];
export type EditableQuestion = {
  path: QuestionPath; section: string; id: string; kind: string;
  prompt: string; options?: string[]; correct?: number; answers?: string[]; explanation?: string; passage?: string;
};
export const FIX_FIELDS = ["prompt", "options", "correct", "answers", "explanation", "passage"] as const;
type Field = typeof FIX_FIELDS[number];
type Item = Record<string, unknown>;

const isItem = (value: unknown): value is Item => !!value && typeof value === "object" && !Array.isArray(value);
function question(item: Item, path: QuestionPath, section: string): EditableQuestion {
  const out: EditableQuestion = { path, section, id: String(item.id), kind: typeof item.kind === "string" ? item.kind : "choice", prompt: String(item.prompt ?? "") };
  for (const field of FIX_FIELDS) if (field !== "prompt" && item[field] !== undefined) (out as Record<string, unknown>)[field] = item[field];
  return out;
}

// Every question of an exercise set (questions[]) or a full mock (stages[].questions[] and the
// adaptive stages[].variants.lower/higher[]), with the path the server needs to apply a fix.
export function editableQuestions(body: unknown): EditableQuestion[] {
  if (!isItem(body)) return [];
  const title = String(body.title ?? "");
  if (Array.isArray(body.questions)) return body.questions.filter(isItem).map((item, i) => question(item, ["questions", i], title));
  if (!Array.isArray(body.stages)) return [];
  return body.stages.flatMap((stage, s) => {
    if (!isItem(stage)) return [];
    const name = String(stage.title ?? "");
    const main = Array.isArray(stage.questions) ? stage.questions.filter(isItem).map((item, i) => question(item, ["stages", s, "questions", i], name)) : [];
    const variants = isItem(stage.variants) ? (["lower", "higher"] as const).flatMap(branch => {
      const list = (stage.variants as Item)[branch];
      return Array.isArray(list) ? list.filter(isItem).map((item, i) => question(item, ["stages", s, "variants", branch, i], `${name} · ${branch === "lower" ? "суурь" : "ахисан"}`)) : [];
    }) : [];
    return [...main, ...variants];
  });
}

function validPath(path: unknown): path is QuestionPath {
  if (!Array.isArray(path) || path.length < 2 || path.length > 5) return false;
  const text = path.map(String).join("/");
  return /^questions\/\d+$/.test(text) || /^stages\/\d+\/questions\/\d+$/.test(text) || /^stages\/\d+\/variants\/(lower|higher)\/\d+$/.test(text);
}

// Returns a new body with the fix applied, or null when the path or patch is not allowed. Fields must
// already exist on the question with the same type, so a fix cannot add, remove or retype anything.
export function applyQuestionFix(body: unknown, path: unknown, patch: unknown): unknown | null {
  if (!validPath(path) || !isItem(patch)) return null;
  const keys = Object.keys(patch);
  if (!keys.length || keys.some(key => !(FIX_FIELDS as readonly string[]).includes(key))) return null;
  const next = structuredClone(body);
  let target: unknown = next;
  for (const segment of path) {
    if (Array.isArray(target) && typeof segment === "number" && Number.isInteger(segment) && segment >= 0 && segment < target.length) target = target[segment];
    else if (isItem(target) && typeof segment === "string" && Object.hasOwn(target, segment)) target = target[segment];
    else return null;
  }
  if (!isItem(target) || typeof target.id !== "string") return null;
  for (const key of keys as Field[]) {
    const before = target[key], after = patch[key];
    if (before === undefined) return null;
    if (Array.isArray(before)) {
      if (!Array.isArray(after) || !after.every(entry => typeof entry === "string")) return null;
      if (key === "options" && after.length !== before.length) return null;
    } else if (typeof before !== typeof after) return null;
    target[key] = typeof after === "string" ? after.trim() : Array.isArray(after) ? after.map(entry => String(entry).trim()) : after;
  }
  return next;
}

// Human-readable before/after of the changed fields, kept in the audit record.
export function fixChanges(before: unknown, after: unknown, path: QuestionPath) {
  const pick = (body: unknown) => path.reduce<unknown>((value, segment) => (value as Record<string | number, unknown>)?.[segment], body) as Item | undefined;
  const a = pick(before) ?? {}, b = pick(after) ?? {};
  return Object.fromEntries(FIX_FIELDS.filter(field => JSON.stringify(a[field]) !== JSON.stringify(b[field])).map(field => [field, { before: a[field], after: b[field] }]));
}
