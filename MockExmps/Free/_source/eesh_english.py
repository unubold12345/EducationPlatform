"""ЭЕШ English — free half paper (eesh-english-free).

Half of the 2022–2026 blueprint: Part I grammar, vocabulary, communication and reading (42 points) and
Part II word forms and definitions (8 points). 34 items, 50 points, 40 minutes. The reading text is an
original fictional story, so no fact in it needs checking against the world.
"""

from __future__ import annotations

from common import EntrancePaper

SLUG = "eesh-english-free"
PASSAGE = "The Library on Wheels"
TEXT = """Every second Saturday, an old orange bus stops in the centre of Bayan, a small town three hundred kilometres from the capital. Before the engine has stopped, children are already standing in a line. The bus does not carry passengers. It carries more than two thousand books.

The idea came from Oyuna, a retired teacher. After she left her job, she noticed that many families in the countryside had very few books at home, and the nearest library was a two-hour drive away. "Children were reading the same three books again and again," she remembers. "They were not bored with reading. They had simply run out of things to read."

Oyuna could not afford to open a library, but she knew someone with an old bus. With help from her former students, she removed the seats, built shelves along both sides and painted the outside bright orange so that people could see it from far away. Local businesses gave money for fuel, and a publisher in the capital donated boxes of new books.

The bus now visits six towns. Readers can borrow up to three books for two weeks, and there is no charge. Oyuna has only one rule: every reader must tell her about one book they have finished. Some children write short reviews, which are glued inside the covers for the next reader.

Not everything is easy. In winter, roads are sometimes closed by snow, and the bus has broken down twice. However, Oyuna believes the effort is worth it. Last year, teachers in Bayan reported that pupils who used the bus regularly wrote longer and more confident essays. "A book is a small thing," Oyuna says, "but it can open a very large door.\""""


