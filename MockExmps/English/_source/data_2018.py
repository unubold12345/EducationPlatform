# 2018 blueprint: 46 choice items + Part II (4 x 5 matching, 7 options) = 100 points, 80 minutes.
MOCKS = []

# ---------------------------------------------------------------- Mock 1
MOCKS.append({
    "theme": "Everyday life, inventions and volunteering",
    "grammar": [
        ("Tuya bought ___ umbrella and ___ pair of boots for the rainy season.", ["a / a", "an / a", "the / an", "an / ___", "a / an"], "B"),
        ("The concert starts ___ 7 p.m. ___ Friday.", ["at / in", "in / on", "on / at", "at / on", "in / at"], "D"),
        ("Saraa is a careful driver. She always drives ___.", ["slow", "careless", "carefully", "hardly", "careful"], "C"),
        ("There ___ a lot of noise outside, and the neighbours ___ a party again.", ["is / are having", "are / is having", "is / is having", "are / are having", "was / has"], "A"),
        ("Since 2015, the number of tourists in Mongolia ___ steadily.", ["grow", "had grown", "to be grown", "growing", "has grown"], "E"),
        ("While we ___ dinner, the lights suddenly ___ out.", ["had / went", "were having / went", "have had / were going", "are having / go", "were having / were going"], "B"),
        ("Let's take a taxi to the station, ___?", ["do we", "will we", "shall we", "don't we", "are we"], "C"),
        ("Don't call me at 9 tomorrow morning. I ___ my driving test at that time.", ["would take", "will have been taken", "will have taken", "will be taking", "would be taking"], "D"),
        ("If she ___ harder, she ___ the scholarship.", ["studied / would get", "studies / would get", "has studied / will get", "studied / will get", "study / would have got"], "A"),
        ("Ann: When ___ the Great Wall of China built?\nBen: Most of the wall we see today ___ during the Ming dynasty.", ["was / was built", "is / built", "was / has built", "has / was built", "were / was building"], "A"),
        ("My grandmother gave me a ___ bag.", ["small, lovely, leather, old", "leather, old, small, lovely", "old, small, lovely, leather", "lovely, leather, small, old", "lovely, small, old, leather"], "E"),
        ("We stayed at home ___ it was raining heavily.", ["because of", "although", "so", "because", "despite"], "D"),
    ],
    "vocab1": [
        ("Dulmaa never gives up, even when a task is very difficult. She is ___.", ["generous", "determined", "jealous", "polite", "shy"], "B"),
        ("Regular exercise is ___ for staying healthy.", ["essential", "extinct", "eventual", "expensive", "exhausted"], "A"),
        ("Driving without a licence is ___ in most countries.", ["illegible", "illiterate", "illegal", "impolite", "irregular"], "C"),
        ("Chess is a great ___ activity because it trains your memory and logic.", ["physical", "mental", "outdoor", "emotional", "musical"], "B"),
        ("The museum has a large ___ of ancient coins from the Silk Road period.", ["election", "collection", "direction", "connection", "correction"], "B"),
        ("Please turn ___ the TV. I can't hear the news.", ["up", "off", "down", "out", "in"], "A"),
        ("Our flight was delayed, so we had to put ___ the meeting until Monday.", ["out", "up", "off", "on", "in"], "C"),
        ("Could you buy a ___ of milk and a ___ of chocolate on your way home?", ["carton / bar", "loaf / jar", "slice / can", "bar / carton", "jar / loaf"], "A"),
        ("The Trans-Mongolian Railway is one of the most famous train ___ in the world.", ["voyages", "flights", "routes", "cruises", "expeditions"], "C"),
        ("All students must ___ the safety meeting on Friday.", ["visit", "attend", "present", "arrive", "participate"], "B"),
    ],
    "vocab2": [
        ("Bat: Why are you smiling so much today?\nOyun: I've just heard that I won the essay competition. I'm really ___!", ["upset", "jealous", "delighted", "nervous", "bored"], "C"),
        ("Customer: Excuse me, how much is this jacket?\nAssistant: It's on sale. There's a 30% ___ today.", ["discount", "receipt", "refund", "budget", "salary"], "A"),
        ("Nomin: The roads were closed all morning.\nErdene: Yes, heavy snow and strong wind caused a ___ in the mountains, and lots of drivers were stuck.", ["drought", "heatwave", "flood", "blizzard", "famine"], "D"),
    ],
    "vocab3": [
        ("________ --- possible", ["un", "dis", "im", "ir", "in"], "C"),
        ("________ --- honest", ["dis", "un", "ir", "im", "il"], "A"),
    ],
    "conv1": {
        "text": "Tom: Excuse me, is this the right platform for the train to Darkhan?\nClerk: Yes, but I'm afraid it's running about forty minutes late.\nTom: Forty minutes? 28. _________\nClerk: There was a problem with the line near Zuunkharaa this morning.\nTom: I see. Is there somewhere I can wait?\nClerk: Yes, there's a waiting room next to the ticket office, and a café upstairs.\nTom: Great. And when does the next train after this one leave?\nClerk: 29. _________\nTom: Thanks. I'll take this one then. I can't wait that long.",
        "questions": [
            ("", ["Why is it late?", "Where is the train?", "How much is the ticket?", "What time is it now?", "Can I buy a ticket here?"], "A"),
            ("", ["It leaves from platform 2.", "Not until six this evening.", "It takes about four hours.", "It's very comfortable.", "Yes, it's a fast train."], "B"),
            ("Where is the conversation taking place?", ["On a train.", "At a railway station.", "In a café.", "At a bus stop.", "At an airport."], "B"),
        ],
    },
    "conv2": {
        "text": "Anu: Look at this old photo! It's our class trip to Khövsgöl Lake.\nBold: Wow, we were so young. I remember we swam in the freezing water every morning.\nAnu: And we sang songs around the fire until midnight. Those were the best days of my life.\nBold: I really miss them. Everyone is so busy now; we hardly ever see each other.\nAnu: Why don't we organize a reunion this summer?\nBold: That's a wonderful idea! I'll message everyone tonight.",
        "questions": [
            ("Bold feels ___ when he looks at the photo.", ["angry", "nostalgic", "frightened", "confused", "jealous"], "B"),
            ("At the end, Bold is ___ about Anu's idea.", ["enthusiastic", "doubtful", "disappointed", "indifferent", "worried"], "A"),
        ],
    },
    "read1": {
        "text": "For thousands of years, people had to find ways to keep food from going bad. Before the invention of the refrigerator, families dried meat and fish in the sun, or preserved vegetables with salt. In cold countries, people cut large blocks of ice from frozen lakes in winter and stored **them** in underground rooms covered with straw. The ice could last until late summer, but it was heavy, expensive and difficult to transport.\n\nIn the 1800s, inventors began to experiment with machines that could produce cold air. The first home refrigerators appeared in the early twentieth century, but they were large, noisy and very costly. Only wealthy families could afford one. By the 1950s, however, factories were producing them in large numbers, and prices fell <u>sharply</u>.\n\nThe refrigerator changed far more than the kitchen. Because food stayed fresh for longer, people no longer needed to shop every day. Supermarkets grew larger, and farmers could send fresh products to distant cities. Today it is hard to imagine a home without a refrigerator, yet it has been common for less than a hundred years.",
        "questions": [
            ("What is the passage mainly about?", ["It is about how ice was cut from frozen lakes.", "It is about the history of the refrigerator and how it changed daily life.", "It is about why supermarkets became larger.", "It is about how farmers sell products in cities.", "It is about the most expensive inventions of the 1950s."], "B"),
            ("At first, only rich families had refrigerators because ___", ["they were noisy.", "factories produced too many of them.", "they needed ice from lakes.", "they cost a lot of money.", "supermarkets did not sell them."], "D"),
            ("The pronoun \"them\" in bold in paragraph 1 refers to ___.", ["people", "vegetables", "lakes", "blocks of ice", "underground rooms"], "D"),
            ("The word \"sharply\" in paragraph 2 is closest in meaning to ___.", ["slowly", "dramatically", "painfully", "slightly", "clearly"], "B"),
        ],
    },
    "read2": {
        "text": "Dear Grandma,\n\nGreetings from Seoul! We 37. _________ here three days ago, and we are enjoying every minute. The city is huge and very modern, but there are also beautiful old palaces. Yesterday we visited Gyeongbokgung Palace and watched the changing of the guard. Tomorrow we are going to 38. _________ the famous street markets, and on Saturday we plan to climb Namsan Mountain.\n\nOur hotel is small but comfortable, and the staff are very friendly. 39. _________ we tried Korean barbecue for the first time, and Nara ate so much that she could hardly walk back to the hotel!\n\nBataa's cousin lives near the university, so we're having lunch with him on Sunday. After that we'll have a quiet last day before we fly home.\n\nI hope your knee is better. We'll bring you some green tea.\n\nLots of love,\nSaraa and Nara",
        "questions": [
            ("", ["arrive", "arrived", "have arrived", "had arrived", "are arriving"], "B"),
            ("", ["explore", "explain", "expect", "expand", "express"], "A"),
            ("", ["Tomorrow", "Next week", "Last night", "Tonight", "In the future"], "C"),
            ("The writers are ___ in Seoul.", ["bored because there is nothing to see", "worried about their grandmother's health", "having a busy but enjoyable trip", "planning to live there permanently", "staying with Bataa's cousin"], "C"),
        ],
    },
    "part2": {
        "2.1": {"items": ["What time ___ your train leave tomorrow?", "How long ___ you lived in this city?", "Why ___ you at school yesterday? Were you ill?", "Who ___ playing the piano when I came in?", "What ___ you do if you won the lottery?"],
                "choices": ["would", "weren't", "does", "was", "have", "are", "did"], "answer": "35241"},
        "2.2": {"items": ["Please be ___ in the library.", "I need some ___ about which university to choose.", "These jeans are too ___; I need a belt.", "The film was ___ good, but the ending was boring.", "Don't ___ your passport while you are travelling."],
                "choices": ["lose", "loose", "advice", "advise", "quite", "quiet", "quit"], "answer": "63251"},
        "2.3": {"items": ["I couldn't open the door …", "The shop was closed when we arrived, …", "You will pass the exam easily …", "She has been learning English …", "The man who lives next door …"],
                "choices": ["… since she was six years old.", "… works as a pilot for an international airline.", "… because I had left my keys at the office.", "… if you revise a little every day.", "… so we had to come back the next day.", "… for two hours ago.", "… as soon as she had finished the book."], "answer": "35412"},
        "2.4": {"instructions": "Match the jobs (a-e) with their duties (1-7).",
                "items": ["An architect …", "A pharmacist …", "A pilot …", "A lawyer …", "A vet …"],
                "choices": ["… prepares and gives out medicines to patients.", "… flies aircraft and is responsible for the safety of passengers.", "… treats animals that are sick or injured.", "… designs buildings and checks that they are built correctly.", "… gives legal advice and represents people in court.", "… repairs engines and other parts of cars.", "… teaches young children to read and write."], "answer": "41253"},
    },
    "listening": {
        "instructions": "You are going to listen to a woman interviewing a student. Read each question and choose the correct answer.",
        "script": "Interviewer: Good afternoon. I'm writing an article for the university magazine about students who do volunteer work. Can I ask you a few questions?\nStudent: Sure, no problem.\nInterviewer: First, could you tell me your name?\nStudent: It's Anna Delgado. That's D-E-L-G-A-D-O.\nInterviewer: Thank you. So, Anna, what kind of volunteer work do you do?\nStudent: I help at an animal shelter near the city centre. I feed the dogs, clean their cages and take them for walks.\nInterviewer: How often do you go there?\nStudent: At the moment, about twice a week, usually on Tuesdays and Saturdays. Last year I went almost every day, but now I have a part-time job in a bookshop, so I don't have as much time.\nInterviewer: Do you do anything else in your free time?\nStudent: I play volleyball for the university team, and I sometimes paint, although I'm not very good at it.\nInterviewer: Why did you start volunteering?\nStudent: Well, I've always loved animals, but we live in a small flat, so my family can't keep a pet. Volunteering is the next best thing.\nInterviewer: And what are your plans for the future?\nStudent: I'd like to study veterinary medicine after I finish my degree in biology.\nInterviewer: And what are you doing after this interview?\nStudent: I'm going straight to the shelter. A new group of puppies arrived this morning!\nInterviewer: Well, thank you, Anna, and good luck.",
        "questions": [
            ("Why is the woman interviewing the student?", ["She wants to adopt a dog.", "She is writing an article about student volunteers.", "She works at the animal shelter.", "She is a biology teacher.", "She is doing a survey about part-time jobs."], "B"),
            ("What is the student's name?", ["Anna DELGARDO", "Anna DALGADO", "Anna DELGADO", "Anna DELLGADO", "Anna DELGATO"], "C"),
            ("Last year, Anna went to the shelter ___.", ["once a week", "twice a week", "on Tuesdays only", "almost every day", "at weekends only"], "D"),
            ("Why doesn't Anna's family have a pet?", ["Her parents don't like animals.", "Pets are too expensive.", "Anna is allergic to dogs.", "She has no free time.", "They live in a small flat."], "E"),
            ("What is Anna going to do after the interview?", ["Go to the animal shelter.", "Go to her job at the bookshop.", "Play volleyball.", "Study for a biology exam.", "Paint a picture."], "A"),
            ("Anna does all of the following activities EXCEPT ___.", ["playing volleyball", "working in a bookshop", "painting", "playing in a band", "walking dogs"], "D"),
        ],
    },
})

