"""Authoring source for the HSK 3.0 HSK 1 and HSK 2 mock forms (2026-11-19).

HSK 3.0 (new syllabus, first regular sitting 13 December 2026) changes the level 1-2 papers:

- HSK 1, 40 items: Listening 20 (word -> one of three pictures; sentence -> the word it says; short dialogue -> a picture
  of a bank; sentence and question -> one of three answers) and Reading 20 (sentence -> a picture of a bank; question
  -> its answer in a bank; gap -> a word of a bank; short text and question -> one of three answers).
- HSK 2, 60 items: Listening 25 (sentence -> one of three pictures; dialogue -> a picture of a bank, two sets;
  dialogue and question -> one of three answers), Reading 25 (sentence -> picture; gap -> word; sentence -> its reply,
  two sets; text and question -> one of three answers) and Writing 10 (choose the missing component of a character;
  write the character whose pinyin is given).

The part layout follows public descriptions of the new paper (no official 3.0 sample paper was available offline).
Words: HSK 3.0 level 1 (300) and level 2 (200 more), the lists the word decks use (scripts/language-decks/lists.mjs).
Writing uses only the 100 handwriting characters of HSK 1-2 (syllabus appendix).

Most items are reused, unchanged, from the HSK 2.0 packs (MockExmps/HSK, MockExmps/HSK2): their original texts and
pictures. This file only holds what HSK 3.0 adds or changes; build.py composes the forms. All texts are original.
"""

from __future__ import annotations


def topt(label: str, text: str, pinyin: str) -> dict:
    return {"label": label, "text": text, "pinyin": pinyin}


def opts(*pairs: tuple[str, str]) -> list[dict]:
    return [topt("ABCDEF"[i], text, pinyin) for i, (text, pinyin) in enumerate(pairs)]


# Reused HSK 2.0 texts that use words HSK 3.0 levels 1-2 dropped: whole lines rewritten first (text -> new text,
# new pinyin), then single words swapped in every text and its pinyin (word, new word, its old pinyin forms, new pinyin).
OVERRIDES = {
    1: [
        ("火车站在哪儿？", "火车在哪儿？", "Huǒchē zài nǎr?"),
        ("在前面。", "在前边。", "Zài qiánbian."),
        ("我们怎么去火车站？", "我们怎么去医院？", "Wǒmen zěnme qù yīyuàn?"),
        ("我坐出租车去火车站。", "我坐出租车去医院。", "Wǒ zuò chūzūchē qù yīyuàn."),
        ("他怎么去火车站？", "他怎么去医院？", "Tā zěnme qù yīyuàn?"),
    ],
    2: [
        ("我在一家宾馆工作，是服务员。", "我在一家酒店工作。", "Wǒ zài yì jiā jiǔdiàn gōngzuò."),
        ("小姐，这件衣服多少钱？", "你好，这件衣服多少钱？", "Nǐ hǎo, zhè jiàn yīfu duōshao qián?"),
        ("服务员，我的咖啡怎么还没来？", "你好，我的咖啡怎么还没来？", "Nǐ hǎo, wǒ de kāfēi zěnme hái méi lái?"),
        ("服务员", "学生", "xuésheng"),
        ("我姓李，是新来的服务员。", "我姓李，是新来的老师。", "Wǒ xìng Lǐ, shì xīn lái de lǎoshī."),
        ("我也不知道，我们问问服务员吧。", "我也不知道，我们问问他们吧。", "Wǒ yě bù zhīdào, wǒmen wènwen tāmen ba."),
        ("服务员，请给我一杯水。", "你好，请给我一杯水。", "Nǐ hǎo, qǐng gěi wǒ yì bēi shuǐ."),
    ],
}
TEXT_FIXES = {
    1: [
        ("饭馆", "饭店", ["fànguǎn"], "fàndiàn"),
        ("火车站", "医院", ["huǒchēzhàn", "huǒchē zhàn"], "yīyuàn"),
    ],
    2: [
        ("公共汽车", "公交车", ["gōnggòng qìchē", "gōnggòngqìchē"], "gōngjiāochē"),
        ("帮助", "帮", ["bāngzhù"], "bāng"),
        ("火车站", "车站", ["huǒchēzhàn", "huǒchē zhàn"], "chēzhàn"),
        ("宾馆", "酒店", ["bīnguǎn"], "jiǔdiàn"),
        ("西瓜", "水果", ["xīguā"], "shuǐguǒ"),
        ("铅笔", "笔", ["qiānbǐ"], "bǐ"),
        ("羊肉", "肉", ["yángròu"], "ròu"),
        ("报纸", "书", ["bàozhǐ"], "shū"),
    ],
}

