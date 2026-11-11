"""Build the offline HSK 1 mock pack.

Usage (from the repository root):

    python -B MockExmps/HSK/_source/build.py

The script has no third-party dependencies.  It validates the three forms,
renders every original SVG picture, writes the candidate booklets, answer
sheets, keys, examiner scripts, structured JSON and a manifest of SHA-256
hashes.  It does not read or change website content or the database.
"""

from __future__ import annotations

import copy
import hashlib
import html
import json
import re
import sys
import xml.etree.ElementTree as ET
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import content  # noqa: E402
import scenes  # noqa: E402

PACK = HERE.parent
ROOT = PACK.parents[1]
EXAMPLES_DIR = PACK / "examples"
DATE = "2026-11-10"

# The 150-word HSK 1 syllabus (2015 list), plus 没 (the list's omitted entry 62)
# and the two everyday words 火车 and 饭馆 that the official HSK 1 sample itself
# uses.  Proper names and speaker labels are handled separately.
CORE_WORDS = """
爱 八 爸爸 杯子 北京 本 不 不客气 菜 茶 吃 出租车 打电话 大 的 点 电脑 电视
电影 东西 都 读 对不起 多 多少 儿子 二 饭店 饭馆 飞机 分钟 高兴 个 工作 狗
汉语 好 号 喝 和 很 后面 回 会 火车站 火车 几 家 叫 今天 九 开 看 看见 块
来 老师 了 冷 里 六 吗 妈妈 买 没 没关系 没有 米饭 名字 明天 哪 哪儿 那 呢
能 你 年 女儿 朋友 漂亮 苹果 七 前面 钱 请 去 热 人 认识 三 商店 上 上午
少 谁 什么 十 时候 是 书 水 水果 睡觉 说 四 岁 他 她 太 天气 听 同学 喂
我 我们 五 喜欢 下 下午 下雨 先生 现在 想 小 小姐 些 写 谢谢 星期 学生
学习 学校 一 一点儿 衣服 医生 医院 椅子 有 月 再见 在 怎么 怎么样 这 中国
中午 住 桌子 字 昨天 坐 做 猫
""".split()
PROPER = ["王月", "李月", "王", "李"]
# 女 and 男 are printed speaker labels in Reading Part 4, not vocabulary.
ALLOWED = sorted(set(CORE_WORDS + PROPER + ["女", "男"]), key=len, reverse=True)

TONE_MARKS = set("āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüńňǹ")
CJK = re.compile(r"[\u3400-\u9fff]")


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def esc(text: str) -> str:
    return html.escape(text, quote=True)


def md_img(src: str, alt: str, width: int) -> str:
    return f'<img src="{src}" alt="{esc(alt)}" width="{width}">'


def pinyin_line(text: str) -> str:
    return f"*{text}*"


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------

def segment(text: str) -> list[str]:
    out: list[str] = []
    i = 0
    while i < len(text):
        if not CJK.match(text[i]):
            i += 1
            continue
        for word in ALLOWED:
            if text.startswith(word, i):
                out.append(word)
                i += len(word)
                break
        else:
            out.append("?" + text[i])
            i += 1
    return out


def texts_in(obj, path=""):
    if isinstance(obj, dict):
        for key, value in obj.items():
            if key in {
                "pinyin", "statementPinyin", "questionPinyin", "titlePinyin",
                "titleEn", "alt", "scene", "id", "explanation", "theme",
                "speaker",
            }:
                continue
            yield from texts_in(value, f"{path}/{key}")
    elif isinstance(obj, list):
        for index, value in enumerate(obj):
            yield from texts_in(value, f"{path}[{index}]")
    elif isinstance(obj, str):
        yield path, obj


