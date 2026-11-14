"""HSK 1 — free half mock (hsk1-free).

All eight parts of the regular HSK 1 (2.0) paper with fewer items: Listening 10 items / 8 minutes and
Reading 10 items / 9 minutes (the full mock is 40 items in 32 minutes on screen). Group IDs start with
"hsk-l-" and "hsk-r-" because the site's report groups HSK sections by them.

Pictures are drawn with the HSK pack's own scene library (MockExmps/HSK/_source/scenes.py), and every
printed or heard Chinese line is checked against that pack's HSK 1 word list. The shared worked examples
reuse the site's existing /exam-assets/hsk/examples pictures. Audio is not generated yet; each item's
`listening.script` is the text to synthesise (read twice, as in the pack).
"""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

from common import Figures

SLUG = "hsk1-free"
HSK_SOURCE = Path(__file__).resolve().parents[2] / "HSK" / "_source"
EX = "/exam-assets/hsk/examples"


def _pack_modules():
    sys.path.insert(0, str(HSK_SOURCE))
    spec = importlib.util.spec_from_file_location("hsk_pack_build", HSK_SOURCE / "build.py")
    pack = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(pack)
    return pack, pack.scenes


def check_words(pack, lines: list[str]) -> None:
    bad = []
    for text in lines:
        body = text
        for label in ("女：", "男：", "问："):
            body = body.replace(label, "")
        unknown = [word for word in pack.segment(body) if word.startswith("?")]
        if unknown:
            bad.append(f"{text}: {unknown}")
    if bad:
        raise ValueError("Words outside the HSK 1 list:\n" + "\n".join(bad))


