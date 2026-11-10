import "server-only";
import { ApiError } from "@/lib/api";
import { AI_IMAGE_LIMITS, imageDataUrl, imageType } from "@/modules/ai-images/contracts";
import { detectSource } from "./extract";
import { DOCUMENT_LIMITS, displayFileName } from "./text";

type Upload = { name: string; size: number; arrayBuffer: () => Promise<ArrayBuffer> };
const isUpload = (value: unknown): value is Upload => Boolean(value) && typeof value === "object"
  && typeof (value as Upload).name === "string" && typeof (value as Upload).size === "number"
  && typeof (value as Upload).arrayBuffer === "function";

/** One document to extract text from, or page photos for DeepSeek to read directly (base64 data URLs). */
export type UploadedSource =
  | { kind: "document"; name: string; bytes: Uint8Array }
  | { kind: "images"; name: string; images: string[] };

/**
 * The `file` fields of an upload form: one document, or up to four photos or scans of pages (JPEG, PNG or
 * WebP). The count, the total size and every file's real kind are proven before any AI budget is spent.
 * The files are never stored.
 */
export async function readUploadedSource(form: FormData, missing: string): Promise<UploadedSource> {
  const entries = form.getAll("file");
  const files = entries.filter((entry): entry is File => typeof entry !== "string" && isUpload(entry));
  if (!entries.length || files.length !== entries.length || files.some(file => !file.size)) throw new ApiError(400, missing);
  if (files.length > AI_IMAGE_LIMITS.perUpload) throw new ApiError(400, `Нэг удаад ${AI_IMAGE_LIMITS.perUpload} хүртэл зураг оруулна.`);
  const total = files.reduce((sum, file) => sum + file.size, 0);
  if (total > DOCUMENT_LIMITS.fileBytes) throw new ApiError(413, `Файл хэт том байна. ${DOCUMENT_LIMITS.fileBytes / 1024 / 1024} MB хүртэл файл оруулна уу.`);
  const read = await Promise.all(files.map(async file => {
    try { return { name: displayFileName(file.name), bytes: new Uint8Array(await file.arrayBuffer()) }; }
    catch { throw new ApiError(400, "Файлыг уншиж чадсангүй. Дахин оролдоно уу."); }
  }));
  const types = read.map(file => imageType(file.bytes));
  if (types.every(type => type !== null)) {
    return {
      kind: "images",
      name: read.length === 1 ? read[0].name : `${read.length} зураг`,
      images: read.map((file, index) => imageDataUrl(types[index]!, Buffer.from(file.bytes).toString("base64"))),
    };
  }
  if (read.length > 1) throw new ApiError(415, "Олон файл оруулахад бүгд зураг (JPG, PNG, WebP) байна. Баримт бичгийг нэг нэгээр нь оруулна уу.");
  // Reject the wrong kind before the daily AI budget is charged.
  detectSource(read[0].name, read[0].bytes);
  return { kind: "document", name: read[0].name, bytes: read[0].bytes };
}
