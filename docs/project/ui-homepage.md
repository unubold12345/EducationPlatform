# Homepage, theme, stylesheets and scratchpad

Part of the [project guide](../PROJECT.md) (was PROJECT.md section 7). "Section N" in the text means that old numbering; the guide maps it to files.

### Homepage, theme and scratchpad

- The homepage has additional education sketches through the page, a dedicated Speaking invitation,
  and one-time scroll reveals. Motion uses a small client component around server-rendered content,
  respects reduced-motion settings (including live changes), and leaves content readable without JS.
  The owner chose the Classic concept on 2026-11-07; `src/app/page.tsx` renders `HomeClassic`
  directly, and the earlier simple/index/practice experiments and their `/designs` preview routes
  were removed.
  Since 2026-11-08 it uses generated editorial images, concise programme cards with expandable formats,
  three silent autoplaying product loops (exam/practice, Workspace/review and Workshop), current server-read
  prices and FAQs. `home-details.tsx` and `home-overview.css` keep this presentation scoped to the homepage;
  glyphs, sketches, ticker, atmosphere and a compact Lexlab link remain. Programme navigation opens `/#programs`.
  Media and prompts: `docs/HOMEPAGE_MEDIA.md`; optimised images/videos: `public/home/`.
  `scripts/record-homepage-demos.py` records local disposable QA accounts only; no live AI calls.
  Artwork is selected by `HOME_ART_STYLE` in `src/components/home-art.ts`; the owner restored `editorial`.
  The `handdrawn` ink/watercolour alternative and both complete image sets remain available. Loops have no player controls;
  they stop offscreen, in hidden tabs and for reduced-motion preferences.
  2026-11-13 refresh (owner request): ЭЕШ, HSK and Workshop got their own photos (FLUX-2-pro via DeepInfra, owner-approved),
  so no picture repeats; slogan overlays, the hero seal and pill, filler eyebrows and side notes and the Workshop fine print are
  gone; the closing call to action is one line; the Workspace features are AI chat, vocabulary, exams from a file and review;
  a lone fifth programme card spans the row; the FAQ adds AI credits; the three loops were re-recorded on the current Workspace.
  The loops section has no visible title (its `h2` is `sr-only`, owner request); the loops were last re-recorded 2026-11-16.

- The header theme switch defaults to the browser preference and saves an explicit choice in
  `education-theme` localStorage. The public site now shares the Workspace's blue/neutral palette and self-hosted Inter (`next/font/google`, fetched at build) with
  Mongolian Cyrillic coverage. English passages keep a reading serif.
- The 2026 interface layer lives in `src/app/theme.css`, loaded after `globals.css`. It is
  built on white/light-grey surfaces and a blue accent, with matching charcoal surfaces in dark mode. It keeps
  the existing glyphs and decorative features, and styles the sticky glass header/footer,
  homepage hero, cards, auth, dashboard, exam surfaces, admin and mobile navigation without
  changing route semantics, server checks or test hooks.
- Plans (own CSS in `src/app/workspace/plans/plans.css`) and Workshop live in the Workspace; the shell's styles
  are in `src/modules/workspace/workspace.css` (scoped under `.wsp`).
  The rest of the site uses the full display scale and copy. `src/app/footer-compact.css` keeps the
  shared footer to one link row and one disclaimer line; delete its import in `layout.tsx` to restore
  the taller footer.
- `/workspace/profile` and `/admin` share `src/app/workspace.css` (card surface, status pill and tokens) through their own
  stylesheets, with readable type and no monospace Cyrillic labels. Despite its name, that file is not the Workspace's
  stylesheet (`src/modules/workspace/workspace.css`).
- Mathematics and Physics tests expose a collapsible scratchpad with graph paper, mouse/pen/touch drawing,
  last-stroke undo, confirmed clear and keyboard-accessible typed notes.
- The imported ЭЕШ surfaces live in `src/modules/exams/entrance/entrance.css` (hub, briefing, sitting,
  answer sheet and results), scoped under `.eesh-*` so SAT and IELTS keep their existing CSS.
- Scratch work is stored only in this browser under `education-scratchpad-v1:<attemptId>`, capped at
  8,000 characters, 200 strokes / 12,000 points and 1,500 points per stroke. It never enters graded
  responses, server scoring or deadlines. SAT Math modules in one sitting share the pad; different
  attempts do not.
