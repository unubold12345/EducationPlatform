"use client";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
export function VerifyEmailButton({ email }: { email: string }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  async function send() {
    if (pending) return;
    setPending(true); setMessage("");
    try {
      const result = await authClient.sendVerificationEmail({ email, callbackURL: "/profile" });
      setMessage(result.error ? "Илгээж чадсангүй. Түр хүлээгээд дахин оролдоно уу." : "Ирсэн имэйл болон spam хавтсаа шалгаарай.");
    } catch { setMessage("Холболт тасарлаа. Дахин оролдоно уу."); }
    finally { setPending(false); }
  }
  return <div><button className="button secondary" type="button" disabled={pending} onClick={send}>{pending ? "Илгээж байна…" : "Имэйл баталгаажуулах"}</button>{message && <p role="status">{message}</p>}</div>;
}
