"""Authoring source for the three offline HSK 1 mock forms.

The content follows the current regular HSK 1 (HSK 2.0) paper used for the
2026 test dates: 40 items, Listening 20 (four five-item parts) and Reading 20
(four five-item parts), about 40 minutes including five minutes for personal
information.  HSK 1 vocabulary is the 150-word 2015 syllabus list; proper names
and the grammatical particles printed on the paper are the only exceptions.

All dialogues, sentences, keys, explanations and drawings are original.  No
official HSK question, recording, picture or answer key is reproduced.
"""

from __future__ import annotations

# ---------------------------------------------------------------------------
# Small constructors
# ---------------------------------------------------------------------------

def pic(label: str, scene: str, alt: str) -> dict:
    return {"label": label, "scene": scene, "alt": alt}


def opt(label: str, scene: str, alt: str) -> dict:
    return {"label": label, "scene": scene, "alt": alt}


def topt(label: str, text: str, pinyin: str) -> dict:
    return {"label": label, "text": text, "pinyin": pinyin}


def line(speaker: str, text: str, pinyin: str) -> dict:
    return {"speaker": speaker, "text": text, "pinyin": pinyin}


def l1(n, scene, alt, phrase, pinyin, answer, explanation):
    return {
        "n": n, "scene": scene, "alt": alt, "phrase": phrase,
        "pinyin": pinyin, "answer": answer, "explanation": explanation,
    }


def l2(n, sentence, pinyin, options, answer, explanation):
    return {
        "n": n, "sentence": sentence, "pinyin": pinyin, "options": options,
        "answer": answer, "explanation": explanation,
    }


def l3(n, dialogue, answer, explanation):
    return {"n": n, "dialogue": dialogue, "answer": answer, "explanation": explanation}


def l4(n, statement, sp, question, qp, options, answer, explanation):
    return {
        "n": n, "statement": statement, "statementPinyin": sp,
        "question": question, "questionPinyin": qp, "options": options,
        "answer": answer, "explanation": explanation,
    }


def r1(n, scene, alt, word, pinyin, answer, explanation):
    return {
        "n": n, "scene": scene, "alt": alt, "word": word,
        "pinyin": pinyin, "answer": answer, "explanation": explanation,
    }


def r2(n, sentence, pinyin, answer, explanation):
    return {
        "n": n, "sentence": sentence, "pinyin": pinyin,
        "answer": answer, "explanation": explanation,
    }


def r3(n, question, qp, answer, explanation):
    return {
        "n": n, "question": question, "pinyin": qp,
        "answer": answer, "explanation": explanation,
    }


def r4(n, sentence, pinyin, answer, explanation):
    return {
        "n": n, "sentence": sentence, "pinyin": pinyin,
        "answer": answer, "explanation": explanation,
    }


# ---------------------------------------------------------------------------
# Shared examples (not scored; printed with their answers as in the official paper)
# ---------------------------------------------------------------------------

EXAMPLES = {
    "listening": {
        "part1": l1(
            0, "cinema", "Two people watching a film in a cinema",
            "很高兴看电影。", "Hěn gāoxìng kàn diànyǐng.", "√",
            "The phrase says “very happy to watch a film”; the picture shows a cinema.",
        ),
        "part2": {
            "sentence": "这是我的书。", "pinyin": "Zhè shì wǒ de shū.",
            "options": [
                opt("A", "book", "An open book"),
                opt("B", "computer", "A computer"),
                opt("C", "cat", "A cat"),
            ],
            "answer": "A",
            "explanation": "The sentence says “this is my book”; A shows a book.",
        },
        "part3": {
            "pictures": [
                pic("A", "handshake", "Two people shaking hands"),
                pic("B", "phone_call", "A person making a phone call"),
                pic("C", "shop_scene", "A shop counter"),
                pic("D", "doctor_scene", "A doctor and a patient"),
                pic("E", "rain", "A person in the rain"),
                pic("F", "school_scene", "A school building"),
            ],
            "dialogue": [
                line("女", "你好！", "Nǐ hǎo!"),
                line("男", "你好！很高兴认识你。", "Nǐ hǎo! Hěn gāoxìng rènshi nǐ."),
            ],
            "answer": "A",
            "explanation": "The speakers greet each other and say they are glad to meet; A shows a handshake.",
        },
        "part4": {
            "statement": "下午我去商店，我想买一些水果。",
            "statementPinyin": "Xiàwǔ wǒ qù shāngdiàn, wǒ xiǎng mǎi yìxiē shuǐguǒ.",
            "question": "她去哪儿？", "questionPinyin": "Tā qù nǎr?",
            "options": [topt("A", "商店", "shāngdiàn"), topt("B", "医院", "yīyuàn"), topt("C", "学校", "xuéxiào")],
            "answer": "A",
            "explanation": "She says she is going to a shop to buy fruit; A is 商店.",
        },
    },
    "reading": {
        "part1": r1(
            0, "plane", "A passenger plane", "飞机", "fēijī", "√",
            "The picture shows a plane; 飞机 means “plane”.",
        ),
        "part2": {
            "pictures": [
                pic("A", "book", "An open book"),
                pic("B", "tv", "A television"),
                pic("C", "cat", "A cat"),
                pic("D", "shop_scene", "A shop counter"),
                pic("E", "rain", "A person in the rain"),
                pic("F", "school_scene", "A school building"),
            ],
            "sentence": "我很喜欢这本书。", "pinyin": "Wǒ hěn xǐhuan zhè běn shū.",
            "answer": "A",
            "explanation": "The sentence says “I really like this book”; A shows a book.",
        },
        "part3": {
            "question": "你喝水吗？", "pinyin": "Nǐ hē shuǐ ma?",
            "options": [
                topt("A", "中国人。", "Zhōngguó rén."),
                topt("B", "七点了。", "Qī diǎn le."),
                topt("C", "苹果。", "Píngguǒ."),
                topt("D", "二十块。", "Èrshí kuài."),
                topt("E", "坐出租车。", "Zuò chūzūchē."),
                topt("F", "好的，谢谢！", "Hǎo de, xièxie!"),
            ],
            "answer": "F",
            "explanation": "“Do you drink water?” is answered by “Yes, thank you”; F fits.",
        },
        "part4": {
            "options": [
                topt("A", "家", "jiā"), topt("B", "火车站", "huǒchēzhàn"),
                topt("C", "对不起", "duìbuqǐ"), topt("D", "名字", "míngzi"),
                topt("E", "看见", "kànjiàn"), topt("F", "学习", "xuéxí"),
            ],
            "sentence": "你叫什么（　）？", "pinyin": "Nǐ jiào shénme (　)?",
            "answer": "D",
            "explanation": "“你叫什么名字？” asks for a name; D is 名字.",
        },
    },
}