# ---------------------------------------------------------------- Mock 2
MOCKS.append({
    "theme": "City life, environment and a young café owner",
    "grammar": [
        ("My cousin is ___ engineer at ___ factory near Darkhan.", ["a / a", "an / a", "the / an", "an / ___", "___ / a"], "B"),
        ("We usually go skiing ___ the mountains ___ January.", ["on / at", "at / on", "in / in", "in / on", "to / at"], "C"),
        ("The test was so easy that I ___ needed any time to finish it.", ["hard", "hardly", "highly", "lately", "mostly"], "B"),
        ("There ___ two new students in our class, and they ___ very well.", ["is / are doing", "are / is doing", "are / are doing", "is / is doing", "were / does"], "C"),
        ("I'm afraid I can't play in the match tomorrow. I ___ my leg.", ["break", "have broken", "had broken", "breaking", "to break"], "B"),
        ("When the phone ___, I ___ a shower.", ["rang / was having", "rang / have had", "was ringing / had", "rings / was having", "has rung / am having"], "A"),
        ("You haven't seen my glasses, ___?", ["haven't you", "did you", "have you", "do you", "aren't you"], "C"),
        ("This time next week we ___ on a beach in Thailand.", ["will lie", "would lie", "will have lain", "will be lying", "would be lying"], "D"),
        ("If I ___ you, I ___ that old car.", ["am / won't buy", "were / wouldn't buy", "was / won't buy", "had been / wouldn't buy", "were / won't buy"], "B"),
        ("Teacher: Where ___ these photos taken?\nStudent: My father ___ them in the Gobi last summer.", ["were / took", "was / taken", "did / took", "were / was taken", "are / has taken"], "A"),
        ("She was wearing a ___ dress.", ["long, beautiful, cotton, blue", "beautiful, long, blue, cotton", "blue, beautiful, long, cotton", "cotton, blue, long, beautiful", "beautiful, cotton, long, blue"], "B"),
        ("I didn't go to school yesterday ___ I had a bad cold.", ["because of", "so that", "although", "because", "despite"], "D"),
    ],
    "vocab1": [
        ("Batbold always shares his food and money with others. He is very ___.", ["selfish", "generous", "lazy", "proud", "rude"], "B"),
        ("It is ___ to wear a seat belt in a car; it's the law.", ["optional", "careless", "comfortable", "compulsory", "dangerous"], "D"),
        ("His handwriting is so bad that it's completely ___.", ["illegal", "illegible", "irregular", "impossible", "impolite"], "B"),
        ("Swimming is a good ___ exercise that works almost every muscle in the body.", ["physical", "mental", "spiritual", "social", "emotional"], "A"),
        ("Every four years, citizens vote in the presidential ___.", ["selection", "collection", "election", "correction", "reflection"], "C"),
        ("Can you look ___ my cat while I'm on holiday?", ["for", "after", "up", "at", "into"], "B"),
        ("The plane took ___ on time despite the snow.", ["off", "up", "out", "over", "on"], "A"),
        ("Could you get me a ___ of jam and a ___ of tuna from the shop?", ["loaf / bar", "bottle / slice", "jar / tin", "bar / jar", "carton / loaf"], "C"),
        ("Air ___ in Ulaanbaatar is worst in winter, when many families burn coal.", ["pollution", "population", "protection", "production", "condition"], "A"),
        ("The company decided to ___ ten new workers this year.", ["apply", "retire", "employ", "resign", "fire"], "C"),
    ],
    "vocab2": [
        ("Oyuka: How was the horror film?\nTemuulen: Terrible! I was so ___ that I couldn't sleep.", ["frightened", "amused", "relaxed", "proud", "bored"], "A"),
        ("Patient: I've had a headache for three days.\nDoctor: Take this ___ to the pharmacy and they will give you some tablets.", ["recipe", "reception", "prescription", "receipt", "description"], "C"),
        ("Dad: The river is very high after all this rain.\nMom: Yes, if it keeps raining, there'll be a ___.", ["drought", "flood", "famine", "blizzard", "earthquake"], "B"),
    ],
    "vocab3": [
        ("________ --- legal", ["un", "il", "in", "ir", "dis"], "B"),
        ("________ --- comfortable", ["in", "im", "dis", "un", "ir"], "D"),
    ],
    "conv1": {
        "text": "Librarian: Good morning. Can I help you?\nZaya: Yes, I'd like to borrow these three books, please.\nLibrarian: Of course. 28. _________\nZaya: Oh no, I think I left it at home. Is that a problem?\nLibrarian: I'm afraid you need it to take books out. But you can read them here in the reading room until we close.\nZaya: OK. What time do you close today?\nLibrarian: 29. _________\nZaya: Great, that gives me plenty of time. Thank you.",
        "questions": [
            ("", ["Can I see your library card, please?", "Do you like reading?", "Which book is your favourite?", "How much do they cost?", "Where did you find them?"], "A"),
            ("", ["We opened at nine.", "Not until eight o'clock this evening.", "On the second floor.", "For two weeks.", "We are closed on Sundays."], "B"),
            ("Where is the conversation taking place?", ["In a bookshop.", "At a school canteen.", "In a library.", "At Zaya's home.", "At a post office."], "C"),
        ],
    },
    "conv2": {
        "text": "Mr. Ganbaatar: I've just read the news. The city is going to build a new park where the old car park is.\nMrs. Ganbaatar: Really? That's fantastic news! The children will finally have somewhere safe to play.\nMr. Ganbaatar: I'm not so sure. They said it will take five years, and they always promise things and never finish them.\nMrs. Ganbaatar: Don't be so negative. This time the money has already been approved.\nMr. Ganbaatar: Well, I'll believe it when I see it.",
        "questions": [
            ("Mrs. Ganbaatar is ___ about the news.", ["pleased", "angry", "sad", "bored", "ashamed"], "A"),
            ("Mr. Ganbaatar is ___ about the new park.", ["excited", "sceptical", "delighted", "grateful", "thrilled"], "B"),
        ],
    },
    "read1": {
        "text": "In many European cities, the bicycle has become one of the most popular ways to get to work. In Copenhagen, for example, almost half of all trips to work or school are made by bike. This was not always the case. In the 1970s, the city's streets were full of cars, and cycling was seen as slow and dangerous.\n\nThings began to change when oil prices rose sharply and many people could no longer afford to drive every day. The city government built separate lanes for cyclists and special traffic lights for **them**. Over the following decades, it invested more and more in cycling, and people slowly changed their habits.\n\nToday, cycling is not only cheap but also healthy and good for the environment. Studies show that people who cycle regularly take fewer sick days, and the city has much cleaner air than before. Other cities around the world are now trying to <u>imitate</u> Copenhagen's success.",
        "questions": [
            ("What is the passage mainly about?", ["It is about how oil prices rose in the 1970s.", "It is about how one city made cycling a popular way to travel.", "It is about the dangers of cycling in traffic.", "It is about why cars are faster than bicycles.", "It is about the health problems of people in Europe."], "B"),
            ("Many people in Copenhagen started cycling because ___", ["cars were banned from the city.", "the weather became better.", "driving became too expensive for them.", "bicycles were given away free.", "they wanted to take fewer sick days."], "C"),
            ("The pronoun \"them\" in bold in paragraph 2 refers to ___.", ["cars", "cyclists", "oil prices", "traffic lights", "streets"], "B"),
            ("The word \"imitate\" in paragraph 3 is closest in meaning to ___.", ["copy", "criticize", "ignore", "compete with", "visit"], "A"),
        ],
    },
    "read2": {
        "text": "Hi Mark,\n\nThanks for your last message. Sorry I didn't write sooner. I 37. _________ really busy with exams for the past two weeks. Good news: they're finally over, and I think I did quite well!\n\nNow I'm planning my summer. My parents want me to get a part-time job, so I've applied to work at a café in the city centre. I have an interview 38. _________ Thursday morning, so wish me luck!\n\nIn July, my family is going to visit my grandparents in the countryside. 39. _________ we went there last year, I learned to ride a horse, and this year my grandfather has promised to teach me how to make airag.\n\nWhy don't you come and visit us in August? You could stay at our place, and I could show you around Ulaanbaatar.\n\nWrite back soon,\nTemuujin",
        "questions": [
            ("", ["was", "am", "have been", "had", "will be"], "C"),
            ("", ["in", "at", "on", "by", "since"], "C"),
            ("", ["When", "Unless", "Although", "Until", "Because of"], "A"),
            ("Temuujin is writing to ___.", ["complain about his exams", "tell Mark his news and invite him to visit", "apply for a job at a café", "ask Mark to teach him to ride a horse", "say he cannot see Mark this summer"], "B"),
        ],
    },
    "part2": {
        "2.1": {"items": ["What ___ you doing at 8 o'clock last night?", "How often ___ your brother go to the gym these days?", "How long ___ she worked at the hospital? Since 2019?", "Who ___ win the match tomorrow, do you think?", "Where ___ you go on holiday last summer?"],
                "choices": ["are", "did", "has", "does", "were", "will", "is"], "answer": "54362"},
        "2.2": {"items": ["Could you ___ me your pen for a minute?", "The students left ___ bags in the classroom.", "___ going to the cinema tonight. Do you want to join them?", "___ coat is this? It was on the floor.", "Can I ___ your dictionary until tomorrow?"],
                "choices": ["borrow", "lend", "there", "their", "they're", "whose", "who's"], "answer": "24561"},
        "2.3": {"items": ["We missed the bus …", "If it rains tomorrow, …", "My sister, who lives in Seoul, …", "I have known Bat …", "The museum was so interesting …"],
                "choices": ["… that we stayed there all afternoon.", "… we will cancel the picnic.", "… because we got up too late.", "… since we were at primary school together.", "… is coming to visit us next month.", "… unless you had told me.", "… we would have cancelled the picnic."], "answer": "32541"},
        "2.4": {"instructions": "Match the places (a-e) with what people do there (1-7).",
                "items": ["A gym …", "A pharmacy …", "A museum …", "A post office …", "A stadium …"],
                "choices": ["… is where people send letters and parcels.", "… is where people watch sports matches and concerts.", "… is where people exercise and lift weights.", "… is where people buy medicine.", "… is where people see old and valuable objects.", "… is where people borrow books.", "… is where people get their hair cut."], "answer": "34512"},
    },
    "listening": {
        "instructions": "You are going to listen to a radio presenter interviewing a young café owner. Read each question and choose the correct answer.",
        "script": "Presenter: Welcome back to 'Young Talents'. My guest today is a nineteen-year-old who has just opened her own café. Welcome!\nGuest: Thank you for inviting me.\nPresenter: Can you tell our listeners your name?\nGuest: Sure. I'm Khulan Batsaikhan. Khulan is spelt K-H-U-L-A-N.\nPresenter: Khulan, when did you first become interested in cooking?\nGuest: When I was about eleven. My grandmother ran a small restaurant, and I helped her every weekend.\nPresenter: And now you have your own café. That's amazing at nineteen!\nGuest: Well, I didn't do it alone. My older brother manages the money, and two friends from college work with me.\nPresenter: What's special about your café?\nGuest: We use only local ingredients: milk, meat and berries from Mongolian farms. And every dish on the menu is under ten thousand tugriks, because I want students to be able to eat there.\nPresenter: Is it busy?\nGuest: Very! At lunchtime there's usually a queue outside. In the evenings it's quieter, so I'm thinking of starting cooking classes then.\nPresenter: Great idea. What do you do to relax?\nGuest: Honestly, I don't have much free time, but I go hiking with my dog on Sundays, and I love reading cookbooks, which is still work, I suppose!\nPresenter: Khulan, thank you so much.",
        "questions": [
            ("Why is Khulan on the programme?", ["She has won a cooking competition.", "She has opened her own café at a young age.", "She is a famous food writer.", "She teaches cooking at a college.", "She runs her grandmother's restaurant."], "B"),
            ("How is the guest's first name spelt?", ["KHULAN", "KHOOLAN", "HULAN", "KHULANN", "KULAN"], "A"),
            ("As a child, Khulan helped her grandmother ___.", ["every day after school", "every weekend", "once a month", "only during the summer holidays", "twice a week"], "B"),
            ("Why is every dish under ten thousand tugriks?", ["Local ingredients are cheap.", "Her brother told her to do it.", "She wants students to be able to afford them.", "The café is very small.", "It is the law."], "C"),
            ("What is Khulan thinking of doing?", ["Opening a second café.", "Writing a cookbook.", "Hiring more friends.", "Starting cooking classes in the evenings.", "Closing the café at lunchtime."], "D"),
            ("Khulan mentions all of the following EXCEPT ___.", ["hiking with her dog", "reading cookbooks", "her brother managing the money", "using local berries", "playing the guitar"], "E"),
        ],
    },
})

