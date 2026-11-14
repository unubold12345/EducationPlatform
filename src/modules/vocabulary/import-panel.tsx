"use client";
import { useEffect, useRef, useState, type DragEvent, type ReactNode } from "react";
import { Icon } from "@/modules/workspace/icons";
import {
  deckNameFromSource, IMPORT_COUNT, IMPORT_KINDS, IMPORT_LANGUAGES, IMPORT_LEVELS, VOCABULARY_LIMITS,
  type ImportKind, type ImportLanguage, type ImportLevel, type ImportReply, type VocabularyDeck, type VocabularyWord,
} from "./contracts";
import { failure, readStored, request, sendJson, VOCABULARY_API, writeStored } from "./api";
import { Glyph } from "./glyphs";
import { Modal, type Confirm } from "./modal";
import styles from "./vocabulary.module.css";
import { CreditCost, useCredits } from "@/modules/credits/client";
import { readReceipt, vocabularyImportHold } from "@/modules/credits/pricing";
import { MaterialImages, useMaterialPick } from "@/modules/ai-images/client";
import { ProcessingOverlay } from "@/modules/workspace/processing";

const ACCEPT = ".pdf,.docx,.pptx,.txt,.md,.csv,image/*";
const ALLOWED = new Set(["pdf", "docx", "pptx", "txt", "md", "csv"]);
const LANGUAGE_LABEL: Record<ImportLanguage, string> = { mn: "Монгол", en: "English" };
const LEVEL_LABEL: Record<ImportLevel, string> = { any: "Бүх түвшин", basic: "Анхан (A1–A2)", intermediate: "Дунд (B1–B2)", advanced: "Ахисан (C1–C2)" };
const KIND_LABEL: Record<ImportKind, string> = { any: "Бүх төрөл", nouns: "Нэр үг", verbs: "Үйл үг", adjectives: "Тэмдэг нэр, дайвар үг", phrases: "Хэлц, хэллэг" };
const NEW_DECK = "new", NO_DECK = "none";
const bytes = (size: number) => size >= 1024 * 1024 ? (size / 1024 / 1024).toFixed(1) + " MB" : Math.max(1, Math.round(size / 1024)) + " KB";

type Candidate = { key: string; term: string; translation: string; example: string; picked: boolean };
/** A scan waiting for the student's choice. Kept in this browser so a reload does not lose it. */
type Draft = { source: string; duplicates: number; items: Candidate[]; deck: string; deckName: string };
export type SavedImport = { words: VocabularyWord[]; added: number; duplicates: number; skipped: number; total: number; deck: VocabularyDeck | null };

export const scanKey = (userId: string) => `education-vocabulary-scan-v1:${userId}`;
function validDraft(value: Draft | null): value is Draft {
  return Boolean(value) && typeof value!.source === "string" && Array.isArray(value!.items) && value!.items.length > 0 && value!.items.length <= VOCABULARY_LIMITS.importWords
    && value!.items.every(item => item && typeof item.term === "string" && typeof item.translation === "string" && typeof item.example === "string" && typeof item.key === "string");
}

