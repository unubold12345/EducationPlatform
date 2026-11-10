import "server-only";
import { extractText, getDocumentProxy } from "unpdf";
import { ApiError } from "@/lib/api";
import { DOCUMENT_LIMITS } from "./text";
import { docxText, OfficeError, officeKind, pptxText } from "./office";

export type SourceKind = "pdf" | "docx" | "pptx" | "text";
export type ExtractedDocument = { kind: SourceKind; text: string; pages?: number };

const PDF_MS = 30_000;
const TEXT_EXTENSIONS = new Set(["txt", "md", "markdown", "csv", "text"]);

const extension = (name: string) => name.toLowerCase().match(/\.([a-z0-9]{1,8})$/)?.[1] ?? "";
const startsWith = (bytes: Uint8Array, text: string) => text.split("").every((char, index) => bytes[index] === char.charCodeAt(0));

/**
 * Prove the upload's real kind before any extraction work or AI budget is spent. The extension
 * and the file signature must agree for PDF and ZIP files.
 */
export function detectSource(fileName: string, bytes: Uint8Array): SourceKind {
  const ext = extension(fileName);
  if (ext === "doc") throw new ApiError(415, "Хуучин .doc файлыг дэмжихгүй. Word дээр .docx хэлбэрээр хадгалаад дахин оруулна уу.");
  const pdf = startsWith(bytes, "%PDF-");
  const zip = bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
  if (ext === "pdf" || pdf) {
    if (!pdf) throw new ApiError(415, "Файл PDF биш байна. Файлаа шалгаад дахин оруулна уу.");
    return "pdf";
  }
  if (zip || ext === "docx" || ext === "pptx") {
    if (!zip) throw new ApiError(415, "Word эсвэл PowerPoint файл гэмтсэн байна.");
    const kind = officeKind(bytes);
    if (kind) return kind;
    throw new ApiError(415, "Энэ ZIP файл Word эсвэл PowerPoint биш байна.");
  }
  if (TEXT_EXTENSIONS.has(ext) || !ext) return "text";
  throw new ApiError(415, "Зөвхөн PDF, DOCX, PPTX, TXT, MD, CSV файл эсвэл зураг (JPG, PNG, WebP) оруулна уу.");
}

/** Turn one supported upload into plain text. Never trusts the extension alone. */
export async function extractDocument(fileName: string, bytes: Uint8Array): Promise<ExtractedDocument> {
  const kind = detectSource(fileName, bytes);
  if (kind === "pdf") return pdfDocument(bytes);
  if (kind === "docx") return { kind, text: officeText(() => docxText(bytes)) };
  if (kind === "pptx") return { kind, text: officeText(() => pptxText(bytes)) };
  return { kind, text: decodeText(bytes) };
}

async function pdfDocument(bytes: Uint8Array): Promise<ExtractedDocument> {
  let pdf: Awaited<ReturnType<typeof getDocumentProxy>>;
  try {
    pdf = await getDocumentProxy(bytes, { maxImageSize: 16 * 1024 * 1024 });
  } catch {
    throw new ApiError(422, "PDF-ийг нээж чадсангүй. Файл түгжээтэй эсвэл гэмтсэн байж болно.");
  }
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    if (pdf.numPages < 1) throw new ApiError(422, "PDF хоосон байна.");
    if (pdf.numPages > DOCUMENT_LIMITS.pdfPages) throw new ApiError(422, `PDF нь ${DOCUMENT_LIMITS.pdfPages}-аас олон хуудастай байна. Эхний ${DOCUMENT_LIMITS.pdfPages} хуудсаа салгаж оруулна уу.`);
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new ApiError(504, "PDF уншихад хэт удлаа. Файлаа жижигрүүлээд дахин оролдоно уу.")), PDF_MS);
    });
    const result = await Promise.race([extractText(pdf, { mergePages: true }), timeout]);
    const text = Array.isArray(result.text) ? result.text.join("\n\n") : result.text;
    if (!text.trim()) throw new ApiError(422, "PDF-ээс уншигдах текст олдсонгүй. Скан хуудас бол хуудсуудынхаа зургийг (4 хүртэл) оруулна уу.");
    return { kind: "pdf", text, pages: result.totalPages };
  } finally {
    if (timer) clearTimeout(timer);
    // `extractText` does not own a caller-supplied proxy; release the PDF.js worker here.
    await pdf.loadingTask.destroy().catch(() => { /* The document is already unusable; nothing to recover. */ });
  }
}

function officeText(read: () => string) {
  try {
    const text = read();
    if (!text.trim()) throw new ApiError(422, "Файлаас уншигдах текст олдсонгүй. Текст бүхий хуудас оруулна уу.");
    return text;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof OfficeError) {
      if (error.code === "too-large") throw new ApiError(422, "Файл доторх текст хэт том байна. Хэсэг хуудсаа салгаж оруулна уу.");
      if (error.code === "too-many-slides") throw new ApiError(422, "Slide хэт олон байна. 60 хүртэлх слайдтай файл оруулна уу.");
    }
    throw new ApiError(422, "Word эсвэл PowerPoint файлыг уншиж чадсангүй. Файлаа шалгаад дахин оруулна уу.");
  }
}

function decodeText(bytes: Uint8Array) {
  if (bytes.subarray(0, 4096).includes(0)) throw new ApiError(415, "Энэ файл текст биш байна. PDF, Word эсвэл текст файл оруулна уу.");
  const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes).replace(/^\uFEFF/, "");
  const broken = (text.match(/\uFFFD/g) ?? []).length;
  if (broken > 20 && broken / Math.max(1, text.length) > 0.01) throw new ApiError(415, "Файлын кодлолыг уншиж чадсангүй. UTF-8 текст файл ашиглана уу.");
  if (!text.trim()) throw new ApiError(422, "Файл хоосон байна.");
  return text;
}