def validate_form(form: dict) -> dict:
    errors: list[str] = []
    warnings: list[str] = []
    numbers: list[int] = []
    sections = {
        "listening-1": form["listening"]["part1"],
        "listening-2": form["listening"]["part2"],
        "listening-3": form["listening"]["part3"]["items"],
        "listening-4": form["listening"]["part4"],
        "reading-1": form["reading"]["part1"],
        "reading-2": form["reading"]["part2"]["items"],
        "reading-3": form["reading"]["part3"]["items"],
        "reading-4": form["reading"]["part4"]["items"],
    }
    for name, items in sections.items():
        if len(items) != 5:
            errors.append(f"{form['id']}: {name} has {len(items)} items, expected 5")
        for item in items:
            numbers.append(item["n"])
    if numbers != list(range(1, 41)):
        errors.append(f"{form['id']}: question numbers are not 1..40: {numbers}")

    for part, expected in (
        ("part1", {"√", "×"}),
        ("part2", {"A", "B", "C"}),
        ("part4", {"A", "B", "C"}),
    ):
        for item in form["listening"][part]:
            if item["answer"] not in expected:
                errors.append(f"{form['id']} Q{item['n']}: answer {item['answer']!r} not in {expected}")
    for item in form["listening"]["part3"]["items"]:
        if item["answer"] not in {p["label"] for p in form["listening"]["part3"]["pictures"]}:
            errors.append(f"{form['id']} Q{item['n']}: answer picture missing")
    for part, expected in (("part1", {"√", "×"}),):
        for item in form["reading"][part]:
            if item["answer"] not in expected:
                errors.append(f"{form['id']} Q{item['n']}: answer {item['answer']!r} not in {expected}")
    for item in form["reading"]["part2"]["items"]:
        if item["answer"] not in {p["label"] for p in form["reading"]["part2"]["pictures"]}:
            errors.append(f"{form['id']} Q{item['n']}: answer picture missing")
    for part in ("part3", "part4"):
        labels = {o["label"] for o in form["reading"][part]["options"]}
        if labels != set("ABCDEF"):
            errors.append(f"{form['id']} reading {part}: option labels are {sorted(labels)}")
        for item in form["reading"][part]["items"]:
            if item["answer"] not in labels:
                errors.append(f"{form['id']} Q{item['n']}: answer {item['answer']!r} not in options")

    # Each item must have a pinyin field with at least one tone mark or a
    # recognised neutral-tone syllable.  This is a typo guard, not a
    # replacement for human review.
    pinyin_strings: list[tuple[str, str]] = []
    # Collect pinyin explicitly.
    def collect_pinyin(obj, path=""):
        if isinstance(obj, dict):
            for key, value in obj.items():
                if key in {"pinyin", "statementPinyin", "questionPinyin", "titlePinyin"}:
                    yield path + "/" + key, value
                else:
                    yield from collect_pinyin(value, path + "/" + str(key))
        elif isinstance(obj, list):
            for index, value in enumerate(obj):
                yield from collect_pinyin(value, path + f"[{index}]")

    for path, pinyin in collect_pinyin(form):
        if not pinyin.strip():
            errors.append(f"{form['id']} {path}: empty pinyin")
            continue
        if CJK.search(pinyin):
            errors.append(f"{form['id']} {path}: Chinese character in pinyin: {pinyin!r}")
        if not (set(pinyin) & TONE_MARKS):
            # Short neutral-tone-only strings are allowed (de, le, ma, ne, ge,
            # a name read in neutral tone), but a whole sentence with no tone
            # mark is almost certainly a mistake.
            if len(re.findall(r"[a-zA-Zü]+", pinyin)) > 3:
                warnings.append(f"{form['id']} {path}: no tone mark in {pinyin!r}")
        pinyin_strings.append((path, pinyin))

    # Vocabulary coverage.
    for path, text in texts_in(form):
        unknown = [part for part in segment(text) if part.startswith("?")]
        if unknown:
            errors.append(f"{form['id']} {path}: outside HSK 1 list: {''.join(unknown)} ({text!r})")

    # Duplicate stems within one form.
    stems = []
    for part in ("part1", "part2"):
        for item in form["listening"][part]:
            stems.append(item.get("sentence") or item.get("phrase"))
    for item in form["listening"]["part3"]["items"]:
        stems.append(" ".join(line["text"] for line in item["dialogue"]))
    for item in form["listening"]["part4"]:
        stems.append(item["statement"] + " " + item["question"])
    for item in form["reading"]["part1"]:
        stems.append(item["word"])
    for item in form["reading"]["part2"]["items"]:
        stems.append(item["sentence"])
    for item in form["reading"]["part3"]["items"]:
        stems.append(item["question"])
    for item in form["reading"]["part4"]["items"]:
        stems.append(item["sentence"])
    for stem, count in Counter(stems).items():
        if count > 1:
            errors.append(f"{form['id']}: repeated stem {stem!r} ({count})")

    # Scene existence.
    def collect_scenes(obj):
        if isinstance(obj, dict):
            if "scene" in obj and obj["scene"] not in scenes.SCENES:
                errors.append(f"{form['id']}: unknown scene {obj['scene']!r}")
            for value in obj.values():
                collect_scenes(value)
        elif isinstance(obj, list):
            for value in obj:
                collect_scenes(value)

    collect_scenes(form)

    answers = []
    for part in ("part1", "part2"):
        answers.extend(item["answer"] for item in form["listening"][part])
    answers.extend(item["answer"] for item in form["listening"]["part3"]["items"])
    answers.extend(item["answer"] for item in form["listening"]["part4"])
    answers.extend(item["answer"] for item in form["reading"]["part1"])
    answers.extend(item["answer"] for item in form["reading"]["part2"]["items"])
    answers.extend(item["answer"] for item in form["reading"]["part3"]["items"])
    answers.extend(item["answer"] for item in form["reading"]["part4"]["items"])

    return {
        "form": form["id"],
        "items": len(numbers),
        "numbers": numbers,
        "counts": {name: len(items) for name, items in sections.items()},
        "answerDistribution": dict(sorted(Counter(answers).items())),
        "errors": errors,
        "warnings": warnings,
    }


def validate_all() -> list[dict]:
    if len(content.FORMS) != 3:
        raise SystemExit("expected exactly three forms")
    reports = [validate_form(form) for form in content.FORMS]
    errors = [error for report in reports for error in report["errors"]]
    if errors:
        for error in errors:
            print("ERROR:", error)
        raise SystemExit(f"{len(errors)} validation error(s)")
    warnings = [warning for report in reports for warning in report["warnings"]]
    for warning in warnings:
        print("WARN:", warning)
    return reports