# ---------------------------------------------------------------- Mock 3
MOCKS.append({
    "theme": "Travel, sport and national festivals",
    "grammar": [
        ("She is ___ honest person, and she always tells ___ truth.", ["a / a", "an / the", "the / a", "an / ___", "a / the"], "B"),
        ("Our lesson starts ___ 8:30 ___ the morning.", ["at / in", "in / at", "on / in", "at / on", "in / on"], "A"),
        ("Dorj speaks English very ___.", ["good", "fluent", "well", "fine", "nice"], "C"),
        ("There ___ some milk in the fridge, but the eggs ___ getting old.", ["are / is", "is / is", "are / are", "is / are", "was / is"], "D"),
        ("We ___ each other since we were children.", ["know", "knew", "have known", "are knowing", "had know"], "C"),
        ("I ___ along the street when I ___ an old friend.", ["walked / was meeting", "was walking / met", "have walked / met", "am walking / meet", "was walking / have met"], "B"),
        ("Nobody called while I was out, ___?", ["didn't they", "was I", "did he", "wasn't it", "did they"], "E"),
        ("By the time you arrive, we ___ dinner.", ["will finish", "would finish", "will have finished", "are finishing", "would have finished"], "C"),
        ("If I ___ a car, I ___ you to the airport.", ["have / would drive", "had / will drive", "would have / drove", "had / would drive", "have had / would drive"], "D"),
        ("Tourist: Where ___ this carpet made?\nSeller: It ___ by hand in a small village near Kharkhorin.", ["is / made", "was / was made", "did / made", "was / has made", "has / is made"], "B"),
        ("We sat at a ___ table.", ["wooden, old, round, nice", "round, nice, wooden, old", "nice, round, old, wooden", "old, nice, wooden, round", "nice, wooden, round, old"], "C"),
        ("He failed the exam ___ he had studied very hard.", ["because", "so", "because of", "although", "despite"], "D"),
    ],
    "vocab1": [
        ("My little brother is always asking questions about everything. He's very ___.", ["curious", "lazy", "anxious", "modest", "honest"], "A"),
        ("It is ___ to drink enough water during hot weather.", ["impossible", "important", "impatient", "impressive", "imaginary"], "B"),
        ("The young man was ___; he couldn't read or write.", ["illegal", "illegible", "illiterate", "irresponsible", "impolite"], "C"),
        ("Meditation is a ___ practice for many Buddhists.", ["physical", "spiritual", "financial", "chemical", "industrial"], "B"),
        ("The teacher gave us a ___ of three essay topics.", ["choice", "voice", "noise", "price", "advice"], "A"),
        ("We ran ___ of bread, so I went to the shop.", ["up", "off", "out", "over", "away"], "C"),
        ("Please fill ___ this form and sign it at the bottom.", ["on", "in", "at", "off", "with"], "B"),
        ("For the picnic we bought a ___ of grapes and a ___ of lemonade.", ["bunch / bottle", "bar / jar", "loaf / can", "slice / carton", "crumb / tin"], "A"),
        ("Marco Polo made a long ___ from Venice to China in the 13th century.", ["route", "journey", "ride", "visit", "traffic"], "B"),
        ("After forty years of work, my grandfather decided to ___.", ["retire", "recover", "remove", "return", "require"], "A"),
    ],
    "vocab2": [
        ("Mother: Why did you tidy your room without being asked?\nSon: I wanted to ___ you!", ["disappoint", "bore", "surprise", "annoy", "frighten"], "C"),
        ("Sara: Your cake looks amazing! Can you tell me how you made it?\nGerel: Sure, I'll send you the ___.", ["prescription", "recipe", "receipt", "reception", "instruction"], "B"),
        ("Reporter: There has been no rain here for over a year.\nFarmer: Yes, this ___ has killed most of our crops.", ["flood", "blizzard", "drought", "storm", "hurricane"], "C"),
    ],
    "vocab3": [
        ("________ --- regular", ["un", "ir", "il", "in", "dis"], "B"),
        ("________ --- kind", ["in", "im", "dis", "un", "ir"], "D"),
    ],
    "conv1": {
        "text": "Receptionist: Good evening, welcome to the Blue Sky Hotel.\nGuest: Good evening. I have a reservation for two nights. My name is Lee.\nReceptionist: Let me check... Yes, Mr. Lee, a double room. 28. _________\nGuest: Here you are.\nReceptionist: Thank you. Your room is 512, on the fifth floor. Breakfast is served from seven to ten.\nGuest: Is there Wi-Fi in the room?\nReceptionist: Yes, the password is on the card. Is there anything else?\nGuest: 29. _________\nReceptionist: Certainly. The airport bus leaves from the front door every hour.",
        "questions": [
            ("", ["May I see your passport, please?", "How many nights would you like?", "What is your name?", "Do you like the hotel?", "Where are you from?"], "A"),
            ("", ["No, I don't have any luggage.", "Yes, how can I get to the airport on Wednesday?", "Room 512, please.", "I'd like a single room.", "Yes, breakfast was delicious."], "B"),
            ("Where is the conversation taking place?", ["At an airport.", "On a bus.", "At a hotel reception desk.", "In a restaurant.", "In room 512."], "C"),
        ],
    },
    "conv2": {
        "text": "Coach: Well done, everyone. Second place in the national championship!\nNaraa: Second place? We trained for six months to win first place.\nCoach: I know, but the other team was very strong. You should be proud.\nNaraa: I suppose so... but I really wanted that gold medal.\nBilguun: Don't worry, Naraa. Next year we'll win. I'm sure of it! We just need more practice.",
        "questions": [
            ("Naraa feels ___ about the result.", ["delighted", "disappointed", "relieved", "amused", "grateful"], "B"),
            ("Bilguun is ___ about next year.", ["confident", "nervous", "jealous", "upset", "ashamed"], "A"),
        ],
    },
    "read1": {
        "text": "Every summer, Mongolians celebrate Naadam, the country's biggest national festival. It is often called the 'three games of men' because it includes wrestling, horse racing and archery. Today, however, women also take part in archery, and girls often ride in the horse races.\n\nThe festival has a very long history. Hundreds of years ago, Naadam was a way for warriors to show their strength and skill. Later, it became a celebration held after religious ceremonies. Today, the main Naadam takes place in Ulaanbaatar every year on 11-13 July.\n\nHorse racing is perhaps the most surprising event for visitors. The riders are children, usually between five and thirteen years old, because **they** weigh much less than adults. The races cross the open steppe over distances of up to 30 kilometres. The horses, not the riders, are the real stars, and the winning horse is <u>praised</u> in a special song.",
        "questions": [
            ("What is the passage mainly about?", ["It is about the history and main events of a Mongolian festival.", "It is about how children learn to ride horses.", "It is about warriors in ancient Mongolia.", "It is about why visitors come to Ulaanbaatar.", "It is about the rules of Mongolian wrestling."], "A"),
            ("Children ride in the horse races because ___", ["adults are not allowed to.", "they are not heavy.", "they are better riders.", "the races are short.", "the horses know them well."], "B"),
            ("The pronoun \"they\" in bold in paragraph 3 refers to ___.", ["visitors", "horses", "distances", "children", "events"], "D"),
            ("The word \"praised\" in paragraph 3 is closest in meaning to ___.", ["criticized", "ignored", "admired", "sold", "punished"], "C"),
        ],
    },
    "read2": {
        "text": "Dear Uncle Bat,\n\nGreetings from Switzerland! We 37. _________ here on Sunday after a long flight, and the mountains are even more beautiful than in the photos. Every morning we take a cable car to the top and ski down. Mom fell twice on the first day, but she's getting better!\n\nThe village is small and quiet, and our hotel has a wonderful view of the lake. Yesterday we tried cheese fondue, which is a traditional Swiss dish. Tomorrow we're going to take a train 38. _________ the mountains to a famous glacier.\n\nWe 39. _________ home next Friday. I'll bring you some Swiss chocolate!\n\nBest wishes,\nAriunaa",
        "questions": [
            ("", ["arrive", "have arrived", "arrived", "arriving", "will arrive"], "C"),
            ("", ["through", "during", "among", "since", "under"], "A"),
            ("", ["were flying", "are flying", "flew", "have flown", "had flown"], "B"),
            ("Ariunaa's family is ___.", ["on a skiing holiday in Switzerland", "visiting Uncle Bat in the mountains", "living in Switzerland now", "unhappy with their hotel", "learning to make chocolate"], "A"),
        ],
    },
    "part2": {
        "2.1": {"items": ["Why ___ you so late this morning?", "What ___ your sister like? Is she friendly?", "How many countries ___ you visited so far?", "What ___ you do if you lost your passport abroad?", "When ___ the film start last night?"],
                "choices": ["do", "was", "have", "would", "is", "did", "were"], "answer": "75346"},
        "2.2": {"items": ["I've lived here ___ 2015.", "She has been ill ___ three days.", "We moved to Darkhan ten years ___.", "Someone stole my bag ___ I was sleeping on the train.", "Have you finished your homework ___?"],
                "choices": ["ago", "before", "since", "for", "during", "while", "yet"], "answer": "34167"},
        "2.3": {"items": ["I'll call you …", "She was so tired …", "Unless you hurry, …", "The book that you lent me …", "We decided to stay inside …"],
                "choices": ["… that she fell asleep on the bus.", "… because it was snowing heavily.", "… as soon as I get home.", "… was really exciting.", "… you'll miss the last train.", "… if I had known.", "… which is very cheap."], "answer": "31542"},
        "2.4": {"instructions": "Match the sports (a-e) with their descriptions (1-7).",
                "items": ["Archery …", "Wrestling …", "Basketball …", "Swimming …", "Chess …"],
                "choices": ["… is a board game for two players with kings, queens and pawns.", "… is a sport in which you shoot arrows at a target.", "… is a sport in which two people try to throw each other to the ground.", "… is a team sport in which players throw a ball through a high net.", "… is a sport in which you move through water using your arms and legs.", "… is a sport played on ice with sticks and a puck.", "… is a sport in which players hit a small ball into holes with a club."], "answer": "23451"},
    },
    "listening": {
        "instructions": "You are going to listen to a woman interviewing a student about sport. Read each question and choose the correct answer.",
        "script": "Woman: Hi, I'm from the city sports centre. We're asking young people about their sporting habits. Do you have a few minutes?\nBoy: Yes, of course.\nWoman: Great. What's your name?\nBoy: Tom Weston. That's W-E-S-T-O-N.\nWoman: And how old are you, Tom?\nBoy: I'm seventeen.\nWoman: What sports do you do?\nBoy: Mainly running. I'm training for my first marathon in October. I also swim, and I play table tennis with my dad.\nWoman: How often do you train?\nBoy: Five times a week now. When I started two years ago, I only ran once a week, just for fun.\nWoman: Do you go to watch sports events?\nBoy: Not really. Tickets for football matches are too expensive for me, so I watch them on TV.\nWoman: What do you plan to do after school?\nBoy: I want to study sports science at university and become a coach.\nWoman: Good luck. And what are you going to do now?\nBoy: I'm going to the park to meet my running club. We do a long run every Saturday.",
        "questions": [
            ("Why is the woman talking to Tom?", ["She wants him to join a running club.", "She is doing a survey about young people's sporting habits.", "She is his coach.", "She is selling tickets for a football match.", "She is writing about the marathon."], "B"),
            ("What is the student's name?", ["Tom WESTERN", "Tom WESSON", "Tom WHESTON", "Tom WESTON", "Tom WESTOWN"], "D"),
            ("When Tom started running, he trained ___.", ["five times a week", "every day", "once a week", "twice a week", "at weekends only"], "C"),
            ("Why doesn't Tom go to football matches?", ["He doesn't like football.", "The tickets cost too much.", "He has no time.", "His dad doesn't let him.", "He prefers table tennis."], "B"),
            ("What is Tom going to do after the interview?", ["Go to the sports centre.", "Go swimming.", "Play table tennis with his dad.", "Watch football on TV.", "Meet his running club in the park."], "E"),
            ("Tom does all of the following activities EXCEPT ___.", ["playing football in a team", "running", "swimming", "playing table tennis", "training for a marathon"], "A"),
        ],
    },
})

