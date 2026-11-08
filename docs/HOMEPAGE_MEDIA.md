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

## Product recordings

Three silent, real local-browser recordings made with reserved QA data. MP4/H.264, 1440 × 900 at 24 fps, with WebP posters in `public/home/`. No real user data, microphone recordings, live AI calls or fabricated AI outputs. The review clip uses an explicitly labelled sample result. The current homepage uses silent, inline, autoplaying loops without player controls or click/keyboard interaction, with adjacent text descriptions. Playback pauses automatically offscreen, in a hidden tab or for a reduced-motion preference; posters remain available if autoplay is blocked.

| File | Duration | Actual actions |
| --- | --- | --- |
| `public/home/exam-practice.mp4` | 23 s | Browse the library, select SAT, open practice, select/check an answer, move to the next question |
| `public/home/workspace-review.mp4` | 18.4 s | Open Workspace, open Review, select a completed sample, inspect questions and explanations |
| `public/home/workshop.mp4` | 28.4 s | Open Workshop, choose a Speaking partner/part, open Essay Studio and type a sample paragraph |

Regenerate with `python scripts/record-homepage-demos.py` while the local preview and database are running. The script creates a disposable `qa-exam-home-demo-…@example.invalid` account, uses simulated SAT payment and the existing guarded local QA deadline fixture to prepare a sample submitted result. It never changes an application timer or access check. Raw captures stay ignored under `artifacts/home-recordings/`; only compressed media is used by the page.

The original click-to-play version was verified locally for decoding, seeking and deferred video requests. Videos and posters remain unchanged in the new autoplay version. Responsive artwork is served by Next Image. Original screenshots are in ignored `artifacts/home-final/`; hand-drawn variant screenshots are in `artifacts/home-handdrawn/`.


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