# ---------------------------------------------------------------------------
# Image generation
# ---------------------------------------------------------------------------

def write_svg(path: Path, scene: str, variant: int) -> None:
    svg = scenes.render(scene, variant)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(svg, encoding="utf-8")
    ET.fromstring(svg)  # valid XML


def generate_images() -> dict:
    images: dict[str, dict] = {}
    EXAMPLES_DIR.mkdir(parents=True, exist_ok=True)
    example_specs = {
        "listening-1.svg": (content.EXAMPLES["listening"]["part1"]["scene"], 3),
        "reading-1.svg": (content.EXAMPLES["reading"]["part1"]["scene"], 3),
    }
    for label in "ABC":
        example_specs[f"listening-2-{label.lower()}.svg"] = (
            next(o["scene"] for o in content.EXAMPLES["listening"]["part2"]["options"] if o["label"] == label), 3)
    for label in "ABCDEF":
        example_specs[f"listening-3-{label.lower()}.svg"] = (
            next(p["scene"] for p in content.EXAMPLES["listening"]["part3"]["pictures"] if p["label"] == label), 3)
        example_specs[f"reading-2-{label.lower()}.svg"] = (
            next(p["scene"] for p in content.EXAMPLES["reading"]["part2"]["pictures"] if p["label"] == label), 3)
    for name, (scene, variant) in example_specs.items():
        path = EXAMPLES_DIR / name
        write_svg(path, scene, variant)
        images[f"examples/{name}"] = {"scene": scene, "variant": variant, "sha256": sha256(path)}

    # Give the example objects their image paths for the Markdown renderer.
    content.EXAMPLES["listening"]["part1"]["image"] = "../examples/listening-1.svg"
    content.EXAMPLES["reading"]["part1"]["image"] = "../examples/reading-1.svg"
    content.EXAMPLES["listening"]["part2"]["options"][0]["image"] = "../examples/listening-2-a.svg"
    content.EXAMPLES["listening"]["part2"]["options"][1]["image"] = "../examples/listening-2-b.svg"
    content.EXAMPLES["listening"]["part2"]["options"][2]["image"] = "../examples/listening-2-c.svg"
    for picture in content.EXAMPLES["listening"]["part3"]["pictures"]:
        picture["image"] = f"../examples/listening-3-{picture['label'].lower()}.svg"
    for picture in content.EXAMPLES["reading"]["part2"]["pictures"]:
        picture["image"] = f"../examples/reading-2-{picture['label'].lower()}.svg"

    for form in content.FORMS:
        form_dir = PACK / f"mock-{form['number']:02d}" / "images"
        if form_dir.exists():
            for old in form_dir.glob("*.svg"):
                old.unlink()
        form_dir.mkdir(parents=True, exist_ok=True)
        variant = form["number"]
        for item in form["listening"]["part1"]:
            name = f"listening-{item['n']:02d}.svg"
            path = form_dir / name
            write_svg(path, item["scene"], variant)
            item["image"] = f"images/{name}"
            images[f"{form['id']}/{name}"] = {"scene": item["scene"], "variant": variant, "sha256": sha256(path)}
        for item in form["listening"]["part2"]:
            for option in item["options"]:
                name = f"listening-{item['n']:02d}-{option['label'].lower()}.svg"
                path = form_dir / name
                write_svg(path, option["scene"], variant)
                option["image"] = f"images/{name}"
                images[f"{form['id']}/{name}"] = {"scene": option["scene"], "variant": variant, "sha256": sha256(path)}
        for picture in form["listening"]["part3"]["pictures"]:
            name = f"listening-picture-{picture['label'].lower()}.svg"
            path = form_dir / name
            write_svg(path, picture["scene"], variant)
            picture["image"] = f"images/{name}"
            images[f"{form['id']}/{name}"] = {"scene": picture["scene"], "variant": variant, "sha256": sha256(path)}
        for item in form["reading"]["part1"]:
            name = f"reading-{item['n']:02d}.svg"
            path = form_dir / name
            write_svg(path, item["scene"], variant)
            item["image"] = f"images/{name}"
            images[f"{form['id']}/{name}"] = {"scene": item["scene"], "variant": variant, "sha256": sha256(path)}
        for picture in form["reading"]["part2"]["pictures"]:
            name = f"reading-picture-{picture['label'].lower()}.svg"
            path = form_dir / name
            write_svg(path, picture["scene"], variant)
            picture["image"] = f"images/{name}"
            images[f"{form['id']}/{name}"] = {"scene": picture["scene"], "variant": variant, "sha256": sha256(path)}
    return images


# ---------------------------------------------------------------------------
# Markdown rendering
# ---------------------------------------------------------------------------

def option_table(options: list[dict], image_key: str = "image", width: int = 190) -> str:
    cells = []
    for option in options:
        alt = option.get("alt", option.get("label", ""))
        cells.append(
            f'<td align="center" valign="top">{md_img(option[image_key], alt, width)}'
            f'<br><b>{option["label"]}</b></td>'
        )
    return "<table><tr>" + "".join(cells) + "</tr></table>"