# ---------------------------------------------------------------------------
# FORM 01 — At school and at home
# ---------------------------------------------------------------------------

FORM1 = {
    "id": "hsk1-mock-01",
    "number": 1,
    "title": "在学校和家里",
    "titlePinyin": "Zài xuéxiào hé jiā li",
    "titleEn": "At school and at home",
    "theme": "A school day, family, meals and shopping",
    "listening": {
        "part1": [
            l1(1, "taxi", "A yellow taxi at the roadside", "坐出租车。", "Zuò chūzūchē.", "√",
               "The phrase says “take a taxi”; the picture shows a taxi."),
            l1(2, "sun_hot", "A sunny day with a person fanning himself", "下雨了。", "Xià yǔ le.", "×",
               "The phrase says it is raining, but the picture shows a sunny day."),
            l1(3, "tv", "A television in a living room", "看电视。", "Kàn diànshì.", "√",
               "The phrase says “watch TV”; the picture shows a television."),
            l1(4, "mom_reading", "A woman reading a book in an armchair", "妈妈吃米饭。", "Māma chī mǐfàn.", "×",
               "The phrase says mother is eating rice, but she is reading a book."),
            l1(5, "tea", "A cup of tea on a saucer", "喝茶。", "Hē chá.", "√",
               "The phrase says “drink tea”; the picture shows a cup of tea."),
        ],
        "part2": [
            l2(6, "我妈妈喜欢喝茶。", "Wǒ māma xǐhuan hē chá.",
               [opt("A", "apple", "An apple"), opt("B", "tea", "A cup of tea"), opt("C", "rice", "A bowl of rice")],
               "B", "The sentence says my mother likes drinking tea; B shows tea."),
            l2(7, "今天下雨了。", "Jīntiān xià yǔ le.",
               [opt("A", "rain", "A person in the rain"), opt("B", "sun_hot", "A sunny day"), opt("C", "cold", "A person dressed for cold weather")],
               "A", "The sentence says it is raining today; A shows rain."),
            l2(8, "他坐飞机去北京。", "Tā zuò fēijī qù Běijīng.",
               [opt("A", "train", "A train"), opt("B", "taxi", "A taxi"), opt("C", "plane", "A passenger plane")],
               "C", "“坐飞机” means “take a plane”; C shows a plane."),
            l2(9, "女儿在睡觉。", "Nǚ'ér zài shuìjiào.",
               [opt("A", "reading", "A person reading"), opt("B", "sleeping", "A person sleeping in bed"), opt("C", "eating", "A person eating")],
               "B", "The sentence says the daughter is sleeping; B shows someone sleeping."),
            l2(10, "我们中午吃米饭。", "Wǒmen zhōngwǔ chī mǐfàn.",
               [opt("A", "rice", "A bowl of rice"), opt("B", "fruit", "A bowl of fruit"), opt("C", "water", "A glass of water")],
               "A", "The sentence says we eat rice at noon; A shows a bowl of rice."),
        ],
        "part3": {
            "pictures": [
                pic("A", "phone_call", "A person making a phone call"),
                pic("B", "shop_scene", "A shop counter with fruit"),
                pic("C", "doctor_scene", "A doctor and a patient"),
                pic("D", "restaurant_scene", "Two people eating in a restaurant"),
                pic("E", "rain", "A person in the rain"),
                pic("F", "school_scene", "A school building"),
            ],
            "items": [
                l3(11, [line("女", "喂，你在哪儿？", "Wèi, nǐ zài nǎr?"), line("男", "我在家。", "Wǒ zài jiā.")], "A",
                   "They are talking on the phone; A shows a phone call."),
                l3(12, [line("男", "这个杯子多少钱？", "Zhège bēizi duōshao qián?"), line("女", "十块钱。", "Shí kuài qián.")], "B",
                   "They are asking about a cup's price in a shop; B shows a shop."),
                l3(13, [line("女", "你怎么了？", "Nǐ zěnme le?"), line("男", "我很冷。", "Wǒ hěn lěng.")], "C",
                   "The woman asks how he feels and he says he is cold; C shows a doctor and patient."),
                l3(14, [line("男", "你想吃什么？", "Nǐ xiǎng chī shénme?"), line("女", "我想吃米饭。", "Wǒ xiǎng chī mǐfàn.")], "D",
                   "They are ordering food in a restaurant; D shows a restaurant."),
                l3(15, [line("女", "今天天气怎么样？", "Jīntiān tiānqì zěnmeyàng?"), line("男", "下雨了。", "Xià yǔ le.")], "E",
                   "The man says it is raining; E shows rain."),
            ],
        },
        "part4": [
            l4(16, "明天是三月五号，星期三。", "Míngtiān shì sān yuè wǔ hào, xīngqīsān.",
               "明天是星期几？", "Míngtiān shì xīngqī jǐ?",
               [topt("A", "星期一", "xīngqīyī"), topt("B", "星期三", "xīngqīsān"), topt("C", "星期五", "xīngqīwǔ")],
               "B", "The statement says tomorrow is Wednesday; B is 星期三."),
            l4(17, "我坐火车去北京。", "Wǒ zuò huǒchē qù Běijīng.",
               "他怎么去北京？", "Tā zěnme qù Běijīng?",
               [topt("A", "坐飞机", "zuò fēijī"), topt("B", "坐出租车", "zuò chūzūchē"), topt("C", "坐火车", "zuò huǒchē")],
               "C", "The speaker says “坐火车” (take a train); C is 坐火车."),
            l4(18, "我妈妈是老师，她在学校工作。", "Wǒ māma shì lǎoshī, tā zài xuéxiào gōngzuò.",
               "他妈妈在哪儿工作？", "Tā māma zài nǎr gōngzuò?",
               [topt("A", "学校", "xuéxiào"), topt("B", "医院", "yīyuàn"), topt("C", "商店", "shāngdiàn")],
               "A", "The statement says she works at a school; A is 学校."),
            l4(19, "我有一个女儿，她五岁。", "Wǒ yǒu yí gè nǚ'ér, tā wǔ suì.",
               "他女儿几岁？", "Tā nǚ'ér jǐ suì?",
               [topt("A", "四岁", "sì suì"), topt("B", "六岁", "liù suì"), topt("C", "五岁", "wǔ suì")],
               "C", "The daughter is five years old; C is 五岁."),
            l4(20, "昨天天气很热，今天下雨了。", "Zuótiān tiānqì hěn rè, jīntiān xià yǔ le.",
               "今天天气怎么样？", "Jīntiān tiānqì zěnmeyàng?",
               [topt("A", "很热", "hěn rè"), topt("B", "下雨", "xià yǔ"), topt("C", "很冷", "hěn lěng")],
               "B", "Today it is raining; B is 下雨."),
        ],
    },
    "reading": {
        "part1": [
            r1(21, "train", "A train on a track", "火车", "huǒchē", "√", "The picture shows a train; 火车 means “train”."),
            r1(22, "dog", "A dog sitting down", "猫", "māo", "×", "The picture shows a dog, not a cat (猫)."),
            r1(23, "apple", "A red apple with a leaf", "苹果", "píngguǒ", "√", "The picture shows an apple; 苹果 means “apple”."),
            r1(24, "computer", "A desktop computer", "电视", "diànshì", "×", "The picture shows a computer (电脑), not a television (电视)."),
            r1(25, "sleeping", "A person sleeping in bed", "睡觉", "shuìjiào", "√", "The picture shows someone sleeping; 睡觉 means “sleep”."),
        ],
        "part2": {
            "pictures": [
                pic("A", "doctor", "A doctor in a white coat"),
                pic("B", "student", "A student reading at a desk"),
                pic("C", "taxi", "A taxi at the roadside"),
                pic("D", "restaurant_scene", "Two people eating in a restaurant"),
                pic("E", "home_tv", "A person watching television at home"),
                pic("F", "rain", "A person in the rain"),
            ],
            "items": [
                r2(26, "他坐出租车去学校。", "Tā zuò chūzūchē qù xuéxiào.", "C",
                   "“坐出租车” matches C, a taxi."),
                r2(27, "她在饭馆吃米饭。", "Tā zài fànguǎn chī mǐfàn.", "D",
                   "饭馆 means “restaurant”; D shows a restaurant."),
                r2(28, "我下午在家看电视。", "Wǒ xiàwǔ zài jiā kàn diànshì.", "E",
                   "The sentence mentions watching TV at home; E shows a television at home."),
                r2(29, "我妈妈是医生，她在医院工作。", "Wǒ māma shì yīshēng, tā zài yīyuàn gōngzuò.", "A",
                   "The sentence describes a doctor; A shows a doctor."),
                r2(30, "昨天下雨了，天气很冷。", "Zuótiān xià yǔ le, tiānqì hěn lěng.", "F",
                   "The sentence says it rained yesterday and was cold; F shows rain."),
            ],
        },
        "part3": {
            "options": [
                topt("A", "我八岁。", "Wǒ bā suì."),
                topt("B", "我叫王月。", "Wǒ jiào Wáng Yuè."),
                topt("C", "现在三点。", "Xiànzài sān diǎn."),
                topt("D", "我坐火车去。", "Wǒ zuò huǒchē qù."),
                topt("E", "我喜欢苹果。", "Wǒ xǐhuan píngguǒ."),
                topt("F", "谢谢你。", "Xièxie nǐ."),
            ],
            "items": [
                r3(31, "你叫什么名字？", "Nǐ jiào shénme míngzi?", "B", "The question asks for a name; B gives the name Wang Yue."),
                r3(32, "现在几点？", "Xiànzài jǐ diǎn?", "C", "The question asks the time; C says it is three o'clock."),
                r3(33, "你几岁？", "Nǐ jǐ suì?", "A", "The question asks an age; A says “I am eight”."),
                r3(34, "你喜欢什么水果？", "Nǐ xǐhuan shénme shuǐguǒ?", "E", "The question asks about fruit; E says “I like apples”."),
                r3(35, "你怎么去北京？", "Nǐ zěnme qù Běijīng?", "D", "The question asks how; D says “I go by train”."),
            ],
        },
        "part4": {
            "options": [
                topt("A", "在", "zài"), topt("B", "几", "jǐ"), topt("C", "对不起", "duìbuqǐ"),
                topt("D", "名字", "míngzi"), topt("E", "看见", "kànjiàn"), topt("F", "学习", "xuéxí"),
            ],
            "items": [
                r4(36, "你写（　）吗？", "Nǐ xiě (　) ma?", "D", "“你写名字吗？” asks whether you write your name; D is 名字."),
                r4(37, "你家有（　）个人？", "Nǐ jiā yǒu (　) gè rén?", "B", "“你家有几个人？” asks how many people; B is 几."),
                r4(38, "我上午（　）学校。", "Wǒ shàngwǔ (　) xuéxiào.", "A", "“我上午在学校” needs the location marker 在; A."),
                r4(39, "女：（　），我不能去。 男：没关系。", "Nǚ: (　), wǒ bù néng qù. Nán: Méi guānxi.", "C",
                   "The woman apologises, so 对不起 fits; C."),
                r4(40, "明天我们（　）汉语。", "Míngtiān wǒmen (　) Hànyǔ.", "F", "“学习汉语” means study Chinese; F is 学习."),
            ],
        },
    },
}


