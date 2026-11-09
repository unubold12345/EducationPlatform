// Shared limits and text helpers for every upload-to-AI feature: one bounded text pipeline, so a
// vocabulary import and an exam-from-a-file follow the same rules. Pure, so it can be unit-tested.

export const DOCUMENT_LIMITS = {
  /** Vercel functions reject bodies above 4.5 MB, and multipart adds form overhead. */
  fileBytes: 4 * 1024 * 1024,
  textChars: 45_000,
  pdfPages: 100,
  sourceName: 160,
} as const;

/** A file name safe to show and store: no path, no control characters, bounded. */
export function displayFileName(name: string) {
  const base = (name.split(/[\\/]/).pop() ?? "").replace(/[\u0000-\u001f\u007f]/g, "").trim();
  return base.slice(0, DOCUMENT_LIMITS.sourceName) || "Файл";
}

/** A readable title from a file name when the model does not give a usable one. */
export function fallbackTitle(name: string, empty = "Шинэ багц") {
  const clean = displayFileName(name).replace(/\.[a-z0-9]{1,8}$/i, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return clean ? clean.slice(0, 80) : empty;
}

/**
 * Normalise extracted document text for a prompt: one line-break style, no control characters,
 * rejoined words split by a PDF line break, and a bounded length.
 */
export function cleanSourceText(raw: string) {
  let text = raw
    .replace(/\r\n?/g, "\n")
    .replace(/\u0000/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/[\u0001-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .replace(/[ \t]+$/gm, "")
    .replace(/^[ \t]+/gm, "")
    // "exam-\nple" is one word; keep a real hyphen when the next line starts with a capital.
    .replace(/([a-z])-\n(?=[a-z])/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  let truncated = false;
  if (text.length > DOCUMENT_LIMITS.textChars) {
    truncated = true;
    const cut = text.slice(0, DOCUMENT_LIMITS.textChars);
    const at = Math.max(cut.lastIndexOf("\n\n"), cut.lastIndexOf(". "), cut.lastIndexOf("。"), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
    text = (at > DOCUMENT_LIMITS.textChars * 0.75 ? cut.slice(0, at + 1) : cut).trim();
  }
  return { text, truncated };
}