def build(program_dir):
    pack, scenes = _pack_modules()
    figures = Figures(program_dir, SLUG, f"/exam-assets/hsk/{SLUG}")
    chinese: list[str] = []

    def pic(name: str, scene: str, alt: str, variant: int, label: str | None = None) -> dict:
        figure = figures.add(name, scenes.render(scene, variant), alt)
        out = {"src": figure["src"], "alt": alt}
        return {"label": label, **out} if label else out

    def figure(name: str, scene: str, alt: str, variant: int) -> dict:
        return figures.add(name, scenes.render(scene, variant), alt)

    def line(text: str, pinyin: str, label: str | None = None) -> dict:
        chinese.append(text)
        return {"label": label, "text": text, "pinyin": pinyin} if label else {"text": text, "pinyin": pinyin}

    def script(*pairs: tuple[str, str]) -> str:
        for text, _ in pairs:
            chinese.append(text)
        return "\n".join(f"{text}\n{pinyin}" for text, pinyin in pairs)

    listening: list[dict] = []
    reading: list[dict] = []

    def question(target, n, group, domain, prompt, options, answer, explanation, display=None, **extra):
        q = {"id": f"hsk1-free-{n:02}", "number": str(n), "domain": domain, "kind": "choice", "points": 1, "groupId": group,
             "prompt": prompt, "options": options, "optionLabels": options, "answers": [answer],
             "answerDisplay": display or answer, "explanation": explanation, **extra}
        target.append(q)

    L1, L2, L3, L4 = "听力一 · Зураг, хэллэг (√/×)", "听力二 · Өгүүлбэр, зураг", "听力三 · Яриа, зураг", "听力四 · Богино асуулт"
    R1, R2, R3, R4 = "阅读一 · Зураг, үг (√/×)", "阅读二 · Өгүүлбэр, зураг", "阅读三 · Асуулт, хариулт", "阅读四 · Үг нөхөх"
    tick = ["√", "×"]

    # Listening Part 1: phrase against one picture.
    for n, scene, alt, text, pinyin, answer, why in [
        (1, "cat", "A cat", "小猫。", "Xiǎo māo.", "√", "The phrase says “little cat”; the picture shows a cat."),
        (2, "sleeping", "A person asleep in bed", "看电视。", "Kàn diànshì.", "×", "The phrase says “watch TV”, but the person is sleeping."),
        (3, "cold", "A person shivering in cold weather", "天气很冷。", "Tiānqì hěn lěng.", "√", "The phrase says the weather is very cold; the picture shows cold weather."),
    ]:
        question(listening, n, "hsk-l-1", L1, "Сонссон хэллэг зурагтай таарч байна уу?", tick, answer, why,
                 figure=figure(f"listening-{n:02}", scene, alt, 3), listening={"part": 1, "script": script((text, pinyin))})

    # Listening Part 2: one sentence, three pictures.
    abc = ["A", "B", "C"]
    for n, pictures, text, pinyin, answer, why in [
        (4, [("tea", "A cup of tea"), ("water", "A glass of water"), ("rice", "A bowl of rice")], "我想喝水。", "Wǒ xiǎng hē shuǐ.", "B",
         "The sentence says “I want to drink water”; B shows water."),
        (5, [("teacher", "A teacher at the board"), ("student", "A student with a school bag"), ("doctor", "A doctor in a white coat")], "我爸爸是医生。", "Wǒ bàba shì yīshēng.", "C",
         "The sentence says “my father is a doctor”; C shows a doctor."),
        (6, [("reading", "A person reading a book"), ("writing", "A person writing"), ("eating", "A person eating")], "她在读书。", "Tā zài dú shū.", "A",
         "The sentence says “she is reading”; A shows reading."),
    ]:
        pics = [pic(f"listening-{n:02}-{abc[i].lower()}", scene, alt, 3, abc[i]) for i, (scene, alt) in enumerate(pictures)]
        question(listening, n, "hsk-l-2", L2, "Сонссон өгүүлбэрт тохирох зургийг сонгоно уу.", abc, answer, why,
                 hsk={"pictures": pics}, listening={"part": 2, "script": script((text, pinyin))})

    # Listening Part 3: two dialogues, three shared pictures (one extra).
    shared_l3 = [pic("listening-picture-a", "shop_scene", "A shop counter with fruit", 3, "A"),
                 pic("listening-picture-b", "taxi_scene", "Two people riding in a taxi", 3, "B"),
                 pic("listening-picture-c", "hospital", "A hospital building", 3, "C")]
    question(listening, 7, "hsk-l-3", L3, "Сонссон яриад тохирох зургийг сонгоно уу.", abc, "C",
             "The man says he is going to the hospital; C shows a hospital.",
             listening={"part": 3, "script": script(("女：你去哪儿？", "Nǐ qù nǎr?"), ("男：我去医院。", "Wǒ qù yīyuàn."))})
    question(listening, 8, "hsk-l-3", L3, "Сонссон яриад тохирох зургийг сонгоно уу.", abc, "A",
             "The woman wants to buy some fruit; A shows a shop counter with fruit. B (taxi) is not used.",
             listening={"part": 3, "script": script(("男：你想买什么？", "Nǐ xiǎng mǎi shénme?"), ("女：我想买一些水果。", "Wǒ xiǎng mǎi yìxiē shuǐguǒ."))})

    # Listening Part 4: statement and question, three printed answers.
    for n, choices, answer, statement, sp, ask, ap, why in [
        (9, [("六岁", "liù suì"), ("八岁", "bā suì"), ("十岁", "shí suì")], "C", "我女儿十岁了。", "Wǒ nǚ'ér shí suì le.",
         "问：他女儿几岁了？", "Wèn: Tā nǚ'ér jǐ suì le?", "The speaker's daughter is ten; C is 十岁."),
        (10, [("三点", "sān diǎn"), ("四点", "sì diǎn"), ("十点", "shí diǎn")], "B", "现在是下午三点，我们四点去看电影。",
         "Xiànzài shì xiàwǔ sān diǎn, wǒmen sì diǎn qù kàn diànyǐng.", "问：他几点去看电影？", "Wèn: Tā jǐ diǎn qù kàn diànyǐng?",
         "It is three now; they will go to the film at four. B is 四点."),
    ]:
        printed = [line(text, pinyin, abc[i]) for i, (text, pinyin) in enumerate(choices)]
        chosen = printed[abc.index(answer)]
        question(listening, n, "hsk-l-4", L4, "Сонссон асуултын хариултыг сонгоно уу.", abc, answer, why,
                 display=f"{answer} · {chosen['text']} ({chosen['pinyin']})", hsk={"choices": printed},
                 listening={"part": 4, "script": script((statement, sp), (ask, ap))})

    # Reading Part 1: word against one picture.
    for n, scene, alt, word, pinyin, answer, why in [
        (11, "dog", "A dog", "狗", "gǒu", "√", "The picture shows a dog; 狗 means “dog”."),
        (12, "apple", "An apple", "米饭", "mǐfàn", "×", "The picture shows an apple, but 米饭 means “cooked rice”."),
        (13, "book", "An open book", "书", "shū", "√", "The picture shows a book; 书 means “book”."),
    ]:
        printed = line(word, pinyin)
        question(reading, n, "hsk-r-1", R1, word, tick, answer, why, figure=figure(f"reading-{n}", scene, alt, 3), hsk={"line": printed})

    # Reading Part 2: sentence to one of three shared pictures (one extra). The phone_call scene always draws a
    # woman (long hair) and the eating scene one person, so the sentences say 她 and 我.
    shared_r2 = [pic("reading-picture-a", "eating", "A person eating at a table", 2, "A"),
                 pic("reading-picture-b", "phone_call", "A woman making a phone call", 2, "B"),
                 pic("reading-picture-c", "school_scene", "Children at school", 2, "C")]
    for n, text, pinyin, answer, why in [
        (14, "她在打电话呢。", "Tā zài dǎ diànhuà ne.", "B", "“打电话” (make a phone call) matches B."),
        (15, "我中午在家吃米饭。", "Wǒ zhōngwǔ zài jiā chī mǐfàn.", "A", "“吃米饭” (eat rice) matches A. C (school) is not used."),
    ]:
        question(reading, n, "hsk-r-2", R2, text, abc, answer, why, hsk={"line": line(text, pinyin)})

    # Reading Part 3: question to one of five answers (E is the example's answer; one extra).
    abcde = ["A", "B", "C", "D", "E"]
    answers_r3 = [line("我不认识他。", "Wǒ bú rènshi tā.", "A"), line("在桌子上。", "Zài zhuōzi shang.", "B"),
                  line("星期六。", "Xīngqīliù.", "C"), line("我很高兴。", "Wǒ hěn gāoxìng.", "D"), line("好的，谢谢！", "Hǎo de, xièxie!", "E")]
    for n, text, pinyin, answer, why in [
        (16, "你的书在哪儿？", "Nǐ de shū zài nǎr?", "B", "The question asks where the book is; B says “on the table”."),
        (17, "那个人是谁？", "Nà ge rén shì shéi?", "A", "The question asks who that person is; A says “I don't know him”."),
        (18, "你什么时候回北京？", "Nǐ shénme shíhou huí Běijīng?", "C", "The question asks when; C gives a day, Saturday. D is not used."),
    ]:
        chosen = answers_r3[abcde.index(answer)]
        question(reading, n, "hsk-r-3", R3, text, abcde, answer, why, display=f"{answer} · {chosen['text']}", hsk={"line": line(text, pinyin)})

    # Reading Part 4: word into a gap (D is used in the example; one extra).
    abcd = ["A", "B", "C", "D"]
    words_r4 = [line("坐", "zuò", "A"), line("漂亮", "piàoliang", "B"), line("多少", "duōshao", "C"), line("喜欢", "xǐhuan", "D")]
    for n, text, pinyin, answer, why in [
        (19, "这些衣服很（　）。", "Zhèxiē yīfu hěn (　).", "B", "“这些衣服很漂亮” — these clothes are very pretty; B is 漂亮."),
        (20, "这个杯子（　）钱？", "Zhège bēizi (　) qián?", "C", "“多少钱” asks the price; C is 多少. A (坐) is not used."),
    ]:
        chosen = words_r4[abcd.index(answer)]
        question(reading, n, "hsk-r-4", R4, text, abcd, answer, why, display=f"{answer} · {chosen['text']}", hsk={"line": line(text, pinyin)})

    groups_l = [
        {"id": "hsk-l-1", "title": "第一部分 · Зураг ба хэллэг", "section": "听力 · Сонсох", "pageMode": "group",
         "instructions": "听录音，判断对错。\nХэллэгийг хоёр удаа сонсоно. Зурагтай таарч байвал √, таарахгүй бол × сонгоно.",
         "hsk": {"example": {"pictures": [{"src": f"{EX}/listening-1.svg", "alt": "Two people watching a film in a cinema"}], "answer": "√"}}},
        {"id": "hsk-l-2", "title": "第二部分 · Зураг сонгох", "section": "听力 · Сонсох", "pageMode": "group",
         "instructions": "听录音，选择相应的图片。\nӨгүүлбэрийг хоёр удаа сонсоно. Гурван зургаас тохирохыг сонгоно.",
         "hsk": {"example": {"pictures": [{"label": "A", "src": f"{EX}/listening-2-a.svg", "alt": "An open book"},
                                          {"label": "B", "src": f"{EX}/listening-2-b.svg", "alt": "A computer"},
                                          {"label": "C", "src": f"{EX}/listening-2-c.svg", "alt": "A cat"}], "answer": "A"}}},
        {"id": "hsk-l-3", "title": "第三部分 · Яриа ба зураг", "section": "听力 · Сонсох", "pageMode": "group",
         "instructions": "听录音，选择相应的图片。\nХоёр хүний богино яриаг хоёр удаа сонсоно. Гурван зургаас тохирохыг сонгоно; нэг зураг илүү.",
         "hsk": {"pictures": shared_l3, "example": {"pictures": [{"label": "A", "src": f"{EX}/listening-3-a.svg", "alt": "Two people shaking hands"}], "answer": "A"}}},
        {"id": "hsk-l-4", "title": "第四部分 · Хариулт сонгох", "section": "听力 · Сонсох", "pageMode": "group",
         "instructions": "听录音，选择答案。\nӨгүүлбэр ба асуултыг хоёр удаа сонсоно. Асуулт бичигдээгүй; гурван хариултаас зөвийг сонгоно.",
         "hsk": {"example": {"choices": [line("商店", "shāngdiàn", "A"), line("医院", "yīyuàn", "B"), line("学校", "xuéxiào", "C")], "answer": "A"}}},
    ]
    groups_r = [
        {"id": "hsk-r-1", "title": "第一部分 · Зураг ба үг", "section": "阅读 · Унших", "pageMode": "group",
         "instructions": "判断对错。\nҮг зурагтай таарч байвал √, таарахгүй бол × сонгоно.",
         "hsk": {"example": {"pictures": [{"src": f"{EX}/reading-1.svg", "alt": "A passenger plane"}], "line": line("飞机", "fēijī"), "answer": "√"}}},
        {"id": "hsk-r-2", "title": "第二部分 · Өгүүлбэр ба зураг", "section": "阅读 · Унших", "pageMode": "group",
         "instructions": "选择相应的图片。\nӨгүүлбэр бүрт тохирох зургийг A–C-ээс сонгоно; нэг зураг илүү.",
         "hsk": {"pictures": shared_r2, "example": {"pictures": [{"label": "A", "src": f"{EX}/reading-2-a.svg", "alt": "An open book"}],
                                                    "line": line("我很喜欢这本书。", "Wǒ hěn xǐhuan zhè běn shū."), "answer": "A"}}},
        {"id": "hsk-r-3", "title": "第三部分 · Асуулт ба хариулт", "section": "阅读 · Унших", "pageMode": "group",
         "instructions": "选择相应的回答。\nАсуулт бүрт тохирох хариултыг A–E-ээс сонгоно. E нь жишээний хариулт; нэг хариулт илүү.",
         "hsk": {"choices": answers_r3, "example": {"line": line("你喝茶吗？", "Nǐ hē chá ma?"), "answerLine": answers_r3[4], "answer": "E"}}},
        {"id": "hsk-r-4", "title": "第四部分 · Хоосон зай нөхөх", "section": "阅读 · Унших", "pageMode": "group",
         "instructions": "选词填空。\nХоосон зайд тохирох үгийг A–D-ээс сонгоно. D нь жишээнд орсон; нэг үг илүү.",
         "hsk": {"choices": words_r4, "example": {"line": line("我很（　）吃苹果。", "Wǒ hěn (　) chī píngguǒ."), "answerLine": words_r4[3], "answer": "D"}}},
    ]
    check_words(pack, chinese)
    definition = {
        "slug": SLUG, "version": 1, "program": "hsk", "title": "HSK 1 · Free Half Mock",
        "description": "免费试卷 · Үнэгүй хагас mock · Гэр, хоол, сургууль, дэлгүүр",
        "points": len(listening) + len(reading),
        "notes": ["Үнэгүй, хагас хэмжээний дадлагын mock: HSK 1-ийн найман хэсэг бүгд, асуулт цөөн.",
                  "Албан бус, эх зохиомжтой. Хятад хэлний багшийн хяналт хүлээгдэж байна. Сонсох хэсгийн дуу хиймэл хятад дуу хоолойгоор бичигдсэн; хүний сонсголын шалгалт хүлээгдэж байна.",
                  "Raw зөв хариултын тоо ба ×10 дадлагын оноо (200-аас); HSK-ийн албан оноо, тэнцсэн эсэх биш."],
        "sources": [{"label": "Chinese Testing International · HSK 1", "url": "https://www.chinesetest.cn/HSK/1"},
                    {"label": "HSK 1 албан жишиг материал (бүтэц)", "url": "https://www.chinesetest.cn/userfiles/file/HSK1.pdf"}],
        "stages": [
            {"id": "hsk-l", "title": "听力 · Сонсох", "kind": "listening", "seconds": 480,
             "instructions": "Бичлэг нэг удаа, серверийн цагтай зэрэг тоглоно; асуулт бүрийг хоёр удаа уншина. Дөрвөн хэсэг дараалан тоглоно. Цаг дуусахад Унших хэсэг автоматаар эхэлнэ.",
             "groups": groups_l, "questions": listening},
            {"id": "hsk-r", "title": "阅读 · Унших", "kind": "questions", "seconds": 540,
             "instructions": "Дөрвөн хэсэг, 10 асуулт, 9 минут. Хэсгүүдийн хооронд чөлөөтэй шилжинэ. Цаг дуусахад шалгалт дуусна.",
             "groups": groups_r, "questions": reading},
        ],
    }
    return definition, figures
