"use client";

export function ThemeToggle() {
  function toggle() {
    const theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("education-theme", theme); } catch { /* Keep the current page usable when storage is unavailable. */ }
  }

  return <button type="button" className="theme-toggle" onClick={toggle} aria-label="Гэрэлтэй / бараан горим солих" title="Гэрэлтэй / бараан горим солих">
    <svg className="theme-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M20.8 13.1A9 9 0 0 1 10.9 3.2 9 9 0 1 0 20.8 13.1Z" /></svg>
    <svg className="theme-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></svg>
    <span className="sr-only theme-moon">Бараан горимд шилжих</span><span className="sr-only theme-sun">Гэрэлтэй горимд шилжих</span>
  </button>;
}
