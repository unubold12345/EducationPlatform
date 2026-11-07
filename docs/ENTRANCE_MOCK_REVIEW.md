# University mock revision 2 — 2026-11-06

> Superseded later on 2026-11-06: the four revision-2 Mathematics forms were retired when the imported
> 155-paper ЭЕШ set went live. Their files are in `reference/retired-site-mocks/eesh-math/`; this note
> remains as provenance for the old review and does not describe the current Mathematics mocks.

> Later on 2026-11-06 the owner took the six English forms off the site. Their files are in
> `reference/retired-site-mocks/eesh-english/`; the English rows below describe that retired set.

Agent: Codex (GPT-6), owner-authorized takeover of Claude Code's completed, uncommitted implementation.
Claude's official-paper withdrawal, exam collections and access integration remain the baseline.

## Reference comparison

Read the local 2020 Mathematics A/B transcriptions and the later-question sections of C/D, plus local
2019 English A grammar/vocabulary and 2020 English A vocabulary/reading images. They show a progression
from short entry questions to questions requiring interpretation, constraints and several connected steps.
These were a benchmark for structure and reasoning, not evidence of psychometric equivalence.
No official passage, page image or reference-module import was added to the application.

| Area | Earlier mocks | Revision 2 |
| --- | --- | --- |
| Mathematics entry | Mostly single formula substitution | Short entry section covers algebraic structure, inverse functions, matrices, vectors and variance |
| Mathematics later questions | Many one-step facts and small calculations | Conditional probability, Bayes, digit restrictions, parameter ranges, matrix powers, tangency, linked geometry and constrained optimisation |
| Mathematics fill-ins | Often direct substitution into a supplied formula | Derive a model, find a constrained optimum, compute integrals/means, combine triangle radii, condition a three-draw probability |
| Mathematics distractors | Frequently unrelated values | Common domain/sign errors, wrong denominator, missed restrictions, unconditional instead of conditional probability and incorrect modelling |
| English grammar | Mostly short elementary gaps | Retained entry questions plus mixed conditionals, inversion, reporting structures, perfect/passive infinitives and formal dependent clauses |
| English vocabulary | Often obvious semantic contrasts | Collocation, precise word choice, formal definitions, phrasal verbs and contextual idioms |
| English reading | Short, largely literal questions | Six fictional 284–310-word case studies; inference, purpose, reference, evidence limits and plausible overstatements as distractors |
| English matching | Mostly separate simple sentences | Ten revised answers per form: connected five-gap discourse cloze and five precise formal definitions, with two unused options per task |

## Scope and compatibility

- Four Mathematics forms: all 144 choices and 56 fill-in answers revised (50 answers per form).
- Six English forms: 36 of 66 answers revised in each form (216 total); entry grammar, error spotting,
  conversation and the final two matching tasks remain to retain a mixed difficulty profile.
- English remains 80 minutes; Mathematics remains 100 minutes, with 36 choices and four multipart tasks.
- Source definition version is 2; question IDs use `v2`. Earlier checked practice items cannot unlock
  revised answers. Saved timed sittings still use their original immutable snapshots.
- Local `PublishedContent` had no `eesh-*` versions at review time. Published admin content continues
  to take precedence; no database record was replaced to force this revision into an existing publication.
- Purchases, prices, server gates, timers, grading rules and official-paper withdrawal are unchanged.

## Verification and remaining review

The later presentation pass uses the local official Mathematics page layout as a visual reference: eight
booklet pages, two columns on desktop, professionally stacked fractions/matrices and a separate bubble
sheet. Eleven labelled SVG diagrams per form cover the relevant graphs, geometry and applied tasks.
All 36 choice bubbles and 14 numeric fields use the existing autosave and server grading path; there is
no early-finish control. Practice and result review share the mathematical typography and diagram renderer.
The booklet remains labelled as an Education mock, with raw-count scoring and no official branding.

`tests/entrance-math-answers.test.mjs` evaluates every Mathematics key independently: recurrence iteration,
polynomial multiplication, numerical differentiation/integration, numerical optimisation, enumeration of
draws and digits, direct geometry and parameter/domain checks. English keys and distractors were reviewed
while authoring; no automated test can establish that they have exactly one defensible linguistic reading.

Teacher review of English ambiguity, Mongolian terminology and timing is still required. Matching official
difficulty needs student trial results; the revision does not claim an official weighting or scaled score.
The remaining 31 previously planned mocks are outside this ten-form revision.
