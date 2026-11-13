# 2025 blueprint (Элсэлтийн шалгалт Variant B): Part I 47 items = 80 points (45 five-option, 2 four-option); Part II = 20 points.
# Grammar 9x1, 4x2, 3x3 error words | Vocabulary 9x1, 5x2 story with a five-verb bank (all used), 3x3 phrasal meaning/particles
# Communication 3x2 who/where inferences, 2x3 meaning | Reading untitled passage 6x1, 2x3 phrases from a four-item bank
# (A-D, two extra), 1x2 statement inference
# Part II: 2.1 word forms (6 gaps) | 2.2 four synonyms (bold) + four antonyms (underlined) | 2.3 six-word box cloze (all used)
MOCKS = []

# ---------------------------------------------------------------- Mock 1
MOCKS.append({
    "theme": "Lost hikers, a market carpet and floods",
    "g1": [
        ("Several ___ were caught in the trap.", ["mice", "mouses", "mouse", "mices", "mouse's"], "A"),
        ("There are only ___ people in the queue, so we won't wait long.", ["a few", "a little", "much", "little", "a lot"], "A"),
        ("You ___ tell anyone about the surprise. It's a secret!", ["mustn't", "don't have to", "needn't", "ought", "can"], "A"),
        ("That is the woman ___ helped me yesterday.", ["who", "which", "whose", "whom", "where"], "A"),
        ("I'm thinking of ___ a new car.", ["buying", "buy", "to buy", "bought", "being bought"], "A"),
        ("My brother is now as ___ as my father.", ["tall", "taller", "tallest", "the tallest", "more tall"], "A"),
        ("She insisted ___ paying for dinner.", ["on", "in", "at", "for", "of"], "A"),
        ("Mathematics ___ my favourite subject.", ["is", "are", "were", "have been", "be"], "A"),
        ("The more you exercise, ___ you will feel.", ["the better", "better", "best", "the best", "more good"], "A"),
    ],
    "g2": [
        ("If you ___ me earlier, I ___ you.", ["had told / would have helped", "told / will help", "have told / would help", "tell / would have helped", "had told / will help"], "A"),
        ("We stayed indoors ___ it was snowing heavily.", ["because", "because of", "despite", "in spite of", "however"], "A"),
        ("None of the windows ___ since last summer.", ["have been cleaned", "has cleaned", "have cleaned", "has been cleaning", "cleaned"], "A"),
        ("Saraa said, \"I'm leaving tomorrow.\"", ["Saraa said she was leaving the next day.", "Saraa said she was leaving the tomorrow day.", "Saraa said I was leaving the next day.", "Saraa said she is leaving the next day.", "Saraa said she leaves the day before."], "A"),
    ],
    "errors": [
        ("A [A spider] has eight legs, [B whereas] an insect [C have] [D only] [E six].", ["spider", "whereas", "have", "only", "six"], "C"),
        ("The thief [A was seen] [B climbing] through the window [C before] he [D run] [E away].", ["was seen", "climbing", "before", "run", "away"], "D"),
        ("Each of the [A players] [B have] [C their] own [D locker] [E in the changing room].", ["players", "have", "their", "locker", "in the changing room"], "B"),
    ],
    "v1": [
        ("Which item is usually made of leather?", ["a belt", "a T-shirt", "a towel", "a sock", "a pillow"], "A"),
        ("A young dog is called a ___.", ["puppy", "kitten", "calf", "foal", "cub"], "A"),
        ("A room at the top of a house, just under the roof.", ["attic", "basement", "hall", "garage", "porch"], "A"),
        ("Name the means of transport which runs on rails under the city.", ["metro", "ferry", "tram", "helicopter", "coach"], "A"),
        ("A person who breaks into houses to steal things is a ___.", ["burglar", "shoplifter", "pickpocket", "kidnapper", "smuggler"], "A"),
        ("Could you ___ me a favour and post this letter?", ["do", "make", "give", "take", "have"], "A"),
        ("It was freezing, and everything was white and covered in ice in the morning.", ["There was a heavy frost.", "It was very humid.", "There was a heatwave.", "It was quite foggy.", "There was a light breeze."], "A"),
        ("This sofa is big and soft. It's really ___.", ["comfortable", "crowded", "convenient", "efficient", "stressful"], "A"),
        ("Forty-love.", ["the score in a tennis match", "a temperature", "a telephone number", "a person's age", "a year"], "A"),
    ],
    "story": {
        "bank": ["rescued", "set", "lost", "warned", "found"],
        "text": "Two hikers (26) _____________ off early to climb the mountain, although the forecast had (27) _____________ of storms. By midday they had (28) _____________ their way in thick fog. Luckily, one of them (29) _____________ a signal on his phone and called for help. A team of volunteers (30) _____________ them just before dark.",
        "answers": ["B", "D", "C", "E", "A"],
    },
    "v3": [
        ("In which of the following sentences does \"to take off\" mean \"to remove a piece of clothing\"?", ["The plane took off on time.", "Please take off your shoes before you come in.", "Her business really took off last year.", "He took off our teacher's voice perfectly, and everyone laughed.", "I'm taking a day off tomorrow."], "B"),
        ("Choose the particle that best fits in the gap.\nThe police are looking ___ the robbery at the bank.", ["into", "after", "up", "out", "on"], "A"),
        ("I need to ___ up on my French before the trip to Paris.", ["brush", "clean", "wash", "wipe", "sweep"], "A"),
    ],
    "c1": [
        ("Woman: I'd like to send this parcel to Germany.\nMan: Put it on the scales, please. Would you like it to go by airmail?\nQuestion: Where does this conversation take place?", ["At a post office", "At a bank", "At a hospital", "At a library", "At a restaurant"], "A"),
        ("Man: Open wide, please. Does this tooth hurt?\nWoman: Yes, especially when I drink something cold.\nQuestion: What is the man's job?", ["He's a dentist.", "He's a waiter.", "He's a mechanic.", "He's a pilot.", "He's a teacher."], "A"),
        ("Woman: Could you tell me which platform the train to Darkhan leaves from?\nMan: Platform three, but it's running twenty minutes late.\nQuestion: Where are they?", ["At a railway station", "At an airport", "At a bus stop", "At a museum", "At a hotel"], "A"),
    ],
    "c2": [
        ("Woman: Do you want me to book the restaurant for Friday?\nMan: Don't bother. I've already taken care of it.\nQuestion: What does the man mean?", ["He has already booked the restaurant.", "He doesn't want to go to the restaurant.", "He wants the woman to book it.", "He forgot to book it.", "He will book it later."], "A"),
        ("Man: I can't believe you finished the whole report in one night.\nWoman: Neither can I. I'm exhausted.\nQuestion: What does the woman mean?", ["She is also surprised that she finished it.", "She didn't finish the report.", "She doesn't believe the man.", "She slept well.", "She wants to write another report."], "A"),
    ],
    "reading": {
        "text": "Every year, many hikers get lost in forests and mountains. Most of them are found safe, especially if they follow a few simple rules. Experts say that the most important thing to do before any trip is to tell someone where you are going and when you plan to return. You should also check the weather forecast, carry a map and a fully charged phone, and take more water and warm clothing than you think you will need.\n\nIf you realise that you are lost, the first rule is to stop. Walking further often makes the situation worse, because rescuers usually begin searching near the route you planned to take. Sit down, eat something and try to stay calm. Then think carefully about the last place you were sure of.\n\nIf night is coming, find shelter from wind and rain, and try to stay dry, because wet clothes lose heat quickly. Make yourself easy to see: wear bright clothing, spread colourful items on the ground and, if you have a whistle, blow it three times, which is a widely used signal for help. Use your phone sparingly to save the battery, but turn it on from time to time to check for a signal.\n\nFinally, never leave a safe place to look for help on your own in the dark. Rescuers say that people who stay where they are and make themselves visible are usually found much faster than those who keep moving.",
        "questions": [
            ("What is the main topic of the passage?", ["How to stay safe if you get lost while hiking", "The history of mountain rescue", "How to read a map", "Weather forecasts in the mountains", "Why people enjoy hiking"], "A"),
            ("Before a trip, experts say the most important thing is to", ["tell someone your route and when you will return", "buy a new phone", "walk as fast as possible", "leave your map at home", "hike alone at night"], "A"),
            ("According to the passage, if you realise you are lost, you should first", ["stop", "run to the nearest road", "climb higher", "call all your friends", "light a fire"], "A"),
            ("Why should lost hikers stay near their planned route?", ["Rescuers usually start searching there.", "It is always warmer there.", "There is always a phone signal there.", "Maps show only that route.", "It is the shortest way home."], "A"),
            ("It can be inferred from the passage that lost hikers are more likely to be found quickly if they", ["stay in one place and make themselves visible", "keep walking all night", "turn off their phones for good", "wear dark clothes", "hide in a cave far from the route"], "A"),
            ("The word \"sparingly\" in paragraph 3 is closest in meaning to", ["in small amounts", "all the time", "loudly", "quickly", "never"], "A"),
        ],
    },
    "gapped": {
        "bank": ["they drink less water than other people", "so that the inside stays cool during the day", "because they never go outside", "which lets air move around the body and protects the skin from the sun"],
        "text": "People who live in hot deserts have developed many ways to cope with the heat. Traditional desert clothing is often loose and long, 45. _____________. Houses are built with thick walls and small windows 46. _____________.",
        "answers": ["D", "B"],
    },
    "statement": {
        "text": "The city zoo trains volunteers to give short talks to visitors about how wild animals are protected in nature.",
        "item": ("Choose the best answer. Where would these volunteers most likely be found?", ["Next to the animal enclosures", "In the zoo's car park", "In the ticket office only", "In the zoo's kitchen", "In a hospital"], "A"),
    },
    "part2": {
        "2.1": {"text": "The ger, a round tent covered with felt, has (a) _________ Mongolian herders for centuries. It can be taken down in about an hour and carried by a few animals, which makes it ideal for a (b) _________ way of life. Inside, the space is (c) _________ organised: the door usually faces south, and each part of the ger has its own purpose. The thick felt keeps the ger (d) _________ warm in winter, while in summer the lower edges can be rolled up to let air (e) _________. Even today, many families in the countryside find the ger more (f) _________ than a modern house.",
                "gaps": [(["house", "housed", "housing", "houses", "household"], 2),
                         (["mobility", "move", "mobilize", "mobile", "movement"], 4),
                         (["care", "careful", "carefully", "carefulness", "careless"], 3),
                         (["comfortably", "comfort", "comfortable", "comforting", "discomfort"], 1),
                         (["circle", "circular", "circulation", "circulated", "circulate"], 5),
                         (["practice", "practical", "practically", "practise", "practicality"], 2)]},
        "2.2": {"synonyms": [
                    ("The museum has a **vast** collection of paintings.", ["small", "old", "huge", "famous", "expensive"], 3),
                    ("He **seldom** eats meat.", ["often", "always", "never", "rarely", "usually"], 4),
                    ("We need to **purchase** new equipment for the lab.", ["sell", "buy", "borrow", "repair", "lend"], 2),
                    ("Please **remain** in your seats until the plane stops.", ["stay", "leave", "stand", "return", "move"], 1)],
                "antonyms": [
                    ("The soup was rather <u>bland</u>.", ["tasteless", "cold", "cheap", "spicy", "thin"], 4),
                    ("Our new teacher is very <u>strict</u>.", ["severe", "tall", "young", "quiet", "lenient"], 5),
                    ("This bridge is only <u>temporary</u>.", ["short-term", "broken", "permanent", "new", "narrow"], 3),
                    ("The team <u>accepted</u> the offer.", ["agreed to", "rejected", "took", "received", "welcomed"], 2)]},
        "2.3": {"box": ["damage", "flooded", "burst", "evacuated", "shelters", "volunteers"],
                "text": "Floods\nHeavy rain fell for three days, and the river (a) _________ its banks. Hundreds of homes were (b) _________, and families were (c) _________ to schools that had been turned into temporary (d) _________. (e) _________ from the Red Cross brought blankets and hot food. Officials say it will take months to repair the (f) _________.",
                "answer": "324561"},
    },
})

