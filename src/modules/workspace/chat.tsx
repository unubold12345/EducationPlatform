"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Composer, emptyComposer, type ComposerState } from "./composer";
import { Markdown } from "./markdown";
import { Icon } from "./icons";
import { deleteThread, newThreadId, saveThread, takePendingPrompt, useThreads, type ChatThread, type StoredTurn } from "./chat-store";
import { CHAT_LIMITS, imageOnlyPrompts, modeLabels, subjectLabels, threadTitle, type ChatMode, type ChatSubject, type ChatTurn } from "./chat-contract";
import { useCredits } from "@/modules/credits/client";
import { SentImages, type AttachedImage } from "@/modules/ai-images/client";

const suggestions: { mode: ChatMode; subject: ChatSubject; title: string; text: string }[] = [
  { mode: "solve", subject: "eesh-math", title: "Тэгшитгэл бодох", text: "x² − 5x + 6 = 0 тэгшитгэлийг бодоод, Виетийн теоремоор шалга." },
  { mode: "explain", subject: "ielts", title: "TRUE / FALSE / NOT GIVEN", text: "IELTS Reading-ийн FALSE ба NOT GIVEN хоёрыг хэрхэн ялгах вэ? Жишээгээр тайлбарла." },
  { mode: "quiz", subject: "sat", title: "SAT дасгал", text: "SAT Reading & Writing-ийн transitions сэдвээр 4 дасгал асуулт үүсгэ." },
  { mode: "explain", subject: "jlpt", title: "は ба が", text: "JLPT N5: は ба が хоёрын ялгааг энгийн жишээгээр тайлбарла." },
];