# ---------------------------------------------------------------------------------------------------------------
# HSK 1
# ---------------------------------------------------------------------------------------------------------------

# Listening part 1: the 2.0 Listening part 2 items (sentence -> three pictures) keep their pictures and key; the
# student now hears only the word the right picture shows. (2.0 number, word, pinyin, answer)
HSK1_L1 = {
    1: [(6, "茶", "chá", "B"), (7, "下雨", "xià yǔ", "A"), (8, "飞机", "fēijī", "C"), (9, "睡觉", "shuìjiào", "B"), (10, "米饭", "mǐfàn", "A")],
    2: [(6, "医生", "yīshēng", "A"), (7, "热", "rè", "C"), (8, "火车", "huǒchē", "B"), (9, "水果", "shuǐguǒ", "A"), (10, "电视", "diànshì", "C")],
    3: [(6, "饭店", "fàndiàn", "B"), (7, "冷", "lěng", "A"), (8, "出租车", "chūzūchē", "C"), (9, "狗", "gǒu", "A"), (10, "写字", "xiě zì", "C")],
}
HSK1_L1_EXAMPLE = ("书", "shū")  # the 2.0 Listening part 2 example (book / computer / cat), answer A

# Listening part 2: a sentence is heard; the student picks the word it says. (sentence, pinyin, options, answer, why)
HSK1_L2 = {
    1: [
        ("我想喝一杯牛奶。", "Wǒ xiǎng hē yì bēi niúnǎi.", opts(("茶", "chá"), ("牛奶", "niúnǎi"), ("水", "shuǐ")), "B", "“I'd like a glass of milk”: B 牛奶."),
        ("明天我们去超市买东西。", "Míngtiān wǒmen qù chāoshì mǎi dōngxi.", opts(("商店", "shāngdiàn"), ("书店", "shūdiàn"), ("超市", "chāoshì")), "C", "They will go to the supermarket: C 超市."),
        ("我的妹妹今年八岁。", "Wǒ de mèimei jīnnián bā suì.", opts(("八岁", "bā suì"), ("六岁", "liù suì"), ("十岁", "shí suì")), "A", "The sister is eight: A 八岁."),
        ("他今天坐出租车上班。", "Tā jīntiān zuò chūzūchē shàngbān.", opts(("火车", "huǒchē"), ("出租车", "chūzūchē"), ("飞机", "fēijī")), "B", "He goes to work by taxi today: B 出租车."),
        ("下午我在家做饭。", "Xiàwǔ wǒ zài jiā zuò fàn.", opts(("做饭", "zuò fàn"), ("睡觉", "shuìjiào"), ("看书", "kàn shū")), "A", "She cooks at home in the afternoon: A 做饭."),
    ],
    2: [
        ("星期天我和爸爸去看电影。", "Xīngqītiān wǒ hé bàba qù kàn diànyǐng.", opts(("看电视", "kàn diànshì"), ("看书", "kàn shū"), ("看电影", "kàn diànyǐng")), "C", "They will watch a film: C 看电影."),
        ("今天很冷，下雪了。", "Jīntiān hěn lěng, xià xuě le.", opts(("下雨", "xià yǔ"), ("下雪", "xià xuě"), ("很热", "hěn rè")), "B", "It is snowing: B 下雪."),
        ("我们坐飞机去中国。", "Wǒmen zuò fēijī qù Zhōngguó.", opts(("飞机", "fēijī"), ("火车", "huǒchē"), ("车", "chē")), "A", "They go to China by plane: A 飞机."),
        ("我姐姐在医院工作。", "Wǒ jiějie zài yīyuàn gōngzuò.", opts(("学校", "xuéxiào"), ("医院", "yīyuàn"), ("商店", "shāngdiàn")), "B", "The sister works in a hospital: B 医院."),
        ("晚上九点我回家。", "Wǎnshang jiǔ diǎn wǒ huí jiā.", opts(("九点", "jiǔ diǎn"), ("五点", "wǔ diǎn"), ("十点", "shí diǎn")), "A", "He goes home at nine: A 九点."),
    ],
    3: [
        ("我朋友家里有一只小猫。", "Wǒ péngyou jiā li yǒu yì zhī xiǎo māo.", opts(("小狗", "xiǎo gǒu"), ("小猫", "xiǎo māo"), ("苹果", "píngguǒ")), "B", "The friend has a kitten: B 小猫."),
        ("我早上七点起床。", "Wǒ zǎoshang qī diǎn qǐchuáng.", opts(("起床", "qǐchuáng"), ("睡觉", "shuìjiào"), ("上学", "shàngxué")), "A", "He gets up at seven: A 起床."),
        ("你的手机在桌子上。", "Nǐ de shǒujī zài zhuōzi shang.", opts(("椅子上", "yǐzi shang"), ("电脑上", "diànnǎo shang"), ("桌子上", "zhuōzi shang")), "C", "The phone is on the table: C 桌子上."),
        ("中午我们吃饺子吧。", "Zhōngwǔ wǒmen chī jiǎozi ba.", opts(("包子", "bāozi"), ("饺子", "jiǎozi"), ("面条儿", "miàntiáor")), "B", "They will eat dumplings: B 饺子."),
        ("我哥哥是大学生。", "Wǒ gēge shì dàxuéshēng.", opts(("大学生", "dàxuéshēng"), ("中学生", "zhōngxuéshēng"), ("小学生", "xiǎoxuéshēng")), "A", "The brother is a university student: A 大学生."),
    ],
}
HSK1_L2_EXAMPLE = ("我想喝水。", "Wǒ xiǎng hē shuǐ.", opts(("水", "shuǐ"), ("茶", "chá"), ("牛奶", "niúnǎi")), "A", "“I want to drink water”: A 水.")

