"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { AI_IMAGE_LIMITS } from "./contracts";
import styles from "./ai-images.module.css";

/**
 * One image ready to send to the AI. It is decoded, resized and re-encoded as JPEG in this browser, so the
 * upload stays small and camera metadata (such as a photo's location) never leaves the device.
 * `url` is what the server receives; `thumb` is a small preview kept with the browser-stored chat.
 */
export type AttachedImage = { id: string; name: string; url: string; thumb: string; bytes: number };

const newId = () => typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2);
const IMAGE_NAME = /\.(jpe?g|png|webp|gif|bmp|heic|heif|avif)$/i;

class ImageError extends Error {}

function draw(bitmap: ImageBitmap, side: number) {
  const scale = Math.min(1, side / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new ImageError("Энэ хөтөч зургийг боловсруулж чадсангүй.");
  // JPEG has no transparency: a transparent screenshot gets a white page instead of a black one.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas;
}
function jpeg(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new ImageError("Зургийг хадгалж чадсангүй.")), "image/jpeg", quality));
}
function dataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new ImageError("Зургийг уншиж чадсангүй."));
    reader.readAsDataURL(blob);
  });
}

/** Whether a picked, pasted or dropped file looks like a picture (the browser's decoder decides for sure). */
export function isImageFile(file: File) {
  return file.type.startsWith("image/") || IMAGE_NAME.test(file.name);
}

/** Resize one picture to at most 1600px on its longer side and re-encode it as JPEG under the size target. */
export async function prepareImage(file: File): Promise<AttachedImage> {
  const label = file.name ? `"${file.name.slice(0, 60)}"` : "Зураг";
  if (file.size > AI_IMAGE_LIMITS.sourceBytes) throw new ImageError(`${label} хэт том байна. 25 MB хүртэл зураг сонгоно уу.`);
  let bitmap: ImageBitmap;
  try { bitmap = await createImageBitmap(file, { imageOrientation: "from-image" }); }
  catch { throw new ImageError(`${label}-г уншиж чадсангүй. JPG, PNG эсвэл WebP зураг сонгоно уу.`); }
  try {
    if (bitmap.width < 16 || bitmap.height < 16) throw new ImageError(`${label} хэт жижиг байна.`);
    let side: number = AI_IMAGE_LIMITS.maxSide, quality = 0.86;
    let blob = await jpeg(draw(bitmap, side), quality);
    // Shrink until it fits: lower the quality once, then use fewer pixels.
    for (let step = 0; blob.size > AI_IMAGE_LIMITS.targetBytes && step < 5; step++) {
      if (quality > 0.75) quality = 0.72;
      else side = Math.round(side * 0.8);
      blob = await jpeg(draw(bitmap, side), quality);
    }
    if (blob.size > AI_IMAGE_LIMITS.targetBytes) throw new ImageError(`${label} хэт нарийн байна. Илүү ойроос, тод зураг авна уу.`);
    const thumb = await jpeg(draw(bitmap, AI_IMAGE_LIMITS.thumbSide), 0.6);
    return { id: newId(), name: file.name || "зураг.jpg", url: await dataUrl(blob), thumb: await dataUrl(thumb), bytes: blob.size };
  } finally {
    bitmap.close();
  }
}

/** Prepare up to `room` pictures; the first problem becomes a message for the student. */
export async function prepareImages(files: readonly File[], room: number, max: number): Promise<{ images: AttachedImage[]; error: string }> {
  const pictures = files.filter(isImageFile);
  let error = pictures.length < files.length ? "Зөвхөн зураг (JPG, PNG, WebP) хавсаргана уу." : "";
  if (room <= 0) return { images: [], error: `Нэг удаад ${max} хүртэл зураг хавсаргана.` };
  if (pictures.length > room) error = `Нэг удаад ${max} хүртэл зураг хавсаргана. Эхний ${room}-г авлаа.`;
  const images: AttachedImage[] = [];
  for (const file of pictures.slice(0, room)) {
    try { images.push(await prepareImage(file)); }
    catch (reason) { error = reason instanceof ImageError ? reason.message : "Зургийг боловсруулж чадсангүй."; }
  }
  return { images, error };
}

/** Image files from a paste or a drop, if any. */
export function imageFiles(data: DataTransfer | null): File[] {
  return data ? Array.from(data.files).filter(isImageFile) : [];
}

