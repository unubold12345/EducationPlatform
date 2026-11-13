import { createHash } from "node:crypto";

/**
 * A browser-stored thread moves to the account once: its key is the SHA-256 of the account's id and the browser's
 * thread id, computed on the server, and an account holds each key at most once (`@@unique([userId, importKey])`).
 */
export function chatImportKey(userId: string, browserId: string) {
  return createHash("sha256").update(userId + ":" + browserId).digest("hex");
}