# Reading part 4: a short text, a starred question and three answers. (text, pinyin, question, pinyin, options, answer, why)
HSK1_R4 = {
    1: [
        ("我叫王月，是大学生。我早上八点去学校，下午五点回家。", "Wǒ jiào Wáng Yuè, shì dàxuéshēng. Wǒ zǎoshang bā diǎn qù xuéxiào, xiàwǔ wǔ diǎn huí jiā.",
         "王月下午几点回家？", "Wáng Yuè xiàwǔ jǐ diǎn huí jiā?", opts(("八点", "bā diǎn"), ("五点", "wǔ diǎn"), ("十二点", "shí'èr diǎn")), "B", "She goes home at five in the afternoon: B."),
        ("今天是星期六，我不上课。上午我在家看书，下午和朋友去商店买衣服。", "Jīntiān shì xīngqīliù, wǒ bú shàngkè. Shàngwǔ wǒ zài jiā kàn shū, xiàwǔ hé péngyou qù shāngdiàn mǎi yīfu.",
         "她下午去哪儿？", "Tā xiàwǔ qù nǎr?", opts(("学校", "xuéxiào"), ("家", "jiā"), ("商店", "shāngdiàn")), "C", "In the afternoon she goes to a shop with a friend: C."),
        ("我家有四口人：爸爸、妈妈、哥哥和我。哥哥是医生，在医院工作。", "Wǒ jiā yǒu sì kǒu rén: bàba, māma, gēge hé wǒ. Gēge shì yīshēng, zài yīyuàn gōngzuò.",
         "哥哥在哪儿工作？", "Gēge zài nǎr gōngzuò?", opts(("医院", "yīyuàn"), ("学校", "xuéxiào"), ("公司", "gōngsī")), "A", "The brother is a doctor in a hospital: A."),
        ("这个杯子很漂亮，也很便宜，一个十块钱。我想买两个。", "Zhège bēizi hěn piàoliang, yě hěn piányi, yí ge shí kuài qián. Wǒ xiǎng mǎi liǎng ge.",
         "一个杯子多少钱？", "Yí ge bēizi duōshao qián?", opts(("两块", "liǎng kuài"), ("十块", "shí kuài"), ("二十块", "èrshí kuài")), "B", "One cup costs ten yuan; two would be twenty: B."),
        ("我很喜欢喝茶，不喜欢喝牛奶。我妈妈喜欢喝水。", "Wǒ hěn xǐhuan hē chá, bù xǐhuan hē niúnǎi. Wǒ māma xǐhuan hē shuǐ.",
         "他喜欢喝什么？", "Tā xǐhuan hē shénme?", opts(("茶", "chá"), ("牛奶", "niúnǎi"), ("水", "shuǐ")), "A", "He likes tea; water is what his mother likes: A."),
    ],
    2: [
        ("星期天我们坐火车去北京。火车上午十点开，下午一点到。", "Xīngqītiān wǒmen zuò huǒchē qù Běijīng. Huǒchē shàngwǔ shí diǎn kāi, xiàwǔ yī diǎn dào.",
         "火车几点开？", "Huǒchē jǐ diǎn kāi?", opts(("十点", "shí diǎn"), ("一点", "yī diǎn"), ("两点", "liǎng diǎn")), "A", "The train leaves at ten; one o'clock is when it arrives: A."),
        ("今天下雨了，很冷。我不想去外边，想在家看电视。", "Jīntiān xià yǔ le, hěn lěng. Wǒ bù xiǎng qù wàibian, xiǎng zài jiā kàn diànshì.",
         "今天天气怎么样？", "Jīntiān tiānqì zěnmeyàng?", opts(("很热", "hěn rè"), ("很好", "hěn hǎo"), ("下雨了", "xià yǔ le")), "C", "It is raining and cold: C."),
        ("我的女朋友是中国人。她会说汉语，也会写很多汉字。", "Wǒ de nǚpéngyou shì Zhōngguó rén. Tā huì shuō Hànyǔ, yě huì xiě hěn duō Hànzì.",
         "他的女朋友会做什么？", "Tā de nǚpéngyou huì zuò shénme?", opts(("开车", "kāichē"), ("写汉字", "xiě Hànzì"), ("做饭", "zuò fàn")), "B", "She can write many Chinese characters: B."),
        ("我爸爸开车上班，我妈妈坐出租车上班。", "Wǒ bàba kāichē shàngbān, wǒ māma zuò chūzūchē shàngbān.",
         "妈妈怎么上班？", "Māma zěnme shàngbān?", opts(("开车", "kāichē"), ("坐火车", "zuò huǒchē"), ("坐出租车", "zuò chūzūchē")), "C", "The mother takes a taxi; the father drives: C."),
        ("昨天我去医院看病了。医生说我没事，要多休息。", "Zuótiān wǒ qù yīyuàn kànbìng le. Yīshēng shuō wǒ méi shì, yào duō xiūxi.",
         "医生说什么？", "Yīshēng shuō shénme?", opts(("要多休息", "yào duō xiūxi"), ("要多吃饭", "yào duō chī fàn"), ("要去学校", "yào qù xuéxiào")), "A", "The doctor says to rest more: A."),
    ],
    3: [
        ("我朋友小李住在学校里。他的房间不大，很漂亮。", "Wǒ péngyou Xiǎo Lǐ zhù zài xuéxiào li. Tā de fángjiān bú dà, hěn piàoliang.",
         "小李的房间怎么样？", "Xiǎo Lǐ de fángjiān zěnmeyàng?", opts(("很大", "hěn dà"), ("很漂亮", "hěn piàoliang"), ("不好看", "bù hǎokàn")), "B", "The room is not big but very pretty: B."),
        ("早上我吃了两个包子，喝了一杯水。中午我吃米饭。", "Zǎoshang wǒ chī le liǎng ge bāozi, hē le yì bēi shuǐ. Zhōngwǔ wǒ chī mǐfàn.",
         "他早上吃了什么？", "Tā zǎoshang chī le shénme?", opts(("包子", "bāozi"), ("米饭", "mǐfàn"), ("面包", "miànbāo")), "A", "He had two steamed buns in the morning; rice is lunch: A."),
        ("明天是星期一。我七点半起床，八点上课。", "Míngtiān shì xīngqīyī. Wǒ qī diǎn bàn qǐchuáng, bā diǎn shàngkè.",
         "他明天几点上课？", "Tā míngtiān jǐ diǎn shàngkè?", opts(("七点", "qī diǎn"), ("七点半", "qī diǎn bàn"), ("八点", "bā diǎn")), "C", "Half past seven is getting up; class is at eight: C."),
        ("这儿有三本书，一本是我的，两本是我同学的。", "Zhèr yǒu sān běn shū, yì běn shì wǒ de, liǎng běn shì wǒ tóngxué de.",
         "他有几本书？", "Tā yǒu jǐ běn shū?", opts(("一本", "yì běn"), ("两本", "liǎng běn"), ("三本", "sān běn")), "A", "One of the three books is his: A."),
        ("下午三点，我在书店看见了我的老师，他在买中文书。", "Xiàwǔ sān diǎn, wǒ zài shūdiàn kànjiàn le wǒ de lǎoshī, tā zài mǎi Zhōngwén shū.",
         "老师在书店做什么？", "Lǎoshī zài shūdiàn zuò shénme?", opts(("看电影", "kàn diànyǐng"), ("买书", "mǎi shū"), ("打电话", "dǎ diànhuà")), "B", "The teacher is buying Chinese books: B."),
    ],
}
HSK1_R4_EXAMPLE = ("我今天很忙，上午工作，下午上课。", "Wǒ jīntiān hěn máng, shàngwǔ gōngzuò, xiàwǔ shàngkè.", "她下午做什么？", "Tā xiàwǔ zuò shénme?",
                   opts(("工作", "gōngzuò"), ("上课", "shàngkè"), ("睡觉", "shuìjiào")), "B", "She works in the morning and has class in the afternoon: B.")