# ---------------------------------------------------------------------------
# FORM 02 — Saturday, going to Beijing
# ---------------------------------------------------------------------------

FORM2 = {
    "id": "hsk1-mock-02",
    "number": 2,
    "title": "星期六，去北京",
    "titlePinyin": "Xīngqīliù, qù Běijīng",
    "titleEn": "Saturday, going to Beijing",
    "theme": "Weekend, weather, family and travel",
    "listening": {
        "part1": [
            l1(1, "train", "A train on a track", "坐飞机。", "Zuò fēijī.", "×",
               "The phrase says “take a plane”, but the picture shows a train."),
            l1(2, "water", "A glass of water", "喝水。", "Hē shuǐ.", "√",
               "The phrase says “drink water”; the picture shows a glass of water."),
            l1(3, "cold", "A person in a coat and scarf with snowflakes", "很冷。", "Hěn lěng.", "√",
               "The phrase says “very cold”; the picture shows a cold day."),
            l1(4, "school_scene", "A school building", "去医院。", "Qù yīyuàn.", "×",
               "The phrase says “go to the hospital”, but the picture shows a school."),
            l1(5, "phone_call", "A person making a phone call", "打电话。", "Dǎ diànhuà.", "√",
               "The phrase says “make a phone call”; the picture shows someone on the phone."),
        ],
        "part2": [
            l2(6, "我爸爸是医生。", "Wǒ bàba shì yīshēng.",
               [opt("A", "doctor", "A doctor in a white coat"), opt("B", "teacher", "A teacher at a blackboard"), opt("C", "student", "A student reading")],
               "A", "The sentence says my father is a doctor; A shows a doctor."),
            l2(7, "今天很热。", "Jīntiān hěn rè.",
               [opt("A", "cold", "A person dressed for cold weather"), opt("B", "rain", "A person in the rain"), opt("C", "sun_hot", "A sunny day")],
               "C", "The sentence says it is very hot; C shows a sunny, hot day."),
            l2(8, "他坐火车去学校。", "Tā zuò huǒchē qù xuéxiào.",
               [opt("A", "plane", "A passenger plane"), opt("B", "train", "A train"), opt("C", "taxi", "A taxi")],
               "B", "“坐火车” means “take a train”; B shows a train."),
            l2(9, "我在商店买水果。", "Wǒ zài shāngdiàn mǎi shuǐguǒ.",
               [opt("A", "shop_scene", "A shop counter with fruit"), opt("B", "restaurant_scene", "Two people eating in a restaurant"), opt("C", "hospital", "A hospital building")],
               "A", "The sentence mentions buying fruit in a shop; A shows a shop."),
            l2(10, "她在家看电视。", "Tā zài jiā kàn diànshì.",
               [opt("A", "book", "An open book"), opt("B", "computer", "A computer"), opt("C", "tv", "A television")],
               "C", "The sentence says she watches TV at home; C shows a television."),
        ],
        "part3": {
            "pictures": [
                pic("A", "train_station", "A train station with a clock"),
                pic("B", "doctor_scene", "A doctor and a patient"),
                pic("C", "restaurant_scene", "Two people eating in a restaurant"),
                pic("D", "school_scene", "A school building"),
                pic("E", "home_tv", "A person watching television at home"),
                pic("F", "shop_scene", "A shop counter with fruit"),
            ],
            "items": [
                l3(11, [line("男", "火车几点开？", "Huǒchē jǐ diǎn kāi?"), line("女", "下午三点。", "Xiàwǔ sān diǎn.")], "A",
                   "They are talking about a train time at a station; A shows a station."),
                l3(12, [line("女", "你怎么了？", "Nǐ zěnme le?"), line("男", "我很热。", "Wǒ hěn rè.")], "B",
                   "The woman asks how he feels and he says he is hot; B shows a doctor and patient."),
                l3(13, [line("女", "这个苹果多少钱？", "Zhège píngguǒ duōshao qián?"), line("男", "五块钱。", "Wǔ kuài qián.")], "F",
                   "They are asking about the price of apples in a shop; F shows a shop."),
                l3(14, [line("男", "你在哪儿工作？", "Nǐ zài nǎr gōngzuò?"), line("女", "我在学校工作。", "Wǒ zài xuéxiào gōngzuò.")], "D",
                   "She says she works at a school; D shows a school."),
                l3(15, [line("女", "你在做什么？", "Nǐ zài zuò shénme?"), line("男", "我在家看电视。", "Wǒ zài jiā kàn diànshì.")], "E",
                   "He says he is watching TV at home; E shows a person watching TV."),
            ],
        },
        "part4": [
            l4(16, "我上午七点看电视。", "Wǒ shàngwǔ qī diǎn kàn diànshì.",
               "他上午几点看电视？", "Tā shàngwǔ jǐ diǎn kàn diànshì?",
               [topt("A", "七点", "qī diǎn"), topt("B", "六点", "liù diǎn"), topt("C", "八点", "bā diǎn")],
               "A", "The statement says seven o'clock; A is 七点."),
            l4(17, "我坐出租车去火车站。", "Wǒ zuò chūzūchē qù huǒchēzhàn.",
               "他怎么去火车站？", "Tā zěnme qù huǒchēzhàn?",
               [topt("A", "坐火车", "zuò huǒchē"), topt("B", "坐出租车", "zuò chūzūchē"), topt("C", "坐飞机", "zuò fēijī")],
               "B", "The speaker says “坐出租车”; B is 坐出租车."),
            l4(18, "我妈妈是医生，她在医院工作。", "Wǒ māma shì yīshēng, tā zài yīyuàn gōngzuò.",
               "他妈妈在哪儿工作？", "Tā māma zài nǎr gōngzuò?",
               [topt("A", "学校", "xuéxiào"), topt("B", "商店", "shāngdiàn"), topt("C", "医院", "yīyuàn")],
               "C", "The statement says she works in a hospital; C is 医院."),
            l4(19, "我有一个儿子，他四岁。", "Wǒ yǒu yí gè érzi, tā sì suì.",
               "他儿子几岁？", "Tā érzi jǐ suì?",
               [topt("A", "四岁", "sì suì"), topt("B", "五岁", "wǔ suì"), topt("C", "六岁", "liù suì")],
               "A", "The son is four years old; A is 四岁."),
            l4(20, "今天天气太冷了，我不去商店。", "Jīntiān tiānqì tài lěng le, wǒ bú qù shāngdiàn.",
               "今天天气怎么样？", "Jīntiān tiānqì zěnmeyàng?",
               [topt("A", "很热", "hěn rè"), topt("B", "很冷", "hěn lěng"), topt("C", "下雨", "xià yǔ")],
               "B", "The statement says it is too cold; B is 很冷."),
        ],
    },
    "reading": {
        "part1": [
            r1(21, "plane", "A passenger plane", "飞机", "fēijī", "√", "The picture shows a plane; 飞机 means “plane”."),
            r1(22, "dog", "A dog sitting down", "狗", "gǒu", "√", "The picture shows a dog; 狗 means “dog”."),
            r1(23, "computer", "A desktop computer", "书", "shū", "×", "The picture shows a computer (电脑), not a book (书)."),
            r1(24, "water", "A glass of water", "水", "shuǐ", "√", "The picture shows a glass of water; 水 means “water”."),
            r1(25, "school_scene", "A school building", "医院", "yīyuàn", "×", "The picture shows a school (学校), not a hospital (医院)."),
        ],
        "part2": {
            "pictures": [
                pic("A", "shop_scene", "A shop counter with fruit"),
                pic("B", "doctor", "A doctor in a white coat"),
                pic("C", "school_scene", "A school building"),
                pic("D", "rain", "A person in the rain"),
                pic("E", "restaurant_scene", "Two people eating in a restaurant"),
                pic("F", "home_tv", "A person watching television at home"),
            ],
            "items": [
                r2(26, "妈妈在商店买水果。", "Māma zài shāngdiàn mǎi shuǐguǒ.", "A",
                   "The sentence mentions a shop and fruit; A shows a shop."),
                r2(27, "他是医生。", "Tā shì yīshēng.", "B",
                   "The sentence says he is a doctor; B shows a doctor."),
                r2(28, "学生在学校学习汉语。", "Xuésheng zài xuéxiào xuéxí Hànyǔ.", "C",
                   "The sentence mentions studying at school; C shows a school."),
                r2(29, "今天下雨了，天气很冷。", "Jīntiān xià yǔ le, tiānqì hěn lěng.", "D",
                   "The sentence says it is raining; D shows rain."),
                r2(30, "我们在饭馆吃米饭。", "Wǒmen zài fànguǎn chī mǐfàn.", "E",
                   "The sentence mentions eating in a restaurant; E shows a restaurant."),
            ],
        },
        "part3": {
            "options": [
                topt("A", "我七岁。", "Wǒ qī suì."),
                topt("B", "我家有三个人。", "Wǒ jiā yǒu sān gè rén."),
                topt("C", "她在医院工作。", "Tā zài yīyuàn gōngzuò."),
                topt("D", "我喜欢苹果。", "Wǒ xǐhuan píngguǒ."),
                topt("E", "谢谢你。", "Xièxie nǐ."),
                topt("F", "现在下午三点。", "Xiànzài xiàwǔ sān diǎn."),
            ],
            "items": [
                r3(31, "你妈妈在哪儿工作？", "Nǐ māma zài nǎr gōngzuò?", "C", "The question asks where the mother works; C says in a hospital."),
                r3(32, "你多大了？", "Nǐ duō dà le?", "A", "The question asks an age; A says “I am seven”."),
                r3(33, "你爱吃什么水果？", "Nǐ ài chī shénme shuǐguǒ?", "D", "The question asks about fruit; D says “I like apples”."),
                r3(34, "你家有几个人？", "Nǐ jiā yǒu jǐ gè rén?", "B", "The question asks how many people are in the family; B says three."),
                r3(35, "现在几点？", "Xiànzài jǐ diǎn?", "F", "The question asks the time; F says three in the afternoon."),
            ],
        },
        "part4": {
            "options": [
                topt("A", "谁", "shéi"), topt("B", "在", "zài"), topt("C", "漂亮", "piàoliang"),
                topt("D", "多少", "duōshao"), topt("E", "喝", "hē"), topt("F", "医院", "yīyuàn"),
            ],
            "items": [
                r4(36, "这个杯子（　）吗？", "Zhège bēizi (　) ma?", "C", "“这个杯子漂亮吗？” asks whether the cup is pretty; C is 漂亮."),
                r4(37, "（　）是王老师？", "(　) shì Wáng lǎoshī?", "A", "“谁是王老师？” asks who Teacher Wang is; A is 谁."),
                r4(38, "你妈妈在（　）工作。", "Nǐ māma zài (　) gōngzuò.", "F", "The sentence needs a workplace; F is 医院."),
                r4(39, "你有（　）钱？", "Nǐ yǒu (　) qián?", "D", "“你有多少钱？” asks how much money you have; D is 多少."),
                r4(40, "我想（　）茶。", "Wǒ xiǎng (　) chá.", "E", "“我想喝茶” needs the verb 喝; E."),
            ],
        },
    },
}


