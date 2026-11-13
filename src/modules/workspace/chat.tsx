"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Composer, emptyComposer, type ComposerState } from "./composer";
import { Markdown } from "./markdown";
import { Icon } from "./icons";
import { fetchThread, loadThreads, movedThread, rememberThread, removeThread, seedThreads, takePendingPrompt, threadsNow, useThreads } from "./chat-store";
import { imageOnlyPrompts, modeLabels, subjectLabels, threadTitle, type ChatMode, type ChatSubject } from "./chat-contract";
import { keepMessages, readChatReply, type ChatReply, type ChatThreadSummary, type ChatThreadView, type StoredTurn } from "./chat-storage";
import { useCredits } from "@/modules/credits/client";
import { SentImages, type AttachedImage } from "@/modules/ai-images/client";

type Options = { mode: ChatMode; subject: ChatSubject; language: "mn" | "en" };
/**
 * The message on its way. The server saves it, with its answer, only once the answer has arrived, so until then
 * it lives on this page: shown in the thread, and kept with its full pictures for "Дахин илгээх" after a failure.
 */
type Draft = { threadId: string | null; text: string; images: AttachedImage[]; options: Options; failed: boolean };
/** A request the server answered with a refusal, as opposed to a lost connection after which it may have saved the turn. */
class Refused extends Error {}

const suggestions: { mode: ChatMode; subject: ChatSubject; title: string; text: string }[] = [
  { mode: "solve", subject: "eesh-math", title: "Тэгшитгэл бодох", text: "x² − 5x + 6 = 0 тэгшитгэлийг бодоод, Виетийн теоремоор шалга." },
  { mode: "explain", subject: "ielts", title: "TRUE / FALSE / NOT GIVEN", text: "IELTS Reading-ийн FALSE ба NOT GIVEN хоёрыг хэрхэн ялгах вэ? Жишээгээр тайлбарла." },
  { mode: "quiz", subject: "sat", title: "SAT дасгал", text: "SAT Reading & Writing-ийн transitions сэдвээр 4 дасгал асуулт үүсгэ." },
  { mode: "explain", subject: "jlpt", title: "は ба が", text: "JLPT N5: は ба が хоёрын ялгааг энгийн жишээгээр тайлбарла." },
];

/** The fuller of two copies of a thread: the page's own after a send, or a newer read from the server. */
const newer = (known: ChatThreadView | undefined, fresh: ChatThreadView) => known && known.next > fresh.next ? known : fresh;
const summaryOf = ({ id, title, subject, mode, language, updatedAt }: ChatThreadSummary): ChatThreadSummary => ({ id, title, subject, mode, language, updatedAt });
/** The message stored at a position; a thread's kept messages are the last ones before `next`. */
const turnAt = (thread: ChatThreadView, position: number) => thread.turns[thread.turns.length - (thread.next - position)];
const chatUrl = (id: string | null) => id ? "/workspace/chat?thread=" + encodeURIComponent(id) : "/workspace/chat";

