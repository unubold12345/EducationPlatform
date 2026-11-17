"""Authoring source for the three offline HSK 2 mock forms.

The forms follow the regular HSK 2 (HSK 2.0) paper: 60 items, Listening 35 (parts of 10, 10, 10 and 5) and
Reading 25 (parts of 5, 5, 5 and 10), 55 minutes including five for personal information.  Vocabulary is the
300-word HSK 1-2 syllabus; build.py lists the few extra tokens (names, split verbs) and checks every sentence.

All sentences, dialogues, keys, explanations and drawings are original.  No official HSK question, recording,
picture or answer key is reproduced.
"""

from __future__ import annotations


def J(n, scene, alt, text, pinyin, answer, explanation):
    """Listening 1: one sentence judged against one picture."""
    return {"n": n, "scene": scene, "alt": alt, "sentence": text, "pinyin": pinyin, "answer": answer, "explanation": explanation}


def P(label, scene, alt):
    return {"label": label, "scene": scene, "alt": alt}


def T(speaker, text, pinyin):
    return {"speaker": speaker, "text": text, "pinyin": pinyin}


def D(n, turns, answer, explanation):
    """Listening 2: a two-turn dialogue matched to a picture."""
    return {"n": n, "dialogue": turns, "answer": answer, "explanation": explanation}


def O(label, text, pinyin):
    return {"label": label, "text": text, "pinyin": pinyin}


def Q(n, turns, question, question_pinyin, options, answer, explanation):
    """Listening 3 and 4: a dialogue, a spoken question and three printed answers."""
    return {"n": n, "dialogue": turns, "question": question, "questionPinyin": question_pinyin,
            "options": [O(label, text, pinyin) for label, (text, pinyin) in zip("ABC", options)],
            "answer": answer, "explanation": explanation}


def S(n, sentence, pinyin, answer, explanation):
    """Reading 1, 2 and 4: one printed sentence and the letter it takes."""
    return {"n": n, "sentence": sentence, "pinyin": pinyin, "answer": answer, "explanation": explanation}


def R(n, text, pinyin, statement, statement_pinyin, answer, explanation):
    """Reading 3: a short text and a starred statement judged true or false."""
    return {"n": n, "text": text, "pinyin": pinyin, "statement": statement, "statementPinyin": statement_pinyin,
            "answer": answer, "explanation": explanation}


# Shared worked examples (not scored). Parts whose example uses one of the form's own pictures or options keep
# it inside the form, as on the paper.
EXAMPLES = {
    "listening": {
        "part1": J(0, "reading", "A woman reading a book on a sofa", "她在看书。", "Tā zài kàn shū.", "√",
                   "The sentence says she is reading a book; the picture shows a woman reading."),
        "part3": Q(0, [T("女", "你看见我的铅笔了吗？", "Nǐ kànjiàn wǒ de qiānbǐ le ma?"),
                       T("男", "在电脑旁边，那个红的是你的吗？", "Zài diànnǎo pángbiān, nàge hóng de shì nǐ de ma?")],
                   "铅笔在哪儿？", "Qiānbǐ zài nǎr?",
                   [("椅子上", "yǐzi shang"), ("电脑旁边", "diànnǎo pángbiān"), ("房间外面", "fángjiān wàimiàn")], "B",
                   "The man says the pencil is beside the computer; B is 电脑旁边."),
        "part4": Q(0, [T("女", "你好，请问李医生在吗？", "Nǐ hǎo, qǐngwèn Lǐ yīshēng zài ma?"),
                       T("男", "他不在，他今天休息。", "Tā bú zài, tā jīntiān xiūxi."),
                       T("女", "他明天来上班吗？", "Tā míngtiān lái shàngbān ma?"),
                       T("男", "来，他明天上午在。", "Lái, tā míngtiān shàngwǔ zài.")],
                   "李医生什么时候上班？", "Lǐ yīshēng shénme shíhou shàngbān?",
                   [("今天上午", "jīntiān shàngwǔ"), ("明天上午", "míngtiān shàngwǔ"), ("明天晚上", "míngtiān wǎnshang")], "B",
                   "Doctor Li is resting today and will be in tomorrow morning; B is 明天上午."),
    },
    "reading": {
        "part3": R(0, "我每天早上六点起床，七点坐公共汽车去学校。", "Wǒ měi tiān zǎoshang liù diǎn qǐchuáng, qī diǎn zuò gōnggòng qìchē qù xuéxiào.",
                   "他每天早上七点起床。", "Tā měi tiān zǎoshang qī diǎn qǐchuáng.", "×",
                   "He gets up at six and takes the bus at seven, so the statement is false."),
    },
}


# ---------------------------------------------------------------------------
# FORM 01 — Sport and health
# ---------------------------------------------------------------------------

