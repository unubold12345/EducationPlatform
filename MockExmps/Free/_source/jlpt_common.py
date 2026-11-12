"""Shared builder for the free JLPT half mocks, matching assets/jlpt/<slug>.json.

Question numbers start with V, G or L because the site's report groups JLPT sections by that letter.
Listening scripts use the speaker labels ナレーター, 男 and 女 that scripts/generate-jlpt-audio.py splits on.
"""

from __future__ import annotations

LABELS = {
    "kanji-reading": "漢字の読み · Ханзын уншлага", "orthography": "表記 · Зөв бичлэг", "context": "文脈 · Үг сонгох",
    "paraphrase": "言い換え · Ижил утга", "usage": "用法 · Үгийн хэрэглээ", "grammar-form": "文法 · Хэлзүй",
    "sentence-order": "文の組み立て · Өгүүлбэр бүтээх", "text-grammar": "文章の文法 · Эхийн хэлзүй",
    "short-reading": "短文 · Богино эх", "medium-reading": "中文 · Дунд эх", "information-retrieval": "情報検索 · Мэдээлэл олох",
    "task-comprehension": "課題理解 · Үйлдэл сонгох", "key-points": "ポイント理解 · Гол мэдээлэл",
    "verbal-expressions": "発話表現 · Юу хэлэх вэ", "quick-response": "即時応答 · Шуурхай хариу",
}
INSTRUCTIONS = {
    "kanji-reading": "【　】の ことばは どう よみますか。", "orthography": "【　】の ことばは どう かきますか。",
    "context": "（　）に 入る いちばん いい ことばを えらんでください。",
    "paraphrase": "【　】の 文と だいたい 同じ いみの 文を えらんでください。",
    "usage": "つぎの ことばの つかいかたで いちばん いい ものを えらんでください。",
    "grammar-form": "（　）に 入る いちばん いい ものを えらんでください。",
    "sentence-order": "四つの ことばを ならべて 文を 作ります。★に 入る ことばを えらんでください。",
    "text-grammar": "文を 読んで、【1】〜【3】に 入る ものを えらんでください。",
    "short-reading": "文を 読んで、しつもんに こたえてください。", "medium-reading": "文を 読んで、しつもんに こたえてください。",
    "information-retrieval": "お知らせを 見て、しつもんに こたえてください。",
    "task-comprehension": "話を 聞いて、さいごの しつもんに こたえてください。",
    "key-points": "しつもんを 聞いてから、話を 聞きます。大切な ことを えらんでください。",
    "verbal-expressions": "場面を 見て、三つの ことばを 聞きます。何と 言うか えらんでください。",
    "quick-response": "短い ことばと 三つの 返事を 聞いて、いちばん いい 返事を えらんでください。",
}
STAGES = {"V": ("jlpt-v", "文字・語彙 · Үгийн сан"), "G": ("jlpt-g", "文法・読解 · Хэлзүй, унших"), "L": ("jlpt-l", "聴解 · Сонсох")}
WRITTEN = "Нэг зөв хариу сонгоно. ★ нь гурав дахь хоосон зай. Одоогийн хэсэг дотор чөлөөтэй шилжинэ. Цаг дуусахад дараагийн хэсэг автоматаар эхэлнэ."
LISTENING = "Бичлэг нэг удаа, серверийн цагтай зэрэг тоглоно. 1–2-р бүлгийн сонголт бичгээр; 3–4-р бүлгийн сонголт зөвхөн дуугаар. Дууссан хэсэг рүү буцахгүй."