def picture_grid(pictures: list[dict], width: int = 190) -> str:
    rows = []
    for start in (0, 3):
        chunk = pictures[start:start + 3]
        if not chunk:
            continue
        cells = []
        for picture in chunk:
            cells.append(
                f'<td align="center" valign="top">{md_img(picture["image"], picture["alt"], width)}'
                f'<br><b>{picture["label"]}</b></td>'
            )
        rows.append("<tr>" + "".join(cells) + "</tr>")
    return "<table>" + "".join(rows) + "</table>"


def render_questions_md(form: dict) -> str:
    f = form
    out: list[str] = []
    out.append(f"# HSK 1 Mock {f['number']:02d} — {f['title']}")
    out.append("")
    out.append(f"*{f['titlePinyin']}* · **{f['titleEn']}**")
    out.append("")
    out.append("**Original practice paper — not an official HSK test.**  ")
    out.append("Follows the current regular HSK 1 (HSK 2.0) structure used for 2026 test dates: "
               "Listening 20 items, Reading 20 items, about 40 minutes including 5 minutes for personal information. "
               "All Chinese is printed with pinyin, as in the official HSK 1 paper. No audio file is included; "
               "the listening section is read aloud by an examiner. See `ADMINISTRATION.md`.")
    out.append("")
    out.append("| Part | Items | Suggested time |")
    out.append("| --- | ---: | ---: |")
    out.append("| Listening 1–4 | 1–20 | about 15 minutes |")
    out.append("| Transfer listening answers | — | 3 minutes |")
    out.append("| Reading 1–4 | 21–40 | 17 minutes |")
    out.append("| **Total** | **40** | **about 35 minutes + 5 minutes personal information** |")
    out.append("")
    out.append("---")
    out.append("")
    out.append("## 一、听力 · Listening")
    out.append("")

    # Part 1
    out.append("### 第一部分 · Part 1 (1–5)")
    out.append("")
    out.append("听录音，判断对错。 *Tīng lùyīn, pànduàn duì cuò.* Listen and mark **√** or **×**.")
    out.append("")
    out.append("**Example / 例如**  ")
    out.append(md_img("../examples/listening-1.svg", content.EXAMPLES["listening"]["part1"]["alt"], 230))
    out.append("")
    out.append(f"{content.EXAMPLES['listening']['part1']['phrase']} "
               f"{pinyin_line(content.EXAMPLES['listening']['part1']['pinyin'])} — **√**")
    out.append("")
    for item in f["listening"]["part1"]:
        out.append(f"**{item['n']}.** （　　）")
        out.append("")
        out.append(md_img(item["image"], item["alt"], 230))
        out.append("")

    # Part 2
    out.append("### 第二部分 · Part 2 (6–10)")
    out.append("")
    out.append("听录音，选择相应的图片。 *Tīng lùyīn, xuǎnzé xiāngyìng de túpiàn.* Listen and choose the matching picture.")
    out.append("")
    out.append("**Example / 例如**  ")
    out.append(f"{content.EXAMPLES['listening']['part2']['sentence']} "
               f"{pinyin_line(content.EXAMPLES['listening']['part2']['pinyin'])}")
    out.append("")
    out.append(option_table(content.EXAMPLES["listening"]["part2"]["options"], width=170))
    out.append("")
    out.append("Answer: **A**")
    out.append("")
    for item in f["listening"]["part2"]:
        out.append(f"**{item['n']}.** （　　）")
        out.append("")
        out.append(option_table(item["options"], width=170))
        out.append("")

    # Part 3
    out.append("### 第三部分 · Part 3 (11–15)")
    out.append("")
    out.append("听录音，选择相应的图片。 *Tīng lùyīn, xuǎnzé xiāngyìng de túpiàn.* "
               "Listen to each dialogue and choose its picture. One picture is not used.")
    out.append("")
    out.append("**Example / 例如**  ")
    out.append("女：你好！ 男：你好！很高兴认识你。  ")
    out.append("*Nǚ: Nǐ hǎo! Nán: Nǐ hǎo! Hěn gāoxìng rènshi nǐ.* — **A**")
    out.append("")
    out.append(picture_grid(content.EXAMPLES["listening"]["part3"]["pictures"], width=150))
    out.append("")
    out.append(picture_grid(f["listening"]["part3"]["pictures"], width=170))
    out.append("")
    out.append(" | ".join(f"**{item['n']}.** （　　）" for item in f["listening"]["part3"]["items"]))
    out.append("")

    # Part 4
    out.append("### 第四部分 · Part 4 (16–20)")
    out.append("")
    out.append("听录音，选择答案。 *Tīng lùyīn, xuǎnzé dá'àn.* Listen and choose the answer.")
    out.append("")
    ex = content.EXAMPLES["listening"]["part4"]
    out.append("**Example / 例如**  ")
    out.append(f"{ex['statement']} *{ex['statementPinyin']}*  ")
    out.append(f"问：{ex['question']} *{ex['questionPinyin']}*  ")
    out.append("A 商店（*shāngdiàn*）　B 医院（*yīyuàn*）　C 学校（*xuéxiào*） — **A**")
    out.append("")
    for item in f["listening"]["part4"]:
        out.append(f"**{item['n']}.** （　　）")
        out.append("")
        out.append("　".join(f"**{o['label']}** {o['text']}（*{o['pinyin']}*）" for o in item["options"]))
        out.append("")

    out.append("---")
    out.append("")
    out.append("## 二、阅读 · Reading")
    out.append("")

    # Reading Part 1
    out.append("### 第一部分 · Part 1 (21–25)")
    out.append("")
    out.append("看图片和词语，判断对错。 *Kàn túpiàn hé cíyǔ, pànduàn duì cuò.* "
               "Look at the picture and the word; mark **√** or **×**.")
    out.append("")
    ex = content.EXAMPLES["reading"]["part1"]
    out.append("**Example / 例如**  ")
    out.append(md_img("../examples/reading-1.svg", ex["alt"], 210))
    out.append("")
    out.append(f"飞机 *fēijī* — **√**")
    out.append("")
    for item in f["reading"]["part1"]:
        out.append(f"**{item['n']}.** （　　）")
        out.append("")
        out.append(md_img(item["image"], item["alt"], 210))
        out.append("")
        out.append(f"**{item['word']}** *{item['pinyin']}*")
        out.append("")

    # Reading Part 2
    out.append("### 第二部分 · Part 2 (26–30)")
    out.append("")
    out.append("选择相应的图片。 *Xuǎnzé xiāngyìng de túpiàn.* Choose the matching picture for each sentence. "
               "One picture is not used.")
    out.append("")
    ex = content.EXAMPLES["reading"]["part2"]
    out.append("**Example / 例如**  ")
    out.append(f"{ex['sentence']} *{ex['pinyin']}* — **A**")
    out.append("")
    out.append(picture_grid(ex["pictures"], width=150))
    out.append("")
    out.append(picture_grid(f["reading"]["part2"]["pictures"], width=170))
    out.append("")
    for item in f["reading"]["part2"]["items"]:
        out.append(f"**{item['n']}.** （　　） {item['sentence']}  ")
        out.append(pinyin_line(item["pinyin"]))
        out.append("")

    # Reading Part 3
    out.append("### 第三部分 · Part 3 (31–35)")
    out.append("")
    out.append("找出对应的回答。 *Zhǎo chū duìyìng de huídá.* Match each question with its answer.")
    out.append("")
    ex = content.EXAMPLES["reading"]["part3"]
    out.append("**Example / 例如**  ")
    out.append(f"{ex['question']} *{ex['pinyin']}* — **F** 好的，谢谢！")
    out.append("")
    out.append("| | Answer |")
    out.append("| --- | --- |")
    for option in f["reading"]["part3"]["options"]:
        out.append(f"| **{option['label']}** | {option['text']} *{option['pinyin']}* |")
    out.append("")
    for item in f["reading"]["part3"]["items"]:
        out.append(f"**{item['n']}.** （　　） {item['question']}  ")
        out.append(pinyin_line(item["pinyin"]))
        out.append("")

    # Reading Part 4
    out.append("### 第四部分 · Part 4 (36–40)")
    out.append("")
    out.append("选词填空。 *Xuǎn cí tián kòng.* Choose the word for each blank. One option is not used.")
    out.append("")
    ex = content.EXAMPLES["reading"]["part4"]
    out.append("**Example / 例如**  ")
    out.append("A 家　B 火车站　C 对不起　D 名字　E 看见　F 学习  ")
    out.append(f"你叫什么（ **D** ）？ *Nǐ jiào shénme (míngzi)?*")
    out.append("")
    out.append("| | Word | | Word |")
    out.append("| --- | --- | --- | --- |")
    opts = f["reading"]["part4"]["options"]
    for i in range(0, 6, 2):
        left = opts[i]
        right = opts[i + 1]
        out.append(f"| **{left['label']}** | {left['text']} *{left['pinyin']}* | "
                   f"**{right['label']}** | {right['text']} *{right['pinyin']}* |")
    out.append("")
    for item in f["reading"]["part4"]["items"]:
        out.append(f"**{item['n']}.** {item['sentence']}  ")
        out.append(pinyin_line(item["pinyin"]))
        out.append("")

    out.append("---")
    out.append("")
    out.append("**End of test.** Transfer your answers to the answer sheet. "
               "Do not turn to the answer key until the sitting is finished.")
    out.append("")
    return "\n".join(out)


