"use client";

import { useEffect, useRef } from "react";

/** A silent product loop, with still posters for reduced motion and unavailable autoplay. */
export function HomeDemoVideo({ id }: { id: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    function syncPlayback() {
      if (!video) return;
      const play = visible && !motion.matches && !document.hidden;
      video.autoplay = play;
      if (play) void video.play().catch(() => { /* The poster remains if the browser refuses autoplay. */ });
      else video.pause();
    }
    const observer = new IntersectionObserver(entries => {
      visible = entries[0]?.isIntersecting ?? false;
      syncPlayback();
    }, { threshold: .1 });
    observer.observe(video);
    motion.addEventListener("change", syncPlayback);
    document.addEventListener("visibilitychange", syncPlayback);
    syncPlayback();
    return () => {
      observer.disconnect();
      motion.removeEventListener("change", syncPlayback);
      document.removeEventListener("visibilitychange", syncPlayback);
      video.pause();
    };
  }, []);

  return <video ref={ref} autoPlay loop muted playsInline controls={false} disablePictureInPicture disableRemotePlayback preload="metadata" poster={"/home/" + id + ".webp"} aria-labelledby={id + "-heading"} aria-describedby={id + "-description"} tabIndex={-1} width={1440} height={900}>
    <source src={"/home/" + id + ".mp4"} type="video/mp4" />
    Таны браузер видео дэмжихгүй. Доорх холбоосоор сайтыг нээгээрэй.
  </video>;
}
