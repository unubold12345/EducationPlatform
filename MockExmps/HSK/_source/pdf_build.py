"""Printable PDF builder for the offline HSK 1 mock pack.

This module is optional.  It needs a local ``resvg`` executable to turn the
authored SVG pictures into high-resolution PNGs for ReportLab.  The Markdown
and JSON pack builds without it.

Usage from the repository root:

    python -B MockExmps/HSK/_source/build.py --pdf
"""

from __future__ import annotations

import hashlib
import subprocess
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, Frame, Image, KeepTogether, PageBreak, PageTemplate,
    Paragraph, Spacer, Table, TableStyle,
)

import content

PACK = Path(__file__).resolve().parents[1]
ROOT = PACK.parents[1]
PDF_ASSETS = ROOT / "artifacts" / "hsk-pdf-assets"
RESVG = ROOT / "artifacts" / "resvg" / "resvg.exe"

FONT = "MSYH"
FONT_BOLD = "MSYH-Bold"
if Path(r"C:\Windows\Fonts\msyh.ttc").exists():
    pdfmetrics.registerFont(TTFont(FONT, r"C:\Windows\Fonts\msyh.ttc"))
    pdfmetrics.registerFont(TTFont(FONT_BOLD, r"C:\Windows\Fonts\msyhbd.ttc"))
    pdfmetrics.registerFontFamily(FONT, normal=FONT, bold=FONT_BOLD, italic=FONT, boldItalic=FONT_BOLD)
else:
    raise SystemExit("Microsoft YaHei is required to build the Chinese PDFs")

INK = colors.HexColor("#26323F")
MUTED = colors.HexColor("#66707A")
ACCENT = colors.HexColor("#3E8E7E")
LIGHT = colors.HexColor("#F2EEE4")
LINE = colors.HexColor("#CFC7B7")

BODY = ParagraphStyle("body", fontName=FONT, fontSize=9.4, leading=12.8, textColor=INK, spaceAfter=2)
BODY_SMALL = ParagraphStyle("body-small", parent=BODY, fontSize=8.2, leading=10.8)
PINYIN = ParagraphStyle("pinyin", fontName=FONT, fontSize=8.0, leading=10.2, textColor=MUTED)
PINYIN_SMALL = ParagraphStyle("pinyin-small", parent=PINYIN, fontSize=7.3, leading=9.2)
H1 = ParagraphStyle("h1", fontName=FONT_BOLD, fontSize=21, leading=26, textColor=INK, spaceAfter=4)
H2 = ParagraphStyle("h2", fontName=FONT_BOLD, fontSize=14.5, leading=19, textColor=INK, spaceBefore=4, spaceAfter=5)
H3 = ParagraphStyle("h3", fontName=FONT_BOLD, fontSize=11.2, leading=14.5, textColor=ACCENT, spaceBefore=7, spaceAfter=3)
CENTER = ParagraphStyle("center", parent=BODY, alignment=TA_CENTER)
CENTER_SMALL = ParagraphStyle("center-small", parent=BODY_SMALL, alignment=TA_CENTER)
LABEL = ParagraphStyle("label", parent=BODY, alignment=TA_CENTER, fontName=FONT_BOLD, fontSize=9.5, leading=11)
NOTE = ParagraphStyle("note", parent=BODY_SMALL, textColor=MUTED)
COVER_TITLE = ParagraphStyle("cover-title", fontName=FONT_BOLD, fontSize=30, leading=36, alignment=TA_CENTER, textColor=INK)
COVER_SUB = ParagraphStyle("cover-sub", fontName=FONT, fontSize=15, leading=20, alignment=TA_CENTER, textColor=ACCENT)
COVER_SMALL = ParagraphStyle("cover-small", fontName=FONT, fontSize=9, leading=13, alignment=TA_CENTER, textColor=MUTED)


def P(text: str, style: ParagraphStyle = BODY) -> Paragraph:
    return Paragraph(text, style)


def x(text: str) -> str:
    return escape(str(text))


def pinyin(text: str, style: ParagraphStyle = PINYIN) -> Paragraph:
    return Paragraph(f"<i>{x(text)}</i>", style)


def cn_pinyin(cn: str, py: str, style: ParagraphStyle = BODY, py_style: ParagraphStyle = PINYIN):
    return [P(x(cn), style), pinyin(py, py_style)]


def png_for(svg_path: Path) -> Path:
    if not RESVG.exists():
        raise SystemExit(
            f"resvg not found at {RESVG}. PDFs are optional; the Markdown/SVG pack is complete. "
            "Install resvg or run without --pdf."
        )
    PDF_ASSETS.mkdir(parents=True, exist_ok=True)
    digest = hashlib.sha256(svg_path.read_bytes()).hexdigest()[:16]
    png = PDF_ASSETS / f"{svg_path.stem}-{digest}.png"
    if not png.exists():
        subprocess.run(
            [str(RESVG), str(svg_path), str(png), "-w", "960", "-h", "720"],
            check=True, capture_output=True,
        )
    return png