/** The prepared JPEG as a Blob, for multipart uploads. */
export function imageBlob(image: AttachedImage) {
  const comma = image.url.indexOf(",");
  const type = image.url.slice(5, image.url.indexOf(";"));
  const binary = atob(image.url.slice(comma + 1));
  return new Blob([Uint8Array.from(binary, char => char.charCodeAt(0))], { type });
}
/** A file name with the extension of what is actually sent. */
export function imageFileName(image: AttachedImage) {
  return (image.name.replace(/\.[a-z0-9]{1,8}$/i, "").slice(0, 80) || "зураг") + ".jpg";
}

/** Attachments kept in a component's own state, for the review coach and the assistant drawer. */
export function useImageAttachments(max: number = AI_IMAGE_LIMITS.perMessage) {
  const [images, setImages] = useState<AttachedImage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // The room left is read when the picker returns, after any earlier pick has been added.
  const count = useRef(0);
  useEffect(() => { count.current = images.length; }, [images.length]);
  const add = useCallback(async (files: readonly File[]) => {
    if (!files.length) return;
    setBusy(true); setError("");
    try {
      const result = await prepareImages(files, max - count.current, max);
      count.current = Math.min(max, count.current + result.images.length);
      setImages(current => [...current, ...result.images].slice(0, max));
      setError(result.error);
    } finally { setBusy(false); }
  }, [max]);
  const remove = useCallback((id: string) => { setImages(current => current.filter(image => image.id !== id)); setError(""); }, []);
  const clear = useCallback(() => { setImages([]); setError(""); }, []);
  return { images, busy, error, add, remove, clear, max };
}

function PictureIcon() {
  return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <rect x="3.5" y="5" width="17" height="14" rx="2.5" /><circle cx="9" cy="10" r="1.6" /><path d="m4.5 17.5 5-4.5 3.5 3 3-2.5 3.5 3.5" />
  </svg>;
}