# ---------------------------------------------------------------------------
# FORM 03 — Friends and home
# ---------------------------------------------------------------------------

FORM3 = {
    "id": "hsk1-mock-03",
    "number": 3,
    "title": "朋友和家",
    "titlePinyin": "Péngyou hé jiā",
    "titleEn": "Friends and home",
    "theme": "Home, friends, daily routines and a short trip",
    "listening": {
        "part1": [
            l1(1, "plane", "A passenger plane", "坐火车。", "Zuò huǒchē.", "×",
               "The phrase says “take a train”, but the picture shows a plane."),
            l1(2, "tea", "A cup of tea on a saucer", "一个杯子。", "Yí gè bēizi.", "√",
               "The phrase says “a cup”; the picture shows a cup."),
            l1(3, "sleeping", "A person sleeping in bed", "睡觉。", "Shuìjiào.", "√",
               "The phrase says “sleep”; the picture shows someone sleeping."),
            l1(4, "hospital", "A hospital building", "在商店买东西。", "Zài shāngdiàn mǎi dōngxi.", "×",
               "The phrase says “buy things in a shop”, but the picture shows a hospital."),
            l1(5, "reading", "A person reading a book", "写名字。", "Xiě míngzi.", "×",
               "The phrase says “write a name”, but the picture shows someone reading."),
        ],
        "part2": [
            l2(6, "我妈妈在饭馆工作。", "Wǒ māma zài fànguǎn gōngzuò.",
               [opt("A", "school_scene", "A school building"), opt("B", "restaurant_scene", "Two people eating in a restaurant"), opt("C", "hospital", "A hospital building")],
               "B", "The sentence says my mother works in a restaurant; B shows a restaurant."),
            l2(7, "今天很冷。", "Jīntiān hěn lěng.",
               [opt("A", "cold", "A person dressed for cold weather"), opt("B", "sun_hot", "A sunny day"), opt("C", "rain", "A person in the rain")],
               "A", "The sentence says it is very cold; A shows a cold day."),
            l2(8, "我们坐出租车去火车站。", "Wǒmen zuò chūzūchē qù huǒchēzhàn.",
               [opt("A", "train", "A train"), opt("B", "plane", "A passenger plane"), opt("C", "taxi", "A taxi")],
               "C", "“坐出租车” means “take a taxi”; C shows a taxi."),
            l2(9, "我朋友喜欢小狗。", "Wǒ péngyou xǐhuan xiǎo gǒu.",
               [opt("A", "dog", "A small dog"), opt("B", "cat", "A cat"), opt("C", "apple", "An apple")],
               "A", "The sentence says my friend likes small dogs; A shows a dog."),
            l2(10, "她下午在家睡觉。", "Tā xiàwǔ zài jiā shuìjiào.",
               [opt("A", "reading", "A person reading"), opt("B", "sleeping", "A person sleeping in bed"), opt("C", "writing", "A person writing")],
               "B", "The sentence says she sleeps at home in the afternoon; B shows sleeping."),
        ],
        "part3": {
            "pictures": [
                pic("A", "taxi", "A taxi at the roadside"),
                pic("B", "plane", "A passenger plane"),
                pic("C", "train_station", "A train station with a clock"),
                pic("D", "shop_scene", "A shop counter with fruit"),
                pic("E", "hospital", "A hospital building"),
                pic("F", "home", "A house"),
            ],
            "items": [
                l3(11, [line("女", "火车站在哪儿？", "Huǒchēzhàn zài nǎr?"), line("男", "在前面。", "Zài qiánmiàn.")], "C",
                   "They are asking where the train station is; C shows a station."),
                l3(12, [line("女", "我们怎么去火车站？", "Wǒmen zěnme qù huǒchēzhàn?"), line("男", "坐出租车去。", "Zuò chūzūchē qù.")], "A",
                   "They decide to take a taxi; A shows a taxi."),
                l3(13, [line("男", "你明天怎么去北京？", "Nǐ míngtiān zěnme qù Běijīng?"), line("女", "坐飞机去。", "Zuò fēijī qù.")], "B",
                   "She says she will go by plane; B shows a plane."),
                l3(14, [line("男", "这个水果多少钱？", "Zhège shuǐguǒ duōshao qián?"), line("女", "五块钱。", "Wǔ kuài qián.")], "D",
                   "They are asking about the price of fruit in a shop; D shows a shop."),
                l3(15, [line("女", "你妈妈在哪儿工作？", "Nǐ māma zài nǎr gōngzuò?"), line("男", "她在医院工作。", "Tā zài yīyuàn gōngzuò.")], "E",
                   "He says his mother works in a hospital; E shows a hospital."),
            ],
        },
        "part4": [
            l4(16, "我下午三点看电视。", "Wǒ xiàwǔ sān diǎn kàn diànshì.",
               "他下午几点看电视？", "Tā xiàwǔ jǐ diǎn kàn diànshì?",
               [topt("A", "三点", "sān diǎn"), topt("B", "四点", "sì diǎn"), topt("C", "五点", "wǔ diǎn")],
               "A", "The statement says three o'clock; A is 三点."),
            l4(17, "我坐飞机去北京。", "Wǒ zuò fēijī qù Běijīng.",
               "他怎么去北京？", "Tā zěnme qù Běijīng?",
               [topt("A", "坐火车", "zuò huǒchē"), topt("B", "坐飞机", "zuò fēijī"), topt("C", "坐出租车", "zuò chūzūchē")],
               "B", "The speaker says “坐飞机”; B is 坐飞机."),
            l4(18, "我爸爸是老师，他在学校工作。", "Wǒ bàba shì lǎoshī, tā zài xuéxiào gōngzuò.",
               "他爸爸在哪儿工作？", "Tā bàba zài nǎr gōngzuò?",
               [topt("A", "医院", "yīyuàn"), topt("B", "学校", "xuéxiào"), topt("C", "商店", "shāngdiàn")],
               "B", "The statement says his father works at a school; B is 学校."),
            l4(19, "我有一个女儿，她六岁。", "Wǒ yǒu yí gè nǚ'ér, tā liù suì.",
               "他女儿几岁？", "Tā nǚ'ér jǐ suì?",
               [topt("A", "五岁", "wǔ suì"), topt("B", "七岁", "qī suì"), topt("C", "六岁", "liù suì")],
               "C", "The daughter is six years old; C is 六岁."),
            l4(20, "今天天气很热。", "Jīntiān tiānqì hěn rè.",
               "今天天气怎么样？", "Jīntiān tiānqì zěnmeyàng?",
               [topt("A", "很热", "hěn rè"), topt("B", "很冷", "hěn lěng"), topt("C", "下雨", "xià yǔ")],
               "A", "The statement says it is very hot; A is 很热."),
        ],
    },
    "reading": {
        "part1": [
            r1(21, "taxi", "A taxi at the roadside", "火车", "huǒchē", "×", "The picture shows a taxi (出租车), not a train (火车)."),
            r1(22, "cat", "A cat sitting down", "猫", "māo", "√", "The picture shows a cat; 猫 means “cat”."),
            r1(23, "tea", "A cup of tea on a saucer", "水", "shuǐ", "×", "The picture shows tea (茶), not a glass of water (水)."),
            r1(24, "fruit", "A bowl of fruit", "水果", "shuǐguǒ", "√", "The picture shows fruit; 水果 means “fruit”."),
            r1(25, "book", "An open book", "电视", "diànshì", "×", "The picture shows a book (书), not a television (电视)."),
        ],
        "part2": {
            "pictures": [
                pic("A", "restaurant_scene", "Two people eating in a restaurant"),
                pic("B", "train_station", "A train station with a clock"),
                pic("C", "shop_scene", "A shop counter with fruit"),
                pic("D", "home_tv", "A person watching television at home"),
                pic("E", "doctor", "A doctor in a white coat"),
                pic("F", "school_scene", "A school building"),
            ],
            "items": [
                r2(26, "我们中午在饭馆吃米饭。", "Wǒmen zhōngwǔ zài fànguǎn chī mǐfàn.", "A",
                   "The sentence mentions eating in a restaurant; A shows a restaurant."),
                r2(27, "他坐火车去北京。", "Tā zuò huǒchē qù Běijīng.", "B",
                   "The sentence mentions a train; B shows a train station."),
                r2(28, "她上午在商店买水果。", "Tā shàngwǔ zài shāngdiàn mǎi shuǐguǒ.", "C",
                   "The sentence mentions a shop and fruit; C shows a shop."),
                r2(29, "她上午在家看电视。", "Tā shàngwǔ zài jiā kàn diànshì.", "D",
                   "The sentence mentions watching TV at home; D shows a television at home."),
                r2(30, "我朋友是医生。", "Wǒ péngyou shì yīshēng.", "E",
                   "The sentence says my friend is a doctor; E shows a doctor."),
            ],
        },
        "part3": {
            "options": [
                topt("A", "我叫李月。", "Wǒ jiào Lǐ Yuè."),
                topt("B", "现在上午九点。", "Xiànzài shàngwǔ jiǔ diǎn."),
                topt("C", "我吃苹果。", "Wǒ chī píngguǒ."),
                topt("D", "我家有四个人。", "Wǒ jiā yǒu sì gè rén."),
                topt("E", "谢谢你。", "Xièxie nǐ."),
                topt("F", "我坐出租车去。", "Wǒ zuò chūzūchē qù."),
            ],
            "items": [
                r3(31, "你叫什么？", "Nǐ jiào shénme?", "A", "The question asks for a name; A gives the name Li Yue."),
                r3(32, "你家有几个人？", "Nǐ jiā yǒu jǐ gè rén?", "D", "The question asks how many people are in the family; D says four."),
                r3(33, "现在几点？", "Xiànzài jǐ diǎn?", "B", "The question asks the time; B says nine in the morning."),
                r3(34, "你怎么去学校？", "Nǐ zěnme qù xuéxiào?", "F", "The question asks how; F says “I go by taxi”."),
                r3(35, "你吃什么水果？", "Nǐ chī shénme shuǐguǒ?", "C", "The question asks what fruit you eat; C says “I eat apples”."),
            ],
        },
        "part4": {
            "options": [
                topt("A", "住", "zhù"), topt("B", "多少", "duōshao"), topt("C", "高兴", "gāoxìng"),
                topt("D", "看见", "kànjiàn"), topt("E", "几", "jǐ"), topt("F", "对不起", "duìbuqǐ"),
            ],
            "items": [
                r4(36, "你（　）在哪儿？", "Nǐ (　) zài nǎr?", "A", "“你住在哪儿？” asks where you live; A is 住."),
                r4(37, "这个杯子（　）钱？", "Zhège bēizi (　) qián?", "B", "“这个杯子多少钱？” asks the price; B is 多少."),
                r4(38, "认识你，我很（　）。", "Rènshi nǐ, wǒ hěn (　).", "C", "“认识你，我很高兴” expresses pleasure; C is 高兴."),
                r4(39, "女：（　），我不能去学校。 男：没关系。", "Nǚ: (　), wǒ bù néng qù xuéxiào. Nán: Méi guānxi.", "F",
                   "The woman apologises, so 对不起 fits; F."),
                r4(40, "你（　）王老师了吗？", "Nǐ (　) Wáng lǎoshī le ma?", "D", "“你看见王老师了吗？” asks whether you saw Teacher Wang; D is 看见."),
            ],
        },
    },
}


FORMS = [FORM1, FORM2, FORM3]

FORM_BY_ID = {form["id"]: form for form in FORMS}
