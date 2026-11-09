// Word and PowerPoint are ZIP packages. Read only the XML parts that hold visible text,
// with bounded decompression, so a small upload cannot expand into a huge string.
import { unzipSync } from "fflate";

const MAX_XML_BYTES = 8 * 1024 * 1024;
const MAX_SLIDES = 60;
const MAX_ZIP_ENTRIES = 5_000;

export type OfficeErrorCode = "corrupt" | "too-large" | "too-many-slides";

export class OfficeError extends Error {
  code: OfficeErrorCode;
  constructor(code: OfficeErrorCode) {
    super(code);
    this.code = code;
  }
}

/** The package kind, proven by the entry names inside the ZIP, not by its extension. */
export function officeKind(bytes: Uint8Array): "docx" | "pptx" | null {
  const names = zipNames(bytes);
  if (!names) return null;
  if (names.has("word/document.xml")) return "docx";
  if (names.has("ppt/presentation.xml")) return "pptx";
  return null;
}

/** Entry names only: fflate skips the decompression when the filter returns false. */
export function zipNames(bytes: Uint8Array): Set<string> | null {
  const names = new Set<string>();
  try {
    unzipSync(bytes, {
      filter: file => {
        if (names.size < MAX_ZIP_ENTRIES) names.add(file.name);
        return false;
      },
    });
  } catch { return null; }
  return names;
}

export function docxText(bytes: Uint8Array): string {
  const xml = readEntry(bytes, "word/document.xml");
  if (!xml) throw new OfficeError("corrupt");
  return xmlToText(xml, "w");
}

export function pptxText(bytes: Uint8Array): string {
  let tooLarge = false;
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(bytes, {
      filter: file => {
        if (!/^ppt\/slides\/slide\d+\.xml$/.test(file.name)) return false;
        if (file.originalSize > MAX_XML_BYTES) { tooLarge = true; return false; }
        return true;
      },
    });
  } catch { throw new OfficeError("corrupt"); }
  if (tooLarge) throw new OfficeError("too-large");
  const names = Object.keys(files).sort((a, b) => slideNumber(a) - slideNumber(b));
  if (!names.length) throw new OfficeError("corrupt");
  if (names.length > MAX_SLIDES) throw new OfficeError("too-many-slides");
  const decoder = new TextDecoder("utf-8", { fatal: false });
  return names.map(name => xmlToText(decoder.decode(files[name]), "a")).join("\n\n");
}

function readEntry(bytes: Uint8Array, name: string): string | null {
  let tooLarge = false;
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(bytes, {
      filter: file => {
        if (file.name !== name) return false;
        if (file.originalSize > MAX_XML_BYTES) { tooLarge = true; return false; }
        return true;
      },
    });
  } catch { throw new OfficeError("corrupt"); }
  if (tooLarge) throw new OfficeError("too-large");
  const data = files[name];
  return data ? new TextDecoder("utf-8", { fatal: false }).decode(data) : null;
}

function slideNumber(name: string) {
  return Number(name.match(/(\d+)\.xml$/)?.[1] ?? 0);
}

/**
 * Visible text in document order. Word splits a sentence across runs, so only
 * paragraph, tab, break and cell boundaries add whitespace.
 */
export function xmlToText(xml: string, prefix: "w" | "a"): string {
  const textTag = `${prefix}:t`, paragraph = `${prefix}:p`, tab = `${prefix}:tab`, br = `${prefix}:br`, cell = `${prefix}:tc`;
  const pattern = new RegExp(
    `<${textTag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${textTag}>|<\\/${paragraph}>|<${tab}(?:\\s*\\/)?>|<${br}(?:\\s*\\/)?>|<\\/${cell}>`,
    "g",
  );
  let out = "";
  for (const match of xml.matchAll(pattern)) {
    if (match[1] !== undefined) out += decodeXml(match[1]);
    else if (match[0].startsWith(`</${paragraph}`)) out += "\n";
    else if (match[0].startsWith(`<${tab}`) || match[0].startsWith(`</${cell}`)) out += "\t";
    else if (match[0].startsWith(`<${br}`)) out += "\n";
  }
  return out;
}

const NAMED: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'", nbsp: " " };

/** XML entities in text nodes; numeric references are kept as their code point. */
export function decodeXml(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, body: string) => {
    if (body.startsWith("#")) {
      const code = body[1]?.toLowerCase() === "x" ? Number.parseInt(body.slice(2), 16) : Number.parseInt(body.slice(1), 10);
      try { return Number.isFinite(code) ? String.fromCodePoint(code) : whole; } catch { return whole; }
    }
    return NAMED[body.toLowerCase()] ?? whole;
  });
}
