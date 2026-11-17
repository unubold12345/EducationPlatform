"""Build the offline HSK 2 mock pack: validation, pictures, mock.json, hashes.

Usage (from the repository root):

    python -B MockExmps/HSK2/_source/build.py

No third-party dependencies.  It does not read or change website content or the database; the site copies are
made afterwards by scripts/build-hsk-mocks.mjs and the audio by scripts/generate-hsk2-audio.py.
"""

from __future__ import annotations

import copy
import hashlib
import json
import re
import sys
import xml.etree.ElementTree as ET
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import content  # noqa: E402
import scenes2  # noqa: E402

PACK = HERE.parent
DATE = "2026-11-16"

# The 150-word HSK 1 syllabus (as in the HSK 1 pack) ...
HSK1 = """
爱 八 爸爸 杯子 北京 本 不 不客气 菜 茶 吃 出租车 打电话 大 的 点 电脑 电视 电影 东西 都 读 对不起 多 多少
儿子 二 饭店 饭馆 飞机 分钟 高兴 个 工作 狗 汉语 好 号 喝 和 很 后面 回 会 火车站 火车 几 家 叫 今天 九 开
看 看见 块 来 老师 了 冷 里 六 吗 妈妈 买 没 没关系 没有 米饭 名字 明天 哪 哪儿 那 呢 能 你 年 女儿 朋友
漂亮 苹果 七 前面 钱 请 去 热 人 认识 三 商店 上 上午 少 谁 什么 十 时候 是 书 水 水果 睡觉 说 四 岁 他 她
太 天气 听 同学 喂 我 我们 五 喜欢 下 下午 下雨 先生 现在 想 小 小姐 些 写 谢谢 星期 学生 学习 学校 一
一点儿 衣服 医生 医院 椅子 有 月 再见 在 怎么 怎么样 这 中国 中午 住 桌子 字 昨天 坐 做 猫
""".split()
# ... and the 150 words HSK 2 adds (2012 syllabus).
HSK2 = """
吧 白 百 帮助 报纸 比 别 宾馆 长 唱歌 出 穿 次 从 错 打篮球 大家 到 得 等 弟弟 第一 懂 对 房间 非常 服务员 高
告诉 哥哥 给 公共汽车 公司 贵 过 还 孩子 好吃 黑 红 机场 鸡蛋 件 教室 姐姐 介绍 进 近 就 觉得 咖啡 开始 考试
可能 可以 课 快 快乐 累 离 两 零 路 旅游 卖 慢 忙 每 妹妹 门 面条 男 您 牛奶 女 旁边 跑步 便宜 票 妻子 起床
千 铅笔 晴 去年 让 日 上班 身体 生病 生日 时间 事情 手表 手机 说话 送 虽然 但是 它 踢足球 题 跳舞 外 完 玩
晚上 往 为什么 问 问题 西瓜 希望 洗 小时 笑 新 姓 休息 雪 颜色 眼睛 羊肉 药 要 也 一下 已经 一起 意思 因为
所以 阴 游泳 右边 鱼 远 运动 再 早上 丈夫 找 着 真 正在 知道 准备 走 最 左边
""".split()
# Tokens the syllabus implies but does not list on their own: plural pronouns, the single syllables of its
# verb-object words (游泳 → 游), measure and time words every HSK 2 paper prints, and position words.
EXTRA = """
你们 他们 她们 天 今年 明年 这儿 那儿 外面 里面 下班 吃饭 做饭 饭 足球 篮球 游 学 跑 踢 打 唱 睡 晚 分 杯 帮 第
""".split()
PROPER = ["小王", "小李", "小红", "小明", "王", "李"]
ALLOWED = sorted(set(HSK1 + HSK2 + EXTRA + PROPER), key=len, reverse=True)

TONE_MARKS = set("āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ")
CJK = re.compile(r"[㐀-鿿]")
PINYIN_KEYS = {"pinyin", "questionPinyin", "statementPinyin", "titlePinyin"}
SKIP_KEYS = PINYIN_KEYS | {"titleEn", "alt", "scene", "id", "explanation", "theme", "speaker", "label", "answer"}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def segment(text: str) -> list[str]:
    out, i = [], 0
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


def walk(obj, path=""):
    if isinstance(obj, dict):
        for key, value in obj.items():
            yield from walk(value, f"{path}/{key}")
    elif isinstance(obj, list):
        for index, value in enumerate(obj):
            yield from walk(value, f"{path}[{index}]")
    else:
        yield path, obj


def pairs(obj):
    """Every (Chinese, pinyin) pair of one form, for the pinyin typo guard."""
    if isinstance(obj, dict):
        for text, pinyin in (("sentence", "pinyin"), ("text", "pinyin"), ("question", "questionPinyin"), ("statement", "statementPinyin"), ("title", "titlePinyin")):
            if text in obj and pinyin in obj:
                yield obj[text], obj[pinyin]
        for value in obj.values():
            yield from pairs(value)
    elif isinstance(obj, list):
        for value in obj:
            yield from pairs(value)