# ---------------------------------------------------------------------------------------------------------------
# HSK 2
# ---------------------------------------------------------------------------------------------------------------

# Listening part 1: a 2.0 Listening part 1 sentence whose picture matches (√), with two other pictures of the same
# form as wrong choices. (2.0 number, new sentence or None, its pinyin, 2.0 numbers of the two wrong pictures)
HSK2_L1 = {
    1: [(1, None, None, (2, 5)), (3, None, None, (6, 9)), (4, None, None, (5, 7)), (6, None, None, (3, 8)), (8, None, None, (10, 3))],
    2: [(1, "他们在等公交车。", "Tāmen zài děng gōngjiāochē.", (6, 8)), (2, None, None, (4, 9)), (3, "这是一杯咖啡。", "Zhè shì yì bēi kāfēi.", (7, 10)), (5, None, None, (8, 2)), (10, None, None, (1, 7))],
    3: [(1, None, None, (3, 9)), (2, None, None, (6, 10)), (4, None, None, (2, 7)), (7, None, None, (5, 8)), (8, None, None, (1, 6))],
}
# Answer letters of those five items (the right picture's place among A-C).
HSK2_L1_KEYS = {1: "BACAC", 2: "ACBBA", 3: "CABBC"}
# The 2.0 example picture (a woman reading) with two pictures of the HSK 1 shared examples; answer A.
HSK2_L1_EXAMPLE_DISTRACTORS = ["listening-2-b.svg", "listening-2-c.svg"]