# ---------------------------------------------------------------- Mock 2
MOCKS.append({
    "theme": "The Northern Lights, skiing and a snowstorm",
    "g1": [
        ("The ___ are on the top shelf in the kitchen.", ["knives", "knifes", "knife", "knive", "knifes'"], "A"),
        ("I have ___ money, so I can't buy a ticket.", ["little", "a little", "few", "a few", "many"], "A"),
        ("You ___ to wear a uniform at our school. You can wear what you like.", ["don't have", "mustn't", "shouldn't", "can't", "needn't"], "A"),
        ("Is this the bag ___ you lost?", ["which", "who", "whose", "where", "whom"], "A"),
        ("He's very good at ___ jokes.", ["telling", "tell", "to tell", "told", "tells"], "A"),
        ("This winter is not as ___ as last winter.", ["cold", "colder", "coldest", "the coldest", "more cold"], "A"),
        ("He was accused ___ cheating in the exam.", ["of", "for", "with", "about", "by"], "A"),
        ("The police ___ looking for the missing boy.", ["are", "is", "was", "has", "be"], "A"),
        ("The sooner you start, ___ you'll finish.", ["the earlier", "earlier", "the earliest", "earliest", "more early"], "A"),
    ],
    "g2": [
        ("If it ___ so cold, we ___ skiing yesterday.", ["hadn't been / would have gone", "wasn't / would go", "isn't / will go", "hadn't been / will have gone", "wouldn't be / had gone"], "A"),
        ("The match was cancelled ___ the heavy snow.", ["because of", "because", "although", "even though", "however"], "A"),
        ("The results of the competition ___ yet.", ["haven't been announced", "hasn't announced", "haven't announced", "didn't announced", "hasn't been announcing"], "A"),
        ("Bat said, \"I can ski very well.\"", ["Bat said he could ski very well.", "Bat said he can skied very well.", "Bat said I could ski very well.", "Bat said he could skiing very well.", "Bat said he can't ski very well."], "A"),
    ],
    "errors": [
        ("The Northern Lights [A appears] [B when] particles from the Sun [C hit] the Earth's [D atmosphere] [E at high speed].", ["appears", "when", "hit", "atmosphere", "at high speed"], "A"),
        ("She [A has] [B lived] in this town [C since] she [D has been] [E a child].", ["has", "lived", "since", "has been", "a child"], "D"),
        ("We bought [A two] [B kilos] of apples and a [C loaf] of [D breads] [E at the market].", ["two", "kilos", "loaf", "breads", "at the market"], "D"),
    ],
    "v1": [
        ("Which item is made of glass?", ["a window", "a scarf", "a pillow", "a cushion", "a wallet"], "A"),
        ("A young cat is called a ___.", ["kitten", "puppy", "cub", "lamb", "calf"], "A"),
        ("A small building in the garden where you keep tools.", ["shed", "attic", "basement", "balcony", "lobby"], "A"),
        ("Name the means of transport which carries skiers up a mountain on a cable.", ["ski lift", "submarine", "ferry", "lorry", "motorbike"], "A"),
        ("A person who takes someone away and demands money for his or her return is a ___.", ["kidnapper", "burglar", "pickpocket", "shoplifter", "vandal"], "A"),
        ("Can you ___ an eye on my bag while I buy a ticket?", ["keep", "look", "hold", "take", "put"], "A"),
        ("It was a warm, bright day without a single cloud.", ["It was sunny and clear.", "It was overcast.", "There was a snowstorm.", "It was foggy.", "It was drizzling."], "A"),
        ("There were too many people on the bus. It was really ___.", ["crowded", "convenient", "comfortable", "spacious", "empty"], "A"),
        ("Thirty-six point six.", ["a normal body temperature in degrees Celsius", "a year", "a football score", "a telephone number", "a time of day"], "A"),
    ],
    "story": {
        "bank": ["bargained", "paid", "counted", "offered", "agreed"],
        "text": "At the market, Anu saw a beautiful carpet, but the price was too high. She (26) _____________ with the seller for almost half an hour. Finally, he (27) _____________ her a lower price, and she (28) _____________ to buy it. She (29) _____________ in cash, and the seller carefully (30) _____________ the money before he gave her the carpet.",
        "answers": ["A", "D", "E", "B", "C"],
    },
    "v3": [
        ("In which of the following sentences does \"to look up\" mean \"to search for information in a book or online\"?", ["Look up! There's a plane.", "Things are looking up since I found a job.", "I looked up the word in my dictionary.", "Look me up when you're in town.", "She looked up from her book and smiled."], "C"),
        ("Choose the particle that best fits in the gap.\nPlease hold ___; I'll put you through to the manager.", ["on", "up", "out", "in", "down"], "A"),
        ("Our car ___ down on the way to the mountains.", ["broke", "fell", "let", "cut", "turned"], "A"),
    ],
    "c1": [
        ("Man: Two tickets for the seven o'clock film, please.\nWoman: Would you like seats near the screen or at the back?\nQuestion: Where does this conversation take place?", ["At a cinema", "At a bank", "At a hospital", "At a school", "At a garage"], "A"),
        ("Woman: My car makes a strange noise when I brake.\nMan: Leave it here and I'll have a look at it this afternoon.\nQuestion: What is the man's job?", ["He's a mechanic.", "He's a doctor.", "He's a chef.", "He's a teacher.", "He's a librarian."], "A"),
        ("Man: I'd like to open a savings account.\nWoman: Certainly. Do you have your ID card with you?\nQuestion: Where is this conversation taking place?", ["At a bank", "At a supermarket", "At a museum", "In a library", "At a gym"], "A"),
    ],
    "c2": [
        ("Woman: Shall I call you a taxi?\nMan: Thanks, but I could do with some fresh air.\nQuestion: What does the man want to do?", ["Walk", "Take a taxi", "Stay inside", "Drive his own car", "Call a friend"], "A"),
        ("Man: Did you enjoy the ski trip?\nWoman: I'd have enjoyed it more if I hadn't spent most of it in bed with a cold.\nQuestion: What does the woman mean?", ["She was ill for much of the trip.", "She enjoyed every day.", "She didn't go on the trip.", "She skied every day.", "She stayed in bed because she was tired of skiing."], "A"),
    ],
    "reading": {
        "text": "The Northern Lights, also called the aurora borealis, are one of the most beautiful sights in nature. Waves of green, pink and purple light move slowly across the night sky, sometimes for hours. For centuries people told stories to explain them; today scientists know that they begin on the Sun.\n\nThe Sun constantly sends out a stream of tiny charged particles, known as the solar wind. Most of these particles never reach the ground, because the Earth's magnetic field pushes them away. Near the North and South Poles, however, the magnetic field guides some of them down into the upper atmosphere. There they hit gases such as oxygen and nitrogen, which then give off light.\n\nThe colour depends on the gas and the height. Oxygen produces the most common colour, green, while nitrogen can create blue and purple. A similar display near the South Pole is called the Southern Lights.\n\nThe best places to see the Northern Lights are countries close to the Arctic Circle, such as Norway, Finland, Iceland and Canada. Viewers need clear, dark skies, so the long nights between September and March are the best time. Lights from towns make the aurora harder to see, so it is better to travel away from them. During very strong activity on the Sun, the lights can occasionally be seen much farther south than usual.",
        "questions": [
            ("What is the main topic of the passage?", ["What causes the Northern Lights and where to see them", "The history of Norway", "Why the Sun is hot", "How to take photographs at night", "Old stories about the Arctic"], "A"),
            ("According to the passage, the Northern Lights begin", ["on the Sun", "in the ocean", "in big cities", "on the Moon", "inside volcanoes"], "A"),
            ("According to the passage, the most common colour of the Northern Lights is", ["green", "red", "blue", "purple", "yellow"], "A"),
            ("Which places are best for seeing the Northern Lights?", ["Places near the Arctic Circle with dark skies", "Big cities with bright lights", "Places near the equator", "Any place in summer", "Deserts in the afternoon"], "A"),
            ("It can be inferred from the passage that people are more likely to see the Northern Lights if they", ["go to a dark place far from towns on a clear winter night", "stay in a big city", "look at the sky on summer afternoons", "travel to the equator", "look at the sky on cloudy nights"], "A"),
            ("The word \"constantly\" in paragraph 2 is closest in meaning to", ["all the time", "rarely", "suddenly", "slowly", "never"], "A"),
        ],
    },
    "gapped": {
        "bank": ["in which an instructor teaches them how to stop and turn safely", "they always ski in summer", "because they want more speed and challenge", "so that the snow melts faster"],
        "text": "Skiing is one of the most popular winter sports in the world. Beginners are usually advised to take lessons, 45. _____________. Experienced skiers, on the other hand, often look for steep, empty slopes 46. _____________.",
        "answers": ["A", "C"],
    },
    "statement": {
        "text": "A hospital has started using small robots that deliver medicine and meals to patients' rooms.",
        "item": ("Choose the best answer. Who would most likely work alongside these robots?", ["Nurses", "Farmers", "Pilots", "Footballers", "Fishermen"], "A"),
    },
    "part2": {
        "2.1": {"text": "Snow is not just frozen water: each snowflake is a (a) _________ structure of ice crystals. Scientists say that no two snowflakes are (b) _________ the same, because each one forms in slightly different conditions as it falls. Snow is also (c) _________ good at keeping heat in. Animals dig holes in it to stay warm, and a thick layer protects plants from (d) _________ cold. However, heavy snow can be (e) _________ for travellers, and in mountain areas it can cause (f) _________ avalanches.",
                "gaps": [(["complexity", "complexion", "complex", "complexly", "complexes"], 3),
                         (["exact", "exactly", "exactness", "exacting", "inexact"], 2),
                         (["surprise", "surprising", "surprisingly", "surprised", "surprises"], 3),
                         (["extremely", "extremity", "extremes", "extreme", "extremist"], 4),
                         (["danger", "dangerously", "endanger", "endangered", "dangerous"], 5),
                         (["destructive", "destroy", "destruction", "destructively", "destroyer"], 1)]},
        "2.2": {"synonyms": [
                    ("The film was absolutely **hilarious**.", ["very sad", "boring", "very funny", "long", "scary"], 3),
                    ("She **instantly** recognised her old friend.", ["immediately", "slowly", "never", "later", "hardly"], 1),
                    ("The instructions were too **complicated**.", ["simple", "complex", "short", "printed", "useful"], 2),
                    ("He politely **declined** the invitation.", ["accepted", "sent", "wrote", "enjoyed", "refused"], 5)],
                "antonyms": [
                    ("My brother's room is always <u>tidy</u>.", ["neat", "large", "cold", "messy", "bright"], 4),
                    ("He is very <u>generous</u> with his money.", ["kind", "rich", "mean", "poor", "happy"], 3),
                    ("The shop <u>increased</u> its prices.", ["raised", "lowered", "doubled", "changed", "kept"], 2),
                    ("This medicine is completely <u>harmless</u>.", ["safe", "cheap", "bitter", "new", "dangerous"], 5)]},
        "2.3": {"box": ["stranded", "blizzard", "ploughs", "shovels", "supplies", "visibility"],
                "text": "Snowstorm\nA powerful (a) _________ hit the region last night, bringing strong winds and heavy snow. (b) _________ on the main road was so poor that drivers could not see more than a few metres ahead, and hundreds of cars were (c) _________ for hours. Snow (d) _________ worked all night to clear the roads, while residents used (e) _________ to dig paths to their doors. Helicopters dropped food and medical (f) _________ to villages that were cut off.",
                "answer": "261345"},
    },
})