FORM1 = {
    "id": "hsk2-mock-01", "number": 1,
    "title": "运动和身体", "titlePinyin": "Yùndòng hé shēntǐ", "titleEn": "Sport and health",
    "theme": "Sport, health, the doctor and daily routines",
    "listening": {
        "part1": [
            J(1, "getting_up", "A person sitting up in bed and stretching in the morning", "他起床了。", "Tā qǐchuáng le.", "√",
              "The sentence says he has got up; the picture shows someone getting out of bed."),
            J(2, "singing", "A woman singing into a microphone", "她正在踢足球。", "Tā zhèngzài tī zúqiú.", "×",
              "The sentence says she is playing football, but she is singing."),
            J(3, "milk", "A glass of milk and a milk bottle on a table", "桌子上有一杯牛奶。", "Zhuōzi shang yǒu yì bēi niúnǎi.", "√",
              "The sentence says there is a glass of milk on the table; the picture shows it."),
            J(4, "washing", "A woman washing clothes in a tub", "她在洗衣服。", "Tā zài xǐ yīfu.", "√",
              "The sentence says she is washing clothes; the picture shows that."),
            J(5, "cooking", "A woman cooking at a stove", "她在打篮球。", "Tā zài dǎ lánqiú.", "×",
              "The sentence says she is playing basketball, but she is cooking."),
            J(6, "watch", "A wristwatch", "这是我的手表。", "Zhè shì wǒ de shǒubiǎo.", "√",
              "The sentence says “this is my watch”; the picture shows a watch."),
            J(7, "rain", "A person with an umbrella in the rain", "今天是晴天。", "Jīntiān shì qíngtiān.", "×",
              "The sentence says today is sunny, but it is raining."),
            J(8, "eggs", "Two eggs on a plate", "我早上吃了两个鸡蛋。", "Wǒ zǎoshang chī le liǎng gè jīdàn.", "√",
              "The sentence mentions two eggs; the picture shows two eggs."),
            J(9, "hospital", "A hospital building with an ambulance", "这是一家医院。", "Zhè shì yì jiā yīyuàn.", "√",
              "The sentence says “this is a hospital”; the picture shows one."),
            J(10, "bus", "A city bus", "我每天坐出租车去学校。", "Wǒ měi tiān zuò chūzūchē qù xuéxiào.", "×",
              "The sentence says “by taxi”, but the picture shows a bus."),
        ],
        "part2": {
            "setA": {
                "pictures": [
                    P("A", "noodles", "A bowl of noodles"), P("B", "swimming", "A person swimming in a pool"),
                    P("C", "coffee", "A cup of coffee"), P("D", "medicine", "A medicine bottle and pills"),
                    P("E", "football", "A person kicking a football"), P("F", "dancing", "Two people dancing"),
                ],
                "example": D(0, [T("男", "你想喝什么？", "Nǐ xiǎng hē shénme?"), T("女", "我想喝一杯咖啡。", "Wǒ xiǎng hē yì bēi kāfēi.")], "C",
                             "She wants a cup of coffee; C shows coffee."),
                "items": [
                    D(11, [T("女", "你下午去做什么？", "Nǐ xiàwǔ qù zuò shénme?"), T("男", "我和同学去踢足球。", "Wǒ hé tóngxué qù tī zúqiú.")], "E",
                      "He is going to play football with classmates; E shows football."),
                    D(12, [T("男", "医生，这个药怎么吃？", "Yīshēng, zhège yào zěnme chī?"), T("女", "每天吃三次，一次吃两个。", "Měi tiān chī sān cì, yí cì chī liǎng gè.")], "D",
                      "They are talking about how to take medicine; D shows medicine."),
                    D(13, [T("女", "你游得真快！", "Nǐ yóu de zhēn kuài!"), T("男", "我每个星期都来游三次。", "Wǒ měi gè xīngqī dōu lái yóu sān cì.")], "B",
                      "They are talking about swimming; B shows a swimmer."),
                    D(14, [T("男", "这家饭馆的面条很好吃。", "Zhè jiā fànguǎn de miàntiáo hěn hǎochī."), T("女", "是吗？那我也要一个。", "Shì ma? Nà wǒ yě yào yí gè.")], "A",
                      "The man praises the noodles; A shows a bowl of noodles."),
                    D(15, [T("女", "你会跳舞吗？", "Nǐ huì tiàowǔ ma?"), T("男", "会一点儿，我去年开始学的。", "Huì yìdiǎnr, wǒ qùnián kāishǐ xué de.")], "F",
                      "They are talking about dancing; F shows people dancing."),
                ],
            },
            "setB": {
                "pictures": [
                    P("A", "running", "A person running in a park"), P("B", "snow", "A snowman on a snowy day"),
                    P("C", "watermelon", "A watermelon and a slice"), P("D", "sick", "A sick person lying in bed"),
                    P("E", "basketball", "A person shooting a basketball"),
                ],
                "items": [
                    D(16, [T("男", "外面下雪了，真漂亮！", "Wàimiàn xià xuě le, zhēn piàoliang!"), T("女", "是的，我们出去玩吧。", "Shì de, wǒmen chūqù wán ba.")], "B",
                      "It is snowing outside; B shows snow."),
                    D(17, [T("女", "你怎么了？为什么不去上班？", "Nǐ zěnme le? Wèi shénme bú qù shàngbān?"), T("男", "我生病了，医生让我在家休息。", "Wǒ shēngbìng le, yīshēng ràng wǒ zài jiā xiūxi.")], "D",
                      "The man is ill and resting at home; D shows a sick person in bed."),
                    D(18, [T("男", "这个西瓜多少钱？", "Zhège xīguā duōshao qián?"), T("女", "十五块，非常好吃。", "Shíwǔ kuài, fēicháng hǎochī.")], "C",
                      "They are talking about a watermelon; C shows one."),
                    D(19, [T("女", "你每天早上都跑步吗？", "Nǐ měi tiān zǎoshang dōu pǎobù ma?"), T("男", "对，我每天跑三十分钟。", "Duì, wǒ měi tiān pǎo sānshí fēnzhōng.")], "A",
                      "He runs every morning; A shows a runner."),
                    D(20, [T("男", "下课了，我们一起去打篮球吧。", "Xià kè le, wǒmen yìqǐ qù dǎ lánqiú ba."), T("女", "好，等我一下。", "Hǎo, děng wǒ yíxià.")], "E",
                      "They are going to play basketball; E shows basketball."),
                ],
            },
        },
        "part3": [
            Q(21, [T("男", "你哥哥比你高吗？", "Nǐ gēge bǐ nǐ gāo ma?"), T("女", "不，我比他高一点儿。", "Bù, wǒ bǐ tā gāo yìdiǎnr.")],
              "谁高一点儿？", "Shéi gāo yìdiǎnr?", [("哥哥", "gēge"), ("妹妹", "mèimei"), ("爸爸", "bàba")], "B",
              "The woman says she is a little taller than her elder brother, so the younger sister is taller."),
            Q(22, [T("女", "你今天很累吗？", "Nǐ jīntiān hěn lèi ma?"), T("男", "是的，我上午游泳，下午踢足球了。", "Shì de, wǒ shàngwǔ yóuyǒng, xiàwǔ tī zúqiú le.")],
              "男的下午做什么了？", "Nán de xiàwǔ zuò shénme le?", [("游泳", "yóuyǒng"), ("跑步", "pǎobù"), ("踢足球", "tī zúqiú")], "C",
              "He swam in the morning and played football in the afternoon."),
            Q(23, [T("男", "医生，我的眼睛怎么了？", "Yīshēng, wǒ de yǎnjing zěnme le?"), T("女", "没什么问题，别每天看手机了，多休息。", "Méi shénme wèntí, bié měi tiān kàn shǒujī le, duō xiūxi.")],
              "医生让男的做什么？", "Yīshēng ràng nán de zuò shénme?", [("多休息", "duō xiūxi"), ("多看手机", "duō kàn shǒujī"), ("多吃药", "duō chī yào")], "A",
              "The doctor tells him to stop looking at his phone every day and rest more."),
            Q(24, [T("女", "请问，医院在哪儿？", "Qǐngwèn, yīyuàn zài nǎr?"), T("男", "就在学校旁边，走五分钟就到了。", "Jiù zài xuéxiào pángbiān, zǒu wǔ fēnzhōng jiù dào le.")],
              "医院在哪儿？", "Yīyuàn zài nǎr?", [("学校旁边", "xuéxiào pángbiān"), ("商店后面", "shāngdiàn hòumiàn"), ("公司前面", "gōngsī qiánmiàn")], "A",
              "The man says the hospital is right beside the school."),
            Q(25, [T("男", "你每天几点起床？", "Nǐ měi tiān jǐ diǎn qǐchuáng?"), T("女", "我六点起床，六点十分去跑步。", "Wǒ liù diǎn qǐchuáng, liù diǎn shí fēn qù pǎobù.")],
              "女的几点去跑步？", "Nǚ de jǐ diǎn qù pǎobù?", [("六点", "liù diǎn"), ("六点十分", "liù diǎn shí fēn"), ("六点三十分", "liù diǎn sānshí fēn")], "B",
              "She gets up at six and goes running at ten past six."),
            Q(26, [T("女", "今天的羊肉很便宜，你买了吗？", "Jīntiān de yángròu hěn piányi, nǐ mǎi le ma?"), T("男", "没有，我买了鱼和鸡蛋。", "Méiyǒu, wǒ mǎi le yú hé jīdàn.")],
              "男的没买什么？", "Nán de méi mǎi shénme?", [("鱼", "yú"), ("鸡蛋", "jīdàn"), ("羊肉", "yángròu")], "C",
              "He bought fish and eggs, not mutton."),
            Q(27, [T("男", "你觉得游泳和跑步，哪个好？", "Nǐ juéde yóuyǒng hé pǎobù, nǎ ge hǎo?"), T("女", "我觉得游泳好，因为我不喜欢跑步。", "Wǒ juéde yóuyǒng hǎo, yīnwèi wǒ bù xǐhuan pǎobù.")],
              "女的喜欢什么运动？", "Nǚ de xǐhuan shénme yùndòng?", [("跑步", "pǎobù"), ("游泳", "yóuyǒng"), ("打篮球", "dǎ lánqiú")], "B",
              "She thinks swimming is better and does not like running."),
            Q(28, [T("女", "你的药吃完了吗？", "Nǐ de yào chī wán le ma?"), T("男", "还没有，还要吃两天。", "Hái méiyǒu, hái yào chī liǎng tiān.")],
              "男的还要吃几天药？", "Nán de hái yào chī jǐ tiān yào?", [("两天", "liǎng tiān"), ("三天", "sān tiān"), ("四天", "sì tiān")], "A",
              "He still has to take the medicine for two more days."),
            Q(29, [T("男", "小王今天为什么没来上课？", "Xiǎo Wáng jīntiān wèi shénme méi lái shàng kè?"), T("女", "他生病了，他妈妈送他去医院了。", "Tā shēngbìng le, tā māma sòng tā qù yīyuàn le.")],
              "小王现在可能在哪儿？", "Xiǎo Wáng xiànzài kěnéng zài nǎr?", [("教室", "jiàoshì"), ("家", "jiā"), ("医院", "yīyuàn")], "C",
              "His mother took him to hospital, so he is probably there."),
            Q(30, [T("女", "明天你和我们一起去打篮球吗？", "Míngtiān nǐ hé wǒmen yìqǐ qù dǎ lánqiú ma?"), T("男", "对不起，我明天有考试，不能去。", "Duìbuqǐ, wǒ míngtiān yǒu kǎoshì, bù néng qù.")],
              "男的明天要做什么？", "Nán de míngtiān yào zuò shénme?", [("打篮球", "dǎ lánqiú"), ("考试", "kǎoshì"), ("上班", "shàngbān")], "B",
              "He has an exam tomorrow and cannot go."),
        ],
        "part4": [
            Q(31, [T("女", "你身体怎么样了？", "Nǐ shēntǐ zěnmeyàng le?"), T("男", "好多了，谢谢你。", "Hǎo duō le, xièxie nǐ."),
                   T("女", "明天能来上班吗？", "Míngtiān néng lái shàngbān ma?"), T("男", "医生说我还要休息两天。", "Yīshēng shuō wǒ hái yào xiūxi liǎng tiān.")],
              "医生让男的做什么？", "Yīshēng ràng nán de zuò shénme?", [("多运动", "duō yùndòng"), ("再休息两天", "zài xiūxi liǎng tiān"), ("明天上班", "míngtiān shàngbān")], "B",
              "The doctor said he must rest for two more days."),
            Q(32, [T("男", "你每天都运动吗？", "Nǐ měi tiān dōu yùndòng ma?"), T("女", "是的，我早上跑步，晚上游泳。", "Shì de, wǒ zǎoshang pǎobù, wǎnshang yóuyǒng."),
                   T("男", "你不累吗？", "Nǐ bú lèi ma?"), T("女", "不累，运动对身体好。", "Bú lèi, yùndòng duì shēntǐ hǎo.")],
              "女的晚上做什么运动？", "Nǚ de wǎnshang zuò shénme yùndòng?", [("游泳", "yóuyǒng"), ("跑步", "pǎobù"), ("踢足球", "tī zúqiú")], "A",
              "She runs in the morning and swims in the evening."),
            Q(33, [T("女", "喂，你在哪儿呢？", "Wèi, nǐ zài nǎr ne?"), T("男", "我在学校踢足球呢。", "Wǒ zài xuéxiào tī zúqiú ne."),
                   T("女", "几点回家？我准备做饭了。", "Jǐ diǎn huí jiā? Wǒ zhǔnbèi zuò fàn le."), T("男", "再踢二十分钟，六点就到家。", "Zài tī èrshí fēnzhōng, liù diǎn jiù dào jiā.")],
              "男的现在在做什么？", "Nán de xiànzài zài zuò shénme?", [("踢足球", "tī zúqiú"), ("做饭", "zuò fàn"), ("睡觉", "shuìjiào")], "A",
              "He says he is playing football at school."),
            Q(34, [T("男", "您好，我想买这个药。", "Nín hǎo, wǒ xiǎng mǎi zhège yào."), T("女", "您怎么了？", "Nín zěnme le?"),
                   T("男", "我眼睛不太好，看东西很累。", "Wǒ yǎnjing bú tài hǎo, kàn dōngxi hěn lèi."),
                   T("女", "那您别吃这个药，去医院让医生看一下吧。", "Nà nín bié chī zhège yào, qù yīyuàn ràng yīshēng kàn yíxià ba.")],
              "女的让男的做什么？", "Nǚ de ràng nán de zuò shénme?", [("买药", "mǎi yào"), ("多睡觉", "duō shuìjiào"), ("去医院", "qù yīyuàn")], "C",
              "She tells him not to take this medicine and to see a doctor at the hospital."),
            Q(35, [T("女", "星期日的跑步考试，你准备好了吗？", "Xīngqīrì de pǎobù kǎoshì, nǐ zhǔnbèi hǎo le ma?"), T("男", "还没有，我跑得太慢了。", "Hái méiyǒu, wǒ pǎo de tài màn le."),
                   T("女", "别说了，我们现在就去跑吧。", "Bié shuō le, wǒmen xiànzài jiù qù pǎo ba."), T("男", "好，我去穿一件衣服。", "Hǎo, wǒ qù chuān yí jiàn yīfu.")],
              "他们现在要去做什么？", "Tāmen xiànzài yào qù zuò shénme?", [("买衣服", "mǎi yīfu"), ("考试", "kǎoshì"), ("跑步", "pǎobù")], "C",
              "She suggests going running right now and he agrees."),
        ],
    },
    "reading": {
        "part1": {
            "pictures": [
                P("A", "basketball", "A person shooting a basketball"), P("B", "newspaper", "A man reading a newspaper"),
                P("C", "medicine", "A medicine bottle and pills"), P("D", "fish", "A cooked fish on a plate"),
                P("E", "cold", "A person shivering in cold weather"), P("F", "sleeping", "A person asleep in bed"),
            ],
            "example": S(0, "他每天晚上十点睡觉。", "Tā měi tiān wǎnshang shí diǎn shuìjiào.", "F", "He goes to sleep at ten every night; F shows someone asleep."),
            "items": [
                S(36, "他正在看报纸，别和他说话。", "Tā zhèngzài kàn bàozhǐ, bié hé tā shuōhuà.", "B", "He is reading a newspaper; B shows that."),
                S(37, "外面非常冷，你多穿一件衣服吧。", "Wàimiàn fēicháng lěng, nǐ duō chuān yí jiàn yīfu ba.", "E", "It is very cold outside; E shows cold weather."),
                S(38, "这个药一天吃两次，一次吃一个。", "Zhège yào yì tiān chī liǎng cì, yí cì chī yí gè.", "C", "The sentence is about taking medicine; C shows medicine."),
                S(39, "弟弟最喜欢的运动是打篮球。", "Dìdi zuì xǐhuan de yùndòng shì dǎ lánqiú.", "A", "His favourite sport is basketball; A shows basketball."),
                S(40, "今天晚上妈妈做了鱼，真好吃。", "Jīntiān wǎnshang māma zuò le yú, zhēn hǎochī.", "D", "Mother cooked fish; D shows a fish dish."),
            ],
        },
        "part2": {
            "options": [O("A", "身体", "shēntǐ"), O("B", "已经", "yǐjīng"), O("C", "运动", "yùndòng"), O("D", "因为", "yīnwèi"), O("E", "离", "lí"), O("F", "贵", "guì")],
            "example": S(0, "这儿的羊肉很好吃，但是也很（　）。", "Zhèr de yángròu hěn hǎochī, dànshì yě hěn (　).", "F", "“Tasty but also expensive”: F is 贵."),
            "items": [
                S(41, "医院（　）我家很近，走路十分钟就到。", "Yīyuàn (　) wǒ jiā hěn jìn, zǒu lù shí fēnzhōng jiù dào.", "E", "离 gives the distance between two places."),
                S(42, "我爸爸七十岁了，但是他的（　）非常好。", "Wǒ bàba qīshí suì le, dànshì tā de (　) fēicháng hǎo.", "A", "At seventy his health (身体) is very good."),
                S(43, "他每天都去游泳，游泳是他最喜欢的（　）。", "Tā měi tiān dōu qù yóuyǒng, yóuyǒng shì tā zuì xǐhuan de (　).", "C", "Swimming is his favourite sport (运动)."),
                S(44, "（　）昨天睡得太晚，所以他今天很累。", "(　) zuótiān shuì de tài wǎn, suǒyǐ tā jīntiān hěn lèi.", "D", "因为 … 所以 … gives the reason and the result."),
                S(45, "女：你今天吃药了吗？男：我（　）吃了，谢谢你。", "Nǚ: Nǐ jīntiān chī yào le ma? Nán: Wǒ (　) chī le, xièxie nǐ.", "B", "“I have already taken it”: B is 已经."),
            ],
        },
        "part3": [
            R(46, "我每天早上跑步，已经跑了两年了，现在身体比去年好多了。", "Wǒ měi tiān zǎoshang pǎobù, yǐjīng pǎo le liǎng nián le, xiànzài shēntǐ bǐ qùnián hǎo duō le.",
              "他去年开始跑步。", "Tā qùnián kāishǐ pǎobù.", "×", "He has been running for two years, so he did not start last year."),
            R(47, "哥哥最喜欢踢足球，他每个星期六下午都和朋友一起去踢。", "Gēge zuì xǐhuan tī zúqiú, tā měi gè xīngqīliù xiàwǔ dōu hé péngyou yìqǐ qù tī.",
              "哥哥星期六下午去踢足球。", "Gēge xīngqīliù xiàwǔ qù tī zúqiú.", "√", "He plays with friends every Saturday afternoon."),
            R(48, "虽然今天下雪了，天气很冷，但是来游泳的人也很多。", "Suīrán jīntiān xià xuě le, tiānqì hěn lěng, dànshì lái yóuyǒng de rén yě hěn duō.",
              "今天没有人来游泳。", "Jīntiān méiyǒu rén lái yóuyǒng.", "×", "Many people still came to swim."),
            R(49, "医生告诉我，我的眼睛没有问题，但是要少看手机，多休息。", "Yīshēng gàosu wǒ, wǒ de yǎnjing méiyǒu wèntí, dànshì yào shǎo kàn shǒujī, duō xiūxi.",
              "医生让他多休息。", "Yīshēng ràng tā duō xiūxi.", "√", "The doctor told him to look at his phone less and rest more."),
            R(50, "弟弟昨天晚上睡得很晚，今天上课的时候觉得很累，老师说的他都没听懂。", "Dìdi zuótiān wǎnshang shuì de hěn wǎn, jīntiān shàng kè de shíhou juéde hěn lèi, lǎoshī shuō de tā dōu méi tīng dǒng.",
              "弟弟今天上课听得很好。", "Dìdi jīntiān shàng kè tīng de hěn hǎo.", "×", "He was tired and did not understand what the teacher said."),
        ],
        "part4": {
            "setA": {
                "options": [
                    O("A", "他在学校踢足球呢，六点回来。", "Tā zài xuéxiào tī zúqiú ne, liù diǎn huílái."),
                    O("B", "没关系，吃了药就好了。", "Méi guānxi, chī le yào jiù hǎo le."),
                    O("C", "太远了，我们坐出租车去吧。", "Tài yuǎn le, wǒmen zuò chūzūchē qù ba."),
                    O("D", "我觉得游泳比跑步有意思。", "Wǒ juéde yóuyǒng bǐ pǎobù yǒu yìsi."),
                    O("E", "他还在睡觉呢，你等一下再打吧。", "Tā hái zài shuìjiào ne, nǐ děng yíxià zài dǎ ba."),
                    O("F", "九点开始，我们快一点儿走吧。", "Jiǔ diǎn kāishǐ, wǒmen kuài yìdiǎnr zǒu ba."),
                ],
                "example": S(0, "喂，小李起床了吗？", "Wèi, Xiǎo Lǐ qǐchuáng le ma?", "E", "“Is Xiao Li up?” — “He is still asleep; call again later.”"),
                "items": [
                    S(51, "你弟弟去哪儿了？", "Nǐ dìdi qù nǎr le?", "A", "A says where he is: playing football at school."),
                    S(52, "从这儿到医院怎么走？", "Cóng zhèr dào yīyuàn zěnme zǒu?", "C", "C answers how to get there: it is far, take a taxi."),
                    S(53, "我生病了，今天不能和你去玩了。", "Wǒ shēngbìng le, jīntiān bù néng hé nǐ qù wán le.", "B", "B comforts the sick friend."),
                    S(54, "电影几点开始？", "Diànyǐng jǐ diǎn kāishǐ?", "F", "F gives the starting time."),
                    S(55, "你喜欢什么运动？", "Nǐ xǐhuan shénme yùndòng?", "D", "D names the sport the speaker prefers."),
                ],
            },
            "setB": {
                "options": [
                    O("A", "是的，我每天都喝一杯。", "Shì de, wǒ měi tiān dōu hē yì bēi."),
                    O("B", "他已经学了三年游泳了。", "Tā yǐjīng xué le sān nián yóuyǒng le."),
                    O("C", "那你多穿一件衣服，别生病了。", "Nà nǐ duō chuān yí jiàn yīfu, bié shēngbìng le."),
                    O("D", "她是我们学校的医生，姓王。", "Tā shì wǒmen xuéxiào de yīshēng, xìng Wáng."),
                    O("E", "好的，我六点在你家门外等你。", "Hǎo de, wǒ liù diǎn zài nǐ jiā mén wài děng nǐ."),
                ],
                "items": [
                    S(56, "明天早上一起去跑步，怎么样？", "Míngtiān zǎoshang yìqǐ qù pǎobù, zěnmeyàng?", "E", "E accepts and fixes a time and place."),
                    S(57, "你也喜欢喝牛奶吗？", "Nǐ yě xǐhuan hē niúnǎi ma?", "A", "A: yes, a glass every day."),
                    S(58, "今天比昨天冷多了。", "Jīntiān bǐ zuótiān lěng duō le.", "C", "C reacts to the cold: wear more."),
                    S(59, "旁边那个穿白衣服的人是谁？", "Pángbiān nàge chuān bái yīfu de rén shì shéi?", "D", "D says who she is."),
                    S(60, "你看，小明游得真快！", "Nǐ kàn, Xiǎo Míng yóu de zhēn kuài!", "B", "B explains why he swims fast: three years of lessons."),
                ],
            },
        },
    },
}


