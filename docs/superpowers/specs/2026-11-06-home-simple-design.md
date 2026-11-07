# Simple home page — design

Date: 2026-11-06
Status: implemented; classic home preserved behind `HOME_DESIGN`
Scope: public home page (`/`) only

## Intent

Make the home page feel like <https://uberdesigner.ai/teams/>: near-black and quiet, with a
centred oversized headline, generous empty space, hairline rules, one purple accent and almost no
card chrome. Keep every existing home section and destination. The owner must be able to put the
current design back by changing one line, without git, a deploy, or touching the rest of the site.

## Goals

- Restyle only `/`; every other route keeps its current look.
- Keep all current content and links: hero, launch/entry links, ticker, three programmes,
  Speaking invitation, three-step approach, resource links and Lexlab.
- Adopt the reference's visual language, not its page copy or page length.
- Work in both light and dark themes; dark should read as the reference look.
- Keep the existing test hooks and accessibility behaviour.
- Make rollback a single constant flip.

## Non-goals

- No copy rewrite, new programme data, new routes, auth, payment, exam or database work.
- No changes to `/programs`, `/exams`, `/plans`, Speaking Lab, Lexlab, header or footer markup.
- No new dependencies, fonts or global theme-token changes.
- No content removed. The compact Lexlab treatment replaces the large detailed panel but keeps the
  same link and title.
- No commit, push or deploy without separate owner authorisation.

## Constraints

- The working tree contains substantial uncommitted work from other agents. Reverting via git is
  unsafe; the rollback must live in the code.
- `npm run check -- ui` covers `theme` and `homepage_polish`; `homepage_polish` requires at least
  eight `[data-reveal]` elements, an animated `.speaking-invitation`, and no horizontal overflow at
  320px with reduced motion.
- `theme` requires three visible `.launch-panel` links (`/exams/sat`, `/exams/ielts`,
  `/exams/eesh`), body background `rgb(7, 7, 13)` in dark, and Golos Text.
- `browser_smoke` requires a visible `Том зорилго.` heading and a Lexlab link named
  `Lexlab-ийн эрх үзэх` pointing at `https://lexlab.site/plan`.
- Keep server-side checks, same-origin behaviour and ownership rules untouched.

## Approaches

### A. Classic component + one design constant (chosen)

Move today's home markup unchanged into `src/components/home-classic.tsx`. Add
`src/components/home-simple.tsx` and `src/app/home-simple.css`. `src/app/page.tsx` becomes a small
switch:

```ts
const HOME_DESIGN: "simple" | "classic" = "simple";
```

Pros: true one-line rollback, no git dependency, both designs keep their CSS, other routes cannot
regress. Cons: a small amount of duplicated page markup.

### B. Separate `/home-simple` preview route

Rejected: the request is the real home page, and a preview route would double SEO/navigation
surface and make rollback a routing decision rather than a constant.

### C. CSS-only re-skin of the existing markup

Rejected: the centred hero and new section rhythm need a different DOM order. Forcing it through
overrides would be brittle and harder to remove than a separate component.

### D. Git branch, stash or patch

Rejected: the tree is heavily dirty with other agents' work, and the owner asked for a design they
can undo without git.

## Chosen design

### Structure

- `src/app/page.tsx`: imports the classic and simple CSS, chooses the design from `HOME_DESIGN`.
- `src/components/home-classic.tsx`: exact current home markup, unchanged behaviour.
- `src/components/home-simple.tsx`: new home markup, server component. Reuses `ProgramCard`,
  `SpeakingInvitation`, `LawTestRecommendation` (compact) and `HomeMotion`.
- `src/app/home-simple.css`: every selector scoped under `.home-simple` or
  `body:has(.home-simple)`.
- `HomeMotion` gains an optional `className` (default stays `home-page`) so the simple page can use
  `.home-simple` while keeping its reveal observer. Classic markup is unchanged.

### Page rhythm

1. **Hero** — centred small pill (`2026 · SAT · IELTS · ЭЕШ →`), oversized two-line
   `Том зорилго. / Өдөр бүрийн жижиг алхам.`, one-sentence lede, white pill primary CTA and a plain
   secondary link, then the 98 / 155 / 04 stat row.
2. **Entry band** — the existing `.launch-panel` content, flattened into a hairline band with three
   direct links to SAT, IELTS and ЭЕШ. Same links and test hooks.
3. **Ticker** — the existing marquee, reduced to a quiet hairline strip.
4. **Programmes** — existing `ProgramCard` components, restyled as three borderless editorial rows
   with large titles and arrows instead of gradient cards.
5. **Speaking invitation** — existing component and copy, restyled as a simple band with the art
   reduced to a small supporting element.
6. **Approach** — existing three steps as numbered hairline rows, no box.
7. **Resources** — existing three resource links as plain columns, not a bento of cards.
8. **Lexlab** — existing compact card (`LawTestRecommendation` without `detailed`), restyled as a
   quiet closing row.

Every section gets `data-reveal` where it helps the existing motion observer; at least eight
remain. `prefers-reduced-motion` and no-JS stay fully static.

### Visual language

- **Colour:** keep the existing near-black `--white` (`#07070d` dark) and body background; use the
  current ink/muted tokens. Add one scoped accent, a vivid purple (`#8b5cf6` dark, `#5b3df5` light),
  used only for the pill dot/label, step numbers and small hover states.
- **Type:** keep Golos Text. Display heading `clamp(44px, 7vw, 92px)`, tight tracking, weight 600;
  body 14–15px muted; no gradient text.
- **Layout:** centred hero inside a ~980px measure; content stays in the existing 1160px container;
  hairline separators; no card backgrounds, shadows or large radii.
- **Background:** hide the global aurora and 72px grid on this route only; draw three very faint
  vertical hairlines behind the hero, echoing the reference.
- **Header:** on this route only, remove the glass/pill chrome and show plain nav text; keep the
  theme toggle and account control usable. Footer and all other routes are untouched.
- **Light theme:** warm white background, near-black text, black pill CTA, same purple accent and
  hairlines. Dark remains the primary reference look.
- **Motion:** reuse `HomeMotion` for the existing 650ms fade-up; no new animation library.

### Mobile

Single column. Hero heading scales down but stays the dominant element. Entry links, programme
rows, approach and resources stack with hairlines. No horizontal overflow at 320px.

## Rollback

Change `HOME_DESIGN` in `src/app/page.tsx` from `"simple"` to `"classic"`. The old markup, styles
and components are already present; no data, database or deployment change is involved.

## Verification

- `npm run check` for type/lint/unit coverage of touched code.
- `npm run check -- ui` for `theme` and `homepage_polish`.
- Manual screenshots at 1440 and 320, light and dark.
- Temporarily switch to `"classic"`, confirm `/` is the old page, switch back to `"simple"`.
- Confirm other routes are visually unaffected.
- Record one short outcome entry in `docs/OPERATIONS.md`.

## Owner decisions already made

- Keep all current sections, simplified.
- Home page only.
- Rollback must be easy and not depend on git.

## Builder's calls (open to correction while reviewing)

- Use the compact Lexlab card instead of the large detailed panel.
- Flatten the header only on this route.
- Keep the ticker, but make it quiet.
- Reuse existing components and add scoped CSS rather than rebuilding content.