# ---------------------------------------------------------------- Mock 3
MOCKS.append({
    "theme": "A stolen painting, a hospital and giant pandas",
    "g1": [
        ("In autumn, the ___ of the trees turn yellow and red.", ["leaves", "leafs", "leaf", "leave", "leafes"], "A"),
        ("Could I have ___ sugar in my coffee, please?", ["a little", "a few", "few", "many", "little"], "A"),
        ("We ___ hurry. The train doesn't leave for another hour.", ["needn't", "mustn't", "can't", "have to", "must"], "A"),
        ("The hospital ___ I was born has been rebuilt.", ["where", "which", "who", "whose", "whom"], "A"),
        ("She avoided ___ the journalist's question.", ["answering", "answer", "to answer", "answered", "to answering"], "A"),
        ("My room is twice as ___ as yours.", ["big", "bigger", "biggest", "the biggest", "more big"], "A"),
        ("This painting belongs ___ the National Museum.", ["to", "at", "for", "with", "from"], "A"),
        ("Everyone in my family ___ tea in the morning.", ["drinks", "drink", "drinking", "are drinking", "have drink"], "A"),
        ("The more you laugh, ___ you feel.", ["the happier", "happier", "the happiest", "happiest", "more happy"], "A"),
    ],
    "g2": [
        ("If the guard ___ asleep, the thieves ___ the painting.", ["hadn't fallen / wouldn't have stolen", "didn't fall / won't steal", "hasn't fallen / wouldn't steal", "hadn't fallen / won't have stolen", "wouldn't fall / hadn't stolen"], "A"),
        ("___ the alarm rang loudly, nobody heard it.", ["Although", "Despite", "Because of", "In spite of", "However"], "A"),
        ("The stolen painting ___ yet.", ["hasn't been found", "haven't found", "hasn't found", "didn't found", "haven't been finding"], "A"),
        ("The doctor said, \"You must rest for a week.\"", ["The doctor said I had to rest for a week.", "The doctor said I must to rest for a week.", "The doctor said you have to rested for a week.", "The doctor said I has to rest for a week.", "The doctor said me to rest for a week."], "A"),
    ],
    "errors": [
        ("Giant pandas [A spend] [B up to] fourteen hours a day [C eating] bamboo, [D who] is [E low] in nutrients.", ["spend", "up to", "eating", "who", "low"], "D"),
        ("The painting [A was stolen] [B during] the night [C and] has never [D be] [E found].", ["was stolen", "during", "and", "be", "found"], "D"),
        ("Nurses [A work] long hours and [B often] [C has] to work [D at] [E night].", ["work", "often", "has", "at", "night"], "C"),
    ],
    "v1": [
        ("Which item is usually made of cotton?", ["a T-shirt", "a ring", "a mirror", "a spoon", "a candle"], "A"),
        ("A young sheep is called a ___.", ["lamb", "calf", "foal", "cub", "kitten"], "A"),
        ("A room in a hospital where operations take place.", ["operating theatre", "waiting room", "ward", "canteen", "reception"], "A"),
        ("Name the vehicle which takes sick or injured people to hospital.", ["ambulance", "fire engine", "tractor", "tank", "coach"], "A"),
        ("A person who sees a crime happen is a ___.", ["witness", "judge", "lawyer", "suspect", "victim"], "A"),
        ("I'll ___ you a call tomorrow.", ["give", "make", "do", "take", "have"], "A"),
        ("It was raining heavily, with thunder and lightning.", ["There was a thunderstorm.", "It was foggy.", "It was sunny.", "There was a light drizzle.", "It was frosty."], "A"),
        ("The museum guard was very ___; he noticed every small movement.", ["alert", "sleepy", "careless", "lazy", "rude"], "A"),
        ("Quick, call one-oh-three! He's badly hurt.", ["the emergency number for an ambulance in Mongolia", "a year", "a football score", "a body temperature", "the time"], "A"),
    ],
    "story": {
        "bank": ["arrested", "broke", "noticed", "returned", "stole"],
        "text": "Late one night, two men (26) _____________ into the city museum and (27) _____________ a famous painting. The next morning, a cleaner (28) _____________ that the painting was missing and called the police. A week later, the police (29) _____________ the thieves at the airport, and the painting was (30) _____________ to the museum.",
        "answers": ["B", "E", "C", "A", "D"],
    },
    "v3": [
        ("In which of the following sentences does \"to pick up\" mean \"to learn something without studying it\"?", ["Can you pick me up at six?", "She picked up the pen from the floor.", "I picked up some Spanish while I was living in Madrid.", "Business is picking up again.", "He picked up the phone and answered."], "C"),
        ("Choose the particle that best fits in the gap.\nThe nurse told the patient to lie ___ on the bed.", ["down", "up", "off", "out", "in"], "A"),
        ("The thieves ___ away with the money before the police arrived.", ["got", "put", "took", "gave", "held"], "A"),
    ],
    "c1": [
        ("Woman: I've had a terrible headache for three days.\nMan: Let me take your temperature, and then I'll write you a prescription.\nQuestion: What is the man's job?", ["He's a doctor.", "He's a chef.", "He's a pilot.", "He's a lawyer.", "He's an actor."], "A"),
        ("Man: Excuse me, where can I find books about history?\nWoman: On the second floor. Please remember to return them within two weeks.\nQuestion: Where does this conversation take place?", ["In a library", "In a bookshop", "In a museum", "In a hospital", "In a bank"], "A"),
        ("Woman: Please don't touch the paintings, and no flash photography.\nMan: Sorry, I didn't know.\nQuestion: Where is this conversation taking place?", ["In an art gallery", "In a supermarket", "At a petrol station", "On a plane", "In a gym"], "A"),
    ],
    "c2": [
        ("Woman: Should I bring anything to the picnic?\nMan: Just yourself.\nQuestion: What does the man mean?", ["She doesn't need to bring anything.", "She should bring some food.", "She should come alone.", "She shouldn't come.", "She should bring a friend."], "A"),
        ("Man: I heard you got the job!\nWoman: Word travels fast, doesn't it?\nQuestion: What does the woman mean?", ["She is surprised that the news spread so quickly.", "She didn't get the job.", "She wants to travel.", "She hasn't heard the news.", "She is angry with the man."], "A"),
    ],
    "reading": {
        "text": "Giant pandas live in the cool, wet mountain forests of central China. Although they belong to the bear family and have the teeth and stomach of a meat-eater, almost all of their diet is bamboo. This creates a problem: bamboo contains very little energy, and a panda's body can digest only a small part of what it eats.\n\nTo survive, pandas must eat a lot. An adult can eat between about 12 and 38 kilograms of bamboo a day and may spend up to fourteen hours eating. To save energy, pandas move slowly and rest for much of the remaining time. A special bone in their wrist works like a thumb, helping them to hold bamboo stems while they eat.\n\nFor many years, giant pandas were in serious danger. Forests were cut down for farming and roads, and the remaining groups of pandas became separated from each other. In response, China created dozens of nature reserves and planted bamboo corridors to connect the forests.\n\nThese efforts have had results. A national survey in 2014 counted more than 1,800 pandas in the wild, and in 2016 the International Union for Conservation of Nature changed the panda's status from \"endangered\" to \"vulnerable\". Experts warn, however, that climate change may damage bamboo forests in the future, so protection must continue.",
        "questions": [
            ("What is the main topic of the passage?", ["How giant pandas survive and how they are being protected", "How to grow bamboo", "The history of Chinese zoos", "Why bears eat meat", "Climate change in China"], "A"),
            ("According to the passage, bamboo is a problem for pandas because", ["it contains very little energy", "it is hard to find", "it is poisonous", "it grows only in winter", "other animals eat it all"], "A"),
            ("According to the passage, pandas save energy by", ["moving slowly and resting a lot", "sleeping all winter", "eating meat", "swimming in rivers", "climbing trees all day"], "A"),
            ("What did China do to help pandas?", ["It created nature reserves and connected forests.", "It moved all pandas to zoos.", "It stopped growing bamboo.", "It built more roads.", "It sent all pandas abroad."], "A"),
            ("It can be inferred from the passage that the future of giant pandas", ["still depends on continued protection", "is completely safe", "has nothing to do with bamboo", "depends only on zoos", "is no longer important"], "A"),
            ("The word \"separated\" in paragraph 3 is closest in meaning to", ["divided", "joined", "protected", "increased", "fed"], "A"),
        ],
    },
    "gapped": {
        "bank": ["because hospitals close in the evening", "comfort patients and their families when they are worried", "doctors never work", "so that patients are cared for 24 hours a day"],
        "text": "Hospitals are busy places, and nurses are at the centre of patient care. They check patients' temperature and blood pressure, give medicine and 45. _____________. Many nurses also work at night 46. _____________.",
        "answers": ["B", "D"],
    },
    "statement": {
        "text": "A new app lets people report holes in the road and broken street lights by sending a photo and their location to the city council.",
        "item": ("Choose the best answer. Who would most likely use this app?", ["Residents who notice problems in their streets", "Farmers planting crops", "Pilots flying planes", "Fishermen at sea", "Students during an exam"], "A"),
    },
    "part2": {
        "2.1": {"text": "Art theft is a serious crime. Every year thousands of (a) _________ works of art are stolen around the world. Some thieves are hired by rich collectors, while others steal (b) _________ and then discover that famous paintings are almost impossible to sell. One of the most famous (c) _________ took place in 1911, when the Mona Lisa was stolen from the Louvre in Paris by a man who had worked there. The painting was (d) _________ missing for more than two years before it was (e) _________ in Italy. Today, museums use cameras, alarms and guards to make such thefts much less (f) _________.",
                "gaps": [(["value", "valuation", "valuably", "valuable", "values"], 4),
                         (["impulse", "impulsive", "impulsively", "impulsiveness", "impulses"], 3),
                         (["rob", "robberies", "robber", "robbery", "robbed"], 2),
                         (["mysteriously", "mystery", "mysterious", "mystify", "mystified"], 1),
                         (["recover", "recovery", "recovered", "recovering", "recoverable"], 3),
                         (["likelihood", "likeness", "liking", "likely", "unlikely"], 4)]},
        "2.2": {"synonyms": [
                    ("The patient made a **rapid** recovery.", ["slow", "painful", "quick", "partial", "costly"], 3),
                    ("The thief **fled** before the police arrived.", ["ran away", "arrived", "hid", "waited", "confessed"], 1),
                    ("The doctor gave him **sound** advice.", ["loud", "musical", "wrong", "good and sensible", "expensive"], 4),
                    ("The museum guards were **vigilant** all night.", ["sleepy", "watchful", "absent", "rude", "bored"], 2)],
                "antonyms": [
                    ("The patient's condition is <u>improving</u>.", ["getting better", "staying the same", "recovering", "getting worse", "changing"], 4),
                    ("The witness gave a <u>vague</u> description of the thief.", ["unclear", "short", "false", "long", "detailed"], 5),
                    ("Experts say the painting is <u>genuine</u>.", ["real", "fake", "old", "famous", "valuable"], 2),
                    ("Pandas are <u>shy</u> animals.", ["timid", "slow", "small", "bold", "quiet"], 4)]},
        "2.3": {"box": ["patients", "ward", "surgeon", "recovery", "injured", "injuries"],
                "text": "Accident\nAfter the bus accident, twenty (a) _________ passengers were taken to the city hospital. Most had only minor (b) _________, such as cuts and bruises, but three needed operations. The (c) _________ worked through the night. The next morning, all the (d) _________ were moved to a quiet (e) _________ on the third floor, and doctors expect them to make a full (f) _________.",
                "answer": "563124"},
    },
})

