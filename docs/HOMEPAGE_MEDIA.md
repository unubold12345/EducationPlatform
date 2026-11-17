# Homepage media

Generated with the built-in image_gen tool on 2026-11-08; optimised locally to WebP with Sharp. These are editorial illustrations, not photographs of enrolled students or endorsements.

## study-hero

Asset: `public/home/study-hero.webp`

Use case: photorealistic-natural. Asset type: editorial hero photograph for a Mongolian exam preparation website. A candid medium-wide portrait of two Mongolian university-age students, a woman and a man, studying together at a pale oak library desk, looking with quiet focus at a laptop and open notebooks. Modern sunlit university library, subtle bookshelves and indoor greenery out of focus, soft afternoon window light, warm ivory and natural wood, small blue details in clothing. Authentic skin texture, relaxed contemporary clothing, premium education magazine photography, subtle film texture. Landscape 3:2 composition, students and desk fully within central safe area for cropping, faces around upper middle, laptop below. No visible brand logos, no readable text, no watermark. The image should feel thoughtful and welcoming.

## stem-cover

Asset: `public/home/stem-cover.webp`

Use case: stylized-concept. Asset type: wide editorial course cover image for SAT and mathematics/physics entrance preparation. A beautiful tactile still-life of a cobalt blue geometric arch, small ivory sphere, orange translucent triangular prism, cream graph-paper notebook, a pencil and elegant metal wire orbital form, arranged like a premium educational magazine cover on a pale warm ivory desk. Physically rendered detailed materials, soft shadows, natural directional sunlight, sophisticated restrained palette of cobalt blue, ivory and warm orange, architectural composition with breathing room, close-up photographic realism, landscape 3:2. No readable words, no letters, no UI, no watermark, no logo. Not a flat vector illustration.

## language-cover

Asset: `public/home/language-cover.webp`

Use case: photorealistic-natural. Asset type: editorial photograph for IELTS language study and Speaking/Writing Workshop website section. Young Mongolian woman university student wearing simple over-ear headphones and a soft blue shirt, concentrating warmly on an open notebook beside a laptop, at a cozy modern library desk. Three quarter side view, natural window light, tactile paper and wood, blurred plant and books behind, authentic facial detail, premium magazine photography. Wide 3:2 composition, shoulders, headphones, hands and notebook visible, plenty of useful cropping room. Muted sage, ivory and soft blue palette. No readable text on screens or papers, no logos, no watermark.

## japanese-cover

Asset: `public/home/japanese-cover.webp`

Use case: stylized-concept. Asset type: wide editorial course cover for Japanese language JLPT N5/N4 on a study website. A refined tactile still-life of a small architectural vermilion torii gate model, folded cream paper fan, a few pale pink cherry blossom twigs, two simple notebooks and a cobalt blue pen on an ivory surface. Modern premium educational editorial art direction, realistic paper and painted wood, soft natural sunlight and sculptural shadows, warm cream backdrop, balanced asymmetrical composition, close-up photographic rendering, landscape 3:2. Sophisticated, calm and contemporary, no anime. No readable text, no symbols pretending to be Japanese writing, no watermark or logo.

## eesh-cover, hsk-cover, workshop-cover · 2026-11-13

Assets: `public/home/eesh-cover.webp`, `hsk-cover.webp`, `workshop-cover.webp` (1440 × 960, WebP quality 80). They replace the ЭЕШ card's reuse of `study-hero`, and the HSK card's and Workshop section's reuse of `language-cover`. Generated with DeepInfra `black-forest-labs/FLUX-2-pro` at 1440 × 960 (owner-approved; two candidates each, one kept), optimised with Sharp. Each prompt ended with the shared style line: premium education magazine photography, natural window light, ivory/oak/sage/cobalt palette, subject in the central band for a 2.2:1 crop, no readable text, letters, logos or watermark.

- **eesh-cover:** a focused Mongolian high-school senior studying at a pale oak desk in the early morning with plain textbooks, a calculator, a molecule model and a beaker; Ulaanbaatar apartment blocks and hills out of focus through the window.
- **hsk-cover:** still-life on ivory: bamboo brush on a ceramic rest, ink stone, blank rice paper, small red paper lantern, celadon tea cup, white plum blossom twig, blank cobalt notebook; no Chinese characters.
- **workshop-cover:** a young Mongolian university student in a headset with a boom microphone, speaking with an open-hand gesture to a laptop in a bright study room.

## Product loops