def image(svg_path: Path, width_mm: float) -> Image:
    png = png_for(svg_path)
    return Image(str(png), width=width_mm * mm, height=width_mm * 0.75 * mm)


def option_row(options, width_mm=50):
    cells = []
    for option in options:
        # Image paths are relative to the form folder; the caller supplies an
        # absolute path in the option's private "_abs" key.
        cells.append([image(option["_abs"], width_mm), P(f"<b>{x(option['label'])}</b>", LABEL)])
    table = Table([cells], hAlign="CENTER")
    table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("LEFTPADDING", (0, 0), (-1, -1), 2),
        ("RIGHTPADDING", (0, 0), (-1, -1), 2),
        ("TOPPADDING", (0, 0), (-1, -1), 1),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))
    return table


def picture_grid(pictures, width_mm=48):
    rows = []
    for start in (0, 3):
        chunk = pictures[start:start + 3]
        if not chunk:
            continue
        rows.append([[image(p["_abs"], width_mm), P(f"<b>{x(p['label'])}</b>", LABEL)] for p in chunk])
    table = Table(rows, hAlign="CENTER")
    table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("LEFTPADDING", (0, 0), (-1, -1), 2),
        ("RIGHTPADDING", (0, 0), (-1, -1), 2),
        ("TOPPADDING", (0, 0), (-1, -1), 1),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))
    return table


def add_abs_paths(form: dict) -> None:
    folder = PACK / f"mock-{form['number']:02d}"
    for item in form["listening"]["part1"] + form["reading"]["part1"]:
        item["_abs"] = folder / item["image"]
    for item in form["listening"]["part2"]:
        for option in item["options"]:
            option["_abs"] = folder / option["image"]
    for picture in form["listening"]["part3"]["pictures"]:
        picture["_abs"] = folder / picture["image"]
    for picture in form["reading"]["part2"]["pictures"]:
        picture["_abs"] = folder / picture["image"]
    for collection in (
        content.EXAMPLES["listening"]["part2"]["options"],
        content.EXAMPLES["listening"]["part3"]["pictures"],
        content.EXAMPLES["reading"]["part2"]["pictures"],
    ):
        for item in collection:
            item["_abs"] = PACK / item["image"].replace("../", "")


def page_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont(FONT, 7.5)
    canvas.setFillColor(MUTED)
    canvas.drawString(18 * mm, 10 * mm, "HSK 1 original practice paper · not an official HSK test")
    canvas.drawRightString(192 * mm, 10 * mm, f"{doc.page}")
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.4)
    canvas.line(18 * mm, 13 * mm, 192 * mm, 13 * mm)
    canvas.restoreState()


def doc_for(path: Path, title: str, author: str = "Original HSK 1 practice pack"):
    doc = BaseDocTemplate(
        str(path), pagesize=A4,
        leftMargin=18 * mm, rightMargin=18 * mm,
        topMargin=16 * mm, bottomMargin=17 * mm,
        title=title, author=author,
        subject="Unofficial HSK 1 practice paper",
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="main")
    doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=page_footer)])
    return doc