# ---------------------------------------------------------------- Mock 4
MOCKS.append({
    "theme": "Space tourism, a family bakery and the Silk Road",
    "g1": [
        ("The ___ were playing happily in the park.", ["children", "childs", "child", "childrens", "children's"], "A"),
        ("There were ___ people at the concert that we couldn't find seats.", ["so many", "so much", "such many", "such much", "too much"], "A"),
        ("Look at those dark clouds. It ___ rain later.", ["might", "must to", "should to", "can to", "ought"], "A"),
        ("The baker ___ bread I like most has closed his shop.", ["whose", "who", "which", "whom", "where"], "A"),
        ("She is used to ___ up early.", ["getting", "get", "got", "gets", "be getting"], "A"),
        ("This cake isn't as ___ as the one you made last week.", ["sweet", "sweeter", "sweetest", "the sweetest", "more sweet"], "A"),
        ("The Silk Road connected China ___ Europe.", ["with", "at", "on", "in", "from"], "A"),
        ("Ten kilometres ___ a long way to walk.", ["is", "are", "were", "have", "be"], "A"),
        ("The longer the journey, ___ the passengers become.", ["the more tired", "more tired", "the most tired", "most tired", "tired"], "A"),
    ],
    "g2": [
        ("If tickets ___ so expensive, more people ___ to space.", ["weren't / would travel", "aren't / would travel", "weren't / will travel", "hadn't been / will travel", "wouldn't be / travelled"], "A"),
        ("The bakery is always busy ___ its prices are high.", ["even though", "despite", "because of", "in spite of", "so"], "A"),
        ("These cakes ___ this morning; they're still warm.", ["were baked", "baked", "have baked", "are baking", "was baked"], "A"),
        ("The guide said, \"The Silk Road was more than 6,000 km long.\"", ["The guide said that the Silk Road had been more than 6,000 km long.", "The guide said that the Silk Road has been more than 6,000 km long.", "The guide said that the Silk Road is being more than 6,000 km long.", "The guide said me that the Silk Road was more than 6,000 km long.", "The guide said that the Silk Road will be more than 6,000 km long."], "A"),
    ],
    "errors": [
        ("The Silk Road [A was] not a [B single] road [C but] a network of [D route] [E across] Asia.", ["was", "single", "but", "route", "across"], "D"),
        ("My grandfather [A opened] the bakery [B in] 1985, and it [C is] [D popular] [E ever since].", ["opened", "in", "is", "popular", "ever since"], "C"),
        ("Only a few [A tourists] [B has] [C travelled] [D into] space [E so far].", ["tourists", "has", "travelled", "into", "so far"], "B"),
    ],
    "v1": [
        ("Which item is made of paper?", ["a newspaper", "a fork", "a bottle", "a pan", "a coin"], "A"),
        ("A young bear is called a ___.", ["cub", "calf", "foal", "lamb", "puppy"], "A"),
        ("A covered area at the front of a house, just outside the door.", ["porch", "attic", "cellar", "chimney", "ceiling"], "A"),
        ("Name the vehicle that carries astronauts into space.", ["rocket", "submarine", "glider", "yacht", "tram"], "A"),
        ("A person who brings goods into a country illegally is a ___.", ["smuggler", "burglar", "pickpocket", "shoplifter", "mugger"], "A"),
        ("It took me a long time to ___ up my mind about which university to choose.", ["make", "take", "do", "get", "put"], "A"),
        ("There was light, fine rain all morning.", ["There was some drizzle.", "There was a heatwave.", "There was a hurricane.", "It was very icy.", "It was very dry."], "A"),
        ("The bread is still warm and smells wonderful. It's really ___.", ["fresh", "stale", "frozen", "burnt", "raw"], "A"),
        ("Ten, nine, eight, seven ...", ["a countdown before a rocket launch", "a telephone number", "a person's age", "a football score", "a price"], "A"),
    ],
    "story": {
        "bank": ["shaped", "baked", "mixed", "risen", "sold"],
        "text": "Every morning at four o'clock, Mr Bat (26) _____________ flour, water, salt and yeast in a large bowl and left the dough in a warm place. After an hour, it had (27) _____________ to twice its size. He (28) _____________ the dough into round loaves and (29) _____________ them in a hot oven. By seven o'clock, all the bread had been (30) _____________ to hungry customers.",
        "answers": ["C", "D", "A", "B", "E"],
    },
    "v3": [
        ("In which of the following sentences does \"to give up\" mean \"to stop doing something you do regularly\"?", ["He gave up his seat to an old woman.", "My grandfather gave up smoking ten years ago.", "The thief gave himself up to the police.", "She gave up her weekend to help us.", "He gave up his place in the queue."], "B"),
        ("Choose the particle that best fits in the gap.\nThe rocket blasted ___ at exactly 9 a.m.", ["off", "up", "in", "on", "down"], "A"),
        ("I ___ across an old photo while I was tidying my room.", ["came", "went", "put", "got", "gave"], "A"),
    ],
    "c1": [
        ("Woman: Could I have a loaf of brown bread and four of those cakes, please?\nMan: Of course. They came out of the oven ten minutes ago.\nQuestion: Where does this conversation take place?", ["In a bakery", "In a bank", "In a library", "In a hospital", "At a garage"], "A"),
        ("Man: Please fasten your seat belts. We're about to land.\nWoman: Excuse me, could I have a glass of water first?\nQuestion: What is the man's job?", ["He's a flight attendant.", "He's a waiter.", "He's a mechanic.", "He's a farmer.", "He's a librarian."], "A"),
        ("Woman: How much is this silk scarf?\nMan: Fifty thousand tugriks, but I can give you a discount if you buy two.\nQuestion: Where is this conversation taking place?", ["At a market stall", "At a hospital", "At a school", "At a police station", "At a swimming pool"], "A"),
    ],
    "c2": [
        ("Woman: Are you going to the space exhibition on Saturday?\nMan: I wouldn't miss it.\nQuestion: What does the man mean?", ["He will definitely go.", "He will miss it.", "He doesn't want to go.", "He has already been.", "He isn't sure yet."], "A"),
        ("Man: The bakery's new cakes are delicious, aren't they?\nWoman: They're not bad, but they're not a patch on the old ones.\nQuestion: What does the woman mean?", ["The old cakes were much better.", "The new cakes are the best she has tasted.", "She has never tried the cakes.", "The new cakes have patches on them.", "The old cakes were not good."], "A"),
    ],
    "reading": {
        "text": "For more than a thousand years, a network of trade routes connected China with Central Asia, the Middle East and Europe. Today we call it the Silk Road, although the name was only invented in the nineteenth century by a German geographer. It was not one road but many paths across deserts, mountains and grasslands.\n\nSilk from China was one of the most valuable goods carried westward, but it was far from the only one. Merchants also traded spices, paper, tea, horses, glass and precious metals. Very few traders travelled the whole route. Instead, goods usually passed from one merchant to another, and their price rose at every stage of the journey.\n\nThe Silk Road carried more than goods. Ideas, religions, languages and inventions also travelled along it. Paper-making, for example, spread from China to the Middle East and then to Europe. Unfortunately, diseases spread too, sometimes with terrible results.\n\nIn the thirteenth century, the Mongol Empire controlled much of the route. Because one empire now ruled such a large area, travel became safer, and trade and contact between East and West grew. It was during this period that the Venetian merchant Marco Polo is said to have travelled to China.\n\nToday, historians see the Silk Road as one of the first great examples of global connection, showing how trade can bring distant peoples together.",
        "questions": [
            ("What is the main topic of the passage?", ["The history and importance of the Silk Road", "How silk is made", "The life of Marco Polo", "The deserts of Central Asia", "German geographers"], "A"),
            ("According to the passage, the name \"Silk Road\" was", ["invented in the nineteenth century", "used by ancient Chinese merchants", "given by Marco Polo", "chosen by the Mongol Empire", "written on the oldest maps"], "A"),
            ("According to the passage, most goods on the Silk Road", ["passed from merchant to merchant", "were carried by one trader the whole way", "were sold at the same price everywhere", "were made in Europe", "were never sold"], "A"),
            ("What travelled along the Silk Road besides goods?", ["Ideas, religions and inventions", "Only silk", "Only soldiers", "Nothing else", "Only horses"], "A"),
            ("It can be inferred from the passage that trade grew under the Mongol Empire because", ["travel across the large area became safer", "silk became cheaper", "Marco Polo built new roads", "the routes were closed", "merchants stopped paying for goods"], "A"),
            ("The word \"precious\" in paragraph 2 is closest in meaning to", ["valuable", "cheap", "heavy", "common", "broken"], "A"),
        ],
    },
    "gapped": {
        "bank": ["the Moon is made of cheese", "because rockets are not real", "so only very rich people can afford them", "and some have even stayed on the International Space Station"],
        "text": "Space tourism is no longer just a dream. Since 2001, a small number of private citizens have paid to travel into space, 45. _____________. However, tickets are still extremely expensive, 46. _____________.",
        "answers": ["D", "C"],
    },
    "statement": {
        "text": "A bakery has started selling bread made without wheat for people who cannot eat gluten.",
        "item": ("Choose the best answer. Which customers would most likely buy this bread?", ["People who become ill when they eat gluten", "People who love wheat bread", "People who only want to buy cakes", "Farmers who grow wheat", "People who eat only meat"], "A"),
    },
    "part2": {
        "2.1": {"text": "Only a few years ago, travelling into space was (a) _________ for anyone who was not a trained astronaut. Today, several private companies offer short flights that give passengers a few minutes of (b) _________ and a view of the curved Earth. The experience is (c) _________ expensive, but the companies hope that prices will fall as the technology (d) _________. Critics worry about the (e) _________ effect of frequent rocket launches on the atmosphere. Supporters, however, believe that space tourism will (f) _________ a new generation of scientists and engineers.",
                "gaps": [(["possible", "impossible", "possibly", "possibility", "impossibility"], 2),
                         (["weight", "weightless", "weightlessness", "weighty", "weigh"], 3),
                         (["extra", "ordinary", "extraordinariness", "extraordinarily", "extraordinary"], 4),
                         (["improvement", "improved", "improving", "improve", "improves"], 5),
                         (["environment", "environmental", "environmentally", "environmentalist", "environments"], 2),
                         (["inspire", "inspiration", "inspiring", "inspired", "inspirational"], 1)]},
        "2.2": {"synonyms": [
                    ("The bakery is **renowned** for its pastries.", ["unknown", "famous", "closed", "criticised", "small"], 2),
                    ("The journey across the desert was **exhausting**.", ["very tiring", "exciting", "short", "cheap", "easy"], 1),
                    ("Merchants **exchanged** goods at the market.", ["stole", "hid", "traded", "broke", "painted"], 3),
                    ("The launch was **postponed** because of the wind.", ["celebrated", "watched", "started", "delayed", "repeated"], 4)],
                "antonyms": [
                    ("The bread on the table was <u>stale</u>.", ["old", "hard", "dry", "cheap", "fresh"], 5),
                    ("The road through the mountains was <u>narrow</u>.", ["thin", "wide", "long", "steep", "dangerous"], 2),
                    ("Prices on the Silk Road often <u>rose</u>.", ["increased", "doubled", "fell", "grew", "changed"], 3),
                    ("The astronaut felt <u>calm</u> before the launch.", ["relaxed", "happy", "quiet", "sleepy", "nervous"], 5)]},
        "2.3": {"box": ["orbit", "launch", "crew", "gravity", "landed", "mission"],
                "text": "A new mission\nThe (a) _________ of the new rocket took place early on Monday morning. Within ten minutes the spacecraft had reached (b) _________ around the Earth. The four-person (c) _________ will spend six months on the space station, where they will study how plants grow without (d) _________. The (e) _________ is the company's most ambitious so far. If all goes well, the astronauts will have (f) _________ safely back on Earth by next spring.",
                "answer": "213465"},
    },
})