# ---------------------------------------------------------------- Mock 4
MOCKS.append({
    "theme": "Technology, school and an exchange student",
    "grammar": [
        ("I saw ___ interesting film on TV last night. ___ film was about whales.", ["a / A", "an / The", "the / An", "an / A", "a / The"], "B"),
        ("My birthday is ___ 5th May, so we'll celebrate ___ the weekend.", ["in / at", "on / at", "at / in", "on / in", "in / on"], "B"),
        ("The bus was late, so we had to walk ___ to get to school on time.", ["fast", "fastly", "hardly", "slowly", "lately"], "A"),
        ("There ___ a lot of people at the bus stop, and it ___ colder every minute.", ["was / is getting", "were / was getting", "were / were getting", "was / were getting", "are / gets"], "B"),
        ("Scientists ___ a new species of frog in the Amazon recently.", ["discover", "are discover", "have discovered", "had discovering", "discovering"], "C"),
        ("While I ___ my homework, my brother ___ computer games.", ["did / was playing", "have done / played", "was doing / has played", "was doing / was playing", "am doing / played"], "D"),
        ("I'm late again, ___?", ["am I", "aren't I", "isn't it", "don't I", "amn't I"], "B"),
        ("Tomorrow at noon I ___ an exam, so I can't meet you then.", ["will be writing", "would write", "will have been written", "would be writing", "am write"], "A"),
        ("If Bataa ___ more money, he ___ a new laptop.", ["has / would buy", "had / will buy", "had / would buy", "would have / bought", "had had / will buy"], "C"),
        ("Student: Who ___ 'Romeo and Juliet' written by?\nTeacher: William Shakespeare ___ it more than 400 years ago.", ["is / wrote", "did / was written", "was / has written", "has / written", "was / wrote"], "E"),
        ("He drives a ___ car.", ["big, beautiful, black, new", "new, big, beautiful, black", "beautiful, big, new, black", "black, new, big, beautiful", "beautiful, black, big, new"], "C"),
        ("It was raining, ___ we took an umbrella.", ["because", "so", "although", "because of", "unless"], "B"),
    ],
    "vocab1": [
        ("Enkhjin is never on time and often forgets her promises. She is very ___.", ["punctual", "unreliable", "patient", "polite", "talented"], "B"),
        ("Smartphones have become an ___ part of our daily lives.", ["essential", "extinct", "exhausted", "elderly", "empty"], "A"),
        ("It is ___ to talk loudly on your phone in the cinema.", ["illegible", "illiterate", "impolite", "immortal", "invisible"], "C"),
        ("Writing a diary can help you deal with ___ problems such as stress and sadness.", ["physical", "emotional", "technical", "financial", "political"], "B"),
        ("The teacher made a ___ of the students' best drawings and put them on the wall.", ["display", "delay", "decay", "disease", "desire"], "A"),
        ("I don't know this word. I'll look it ___ in the dictionary.", ["for", "at", "up", "after", "into"], "C"),
        ("Turn ___ your phones, please. The exam is starting.", ["off", "up", "on", "into", "out"], "A"),
        ("I'd like a ___ of pizza and a ___ of orange juice, please.", ["loaf / bar", "jar / slice", "slice / glass", "crumb / tin", "bar / loaf"], "C"),
        ("The internet has made it easy to ___ information with people all over the world.", ["shake", "shape", "shout", "share", "shine"], "D"),
        ("You need a password to ___ your account.", ["accept", "access", "accuse", "achieve", "assist"], "B"),
    ],
    "vocab2": [
        ("Ann: You look really tired.\nBob: I am. I've been studying all night, and I'm completely ___.", ["excited", "exhausted", "amazed", "interested", "relaxed"], "B"),
        ("Student: I don't understand how to use this machine.\nTechnician: Just read the ___. They explain everything step by step.", ["instructions", "ingredients", "invitations", "inventions", "institutions"], "A"),
        ("Reporter: What happened here?\nWitness: The ground started shaking and buildings fell down. It was a terrible ___.", ["drought", "flood", "earthquake", "famine", "blizzard"], "C"),
    ],
    "vocab3": [
        ("________ --- mature", ["un", "dis", "im", "ir", "il"], "C"),
        ("________ --- responsible", ["un", "ir", "in", "dis", "im"], "B"),
    ],
    "conv1": {
        "text": "Saruul: Hi, Ben! Are you coming to the science fair on Saturday?\nBen: I'd love to, but I'm not sure. 28. _________\nSaruul: It starts at ten and finishes at four.\nBen: Oh, that's fine then. My football practice ends at eleven. Where is it?\nSaruul: In the main hall of our school. My team made a robot that can sort rubbish.\nBen: Cool! 29. _________\nSaruul: About three months. We worked on it every Friday after class.\nBen: I can't wait to see it.",
        "questions": [
            ("", ["What time is it on?", "Who is organizing it?", "Do you like science?", "Is it expensive?", "Where did you hear about it?"], "A"),
            ("", ["How much did it cost?", "Who designed it?", "How long did it take to build?", "When does it start?", "What does it look like?"], "C"),
            ("Where will the science fair take place?", ["In a football stadium.", "In the school's main hall.", "At Ben's house.", "In a science museum.", "In a park."], "B"),
        ],
    },
    "conv2": {
        "text": "Mom: Your exam results came in the post today.\nDulguun: Really? Quick, open it! ... Oh no, I failed maths again.\nMom: Don't worry, you can take it again in August.\nDulguun: But I studied so hard this time. I feel terrible. Everyone else in my class passed.\nMom: Listen, I'll find you a tutor, and we'll work on it together over the summer. You'll do it, I'm sure.",
        "questions": [
            ("Dulguun feels ___ after reading the results.", ["relieved", "thrilled", "miserable", "proud", "calm"], "C"),
            ("Mom is ___ about Dulguun's future.", ["hopeful", "angry", "ashamed", "bored", "hopeless"], "A"),
        ],
    },
    "read1": {
        "text": "Paper is so common today that we rarely think about it. Yet for most of human history, people wrote on much more difficult materials. The ancient Egyptians used papyrus, made from a plant that grew along the Nile River. In other places, people wrote on animal skins, wood, bamboo or even clay tablets.\n\nAccording to tradition, paper as we know it was invented in China around the year 105 by a court official named Cai Lun. He mixed tree bark, old fishing nets and pieces of cloth with water, pressed the mixture flat and let **it** dry in the sun. The result was light, cheap and easy to write on.\n\nThe Chinese kept the method secret for hundreds of years. It finally reached the Arab world in the eighth century and Europe several centuries later. When the printing press was invented in the fifteenth century, the demand for paper grew <u>enormously</u>, and books became available to ordinary people for the first time.",
        "questions": [
            ("What is the passage mainly about?", ["It is about the life of Cai Lun.", "It is about the history of paper.", "It is about ancient Egypt.", "It is about how books are printed today.", "It is about the Nile River."], "B"),
            ("Cai Lun's paper was useful because ___", ["it was made from papyrus.", "it was heavy and strong.", "it was light, cheap and easy to write on.", "it was sold in Europe.", "it was kept secret."], "C"),
            ("The pronoun \"it\" in bold in paragraph 2 refers to ___.", ["the Nile", "the mixture", "tree bark", "water", "the sun"], "B"),
            ("The word \"enormously\" in paragraph 3 is closest in meaning to ___.", ["slightly", "slowly", "suddenly", "hugely", "secretly"], "D"),
        ],
    },
    "read2": {
        "text": "Dear Ms. Smith,\n\nI hope you are well. I am writing to tell you about my first month as an exchange student in Canada.\n\nThe school here is very different from my school in Mongolia. Classes are smaller, and students 37. _________ to choose many of their own subjects. I am taking biology, computer science and drama. Drama is my favourite, although I was very shy at first.\n\nI live with a host family who are very kind. They have two children and a big dog called Max. Every weekend we go somewhere new. 38. _________ Saturday we went to a lake and went canoeing, and next weekend we are going to watch an ice hockey game.\n\nThe only problem is the weather. It is already very cold, and my host mother says it will get much worse. I am glad I brought my warm Mongolian deel! I 39. _________ it almost every day these days.\n\nThank you again for helping me with my application.\n\nBest regards,\nNomin",
        "questions": [
            ("", ["are allowed", "allow", "allowing", "is allowed", "have allowed"], "A"),
            ("", ["Next", "Last", "On next", "This coming", "Tomorrow"], "B"),
            ("", ["wears", "wore", "wear", "had worn", "will wore"], "C"),
            ("Nomin's letter is mainly about ___.", ["her life as an exchange student in Canada", "the problems with her host family", "why she does not like drama", "the history of ice hockey", "how to apply for an exchange programme"], "A"),
        ],
    },
    "part2": {
        "2.1": {"items": ["Why ___ you finished your project yet?", "Who ___ you meet at the party last Saturday?", "How old ___ your grandmother? She looks very young.", "What time ___ the meeting start tomorrow?", "Where ___ your keys? I can't find them."],
                "choices": ["is", "haven't", "will", "did", "are", "was", "has"], "answer": "24135"},
        "2.2": {"items": ["How ___ brothers and sisters do you have?", "There are only a ___ biscuits left. Let's buy some more.", "I haven't got ___ money with me.", "She has a ___ of friends at university.", "There is a ___ milk left, enough for one cup."],
                "choices": ["many", "lot", "few", "little", "any", "some", "every"], "answer": "13524"},
        "2.3": {"items": ["If you heat ice, …", "I'm saving money …", "The girl who won the competition …", "He has been working here …", "It was such a hot day …"],
                "choices": ["… that we went swimming in the river.", "… is in my class.", "… it melts.", "… for more than ten years.", "… so that I can buy a new bike.", "… since ten years.", "… it would have melted."], "answer": "35241"},
        "2.4": {"instructions": "Match the words (a-e) with their meanings (1-7).",
                "items": ["A website …", "A password …", "A printer …", "A keyboard …", "A battery …"],
                "choices": ["… stores electricity and gives power to a device.", "… is a secret word that lets you open an account.", "… is a group of pages on the internet about a subject or company.", "… puts text and pictures from a computer onto paper.", "… has keys that you press to type letters and numbers.", "… shows pictures and videos on a computer.", "… takes photographs."], "answer": "32451"},
    },
    "listening": {
        "instructions": "You are going to listen to a woman asking a student about the city library. Read each question and choose the correct answer.",
        "script": "Librarian: Excuse me, do you have a minute? We're collecting opinions about the city library to help us improve it.\nStudent: Sure.\nLibrarian: Thanks. Could I have your name?\nStudent: Yes, it's Sam Fairley. F-A-I-R-L-E-Y.\nLibrarian: How often do you come to the library, Sam?\nStudent: About three times a week now, because I'm preparing for my university entrance exam. Before that I only came once a month.\nLibrarian: What do you usually use the library for?\nStudent: Mostly for studying, because it's quiet here. My house is noisy because I have three younger brothers.\nLibrarian: Is there anything you would like us to change?\nStudent: Yes. Please stay open later. You close at six, and I'd like to study until nine.\nLibrarian: That's useful, thank you. What do you do when you're not studying?\nStudent: I play the guitar, and I go cycling with friends. I used to play computer games a lot, but I stopped this year.\nLibrarian: And what are you studying today?\nStudent: Chemistry. I've got a test tomorrow morning, so I'm going to stay here until you close.",
        "questions": [
            ("Why is the woman talking to Sam?", ["She wants to sell him some books.", "She is collecting opinions to improve the library.", "She is his chemistry teacher.", "She is checking his library card.", "She is asking about his exam results."], "B"),
            ("What is the student's name?", ["Sam FAIRLY", "Sam FARELY", "Sam FAIRLEY", "Sam FAIRLIE", "Sam FERLEY"], "C"),
            ("Before preparing for the exam, Sam came to the library ___.", ["three times a week", "every day", "once a week", "once a month", "twice a month"], "D"),
            ("Why does Sam study at the library?", ["He has no books at home.", "His friends study there.", "The library is open late.", "He likes the librarian.", "His home is noisy."], "E"),
            ("What is Sam going to do after the interview?", ["Study chemistry at the library until it closes.", "Go cycling with friends.", "Play the guitar.", "Take his chemistry test.", "Go home to his brothers."], "A"),
            ("These days Sam does all of the following EXCEPT ___.", ["playing the guitar", "cycling", "playing computer games", "studying at the library", "preparing for an exam"], "C"),
        ],
    },
})