def cover_story(form: dict):
    story = [Spacer(1, 28 * mm)]
    story.append(P("HSK 1 模拟考试", COVER_TITLE))
    story.append(Spacer(1, 3 * mm))
    story.append(P(f"Mock {form['number']:02d}", COVER_SUB))
    story.append(Spacer(1, 5 * mm))
    story.append(P(f"{x(form['title'])}", ParagraphStyle("ct", parent=COVER_SUB, fontSize=20, textColor=INK)))
    story.append(P(f"<i>{x(form['titlePinyin'])}</i>", COVER_SMALL))
    story.append(P(x(form["titleEn"]), ParagraphStyle("ce", parent=COVER_SMALL, fontSize=12, textColor=INK)))
    story.append(Spacer(1, 16 * mm))
    story.append(P("Original practice paper — not an official HSK test.", ParagraphStyle(
        "warn", parent=COVER_SMALL, fontSize=11, textColor=colors.HexColor("#B05048"))))
    story.append(Spacer(1, 8 * mm))

    table = Table([
        [P("<b>Section</b>", BODY_SMALL), P("<b>Items</b>", BODY_SMALL), P("<b>Time</b>", BODY_SMALL)],
        [P("Listening (4 parts)", BODY_SMALL), P("1–20", BODY_SMALL), P("about 15 min", BODY_SMALL)],
        [P("Transfer answers", BODY_SMALL), P("—", BODY_SMALL), P("3 min", BODY_SMALL)],
        [P("Reading (4 parts)", BODY_SMALL), P("21–40", BODY_SMALL), P("17 min", BODY_SMALL)],
        [P("<b>Total</b>", BODY_SMALL), P("<b>40</b>", BODY_SMALL), P("<b>about 40 min</b>", BODY_SMALL)],
    ], colWidths=[70 * mm, 30 * mm, 50 * mm], hAlign="CENTER")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), LIGHT),
        ("GRID", (0, 0), (-1, -1), 0.5, LINE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(table)
    story.append(Spacer(1, 10 * mm))
    for text in [
        "This paper follows the current regular HSK 1 (HSK 2.0) structure used for 2026 test dates: "
        "40 items, Listening 20 and Reading 20, with four five-item parts in each section.",
        "All Chinese is printed with pinyin, as in the official HSK 1 paper. The pictures are original drawings made for this pack.",
        "The listening section is read aloud by an examiner; no audio file is included. Each item is read twice.",
        "Write your answers in this booklet first. At the end of the listening section, transfer them to the answer sheet.",
        "No dictionaries, notes, phones or smart devices. This is an unofficial practice paper and does not certify an HSK level.",
    ]:
        story.append(P(text, ParagraphStyle("cover-body", parent=COVER_SMALL, fontSize=9.2, leading=13.2, alignment=TA_LEFT)))
        story.append(Spacer(1, 2.5 * mm))
    story.append(Spacer(1, 8 * mm))
    story.append(P("Name: ______________________________　　Date: __________________", COVER_SMALL))
    story.append(PageBreak())
    return story


def instruction_block(cn: str, py: str, en: str):
    return [P(f"<b>{x(cn)}</b>", BODY), pinyin(py), P(en, NOTE), Spacer(1, 2 * mm)]


def listening_story(form: dict):
    story = [P("一、听力 · Listening", H2)]
    story.append(P("The examiner reads each item twice. Mark your answer in the brackets. "
                   "The examples are not scored.", NOTE))
    story.append(Spacer(1, 3 * mm))

    # Part 1
    story.append(P("第一部分 · Part 1 (1–5)", H3))
    story += instruction_block("听录音，判断对错。", "Tīng lùyīn, pànduàn duì cuò.", "Listen and mark √ or ×.")
    ex = content.EXAMPLES["listening"]["part1"]
    story.append(KeepTogether([P("<b>Example / 例如</b>", BODY_SMALL),
                               image(PACK / "examples" / "listening-1.svg", 52),
                               P(f"{x(ex['phrase'])}　<i>{x(ex['pinyin'])}</i>　<b>√</b>", BODY_SMALL)]))
    story.append(Spacer(1, 3 * mm))
    cells = []
    for item in form["listening"]["part1"]:
        cells.append([P(f"<b>{item['n']}.</b> （　　）", BODY), image(item["_abs"], 62)])
    rows = [cells[i:i + 2] for i in range(0, len(cells), 2)]
    table = Table(rows, colWidths=[82 * mm, 82 * mm], hAlign="CENTER")
    table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(table)
    story.append(PageBreak())

    # Part 2
    story.append(P("第二部分 · Part 2 (6–10)", H3))
    story += instruction_block("听录音，选择相应的图片。", "Tīng lùyīn, xuǎnzé xiāngyìng de túpiàn.",
                               "Listen and choose the matching picture (A, B or C).")
    ex2 = content.EXAMPLES["listening"]["part2"]
    story.append(KeepTogether([P("<b>Example / 例如</b>", BODY_SMALL),
                               P(f"{x(ex2['sentence'])}　<i>{x(ex2['pinyin'])}</i>", BODY_SMALL),
                               option_row(ex2["options"], 28),
                               P("Answer: <b>A</b>", BODY_SMALL)]))
    story.append(Spacer(1, 1.5 * mm))
    for item in form["listening"]["part2"]:
        story.append(KeepTogether([
            P(f"<b>{item['n']}.</b> （　　）", BODY),
            option_row(item["options"], 30),
            Spacer(1, 1.5 * mm),
        ]))
    story.append(PageBreak())

    # Part 3
    story.append(P("第三部分 · Part 3 (11–15)", H3))
    story += instruction_block("听录音，选择相应的图片。", "Tīng lùyīn, xuǎnzé xiāngyìng de túpiàn.",
                               "Listen to each dialogue and choose its picture. One picture is not used.")
    ex3 = content.EXAMPLES["listening"]["part3"]
    story.append(P("<b>Example / 例如</b>　女：你好！ 男：你好！很高兴认识你。 — <b>A</b>", BODY_SMALL))
    story.append(Spacer(1, 2 * mm))
    story.append(picture_grid(form["listening"]["part3"]["pictures"], 50))
    story.append(Spacer(1, 4 * mm))
    numbers = Table(
        [[P(f"<b>{item['n']}.</b> （　　）", CENTER) for item in form["listening"]["part3"]["items"]]],
        colWidths=[34 * mm] * 5, hAlign="CENTER",
    )
    numbers.setStyle(TableStyle([("BOX", (0, 0), (-1, -1), 0.6, LINE),
                                 ("INNERGRID", (0, 0), (-1, -1), 0.6, LINE),
                                 ("TOPPADDING", (0, 0), (-1, -1), 5),
                                 ("BOTTOMPADDING", (0, 0), (-1, -1), 5)]))
    story.append(numbers)
    story.append(Spacer(1, 5 * mm))

    # Part 4
    story.append(P("第四部分 · Part 4 (16–20)", H3))
    story += instruction_block("听录音，选择答案。", "Tīng lùyīn, xuǎnzé dá'àn.", "Listen and choose the answer.")
    ex4 = content.EXAMPLES["listening"]["part4"]
    story.append(KeepTogether([
        P("<b>Example / 例如</b>", BODY_SMALL),
        P(f"{x(ex4['statement'])}　<i>{x(ex4['statementPinyin'])}</i>", BODY_SMALL),
        P(f"问：{x(ex4['question'])}　<i>{x(ex4['questionPinyin'])}</i>", BODY_SMALL),
        P("　".join(f"{o['label']} {x(o['text'])}（<i>{x(o['pinyin'])}</i>）" for o in ex4["options"]) + " — <b>A</b>", BODY_SMALL),
    ]))
    story.append(Spacer(1, 2 * mm))
    for item in form["listening"]["part4"]:
        story.append(KeepTogether([
            P(f"<b>{item['n']}.</b> （　　）", BODY),
            P("　".join(f"<b>{o['label']}</b> {x(o['text'])}（<i>{x(o['pinyin'])}</i>）" for o in item["options"]), BODY),
            Spacer(1, 2.5 * mm),
        ]))
    return story


def reading_story(form: dict):
    story = [P("二、阅读 · Reading", H2)]
    story.append(P("17 minutes. Mark √/× in Parts 1; choose a letter in Parts 2–4. "
                   "One picture or option is not used in Parts 2–4.", NOTE))
    story.append(Spacer(1, 3 * mm))

    # Part 1
    story.append(P("第一部分 · Part 1 (21–25)", H3))
    story += instruction_block("看图片和词语，判断对错。", "Kàn túpiàn hé cíyǔ, pànduàn duì cuò.",
                               "Look at the picture and the word; mark √ or ×.")
    ex = content.EXAMPLES["reading"]["part1"]
    story.append(KeepTogether([P("<b>Example / 例如</b>", BODY_SMALL),
                               image(PACK / "examples" / "reading-1.svg", 48),
                               P(f"{x(ex['word'])}　<i>{x(ex['pinyin'])}</i>　<b>√</b>", BODY_SMALL)]))
    story.append(Spacer(1, 2 * mm))
    cells = []
    for item in form["reading"]["part1"]:
        cells.append([P(f"<b>{item['n']}.</b> （　　）", BODY),
                      image(item["_abs"], 56),
                      P(f"<b>{x(item['word'])}</b>　<i>{x(item['pinyin'])}</i>", CENTER_SMALL)])
    rows = [cells[i:i + 2] for i in range(0, len(cells), 2)]
    table = Table(rows, colWidths=[82 * mm, 82 * mm], hAlign="CENTER")
    table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(table)
    story.append(PageBreak())

    # Part 2
    story.append(P("第二部分 · Part 2 (26–30)", H3))
    story += instruction_block("选择相应的图片。", "Xuǎnzé xiāngyìng de túpiàn.",
                               "Choose the matching picture for each sentence. One picture is not used.")
    ex2 = content.EXAMPLES["reading"]["part2"]
    story.append(P(f"<b>Example / 例如</b>　{x(ex2['sentence'])}　<i>{x(ex2['pinyin'])}</i> — <b>A</b>", BODY_SMALL))
    story.append(Spacer(1, 2 * mm))
    story.append(picture_grid(form["reading"]["part2"]["pictures"], 50))
    story.append(Spacer(1, 4 * mm))
    for item in form["reading"]["part2"]["items"]:
        story.append(KeepTogether([
            P(f"<b>{item['n']}.</b> （　　） {x(item['sentence'])}", BODY),
            pinyin(item["pinyin"]),
            Spacer(1, 2 * mm),
        ]))
    story.append(PageBreak())

    # Part 3
    story.append(P("第三部分 · Part 3 (31–35)", H3))
    story += instruction_block("找出对应的回答。", "Zhǎo chū duìyìng de huídá.", "Match each question with its answer.")
    ex3 = content.EXAMPLES["reading"]["part3"]
    story.append(P(f"<b>Example / 例如</b>　{x(ex3['question'])}　<i>{x(ex3['pinyin'])}</i> — <b>F</b> 好的，谢谢！", BODY_SMALL))
    story.append(Spacer(1, 2 * mm))
    # Two-column layout: questions left, answers right.
    left = []
    for item in form["reading"]["part3"]["items"]:
        left.append([P(f"<b>{item['n']}.</b> （　　） {x(item['question'])}", BODY), pinyin(item["pinyin"])])
    right = []
    for option in form["reading"]["part3"]["options"]:
        right.append(P(f"<b>{option['label']}</b>　{x(option['text'])}　<i>{x(option['pinyin'])}</i>", BODY_SMALL))
    table = Table([[left, right]], colWidths=[102 * mm, 68 * mm], hAlign="CENTER")
    table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"),
                               ("LEFTPADDING", (0, 0), (-1, -1), 2),
                               ("RIGHTPADDING", (0, 0), (-1, -1), 2)]))
    story.append(table)
    story.append(Spacer(1, 6 * mm))

    # Part 4
    story.append(P("第四部分 · Part 4 (36–40)", H3))
    story += instruction_block("选词填空。", "Xuǎn cí tián kòng.", "Choose the word for each blank. One option is not used.")
    ex4 = content.EXAMPLES["reading"]["part4"]
    story.append(P("<b>Example / 例如</b>　A 家　B 火车站　C 对不起　D 名字　E 看见　F 学习", BODY_SMALL))
    story.append(P(f"你叫什么（ <b>D</b> ）？　<i>{x('Nǐ jiào shénme (míngzi)?')}</i>", BODY_SMALL))
    story.append(Spacer(1, 2 * mm))
    opts = form["reading"]["part4"]["options"]
    option_cells = [P(f"<b>{o['label']}</b>　{x(o['text'])}　<i>{x(o['pinyin'])}</i>", BODY_SMALL) for o in opts]
    table = Table([option_cells[0:3], option_cells[3:6]], colWidths=[58 * mm] * 3, hAlign="CENTER")
    table.setStyle(TableStyle([("BOX", (0, 0), (-1, -1), 0.5, LINE),
                               ("INNERGRID", (0, 0), (-1, -1), 0.5, LINE),
                               ("BACKGROUND", (0, 0), (-1, -1), LIGHT),
                               ("TOPPADDING", (0, 0), (-1, -1), 4),
                               ("BOTTOMPADDING", (0, 0), (-1, -1), 4)]))
    story.append(table)
    story.append(Spacer(1, 4 * mm))
    for item in form["reading"]["part4"]["items"]:
        story.append(KeepTogether([P(f"<b>{item['n']}.</b> {x(item['sentence'])}", BODY),
                                   pinyin(item["pinyin"]),
                                   Spacer(1, 3 * mm)]))
    return story