def render_answer_sheet_md(form: dict) -> str:
    out = []
    out.append(f"# HSK 1 Mock {form['number']:02d} — Answer sheet")
    out.append("")
    out.append("Name: ______________________　Date: ______________　Score: ______ / 40")
    out.append("")
    out.append("Write **√** or **×** for Parts 1; write the letter for every other item. "
               "Use a pencil and keep one answer per box.")
    out.append("")
    out.append("| Q | Answer | Q | Answer | Q | Answer | Q | Answer |")
    out.append("| ---: | :---: | ---: | :---: | ---: | :---: | ---: | :---: |")
    for n in range(1, 11):
        row = [n, "", n + 10, "", n + 20, "", n + 30, ""]
        out.append("| " + " | ".join(str(x) for x in row) + " |")
    out.append("")
    out.append("Listening: 1–20　　Reading: 21–40")
    out.append("")
    out.append("Marker's notes:")
    out.append("")
    out.append("____________________________________________________________________________")
    return "\n".join(out)


def key_rows(form: dict) -> list[tuple[int, str]]:
    rows: list[tuple[int, str]] = []
    for part in ("part1", "part2"):
        rows += [(item["n"], item["answer"]) for item in form["listening"][part]]
    rows += [(item["n"], item["answer"]) for item in form["listening"]["part3"]["items"]]
    rows += [(item["n"], item["answer"]) for item in form["listening"]["part4"]]
    rows += [(item["n"], item["answer"]) for item in form["reading"]["part1"]]
    rows += [(item["n"], item["answer"]) for item in form["reading"]["part2"]["items"]]
    rows += [(item["n"], item["answer"]) for item in form["reading"]["part3"]["items"]]
    rows += [(item["n"], item["answer"]) for item in form["reading"]["part4"]["items"]]
    return rows


