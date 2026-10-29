"use client";

import { useEffect, useRef } from "react";

type HomeAtmosphereVariant = "orbit";

export function HomeAtmosphere({ variant = "orbit" }: { variant?: HomeAtmosphereVariant }) {
  const layer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = layer.current;
    if (!node) return;
    const target: HTMLDivElement = node;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    let frame = 0;
    let pointerX = 34;
    let pointerY = 18;

    function paint() {
      frame = 0;
      target.style.setProperty("--mx", `${pointerX}%`);
      target.style.setProperty("--my", `${pointerY}%`);
    }

    function onMove(event: PointerEvent) {
      if (reduced.matches || !fine.matches) return;
      if (window.scrollY > 900) return;
      const rect = target.getBoundingClientRect();
      pointerX = Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100));
      pointerY = Math.min(100, Math.max(0, ((event.clientY - rect.top) / rect.height) * 100));
      if (!frame) frame = requestAnimationFrame(paint);
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return <div ref={layer} className="home-atmosphere" data-variant={variant} aria-hidden="true">
    <div className="home-atmosphere-grain" />
    <div className="home-atmosphere-vignette" />
    <div className="home-atmosphere-aura aura-hero" />
    <div className="home-atmosphere-aura aura-mid" />
    <div className="home-atmosphere-aura aura-low" />
    <div className="home-atmosphere-aura aura-footer" />
    <div className="home-atmosphere-spotlight" />
    <div className="home-atmosphere-grid-bottom" />
    <div className="home-orbit">
      <span className="orbit-ring ring-one" />
      <span className="orbit-ring ring-two" />
      <span className="orbit-glyph glyph-sum">∑</span>
      <span className="orbit-glyph glyph-aa">Aa</span>
      <span className="orbit-glyph glyph-pi">π</span>
      <span className="orbit-glyph glyph-pen">✎</span>
    </div>
    <div className="home-orbit home-orbit-bottom">
      <span className="orbit-ring ring-one" />
      <span className="orbit-ring ring-two" />
      <span className="orbit-glyph glyph-sum">∑</span>
      <span className="orbit-glyph glyph-aa">Aa</span>
      <span className="orbit-glyph glyph-pi">π</span>
      <span className="orbit-glyph glyph-pen">✎</span>
    </div>
    <div className="home-floaters">
      <span className="floater floater-a">A</span>
      <span className="floater floater-b">B</span>
      <span className="floater floater-c">C</span>
      <span className="floater floater-d">D</span>
      <span className="floater floater-integral">∫</span>
      <span className="floater floater-curve">∿</span>
    </div>
  </div>;
}