def answer_sheet_story(form: dict):
    story = [P(f"HSK 1 Mock {form['number']:02d} — Answer sheet", H2)]
    story.append(P("Name: ______________________________　　Date: __________________　　Score: ______ / 40", BODY))
    story.append(Spacer(1, 3 * mm))
    story.append(P("Write <b>√</b> or <b>×</b> for Part 1 (items 1–5 and 21–25). "
                   "Write the letter A–F for every other item. One answer per box.", BODY_SMALL))
    story.append(Spacer(1, 4 * mm))
    for title, start in (("Listening · 1–20", 1), ("Reading · 21–40", 21)):
        story.append(P(f"<b>{title}</b>", H3))
        data = [[P("<b>Q</b>", CENTER), P("<b>Answer</b>", CENTER)] * 4]
        for row in range(start, start + 20, 4):
            data.append([
                P(f"<b>{row}</b>", CENTER), "",
                P(f"<b>{row + 1}</b>", CENTER), "",
                P(f"<b>{row + 2}</b>", CENTER), "",
                P(f"<b>{row + 3}</b>", CENTER), "",
            ])
        table = Table(data, colWidths=[13 * mm, 30 * mm] * 4,
                      rowHeights=[9 * mm] + [12 * mm] * 5, hAlign="CENTER")
        table.setStyle(TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.6, LINE),
            ("BACKGROUND", (0, 0), (-1, 0), LIGHT),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("ALIGN", (1, 1), (1, -1), "CENTER"),
            ("ALIGN", (3, 1), (3, -1), "CENTER"),
            ("ALIGN", (5, 1), (5, -1), "CENTER"),
            ("ALIGN", (7, 1), (7, -1), "CENTER"),
        ]))
        story.append(table)
        story.append(Spacer(1, 5 * mm))
    story.append(P("Marker's notes", H3))
    story.append(P("____________________________________________________________________________", BODY))
    return story