def render_answers_md(form: dict) -> str:
    out = []
    out.append(f"# HSK 1 Mock {form['number']:02d} — Answer key and explanations")
    out.append("")
    out.append(f"*{form['title']} · {form['titlePinyin']} · {form['titleEn']}*")
    out.append("")
    out.append("**Private examiner copy. Do not give this file to a candidate during the sitting.** "
               "All keys and explanations are original. The examples in the booklet are not scored.")
    out.append("")
    out.append("## Quick key")
    out.append("")
    rows = key_rows(form)
    for block in range(0, 40, 10):
        chunk = rows[block:block + 10]
        out.append("| Q | " + " | ".join(str(n) for n, _ in chunk) + " |")
        out.append("| ---: | " + " | ".join(":---:" for _ in chunk) + " |")
        out.append("| **Key** | " + " | ".join(a for _, a in chunk) + " |")
        out.append("")
    out.append("## Listening")
    out.append("")
    out.append("### Part 1 (1–5)")
    out.append("")
    for item in form["listening"]["part1"]:
        out.append(f"**{item['n']}. {item['answer']}** — {item['phrase']} *{item['pinyin']}*  ")
        out.append(item["explanation"])
        out.append("")
    out.append("### Part 2 (6–10)")
    out.append("")
    for item in form["listening"]["part2"]:
        labels = "　".join(f"{o['label']} {o['alt']}" for o in item["options"])
        out.append(f"**{item['n']}. {item['answer']}** — {item['sentence']} *{item['pinyin']}*  ")
        out.append(f"Options: {labels}  ")
        out.append(item["explanation"])
        out.append("")
    out.append("### Part 3 (11–15) — transcript")
    out.append("")
    for item in form["listening"]["part3"]["items"]:
        out.append(f"**{item['n']}. {item['answer']}**  ")
        for line in item["dialogue"]:
            out.append(f"{line['speaker']}：{line['text']} *{line['pinyin']}*  ")
        out.append(item["explanation"])
        out.append("")
    out.append("### Part 4 (16–20) — transcript")
    out.append("")
    for item in form["listening"]["part4"]:
        out.append(f"**{item['n']}. {item['answer']}**  ")
        out.append(f"{item['statement']} *{item['statementPinyin']}*  ")
        out.append(f"问：{item['question']} *{item['questionPinyin']}*  ")
        out.append("　".join(f"{o['label']} {o['text']} *{o['pinyin']}*" for o in item["options"]) + "  ")
        out.append(item["explanation"])
        out.append("")
    out.append("## Reading")
    out.append("")
    out.append("### Part 1 (21–25)")
    out.append("")
    for item in form["reading"]["part1"]:
        out.append(f"**{item['n']}. {item['answer']}** — {item['word']} *{item['pinyin']}*  ")
        out.append(item["explanation"])
        out.append("")
    out.append("### Part 2 (26–30)")
    out.append("")
    for item in form["reading"]["part2"]["items"]:
        out.append(f"**{item['n']}. {item['answer']}** — {item['sentence']} *{item['pinyin']}*  ")
        out.append(item["explanation"])
        out.append("")
    out.append("### Part 3 (31–35)")
    out.append("")
    for item in form["reading"]["part3"]["items"]:
        answer = next(o for o in form["reading"]["part3"]["options"] if o["label"] == item["answer"])
        out.append(f"**{item['n']}. {item['answer']}** — {item['question']} *{item['pinyin']}*  ")
        out.append(f"→ {answer['text']} *{answer['pinyin']}*  ")
        out.append(item["explanation"])
        out.append("")
    out.append("### Part 4 (36–40)")
    out.append("")
    for item in form["reading"]["part4"]["items"]:
        answer = next(o for o in form["reading"]["part4"]["options"] if o["label"] == item["answer"])
        out.append(f"**{item['n']}. {item['answer']}** — {item['sentence']}  ")
        out.append(f"→ {answer['text']} *{answer['pinyin']}*  ")
        out.append(item["explanation"])
        out.append("")
    out.append("## Scoring")
    out.append("")
    out.append("One mark for each correct answer; no mark for a wrong or blank answer. "
               "Listening has 20 marks and Reading has 20 marks. The raw practice score is "
               "**5 × correct answers in each section** out of 200, and the usual HSK 1 pass mark is 120/200. "
               "This conversion is for practice only; it is not an official equated HSK score and does not certify a level.")
    out.append("")
    out.append("| Section | Items | Raw marks | Practice score |")
    out.append("| --- | ---: | ---: | ---: |")
    out.append("| Listening | 20 | ___ / 20 | ___ / 100 |")
    out.append("| Reading | 20 | ___ / 20 | ___ / 100 |")
    out.append("| **Total** | **40** | **___ / 40** | **___ / 200** |")
    out.append("")
    return "\n".join(out)


