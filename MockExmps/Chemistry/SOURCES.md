# Reference provenance (Chemistry)

Checked 2026-11-09. Only 2020–2026 were considered; one A variant per year is the reference.

## 2026 A — official, full paper

- Inventory: [eec.mn/api/events](https://eec.mn/api/events), event "Элсэлтийн шалгалт 2026", subject Хими (A–D offered).
- File: [Himi_ESH_2026_A.pdf](https://eec.mn/api/files/cmuawp1m9001h6295xj90nnz2/download) → `2026/reference/official-A.pdf`
  (16 pages, SHA-256 `a466f0f82ee460957cc3631d5628b68434bce20b5f31d56eb08928c4dde824b5`).
- 40 MCQ / 68 points (1–22 × 1, 23–30 × 2, 31–40 × 3) + 4 × 8-point tasks: bonding/shape, rate factors (Maxwell–Boltzmann),
  period-3 metals & zinc extraction, alkene reactions. No official key used.

## 2025 A — official, archived

- Post: [eec.mn/post/6259](https://www.eec.mn/post/6259) ("2025 оны Элсэлтийн шалгалтын ХИМИ сэдэв даалгавар", archived).
- PDF: `eec.mn/wp-content/uploads/2025/06/ЭШ-2025-Хими-A-хувилбар.pdf`, fetched from the Wayback Machine through the in-app
  browser (scripted downloads are bot-blocked) → `2025/reference/official-A.pdf` (12 pages, page 1 is a periodic table;
  SHA-256 `4a3663600221594731db0a2a01d5d760c08b10b6808aefbcfb9ec16d63ff2d01`).
- Part II: ion/gas identification, weak-acid equilibrium, period-3 chlorides table (prints only a–g), organic scheme.

## 2020–2023 A — official question bank (Part I only)

- [eyeshitems.eec.mn](http://eyeshitems.eec.mn/?itemLid=9&itemVariant=A); chemistry is `itemLid=9`. The public page
  sets the year with `GET /resource/setYear/<year>`; `tools/acquire_bank.py` saves `bank-A.json/html`.
- 40 entries per year (68 points). Point splits: 2020 12 × 1 + 28 × 2; 2021 irregular; 2022–2023 22/8/10.
- Part II is not in the bank. Bank images point at `stat.eec.mn` (HTTP 521) and are not archived.
- 2023 post [eec.mn/post/4728](https://www.eec.mn/post/4728) (archived) lists `2023/10/Хими-A/B/C/D-хувилбар.pdf`; none were captured.
- 2022 and 2020 chemistry PDFs were not found in Wayback CDX listings of `eec.mn/wp-content/uploads/`.
- 2021: the official blueprint `eec.mn/wp-content/uploads/2021/04/Хими.pdf` (Wayback 2021-12-04) was saved as
  `2021/reference/official-blueprint-2021.pdf`: 100 minutes, 40 MCQ/68 + 4 tasks/32, content areas used for provisional Part II.

## 2024 — not obtained

- The answer key `eec.mn/wp-content/uploads/2024/07/Хими-түлхүүр.pdf` and papers `Хими-А/B/C/D-хувилбар.pdf` are indexed by
  search engines, but the live site returns 404 and Wayback has no capture (all four variants and the key checked).
- The bank returns no 2024 entries. [Testly.mn](https://testly.mn/) lists chemistry forms but questions need sign-in.
- No account was created, no paywall/login/API access control was bypassed, and no plugin was modified. With no reference,
  no 2024 mocks were produced.

## Third-party checks

Search covered eec.mn, ikon.mn, Scribd, fliphtml5/anyflip, studocu and Google-indexed PDFs; none supplied a usable 2020–2024
chemistry paper. Reference copies stay local under the repository's existing ignore rules.