# Reading part 4: the 2.0 Reading part 3 texts (text + ★ statement, √/×) become text + ★ question + three answers.
# (2.0 number, question, pinyin, options, answer, why; optional replacement text and pinyin)
HSK2_R4 = {
    1: [
        (46, "他跑步跑了多长时间了？", "Tā pǎobù pǎo le duō cháng shíjiān le?", opts(("一年", "yì nián"), ("两年", "liǎng nián"), ("三年", "sān nián")), "B", "He has been running for two years: B."),
        (47, "哥哥什么时候去踢足球？", "Gēge shénme shíhou qù tī zúqiú?", opts(("星期六上午", "xīngqīliù shàngwǔ"), ("星期六下午", "xīngqīliù xiàwǔ"), ("星期天下午", "xīngqītiān xiàwǔ")), "B", "Every Saturday afternoon: B."),
        (48, "今天天气怎么样？", "Jīntiān tiānqì zěnmeyàng?", opts(("很冷", "hěn lěng"), ("很热", "hěn rè"), ("是晴天", "shì qíngtiān")), "A", "It snowed and it is very cold: A."),
        (49, "医生让他做什么？", "Yīshēng ràng tā zuò shénme?", opts(("多看手机", "duō kàn shǒujī"), ("多休息", "duō xiūxi"), ("去游泳", "qù yóuyǒng")), "B", "The doctor says to look at the phone less and rest more: B."),
        (50, "弟弟今天上课的时候怎么样？", "Dìdi jīntiān shàngkè de shíhou zěnmeyàng?", opts(("很高兴", "hěn gāoxìng"), ("很累", "hěn lèi"), ("都听懂了", "dōu tīngdǒng le")), "B", "He went to bed late and was tired in class: B."),
    ],
    2: [
        (46, "他每天几点下班？", "Tā měi tiān jǐ diǎn xiàbān?", opts(("八点", "bā diǎn"), ("五点", "wǔ diǎn"), ("六点", "liù diǎn")), "B", "Work ends at five in the afternoon: B."),
        (47, "他为什么不坐出租车？", "Tā wèi shénme bú zuò chūzūchē?", opts(("太贵了", "tài guì le"), ("太慢了", "tài màn le"), ("太远了", "tài yuǎn le")), "A", "The taxi takes twenty minutes but is too expensive: A."),
        (48, "这个手机是什么时候买的？", "Zhège shǒujī shì shénme shíhou mǎi de?", opts(("去年", "qùnián"), ("今年", "jīnnián"), ("昨天", "zuótiān")), "A", "It was bought last year: A."),
        (49, "他们准备怎么去北京？", "Tāmen zhǔnbèi zěnme qù Běijīng?", opts(("坐火车", "zuò huǒchē"), ("坐飞机", "zuò fēijī"), ("开车", "kāichē")), "B", "They have bought plane tickets: B."),
        (50, "为什么很多人来这家饭馆？", "Wèi shénme hěn duō rén lái zhè jiā fànguǎn?", opts(("菜很好吃", "cài hěn hǎochī"), ("离家很近", "lí jiā hěn jìn"), ("人很少", "rén hěn shǎo")), "A", "The food is good and not expensive: A.",
         "这家饭馆的菜很好吃，也不贵，所以每天来吃饭的人非常多。", "Zhè jiā fànguǎn de cài hěn hǎochī, yě bú guì, suǒyǐ měi tiān lái chī fàn de rén fēicháng duō."),
    ],
    3: [
        (46, "爸爸给妹妹买了什么？", "Bàba gěi mèimei mǎi le shénme?", opts(("衣服", "yīfu"), ("手机", "shǒujī"), ("手表", "shǒubiǎo")), "B", "The father bought her a new phone: B."),
        (47, "女儿今年几岁？", "Nǚ'ér jīnnián jǐ suì?", opts(("三岁", "sān suì"), ("五岁", "wǔ suì"), ("八岁", "bā suì")), "B", "The son is eight and the daughter three years younger: B."),
        (48, "什么时候下的雪？", "Shénme shíhou xià de xuě?", opts(("昨天晚上", "zuótiān wǎnshang"), ("今天早上", "jīntiān zǎoshang"), ("今天下午", "jīntiān xiàwǔ")), "A", "It snowed last night; in the morning everything was white: A."),
        (49, "那家商店的水果怎么样？", "Nà jiā shāngdiàn de shuǐguǒ zěnmeyàng?", opts(("很贵", "hěn guì"), ("很便宜", "hěn piányi"), ("不好吃", "bù hǎochī")), "B", "The fruit there is very cheap: B."),
        (50, "她丈夫每天做什么？", "Tā zhàngfu měi tiān zuò shénme?", opts(("做饭", "zuò fàn"), ("洗衣服", "xǐ yīfu"), ("买菜", "mǎi cài")), "B", "He cannot cook but washes the clothes every day: B."),
    ],
}
HSK2_R4_EXAMPLE = ("我昨天下午去商场买了一件衣服，是红色的，很漂亮，也不贵。", "Wǒ zuótiān xiàwǔ qù shāngchǎng mǎi le yí jiàn yīfu, shì hóngsè de, hěn piàoliang, yě bú guì.",
                   "她买的衣服是什么颜色的？", "Tā mǎi de yīfu shì shénme yánsè de?", opts(("白色", "báisè"), ("红色", "hóngsè"), ("黑色", "hēisè")), "B", "The clothes are red: B.")