# ---------------------------------------------------------------------------
# FORM 02 — Work and travel
# ---------------------------------------------------------------------------

FORM2 = {
    "id": "hsk2-mock-02", "number": 2,
    "title": "上班和旅游", "titlePinyin": "Shàngbān hé lǚyóu", "titleEn": "Work and travel",
    "theme": "Work, getting around, hotels and trips",
    "listening": {
        "part1": [
            J(1, "bus_stop", "Three people waiting at a bus stop", "他们在等公共汽车。", "Tāmen zài děng gōnggòng qìchē.", "√",
              "The sentence says they are waiting for a bus; the picture shows a bus stop."),
            J(2, "writing", "A person writing at a desk", "他正在写字。", "Tā zhèngzài xiě zì.", "√",
              "The sentence says he is writing; the picture shows that."),
            J(3, "coffee", "A cup of coffee", "这是一杯牛奶。", "Zhè shì yì bēi niúnǎi.", "×",
              "The sentence says “a glass of milk”, but the picture shows coffee."),
            J(4, "plane", "A passenger plane in the sky", "这是火车。", "Zhè shì huǒchē.", "×",
              "The sentence says “this is a train”, but the picture shows a plane."),
            J(5, "doctor", "A doctor in a white coat", "他是医生，在医院工作。", "Tā shì yīshēng, zài yīyuàn gōngzuò.", "√",
              "The sentence says he is a doctor; the picture shows a doctor."),
            J(6, "newspaper", "A man reading a newspaper", "爸爸在看报纸。", "Bàba zài kàn bàozhǐ.", "√",
              "The sentence says father is reading a newspaper; the picture shows that."),
            J(7, "mobile", "A mobile phone on a table", "桌子上有一块手表。", "Zhuōzi shang yǒu yí kuài shǒubiǎo.", "×",
              "The sentence says there is a watch on the table, but it is a mobile phone."),
            J(8, "waiter", "A waiter carrying dishes on a tray", "服务员正在送菜。", "Fúwùyuán zhèngzài sòng cài.", "√",
              "The sentence says the waiter is bringing food; the picture shows that."),
            J(9, "snow", "A snowman on a snowy day", "今天天气很热。", "Jīntiān tiānqì hěn rè.", "×",
              "The sentence says it is hot today, but it is snowing."),
            J(10, "door", "An open door", "门开着呢。", "Mén kāi zhe ne.", "√",
              "The sentence says the door is open; the picture shows an open door."),
        ],
        "part2": {
            "setA": {
                "pictures": [
                    P("A", "taxi", "A taxi"), P("B", "handshake", "Two people shaking hands"),
                    P("C", "hotel", "A guest at a hotel reception desk"), P("D", "phone_call", "A person making a phone call"),
                    P("E", "watch", "A wristwatch"), P("F", "tickets", "A person buying tickets at a ticket window"),
                ],
                "example": D(0, [T("女", "喂，李先生在吗？", "Wèi, Lǐ xiānsheng zài ma?"), T("男", "他不在，他去机场了。", "Tā bú zài, tā qù jīchǎng le.")], "D",
                             "This is a telephone call; D shows a phone call."),
                "items": [
                    D(11, [T("男", "你好，我要一个房间。", "Nǐ hǎo, wǒ yào yí gè fángjiān."), T("女", "好的，请等一下。", "Hǎo de, qǐng děng yíxià.")], "C",
                      "He is asking for a room; C shows a hotel reception."),
                    D(12, [T("女", "去北京的票多少钱？", "Qù Běijīng de piào duōshao qián?"), T("男", "两百三十块。", "Liǎngbǎi sānshí kuài.")], "F",
                      "She is asking the price of a ticket; F shows a ticket window."),
                    D(13, [T("男", "您要去哪儿？", "Nín yào qù nǎr?"), T("女", "去火车站，请快一点儿。", "Qù huǒchēzhàn, qǐng kuài yìdiǎnr.")], "A",
                      "A driver asks where she is going; A shows a taxi."),
                    D(14, [T("女", "我来介绍一下，这是我们公司的王先生。", "Wǒ lái jièshào yíxià, zhè shì wǒmen gōngsī de Wáng xiānsheng."), T("男", "您好，认识您很高兴。", "Nín hǎo, rènshi nín hěn gāoxìng.")], "B",
                      "People are being introduced; B shows a handshake."),
                    D(15, [T("男", "现在几点了？我的手表慢了。", "Xiànzài jǐ diǎn le? Wǒ de shǒubiǎo màn le."), T("女", "八点零五分。", "Bā diǎn líng wǔ fēn.")], "E",
                      "He says his watch is slow; E shows a watch."),
                ],
            },
            "setB": {
                "pictures": [
                    P("A", "plane_scene", "A traveller beside a plane at an airport"), P("B", "office", "A person working at a computer at night"),
                    P("C", "travel", "A traveller with a large suitcase"), P("D", "train", "A train"),
                    P("E", "restaurant_scene", "Two people eating in a restaurant"),
                ],
                "items": [
                    D(16, [T("女", "你怎么去北京？", "Nǐ zěnme qù Běijīng?"), T("男", "坐火车，五个小时就到了。", "Zuò huǒchē, wǔ gè xiǎoshí jiù dào le.")], "D",
                      "He is going by train; D shows a train."),
                    D(17, [T("男", "你的东西准备好了吗？", "Nǐ de dōngxi zhǔnbèi hǎo le ma?"), T("女", "准备好了，衣服都在这里面了。", "Zhǔnbèi hǎo le, yīfu dōu zài zhè lǐmiàn le.")], "C",
                      "Her clothes are packed; C shows a suitcase."),
                    D(18, [T("女", "飞机几点到？", "Fēijī jǐ diǎn dào?"), T("男", "十点到，我们在这儿等他吧。", "Shí diǎn dào, wǒmen zài zhèr děng tā ba.")], "A",
                      "They are waiting for a plane; A shows an airport."),
                    D(19, [T("男", "你们想吃什么？", "Nǐmen xiǎng chī shénme?"), T("女", "我们要一个鱼和两个米饭。", "Wǒmen yào yí gè yú hé liǎng gè mǐfàn.")], "E",
                      "They are ordering food; E shows a restaurant."),
                    D(20, [T("女", "你还在工作？已经晚上九点了。", "Nǐ hái zài gōngzuò? Yǐjīng wǎnshang jiǔ diǎn le."), T("男", "事情太多了，我今天要做完。", "Shìqing tài duō le, wǒ jīntiān yào zuò wán.")], "B",
                      "He is still working at nine at night; B shows someone working late."),
                ],
            },
        },
        "part3": [
            Q(21, [T("男", "你在哪儿工作？", "Nǐ zài nǎr gōngzuò?"), T("女", "我在一家宾馆工作，是服务员。", "Wǒ zài yì jiā bīnguǎn gōngzuò, shì fúwùyuán.")],
              "女的在哪儿工作？", "Nǚ de zài nǎr gōngzuò?", [("宾馆", "bīnguǎn"), ("饭馆", "fànguǎn"), ("机场", "jīchǎng")], "A",
              "She works in a hotel as an attendant."),
            Q(22, [T("女", "你每天怎么去上班？", "Nǐ měi tiān zěnme qù shàngbān?"), T("男", "公司离我家很近，我走路去。", "Gōngsī lí wǒ jiā hěn jìn, wǒ zǒu lù qù.")],
              "男的怎么去上班？", "Nán de zěnme qù shàngbān?", [("坐出租车", "zuò chūzūchē"), ("坐公共汽车", "zuò gōnggòng qìchē"), ("走路", "zǒu lù")], "C",
              "The company is near his home, so he walks."),
            Q(23, [T("男", "小姐，这件衣服多少钱？", "Xiǎojiě, zhè jiàn yīfu duōshao qián?"), T("女", "三百块，这是今年最新的。", "Sānbǎi kuài, zhè shì jīnnián zuì xīn de.")],
              "他们最可能在哪儿？", "Tāmen zuì kěnéng zài nǎr?", [("商店", "shāngdiàn"), ("学校", "xuéxiào"), ("医院", "yīyuàn")], "A",
              "He is asking the price of clothes, so they are in a shop."),
            Q(24, [T("女", "你去过北京吗？", "Nǐ qù guo Běijīng ma?"), T("男", "去过，我去年和妻子一起去旅游的。", "Qù guo, wǒ qùnián hé qīzi yìqǐ qù lǚyóu de.")],
              "男的和谁去北京旅游的？", "Nán de hé shéi qù Běijīng lǚyóu de?", [("朋友", "péngyou"), ("妻子", "qīzi"), ("同学", "tóngxué")], "B",
              "He went with his wife last year."),
            Q(25, [T("男", "服务员，我的咖啡怎么还没来？", "Fúwùyuán, wǒ de kāfēi zěnme hái méi lái?"), T("女", "对不起，先生，我去问一下。", "Duìbuqǐ, xiānsheng, wǒ qù wèn yíxià.")],
              "男的在等什么？", "Nán de zài děng shénme?", [("咖啡", "kāfēi"), ("牛奶", "niúnǎi"), ("茶", "chá")], "A",
              "His coffee has not arrived yet."),
            Q(26, [T("女", "我们坐几点的火车？", "Wǒmen zuò jǐ diǎn de huǒchē?"), T("男", "十点二十的，现在九点，我们还有时间。", "Shí diǎn èrshí de, xiànzài jiǔ diǎn, wǒmen hái yǒu shíjiān.")],
              "火车几点开？", "Huǒchē jǐ diǎn kāi?", [("九点", "jiǔ diǎn"), ("九点二十", "jiǔ diǎn èrshí"), ("十点二十", "shí diǎn èrshí")], "C",
              "The train is the 10:20; it is nine o'clock now."),
            Q(27, [T("男", "你丈夫也在这个公司上班吗？", "Nǐ zhàngfu yě zài zhège gōngsī shàngbān ma?"), T("女", "不，他是医生，在医院工作。", "Bù, tā shì yīshēng, zài yīyuàn gōngzuò.")],
              "她丈夫做什么工作？", "Tā zhàngfu zuò shénme gōngzuò?", [("老师", "lǎoshī"), ("服务员", "fúwùyuán"), ("医生", "yīshēng")], "C",
              "Her husband is a doctor and works in a hospital."),
            Q(28, [T("女", "你今天为什么来晚了？", "Nǐ jīntiān wèi shénme lái wǎn le?"), T("男", "对不起，我今天起床太晚了。", "Duìbuqǐ, wǒ jīntiān qǐchuáng tài wǎn le.")],
              "男的为什么来晚了？", "Nán de wèi shénme lái wǎn le?", [("生病了", "shēngbìng le"), ("起床晚了", "qǐchuáng wǎn le"), ("没有公共汽车", "méiyǒu gōnggòng qìchē")], "B",
              "He got up too late."),
            Q(29, [T("男", "从这儿到机场要多长时间？", "Cóng zhèr dào jīchǎng yào duō cháng shíjiān?"), T("女", "坐出租车四十分钟，坐公共汽车要一个多小时。", "Zuò chūzūchē sìshí fēnzhōng, zuò gōnggòng qìchē yào yí gè duō xiǎoshí.")],
              "坐出租车到机场要多长时间？", "Zuò chūzūchē dào jīchǎng yào duō cháng shíjiān?", [("一个小时", "yí gè xiǎoshí"), ("四十分钟", "sìshí fēnzhōng"), ("一个多小时", "yí gè duō xiǎoshí")], "B",
              "A taxi takes forty minutes; the bus takes more than an hour."),
            Q(30, [T("女", "王先生，这是您的房间，在三零二。", "Wáng xiānsheng, zhè shì nín de fángjiān, zài sān líng èr."), T("男", "谢谢，请问宾馆里有饭馆吗？", "Xièxie, qǐngwèn bīnguǎn li yǒu fànguǎn ma?")],
              "男的想知道什么？", "Nán de xiǎng zhīdào shénme?", [("宾馆里有没有饭馆", "bīnguǎn li yǒu méiyǒu fànguǎn"), ("房间在哪儿", "fángjiān zài nǎr"), ("机场远不远", "jīchǎng yuǎn bù yuǎn")], "A",
              "He asks whether the hotel has a restaurant."),
        ],
        "part4": [
            Q(31, [T("男", "你好，我想买明天去北京的火车票。", "Nǐ hǎo, wǒ xiǎng mǎi míngtiān qù Běijīng de huǒchē piào."),
                   T("女", "上午的票已经卖完了，下午三点的可以吗？", "Shàngwǔ de piào yǐjīng mài wán le, xiàwǔ sān diǎn de kěyǐ ma?"),
                   T("男", "可以，多少钱？", "Kěyǐ, duōshao qián?"), T("女", "两百一十块。", "Liǎngbǎi yīshí kuài.")],
              "男的买的是什么时候的票？", "Nán de mǎi de shì shénme shíhou de piào?", [("明天上午", "míngtiān shàngwǔ"), ("明天下午", "míngtiān xiàwǔ"), ("今天下午", "jīntiān xiàwǔ")], "B",
              "The morning tickets are sold out, so he takes tomorrow's three o'clock train."),
            Q(32, [T("女", "你的新工作怎么样？", "Nǐ de xīn gōngzuò zěnmeyàng?"), T("男", "很好，就是每天都很忙。", "Hěn hǎo, jiùshì měi tiān dōu hěn máng."),
                   T("女", "公司离家远吗？", "Gōngsī lí jiā yuǎn ma?"), T("男", "不远，坐公共汽车十五分钟就到了。", "Bù yuǎn, zuò gōnggòng qìchē shíwǔ fēnzhōng jiù dào le.")],
              "男的觉得新工作怎么样？", "Nán de juéde xīn gōngzuò zěnmeyàng?", [("很忙", "hěn máng"), ("很远", "hěn yuǎn"), ("钱很少", "qián hěn shǎo")], "A",
              "He says the job is good but he is busy every day; it is not far."),
            Q(33, [T("男", "这个星期天你有时间吗？", "Zhège xīngqītiān nǐ yǒu shíjiān ma?"), T("女", "有，什么事情？", "Yǒu, shénme shìqing?"),
                   T("男", "我想去买一个新手机，你能和我一起去吗？", "Wǒ xiǎng qù mǎi yí gè xīn shǒujī, nǐ néng hé wǒ yìqǐ qù ma?"),
                   T("女", "没问题，我也想去商店看看。", "Méi wèntí, wǒ yě xiǎng qù shāngdiàn kànkan.")],
              "他们星期天要去哪儿？", "Tāmen xīngqītiān yào qù nǎr?", [("公司", "gōngsī"), ("机场", "jīchǎng"), ("商店", "shāngdiàn")], "C",
              "They will go to a shop to buy a phone."),
            Q(34, [T("女", "先生，您想喝什么？", "Xiānsheng, nín xiǎng hē shénme?"), T("男", "有咖啡吗？", "Yǒu kāfēi ma?"),
                   T("女", "对不起，咖啡已经卖完了，有茶和牛奶。", "Duìbuqǐ, kāfēi yǐjīng mài wán le, yǒu chá hé niúnǎi."), T("男", "那给我一杯茶吧。", "Nà gěi wǒ yì bēi chá ba.")],
              "男的要了什么？", "Nán de yào le shénme?", [("咖啡", "kāfēi"), ("牛奶", "niúnǎi"), ("茶", "chá")], "C",
              "The coffee is sold out, so he orders tea."),
            Q(35, [T("男", "你准备什么时候去旅游？", "Nǐ zhǔnbèi shénme shíhou qù lǚyóu?"), T("女", "下个月。", "Xià gè yuè."),
                   T("男", "和谁一起去？", "Hé shéi yìqǐ qù?"), T("女", "和我姐姐，我们想去北京看看。", "Hé wǒ jiějie, wǒmen xiǎng qù Běijīng kànkan.")],
              "女的要和谁去旅游？", "Nǚ de yào hé shéi qù lǚyóu?", [("姐姐", "jiějie"), ("妹妹", "mèimei"), ("丈夫", "zhàngfu")], "A",
              "She is going with her elder sister."),
        ],
    },
    "reading": {
        "part1": {
            "pictures": [
                P("A", "cinema", "A cinema screen and audience"), P("B", "eating", "A person eating at a table"),
                P("C", "bus", "A city bus"), P("D", "sleeping", "A person asleep in bed"),
                P("E", "shop_scene", "A shop counter with fruit"), P("F", "computer", "A computer"),
            ],
            "example": S(0, "中午他在公司吃米饭。", "Zhōngwǔ tā zài gōngsī chī mǐfàn.", "B", "He eats rice at noon; B shows someone eating."),
            "items": [
                S(36, "我每天坐十路公共汽车去上班。", "Wǒ měi tiān zuò shí lù gōnggòng qìchē qù shàngbān.", "C", "He goes to work by bus; C shows a bus."),
                S(37, "这是我的新电脑，比去年那个快多了。", "Zhè shì wǒ de xīn diànnǎo, bǐ qùnián nàge kuài duō le.", "F", "The sentence is about a new computer; F shows a computer."),
                S(38, "这家商店的水果很便宜，我买了很多。", "Zhè jiā shāngdiàn de shuǐguǒ hěn piányi, wǒ mǎi le hěn duō.", "E", "The fruit in this shop is cheap; E shows a shop with fruit."),
                S(39, "他工作了一天，太累了，已经睡觉了。", "Tā gōngzuò le yì tiān, tài lèi le, yǐjīng shuìjiào le.", "D", "He is already asleep; D shows someone sleeping."),
                S(40, "今天晚上有新电影，我们一起去看吧。", "Jīntiān wǎnshang yǒu xīn diànyǐng, wǒmen yìqǐ qù kàn ba.", "A", "There is a new film tonight; A shows a cinema."),
            ],
        },
        "part2": {
            "options": [O("A", "介绍", "jièshào"), O("B", "便宜", "piányi"), O("C", "时间", "shíjiān"), O("D", "正在", "zhèngzài"), O("E", "第一", "dì-yī"), O("F", "旅游", "lǚyóu")],
            "example": S(0, "我去年去北京（　）了，那儿很漂亮。", "Wǒ qùnián qù Běijīng (　) le, nàr hěn piàoliang.", "F", "“I travelled to Beijing last year”: F is 旅游."),
            "items": [
                S(41, "这家宾馆的房间很大，也很（　），一天一百块。", "Zhè jiā bīnguǎn de fángjiān hěn dà, yě hěn (　), yì tiān yìbǎi kuài.", "B", "A hundred a day is cheap (便宜)."),
                S(42, "我来（　）一下，这是我的同学小李。", "Wǒ lái (　) yíxià, zhè shì wǒ de tóngxué Xiǎo Lǐ.", "A", "“Let me introduce …”: A is 介绍."),
                S(43, "这是我（　）次坐飞机，我很高兴。", "Zhè shì wǒ (　) cì zuò fēijī, wǒ hěn gāoxìng.", "E", "“My first time on a plane”: E is 第一."),
                S(44, "对不起，我今天太忙了，没有（　）和你去看电影。", "Duìbuqǐ, wǒ jīntiān tài máng le, méiyǒu (　) hé nǐ qù kàn diànyǐng.", "C", "Too busy, so no time (时间)."),
                S(45, "女：王先生在吗？男：他（　）打电话，请您等一下。", "Nǚ: Wáng xiānsheng zài ma? Nán: Tā (　) dǎ diànhuà, qǐng nín děng yíxià.", "D", "“He is on the phone right now”: D is 正在."),
            ],
        },
        "part3": [
            R(46, "我在一家公司工作，每天早上八点上班，下午五点下班，星期六和星期日休息。", "Wǒ zài yì jiā gōngsī gōngzuò, měi tiān zǎoshang bā diǎn shàngbān, xiàwǔ wǔ diǎn xiàbān, xīngqīliù hé xīngqīrì xiūxi.",
              "他星期六不上班。", "Tā xīngqīliù bú shàngbān.", "√", "He rests on Saturday and Sunday."),
            R(47, "从我家到公司，坐公共汽车要一个小时，坐出租车二十分钟就到了，但是太贵了。", "Cóng wǒ jiā dào gōngsī, zuò gōnggòng qìchē yào yí gè xiǎoshí, zuò chūzūchē èrshí fēnzhōng jiù dào le, dànshì tài guì le.",
              "他家离公司很近。", "Tā jiā lí gōngsī hěn jìn.", "×", "An hour by bus is not near."),
            R(48, "这个手机是我去年买的，虽然不是最新的，但是我很喜欢它的颜色。", "Zhège shǒujī shì wǒ qùnián mǎi de, suīrán bú shì zuì xīn de, dànshì wǒ hěn xǐhuan tā de yánsè.",
              "他不喜欢这个手机的颜色。", "Tā bù xǐhuan zhège shǒujī de yánsè.", "×", "He likes its colour very much."),
            R(49, "我丈夫下个月要去北京工作，我和孩子也准备一起去，我们已经买好飞机票了。", "Wǒ zhàngfu xià gè yuè yào qù Běijīng gōngzuò, wǒ hé háizi yě zhǔnbèi yìqǐ qù, wǒmen yǐjīng mǎi hǎo fēijī piào le.",
              "他们准备坐火车去北京。", "Tāmen zhǔnbèi zuò huǒchē qù Běijīng.", "×", "They have bought plane tickets."),
            R(50, "这家饭馆的服务员都很好，菜也很好吃，所以每天来吃饭的人非常多。", "Zhè jiā fànguǎn de fúwùyuán dōu hěn hǎo, cài yě hěn hǎochī, suǒyǐ měi tiān lái chī fàn de rén fēicháng duō.",
              "很多人喜欢来这家饭馆。", "Hěn duō rén xǐhuan lái zhè jiā fànguǎn.", "√", "Very many people come to eat there every day."),
        ],
        "part4": {
            "setA": {
                "options": [
                    O("A", "不远，走五分钟就到了。", "Bù yuǎn, zǒu wǔ fēnzhōng jiù dào le."),
                    O("B", "是的，她已经在这儿工作三年了。", "Shì de, tā yǐjīng zài zhèr gōngzuò sān nián le."),
                    O("C", "对不起，今天的票已经卖完了。", "Duìbuqǐ, jīntiān de piào yǐjīng mài wán le."),
                    O("D", "我姓李，是新来的服务员。", "Wǒ xìng Lǐ, shì xīn lái de fúwùyuán."),
                    O("E", "我在看报纸呢，有什么事情吗？", "Wǒ zài kàn bàozhǐ ne, yǒu shénme shìqing ma?"),
                    O("F", "八点开始，我们七点三十分从家走。", "Bā diǎn kāishǐ, wǒmen qī diǎn sānshí fēn cóng jiā zǒu."),
                ],
                "example": S(0, "喂，你在做什么呢？", "Wèi, nǐ zài zuò shénme ne?", "E", "“What are you doing?” — “Reading the paper.”"),
                "items": [
                    S(51, "请问，您贵姓？", "Qǐngwèn, nín guì xìng?", "D", "D gives a surname."),
                    S(52, "请问，火车站离这儿远吗？", "Qǐngwèn, huǒchēzhàn lí zhèr yuǎn ma?", "A", "A says it is not far."),
                    S(53, "你妹妹也在这家公司上班吗？", "Nǐ mèimei yě zài zhè jiā gōngsī shàngbān ma?", "B", "B confirms she has worked here for three years."),
                    S(54, "还有今天晚上的电影票吗？", "Hái yǒu jīntiān wǎnshang de diànyǐng piào ma?", "C", "C says today's tickets are sold out."),
                    S(55, "明天的课几点开始？", "Míngtiān de kè jǐ diǎn kāishǐ?", "F", "F gives the starting time."),
                ],
            },
            "setB": {
                "options": [
                    O("A", "好的，请您等一下。", "Hǎo de, qǐng nín děng yíxià."),
                    O("B", "因为他的妻子生病了。", "Yīnwèi tā de qīzi shēngbìng le."),
                    O("C", "我也不知道，我们问问服务员吧。", "Wǒ yě bù zhīdào, wǒmen wènwen fúwùyuán ba."),
                    O("D", "太好了！我去机场等你。", "Tài hǎo le! Wǒ qù jīchǎng děng nǐ."),
                    O("E", "坐公共汽车去吧，出租车太贵了。", "Zuò gōnggòng qìchē qù ba, chūzūchē tài guì le."),
                ],
                "items": [
                    S(56, "我明天上午十点到北京。", "Wǒ míngtiān shàngwǔ shí diǎn dào Běijīng.", "D", "D: great, I will wait for you at the airport."),
                    S(57, "小王今天为什么没来上班？", "Xiǎo Wáng jīntiān wèi shénme méi lái shàngbān?", "B", "B gives the reason."),
                    S(58, "服务员，请给我一杯水。", "Fúwùyuán, qǐng gěi wǒ yì bēi shuǐ.", "A", "A is the waiter's reply."),
                    S(59, "我们怎么去火车站？", "Wǒmen zěnme qù huǒchēzhàn?", "E", "E suggests taking the bus."),
                    S(60, "这个菜叫什么名字？", "Zhège cài jiào shénme míngzi?", "C", "C: I do not know either; let us ask the waiter."),
                ],
            },
        },
    },
}