def build_booklet(form: dict, out: Path) -> None:
    add_abs_paths(form)
    doc = doc_for(out, f"HSK 1 Mock {form['number']:02d} — candidate booklet")
    story = []
    story += cover_story(form)
    story += listening_story(form)
    story.append(PageBreak())
    story += reading_story(form)
    story.append(Spacer(1, 6 * mm))
    story.append(P("End of test. Transfer your answers to the answer sheet.", BODY))
    story.append(PageBreak())
    story += answer_sheet_story(form)
    doc.build(story)


def build_answer_sheet(form: dict, out: Path) -> None:
    add_abs_paths(form)
    doc = doc_for(out, f"HSK 1 Mock {form['number']:02d} — answer sheet")
    story = answer_sheet_story(form)
    doc.build(story)


def key_table(form: dict) -> Table:
    rows = []
    for block in range(0, 40, 10):
        nums = [str(n) for n, _ in key_rows(form)[block:block + 10]]
        keys = [a for _, a in key_rows(form)[block:block + 10]]
        rows.append([P("<b>Q</b>", CENTER)] + [P(f"<b>{n}</b>", CENTER) for n in nums])
        rows.append([P("<b>Key</b>", CENTER)] + [P(f"<b>{x(k)}</b>", CENTER) for k in keys])
    table = Table(rows, colWidths=[18 * mm] + [15 * mm] * 10, hAlign="CENTER")
    table.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.5, LINE),
        ("BACKGROUND", (0, 0), (-1, -1), colors.white),
        ("BACKGROUND", (0, 0), (-1, 0), LIGHT),
        ("BACKGROUND", (0, 2), (-1, 2), LIGHT),
        ("BACKGROUND", (0, 4), (-1, 4), LIGHT),
        ("BACKGROUND", (0, 6), (-1, 6), LIGHT),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    return table


