# Reference provenance and retrieval limits

Checked on 2026-11-08. Only years 2020–2026 were used. One A variant was selected
for each year; no other variants are needed by the authoring pack.

## Official question bank: 2020, 2021, 2022, 2023

[EEC public question bank](http://eyeshitems.eec.mn/?itemLid=8&itemVariant=A).
The public JavaScript uses `GET /resource/setYear/<year>` to set a year in the
session. Reload the Biology subject (`itemLid=8`) with `itemVariant=A`; pagination
uses `offset=2`. `tools/acquire_bank.py` documents this protocol. This used the
public interface and required no credentials.

Saved `bank-A.json` and `bank-A.html` preserve the returned entries, item IDs,
points and source image URLs. 2020 has 51 entries because A-1 appears twice;
the first is used for the provisional blueprint. Other selected years have 50
entries. The bank does not expose the complete Part II in these results.
Its old `stat.eec.mn` images return HTTP 521, and some entries point at an
author's unavailable local computer file. The extraction contains these gaps;
do not treat missing images as questions that originally had no image.

The site's `correctRow` classes are unreliable: e.g. the 2020 arthropod-class
item marks an incorrect row. No source key was imported into the mocks.

## Archived 2022 A

- [Official publication](https://eec.mn/post/2191).
- [Original PDF URL](https://eec.mn/wp-content/uploads/2022/08/for-print-A.pdf).
- [Archived PDF](https://web.archive.org/web/20240716083129/https://eec.mn/wp-content/uploads/2022/08/for-print-A.pdf).

Saved 16-page `2022/reference/official-A.pdf` unchanged, with page PNGs and text
extractions. Some font streams are damaged; MuPDF reports two stream errors.
`decoded-extraction.txt` corrects a consistent character-map offset for reading;
it is a derivative aid and does not repair clipped text or restore the original
page appearance. The official-bank text supplements Part I.

## 2023 publication

[Official publication](https://eec.mn/post/4734). Its old links return 404 on the
rebuilt site. The public bank was the accessible official Part I reference.

## 2024 A: incomplete local reference

- [Official publication](https://eec.mn/post/5322).
- [Archived publication page](https://web.archive.org/web/20240815001757/https://eec.mn/post/5322).
- [Original A PDF URL](https://eec.mn/wp-content/uploads/2024/07/%D0%91%D0%B8%D0%BE%D0%BB%D0%BE%D0%B3%D0%B8-%D0%90-%D1%85%D1%83%D0%B2%D0%B8%D0%BB%D0%B1%D0%B0%D1%80.pdf).

The archived page lists A–D and a key, but the PDFs could not be recovered.
Web search retained an indexed transcription of the 16-page official A PDF,
including figure descriptions and four Part II tasks. It was inspected for the
draft blueprint: respiration matching, a 3:1 chi-square task, recessive pedigree,
and ecology-term matching. The original images were not obtained.
**A source record and blueprint are saved, not a complete official reference.**

## Archived 2025 A

- [Official publication](https://eec.mn/post/6209).
- [Archived publication](https://web.archive.org/web/20260115030205/https://www.eec.mn/post/6209).
- [Captured official PDF](https://web.archive.org/web/20251128032011/https://eec.mn/wp-content/uploads/2025/06/%D0%AD%D0%A8-2025-%D0%91%D0%B8%D0%BE%D0%BB%D0%BE%D0%B3%D0%B8-%D0%90-%D1%85%D1%83%D0%B2%D0%B8%D0%BB%D0%B1%D0%B0%D1%80.pdf).

Saved 16-page PDF unchanged. Part II uses Simpson's `1 − Σ(n/N)²`, aerobic
respiration products, Hardy–Weinberg frequency changes and a 1:2:1 chi-square
task. The mock specifies percentage-point changes to avoid confusing them with
relative percentage changes. No official key was used.

## Official 2026 A

- [Current EEC materials](https://eec.mn/materials), event “Элсэлтийн шалгалт 2026”.
- [Public event inventory](https://eec.mn/api/events).
- [Official A download](https://eec.mn/api/files/cmuas62zo000t6295b4z1qece/download).

Saved `Biology_ESH_2026_A.pdf` as `2026/reference/official-A.pdf`, 16 pages.
The inventory offers A–D. A has 46 MCQ/76 points and four Part II tasks/24 points.
The Part II topics are water potential/plant transport, Hardy–Weinberg,
three-allele chi-square and Spearman correlation. No official key was used.

## Third-party checks

[Testly's public catalogue](https://testly.mn/eysh?limit=200) lists biology forms
for 2020–2025, generally 54 top-level tasks and 80 minutes. Its question endpoint
returned 401 without authentication; no login or access bypass was attempted.
[A Scribd 2025 A upload](https://www.scribd.com/document/910312875/) was
subscription-restricted; an indexed 2024 C upload had been deleted. Neither was
used to copy restricted questions. Archived official files were preferred.

HTTP tools could read the Wayback CDX index but replay downloads were bot-limited.
The in-app browser successfully downloaded the public archived 2022/2025 PDFs.
No account, purchase, CAPTCHA bypass, plugin modification or credential extraction
was used. Reference copies stay local under the existing repository ignore rules.