# Writing part 1: a word with its pinyin; one character shows only one component and a box for the other. The six
# components of the bank (A-F) are shared by five items, one each, and one is never used.
# (word, pinyin, index of the character, shown component, side of the box, answer component)
HSK2_W1 = {
    1: {"bank": ["亻", "讠", "女", "日", "氵", "口"], "items": [
        ("妈妈", "māma", 0, "马", "left", "女"), ("名字", "míngzi", 0, "夕", "bottom", "口"), ("汉语", "Hànyǔ", 0, "又", "left", "氵"),
        ("说话", "shuōhuà", 0, "兑", "left", "讠"), ("时间", "shíjiān", 0, "寸", "left", "日")]},
    2: {"bank": ["口", "亻", "土", "讠", "女", "氵"], "items": [
        ("姐姐", "jiějie", 0, "且", "left", "女"), ("没有", "méiyǒu", 0, "殳", "left", "氵"), ("汉语", "Hànyǔ", 1, "吾", "left", "讠"),
        ("地铁", "dìtiě", 0, "也", "left", "土"), ("你和我", "nǐ hé wǒ", 1, "禾", "right", "口")]},
    3: {"bank": ["宀", "父", "女", "彳", "王", "亻"], "items": [
        ("好吃", "hǎochī", 0, "子", "left", "女"), ("现在", "xiànzài", 0, "见", "left", "王"), ("很好", "hěn hǎo", 0, "艮", "left", "彳"),
        ("汉字", "Hànzì", 1, "子", "top", "宀"), ("爸爸", "bàba", 0, "巴", "top", "父")]},
}
HSK2_W1_EXAMPLE = ("你好", "nǐ hǎo", 0, "尔", "left", "亻")