def key_rows(form: dict):
    rows = []
    for part in ("part1", "part2"):
        rows += [(item["n"], item["answer"]) for item in form["listening"][part]]
    rows += [(item["n"], item["answer"]) for item in form["listening"]["part3"]["items"]]
    rows += [(item["n"], item["answer"]) for item in form["listening"]["part4"]]
    rows += [(item["n"], item["answer"]) for item in form["reading"]["part1"]]
    rows += [(item["n"], item["answer"]) for item in form["reading"]["part2"]["items"]]
    rows += [(item["n"], item["answer"]) for item in form["reading"]["part3"]["items"]]
    rows += [(item["n"], item["answer"]) for item in form["reading"]["part4"]["items"]]
    return rows


def build_answers(form: dict, out: Path) -> None:
    doc = doc_for(out, f"HSK 1 Mock {form['number']:02d} — answer key")
    story = [P(f"HSK 1 Mock {form['number']:02d} — Answer key", H2)]
    story.append(P(f"{x(form['title'])} · <i>{x(form['titlePinyin'])}</i> · {x(form['titleEn'])}", BODY_SMALL))
    story.append(P("<b>Private examiner copy.</b> Do not give this file to a candidate during the sitting. "
                   "The examples in the booklet are not scored.", NOTE))
    story.append(Spacer(1, 3 * mm))
    story.append(key_table(form))
    story.append(Spacer(1, 5 * mm))

    story.append(P("Listening", H2))
    for title, items, kind in (
        ("Part 1 (1–5)", form["listening"]["part1"], "l1"),
        ("Part 2 (6–10)", form["listening"]["part2"], "l2"),
    ):
        story.append(P(title, H3))
        for item in items:
            text = item.get("phrase") or item.get("sentence")
            story.append(P(f"<b>{item['n']}. {x(item['answer'])}</b> — {x(text)}　<i>{x(item['pinyin'])}</i>", BODY_SMALL))
            story.append(P(x(item["explanation"]), NOTE))
            story.append(Spacer(1, 1.2 * mm))
    story.append(P("Part 3 (11–15) — transcript", H3))
    for item in form["listening"]["part3"]["items"]:
        story.append(P(f"<b>{item['n']}. {x(item['answer'])}</b>", BODY_SMALL))
        for line in item["dialogue"]:
            story.append(P(f"{x(line['speaker'])}：{x(line['text'])}　<i>{x(line['pinyin'])}</i>", BODY_SMALL))
        story.append(P(x(item["explanation"]), NOTE))
        story.append(Spacer(1, 1.5 * mm))
    story.append(P("Part 4 (16–20) — transcript", H3))
    for item in form["listening"]["part4"]:
        story.append(P(f"<b>{item['n']}. {x(item['answer'])}</b>", BODY_SMALL))
        story.append(P(f"{x(item['statement'])}　<i>{x(item['statementPinyin'])}</i>", BODY_SMALL))
        story.append(P(f"问：{x(item['question'])}　<i>{x(item['questionPinyin'])}</i>", BODY_SMALL))
        story.append(P("　".join(f"{o['label']} {x(o['text'])}" for o in item["options"]), BODY_SMALL))
        story.append(P(x(item["explanation"]), NOTE))
        story.append(Spacer(1, 1.5 * mm))

    story.append(PageBreak())
    story.append(P("Reading", H2))
    for title, items, kind in (
        ("Part 1 (21–25)", form["reading"]["part1"], "r1"),
        ("Part 2 (26–30)", form["reading"]["part2"]["items"], "r2"),
    ):
        story.append(P(title, H3))
        for item in items:
            text = item.get("word") or item.get("sentence")
            story.append(P(f"<b>{item['n']}. {x(item['answer'])}</b> — {x(text)}　<i>{x(item['pinyin'])}</i>", BODY_SMALL))
            story.append(P(x(item["explanation"]), NOTE))
            story.append(Spacer(1, 1.2 * mm))
    story.append(P("Part 3 (31–35)", H3))
    for item in form["reading"]["part3"]["items"]:
        answer = next(o for o in form["reading"]["part3"]["options"] if o["label"] == item["answer"])
        story.append(P(f"<b>{item['n']}. {x(item['answer'])}</b> — {x(item['question'])}　<i>{x(item['pinyin'])}</i>", BODY_SMALL))
        story.append(P(f"→ {x(answer['text'])}　<i>{x(answer['pinyin'])}</i>", BODY_SMALL))
        story.append(P(x(item["explanation"]), NOTE))
        story.append(Spacer(1, 1.2 * mm))
    story.append(P("Part 4 (36–40)", H3))
    for item in form["reading"]["part4"]["items"]:
        answer = next(o for o in form["reading"]["part4"]["options"] if o["label"] == item["answer"])
        story.append(P(f"<b>{item['n']}. {x(item['answer'])}</b> — {x(item['sentence'])}", BODY_SMALL))
        story.append(P(f"→ {x(answer['text'])}　<i>{x(answer['pinyin'])}</i>", BODY_SMALL))
        story.append(P(x(item["explanation"]), NOTE))
        story.append(Spacer(1, 1.2 * mm))
    story.append(P("Scoring", H2))
    story.append(P("One mark per correct answer; Listening 20, Reading 20. Practice score = 5 × correct answers "
                   "in each section out of 200; the usual HSK 1 pass mark is 120/200. This is a raw practice "
                   "conversion, not an official equated HSK score.", BODY_SMALL))
    doc.build(story)