def items_of(form):
    L, R = form["listening"], form["reading"]
    return {
        "listening-1": L["part1"], "listening-2a": L["part2"]["setA"]["items"], "listening-2b": L["part2"]["setB"]["items"],
        "listening-3": L["part3"], "listening-4": L["part4"],
        "reading-1": R["part1"]["items"], "reading-2": R["part2"]["items"], "reading-3": R["part3"],
        "reading-4a": R["part4"]["setA"]["items"], "reading-4b": R["part4"]["setB"]["items"],
    }


EXPECTED = {"listening-1": 10, "listening-2a": 5, "listening-2b": 5, "listening-3": 10, "listening-4": 5,
            "reading-1": 5, "reading-2": 5, "reading-3": 5, "reading-4a": 5, "reading-4b": 5}


def validate_form(form: dict) -> dict:
    errors, warnings, fid = [], [], form["id"]
    sections = items_of(form)
    numbers = [item["n"] for items in sections.values() for item in items]
    for name, items in sections.items():
        if len(items) != EXPECTED[name]:
            errors.append(f"{fid}: {name} has {len(items)} items, expected {EXPECTED[name]}")
    if numbers != list(range(1, 61)):
        errors.append(f"{fid}: question numbers are not 1..60")

    L, R = form["listening"], form["reading"]
    for item in L["part1"] + R["part3"]:
        if item["answer"] not in {"√", "×"}:
            errors.append(f"{fid} Q{item['n']}: answer {item['answer']!r}")
    for item in L["part3"] + L["part4"]:
        if item["answer"] not in "ABC" or len(item["options"]) != 3:
            errors.append(f"{fid} Q{item['n']}: answer or options")
        if len({o["text"] for o in item["options"]}) != 3:
            errors.append(f"{fid} Q{item['n']}: repeated option")
    for item in L["part3"]:
        if len(item["dialogue"]) != 2:
            errors.append(f"{fid} Q{item['n']}: Part 3 dialogues have two turns")
    for item in L["part4"]:
        if not 4 <= len(item["dialogue"]) <= 5:
            errors.append(f"{fid} Q{item['n']}: Part 4 dialogues have four or five turns")
    # A six-entry set: the example takes one entry and the five items take the others, once each.
    # A five-entry set: every entry is used exactly once.
    for name, group, key in (("listening 2a", L["part2"]["setA"], "pictures"), ("listening 2b", L["part2"]["setB"], "pictures"),
                             ("reading 1", R["part1"], "pictures"), ("reading 2", R["part2"], "options"),
                             ("reading 4a", R["part4"]["setA"], "options"), ("reading 4b", R["part4"]["setB"], "options")):
        labels = [entry["label"] for entry in group[key]]
        used = [item["answer"] for item in group["items"]] + ([group["example"]["answer"]] if "example" in group else [])
        if labels != list("ABCDEF"[:len(labels)]) or sorted(used) != labels:
            errors.append(f"{fid} {name}: labels {labels}, used {sorted(used)}")
    for item in L["part2"]["setA"]["items"] + L["part2"]["setB"]["items"] + [L["part2"]["setA"]["example"]]:
        if len(item["dialogue"]) != 2:
            errors.append(f"{fid} Q{item['n']}: Part 2 dialogues have two turns")

    for text, pinyin in pairs(form):
        han = len(CJK.findall(text))
        if not pinyin.strip() or CJK.search(pinyin):
            errors.append(f"{fid}: bad pinyin for {text!r}")
        elif han > 3 and not (set(pinyin) & TONE_MARKS):
            warnings.append(f"{fid}: no tone mark in {pinyin!r}")
    for path, value in walk(form):
        if not isinstance(value, str) or path.rsplit("/", 1)[-1].split("[")[0] in SKIP_KEYS:
            continue
        unknown = [part for part in segment(value) if part.startswith("?")]
        if unknown:
            errors.append(f"{fid} {path}: outside the HSK 1-2 list: {''.join(unknown)} ({value!r})")

    stems = []
    for name, items in sections.items():
        for item in items:
            stems.append(item.get("sentence") or item.get("text") or " ".join(turn["text"] for turn in item["dialogue"]))
    for stem, count in Counter(stems).items():
        if count > 1:
            errors.append(f"{fid}: repeated stem {stem!r}")
    for path, value in walk(form):
        if path.endswith("/scene") and value not in scenes2.SCENES:
            errors.append(f"{fid}: unknown scene {value!r}")
    # Pictures inside one set must differ.
    for group in (L["part2"]["setA"], L["part2"]["setB"], R["part1"]):
        scenes_used = [picture["scene"] for picture in group["pictures"]]
        if len(set(scenes_used)) != len(scenes_used):
            errors.append(f"{fid}: a picture set repeats a scene: {scenes_used}")

    answers = Counter(item["answer"] for items in sections.values() for item in items)
    by_part = {name: "".join(item["answer"] for item in items) for name, items in sections.items()}
    return {"form": fid, "items": len(numbers), "counts": {name: len(items) for name, items in sections.items()},
            "answerDistribution": dict(sorted(answers.items())), "keysByPart": by_part, "errors": errors, "warnings": warnings}