/** The file scan and its review list, in a modal over the vocabulary page; an unsaved list survives closing it. */
export function ImportPanel({ userId, decks, room, full, onSaved, onClose, confirm }: {
  userId: string; decks: VocabularyDeck[]; room: number; full: boolean; onSaved: (saved: SavedImport) => void; onClose: () => void; confirm: Confirm;
}) {
  const material = useMaterialPick({ extensions: ALLOWED, maxBytes: VOCABULARY_LIMITS.fileBytes, documentHint: "PDF, Word, PowerPoint, TXT, MD, CSV файл эсвэл хуудасны зураг сонгоно уу." });
  const picked = material.pick;
  const file = picked?.kind === "document" ? picked.file : null;
  const [language, setLanguage] = useState<ImportLanguage>("mn");
  const [level, setLevel] = useState<ImportLevel>("any");
  const [kind, setKind] = useState<ImportKind>("any");
  const [count, setCount] = useState<number>(IMPORT_COUNT.default);
  const [instruction, setInstruction] = useState("");
  const [pending, setPending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [receipt, setReceipt] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const { apply } = useCredits();

  // A scan that was paid for but not yet saved comes back after a reload.
  useEffect(() => {
    const stored = readStored<Draft>(scanKey(userId));
    const timer = setTimeout(() => { if (validDraft(stored)) setDraft(stored); }, 0);
    return () => clearTimeout(timer);
  }, [userId]);

  const most = Math.max(1, Math.min(IMPORT_COUNT.max, room));
  const wanted = Math.max(1, Math.min(count, most));
  const chosen = draft?.items.filter(item => item.picked && item.term.trim() && item.translation.trim()) ?? [];
  const over = Math.max(0, chosen.length - room);

  function keep(next: Draft | null) {
    setDraft(next);
    writeStored(scanKey(userId), next);
  }
  function edit(key: string, change: Partial<Candidate>) {
    if (draft) keep({ ...draft, items: draft.items.map(item => item.key === key ? { ...item, ...change } : item) });
  }
  async function pick(next: ArrayLike<File> | null | undefined) {
    setError("");
    setError(await material.choose(next));
  }
  function drop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    if (!pending) void pick(event.dataTransfer.files);
  }

  async function scan() {
    if (!picked || pending || material.preparing || full) return;
    setPending(true); setError(""); setReceipt("");
    try {
      const form = new FormData();
      material.append(form);
      form.append("language", language);
      form.append("prompt", instruction.trim());
      form.append("count", String(wanted));
      form.append("level", level);
      form.append("kind", kind);
      const data = await request<ImportReply>(VOCABULARY_API + "/import", { method: "POST", body: form }, 175_000);
      apply(data);
      const paid = readReceipt(data);
      setReceipt(paid ? `${paid.spent} кредит зарцууллаа.` : "");
      keep({
        source: data.source.name, duplicates: data.duplicates,
        items: data.candidates.map((word, index) => ({ key: "c" + index, term: word.term, translation: word.translation, example: word.example ?? "", picked: true })),
        deck: NEW_DECK, deckName: deckNameFromSource(data.source.name),
      });
      material.clear();
    } catch (reason) {
      setError(failure(reason, "Файлаас үг уншиж чадсангүй. Дахин оролдоно уу."));
    } finally { setPending(false); }
  }

  async function save() {
    if (!draft || saving || !chosen.length || over) return;
    const name = draft.deckName.trim();
    if (draft.deck === NEW_DECK && !name) { setError("Шинэ багцын нэрээ бичнэ үү."); return; }
    setSaving(true); setError("");
    try {
      const saved = await sendJson<SavedImport>(VOCABULARY_API + "/words", {
        action: "add",
        words: chosen.map(item => ({ term: item.term.trim(), translation: item.translation.trim(), example: item.example.trim() })),
        ...(draft.deck === NEW_DECK ? { deckName: name } : draft.deck === NO_DECK ? {} : { deckId: draft.deck }),
        sourceName: draft.source,
      }, "POST", 30_000);
      keep(null);
      setReceipt("");
      onSaved(saved);
    } catch (reason) {
      setError(failure(reason, "Үгсийг хадгалж чадсангүй. Дахин оролдоно уу."));
    } finally { setSaving(false); }
  }
  async function discard() {
    if (!draft || saving) return;
    const answer = await confirm({ title: "Олдсон үгсийн жагсаалтыг хаях уу?", text: "Хадгалаагүй үгс устана. Буцаах боломжгүй.", choices: [{ value: "discard", label: "Жагсаалтыг хаях", tone: "danger" }] });
    if (answer !== "discard") return;
    keep(null); setReceipt(""); setError("");
  }
  const modal = (content: ReactNode) => <Modal labelledBy={draft ? "voc-review-heading" : "voc-import-heading"} onClose={onClose} busy={pending || saving}>{content}</Modal>;

  if (draft) {
    const allPicked = draft.items.every(item => item.picked);
    return modal(<section className={`${styles.panel} ${styles.reviewPanel}`} aria-labelledby="voc-review-heading" data-panel="review">
      <div className={styles.panelHead}>
        <span className={styles.panelIcon} aria-hidden="true"><Icon name="check" size={19} /></span>
        <div>
          <h2 id="voc-review-heading">{draft.items.length} шинэ үг олдлоо</h2>
          <p>{draft.source}{draft.duplicates ? ` · ${draft.duplicates} үг аль хэдийн санд байсан тул орхилоо` : ""}{receipt ? ` · ${receipt}` : ""}</p>
        </div>
        <button type="button" className={styles.rowAction} onClick={onClose} aria-label="Хаах" title="Хаах" disabled={saving}><Icon name="close" size={18} /></button>
      </div>
      <p className={styles.reviewLead}>Хадгалах үгээ сонгоод, орчуулгыг нь шалгаж засаарай. AI-ийн орчуулга үргэлж зөв байдаггүй.</p>
      <div className={styles.reviewBar}>
        <label className={styles.check}><input type="checkbox" checked={allPicked} onChange={() => keep({ ...draft, items: draft.items.map(item => ({ ...item, picked: !allPicked })) })} /><span>Бүгдийг сонгох</span></label>
        <label className={styles.reviewDeck}><span>Хадгалах багц</span>
          <select value={draft.deck} onChange={event => keep({ ...draft, deck: event.target.value })} disabled={saving}>
            <option value={NEW_DECK}>Шинэ багц үүсгэх</option>
            {decks.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
            <option value={NO_DECK}>Багцгүй</option>
          </select>
        </label>
        {draft.deck === NEW_DECK ? <label className={styles.reviewDeck}><span>Шинэ багцын нэр</span>
          <input value={draft.deckName} onChange={event => keep({ ...draft, deckName: event.target.value })} maxLength={VOCABULARY_LIMITS.deckName} disabled={saving} />
        </label> : null}
      </div>
      <ul className={styles.candidates}>
        {draft.items.map(item => <li key={item.key} className={item.picked ? undefined : styles.candidateOff} data-candidate={item.term}>
          <label className={styles.check}><input type="checkbox" checked={item.picked} onChange={() => edit(item.key, { picked: !item.picked })} aria-label={`${item.term} үгийг хадгалах`} disabled={saving} /></label>
          <input className={styles.candidateTerm} value={item.term} onChange={event => edit(item.key, { term: event.target.value })} maxLength={VOCABULARY_LIMITS.term} aria-label="Үг" disabled={saving || !item.picked} />
          <input value={item.translation} onChange={event => edit(item.key, { translation: event.target.value })} maxLength={VOCABULARY_LIMITS.translation} aria-label={`${item.term} үгийн орчуулга`} disabled={saving || !item.picked} />
          {item.example ? <p className={styles.example}>“{item.example}”</p> : null}
        </li>)}
      </ul>
      {over ? <p className={styles.error} role="alert">Санд {room} үгийн зай үлдсэн. {over} үгийн сонголтыг болиулна уу.</p> : null}
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      <div className={styles.reviewFoot}>
        <span>{chosen.length} / {draft.items.length} үг сонгосон</span>
        <button type="button" className={styles.ghost} onClick={() => void discard()} disabled={saving}>Жагсаалтыг хаях</button>
        <button type="button" className={styles.primary} onClick={() => void save()} disabled={saving || !chosen.length || over > 0} aria-busy={saving}>
          {saving ? <><i className={styles.spinner} aria-hidden="true" />Хадгалж байна…</> : <><Icon name="check" size={17} />{chosen.length} үг хадгалах</>}
        </button>
      </div>
    </section>);
  }

  return modal(<section className={`${styles.panel} ${styles.importPanel}`} aria-labelledby="voc-import-heading" data-panel="import">
    {/* While the file is being scanned the whole page waits (owner request 2026-11-15); `pending` clears on success, error and timeout. */}
    <ProcessingOverlay open={pending} title="Үгсийг түүж байна…" detail="Файлыг уншиж, AI үгсийг түүж байна. 10–40 секунд орно." />
    <div className={styles.panelHead}>
      <span className={styles.panelIcon} aria-hidden="true"><Icon name="spark" size={19} /></span>
      <div><h2 id="voc-import-heading">Файлаас үг түүх</h2><p>AI файл эсвэл хуудасны зургаас үгсийг орчуулгын хамт олно. Та жагсаалтыг үзээд, хадгалах үгээ өөрөө сонгоно.</p></div>
      <button type="button" className={styles.rowAction} onClick={onClose} aria-label="Хаах" title="Хаах" disabled={pending}><Icon name="close" size={18} /></button>
    </div>
    <div className={styles.importGrid}>
      <div className={`${styles.drop} ${dragging ? styles.dropActive : ""}`}
        onDragEnter={event => { event.preventDefault(); if (!pending) setDragging(true); }}
        onDragOver={event => event.preventDefault()}
        onDragLeave={event => { if (event.currentTarget === event.target) setDragging(false); }}
        onDrop={drop}>
        <input ref={fileInput} type="file" accept={ACCEPT} multiple className="sr-only" onChange={event => { const files = Array.from(event.target.files ?? []); event.target.value = ""; void pick(files); }} disabled={pending} aria-label="Үг оруулах файл эсвэл зураг сонгох" />
        {picked?.kind === "images" || (material.preparing && !file) ? <MaterialImages images={picked?.kind === "images" ? picked.images : []} max={material.max} onRemove={material.removeImage} onAdd={() => fileInput.current?.click()} busy={material.preparing} disabled={pending} />
        : file ? <div className={styles.fileRow}>
          <span className={styles.fileIcon} aria-hidden="true">{file.name.split(".").pop()?.toUpperCase().slice(0, 4)}</span>
          <span className={styles.fileText}><strong>{file.name}</strong><small>{bytes(file.size)}</small></span>
          <button type="button" className={styles.remove} onClick={() => { material.clear(); fileInput.current?.focus(); }} aria-label="Сонгосон файлыг арилгах" disabled={pending}><Icon name="close" size={18} /></button>
        </div> : <>
          <span className={styles.dropMark} aria-hidden="true"><Glyph name="upload" size={22} /></span>
          <strong>{dragging ? "Файл эсвэл зургаа тавина уу" : "Файл эсвэл зургаа энд чирэх, сонгох"}</strong>
          <span>{VOCABULARY_LIMITS.fileBytes / 1024 / 1024} MB хүртэл · PDF, DOCX, PPTX, TXT, MD, CSV эсвэл {material.max} хүртэл хуудасны зураг</span>
          <button type="button" className={styles.choose} onClick={() => fileInput.current?.click()} disabled={pending}>Файл, зураг сонгох</button>
        </>}
      </div>

      <div className={styles.importOptions}>
        <div className={styles.option}>
          <label htmlFor="voc-import-count">Хамгийн ихдээ хэдэн үг</label>
          <div className={styles.rangeRow}>
            <input id="voc-import-count" type="range" min={IMPORT_COUNT.min} max={most} step={1} value={wanted} onChange={event => setCount(Number(event.target.value))} disabled={pending || full || most <= 1} />
            <input type="number" min={IMPORT_COUNT.min} max={most} value={wanted} onChange={event => { const value = Math.floor(Number(event.target.value)); if (Number.isFinite(value)) setCount(Math.max(IMPORT_COUNT.min, Math.min(most, value))); }} disabled={pending || full} aria-label="Үгийн дээд тоо" />
          </div>
          <small>{full ? "Үгсийн сан дүүрсэн тул файлаас үг нэмэх боломжгүй." : room < IMPORT_COUNT.max ? `Санд ${room} үгийн зай үлдсэн.` : "Файлд цөөн үг байвал байгаагаар нь авна."}</small>
        </div>
        <div className={styles.optionPair}>
          <label className={styles.option}><span>Үгийн түвшин</span>
            <select value={level} onChange={event => setLevel(event.target.value as ImportLevel)} disabled={pending}>{IMPORT_LEVELS.map(value => <option key={value} value={value}>{LEVEL_LABEL[value]}</option>)}</select>
          </label>
          <label className={styles.option}><span>Үгийн төрөл</span>
            <select value={kind} onChange={event => setKind(event.target.value as ImportKind)} disabled={pending}>{IMPORT_KINDS.map(value => <option key={value} value={value}>{KIND_LABEL[value]}</option>)}</select>
          </label>
        </div>
        <div className={styles.option} role="group" aria-label="Файлд орчуулга байхгүй үеийн орчуулгын хэл">
          <span>Файлд орчуулга байхгүй бол</span>
          <div className={styles.segmented}>{IMPORT_LANGUAGES.map(value => <button key={value} type="button" aria-pressed={language === value} className={language === value ? styles.segmentActive : undefined} onClick={() => setLanguage(value)} disabled={pending}>{LANGUAGE_LABEL[value]} орчуулга</button>)}</div>
        </div>
        <label className={styles.field}>
          <span>Нэмэлт заавар <em>сонголтоор · {instruction.length}/{VOCABULARY_LIMITS.prompt}</em></span>
          <textarea value={instruction} onChange={event => setInstruction(event.target.value)} maxLength={VOCABULARY_LIMITS.prompt} rows={2} placeholder="жишээ нь: Зөвхөн 3-р бүлгийн шинэ үгсийг ав." disabled={pending} />
        </label>
      </div>
    </div>
    {error ? <p className={styles.error} role="alert">{error}</p> : null}
    <div className={styles.importFoot}>
      <p className={styles.hint}><Icon name="info" size={15} /><span>Файлд өөрийн орчуулга байвал түүнийг ашиглана. Бусад үгийг AI орчуулах тул хадгалахаасаа өмнө шалгаарай. Хугацаатай шалгалтын үеэр хаалттай.</span></p>
      <div className={styles.importAction}>
        {full ? null : <CreditCost action="vocabulary-import" cost={vocabularyImportHold(wanted)} upTo />}
        <button type="button" className={styles.primary} onClick={() => void scan()} disabled={!picked || pending || material.preparing || full} aria-busy={pending}>
          {pending ? <><i className={styles.spinner} aria-hidden="true" />Уншиж байна…</> : <><Icon name="spark" size={17} />Үгсийг олох</>}
        </button>
      </div>
    </div>
  </section>);
}