def build_examiner(form: dict, out: Path) -> None:
    doc = doc_for(out, f"HSK 1 Mock {form['number']:02d} — examiner listening script")
    story = [P(f"HSK 1 Mock {form['number']:02d} — Examiner's listening script", H2)]
    story.append(P(f"{x(form['title'])} · <i>{x(form['titlePinyin'])}</i>", BODY_SMALL))
    story.append(P("<b>Private examiner copy.</b> Read every example and every item twice at a clear, natural beginner pace. "
                   "Do not translate, add clues or read the answer key.", NOTE))
    story.append(Spacer(1, 3 * mm))
    timing = Table([
        [P("<b>Stage</b>", BODY_SMALL), P("<b>Suggested time</b>", BODY_SMALL)],
        [P("Instructions and example", BODY_SMALL), P("2 minutes", BODY_SMALL)],
        [P("Part 1 (1–5)", BODY_SMALL), P("about 2.5 minutes", BODY_SMALL)],
        [P("Part 2 (6–10)", BODY_SMALL), P("about 2.5 minutes", BODY_SMALL)],
        [P("Part 3 (11–15)", BODY_SMALL), P("about 4 minutes", BODY_SMALL)],
        [P("Part 4 (16–20)", BODY_SMALL), P("about 4 minutes", BODY_SMALL)],
        [P("Transfer answers", BODY_SMALL), P("3 minutes", BODY_SMALL)],
    ], colWidths=[80 * mm, 60 * mm], hAlign="CENTER")
    timing.setStyle(TableStyle([("GRID", (0, 0), (-1, -1), 0.5, LINE),
                                ("BACKGROUND", (0, 0), (-1, 0), LIGHT),
                                ("TOPPADDING", (0, 0), (-1, -1), 3),
                                ("BOTTOMPADDING", (0, 0), (-1, -1), 3)]))
    story.append(timing)
    story.append(P("The official listening section is about 15 minutes. This script is designed to finish in 12–15 minutes "
                   "with the pauses below. Do not add long silent waits to fill the official window.", NOTE))
    story.append(Spacer(1, 3 * mm))

    story.append(P("Part 1 (1–5)", H3))
    story.append(P("“第一部分，一共五个题，每题听两次。听录音，判断对错。” "
                   "<i>Dì-yī bùfen, yígòng wǔ gè tí, měi tí tīng liǎng cì. Tīng lùyīn, pànduàn duì cuò.</i>", BODY_SMALL))
    story.append(P("Example: “很高兴看电影。” <i>Hěn gāoxìng kàn diànyǐng.</i> — read twice, pause 5 seconds.", BODY_SMALL))
    for item in form["listening"]["part1"]:
        story.append(P(f"<b>{item['n']}.</b> “{x(item['phrase'])}” <i>{x(item['pinyin'])}</i> — read twice; "
                       "pause 5 seconds after the first reading and 10 seconds after the second.", BODY_SMALL))
    story.append(PageBreak())

    story.append(P("Part 2 (6–10)", H3))
    story.append(P("“第二部分，一共五个题，每题听两次。听录音，选择相应的图片。” "
                   "<i>Dì-èr bùfen, yígòng wǔ gè tí, měi tí tīng liǎng cì. Tīng lùyīn, xuǎnzé xiāngyìng de túpiàn.</i>", BODY_SMALL))
    story.append(P("Example: “这是我的书。” <i>Zhè shì wǒ de shū.</i> — read twice.", BODY_SMALL))
    for item in form["listening"]["part2"]:
        story.append(P(f"<b>{item['n']}.</b> “{x(item['sentence'])}” <i>{x(item['pinyin'])}</i> — read twice; "
                       "pause 5 seconds after the first reading and 10 seconds after the second.", BODY_SMALL))
    story.append(PageBreak())

    story.append(P("Part 3 (11–15)", H3))
    story.append(P("“第三部分，一共五个题，每题听两次。听录音，选择相应的图片。” "
                   "<i>Dì-sān bùfen, yígòng wǔ gè tí, měi tí tīng liǎng cì. Tīng lùyīn, xuǎnzé xiāngyìng de túpiàn.</i>", BODY_SMALL))
    story.append(P("Example: 女：你好！ 男：你好！很高兴认识你。 — read twice.", BODY_SMALL))
    for item in form["listening"]["part3"]["items"]:
        story.append(P(f"<b>{item['n']}.</b>", BODY_SMALL))
        for line in item["dialogue"]:
            story.append(P(f"{x(line['speaker'])}：{x(line['text'])} <i>{x(line['pinyin'])}</i>", BODY_SMALL))
        story.append(P("Read the dialogue twice; pause 5 seconds after the first reading and 10 seconds after the second.", NOTE))
    story.append(PageBreak())

    story.append(P("Part 4 (16–20)", H3))
    story.append(P("“第四部分，一共五个题，每题听两次。听录音，选择答案。” "
                   "<i>Dì-sì bùfen, yígòng wǔ gè tí, měi tí tīng liǎng cì. Tīng lùyīn, xuǎnzé dá'àn.</i>", BODY_SMALL))
    story.append(P("Example: “下午我去商店，我想买一些水果。问：她去哪儿？ A 商店 B 医院 C 学校。” — read twice.", BODY_SMALL))
    for item in form["listening"]["part4"]:
        story.append(P(f"<b>{item['n']}.</b> “{x(item['statement'])} 问：{x(item['question'])} "
                       + " ".join(f"{o['label']} {x(o['text'])}" for o in item["options"]) + "。”", BODY_SMALL))
        story.append(P(f"<i>{x(item['statementPinyin'])} Wèn: {x(item['questionPinyin'])} "
                       + " ".join(f"{o['label']} {x(o['pinyin'])}" for o in item["options"]) + ".</i>", PINYIN_SMALL))
        story.append(P("Read twice; pause 5 seconds after the first reading and 10 seconds after the second.", NOTE))
    story.append(P("After the listening section: “听力考试现在结束。请把听力答案写到答题卡上。” "
                   "<i>Tīnglì kǎoshì xiànzài jiéshù. Qǐng bǎ tīnglì dá'àn xiě dào dátíkǎ shàng.</i> Allow 3 minutes.", BODY_SMALL))
    doc.build(story)


def build_all() -> None:
    for form in content.FORMS:
        folder = PACK / f"mock-{form['number']:02d}"
        build_booklet(form, folder / "booklet.pdf")
        build_answer_sheet(form, folder / "answer-sheet.pdf")
        build_answers(form, folder / "answers.pdf")
        build_examiner(form, folder / "examiner-listening.pdf")
        print("pdf", form["id"])