Three silent films built from real screenshots of the local product (since 2026-11-16, owner request: faster, animated, captioned).
MP4/H.264, 1440 × 900 at 30 fps, with WebP posters in `public/home/`. Each film is a camera over 2880 × 1800 stills: it settles on
the page, pushes in on the control being used, a pointer clicks it and the film cuts to the next real screen; a numbered Mongolian
caption names each step. Nothing on a screen is drawn or edited: only the pointer, the blue focus frame and the caption are added.
No real user data, microphone recordings, live AI calls or fabricated AI outputs; the review film uses a sample result from the
guarded local QA fixture. The homepage plays them as silent, inline, autoplaying loops without controls, with adjacent text
descriptions; playback pauses offscreen, in a hidden tab or for a reduced-motion preference, and posters remain if autoplay is blocked.

| File | Duration | Steps (caption) |
| --- | --- | --- |
| `public/home/exam-practice.mp4` | 13.8 s | Шалгалтаа сонго · Бүтэн mock-оо нээ · Дадлагын горим: цаггүй · Хариулаад шууд шалга · Алдаа бүр тайлбартай |
| `public/home/workspace-review.mp4` | 11.8 s | Бүх бэлтгэл нэг дор · Өгсөн шалгалтаа нээ · Оноо, сул чадвараа хар · Асуулт бүр тайлбартай |
| `public/home/workshop.mp4` | 12.6 s | Workshop: дөрвөн чадвар · Speaking: AI хамтрагчаа сонго · Writing: бичээд зөвлөгөө ав · Listening: таван бүрэн тест |

Regenerate, with the local preview (3001) and database running:

1. `python -X utf8 scripts/home-loops/capture.py`: stills and `shots.json` (the boxes the films point at) in ignored
   `artifacts/home-loops/capture/`. It creates a disposable `qa-exam-home-demo-…@example.invalid` account, uses the simulated SAT
   payment and the guarded local deadline fixture for the sample result. It never changes an application timer or access check.
2. `node scripts/home-loops/build.mjs`: writes one HyperFrames project per film under `artifacts/home-loops/<film>/`. The shot
   list (order, durations, captions, zoom targets, pointer stops) is the `FILMS` table at the top of that script.
3. `npx hyperframes render artifacts/home-loops/<film> -o artifacts/home-loops/<film>.mp4 -q high` for each film.
4. `node scripts/home-loops/build.mjs --publish`: compresses to `public/home/` (CRF 27) and cuts the posters.

A layout change that moves a pictured control needs step 1 again; a caption or timing change needs only steps 2 to 4. The earlier
real-time browser recordings (18 to 29 s, `scripts/record-homepage-demos.py`) are kept in ignored
`artifacts/home-recordings/prev-2026-11-16/`; copy the six files back into `public/home/` to restore them.


## Hand-drawn variant · 2026-11-08

The owner restored the original artwork: `HOME_ART_STYLE = "editorial"` in `src/components/home-art.ts`. Set the value to `"handdrawn"` to revisit the sketch variant. Both complete sets and their matching alt text remain available. The original four WebP files remain untouched at their existing paths; their SHA-256 hashes were compared before and after the variant change. Autoplaying video loops are retained.

All four new images were generated with the built-in image_gen tool, then optimised to new WebP files. This is a hand-drawn visual style created with AI, not a claim of human authorship. No people or hands are shown.

Verified: `npm run check -- ui` passed (112 unit tests, build and UI suites). Each video started without a click, looped across its end, and exposed no playback controls. Live reduced-motion changes stopped/resumed playback. Home, exam library and login were checked at 1440/390/320 in both themes with no overflow or page errors. Original image hashes remained identical.

### study-hero-handdrawn

Asset: `public/home/study-hero-handdrawn.webp`

Use case: illustration-story. Asset type: hand-drawn illustration for a Mongolian exam-preparation homepage. Medium: expressive human-made-looking ink and coloured pencil with loose watercolour washes on warm off-white textured paper. Fine irregular navy pen strokes, visible graphite construction lines, little cross-hatching, imperfect hand-painted edges, subtle paper grain. Restrained cobalt blue, sage green, warm coral and buttery yellow. Elegant contemporary sketchbook editorial illustration, thoughtful and a little playful, detailed but uncluttered, flat illustrated perspective, not photorealistic, not 3D, not vector-perfect, not clip-art. Wide 3:2 composition with the complete main subject kept within the central 75 percent for responsive crops. Absolutely no people, human figures, faces, hands, anthropomorphic characters, readable words, logos or watermarks. Scene: a small imaginative learning landscape built from an open book, a blue pencil, a modest laptop with a simple abstract graph on its screen, a tiny potted plant and a winding dotted path made of ink. The path rises from the open book toward a little blue pennant on a stack of books, with a paper aeroplane, star doodles and a delicate sun floating nearby. A tiny Mongolian mountain silhouette in the background. The image should express small daily steps toward a big learning goal. Generous warm paper background, balanced charming handmade composition, rich paper and pencil textures.