export function WorkspaceChat({ userKey, firstName }: { userKey: string; firstName: string }) {
  const threads = useThreads(userKey);
  const param = useSearchParams().get("thread");
  const [threadId, setThreadId] = useState<string | null>(param);
  const [composer, setComposer] = useState<ComposerState>(emptyComposer);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);
  // The last message's full images, so "Дахин илгээх" can resend them; the thread itself keeps only previews.
  const lastImages = useRef<{ threadId: string; images: AttachedImage[] } | null>(null);
  const { apply } = useCredits();
  const end = useRef<HTMLDivElement>(null);
  const thread = threadId ? threads.find(item => item.id === threadId) ?? null : null;

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

  useEffect(() => { end.current?.scrollIntoView({ block: "end", behavior: "smooth" }); }, [thread?.turns.length, pending]);

  async function send(message: string, options: { mode: ChatMode; subject: ChatSubject; language: "mn" | "en" }, retry = false, images: AttachedImage[] = []) {
    const typed = message.trim();
    if (busy.current || (!typed && !images.length)) return;
    // A picture sent without words still reads as a request in the thread and to the model.
    const text = typed || imageOnlyPrompts[options.mode];
    busy.current = true; setPending(true); setError("");
    const id = threadId ?? newThreadId();
    const existing = threads.find(item => item.id === id);
    const before = retry && existing ? existing.turns.slice(0, -1) : existing?.turns ?? [];
    const prior: ChatTurn[] = before.slice(-CHAT_LIMITS.history).map(turn => ({ role: turn.role, content: turn.content.slice(0, CHAT_LIMITS.turn) }));
    const asked: StoredTurn = { role: "user", content: text, ...(images.length ? { images: images.map(image => image.thumb) } : {}) };
    const next: ChatThread = { id, title: existing?.title ?? threadTitle(text), ...options, updatedAt: Date.now(), turns: [...before, asked] };
    saveThread(userKey, next);
    lastImages.current = images.length ? { threadId: id, images } : null;
    if (!threadId) {
      setThreadId(id); setRestored(id); setLastParam(id);
      window.history.replaceState(null, "", "/workspace/chat?thread=" + encodeURIComponent(id));
    }
    setComposer(current => ({ ...current, ...options, text: retry ? current.text : "", images: retry ? current.images : [] }));
    try {
      const body = { ...options, message: text, history: prior, ...(images.length ? { images: images.map(image => image.url) } : {}) };
      const response = await fetch("/api/workspace/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(80000) });
      const data = await response.json().catch(() => ({})) as { message?: string; error?: string };
      if (response.status === 401) throw new Error("Нэвтрэх хугацаа дууссан. Дахин нэвтэрнэ үү.");
      if (!response.ok || !data.message) throw new Error(data.error || "AI хариу ирсэнгүй. Дахин оролдоно уу.");
      apply(data);
      saveThread(userKey, { ...next, updatedAt: Date.now(), turns: [...next.turns, { role: "assistant", content: data.message }] });
    } catch (reason) {
      setError(reason instanceof Error && reason.name !== "TimeoutError" ? reason.message : "Хариу удаж байна. Түр хүлээгээд дахин оролдоно уу.");
    } finally { busy.current = false; setPending(false); }
  }
  const submit = () => void send(composer.text, { mode: composer.mode, subject: composer.subject, language: composer.language }, false, composer.images);
  function retryLast(current: ChatThread) {
    const last = current.turns.at(-1);
    if (!last) return;
    const kept = lastImages.current?.threadId === current.id ? lastImages.current.images : [];
    // After a reload only previews remain, which are too small to read: ask for the picture again.
    if (last.images?.length && !kept.length) { setError("Зураг энэ хуудсанд хадгалагдаагүй байна. Зургаа дахин хавсаргаад илгээнэ үү."); return; }
    void send(last.content, { mode: current.mode, subject: current.subject, language: current.language }, true, kept);
  }

  // A first message typed on the Workspace home arrives here once.
  const sendRef = useRef(send);
  useEffect(() => { sendRef.current = send; });
  useEffect(() => {
    if (param) return;
    const pendingPrompt = takePendingPrompt();
    if (!pendingPrompt) return;
    const { text, images, ...options } = pendingPrompt;
    void sendRef.current(text, options, false, images ?? []);
  }, [param]);

  function startNew() {
    setThreadId(null); setLastParam(null); setRestored(null); setError("");
    setComposer(current => ({ ...current, text: "", images: [] }));
    window.history.replaceState(null, "", "/workspace/chat");
  }
  function remove() {
    if (!thread || !window.confirm("Энэ чатыг устгах уу? Буцаах боломжгүй.")) return;
    deleteThread(userKey, thread.id);
    startNew();
  }

  const turns = thread?.turns ?? [];
  const unanswered = turns.at(-1)?.role === "user" && !pending;
  if (!threadId || !thread) return <div className="wsp-page wsp-chat-start">
    <header className="wsp-hero"><p className="wsp-hello"><Icon name="spark" size={18} />AI туслах</p><h1>{firstName}, юуг хамт ойлгох вэ?</h1></header>
    <Composer state={composer} onChange={setComposer} onSubmit={submit} pending={pending} autoFocus />
    {error ? <p className="wsp-error" role="alert">{error}</p> : null}
    <p className="wsp-fine">Таны мессеж, хавсаргасан зураг AI руу илгээгдэнэ. Нэр, утас, нүүр царай зэрэг хувийн мэдээлэл бүү оруулаарай. Чат зөвхөн энэ хөтөчид хадгалагдана. Хугацаатай шалгалтын үеэр AI хаалттай.</p>
    <section className="wsp-section" aria-labelledby="chat-ideas"><div className="wsp-section-head"><h2 id="chat-ideas">Эхлэх санаа</h2></div>
      <div className="wsp-suggestions">{suggestions.map(item => <button key={item.title} type="button" className="wsp-suggestion" disabled={pending} onClick={() => void send(item.text, { mode: item.mode, subject: item.subject, language: composer.language })}>
        <span className="wsp-tag tone-blue">{subjectLabels[item.subject]}</span><strong>{item.title}</strong><span>{item.text}</span>
      </button>)}</div>
    </section>
  </div>;

  return <div className="wsp-chat">
    <header className="wsp-chat-head">
      <div><h1>{thread.title}</h1><p><span className="wsp-tag">{subjectLabels[thread.subject]}</span><span className="wsp-tag">{modeLabels[thread.mode].label}</span></p></div>
      <div className="wsp-chat-actions">
        <button type="button" className="wsp-ghost" onClick={startNew}><Icon name="plus" size={18} />Шинэ чат</button>
        <button type="button" className="wsp-icon-button" onClick={remove} aria-label="Чат устгах" title="Чат устгах"><Icon name="trash" size={18} /></button>
      </div>
    </header>
    <div className="wsp-messages" role="log" aria-label="AI туслахтай ярилцсан түүх" aria-live="polite">
      {turns.map((turn, index) => <Message key={index} turn={turn} />)}
      {pending ? <div className="wsp-msg assistant"><span className="wsp-msg-avatar" aria-hidden="true"><Icon name="spark" size={16} /></span><div className="wsp-typing" role="status" aria-label="AI бичиж байна"><i /><i /><i /></div></div> : null}
      {error ? <div className="wsp-error" role="alert"><p>{error}</p>{unanswered ? <button type="button" className="wsp-ghost" onClick={() => retryLast(thread)}>Дахин илгээх</button> : null}</div> : null}
      <div ref={end} />
    </div>
    <div className="wsp-dock">
      <Composer state={composer} onChange={setComposer} onSubmit={submit} pending={pending} docked autoFocus />
      <p className="wsp-fine">Зөвхөн энэ хөтөчид хадгалагдана · Албан ёсны оноо биш</p>
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