# ---------------------------------------------------------------------------
# FORM 03 — Happy birthday
# ---------------------------------------------------------------------------

FORM3 = {
    "id": "hsk2-mock-03", "number": 3,
    "title": "生日快乐", "titlePinyin": "Shēngrì kuàilè", "titleEn": "Happy birthday",
    "theme": "Birthdays, family, shopping and the weather",
    "listening": {
        "part1": [
            J(1, "birthday", "A girl in a party hat beside a birthday cake", "今天是她的生日。", "Jīntiān shì tā de shēngrì.", "√",
              "The sentence says today is her birthday; the picture shows a birthday cake."),
            J(2, "singing", "A woman singing into a microphone", "她正在唱歌。", "Tā zhèngzài chànggē.", "√",
              "The sentence says she is singing; the picture shows that."),
            J(3, "dancing", "Two people dancing", "他们在打篮球。", "Tāmen zài dǎ lánqiú.", "×",
              "The sentence says they are playing basketball, but they are dancing."),
            J(4, "siblings", "A tall boy standing beside a small girl", "哥哥比妹妹高。", "Gēge bǐ mèimei gāo.", "√",
              "The sentence says the brother is taller than his sister; the picture shows that."),
            J(5, "watermelon", "A watermelon and a slice on a table", "桌子上有一个西瓜。", "Zhuōzi shang yǒu yí gè xīguā.", "√",
              "The sentence says there is a watermelon on the table; the picture shows one."),
            J(6, "cat", "A cat", "这是我家的小狗。", "Zhè shì wǒ jiā de xiǎo gǒu.", "×",
              "The sentence says “our little dog”, but the picture shows a cat."),
            J(7, "cooking", "A woman cooking at a stove", "妈妈正在做饭。", "Māma zhèngzài zuò fàn.", "√",
              "The sentence says mother is cooking; the picture shows a woman cooking."),
            J(8, "cloudy", "Dark clouds over houses", "今天是阴天。", "Jīntiān shì yīntiān.", "√",
              "The sentence says today is overcast; the picture shows dark clouds."),
            J(9, "kids_playing", "Two children playing with a ball outside", "两个孩子在看电视。", "Liǎng gè háizi zài kàn diànshì.", "×",
              "The sentence says the children are watching TV, but they are playing outside."),
            J(10, "noodles", "A bowl of noodles", "我中午吃的是米饭。", "Wǒ zhōngwǔ chī de shì mǐfàn.", "×",
              "The sentence says “rice”, but the picture shows noodles."),
        ],
        "part2": {
            "setA": {
                "pictures": [
                    P("A", "fish", "A cooked fish on a plate"), P("B", "pencil", "Two pencils on a notebook"),
                    P("C", "tea", "A cup of tea"), P("D", "gift", "A woman giving a man a present"),
                    P("E", "washing", "A woman washing clothes in a tub"), P("F", "mobile", "A mobile phone"),
                ],
                "example": D(0, [T("女", "你喝茶吗？", "Nǐ hē chá ma?"), T("男", "好的，谢谢你。", "Hǎo de, xièxie nǐ.")], "C",
                             "She offers tea; C shows a cup of tea."),
                "items": [
                    D(11, [T("女", "生日快乐！这是送给你的。", "Shēngrì kuàilè! Zhè shì sòng gěi nǐ de."), T("男", "谢谢你！是什么东西？", "Xièxie nǐ! Shì shénme dōngxi?")], "D",
                      "She gives him a birthday present; D shows a present being given."),
                    D(12, [T("男", "你在洗什么呢？", "Nǐ zài xǐ shénme ne?"), T("女", "洗衣服，孩子的衣服太多了。", "Xǐ yīfu, háizi de yīfu tài duō le.")], "E",
                      "She is washing clothes; E shows that."),
                    D(13, [T("女", "这是谁的铅笔？", "Zhè shì shéi de qiānbǐ?"), T("男", "是我的，谢谢你，我找了很长时间。", "Shì wǒ de, xièxie nǐ, wǒ zhǎo le hěn cháng shíjiān.")], "B",
                      "They are talking about a pencil; B shows pencils."),
                    D(14, [T("男", "今天的鱼真好吃，是你做的吗？", "Jīntiān de yú zhēn hǎochī, shì nǐ zuò de ma?"), T("女", "不是，是我丈夫做的。", "Bú shì, shì wǒ zhàngfu zuò de.")], "A",
                      "They are talking about the fish; A shows a fish dish."),
                    D(15, [T("女", "你的新手机是什么颜色的？", "Nǐ de xīn shǒujī shì shénme yánsè de?"), T("男", "黑的，你看，在这儿。", "Hēi de, nǐ kàn, zài zhèr.")], "F",
                      "They are talking about a new phone; F shows a mobile phone."),
                ],
            },
            "setB": {
                "pictures": [
                    P("A", "sun_hot", "A person feeling hot under a bright sun"), P("B", "shop_scene", "A shop counter with fruit"),
                    P("C", "cinema", "A cinema screen and audience"), P("D", "home_tv", "A person watching television at home"),
                    P("E", "dog", "A dog"),
                ],
                "items": [
                    D(16, [T("男", "电影快开始了，我们进去吧。", "Diànyǐng kuài kāishǐ le, wǒmen jìnqù ba."), T("女", "等一下，小李还没到呢。", "Děng yíxià, Xiǎo Lǐ hái méi dào ne.")], "C",
                      "The film is about to start; C shows a cinema."),
                    D(17, [T("女", "你家的狗真漂亮，它几岁了？", "Nǐ jiā de gǒu zhēn piàoliang, tā jǐ suì le?"), T("男", "两岁了，它最喜欢和孩子玩。", "Liǎng suì le, tā zuì xǐhuan hé háizi wán.")], "E",
                      "They are talking about a dog; E shows a dog."),
                    D(18, [T("男", "今天天气真好，是晴天。", "Jīntiān tiānqì zhēn hǎo, shì qíngtiān."), T("女", "是的，但是太热了。", "Shì de, dànshì tài rè le.")], "A",
                      "It is sunny and too hot; A shows a hot sunny day."),
                    D(19, [T("女", "孩子在做什么呢？", "Háizi zài zuò shénme ne?"), T("男", "他在房间里看电视呢。", "Tā zài fángjiān li kàn diànshì ne.")], "D",
                      "The child is watching TV in his room; D shows someone watching TV."),
                    D(20, [T("男", "苹果怎么卖？", "Píngguǒ zěnme mài?"), T("女", "这些苹果十块钱，很便宜。", "Zhèxiē píngguǒ shí kuài qián, hěn piányi.")], "B",
                      "He is buying apples; B shows a shop with fruit."),
                ],
            },
        },
        "part3": [
            Q(21, [T("男", "明天是你妈妈的生日，你准备送她什么？", "Míngtiān shì nǐ māma de shēngrì, nǐ zhǔnbèi sòng tā shénme?"), T("女", "我想送她一件红衣服。", "Wǒ xiǎng sòng tā yí jiàn hóng yīfu.")],
              "女的想送妈妈什么？", "Nǚ de xiǎng sòng māma shénme?", [("手表", "shǒubiǎo"), ("衣服", "yīfu"), ("手机", "shǒujī")], "B",
              "She wants to give her mother a red piece of clothing."),
            Q(22, [T("女", "你弟弟今年多大了？", "Nǐ dìdi jīnnián duō dà le?"), T("男", "他比我小两岁，今年二十岁。", "Tā bǐ wǒ xiǎo liǎng suì, jīnnián èrshí suì.")],
              "男的今年多大？", "Nán de jīnnián duō dà?", [("十八岁", "shíbā suì"), ("二十岁", "èrshí suì"), ("二十二岁", "èrshí'èr suì")], "C",
              "His brother is twenty and two years younger, so the man is twenty-two."),
            Q(23, [T("男", "你认识那个穿白衣服的女孩子吗？", "Nǐ rènshi nàge chuān bái yīfu de nǚ háizi ma?"), T("女", "认识，她是我姐姐的同学。", "Rènshi, tā shì wǒ jiějie de tóngxué.")],
              "那个女孩子是谁？", "Nàge nǚ háizi shì shéi?", [("女的的姐姐", "nǚ de de jiějie"), ("女的的同学", "nǚ de de tóngxué"), ("女的姐姐的同学", "nǚ de jiějie de tóngxué")], "C",
              "She is a classmate of the woman's elder sister."),
            Q(24, [T("女", "外面还在下雨吗？", "Wàimiàn hái zài xià yǔ ma?"), T("男", "不下了，现在是阴天。", "Bú xià le, xiànzài shì yīntiān.")],
              "现在天气怎么样？", "Xiànzài tiānqì zěnmeyàng?", [("晴天", "qíngtiān"), ("阴天", "yīntiān"), ("下雨", "xià yǔ")], "B",
              "The rain has stopped and it is overcast now."),
            Q(25, [T("男", "这个西瓜真大！多少钱？", "Zhège xīguā zhēn dà! Duōshao qián?"), T("女", "不贵，二十块。", "Bú guì, èrshí kuài.")],
              "西瓜多少钱？", "Xīguā duōshao qián?", [("十块", "shí kuài"), ("十二块", "shí'èr kuài"), ("二十块", "èrshí kuài")], "C",
              "The watermelon costs twenty kuai."),
            Q(26, [T("女", "你妻子会做中国菜吗？", "Nǐ qīzi huì zuò Zhōngguó cài ma?"), T("男", "会，她做的鱼非常好吃。", "Huì, tā zuò de yú fēicháng hǎochī.")],
              "谁做的鱼好吃？", "Shéi zuò de yú hǎochī?", [("男的的妻子", "nán de de qīzi"), ("男的的妈妈", "nán de de māma"), ("男的的姐姐", "nán de de jiějie")], "A",
              "The man says his wife's fish is delicious."),
            Q(27, [T("男", "小红，生日快乐！你今天真漂亮。", "Xiǎo Hóng, shēngrì kuàilè! Nǐ jīntiān zhēn piàoliang."), T("女", "谢谢你！快请进，大家都到了。", "Xièxie nǐ! Kuài qǐng jìn, dàjiā dōu dào le.")],
              "今天是谁的生日？", "Jīntiān shì shéi de shēngrì?", [("小红", "Xiǎo Hóng"), ("男的", "nán de"), ("小红的妈妈", "Xiǎo Hóng de māma")], "A",
              "The man wishes Xiao Hong a happy birthday."),
            Q(28, [T("女", "晚上我们去外面吃吧？", "Wǎnshang wǒmen qù wàimiàn chī ba?"), T("男", "别去了，外面太冷，我来做面条。", "Bié qù le, wàimiàn tài lěng, wǒ lái zuò miàntiáo.")],
              "他们晚上可能吃什么？", "Tāmen wǎnshang kěnéng chī shénme?", [("米饭", "mǐfàn"), ("面条", "miàntiáo"), ("羊肉", "yángròu")], "B",
              "He will cook noodles at home."),
            Q(29, [T("男", "你儿子唱歌唱得真好！", "Nǐ érzi chànggē chàng de zhēn hǎo!"), T("女", "他从六岁开始学唱歌，已经学了五年了。", "Tā cóng liù suì kāishǐ xué chànggē, yǐjīng xué le wǔ nián le.")],
              "女的的儿子今年可能多大？", "Nǚ de de érzi jīnnián kěnéng duō dà?", [("五岁", "wǔ suì"), ("六岁", "liù suì"), ("十一岁", "shíyī suì")], "C",
              "He started at six and has studied for five years, so he is about eleven."),
            Q(30, [T("女", "你在找什么？", "Nǐ zài zhǎo shénme?"), T("男", "我的手机，我早上起床的时候还看见它了。", "Wǒ de shǒujī, wǒ zǎoshang qǐchuáng de shíhou hái kànjiàn tā le.")],
              "男的在找什么？", "Nán de zài zhǎo shénme?", [("手机", "shǒujī"), ("手表", "shǒubiǎo"), ("铅笔", "qiānbǐ")], "A",
              "He is looking for his mobile phone."),
        ],
        "part4": [
            Q(31, [T("女", "喂，你到哪儿了？大家都在等你呢。", "Wèi, nǐ dào nǎr le? Dàjiā dōu zài děng nǐ ne."), T("男", "对不起，我还在公共汽车上。", "Duìbuqǐ, wǒ hái zài gōnggòng qìchē shang."),
                   T("女", "还要多长时间？", "Hái yào duō cháng shíjiān?"), T("男", "再等我十分钟，好吗？", "Zài děng wǒ shí fēnzhōng, hǎo ma?")],
              "男的现在在哪儿？", "Nán de xiànzài zài nǎr?", [("家里", "jiā li"), ("饭馆里", "fànguǎn li"), ("公共汽车上", "gōnggòng qìchē shang")], "C",
              "He is still on the bus."),
            Q(32, [T("男", "这件衣服怎么样？", "Zhè jiàn yīfu zěnmeyàng?"), T("女", "颜色很好，但是太长了。", "Yánsè hěn hǎo, dànshì tài cháng le."),
                   T("男", "那这件白的呢？", "Nà zhè jiàn bái de ne?"), T("女", "这件好，就买这件吧。", "Zhè jiàn hǎo, jiù mǎi zhè jiàn ba.")],
              "他们要买哪件衣服？", "Tāmen yào mǎi nǎ jiàn yīfu?", [("长的", "cháng de"), ("白的", "bái de"), ("红的", "hóng de")], "B",
              "The first one is too long; they choose the white one."),
            Q(33, [T("女", "明天你有时间吗？来我家玩吧。", "Míngtiān nǐ yǒu shíjiān ma? Lái wǒ jiā wán ba."), T("男", "有什么事情吗？", "Yǒu shénme shìqing ma?"),
                   T("女", "明天是我女儿的生日，我们准备了很多好吃的。", "Míngtiān shì wǒ nǚ'ér de shēngrì, wǒmen zhǔnbèi le hěn duō hǎochī de."), T("男", "好的，我下午就去。", "Hǎo de, wǒ xiàwǔ jiù qù.")],
              "明天是谁的生日？", "Míngtiān shì shéi de shēngrì?", [("女的的女儿", "nǚ de de nǚ'ér"), ("女的的儿子", "nǚ de de érzi"), ("女的的丈夫", "nǚ de de zhàngfu")], "A",
              "Tomorrow is her daughter's birthday."),
            Q(34, [T("男", "你怎么不吃了？菜不好吃吗？", "Nǐ zěnme bù chī le? Cài bù hǎochī ma?"), T("女", "不是，我已经吃了很多了。", "Bú shì, wǒ yǐjīng chī le hěn duō le."),
                   T("男", "再吃一点儿水果吧，西瓜很好吃。", "Zài chī yìdiǎnr shuǐguǒ ba, xīguā hěn hǎochī."), T("女", "好，那我吃一块西瓜。", "Hǎo, nà wǒ chī yí kuài xīguā.")],
              "女的还要吃什么？", "Nǚ de hái yào chī shénme?", [("米饭", "mǐfàn"), ("鱼", "yú"), ("西瓜", "xīguā")], "C",
              "She agrees to eat a piece of watermelon."),
            Q(35, [T("女", "你知道小李的生日是几月几号吗？", "Nǐ zhīdào Xiǎo Lǐ de shēngrì shì jǐ yuè jǐ hào ma?"), T("男", "知道，是八月十号。", "Zhīdào, shì bā yuè shí hào."),
                   T("女", "今天已经八号了，我们送他什么呢？", "Jīntiān yǐjīng bā hào le, wǒmen sòng tā shénme ne?"), T("男", "他喜欢踢足球，我们送他一个足球吧。", "Tā xǐhuan tī zúqiú, wǒmen sòng tā yí gè zúqiú ba.")],
              "小李的生日是哪天？", "Xiǎo Lǐ de shēngrì shì nǎ tiān?", [("八月八号", "bā yuè bā hào"), ("八月十号", "bā yuè shí hào"), ("十月八号", "shí yuè bā hào")], "B",
              "His birthday is the tenth of August; today is the eighth."),
        ],
    },
    "reading": {
        "part1": {
            "pictures": [
                P("A", "milk", "A glass of milk and a milk bottle"), P("B", "teacher", "A teacher at a blackboard"),
                P("C", "book", "An open book"), P("D", "running", "A person running in a park"),
                P("E", "rain", "A person with an umbrella in the rain"), P("F", "sleeping", "A person asleep in bed"),
            ],
            "example": S(0, "他每天早上都去跑步。", "Tā měi tiān zǎoshang dōu qù pǎobù.", "D", "He goes running every morning; D shows a runner."),
            "items": [
                S(36, "这本书是我生日的时候姐姐送的。", "Zhè běn shū shì wǒ shēngrì de shíhou jiějie sòng de.", "C", "The sentence is about a book; C shows a book."),
                S(37, "外面下雨了，我们今天别出去了。", "Wàimiàn xià yǔ le, wǒmen jīntiān bié chūqù le.", "E", "It is raining outside; E shows rain."),
                S(38, "孩子已经睡觉了，我们别说话了。", "Háizi yǐjīng shuìjiào le, wǒmen bié shuōhuà le.", "F", "The child is asleep; F shows someone sleeping."),
                S(39, "我每天早上都要喝一杯牛奶。", "Wǒ měi tiān zǎoshang dōu yào hē yì bēi niúnǎi.", "A", "A glass of milk every morning; A shows milk."),
                S(40, "王老师正在给学生上课。", "Wáng lǎoshī zhèngzài gěi xuésheng shàng kè.", "B", "Teacher Wang is teaching; B shows a teacher at the board."),
            ],
        },
        "part2": {
            "options": [O("A", "颜色", "yánsè"), O("B", "一起", "yìqǐ"), O("C", "送", "sòng"), O("D", "可能", "kěnéng"), O("E", "虽然", "suīrán"), O("F", "快乐", "kuàilè")],
            "example": S(0, "妈妈，生日（　）！这是我给您买的衣服。", "Māma, shēngrì (　)! Zhè shì wǒ gěi nín mǎi de yīfu.", "F", "“Happy birthday”: F is 快乐."),
            "items": [
                S(41, "这件衣服的（　）很漂亮，我很喜欢。", "Zhè jiàn yīfu de (　) hěn piàoliang, wǒ hěn xǐhuan.", "A", "The colour (颜色) of the clothes is pretty."),
                S(42, "明天是爸爸的生日，我想（　）他一块手表。", "Míngtiān shì bàba de shēngrì, wǒ xiǎng (　) tā yí kuài shǒubiǎo.", "C", "“Give him a watch”: C is 送."),
                S(43, "（　）外面在下雪，但是孩子都想出去玩。", "(　) wàimiàn zài xià xuě, dànshì háizi dōu xiǎng chūqù wán.", "E", "虽然 … 但是 … means “although … still …”."),
                S(44, "天阴了，下午（　）会下雨，你别去踢足球了。", "Tiān yīn le, xiàwǔ (　) huì xià yǔ, nǐ bié qù tī zúqiú le.", "D", "It may (可能) rain this afternoon."),
                S(45, "女：晚上我们（　）去看电影吧？男：好，几点的？", "Nǚ: Wǎnshang wǒmen (　) qù kàn diànyǐng ba? Nán: Hǎo, jǐ diǎn de?", "B", "“Let us go together”: B is 一起."),
            ],
        },
        "part3": [
            R(46, "今天是妹妹的生日，妈妈做了很多她爱吃的菜，爸爸给她买了一个新手机。", "Jīntiān shì mèimei de shēngrì, māma zuò le hěn duō tā ài chī de cài, bàba gěi tā mǎi le yí gè xīn shǒujī.",
              "爸爸送给妹妹一个手机。", "Bàba sòng gěi mèimei yí gè shǒujī.", "√", "Father bought her a new mobile phone."),
            R(47, "我有两个孩子，儿子今年八岁，女儿比他小三岁，他们都很喜欢唱歌。", "Wǒ yǒu liǎng gè háizi, érzi jīnnián bā suì, nǚ'ér bǐ tā xiǎo sān suì, tāmen dōu hěn xǐhuan chànggē.",
              "女儿今年五岁。", "Nǚ'ér jīnnián wǔ suì.", "√", "The son is eight and the daughter three years younger: five."),
            R(48, "昨天晚上下了很大的雪，今天早上起床的时候，我看见外面都白了，真漂亮。", "Zuótiān wǎnshang xià le hěn dà de xuě, jīntiān zǎoshang qǐchuáng de shíhou, wǒ kànjiàn wàimiàn dōu bái le, zhēn piàoliang.",
              "今天早上开始下雪。", "Jīntiān zǎoshang kāishǐ xià xuě.", "×", "It snowed last night, not from this morning."),
            R(49, "我家旁边新开了一家商店，那儿的水果非常便宜，所以我每天下班都去买。", "Wǒ jiā pángbiān xīn kāi le yì jiā shāngdiàn, nàr de shuǐguǒ fēicháng piányi, suǒyǐ wǒ měi tiān xiàbān dōu qù mǎi.",
              "那家商店的水果很贵。", "Nà jiā shāngdiàn de shuǐguǒ hěn guì.", "×", "The fruit there is very cheap."),
            R(50, "我丈夫不会做饭，但是他每天都帮助我洗衣服。", "Wǒ zhàngfu bú huì zuò fàn, dànshì tā měi tiān dōu bāngzhù wǒ xǐ yīfu.",
              "她丈夫每天做饭。", "Tā zhàngfu měi tiān zuò fàn.", "×", "Her husband cannot cook; he helps with the washing."),
        ],
        "part4": {
            "setA": {
                "options": [
                    O("A", "是我哥哥，他比我大三岁。", "Shì wǒ gēge, tā bǐ wǒ dà sān suì."),
                    O("B", "太贵了，有便宜一点儿的吗？", "Tài guì le, yǒu piányi yìdiǎnr de ma?"),
                    O("C", "我也是，我们一起去吧。", "Wǒ yě shì, wǒmen yìqǐ qù ba."),
                    O("D", "因为今天是我妻子的生日。", "Yīnwèi jīntiān shì wǒ qīzi de shēngrì."),
                    O("E", "在桌子上，电脑旁边。", "Zài zhuōzi shang, diànnǎo pángbiān."),
                    O("F", "她去商店买东西了，还没回来。", "Tā qù shāngdiàn mǎi dōngxi le, hái méi huílái."),
                ],
                "example": S(0, "你看见我的手机了吗？", "Nǐ kànjiàn wǒ de shǒujī le ma?", "E", "“Have you seen my phone?” — “On the table, beside the computer.”"),
                "items": [
                    S(51, "这块手表两千块。", "Zhè kuài shǒubiǎo liǎngqiān kuài.", "B", "B reacts to the price."),
                    S(52, "你今天为什么买了很多菜？", "Nǐ jīntiān wèi shénme mǎi le hěn duō cài?", "D", "D gives the reason."),
                    S(53, "你左边的这个人是谁？", "Nǐ zuǒbian de zhège rén shì shéi?", "A", "A says who the person is."),
                    S(54, "我想去看那个新电影。", "Wǒ xiǎng qù kàn nàge xīn diànyǐng.", "C", "C: me too, let us go together."),
                    S(55, "你妈妈呢？", "Nǐ māma ne?", "F", "F says where she is."),
                ],
            },
            "setB": {
                "options": [
                    O("A", "好的，我在家等你。", "Hǎo de, wǒ zài jiā děng nǐ."),
                    O("B", "她很高，眼睛很大，非常漂亮。", "Tā hěn gāo, yǎnjing hěn dà, fēicháng piàoliang."),
                    O("C", "不，这是我第一次来。", "Bù, zhè shì wǒ dì-yī cì lái."),
                    O("D", "没关系，我们明天再去吧。", "Méi guānxi, wǒmen míngtiān zài qù ba."),
                    O("E", "谢谢，是我妈妈给我买的。", "Xièxie, shì wǒ māma gěi wǒ mǎi de."),
                ],
                "items": [
                    S(56, "对不起，我今天不能和你去看电影了。", "Duìbuqǐ, wǒ jīntiān bù néng hé nǐ qù kàn diànyǐng le.", "D", "D accepts the apology: go tomorrow."),
                    S(57, "你的衣服真漂亮！", "Nǐ de yīfu zhēn piàoliang!", "E", "E thanks for the compliment."),
                    S(58, "你来过我们学校吗？", "Nǐ lái guo wǒmen xuéxiào ma?", "C", "C: no, this is my first time."),
                    S(59, "你姐姐漂亮吗？", "Nǐ jiějie piàoliang ma?", "B", "B describes her."),
                    S(60, "我下午四点去你家找你。", "Wǒ xiàwǔ sì diǎn qù nǐ jiā zhǎo nǐ.", "A", "A: fine, I will wait at home."),
                ],
            },
        },
    },
}

FORMS = [FORM1, FORM2, FORM3]