def render_examiner_md(form: dict) -> str:
    out = []
    out.append(f"# HSK 1 Mock {form['number']:02d} — examiner's listening script")
    out.append("")
    out.append(f"*{form['title']} · {form['titlePinyin']}*")
    out.append("")
    out.append("**Private examiner copy.** The candidate booklet does not print the listening texts. "
               "Read at a clear, natural beginner pace. Read every example and every item **twice**. "
               "Do not translate, add clues, or read the answer key.")
    out.append("")
    out.append("## Timing")
    out.append("")
    out.append("| Stage | Suggested time |")
    out.append("| --- | ---: |")
    out.append("| Instructions and example | 2 minutes |")
    out.append("| Part 1 (1–5) | about 2.5 minutes |")
    out.append("| Part 2 (6–10) | about 2.5 minutes |")
    out.append("| Part 3 (11–15) | about 4 minutes |")
    out.append("| Part 4 (16–20) | about 4 minutes |")
    out.append("| Transfer answers | 3 minutes |")
    out.append("")
    out.append("The exact reading speed varies. The official listening section is about 15 minutes; "
               "this script is designed to finish in 12–15 minutes with the pauses below. "
               "Do not add long silent waits to fill the official window.")
    out.append("")
    out.append("## Before Part 1")
    out.append("")
    out.append("“HSK 一级模拟考试，听力现在开始。” *HSK yījí mónǐ kǎoshì, tīnglì xiànzài kāishǐ.* "
               "Pause 5 seconds. Read the instructions for each part once, then begin.")
    out.append("")
    out.append("## Part 1 (1–5)")
    out.append("")
    out.append("Instruction: “第一部分，一共五个题，每题听两次。听录音，判断对错。” "
               "*Dì-yī bùfen, yígòng wǔ gè tí, měi tí tīng liǎng cì. Tīng lùyīn, pànduàn duì cuò.*")
    out.append("")
    out.append("### Example")
    out.append("")
    out.append("“例如：很高兴看电影。” *Lìrú: Hěn gāoxìng kàn diànyǐng.* — read twice, pause 5 seconds. "
               "The booklet shows the example answer √.")
    out.append("")
    for item in form["listening"]["part1"]:
        out.append(f"### {item['n']}")
        out.append("")
        out.append(f"“{item['phrase']}” *{item['pinyin']}* — read twice. Pause 5 seconds after the first reading "
                   "and 10 seconds after the second.")
        out.append("")
    out.append("## Part 2 (6–10)")
    out.append("")
    out.append("Instruction: “第二部分，一共五个题，每题听两次。听录音，选择相应的图片。” "
               "*Dì-èr bùfen, yígòng wǔ gè tí, měi tí tīng liǎng cì. Tīng lùyīn, xuǎnzé xiāngyìng de túpiàn.*")
    out.append("")
    out.append("### Example")
    out.append("")
    out.append("“这是我的书。” *Zhè shì wǒ de shū.* — read twice. The booklet shows answer A.")
    out.append("")
    for item in form["listening"]["part2"]:
        out.append(f"### {item['n']}")
        out.append("")
        out.append(f"“{item['sentence']}” *{item['pinyin']}* — read twice. Pause 5 seconds after the first reading "
                   "and 10 seconds after the second.")
        out.append("")
    out.append("## Part 3 (11–15)")
    out.append("")
    out.append("Instruction: “第三部分，一共五个题，每题听两次。听录音，选择相应的图片。” "
               "*Dì-sān bùfen, yígòng wǔ gè tí, měi tí tīng liǎng cì. Tīng lùyīn, xuǎnzé xiāngyìng de túpiàn.*")
    out.append("")
    out.append("### Example")
    out.append("")
    out.append("女：你好！ *Nǐ hǎo!*  ")
    out.append("男：你好！很高兴认识你。 *Nǐ hǎo! Hěn gāoxìng rènshi nǐ.* — read twice. The booklet shows answer A.")
    out.append("")
    for item in form["listening"]["part3"]["items"]:
        out.append(f"### {item['n']}")
        out.append("")
        for line in item["dialogue"]:
            out.append(f"{line['speaker']}：{line['text']} *{line['pinyin']}*  ")
        out.append("Read the dialogue twice. Pause 5 seconds after the first reading and 10 seconds after the second.")
        out.append("")
    out.append("## Part 4 (16–20)")
    out.append("")
    out.append("Instruction: “第四部分，一共五个题，每题听两次。听录音，选择答案。” "
               "*Dì-sì bùfen, yígòng wǔ gè tí, měi tí tīng liǎng cì. Tīng lùyīn, xuǎnzé dá'àn.*")
    out.append("")
    out.append("### Example")
    out.append("")
    out.append("“下午我去商店，我想买一些水果。问：她去哪儿？ A 商店 B 医院 C 学校。” "
               "*Xiàwǔ wǒ qù shāngdiàn, wǒ xiǎng mǎi yìxiē shuǐguǒ. Wèn: Tā qù nǎr? A shāngdiàn B yīyuàn C xuéxiào.* "
               "— read twice. The booklet shows answer A.")
    out.append("")
    for item in form["listening"]["part4"]:
        out.append(f"### {item['n']}")
        out.append("")
        out.append(f"“{item['statement']} 问：{item['question']} "
                   + " ".join(f"{o['label']} {o['text']}" for o in item["options"]) + "。”  ")
        out.append(f"*{item['statementPinyin']} Wèn: {item['questionPinyin']} "
                   + " ".join(f"{o['label']} {o['pinyin']}" for o in item["options"]) + ".*  ")
        out.append("Read the statement, question and three options twice. Pause 5 seconds after the first reading "
                   "and 10 seconds after the second.")
        out.append("")
    out.append("## After the listening section")
    out.append("")
    out.append("“听力考试现在结束。请把听力答案写到答题卡上。” *Tīnglì kǎoshì xiànzài jiéshù. "
               "Qǐng bǎ tīnglì dá'àn xiě dào dátíkǎ shàng.* Allow 3 minutes, then start the Reading section.")
    out.append("")
    return "\n".join(out)