# ---------------------------------------------------------------- Mock 5
MOCKS.append({
    "theme": "Wildfires, a music festival and owls",
    "g1": [
        ("Two ___ were waiting outside the school.", ["women", "womans", "woman", "womens", "women's"], "A"),
        ("Hurry up! There's ___ time left.", ["hardly any", "hardly some", "few", "many", "a few"], "A"),
        ("You ___ have brought a present, but thank you very much!", ["needn't", "mustn't", "can't", "couldn't", "wouldn't"], "A"),
        ("Owls are birds ___ hunt at night.", ["which", "who", "whose", "where", "what"], "A"),
        ("Would you mind ___ the music down?", ["turning", "turn", "to turn", "turned", "turns"], "A"),
        ("The concert wasn't as ___ as we had expected.", ["good", "better", "best", "the best", "well"], "A"),
        ("The festival is famous ___ its outdoor stages.", ["for", "of", "with", "about", "at"], "A"),
        ("The number of visitors ___ growing every year.", ["is", "are", "were", "have", "be"], "A"),
        ("The drier the forest, ___ it burns.", ["the faster", "faster", "the fastest", "fastest", "more fast"], "A"),
    ],
    "g2": [
        ("If people ___ more careful with campfires, many forest fires ___.", ["were / could be prevented", "are / could prevent", "had been / can be prevented", "were / can prevent", "would be / were prevented"], "A"),
        ("Owls can hunt in the dark ___ their excellent hearing.", ["thanks to", "although", "even though", "because", "however"], "A"),
        ("All the tickets for the festival ___ in less than an hour.", ["were sold", "have been selling", "is sold", "was selling", "sells"], "A"),
        ("The ranger said, \"Don't light fires in the forest.\"", ["The ranger told us not to light fires in the forest.", "The ranger said us not to light fires in the forest.", "The ranger told us don't light fires in the forest.", "The ranger told us to not lighting fires in the forest.", "The ranger told not us to light fires in the forest."], "A"),
    ],
    "errors": [
        ("Owls [A are able to] turn [B their] heads [C much] further than [D human] [E can].", ["are able to", "their", "much", "human", "can"], "D"),
        ("The fire [A spread] [B quick] [C because of] the strong wind and [D dry] [E grass].", ["spread", "quick", "because of", "dry", "grass"], "B"),
        ("[A Thousands of] people [B goes] to the festival [C every] summer [D to hear] [E live] music.", ["Thousands of", "goes", "every", "to hear", "live"], "B"),
    ],
    "v1": [
        ("Which item is made of rubber?", ["a car tyre", "a window", "a newspaper", "a spoon", "a sweater"], "A"),
        ("A young goat is called a ___.", ["kid", "calf", "lamb", "foal", "cub"], "A"),
        ("The area just inside the front door of a house, where you hang your coats.", ["hall", "attic", "cellar", "balcony", "roof"], "A"),
        ("Name the vehicle that is used to put out fires.", ["fire engine", "ambulance", "tractor", "tram", "ferry"], "A"),
        ("A person who deliberately starts fires to destroy property is an ___.", ["arsonist", "artist", "archer", "astronaut", "author"], "A"),
        ("Please ___ attention to the safety instructions.", ["pay", "give", "take", "make", "do"], "A"),
        ("It was extremely hot and dry for two weeks.", ["There was a heatwave.", "There was a blizzard.", "It was foggy.", "It was raining heavily.", "There was a frost."], "A"),
        ("The festival was so ___ that I could hardly hear my friends talking.", ["noisy", "quiet", "peaceful", "empty", "boring"], "A"),
        ("Encore! Encore!", ["what an audience shouts to ask performers to play more", "a telephone number", "a football score", "a temperature", "a year"], "A"),
    ],
    "story": {
        "bank": ["destroyed", "put", "spread", "caught", "evacuated"],
        "text": "Last summer, dry grass near the village (26) _____________ fire after a lightning strike. Strong winds quickly (27) _____________ the flames towards the houses. The police (28) _____________ more than two hundred people to a nearby school. Firefighters worked for two days before they finally (29) _____________ the fire out. Luckily, nobody was hurt, although the fire (30) _____________ several barns.",
        "answers": ["D", "C", "E", "B", "A"],
    },
    "v3": [
        ("In which of the following sentences does \"to turn down\" mean \"to refuse\"?", ["Please turn down the music.", "She turned down the job offer because the salary was too low.", "Turn down the next street on the left.", "He turned down the corner of the page.", "The heating is turned down at night."], "B"),
        ("Choose the particle that best fits in the gap.\nThe band will go ___ stage at eight o'clock.", ["on", "in", "up", "at", "off"], "A"),
        ("The concert was so popular that hundreds of people were turned ___ at the gate.", ["away", "down", "off", "over", "in"], "A"),
    ],
    "c1": [
        ("Man: Excuse me, which stage is the main band playing on?\nWoman: The big one near the lake. They start at nine.\nQuestion: Where does this conversation take place?", ["At a music festival", "At a hospital", "In a classroom", "At a bank", "In a bakery"], "A"),
        ("Woman: I'd like to report a fire near the river.\nMan: Stay calm. Can you tell me exactly where you are?\nQuestion: Who is the man most likely to be?", ["An emergency operator", "A waiter", "A hairdresser", "A pilot", "A shop assistant"], "A"),
        ("Man: Where can I see the owls?\nWoman: Follow the path to the night house. Please keep your voice down; the other animals are sleeping.\nQuestion: Where is this conversation taking place?", ["At a zoo", "At a cinema", "In a supermarket", "At a bus station", "In a restaurant"], "A"),
    ],
    "c2": [
        ("Woman: Do you want to come to the festival with us?\nMan: I'd love to, but I'm up to my ears in work.\nQuestion: What does the man mean?", ["He is too busy to go.", "He has a problem with his ears.", "He will definitely go.", "He doesn't like music.", "He has finished his work."], "A"),
        ("Man: Was the festival worth the money?\nWoman: Every penny.\nQuestion: What does the woman mean?", ["It was definitely worth the price.", "It was too expensive.", "She didn't pay.", "She wants her money back.", "It was free."], "A"),
    ],
    "reading": {
        "text": "Owls are among the most skilful hunters in the bird world. There are about 250 species, and they live on every continent except Antarctica. Most owls hunt at night, when their main prey, such as mice and other small animals, are active.\n\nAn owl's large eyes work extremely well in low light, but they cannot move in their sockets. To look around, an owl must turn its whole head, and it can turn it up to about 270 degrees without moving its body. Hearing is just as important. In some species, one ear is placed higher than the other, which helps the owl find exactly where a sound is coming from, even under snow.\n\nOwls are also famous for flying almost silently. Their wing feathers have soft edges that break up the flow of air and reduce noise, so their prey often does not hear them coming.\n\nOwls usually swallow small prey whole. Later, they cough up the parts they cannot digest, such as bones and fur, in a small ball called a pellet. Scientists study these pellets to learn what owls eat.\n\nIn many cultures, owls are symbols of wisdom, while in others they are linked to bad luck. Whatever people believe, owls play an important role in nature by controlling the number of mice and rats.",
        "questions": [
            ("What is the main topic of the passage?", ["The special hunting abilities and habits of owls", "How to keep an owl as a pet", "The history of Antarctica", "Why mice are active at night", "Owls in old stories"], "A"),
            ("According to the passage, owls turn their heads because", ["their eyes cannot move in their sockets", "they cannot hear well", "they want to sleep", "they are afraid", "their necks are short"], "A"),
            ("According to the passage, having one ear higher than the other helps some owls", ["find exactly where a sound is coming from", "fly faster", "see colours", "sleep during the day", "swim"], "A"),
            ("Why do owls fly almost silently?", ["Their wing feathers have soft edges that reduce noise.", "They fly very slowly.", "They never move their wings.", "They fly only in the rain.", "They are very small."], "A"),
            ("It can be inferred from the passage that owl pellets are useful to scientists because they", ["show what owls have eaten", "are made of feathers", "help owls fly", "can be eaten", "show how old an owl is"], "A"),
            ("The word \"swallow\" in paragraph 4 is closest in meaning to", ["take into the stomach through the throat", "catch with the feet", "carry to the nest", "hide", "share"], "A"),
        ],
    },
    "gapped": {
        "bank": ["although nobody likes music", "because large crowds can quickly become unsafe without them", "so that they can see all their favourite bands", "the festival never sells tickets"],
        "text": "Music festivals attract millions of people every summer. Many visitors camp in tents for several days 45. _____________. Organisers must provide water, toilets and first aid, 46. _____________.",
        "answers": ["C", "B"],
    },
    "statement": {
        "text": "A national park has installed cameras that send an alarm to the rangers' office as soon as they detect smoke.",
        "item": ("Choose the best answer. What are these cameras most likely used for?", ["Finding forest fires early", "Taking photos of tourists", "Counting cars on the road", "Watching football matches", "Recording music concerts"], "A"),
    },
    "part2": {
        "2.1": {"text": "Every summer, a small town in the countryside hosts a three-day music festival. It began twenty years ago as a (a) _________ event for local musicians, but it has grown (b) _________ and now attracts visitors from all over the world. The organisers are proud of its friendly (c) _________ and its strong focus on the environment: plastic cups are banned, and all waste is (d) _________ sorted and recycled. Visitors say the main (e) _________ of the festival is its mix of famous bands and new local talent. For many young musicians, playing here is an (f) _________ step in their careers.",
                "gaps": [(["modesty", "modestly", "immodest", "modest", "modester"], 4),
                         (["rapid", "rapidly", "rapidity", "rapids", "rapider"], 2),
                         (["atmosphere", "atmospheric", "atmospherically", "atmospheres", "atmospherics"], 1),
                         (["thorough", "thoroughness", "thoroughly", "through", "throughout"], 3),
                         (["attractive", "attract", "attractively", "attracted", "attraction"], 5),
                         (["importance", "importantly", "import", "important", "imported"], 4)]},
        "2.2": {"synonyms": [
                    ("The owl gave a **shrill** cry.", ["soft", "deep", "high and loud", "happy", "short"], 3),
                    ("The forest fire was **enormous**.", ["huge", "tiny", "quick", "distant", "harmless"], 1),
                    ("The band **commenced** their show with a famous song.", ["ended", "began", "cancelled", "repeated", "recorded"], 2),
                    ("Firefighters **battled** the flames all night.", ["watched", "avoided", "lit", "fought", "ignored"], 4)],
                "antonyms": [
                    ("The crowd was very <u>enthusiastic</u>.", ["excited", "large", "young", "noisy", "bored"], 5),
                    ("Owls are <u>nocturnal</u> animals.", ["active at night", "wild", "rare", "active during the day", "large"], 4),
                    ("After weeks without rain, the forest floor was <u>dry</u>.", ["dusty", "damp", "dark", "hot", "flat"], 2),
                    ("The firefighters <u>extinguished</u> the fire.", ["put out", "saw", "reported", "started", "fought"], 4)]},
        "2.3": {"box": ["blaze", "firefighters", "smoke", "residents", "flames", "ash"],
                "text": "Wildfire\nA huge (a) _________ broke out in the hills above the town on Sunday afternoon. Thick black (b) _________ could be seen from more than fifty kilometres away. More than two hundred (c) _________ fought the fire through the night as (d) _________ rose up to twenty metres into the air. Hundreds of (e) _________ had to leave their homes. When they returned, they found their gardens covered in a thin layer of grey (f) _________.",
                "answer": "132546"},
    },
})
