import type { ReactNode, SVGProps } from "react";

// Line icons used only by the vocabulary page, on the Workspace's 24px grid.
const paths = {
  star: <path d="m12 3.8 2.5 5.2 5.7.8-4.1 4 1 5.7L12 16.8l-5.1 2.7 1-5.7-4.1-4 5.7-.8Z" />,
  folder: <path d="M3.5 7a2 2 0 0 1 2-2h3.6l2 2.3h7.4a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z" />,
  layers: <><path d="m12 3.5 8.5 4.5-8.5 4.5L3.5 8Z" /><path d="m3.5 12.2 8.5 4.5 8.5-4.5" /><path d="m3.5 16.2 8.5 4.5 8.5-4.5" /></>,
  list: <><path d="M8.5 6.5h11M8.5 12h11M8.5 17.5h11" /><path d="M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01" /></>,
  grid: <><rect x="4" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" /></>,
  upload: <><path d="M12 15.5V4.5" /><path d="m7.5 9 4.5-4.5L16.5 9" /><path d="M4.5 15.5v2a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-2" /></>,
  bulb: <><path d="M9 17.5h6" /><path d="M10 20.5h4" /><path d="M8.2 14.5a6 6 0 1 1 7.6 0c-.6.5-.8 1.2-.8 2H9c0-.8-.2-1.5-.8-2Z" /></>,
  target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><path d="M12 12h.01" /></>,
  keyboard: <><rect x="3" y="6.5" width="18" height="11" rx="2.2" /><path d="M7 10.5h.01M10.5 10.5h.01M14 10.5h.01M17.5 10.5h.01M8 14h8" /></>,
  flip: <><rect x="4" y="5" width="16" height="14" rx="2.5" /><path d="M12 5v14" /><path d="m8.5 10.5-2 1.5 2 1.5" /><path d="m15.5 10.5 2 1.5-2 1.5" /></>,
  scale: <><path d="M12 4v16" /><path d="M5 7.5h14" /><path d="m5 7.5-2 6a3 3 0 0 0 4 0Z" /><path d="m19 7.5-2 6a3 3 0 0 0 4 0Z" /><path d="M9 20h6" /></>,
  gap: <><path d="M4 8h16" /><path d="M4 16h4.5" /><path d="M15.5 16H20" /><rect x="9.5" y="13.5" width="5" height="5" rx="1.2" strokeDasharray="2 1.6" /></>,
  options: <><rect x="4" y="4.5" width="16" height="4" rx="1.4" /><rect x="4" y="10" width="16" height="4" rx="1.4" /><rect x="4" y="15.5" width="16" height="4" rx="1.4" /></>,
  move: <><path d="M3.5 7a2 2 0 0 1 2-2h3.6l2 2.3h7.4a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z" /><path d="M9 13h6" /><path d="m12.5 10.5 2.5 2.5-2.5 2.5" /></>,
  reset: <><path d="M4.5 12a7.5 7.5 0 1 1 2.2 5.3" /><path d="M4.5 18v-4h4" /></>,
} satisfies Record<string, ReactNode>;
export type GlyphName = keyof typeof paths;

export function Glyph({ name, size = 18, filled = false, ...rest }: { name: GlyphName; size?: number; filled?: boolean } & SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...rest}>{paths[name]}</svg>;
}
