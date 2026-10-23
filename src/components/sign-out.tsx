"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
export function SignOut() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function signOut() {
    setPending(true); setError("");
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error("signout");
      router.push("/login"); router.refresh();
    } catch { setError("Гарч чадсангүй. Дахин оролдоно уу."); }
    finally { setPending(false); }
  }
  return <div><button className="button secondary small" onClick={signOut} disabled={pending}>{pending ? "Түр хүлээнэ үү…" : "Гарах"}</button>{error ? <p role="alert" className="error-message">{error}</p> : null}</div>;
}

