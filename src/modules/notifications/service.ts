import "server-only";
import { getDb } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { authFeatures, isDemoEmail } from "@/lib/auth-features";
import { findAnyPlan, findSubscriptionPlan } from "@/modules/subscriptions/plans";
import { NOTIFICATION_LIMITS, announcementKey, parseAnnouncement, planEndingDue, planEndingNotice, type Notice, type NotificationItem } from "./rules";

const DAY_MS = 864e5;
type NotificationDb = Pick<ReturnType<typeof getDb>, "notification">;

/**
 * Puts one notice in a student's inbox. Pass the transaction client to write it with the event it reports.
 * A notice with a `dedupeKey` the student already has is skipped, so a repeated request never adds a second one.
 */
export async function notify(db: NotificationDb, userId: string, notice: Notice, createdAt?: Date) {
  await db.notification.createMany({ data: [{ userId, ...notice, ...(createdAt ? { createdAt } : {}) }], skipDuplicates: true });
}

/** Unread notices already in the inbox; the shell's first badge. Announcements and plan reminders join on the first inbox read. */
export function unreadNotifications(userId: string) {
  return getDb().notification.count({ where: { userId, readAt: null } });
}

// Notices that no request creates: a plan in its last days, and announcements sent since the student's
// last read of the inbox. Both are keyed, so reading the inbox twice (or in two tabs) adds them once.
async function syncInbox(userId: string, now: Date) {
  const db = getDb();
  const [user, plans] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { createdAt: true } }),
    db.subscription.findMany({ where: { userId, startsAt: { lte: now }, endsAt: { gt: now, lte: new Date(now.getTime() + NOTIFICATION_LIMITS.planEndingDays * DAY_MS) } }, select: { program: true, endsAt: true } }),
  ]);
  if (!user) return;
  // An account never receives announcements sent before it was created.
  const since = new Date(Math.max(user.createdAt.getTime(), now.getTime() - NOTIFICATION_LIMITS.announcementDays * DAY_MS));
  const announcements = await db.announcement.findMany({ where: { createdAt: { gt: since } }, orderBy: { createdAt: "desc" }, take: NOTIFICATION_LIMITS.list, select: { id: true, title: true, body: true, href: true, createdAt: true } });
  const due: (Notice & { createdAt?: Date })[] = [
    ...plans.filter(plan => planEndingDue(plan.endsAt.getTime(), now.getTime())).map(plan => planEndingNotice(plan.program, findAnyPlan(plan.program)?.title ?? plan.program, plan.endsAt, Boolean(findSubscriptionPlan(plan.program)))),
    ...announcements.map(row => ({ kind: "announcement" as const, title: row.title, body: row.body, href: row.href, dedupeKey: announcementKey(row.id), createdAt: row.createdAt })),
  ];
  if (due.length) {
    const have = new Set((await db.notification.findMany({ where: { userId, dedupeKey: { in: due.map(notice => notice.dedupeKey!) } }, select: { dedupeKey: true } })).map(row => row.dedupeKey));
    const missing = due.filter(notice => !have.has(notice.dedupeKey));
    if (missing.length) await db.notification.createMany({ data: missing.map(notice => ({ userId, ...notice })), skipDuplicates: true });
  }
  await db.notification.deleteMany({ where: { userId, createdAt: { lt: new Date(now.getTime() - NOTIFICATION_LIMITS.keepDays * DAY_MS) } } });
}

/** The student's own inbox, newest first, with the unread count. */
export async function listNotifications(userId: string, now = new Date()): Promise<{ items: NotificationItem[]; unread: number }> {
  await syncInbox(userId, now);
  const db = getDb();
  const [rows, unread] = await Promise.all([
    db.notification.findMany({ where: { userId }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: NOTIFICATION_LIMITS.list, select: { id: true, kind: true, title: true, body: true, href: true, readAt: true, createdAt: true } }),
    db.notification.count({ where: { userId, readAt: null } }),
  ]);
  return { items: rows.map(row => ({ id: row.id, kind: row.kind, title: row.title, body: row.body, href: row.href, read: Boolean(row.readAt), createdAt: row.createdAt.toISOString() })), unread };
}

/** Marks the student's own notices read: the named ones, or all of them. Returns what is still unread. */
export async function markNotificationsRead(userId: string, ids: string[] | "all") {
  const db = getDb();
  await db.notification.updateMany({ where: { userId, readAt: null, ...(ids === "all" ? {} : { id: { in: ids } }) }, data: { readAt: new Date() } });
  return { unread: await db.notification.count({ where: { userId, readAt: null } }) };
}

/**
 * An admin's message: to every member (one Announcement row, copied into each inbox when it is next read) or to
 * one member by email (written to that inbox at once). Audited either way.
 */
export async function sendAnnouncement(actorId: string, input: unknown) {
  const parsed = parseAnnouncement(input);
  if (!parsed.ok) throw new ApiError(400, parsed.error);
  const { title, body, href, email } = parsed.value;
  return getDb().$transaction(async tx => {
    await assertAdminIn(tx, actorId);
    if (email) {
      const member = await tx.user.findUnique({ where: { email }, select: { id: true } });
      if (!member) throw new ApiError(404, "Ийм имэйлтэй хэрэглэгч олдсонгүй.");
      await notify(tx, member.id, { kind: "announcement", title, body, href, dedupeKey: null });
      await tx.adminAudit.create({ data: { actorId, action: "announce", target: member.id, reason: title, details: { audience: "member", body, href } } });
      return { ok: true, audience: "member" as const };
    }
    const row = await tx.announcement.create({ data: { title, body, href, authorId: actorId }, select: { id: true } });
    await tx.adminAudit.create({ data: { actorId, action: "announce", target: "all", reason: title, details: { audience: "all", announcement: row.id, body, href } } });
    return { ok: true, audience: "all" as const };
  });
}

/** Takes back an announcement to every member: it leaves every inbox it reached and reaches no more. */
export async function withdrawAnnouncement(actorId: string, id: unknown) {
  if (typeof id !== "string" || !id || id.length > 40) throw new ApiError(400, "Мэдэгдэл буруу.");
  return getDb().$transaction(async tx => {
    await assertAdminIn(tx, actorId);
    const row = await tx.announcement.findUnique({ where: { id }, select: { title: true } });
    if (!row) throw new ApiError(404, "Мэдэгдэл олдсонгүй.");
    await tx.announcement.delete({ where: { id } });
    const removed = await tx.notification.deleteMany({ where: { dedupeKey: announcementKey(id) } });
    await tx.adminAudit.create({ data: { actorId, action: "withdraw-announcement", target: id, reason: row.title, details: { removedFromInboxes: removed.count } } });
    return { ok: true };
  });
}

// Membership is rechecked inside the same transaction as the privileged write, as in admin/service.ts.
async function assertAdminIn(tx: Pick<ReturnType<typeof getDb>, "adminMembership">, actorId: string) {
  const membership = await tx.adminMembership.findUnique({ where: { userId: actorId }, select: { userId: true, user: { select: { email: true } } } });
  if (!membership || (authFeatures(process.env).hostedDemo && isDemoEmail(membership.user.email))) throw new ApiError(403, "Админ эрх шаардлагатай.");
}
