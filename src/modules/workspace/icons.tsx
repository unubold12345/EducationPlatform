import type { ReactNode, SVGProps } from "react";

// Line icons for the Workspace, drawn for this site on a 24px grid.
const paths = {
  home: <><path d="M4 10.5 12 4l8 6.5" /><path d="M6 9v10.5h4.5V14h3v5.5H18V9" /></>,
  spark: <><path d="M12 3.5c.4 3.6 1.9 5.1 5.5 5.5-3.6.4-5.1 1.9-5.5 5.5-.4-3.6-1.9-5.1-5.5-5.5 3.6-.4 5.1-1.9 5.5-5.5Z" /><path d="M18 14.5c.2 1.7.8 2.3 2.5 2.5-1.7.2-2.3.8-2.5 2.5-.2-1.7-.8-2.3-2.5-2.5 1.7-.2 2.3-.8 2.5-2.5Z" /></>,
  exam: <><rect x="5" y="3.5" width="14" height="17" rx="2.5" /><path d="M8.5 8h7M8.5 12h7M8.5 16h4" /></>,
  fileExam: <><path d="M6 3.5h7.5L18 8v12a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 5 20V5a1.5 1.5 0 0 1 1-1.5Z" /><path d="M13.5 3.5V8H18" /><path d="m8.5 14.5 2 2 4-4" /></>,
  flag: <><path d="M6 21V4" /><path d="M6 4.5h11l-1.9 4 1.9 4H6" /></>,
  review: <><path d="M4.5 19.5h15" /><path d="M7 16v-4M12 16V8M17 16v-6" /><path d="m5.5 8.5 4-3 3.5 2 5.5-3.5" /></>,
  workshop: <><path d="M5 13v-1a7 7 0 0 1 14 0v1" /><rect x="3.5" y="13" width="4" height="6.5" rx="1.6" /><rect x="16.5" y="13" width="4" height="6.5" rx="1.6" /></>,
  plans: <><path d="M3.5 12.2V5.5a2 2 0 0 1 2-2h6.7l8.3 8.3-8.7 8.7Z" /><circle cx="8.3" cy="8.3" r="1.4" /></>,
  profile: <><circle cx="12" cy="8.5" r="3.6" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
  site: <><path d="M14 5h5v5" /><path d="M19 5 11 13" /><path d="M17 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 4 18.5v-10A1.5 1.5 0 0 1 5.5 7H10" /></>,
  rail: <><rect x="3.5" y="4.5" width="17" height="15" rx="3" /><path d="M9.5 4.5v15" /></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  close: <><path d="M6 6l12 12M18 6 6 18" /></>,
  logout: <><path d="M10 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H10" /><path d="m15 8 4 4-4 4" /><path d="M19 12H9.5" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  send: <><path d="M12 19V5" /><path d="m6 11 6-6 6 6" /></>,
  chevron: <><path d="m7 10 5 5 5-5" /></>,
  arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
  back: <><path d="M19 12H5" /><path d="m11 6-6 6 6 6" /></>,
  trash: <><path d="M4.5 7h15" /><path d="M9.5 7V4.5h5V7" /><path d="M6.5 7l1 12.5h9l1-12.5" /></>,
  chat: <><path d="M5 18.5V6.5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2V14a2 2 0 0 1-2 2H8.5Z" /></>,
  check: <><path d="m5 12.5 4.5 4.5L19 7.5" /></>,
  clock: <><circle cx="12" cy="12" r="8" /><path d="M12 7.5V12l3 2" /></>,
  flame: <><path d="M12 20.5c3.6 0 6-2.4 6-5.8 0-3.5-2.6-5.4-3.6-8.7-1.5 1.3-2 2.8-2.1 4.2-1.2-1-1.6-2.5-1.6-4.2C7.9 8 6 10.7 6 14.7c0 3.4 2.4 5.8 6 5.8Z" /></>,
  pen: <><path d="M4.5 19.5 5.5 15 15.5 5a2.1 2.1 0 0 1 3 3l-10 10Z" /><path d="m13.5 7 3 3" /></>,
  bolt: <><path d="M13 3.5 5.5 13.5H12l-1 7 7.5-10H12Z" /></>,
  sound: <><path d="M4.5 9.5h3l4.5-4v13l-4.5-4h-3Z" /><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /></>,
  mic: <><rect x="9" y="3.5" width="6" height="11" rx="3" /><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" /></>,
  moon: <><path d="M20 13.4A8 8 0 1 1 10.6 4a6.5 6.5 0 0 0 9.4 9.4Z" /></>,
  users: <><circle cx="9" cy="8" r="3.2" /><path d="M2.8 19a6.2 6.2 0 0 1 12.4 0" /><path d="M16 5.2a3.2 3.2 0 0 1 0 6.1M17.4 13.2a5.8 5.8 0 0 1 3.8 5.5" /></>,
  repeat: <><path d="m17 2 4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="m7 22-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></>,
  card: <><rect x="2.5" y="5" width="19" height="14" rx="2.5" /><path d="M2.5 10h19" /><path d="M6.5 15h3" /></>,
  cards: <><rect x="8" y="3.5" width="12" height="15" rx="2.5" /><path d="M16 6.5H6.5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2H15" /><path d="M11.5 9h5M11.5 12.5h3.5" /></>,
  book: <><path d="M5 4.5h9.5A3.5 3.5 0 0 1 18 8v11.5H8A3 3 0 0 1 5 16.5v-12Z" /><path d="M5 16.5A3 3 0 0 1 8 13.5h10" /><path d="M9 7.5h5" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6" /><path d="m15 15 5 5" /></>,
  info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5" /><path d="M12 7.7h.01" /></>,
  tag: <><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" /><circle cx="7.5" cy="7.5" r="1.4" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.11-1.55 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.9a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.12.4.48.72.91.86H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1.14Z" /></>,
} satisfies Record<string, ReactNode>;
export type IconName = keyof typeof paths;

export function Icon({ name, size = 20, ...rest }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...rest}>{paths[name]}</svg>;
}