export function WorkspaceChat({ userKey, firstName, threads: listed, initial }: { userKey: string; firstName: string; threads: ChatThreadSummary[] | null; initial: ChatThreadView | null }) {
  const threads = useThreads(userKey);
  const param = useSearchParams().get("thread");
  const [threadId, setThreadId] = useState<string | null>(param);
  const [opened, setOpened] = useState<Partial<Record<string, ChatThreadView>>>(() => initial ? { [initial.id]: initial } : {});
  const [unreadable, setUnreadable] = useState<Partial<Record<string, "missing" | "error">>>({});
  const [draft, setDraft] = useState<Draft | null>(null);
  const [composer, setComposer] = useState<ComposerState>(emptyComposer);
  const [error, setError] = useState("");
  const busy = useRef(false);
  // The thread on screen, for replies that arrive after the student has moved on.
  const view = useRef(threadId);
  const { apply } = useCredits();
  const end = useRef<HTMLDivElement>(null);
  const thread = threadId ? opened[threadId] ?? null : null;
  const status = !threadId ? null : thread ? "ready" : unreadable[threadId] ?? "loading";
  const pending = Boolean(draft && !draft.failed);

  // A sidebar link reads the thread again on the server; that copy replaces an older one kept on this page.
  const [seen, setSeen] = useState(initial);
  if (seen !== initial) {
    setSeen(initial);
    if (initial) setOpened(all => ({ ...all, [initial.id]: newer(all[initial.id], initial) }));
  }
  // Follow the URL: a sidebar link opens that thread, the AI tab starts a new one.
  const [lastParam, setLastParam] = useState(param);
  if (param !== lastParam) {
    setLastParam(param);
    if (param !== threadId) { setThreadId(param); setError(""); }
  }
  // Opening a saved thread restores its subject, mode and language.
  const [restored, setRestored] = useState<string | null>(null);
  if (thread && restored !== thread.id) {
    setRestored(thread.id);
    setComposer(current => ({ ...current, mode: thread.mode, subject: thread.subject, language: thread.language }));
  }

  useEffect(() => { view.current = threadId; }, [threadId]);
  useEffect(() => { if (listed) seedThreads(userKey, listed); }, [userKey, listed]);

  // A thread the server did not render with the page (the URL changed on the page) is read from the account.
  useEffect(() => {
    if (!threadId || status !== "loading") return;
    let cancelled = false;
    void (async () => {
      const read = await fetchThread(threadId);
      if (cancelled) return;
      if (read.kind === "ok") { setOpened(all => ({ ...all, [threadId]: newer(all[threadId], read.thread) })); return; }
      if (read.kind === "missing") {
        // An old link to a thread this browser kept before chats moved to the account opens its moved copy.
        await loadThreads(userKey);
        const moved = movedThread(userKey, threadId);
        if (cancelled) return;
        if (moved) {
          setThreadId(moved); setLastParam(moved);
          window.history.replaceState(null, "", chatUrl(moved));
          return;
        }
      }
      setUnreadable(all => ({ ...all, [threadId]: read.kind === "missing" ? "missing" : "error" }));
    })();
    return () => { cancelled = true; };
  }, [threadId, status, userKey]);

  const draftHere = draft && draft.threadId === threadId ? draft : null;
  const turns = thread?.turns ?? [];
  useEffect(() => { end.current?.scrollIntoView({ block: "end", behavior: "smooth" }); }, [turns.length, pending, draftHere?.failed, threadId]);

  function open(id: string) {
    setThreadId(id); setRestored(id); setLastParam(id);
    window.history.replaceState(null, "", chatUrl(id));
  }

  /** A saved turn added to the page's copy when nothing else was saved in between; otherwise the thread is read again. */
  async function saved(reply: ChatReply, base: ChatThreadView | undefined, after: number): Promise<ChatThreadView> {
    const appended: ChatThreadView = { ...reply.thread, turns: keepMessages([...(base?.turns ?? []), ...reply.turns]) };
    if (reply.thread.next - reply.turns.length === after) return appended;
    const read = await fetchThread(reply.thread.id);
    return read.kind === "ok" ? read.thread : appended;
  }

  /**
   * After a lost connection the server may have answered and saved the turn anyway. If the account now holds this
   * exact question with an answer where it was meant to go, show it instead of asking the student to send it again.
   */
  async function recover(target: string | null, after: number, text: string, before: Set<string>) {
    let id = target;
    if (!id) {
      await loadThreads(userKey, true);
      id = threadsNow(userKey).find(item => !before.has(item.id) && item.title === threadTitle(text))?.id ?? null;
    }
    const read = id ? await fetchThread(id) : null;
    if (read?.kind !== "ok") return;
    const asked = turnAt(read.thread, after), answer = turnAt(read.thread, after + 1);
    if (asked?.role !== "user" || asked.content !== text || answer?.role !== "assistant") return;
    setOpened(all => ({ ...all, [read.thread.id]: newer(all[read.thread.id], read.thread) }));
    rememberThread(userKey, summaryOf(read.thread));
    setDraft(current => current && current.failed && current.threadId === target && current.text === text ? null : current);
    setError("");
    if (!target && view.current === null) open(read.thread.id);
  }

  async function send(message: string, options: Options, images: AttachedImage[] = [], retry = false) {
    const typed = message.trim();
    if (busy.current || (!typed && !images.length)) return;
    const base = threadId ? opened[threadId] : undefined;
    if (threadId && !base) return;
    // A picture sent without words still reads as a request in the thread and to the model.
    const text = typed || imageOnlyPrompts[options.mode];
    // The server reads the earlier turns itself; the page names the thread and how far it has read it.
    const target = base?.id ?? null, after = base?.next ?? 0;
    const before = new Set(threads.map(item => item.id));
    busy.current = true; setError("");
    setDraft({ threadId: target, text, images, options, failed: false });
    setComposer(current => ({ ...current, ...options, text: retry ? current.text : "", images: retry ? current.images : [] }));
    try {
      const body = { ...options, message: text, threadId: target, after, ...(images.length ? { images: images.map(image => image.url), previews: images.map(image => image.thumb) } : {}) };
      const response = await fetch("/api/workspace/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(80000) });
      const data = await response.json().catch(() => ({})) as { error?: string };
      if (response.status === 401) throw new Refused("Нэвтрэх хугацаа дууссан. Дахин нэвтэрнэ үү.");
      const reply = response.ok ? readChatReply(data) : null;
      if (!reply) throw new Refused(data.error || "AI хариу ирсэнгүй. Дахин оролдоно уу.");
      apply(data);
      const fresh = await saved(reply, base, after);
      setOpened(all => ({ ...all, [fresh.id]: newer(all[fresh.id], fresh) }));
      rememberThread(userKey, summaryOf(reply.thread));
      setDraft(null);
      // A new thread opens where it was started, unless the student has moved to another one meanwhile.
      if (!base && view.current === null) open(fresh.id);
    } catch (reason) {
      setDraft(current => current && { ...current, failed: true });
      setError(reason instanceof Refused ? reason.message
        : reason instanceof Error && reason.name === "TimeoutError" ? "Хариу удаж байна. Түр хүлээгээд дахин оролдоно уу." : "Холболт тасарлаа. Дахин оролдоно уу.");
      if (!(reason instanceof Refused)) void recover(target, after, text, before);
    } finally { busy.current = false; }
  }
  const submit = () => void send(composer.text, { mode: composer.mode, subject: composer.subject, language: composer.language }, composer.images);
  // Nothing of a failed message was saved, so sending it again cannot double it.
  const retryDraft = () => { if (draft?.failed) void send(draft.text, draft.options, draft.images, true); };

  // A first message typed on the Workspace home arrives here once.
  const sendRef = useRef(send);
  useEffect(() => { sendRef.current = send; });
  useEffect(() => {
    if (param) return;
    const pendingPrompt = takePendingPrompt();
    if (!pendingPrompt) return;
    const { text, images, ...options } = pendingPrompt;
    void sendRef.current(text, options, images ?? []);
  }, [param]);

  function startNew() {
    if (pending) return;
    setThreadId(null); setLastParam(null); setRestored(null); setError(""); setDraft(null);
    setComposer(current => ({ ...current, text: "", images: [] }));
    window.history.replaceState(null, "", chatUrl(null));
  }
  async function remove() {
    if (!thread || pending || !window.confirm("Энэ чатыг устгах уу? Буцаах боломжгүй.")) return;
    const id = thread.id;
    try {
      await removeThread(userKey, id);
      setOpened(all => { const rest = { ...all }; delete rest[id]; return rest; });
      startNew();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Чатыг устгаж чадсангүй. Дахин оролдоно уу."); }
  }
  function readAgain() {
    if (threadId) setUnreadable(all => { const rest = { ...all }; delete rest[threadId]; return rest; });
  }

  if (threadId && !thread) return <div className="wsp-page wsp-chat-start">
    {status === "loading" ? <p className="wsp-muted" role="status">Чатыг ачаалж байна…</p>
      : <div className="wsp-empty" role="alert">
        <p>{status === "missing" ? "Чат олдсонгүй" : "Чатыг ачаалж чадсангүй"}</p>
        <h3>{status === "missing" ? "Энэ чат устгагдсан эсвэл өөр бүртгэлд хадгалагдсан байна." : "Холболтоо шалгаад дахин оролдоно уу."}</h3>
        <div className="wsp-chat-actions">
          {status === "error" ? <button type="button" className="wsp-ghost" onClick={readAgain}>Дахин оролдох</button> : null}
          <button type="button" className="wsp-ghost" onClick={startNew}><Icon name="plus" size={18} />Шинэ чат</button>
        </div>
      </div>}
  </div>;

  if (!thread && !draftHere) return <div className="wsp-page wsp-chat-start">
    <header className="wsp-hero"><p className="wsp-hello"><Icon name="spark" size={18} />AI туслах</p><h1>{firstName}, юуг хамт ойлгох вэ?</h1></header>
    <Composer state={composer} onChange={setComposer} onSubmit={submit} pending={pending} autoFocus />
    {error ? <p className="wsp-error" role="alert">{error}</p> : null}
    <p className="wsp-fine">Таны мессеж, хавсаргасан зураг AI руу илгээгдэнэ. Нэр, утас, нүүр царай зэрэг хувийн мэдээлэл бүү оруулаарай. Чат таны бүртгэлд хадгалагдаж, бусад төхөөрөмж дээр ч харагдана; зургийн зөвхөн жижиг хувилбар үлдэнэ. Хугацаатай шалгалтын үеэр AI хаалттай.</p>
    <section className="wsp-section" aria-labelledby="chat-ideas"><div className="wsp-section-head"><h2 id="chat-ideas">Эхлэх санаа</h2></div>
      <div className="wsp-suggestions">{suggestions.map(item => <button key={item.title} type="button" className="wsp-suggestion" disabled={pending} onClick={() => void send(item.text, { mode: item.mode, subject: item.subject, language: composer.language })}>
        <span className="wsp-tag tone-blue">{subjectLabels[item.subject]}</span><strong>{item.title}</strong><span>{item.text}</span>
      </button>)}</div>
    </section>
  </div>;

  // A new thread's first message shows under its future title until the server saves it with the answer.
  const head = thread ?? (draftHere ? { title: threadTitle(draftHere.text), subject: draftHere.options.subject, mode: draftHere.options.mode } : null);
  if (!head) return null;
  const sending = Boolean(draftHere && !draftHere.failed);
  return <div className="wsp-chat">
    <header className="wsp-chat-head">
      <div><h1>{head.title}</h1><p><span className="wsp-tag">{subjectLabels[head.subject]}</span><span className="wsp-tag">{modeLabels[head.mode].label}</span></p></div>
      <div className="wsp-chat-actions">
        <button type="button" className="wsp-ghost" onClick={startNew} disabled={pending}><Icon name="plus" size={18} />Шинэ чат</button>
        {thread ? <button type="button" className="wsp-icon-button" onClick={() => void remove()} disabled={pending} aria-label="Чат устгах" title="Чат устгах"><Icon name="trash" size={18} /></button> : null}
      </div>
    </header>
    <div className="wsp-messages" role="log" aria-label="AI туслахтай ярилцсан түүх" aria-live="polite">
      {turns.map((turn, index) => <Message key={index} turn={turn} />)}
      {draftHere ? <Message key="draft" turn={{ role: "user", content: draftHere.text, ...(draftHere.images.length ? { images: draftHere.images.map(image => image.thumb) } : {}) }} /> : null}
      {sending ? <div className="wsp-msg assistant"><span className="wsp-msg-avatar" aria-hidden="true"><Icon name="spark" size={16} /></span><div className="wsp-typing" role="status" aria-label="AI бичиж байна"><i /><i /><i /></div></div> : null}
      {error ? <div className="wsp-error" role="alert"><p>{error}</p>{draftHere?.failed ? <button type="button" className="wsp-ghost" onClick={retryDraft}>Дахин илгээх</button> : null}</div> : null}
      <div ref={end} />
    </div>
    <div className="wsp-dock">
      <Composer state={composer} onChange={setComposer} onSubmit={submit} pending={pending} docked autoFocus />
      <p className="wsp-fine">Таны бүртгэлд хадгалагдана · Албан ёсны оноо биш</p>
    </div>
  </div>;
}

export function Message({ turn }: { turn: StoredTurn }) {
  const [copied, setCopied] = useState(false);
  if (turn.role === "user") return <div className={"wsp-msg user" + (turn.images?.length ? " has-images" : "")}><SentImages urls={turn.images} /><div className="wsp-bubble"><p>{turn.content}</p></div></div>;
  async function copy() {
    try { await navigator.clipboard.writeText(turn.content); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* Clipboard can be blocked; nothing to undo. */ }
  }
  return <div className="wsp-msg assistant">
    <span className="wsp-msg-avatar" aria-hidden="true"><Icon name="spark" size={16} /></span>
    <div className="wsp-answer"><Markdown text={turn.content} /><button type="button" className="wsp-copy" onClick={() => void copy()}>{copied ? "Хуулсан ✓" : "Хуулах"}</button></div>
  </div>;
}