# ---------------------------------------------------------------- Mock 5
MOCKS.append({
    "theme": "Health, food and family",
    "grammar": [
        ("There's ___ old castle on ___ hill above the town.", ["a / the", "the / an", "an / the", "an / ___", "___ / a"], "C"),
        ("My grandparents live ___ a small village ___ the north of Mongolia.", ["at / on", "on / at", "in / on", "at / in", "in / in"], "E"),
        ("Please speak more ___. The baby is sleeping.", ["quiet", "quite", "loudly", "quietly", "loud"], "D"),
        ("There ___ no buses after midnight, so it ___ difficult to get home.", ["is / are", "is / is", "are / are", "are / is", "be / is"], "D"),
        ("I ___ three cups of coffee today, and it's only 10 a.m.!", ["drink", "drinking", "had drunk", "have drunk", "am drink"], "D"),
        ("The children ___ in the garden when it ___ to rain.", ["played / was starting", "have played / started", "were playing / started", "are playing / starts", "were playing / has started"], "C"),
        ("She can swim, ___?", ["can't she", "can she", "doesn't she", "isn't she", "couldn't she"], "A"),
        ("Don't phone me tomorrow between seven and nine. We ___ dinner with my parents' friends.", ["will have", "would have", "will be having", "would be having", "will have been had"], "C"),
        ("If we ___ a garden, we ___ our own vegetables.", ["have / would grow", "had / would grow", "had / will grow", "would have / grew", "have had / grow"], "B"),
        ("Customer: Where ___ these shoes made?\nAssistant: They ___ in Italy.", ["were / were made", "are / made", "did / made", "are / are making", "were / have made"], "A"),
        ("Our neighbours have a ___ cat.", ["little, lovely, white, Persian", "lovely, little, white, Persian", "white, little, lovely, Persian", "Persian, white, little, lovely", "lovely, Persian, little, white"], "B"),
        ("We couldn't go out ___ the heavy rain.", ["because", "because of", "although", "so", "despite"], "B"),
    ],
    "vocab1": [
        ("My uncle gets angry very quickly. He is quite ___.", ["calm", "bad-tempered", "cheerful", "shy", "patient"], "B"),
        ("Vitamins are ___ for healthy growth.", ["negative", "nervous", "necessary", "narrow", "noisy"], "C"),
        ("It is ___ to park here. You'll get a fine.", ["illegible", "illegal", "illiterate", "irregular", "impatient"], "B"),
        ("Walking 10,000 steps a day is good for your ___ health.", ["physical", "musical", "political", "historical", "mechanical"], "A"),
        ("The nurse gave me an ___ to protect me from the flu.", ["infection", "invention", "inspection", "injection", "intention"], "D"),
        ("I gave ___ sugar last month because I wanted to lose weight.", ["out", "up", "in", "away", "off"], "B"),
        ("My little sister takes ___ my mother. They have the same eyes and smile.", ["off", "on", "after", "up", "over"], "C"),
        ("We need a ___ of eggs and a ___ of bread.", ["bar / slice", "jar / crumb", "box / loaf", "carton / bar", "can / jar"], "C"),
        ("Eating too much fast food can lead to serious health ___.", ["programs", "products", "projects", "promises", "problems"], "E"),
        ("If you feel sick for more than three days, you should ___ a doctor.", ["see", "look", "watch", "meet", "find"], "A"),
    ],
    "vocab2": [
        ("Nurse: How are you feeling today?\nPatient: Much better, thanks. The pain has almost gone, and I feel so ___.", ["worse", "relieved", "terrified", "furious", "jealous"], "B"),
        ("Waiter: Are you ready to order?\nCustomer: Not yet. Could I see the ___, please?", ["menu", "bill", "receipt", "recipe", "prescription"], "A"),
        ("Reporter: Thousands of people have no food after three years without a good harvest.\nAid worker: Yes, and the ___ is getting worse every month.", ["flood", "famine", "blizzard", "earthquake", "hurricane"], "B"),
    ],
    "vocab3": [
        ("________ --- healthy", ["un", "in", "im", "dis", "ir"], "A"),
        ("________ --- logical", ["un", "dis", "il", "ir", "im"], "C"),
    ],
    "conv1": {
        "text": "Doctor: Good morning. What seems to be the problem?\nGerel: I've had a sore throat and a high temperature since Monday.\nDoctor: I see. 28. _________\nGerel: Yes, I took some paracetamol last night, but it didn't help much.\nDoctor: Let me have a look... Your throat is very red. I'll give you some antibiotics. Take one tablet three times a day after meals.\nGerel: Can I go to school tomorrow?\nDoctor: 29. _________ Stay at home and drink plenty of warm water.\nGerel: OK. Thank you, doctor.",
        "questions": [
            ("", ["Have you taken any medicine?", "How old are you?", "Do you like school?", "Where do you live?", "When is your birthday?"], "A"),
            ("", ["Of course, you're completely fine.", "I'd rather you didn't, for at least three days.", "School starts at eight.", "Yes, take the bus.", "I don't know your school."], "B"),
            ("Where is the conversation taking place?", ["At a pharmacy.", "At school.", "At a doctor's surgery.", "At Gerel's home.", "In a restaurant."], "C"),
        ],
    },
    "conv2": {
        "text": "Grandma: Look what I found in the cupboard: your father's first pair of shoes!\nSaran: They're so tiny! Did Dad really wear these?\nGrandma: He did. He took his first steps in them, right here in this kitchen. It feels like yesterday.\nSaran: Can I take a photo and send it to him?\nGrandma: Of course. He'll laugh. I'm going to keep them forever.",
        "questions": [
            ("Grandma feels ___ when she finds the shoes.", ["sentimental", "furious", "frightened", "bored", "disgusted"], "A"),
            ("Saran is ___ by how small the shoes are.", ["annoyed", "surprised", "ashamed", "depressed", "disappointed"], "B"),
        ],
    },
    "read1": {
        "text": "Most teenagers need between eight and ten hours of sleep every night, but research shows that many get far less. There are several reasons for this. Homework and after-school activities take up a lot of time, and many young people use their phones in bed late at night.\n\nScientists have also discovered that teenagers' body clocks are different from those of children and adults. During the teenage years, the body starts producing the sleep hormone melatonin later in the evening. As a result, teenagers often do not feel tired until eleven o'clock or later, but **they** still have to get up early for school.\n\nLack of sleep can cause serious problems. Tired students find it harder to concentrate and remember information, and they are more likely to feel stressed or have accidents. For this reason, some schools in the United States have started classes later in the morning. The results have been <u>encouraging</u>: students' grades and attendance have improved.",
        "questions": [
            ("What is the passage mainly about?", ["It is about why teenagers often lack sleep and what effects this has.", "It is about how phones damage teenagers' eyes.", "It is about schools in the United States.", "It is about how adults sleep.", "It is about after-school activities."], "A"),
            ("Teenagers often don't feel tired until late because ___", ["they drink too much coffee.", "their bodies produce melatonin later.", "they start school late.", "they sleep in the afternoon.", "they have no homework."], "B"),
            ("The pronoun \"they\" in bold in paragraph 2 refers to ___.", ["scientists", "adults", "teenagers", "children", "schools"], "C"),
            ("The word \"encouraging\" in paragraph 3 is closest in meaning to ___.", ["disappointing", "positive", "surprising", "confusing", "worrying"], "B"),
        ],
    },
    "read2": {
        "text": "Hi Jessica,\n\nHow are you? I'm sorry I missed your call yesterday. I 37. _________ dinner with my family at my aunt's house, and my phone was in my bag.\n\nGuess what? I've decided to become a vegetarian! I watched a documentary about farming last month, and since then I 38. _________ any meat. It's not as difficult as I expected. My mum cooks delicious vegetable soup, and I've learned to make a great bean curry.\n\nMy little brother says I'm crazy. He can't imagine a day without buuz! But my dad has started eating less meat too, because his doctor told him to.\n\nAre you still coming to visit in June? 39. _________ you come, I'll cook you my bean curry!\n\nLove,\nOyunaa",
        "questions": [
            ("", ["have", "was having", "am having", "have had", "had been"], "B"),
            ("", ["didn't eat", "don't eat", "haven't eaten", "hadn't eaten", "won't eat"], "C"),
            ("", ["Unless", "If", "Although", "Because of", "Until"], "B"),
            ("The main news in Oyunaa's email is that ___.", ["she has stopped eating meat", "her brother is ill", "her dad is a doctor", "she missed her aunt's dinner", "she is visiting Jessica in June"], "A"),
        ],
    },
    "part2": {
        "2.1": {"items": ["Where ___ your father work?", "Why ___ you at the meeting yesterday?", "How long ___ he been a teacher?", "Which bus ___ you take to school every day?", "What ___ you do if you saw a bear in the forest?"],
                "choices": ["does", "weren't", "are", "is", "would", "has", "do"], "answer": "12675"},
        "2.2": {"items": ["Could you ___ me a favour?", "I need to ___ a phone call to my mother.", "Can you ___ me some advice about which phone to buy?", "Please ___ attention to the teacher.", "Try to ___ calm during the exam."],
                "choices": ["make", "do", "take", "have", "give", "keep", "pay"], "answer": "21576"},
        "2.3": {"items": ["You should drink more water …", "I didn't eat breakfast this morning, …", "The restaurant where we had lunch …", "Although she was ill, …", "I had never tried sushi …"],
                "choices": ["… she went to work.", "… until I went to Japan.", "… is owned by my uncle.", "… if you want to have healthy skin.", "… so I'm really hungry now.", "… because she was ill.", "… unless you are thirsty."], "answer": "45312"},
        "2.4": {"instructions": "Match the family words (a-e) with their meanings (1-7).",
                "items": ["Your niece …", "Your grandparents …", "Your cousin …", "Your stepfather …", "Your mother-in-law …"],
                "choices": ["… is the mother of your husband or wife.", "… is the daughter of your brother or sister.", "… are the parents of your mother or father.", "… is the child of your aunt or uncle.", "… is the man who is married to your mother but is not your father.", "… is the son of your brother or sister.", "… is the sister of your mother or father."], "answer": "23451"},
    },
    "listening": {
        "instructions": "You are going to listen to a woman interviewing a student about eating habits. Read each question and choose the correct answer.",
        "script": "Woman: Hello. I'm from the health centre, and we're doing a survey about students' eating habits. Can I ask you some questions?\nBoy: Sure.\nWoman: What's your name?\nBoy: David Harper. That's H-A-R-P-E-R.\nWoman: Thank you, David. Do you usually eat breakfast?\nBoy: Not really. I used to have breakfast every day, but now I get up late, so I usually just have a glass of milk.\nWoman: And what about lunch?\nBoy: I eat in the school canteen. The food is OK, but I'd like more salads.\nWoman: How often do you eat fast food?\nBoy: About twice a month, usually after football matches with my team. Last year it was every weekend, but my coach told us it's bad for our fitness.\nWoman: Do you cook?\nBoy: Yes, I cook dinner for my family on Fridays. My speciality is fried rice!\nWoman: That's great. One last question: what are you doing after this?\nBoy: I'm going to the supermarket. I need to buy vegetables for tonight's dinner.",
        "questions": [
            ("Why is the woman asking David questions?", ["She is a chef.", "She is his football coach.", "She works in the school canteen.", "She is doing a survey about students' eating habits.", "She wants to buy vegetables."], "D"),
            ("What is the student's name?", ["David HARPER", "David HARPAR", "David HARBER", "David HARPPER", "David HARPUR"], "A"),
            ("Last year David ate fast food ___.", ["twice a month", "every weekend", "every day", "once a month", "never"], "B"),
            ("Why does David eat less fast food now?", ["It is too expensive.", "His mother cooks for him.", "His coach said it was bad for fitness.", "He doesn't like it any more.", "The school canteen stopped selling it."], "C"),
            ("What is David going to do after the interview?", ["Play football.", "Cook fried rice.", "Go to the school canteen.", "Go home and sleep.", "Go to the supermarket."], "E"),
            ("David does all of the following EXCEPT ___.", ["cooking dinner on Fridays", "playing football", "eating breakfast every day", "eating lunch in the canteen", "drinking milk in the morning"], "C"),
        ],
    },
})
