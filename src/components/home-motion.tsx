"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function HomeMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches || !root.current || !("IntersectionObserver" in window)) return;
    const animations = new Set<Animation>();
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        const animation = entry.target.animate(
          [{ opacity: 0, transform: "translateY(24px)" }, { opacity: 1, transform: "translateY(0)" }],
          { duration: 650, easing: "cubic-bezier(.22,1,.36,1)" },
        );
        animations.add(animation);
        void animation.finished.then(() => animations.delete(animation)).catch(() => {});
      }
    }, { threshold: 0.08 });
    root.current.querySelectorAll("[data-reveal]").forEach(element => observer.observe(element));
    function stopMotion() {
      if (!media.matches) return;
      observer.disconnect();
      animations.forEach(animation => animation.cancel());
      animations.clear();
    }
    media.addEventListener("change", stopMotion);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", stopMotion);
      animations.forEach(animation => animation.cancel());
    };
  }, []);
  return <div ref={root} className="container home-page">{children}</div>;
}