def write_svg(path: Path, scene: str, variant: int) -> dict:
    svg = scenes2.render(scene, variant)
    ET.fromstring(svg)
    if CJK.search(svg) or "<text" in svg:
        raise SystemExit(f"{scene}: pictures must not print words")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(svg, encoding="utf-8", newline="\n")
    return {"scene": scene, "variant": variant, "sha256": sha256(path)}


def generate_images() -> dict:
    images = {}
    example = content.EXAMPLES["listening"]["part1"]
    images["examples/listening-1.svg"] = write_svg(PACK / "examples" / "listening-1.svg", example["scene"], 0)
    example["image"] = "../examples/listening-1.svg"
    for form in content.FORMS:
        folder = PACK / f"mock-{form['number']:02d}" / "images"
        if folder.exists():
            for old in folder.glob("*.svg"):
                old.unlink()
        variant = form["number"]
        targets = [(item, f"l1-{item['n']:02d}.svg") for item in form["listening"]["part1"]]
        for prefix, group in (("l2a", form["listening"]["part2"]["setA"]), ("l2b", form["listening"]["part2"]["setB"]), ("r1", form["reading"]["part1"])):
            targets += [(picture, f"{prefix}-{picture['label'].lower()}.svg") for picture in group["pictures"]]
        for entry, name in targets:
            images[f"{form['id']}/{name}"] = write_svg(folder / name, entry["scene"], variant)
            entry["image"] = f"images/{name}"
    return images


def main() -> None:
    if len(content.FORMS) != 3:
        raise SystemExit("expected exactly three forms")
    example_form = {"id": "examples", "listening": content.EXAMPLES["listening"], "reading": content.EXAMPLES["reading"]}
    for path, value in walk(example_form):
        if isinstance(value, str) and path.rsplit("/", 1)[-1].split("[")[0] not in SKIP_KEYS and any(p.startswith("?") for p in segment(value)):
            raise SystemExit(f"examples {path}: outside the HSK 1-2 list: {value!r}")
    reports = [validate_form(form) for form in content.FORMS]
    errors = [error for report in reports for error in report["errors"]]
    for error in errors:
        print("ERROR:", error)
    if errors:
        raise SystemExit(f"{len(errors)} validation error(s)")
    for report in reports:
        for warning in report["warnings"]:
            print("WARN:", warning)
    images = generate_images()
    manifest = {"pack": "hsk2-offline-mocks", "generated": DATE, "standard": "Regular HSK 2 (HSK 2.0) blueprint", "forms": [], "shared": {}}
    for form in content.FORMS:
        folder = PACK / f"mock-{form['number']:02d}"
        data = copy.deepcopy(form)
        data["format"] = {
            "level": "HSK 2", "standard": "Regular HSK (HSK 2.0) blueprint", "items": 60,
            "listening": {"items": 35, "minutes": 25, "parts": [10, 10, 10, 5]},
            "reading": {"items": 25, "minutes": 22, "parts": [5, 5, 5, 10]},
            "totalMinutes": 55, "personalInformationMinutes": 5,
            "score": {"listening": 100, "reading": 100, "total": 200, "pass": 120},
        }
        data["license"] = {"content": "Original practice content; not an official HSK paper.", "images": "Original SVG drawings authored for this pack."}
        data["examples"] = copy.deepcopy(content.EXAMPLES)
        (folder / "mock.json").write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
        files = {str(path.relative_to(folder)).replace("\\", "/"): sha256(path) for path in sorted(folder.rglob("*")) if path.is_file()}
        manifest["forms"].append({"id": form["id"], "number": form["number"], "items": 60, "files": files})
        print("built", form["id"])
    manifest["shared"] = {"examples/" + path.name: sha256(path) for path in sorted((PACK / "examples").glob("*"))}
    (PACK / "validation-report.json").write_text(json.dumps({
        "generated": DATE, "forms": reports, "imageCount": len(images), "images": images,
        "notes": ["Structural checks only; they cannot prove naturalness or level fit.",
                  "A qualified Chinese teacher has not yet reviewed the forms.",
                  "No official HSK question, recording, picture or answer key is reproduced."],
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    (PACK / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    print("images", len(images))
    print("validation passed")


if __name__ == "__main__":
    main()