def build(program_dir):
    p = EntrancePaper(
        subject="english", slug=SLUG, language="en",
        title="ЭЕШ · Англи хэл · Үнэгүй туршилт",
        description="ЭЕШ-ийн англи хэлний бүтэцтэй, хагас хэмжээний үнэгүй дадлагын шалгалт. 26 сонгох, 8 холбох, нөхөх даалгавар, 50 оноо; 40 минут.",
        minutes=40,
        instructions=[
            "Part I: A–E сонголтоос нэг зөв хариултыг сонго.",
            "Part II: үг, хэллэгийг тохируулан холбох эсвэл зөв хэлбэрийг сонго.",
            "Хариу автоматаар хадгалагдана. Хугацаа дуусахад эцэслэгдэнэ. Энэ нь бүтэн шалгалтын хагас хэмжээний үнэгүй хувилбар.",
        ],
        source_note="Даалгавар, уншлагын эхийг энэ сайтад зориулж зохиосон; албан ЭЕШ-ийн асуулт ашиглаагүй. Багшийн хяналт хүлээгдэж байна.",
    )
    p.passages.append({"title": PASSAGE, "text": TEXT})
    GR, VO, CO, RE, P2 = "Дүрэм, хэл зүй", "Үгсийн сан", "Харилцаа", "Уншиж ойлгох", "Хэсэг II"
    q = p.choice

    g = p.group("p1-t1", "Task 1", "SECTION 1. GRAMMAR", "Choose the correct answers. /4x1=4 points/", pageMode="single")
    q("1", g, 1, GR, "My sister ___ to school by bus every day.", ["go", "goes", "going", "is go", "gone"], "B",
      "Every day — байнгын үйлдэл, Present Simple. Ганц тооны 3-р бие (my sister) тул goes.")
    q("2", g, 1, GR, "There isn't ___ milk left in the fridge.", ["some", "many", "any", "a few", "few"], "C",
      "Үгүйсгэх өгүүлбэрт тоолж болохгүй нэр үгтэй any хэрэглэнэ. Many, a few, few нь тоолж болох нэр үгтэй хэрэглэгддэг.")
    q("3", g, 1, GR, "This is the ___ film I have ever seen.", ["most interesting", "more interesting", "interestingest", "much interesting", "interesting"], "A",
      "The ... I have ever seen — оргил зэрэг. Урт тэмдэг нэрт the most нэмнэ.")
    q("4", g, 1, GR, "We ___ dinner when the lights went out.", ["have", "were having", "have had", "are having", "will have"], "B",
      "Үргэлжилж байсан үйлдлийг (Past Continuous) богино үйлдэл (went out) тасалсан.")

    g = p.group("p1-t2", "Task 2", "SECTION 1. GRAMMAR", "Choose the correct answers. /4x2=8 points/", pageMode="single")
    q("5", g, 2, GR, "If it ___ tomorrow, we will cancel the trip.", ["will rain", "rained", "rains", "would rain", "has rained"], "C",
      "First conditional: if + Present Simple, will + үйл үг. If-тэй хэсэгт will хэрэглэхгүй.")
    q("6", g, 2, GR, "The bridge ___ in 1998 and is still in use today.", ["built", "has built", "is building", "was built", "has been built"], "D",
      "Гүүр өөрөө бариагүй — идэвхгүй хэв. Тодорхой өнгөрсөн цаг (in 1998) тул Past Simple Passive: was built.")
    q("7", g, 2, GR, "She asked me where ___.", ["did I live", "do I live", "lived I", "I lived", "have I lived"], "D",
      "Шууд бус асуултад үгийн дараалал энгийн өгүүлбэрийнх (I lived) болж, asked-ийн дагуу цаг нь хойшилно.")
    q("8", g, 2, GR, "By the time we arrived at the station, the train ___.", ["already left", "has already left", "had already left", "is already leaving", "already leaves"], "C",
      "Өнгөрсөн өөр үйлдлээс (arrived) өмнө дууссан үйлдэл — Past Perfect: had already left.")

    g = p.group("p1-t3", "Task 3", "SECTION 1. GRAMMAR",
                "Identify the underlined part that should be corrected in each sentence. Underlined parts are marked [A ...] to [E ...]. /2x3=6 points/",
                pageMode="single")
    q("9", g, 3, GR, "Each of the students [A have] [B already] [C handed] in [D the] [E homework].",
      ["have", "already", "handed", "the", "homework"], "A",
      "Each of ... нь ганц тоо тул have биш has: Each of the students has already handed in the homework.")
    q("10", g, 3, GR, "I [A am used] to [B get] up early because I [C have] worked on a farm [D for] [E many years].",
      ["am used", "get", "have", "for", "many years"], "B",
      "Be used to-гийн дараа -ing хэлбэр орно: I am used to getting up early.")

    g = p.group("p2-t1", "Task 1", "SECTION 2. VOCABULARY", "Choose the correct answers. /5x1=5 points/", pageMode="single")
    q("11", g, 1, VO, "The doctor gave me a ___ for some medicine.", ["recipe", "receipt", "prescription", "description", "subscription"], "C",
      "Prescription — эмчийн жор. Recipe нь хоолны жор, receipt нь төлбөрийн баримт.")
    q("12", g, 1, VO, "Please ___ off your phone during the exam.", ["turn", "take", "put", "give", "get"], "A",
      "Turn off — унтраах.")
    q("13", g, 1, VO, "The museum is very popular with ___ from all over the world.", ["hosts", "guides", "natives", "residents", "tourists"], "E",
      "From all over the world — дэлхийн өнцөг булан бүрээс ирдэг жуулчид (tourists).")
    q("14", g, 1, VO, "Our team ___ the match 3–1.", ["beat", "earned", "gained", "scored", "won"], "E",
      "Win a match — тоглолтод ялах. Beat-ийн дараа өрсөлдөгч (beat the other team) орно.")
    q("15", g, 1, VO, "He is very ___; he never tells lies.", ["polite", "patient", "generous", "honest", "careful"], "D",
      "Never tells lies — худал хэлдэггүй, үнэнч (honest).")

    g = p.group("p2-t2", "Task 2", "SECTION 2. VOCABULARY", "Choose the most suitable word to complete each collocation. /2x2=4 points/", pageMode="single")
    q("16", g, 2, VO, "Students should ___ attention to the teacher's instructions.", ["pay", "put", "make", "take", "do"], "A",
      "Тогтвортой хэллэг: pay attention to — анхаарал хандуулах.")
    q("17", g, 2, VO, "Can you ___ a photo of us in front of the monument?", ["make", "take", "do", "draw", "have"], "B",
      "Тогтвортой хэллэг: take a photo — зураг авах.")

    g = p.group("p3-t1", "Task 1", "SECTION 3. COMMUNICATION", "Read the conversations and choose the most appropriate responses. /2x2=4 points/", pageMode="single")
    q("18", g, 2, CO, "Waiter: Are you ready to order?\nCustomer: ___",
      ["Here you are.", "Nice to meet you, too.", "Yes, I'd like the chicken soup, please.", "I'm fine, thanks.", "You're welcome."], "C",
      "Захиалах уу гэсэн асуултад хоолоо нэрлэж хариулна.")
    q("19", g, 2, CO, "Student: I'm sorry I'm late. The bus broke down.\nTeacher: ___",
      ["Congratulations!", "Yes, it is.", "Same to you.", "I'd love to.", "That's all right. Come in and sit down."], "E",
      "Уучлал гуйхад That's all right гэж хүлээж авна.")

    g = p.group("p4-t1", "Task 1", "SECTION 4. READING", "Read the passage and then answer the questions below. /5x1=5 points/", pageMode="single")
    read = dict(passage=PASSAGE)
    q("20", g, 1, RE, "What is the passage mainly about?",
      ["A travelling library started by a former teacher", "A new school in the capital", "A bus company in the countryside", "How to repair old buses", "A national writing competition"], "A",
      "Бүх догол мөр Оюунагийн эхлүүлсэн автобусан номын сангийн тухай.", **read)
    q("21", g, 1, RE, "Why did Oyuna start the project?",
      ["She wanted to sell books.", "The town library had closed.", "Her students asked her to drive a bus.", "Children had too few books to read.", "She wanted to become a bus driver."], "D",
      "2-р догол мөр: families had very few books at home; they had simply run out of things to read.", **read)
    q("22", g, 1, RE, "What did Oyuna's former students do?",
      ["They gave money for fuel.", "They wrote book reviews.", "They drove the bus to six towns.", "They helped to change the inside of the bus.", "They bought new books in the capital."], "D",
      "3-р догол мөр: with help from her former students, she removed the seats, built shelves...", **read)
    q("23", g, 1, RE, "Which of the following statements is NOT true?",
      ["The bus visits six towns.", "Readers can keep books for two weeks.", "Some reviews are put inside the books.", "The bus is painted orange.", "Readers pay a small fee for each book."], "E",
      "4-р догол мөр: there is no charge — төлбөргүй.", **read)
    q("24", g, 1, RE, "The phrase \"run out of\" in paragraph 2 is closest in meaning to",
      ["find", "have no more", "write", "lose interest in", "borrow"], "B",
      "Run out of — дуусах, үлдэхгүй болох. Lose interest in биш: they were not bored with reading.", **read)

    summary = ("Oyuna turned an old bus into a library because children in the countryside had 25. _________ books at home. "
               "Readers borrow books for free, but each reader must 26. _________ one book they have finished.")
    g = p.group("p4-t2", "Task 2", "SECTION 4. READING",
                "Read the summary of the passage and fill in the blanks with the following words. There are three extra words. /2x3=6 points/",
                pageMode="single", context=summary)
    bank = ["expensive", "few", "describe", "sell", "repair"]
    q("25", g, 3, RE, "", bank, "B", "Very few books at home — ном цөөхөн байсан.", **read)
    q("26", g, 3, RE, "", bank, "C", "Every reader must tell her about one book — нэг номоо ярьж өгөх (describe).", **read)

    context21 = ("Learning a new language takes time and (a) _________. At first, many learners feel (b) _________ when they make mistakes. "
                 "However, mistakes are a (c) _________ part of learning. Teachers say that learners who practise (d) _________ usually make the fastest progress.")
    g = p.group("p5-t1", "2.1", "PART II", "Read the paragraph and choose the correct word form that best fits in each blank. /4x1=4 points/",
                pageMode="group", context=context21, contextTitle="2.1")
    labels = "12345"
    q("2.1a", g, 1, P2, "", ["patient", "patiently", "patience", "impatient", "patients"], "3",
      "Time and ... — нэр үг хэрэгтэй: patience (тэвчээр).", labels=labels, qid=f"{SLUG}-2-1-a")
    q("2.1b", g, 1, P2, "", ["embarrass", "embarrassed", "embarrassing", "embarrassment", "embarrassingly"], "2",
      "Feel + хүний мэдрэмж илэрхийлэх -ed тэмдэг нэр: embarrassed.", labels=labels, qid=f"{SLUG}-2-1-b")
    q("2.1c", g, 1, P2, "", ["natural", "nature", "naturally", "naturalist", "nationality"], "1",
      "A ... part — нэр үгийн өмнө тэмдэг нэр: natural.", labels=labels, qid=f"{SLUG}-2-1-c")
    q("2.1d", g, 1, P2, "", ["regular", "regulate", "regularity", "regularly", "irregular"], "4",
      "Practise үйл үгийг тодотгох дайвар: regularly.", labels=labels, qid=f"{SLUG}-2-1-d")

    definitions = ["to make something better", "a person who travels to a place for pleasure", "very old; from the distant past",
                   "to say no to an offer or a request", "a large group of people living together in one area"]
    g = p.group("p5-t2", "2.2", "PART II", "Match the words with their DEFINITIONS. There is one extra definition. /4x1=4 points/",
                pageMode="group", wordBank=[{"label": labels[i], "text": text} for i, text in enumerate(definitions)])
    for letter, word, answer, note in [("a", "improve", "1", "Improve — сайжруулах."), ("b", "ancient", "3", "Ancient — эртний."),
                                       ("c", "refuse", "4", "Refuse — татгалзах."), ("d", "tourist", "2", "Tourist — жуулчин.")]:
        q(f"2.2{letter}", g, 1, P2, word, definitions, answer, note + " Нэг тодорхойлолт (5) илүү.", labels=labels,
          qid=f"{SLUG}-2-2-{letter}", compactOptions=True)
    return p.build(), None
