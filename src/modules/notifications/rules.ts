// In-app notifications: limits, the texts of each notice and input checks. No server imports, so the browser
// and the unit tests can read this file too.

export const NOTIFICATION_LIMITS = {
  title: { min: 3, max: 80 }, body: { min: 5, max: 500 }, href: 200,
  // The inbox shows the newest notices; older ones are deleted after `keepDays`.
  list: 30, keepDays: 90, markIds: 50,
  // An announcement reaches accounts that read their inbox within this many days of it being sent.
  announcementDays: 30,
  // A plan that ends within this many days gets one "ending soon" notice.
  planEndingDays: 3,
} as const;

export type NotificationKind = "plan-paid" | "plan-renewed" | "plan-granted" | "plan-ending" | "mock-paid" | "credits-paid" | "announcement";
export type Notice = { kind: NotificationKind; title: string; body: string; href: string | null; dedupeKey: string | null };
export type NotificationItem = { id: string; kind: string; title: string; body: string; href: string | null; read: boolean; createdAt: string };

const DAY_MS = 864e5;

/** A date on the Ulaanbaatar calendar, as 2026.11.25. */
export function noticeDate(value: Date) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ulaanbaatar", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(value).map(part => [part.type, part.value]));
  return `${parts.year}.${parts.month}.${parts.day}`;
}

/** Only a path on this site may be opened from a notice: no other host, scheme, backslash or whitespace. */
export function safeHref(value: unknown): string | null {
  if (typeof value !== "string" || value.length > NOTIFICATION_LIMITS.href) return null;
  return /^\/(?![/\\])[^\s\\]*$/.test(value) ? value : null;
}

export function planPaidNotice(planTitle: string, end: Date, renewed: boolean, orderId: string): Notice {
  return {
    kind: renewed ? "plan-renewed" : "plan-paid", title: renewed ? "Багц сунгагдлаа" : "Багц идэвхжлээ",
    body: `${planTitle} багц ${noticeDate(end)} хүртэл идэвхтэй.`, href: "/workspace/plans", dedupeKey: "order:" + orderId,
  };
}
export function planGrantedNotice(planTitle: string, end: Date): Notice {
  return { kind: "plan-granted", title: "Танд сарын эрх олголоо", body: `${planTitle} багц ${noticeDate(end)} хүртэл идэвхтэй.`, href: "/workspace/plans", dedupeKey: null };
}
export function mockPaidNotice(examTitle: string, slug: string, orderId: string): Notice {
  return { kind: "mock-paid", title: "Шалгалтын эрх нээгдлээ", body: examTitle, href: "/exams/" + slug, dedupeKey: "order:" + orderId };
}
export function creditsPaidNotice(credits: number, orderId: string): Notice {
  return { kind: "credits-paid", title: "Кредит нэмэгдлээ", body: `${credits.toLocaleString("en-US")} кредит таны дансанд орлоо.`, href: "/workspace/plans#credits", dedupeKey: "order:" + orderId };
}

/** True while an active plan is within its last days. A plan that has ended gets no notice. */
export function planEndingDue(endsAt: number, now: number) {
  return Number.isFinite(endsAt) && Number.isFinite(now) && endsAt > now && endsAt - now <= NOTIFICATION_LIMITS.planEndingDays * DAY_MS;
}
/** One notice per plan end: a renewal moves the end, so the renewed plan can be announced again later. */
export function planEndingNotice(program: string, planTitle: string, end: Date, onSale: boolean): Notice {
  return {
    kind: "plan-ending", title: "Багц дуусах гэж байна", body: `${planTitle} багц ${noticeDate(end)}-нд дуусна.`,
    href: onSale ? "/subscribe/" + program : "/workspace/plans", dedupeKey: `plan-ending:${program}:${end.toISOString()}`,
  };
}
export const announcementKey = (id: string) => "announcement:" + id;

export type AnnouncementInput = { title: string; body: string; href: string | null; email: string | null };
/** Checks an admin's announcement. `email` null sends it to every member. */
export function parseAnnouncement(input: unknown): { ok: true; value: AnnouncementInput } | { ok: false; error: string } {
  const fail = (error: string) => ({ ok: false as const, error });
  if (!input || typeof input !== "object" || Array.isArray(input)) return fail("Хүсэлтийн бүтэц буруу.");
  const body = input as Record<string, unknown>;
  if (Object.keys(body).some(key => !["action", "title", "body", "href", "email"].includes(key))) return fail("Танигдаагүй талбар.");
  const { title: titleLimit, body: bodyLimit } = NOTIFICATION_LIMITS;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (title.length < titleLimit.min || title.length > titleLimit.max) return fail(`Гарчгийг ${titleLimit.min}–${titleLimit.max} тэмдэгтээр бичнэ үү.`);
  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (text.length < bodyLimit.min || text.length > bodyLimit.max) return fail(`Текстийг ${bodyLimit.min}–${bodyLimit.max} тэмдэгтээр бичнэ үү.`);
  let href: string | null = null;
  if (body.href !== undefined && body.href !== null && body.href !== "") {
    href = safeHref(typeof body.href === "string" ? body.href.trim() : body.href);
    if (!href) return fail("Холбоос энэ сайтын зам байна. Жишээ: /workspace/plans");
  }
  let email: string | null = null;
  if (body.email !== undefined && body.email !== null && body.email !== "") {
    if (typeof body.email !== "string" || body.email.length > 254 || !/^[^\s@]+@[^\s@]+$/.test(body.email.trim())) return fail("Имэйл хаяг буруу байна.");
    email = body.email.trim().toLowerCase();
  }
  return { ok: true, value: { title, body: text, href, email } };
}

/** The ids of a "mark as read" request: 1–50 distinct short strings. Null when malformed. */
export function parseMarkIds(value: unknown): string[] | null {
  if (!Array.isArray(value) || !value.length || value.length > NOTIFICATION_LIMITS.markIds) return null;
  if (value.some(id => typeof id !== "string" || !id || id.length > 40)) return null;
  return [...new Set(value as string[])];
}

/** "5 минутын өмнө" for a recent notice, the date for an older one. */
export function timeAgo(createdAt: string, now: number) {
  const then = Date.parse(createdAt);
  if (!Number.isFinite(then)) return "";
  const minutes = Math.floor((now - then) / 6e4);
  if (minutes < 1) return "Дөнгөж сая";
  if (minutes < 60) return `${minutes} минутын өмнө`;
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)} цагийн өмнө`;
  if (minutes < 7 * 24 * 60) return `${Math.floor(minutes / (24 * 60))} өдрийн өмнө`;
  return noticeDate(new Date(then));
}

/** The badge on the bell: nothing at 0, capped at 99+. */
export function badgeText(unread: number) {
  return unread > 99 ? "99+" : unread > 0 ? String(unread) : "";
}