# Writing part 2: a sentence with one character missing; its pinyin is printed in the gap. (sentence with ＿, the
# missing character's pinyin, answer, pinyin of the whole sentence)
HSK2_W2 = {
    1: [
        ("我每天早上跑步，身体很＿。", "hǎo", "好", "Wǒ měi tiān zǎoshang pǎobù, shēntǐ hěn hǎo."),
        ("他是我的＿哥。", "gē", "哥", "Tā shì wǒ de gēge."),
        ("我们＿校有很多学生。", "xué", "学", "Wǒmen xuéxiào yǒu hěn duō xuésheng."),
        ("＿天天气很好。", "jīn", "今", "Jīntiān tiānqì hěn hǎo."),
        ("你会＿汉语吗？", "shuō", "说", "Nǐ huì shuō Hànyǔ ma?"),
    ],
    2: [
        ("我＿公司工作。", "zài", "在", "Wǒ zài gōngsī gōngzuò."),
        ("我想去＿国旅游。", "Zhōng", "中", "Wǒ xiǎng qù Zhōngguó lǚyóu."),
        ("他每天八＿上班。", "diǎn", "点", "Tā měi tiān bā diǎn shàngbān."),
        ("我很喜欢我的＿作。", "gōng", "工", "Wǒ hěn xǐhuan wǒ de gōngzuò."),
        ("这个房＿很大。", "jiān", "间", "Zhège fángjiān hěn dà."),
    ],
    3: [
        ("今天是我妹妹的＿日。", "shēng", "生", "Jīntiān shì wǒ mèimei de shēngrì."),
        ("我＿姐今年二十岁。", "jiě", "姐", "Wǒ jiějie jīnnián èrshí suì."),
        ("这件衣服＿少钱？", "duō", "多", "Zhè jiàn yīfu duōshao qián?"),
        ("我家有＿口人。", "sì", "四", "Wǒ jiā yǒu sì kǒu rén."),
        ("你＿点去商店？", "jǐ", "几", "Nǐ jǐ diǎn qù shāngdiàn?"),
    ],
}
HSK2_W2_EXAMPLE = ("我爱我＿。", "jiā", "家", "Wǒ ài wǒ jiā.")

# The 100 handwriting characters of HSK 1-2 (syllabus appendix); Writing answers come from this list only.
HANDWRITING = set("爱八爸百半比边不茶打大地的点对多儿二分哥个工口国过还汉好和很后会几家间叫姐今男九可来了两六妈吗么没们名那你年"
                  "七去人日三少上什生十时是书说四岁他她天同为文我五午习下小现写学要也一以有语月在长这中子女字作")