class JlptMock:
    def __init__(self, slug: str, prefix: str, minutes: dict[str, int]):
        self.slug, self.prefix, self.minutes = slug, prefix, minutes
        self.stages: dict[str, dict] = {}
        self.counts = {"V": 0, "G": 0, "L": 0}
        self.group_numbers = {"V": 0, "G": 0, "L": 0}
        self.current: dict[str, str] = {}

    def group(self, section: str, kind: str, instructions: str | None = None) -> None:
        stage_id, title = STAGES[section]
        stage = self.stages.setdefault(section, {
            "id": stage_id, "title": title, "kind": "listening" if section == "L" else "questions",
            "seconds": self.minutes[section] * 60, "instructions": LISTENING if section == "L" else WRITTEN,
            "groups": [], "questions": []})
        self.group_numbers[section] += 1
        group_id = f"{stage_id}-{self.group_numbers[section]}"
        stage["groups"].append({"id": group_id, "title": LABELS[kind], "section": LABELS[kind],
                                "instructions": instructions or INSTRUCTIONS[kind], "pageMode": "single"})
        self.current[section] = group_id
        self.current[section + "kind"] = kind

    def written(self, section: str, prompt: str, choices: list[str], answer: int, explanation: str, passage: str | None = None) -> None:
        assert len(choices) == 4 and len(set(choices)) == 4 and 1 <= answer <= 4, (section, prompt)
        self._add(section, prompt, choices, [choices[answer - 1]], f"{answer}. {choices[answer - 1]}", explanation, passage=passage)

    def heard(self, prompt_choices: list[str] | None, answer: int, script: str, explanation: str, prompt: str | None = None) -> None:
        """Listening item. Groups 1–2 print text choices; groups 3–4 hear spoken choices (options are 1–3)."""
        kind = self.current["Lkind"]
        if kind in {"verbal-expressions", "quick-response"}:
            spoken = [line.split("。", 1)[1] for line in script.splitlines() if line[:2] in {"1。", "2。", "3。"}]
            assert len(spoken) == 3 and 1 <= answer <= 3, script
            options = ["1", "2", "3"]
            self._add("L", prompt or "音声を聞いて、返事を選んでください。", options, [str(answer)], f"{answer}. {spoken[answer - 1]}",
                      explanation, listening=script)
        else:
            assert prompt_choices and len(prompt_choices) == 4 and len(set(prompt_choices)) == 4, script
            question = script.strip().splitlines()[-1]
            assert question.endswith("か。"), script
            self._add("L", "音声の質問に答えてください。", prompt_choices, [prompt_choices[answer - 1]],
                      f"{answer}. {prompt_choices[answer - 1]}", explanation, listening=script)

    def _add(self, section, prompt, options, answers, display, explanation, passage=None, listening=None):
        self.counts[section] += 1
        number = f"{section}{self.counts[section]:02}"
        question = {"id": f"{self.prefix}-{number}", "number": number, "domain": LABELS[self.current[section + "kind"]],
                    "kind": "choice", "points": 1, "groupId": self.current[section], "prompt": prompt,
                    "options": options, "optionLabels": [str(i + 1) for i in range(len(options))],
                    "answers": answers, "answerDisplay": display, "explanation": explanation}
        if passage:
            question["passage"] = passage
        if listening:
            group_number = int(self.current["L"].rsplit("-", 1)[1])
            question["listening"] = {"part": group_number, "script": listening}
        self.stages[section]["questions"].append(question)

    def build(self, level: str, title: str, description: str) -> dict:
        stages = [self.stages[s] for s in "VGL"]
        points = sum(len(s["questions"]) for s in stages)
        return {
            "slug": self.slug, "version": 1, "program": "jlpt", "title": title, "description": description, "points": points,
            "notes": ["Үнэгүй, хагас хэмжээний дадлагын mock: бүх бүлгийн хэлбэр, бүтэн шалгалтын тал орчим асуулт.",
                      "Албан бус, эх зохиомжтой. Япон хэлний багшийн хяналт хүлээгдэж байна. Listening-ийн дуу хараахан бичигдээгүй.",
                      "Raw зөв хариултын тоо; JLPT-ийн 180 оноо, тэнцсэн эсэхийг тооцохгүй."],
            "sources": [{"label": "JLPT · албан бүтэц", "url": "https://www.jlpt.jp/e/guideline/testsections.html"},
                        {"label": f"JLPT · {level} түвшин", "url": "https://www.jlpt.jp/e/about/levelsummary.html"}],
            "stages": stages,
        }
