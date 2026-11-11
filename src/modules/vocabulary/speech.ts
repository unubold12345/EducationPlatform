"use client";
import { useCallback, useEffect, useState } from "react";

// Reading a word aloud with the browser's own voices. Nothing is sent anywhere; when the browser has no
// voice for a language, the page simply offers no listening for it.
const supported = () => typeof window !== "undefined" && "speechSynthesis" in window && typeof window.SpeechSynthesisUtterance === "function";
const prefix = (lang: string) => lang.toLowerCase().split("-")[0];

export function speak(text: string, lang: string) {
  if (!supported()) return;
  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.92;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  } catch { /* A browser that refuses speech keeps working without it. */ }
}

export function stopSpeaking() {
  if (!supported()) return;
  try { window.speechSynthesis.cancel(); } catch { /* Nothing to stop. */ }
}

/** Language prefixes ("en", "ja") the browser can speak; voices often load a moment after the page. */
export function useVoices() {
  const [languages, setLanguages] = useState<readonly string[]>([]);
  useEffect(() => {
    if (!supported()) return;
    const read = () => setLanguages([...new Set(window.speechSynthesis.getVoices().map(voice => prefix(voice.lang)))]);
    const timer = setTimeout(read, 0);
    window.speechSynthesis.addEventListener?.("voiceschanged", read);
    return () => { clearTimeout(timer); window.speechSynthesis.removeEventListener?.("voiceschanged", read); };
  }, []);
  const canSpeak = useCallback((lang: string) => languages.includes(prefix(lang)), [languages]);
  return { canSpeak, any: languages.length > 0 };
}
