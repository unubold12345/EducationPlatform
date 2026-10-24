"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function ConnectGoogle({ linked }: { linked: boolean }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function connect() {
    if (pending) return;
    setPending(true); setError("");
    try {
      const result = await authClient.linkSocial({ provider: "google", callbackURL: "/profile", errorCallbackURL: "/profile" });
      if (!result.error) return;
      setError("Google холбож чадсангүй. Дахин оролдоно уу.");
    } catch { setError("Холболт тасарлаа. Дахин оролдоно уу."); }
    setPending(false);
  }
  return <div className="google-connection"><h3>Google-ээр нэвтрэх</h3><p>{linked ? "Google холбогдсон. Дараагийн удаа Google-ээр үргэлжлүүлж болно." : "Бүртгэлийнхээ имэйлтэй ижил, баталгаажсан Google хаягийг холбоорой. Хадгалсан ажил, шалгалтын эрх тань энэ бүртгэлдээ үлдэнэ."}</p>{!linked && <button className="button secondary" type="button" disabled={pending} onClick={connect}>{pending ? "Google рүү шилжиж байна…" : "Google холбох"}</button>}{error && <p className="error-message" role="alert">{error}</p>}</div>;
}
