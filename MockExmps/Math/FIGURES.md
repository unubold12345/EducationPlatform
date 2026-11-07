# Offline figure format

All five mocks for every retained year carry their own diagrams in the question's
`figure` object. No site code imports these files. Open `figures-preview.html` for
an answer-free M1 gallery across the 11 years; the other variants have independently
parameterized figure data in their JSON.

## Source appearance

Each year's `reference/figures.json` maps reference question numbers to unchanged
source images or the annotated reference PDF, with SHA-256 hashes. Paths in that
catalog are relative to the year folder. `reference.json` links and hashes the
catalog. Source assets preserve the original line styles, shading, labels and
layout for review. The 2022–2026 images belong to the owner-approved MathX
transcriptions; they have not been verified against original official booklets.

The catalog does **not** claim the mock coordinates reproduce original coordinates.
For older PDFs, locate the printed question number in the annotated booklet; full
page images remain available for 2018, 2019 and 2021. Additional illustrations for
text-only geometry questions are identified separately in mock data.

## Mock `figure` fields

The machine-readable structural schema is `figure.schema.json`. Cross-reference
and geometry checks are implemented in the offline validator.

| Field | Meaning |
| --- | --- |
| `schema` | `education.math.figure.v1` |
| `kind` | `scene` or `statistical` |
| `space` | `2d` or `3d` for a scene |
| `coordinateSystem`, `notToScale` | Cartesian coordinates or a schematic drawing; never measure a schematic to solve a question |
| `points` | Stable point IDs, numeric positions and visible labels |
| `objects` | Segments, polygons, circles, horizontal 3D circles and sampled polylines |
| `measurements` | Given lengths and label text; `provenance: question_given` |
| `relations` | Right angles, parallel lines, tangencies, midpoints, ratios and other geometric constraints |
| `shadedRegions` | Annular sectors with center, radii and angular bounds |
| `givenCases` | Conditions applying only to specified subquestions |
| `constructionRequests` | Constructions students must find; their solved shape or dimensions are deliberately absent |
| `choicePanels` | Option-letter mappings for graph-choice diagrams, including opening and root configuration; descriptions also appear in the question options |
| `sourceQuestion` | Year, reference variant, question number and catalog path relative to `Math/` |
| `displayPolicy` | `question_figure` or `optional_illustration`; hide optional illustrations in an exam until teacher review approves them |
| `svg` | Self-contained, script-free SVG preview of the main diagram |

Statistical figures contain `chartType` and `data` (stem-and-leaf, histogram,
probability bars or boxplot), plus their SVG. Graphs use sampled coordinates rather
than executable expressions. Three-dimensional coordinates use an orthographic
projection in the preview. The SVG shows the main scene; supplementary constraints,
case conditions remain explicit structured data and text. Graph-option previews
are also included in `choiceSvgs`, keyed by the option letter.
These SVGs are review previews, not a finished website renderer.

No answer-key values are used to build a figure. Only points, labels and givens
needed to state the question are displayed. Construction coordinates are private
authoring data: a future site should send students the rendered figure, not the
answer-bearing exam JSON or raw coordinates that could disclose derived values.

## Rebuild and verify

Run `python MockExmps/Math/tools/yearYYYY.py` for a changed year's five forms, then
`python MockExmps/Math/tools/build_figure_catalogs.py` to refresh the catalogs and
gallery. Run `python MockExmps/Math/tools/validate_all.py` for math, figure coverage,
source hashes, finite coordinates, object references, SVG allowlists and geometric
right-angle/midpoint/ratio/parallel/tangent checks. The report records actual counts.

Teacher review is still needed for presentation and difficulty equivalence. The
addition corrected the degenerate 45° tangent case in 2026 M5 Q7 to 42°, and made
the independent cases in 2023 Q2.2 explicit without changing their answer keys.
