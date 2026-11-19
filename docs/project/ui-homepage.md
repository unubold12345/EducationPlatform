# Homepage, theme, stylesheets and scratchpad

Part of the [project guide](../PROJECT.md) (was PROJECT.md section 7). "Section N" in the text means that old numbering; the guide maps it to files.

### Homepage, theme and scratchpad

- **Layout since 2026-11-20** (owner: "change the layout, remove the typing title, add more details, keep the colours and
  background"; three wireframes were turned down with "think different", so the concept was chosen by the agent).
  `src/app/page.tsx` renders `HomeSheet` (`src/components/home-sheet.tsx`, styles in `src/app/home-sheet.css`), top to bottom:
  - **Hero**: the dark card (graph-paper texture, blue glows; dark in both themes) holds a still two-sentence headline, the
    total of full mocks, two links and the free-account facts on the left, and **a sample question to answer** on the right
    (`home-try.tsx`, client): one tab per exam (SAT, IELTS, TOEFL, ЭЕШ, JLPT, HSK, TOPIK), answer bubbles like the mocks'
    answer sheet, an instant verdict with the explanation and a link to that exam's hub. The seven items were written for the
    homepage only, are not mock content, and their keys sit in the client on purpose: nothing is saved or scored. The seven
    exam links with mock counts run along the card's bottom edge (`.launch-panel`, used by `theme_smoke`).
  - **Structure** (`#programs`, rows `#program-<program>`, so old `#program-entrance` links still land): every level's
    sections drawn to scale on one 0–180 minute axis, shaded by skill in tints of the one blue, with total time, question
    detail, full mocks and free half mocks. Counts, questions and the TOEFL range come from the catalogues; the section
    minutes are a table in `src/components/home-data.ts` (taken from each programme's first mock on 2026-11-20), so a format
    change in a mock builder needs that table updated.
  - **Films** (`#demos`): the three product loops in order, each with its captions as a numbered step list.
  - **Workspace** (`#workspace`, `#workshop`): the sticky Workshop photo, six Workspace tools and six Workshop links.
  - **Plans by goal** (`#plans`): Mongolian university (ЭЕШ), universities abroad (Англи хэл Basic/Pro) and Asian languages
    (Ази хэл Basic/Pro) with server-read prices and photos, then free and single-mock rows and a folding limits table
    (credits, word bank, saved file exams, expert reviews from the plan definitions).
  - FAQ (`#questions`), a dark closing band and the Lexlab link.
  Restore the 2026-11-16 page: `artifacts/design-backup-2026-11-20-home/restore.ps1` (old page files and the two browser
  tests that assert the homepage).
- The atmosphere layer (sketches, aura, grain; `home-atmosphere.css`) and one-time scroll reveals (`HomeMotion`, honours
  reduced motion and leaves content readable without JS) are unchanged. Media and prompts: `docs/HOMEPAGE_MEDIA.md`;
  optimised images/videos: `public/home/`. `scripts/home-loops/capture.py` uses local disposable QA accounts only; no live
  AI calls. Artwork is selected by `HOME_ART_STYLE` in `src/components/home-art.ts` (`editorial`; the `handdrawn` set stays
  on disk). Loops have no player controls; they stop offscreen, in hidden tabs and for reduced-motion preferences. TOEFL and
  TOPIK have no photo of their own.

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