# ---------------------------------------------------------------------------
# JSON and manifest
# ---------------------------------------------------------------------------

def form_json(form: dict, images: dict) -> dict:
    def with_images(obj):
        if isinstance(obj, dict):
            out = {}
            for key, value in obj.items():
                out[key] = with_images(value)
            return out
        if isinstance(obj, list):
            return [with_images(value) for value in obj]
        return obj

    data = with_images(form)
    data["format"] = {
        "level": "HSK 1",
        "standard": "Current regular HSK (HSK 2.0) blueprint used for 2026 test dates",
        "items": 40,
        "listening": {"items": 20, "minutes": 15, "parts": 4},
        "reading": {"items": 20, "minutes": 17, "parts": 4},
        "totalMinutes": 40,
        "personalInformationMinutes": 5,
        "score": {"listening": 100, "reading": 100, "total": 200, "pass": 120},
    }
    data["license"] = {
        "content": "Original practice content; not an official HSK paper.",
        "images": "Original SVG drawings authored for this pack.",
        "audio": "No audio files; reader-administered listening.",
    }
    data["examples"] = copy.deepcopy(content.EXAMPLES)
    return data


def write_json(path: Path, data) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def build_manifest(images: dict) -> dict:
    forms = []
    for form in content.FORMS:
        folder = PACK / f"mock-{form['number']:02d}"
        files = {}
        for path in sorted(folder.rglob("*")):
            if path.is_file():
                files[str(path.relative_to(folder)).replace("\\", "/")] = sha256(path)
        forms.append({
            "id": form["id"],
            "number": form["number"],
            "items": 40,
            "sections": [
                {"id": "L1", "items": 5}, {"id": "L2", "items": 5},
                {"id": "L3", "items": 5}, {"id": "L4", "items": 5},
                {"id": "R1", "items": 5}, {"id": "R2", "items": 5},
                {"id": "R3", "items": 5}, {"id": "R4", "items": 5},
            ],
            "files": files,
        })
    shared = {}
    for path in sorted(EXAMPLES_DIR.glob("*")):
        if path.is_file():
            shared["examples/" + path.name] = sha256(path)
    return {
        "pack": "hsk1-offline-mocks",
        "generated": DATE,
        "standard": "Current regular HSK 1 (HSK 2.0) blueprint used for 2026 test dates",
        "forms": forms,
        "shared": shared,
    }


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description="Build the offline HSK 1 mock pack.")
    parser.add_argument("--pdf", action="store_true", help="also build the printable PDFs (needs local resvg)")
    args = parser.parse_args()

    reports = validate_all()
    images = generate_images()

    for form in content.FORMS:
        folder = PACK / f"mock-{form['number']:02d}"
        (folder / "questions.md").write_text(render_questions_md(form), encoding="utf-8")
        (folder / "answer-sheet.md").write_text(render_answer_sheet_md(form), encoding="utf-8")
        (folder / "answers.md").write_text(render_answers_md(form), encoding="utf-8")
        (folder / "examiner-listening.md").write_text(render_examiner_md(form), encoding="utf-8")
        write_json(folder / "mock.json", form_json(form, images))
        print("built", form["id"])

    write_json(PACK / "validation-report.json", {
        "generated": DATE,
        "forms": reports,
        "imageCount": len(images),
        "images": images,
        "notes": [
            "Structural checks only; they cannot prove naturalness or level fit.",
            "A qualified Chinese teacher has not yet reviewed the forms.",
            "No official HSK question, recording, picture or answer key is reproduced.",
        ],
    })
    if args.pdf:
        import pdf_build
        pdf_build.build_all()
    write_json(PACK / "manifest.json", build_manifest(images))
    print("images", len(images))
    print("validation passed")


if __name__ == "__main__":
    main()