/** A picture button that opens the photo picker (camera or library on phones). */
export function AttachButton({ onFiles, count, max = AI_IMAGE_LIMITS.perMessage, disabled = false, className, withLabel = false }: {
  onFiles: (files: File[]) => void; count: number; max?: number; disabled?: boolean; className?: string; withLabel?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const full = count >= max;
  const label = full ? `${max} хүртэл зураг хавсаргана` : "Зураг хавсаргах";
  return <>
    <input ref={input} type="file" accept="image/*" multiple hidden tabIndex={-1} aria-hidden="true" data-ai-image-input=""
      onChange={event => { const files = Array.from(event.target.files ?? []); event.target.value = ""; if (files.length) onFiles(files); }} />
    <button type="button" className={[styles.attach, className].filter(Boolean).join(" ")} onClick={() => input.current?.click()} disabled={disabled || full} aria-label={withLabel ? undefined : label} title={label}>
      <PictureIcon />{withLabel ? <span>{label}</span> : null}{count ? <span className={styles.count}>{count}/{max}</span> : null}
    </button>
  </>;
}

/** Thumbnails of the attached images, each with a remove button. */
export function ImageStrip({ images, onRemove, busy = false, disabled = false, error = "", className }: {
  images: AttachedImage[]; onRemove?: (id: string) => void; busy?: boolean; disabled?: boolean; error?: string; className?: string;
}) {
  if (!images.length && !busy && !error) return null;
  return <div className={[styles.wrap, className].filter(Boolean).join(" ")}>
    {images.length || busy ? <ul className={styles.strip} aria-label="Хавсаргасан зураг">
      {images.map((image, index) => <li key={image.id} className={styles.item}>
        {/* eslint-disable-next-line @next/next/no-img-element -- a local data URL preview; there is nothing to optimise. */}
        <img src={image.thumb} alt={`Зураг ${index + 1}: ${image.name}`} width={64} height={64} />
        {onRemove ? <button type="button" className={styles.remove} onClick={() => onRemove(image.id)} disabled={disabled} aria-label={`${index + 1}-р зургийг хасах`}>×</button> : null}
      </li>)}
      {busy ? <li className={`${styles.item} ${styles.loading}`} role="status" aria-label="Зургийг бэлдэж байна"><i /></li> : null}
    </ul> : null}
    {error ? <p className={styles.error} role="alert">{error}</p> : null}
  </div>;
}

/** Read-only previews on a sent message. */
export function SentImages({ urls, className }: { urls?: readonly string[]; className?: string }) {
  if (!urls?.length) return null;
  return <div className={[styles.sent, className].filter(Boolean).join(" ")} aria-label={`${urls.length} зураг хавсаргасан`}>
    {/* eslint-disable-next-line @next/next/no-img-element -- local data URL previews kept in this browser. */}
    {urls.map((url, index) => <img key={index} src={url} alt={`Хавсаргасан зураг ${index + 1}`} />)}
  </div>;
}

/** Study material for an upload panel: one document, or up to four photos or scans of pages. */
export type MaterialPick = { kind: "document"; file: File } | { kind: "images"; images: AttachedImage[] } | null;

/**
 * The vocabulary import and exam-from-file pickers. A document is checked by extension and size here (the
 * server proves its real kind); pictures are resized to JPEG in the browser and sent as several `file` fields.
 * `choose` returns a message for the student, or "" when the pick is fine.
 */
export function useMaterialPick({ extensions, maxBytes, documentHint }: { extensions: ReadonlySet<string>; maxBytes: number; documentHint: string }) {
  const [pick, setPick] = useState<MaterialPick>(null);
  const [preparing, setPreparing] = useState(false);
  const current = useRef<MaterialPick>(null);
  useEffect(() => { current.current = pick; }, [pick]);
  const max = AI_IMAGE_LIMITS.perUpload;

  async function choose(list: ArrayLike<File> | null | undefined): Promise<string> {
    const files = Array.from(list ?? []);
    if (!files.length) return "";
    const pictures = files.filter(isImageFile);
    if (pictures.length) {
      if (pictures.length < files.length) return "Зураг болон баримт бичгийг хамт оруулах боломжгүй. Аль нэгийг нь сонгоно уу.";
      const kept = current.current?.kind === "images" ? current.current.images : [];
      setPreparing(true);
      try {
        const result = await prepareImages(pictures, max - kept.length, max);
        const images = [...kept, ...result.images].slice(0, max);
        const next: MaterialPick = images.length ? { kind: "images", images } : current.current;
        current.current = next;
        setPick(next);
        return result.error;
      } finally { setPreparing(false); }
    }
    if (files.length > 1) return "Нэг удаад нэг баримт бичиг оруулна уу. Олон хуудсыг зураг болгон оруулж болно.";
    const file = files[0];
    const extension = file.name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "";
    if (!extensions.has(extension)) return documentHint;
    if (file.size > maxBytes) return `Файл хэт том байна. ${maxBytes / 1024 / 1024} MB хүртэл файл оруулна уу.`;
    const next: MaterialPick = { kind: "document", file };
    current.current = next;
    setPick(next);
    return "";
  }
  function removeImage(id: string) {
    setPick(value => {
      if (value?.kind !== "images") return value;
      const images = value.images.filter(image => image.id !== id);
      return images.length ? { kind: "images", images } : null;
    });
  }
  function clear() { current.current = null; setPick(null); }
  /** Adds the pick to an upload form as one or more `file` fields. */
  function append(form: FormData) {
    if (pick?.kind === "document") form.append("file", pick.file);
    else if (pick?.kind === "images") for (const image of pick.images) form.append("file", imageBlob(image), imageFileName(image));
  }
  return { pick, preparing, choose, removeImage, clear, append, max };
}

/** The picked page photos inside an upload panel's drop area, with room to add more. */
export function MaterialImages({ images, max, onRemove, onAdd, busy = false, disabled = false }: {
  images: AttachedImage[]; max: number; onRemove: (id: string) => void; onAdd: () => void; busy?: boolean; disabled?: boolean;
}) {
  const size = images.reduce((sum, image) => sum + image.bytes, 0);
  return <div className={styles.material}>
    <ImageStrip images={images} onRemove={onRemove} busy={busy} disabled={disabled} />
    <p className={styles.materialText}>
      <strong>{images.length} / {max} хуудасны зураг</strong>
      <small>{size >= 1024 * 1024 ? (size / 1024 / 1024).toFixed(1) + " MB" : Math.max(1, Math.round(size / 1024)) + " KB"} · AI зургийг шууд уншина</small>
    </p>
    {images.length < max ? <button type="button" className={styles.more} onClick={onAdd} disabled={disabled || busy}>+ Зураг нэмэх</button> : null}
  </div>;
}