### stem-cover-handdrawn

Asset: `public/home/stem-cover-handdrawn.webp`

Use case: illustration-story. Asset type: hand-drawn illustration for a Mongolian exam-preparation homepage. Medium: expressive human-made-looking ink and coloured pencil with loose watercolour washes on warm off-white textured paper. Fine irregular navy pen strokes, visible graphite construction lines, little cross-hatching, imperfect hand-painted edges, subtle paper grain. Restrained cobalt blue, sage green, warm coral and buttery yellow. Elegant contemporary sketchbook editorial illustration, thoughtful and a little playful, detailed but uncluttered, flat illustrated perspective, not photorealistic, not 3D, not vector-perfect, not clip-art. Wide 3:2 composition with the complete main subject kept within the central 75 percent for responsive crops. Absolutely no people, human figures, faces, hands, anthropomorphic characters, readable words, logos or watermarks. Scene: an open graph-paper notebook with sketched geometric forms, a large blue triangular set square, a pencil, an orange translucent-looking prism rendered in watercolour, an ivory sphere drawn with cross-hatching and a thin orbital atom doodle. Small graph curves and measurement ticks float above the notebook. A carefully composed still life representing SAT mathematics and physics study, hand-drawn with clear individual lines, not digital shiny objects. Keep the objects readable and central on the warm paper.

### language-cover-handdrawn

Asset: `public/home/language-cover-handdrawn.webp`

Use case: illustration-story. Asset type: hand-drawn illustration for a Mongolian exam-preparation homepage. Medium: expressive human-made-looking ink and coloured pencil with loose watercolour washes on warm off-white textured paper. Fine irregular navy pen strokes, visible graphite construction lines, little cross-hatching, imperfect hand-painted edges, subtle paper grain. Restrained cobalt blue, sage green, warm coral and buttery yellow. Elegant contemporary sketchbook editorial illustration, thoughtful and a little playful, detailed but uncluttered, flat illustrated perspective, not photorealistic, not 3D, not vector-perfect, not clip-art. Wide 3:2 composition with the complete main subject kept within the central 75 percent for responsive crops. Absolutely no people, human figures, faces, hands, anthropomorphic characters, readable words, logos or watermarks. Scene: an open notebook with abstract handwritten-looking lines that are not real words, a blue fountain pen, over-ear headphones resting beside the notebook, two small blank speech bubbles and little soft watercolour sound waves floating above. A tiny sage leaf sprig, two stacked books and a coral bookmark. This is an intimate still-life illustration about speaking, listening and writing languages. No human wearer for the headphones; no microphone character; all objects entirely inanimate. Balanced and spacious on textured cream paper.

### japanese-cover-handdrawn

Asset: `public/home/japanese-cover-handdrawn.webp`

Use case: illustration-story. Asset type: hand-drawn illustration for a Mongolian exam-preparation homepage. Medium: expressive human-made-looking ink and coloured pencil with loose watercolour washes on warm off-white textured paper. Fine irregular navy pen strokes, visible graphite construction lines, little cross-hatching, imperfect hand-painted edges, subtle paper grain. Restrained cobalt blue, sage green, warm coral and buttery yellow. Elegant contemporary sketchbook editorial illustration, thoughtful and a little playful, detailed but uncluttered, flat illustrated perspective, not photorealistic, not 3D, not vector-perfect, not clip-art. Wide 3:2 composition with the complete main subject kept within the central 75 percent for responsive crops. Absolutely no people, human figures, faces, hands, anthropomorphic characters, readable words, logos or watermarks. Scene: an expressive ink-and-watercolour sketch of a small vermilion torii gate, a cream folded paper fan, a little stack of blue and ivory study notebooks with blank covers and a delicate branch of pink cherry blossoms, one origami paper crane. Small pencil star and petal doodles. Warm thoughtful handmade travel-and-learning journal illustration for a Japanese language course, inanimate still life, with lovely paper texture and varied ink pressure. No written Japanese characters or readable text.
