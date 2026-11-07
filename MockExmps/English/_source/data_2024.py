# 2024 blueprint (ЭЕШ Variant A, from Scribd screenshots): Part I 47 five-option items = 80 points; Part II = 20 points.
# Grammar 6x1, 7x2, 3x2 responses from a shared bank (two extra), 2x3 key-word transformations
# Vocabulary 4x1, 3x1 one word for three gaps (shared bank), 2x1 situations, 2x2 prefix/suffix forks, 2x2 prepositions, 2x3 idioms
# Communication 3x2 on a three-part conversation, 2x2 phrasal verbs | Reading titled article 6x1 + summary 3x3 (bank, two extra)
# Part II: 2.1 word forms (6 gaps) | 2.2 eight words from 2.1 to ten definitions (1-9, 0) | 2.3 synonyms of six bold words
MOCKS = []

# ---------------------------------------------------------------- Mock 1
MOCKS.append({
    "theme": "Lost wallets, the Moon and a lake holiday",
    "g1": [
        ("Could you give me ___ advice about choosing a university?", ["an", "many", "some", "a few", "these"], "C"),
        ("You've met my sister before, ___?", ["haven't you", "didn't you", "have you", "don't you", "aren't you"], "A"),
        ("Students ___ use their phones during the exam. It's against the rules.", ["mustn't", "needn't", "don't have to", "can", "should"], "A"),
        ("On the way home, I stopped ___ some bread.", ["buy", "to buy", "buying", "bought", "buys"], "B"),
        ("She works ___ a nurse at the city hospital.", ["as", "like", "same", "similar", "to"], "A"),
        ("He bought a ___ table.", ["lovely old round wooden", "old lovely wooden round", "wooden round old lovely", "round lovely old wooden", "lovely wooden old round"], "A"),
    ],
    "g2": [
        ("If I ___ enough money, I ___ a bigger flat.", ["had / would rent", "have / would rent", "will have / will rent", "had / will rent", "were having / would rent"], "A"),
        ("I have two cousins, both of ___ live in Japan.", ["whom", "who", "which", "them", "that"], "A"),
        ("My friend asked, \"What are you doing tomorrow?\"\nMy friend asked ___.", ["me what I was doing the next day", "what was I doing the next day", "me what I am doing the next day", "me what was I doing the following day", "what I was doing yesterday"], "A"),
        ("She got the job ___ she had no experience.", ["even though", "despite", "because of", "in case", "so that"], "A"),
        ("My brother hurt his arm playing football, so he ___ at the hospital yesterday.", ["had his arm X-rayed", "X-rayed his arm", "had X-rayed his arm", "has his arm X-rayed", "got X-rayed his arm"], "A"),
        ("By the time the film ___, we ___ all the popcorn.", ["started / had already eaten", "starts / had eaten", "had started / ate", "started / have eaten", "was starting / eat"], "A"),
        ("Once upon a time there was ___ old fisherman who lived ___ a small hut ___ the sea.", ["an / in / by", "the / at / on", "a / in / by", "an / on / at", "the / in / in"], "A"),
    ],
    "responses": {
        "bank": ["Neither have I.", "No, not at all.", "So did I.", "So am I.", "Yes, I did."],
        "text": "Tuya: Did you enjoy the concert last night?\nBat: Yes, I loved it.\nTuya: 14. _________ It was the best one this year.\nBat: I've never heard the band play so well.\nTuya: 15. _________ They must have practised a lot.\nBat: Was it hard to get tickets?\nTuya: 16. _________ I bought them online in five minutes.",
        "answers": ["C", "A", "B"],
    },
    "transform": [
        ("I started learning the piano three years ago.\n**for**", ["I have been learning the piano for three years.", "I learned the piano for three years ago.", "I am learning the piano for three years.", "I have learned the piano since three years.", "For three years I start learning the piano."], "A"),
        ("It's a pity I can't drive.\n**wish**", ["I wish I could drive.", "I wish I can drive.", "I wish I couldn't drive.", "I wish I would drive.", "I wished I can drive."], "A"),
    ],
    "v1": [
        ("It hasn't rained for months, and the fields are dry. It's a ___.", ["drought", "flood", "hurricane", "blizzard", "fog"], "A"),
        ("A ___ is a person who flies a plane.", ["pilot", "sailor", "driver", "pirate", "rider"], "A"),
        ("___ is the study of the stars and planets.", ["Astronomy", "Geology", "Biology", "Ecology", "Zoology"], "A"),
        ("Don't forget to back ___ your files in case your computer breaks.", ["up", "in", "on", "for", "out"], "A"),
    ],
    "homonym": {
        "bank": ["bat", "ring", "match", "light", "bark"],
        "text": "23. This bag is very _________; I can carry it with one hand.\n24. Could you switch on the _________? It's getting dark.\n25. She wore a _________ blue dress to the party.",
        "answers": ["D", "D", "D"],
    },
    "situations": [
        ("What will you need when you go fishing on a lake?", ["a fishing rod", "a tennis racket", "ski poles", "a bowling ball", "a golf club"], "A"),
        ("What expression is used for *making someone feel less worried*?", ["to reassure someone", "to annoy someone", "to frighten someone", "to blame someone", "to ignore someone"], "A"),
    ],
    "affixes": [
        ("A(n) ___ + friendly dog / fair decision / kind remark", ["un-", "in-", "im-", "dis-", "ir-"], "A"),
        ("A creat(___) + student / idea / solution", ["-ive", "-ion", "-or", "-ity", "-ure"], "A"),
    ],
    "prepositions": [
        ("She is very fond ___ her grandmother.", ["of", "with", "about", "for", "to"], "A"),
        ("Please don't laugh ___ my accent.", ["at", "on", "with", "over", "to"], "A"),
    ],
    "idioms": [
        ("It really <u>drives me up the wall</u> when people talk during films.", ["It makes me very annoyed.", "It makes me want to climb.", "It helps me concentrate.", "It makes me laugh.", "It doesn't bother me."], "A"),
        ("Bold is <u>the black sheep</u> of his family.", ["He is seen as different from, and worse than, the rest of the family.", "He is the youngest in the family.", "He is the richest in the family.", "He looks after the family's animals.", "He is the most popular in the family."], "A"),
    ],
    "conversation": {
        "instructions": "Read the conversation about planning a holiday and answer the questions.",
        "questions": [
            ("Part 1.\nAnu: Have you decided where to go for the holidays?\nTom: Not yet. I wanted to go to the seaside, but flights are really expensive in July.\nAnu: What about going by train?\nTom: It takes almost three days. I'd lose half my holiday on the journey.\n\nWhy hasn't Tom chosen the seaside yet?", ["Flights in July are too expensive.", "He doesn't like the sea.", "He has no holiday this year.", "Anu doesn't want to go.", "The trains are full."], "A"),
            ("Part 2.\nAnu: My cousin runs a guesthouse by Lake Khövsgöl. If you book through me, she'll give you a discount.\nTom: Really? How much?\nAnu: Twenty percent, if you stay at least five nights.\n\nWhat must Tom do to get the discount?", ["Book through Anu and stay at least five nights.", "Pay in cash.", "Travel by train.", "Stay only one night.", "Book online."], "A"),
            ("Part 3.\nTom: That sounds great, but is there anything to do there?\nAnu: Plenty. You can hire a boat, ride horses or go hiking. But don't expect fast internet.\nTom: That's fine. To be honest, a week without my phone is exactly what I need.\n\nWhat does Tom want from his holiday?", ["A break from his phone", "Fast internet", "A busy city", "Cheap flights", "A job at the guesthouse"], "A"),
        ],
    },
    "phrasal": [
        ("A: Why are you so late?\nB: Sorry, my car ___ on the motorway.", ["broke down", "broke up", "broke in", "broke out", "broke off"], "A"),
        ("A: This report is far too long.\nB: Then ___ it ___ to one page.", ["cut, down", "give, up", "take, off", "bring, in", "look, after"], "A"),
    ],
    "reading": {
        "title": "Would You Return a Lost Wallet?",
        "text": "In 2019, a team of economists published the results of an unusual experiment. Over several years, research assistants had handed in more than 17,000 \"lost\" wallets in 355 cities across 40 countries. Each wallet contained a business card with an email address, a shopping list and a key, and some also contained money.\n\nThe assistants walked into banks, hotels, post offices and museums and told the person at the desk that they had found the wallet on the street around the corner. They said they were in a hurry and asked the person to take care of it. Then they left, and the researchers waited to see whether anyone would email the owner.\n\nMost economists predicted that people would be less likely to return wallets with money in them, because keeping the cash would be tempting. The results showed the opposite. In almost every country, wallets containing money were returned more often than empty ones, and wallets with a larger amount of money were returned even more often.\n\nWhy? The researchers believe that people do not want to see themselves as thieves. Keeping an empty wallet feels like nothing, but keeping a wallet full of money feels like stealing. In other words, honesty is not only about rules but also about how people want to feel about themselves.\n\nThe rates of return were different from country to country, but the general pattern was the same almost everywhere. The researchers concluded that people are often more honest than we expect, and that perhaps we should trust each other a little more.",
        "questions": [
            ("What is the article about?", ["An experiment on how honest people are", "How to protect your wallet", "The history of banks", "Why economists travel", "A famous thief"], "A"),
            ("What was in every wallet?", ["A business card, a shopping list and a key", "Money and a passport", "A photo and a phone", "Only money", "A letter to the police"], "A"),
            ("What did the assistants do after handing in the wallets?", ["They left quickly.", "They waited at the desk.", "They called the police.", "They took the money back.", "They asked for a reward."], "A"),
            ("What did most economists expect?", ["Wallets with money would be returned less often.", "All wallets would be returned.", "Empty wallets would never be returned.", "People in banks would be more honest than others.", "The researchers would lose the wallets."], "A"),
            ("What is the main comparison made in the article?", ["How often wallets with and without money were returned", "Banks and museums", "Rich and poor cities", "Economists and psychologists", "Keys and shopping lists"], "A"),
            ("What is implied about why people returned wallets with more money?", ["They did not want to feel like thieves.", "They expected a big reward.", "They were afraid of cameras.", "They knew it was an experiment.", "They didn't notice the money."], "A"),
        ],
    },
    "summary": {
        "bank": ["whereas", "so that", "even though", "in order", "because"],
        "text": "Researchers handed in thousands of \"lost\" wallets around the world. 45. _________ most experts expected people to keep wallets with money, these wallets were actually returned more often. The researchers think this happened 46. _________ people do not want to see themselves as thieves. Empty wallets were returned less often, 47. _________ wallets with large amounts of money were returned most often of all.",
        "answers": ["C", "E", "A"],
    },
    "part2": {
        "2.1": {"text": "Anyone who has spent a day at the seaside has seen the tide come in and go out. These (a) _________ changes in sea level are caused mainly by the Moon. The Moon's gravity pulls on the Earth's oceans, making the water bulge (b) _________ towards it. On the opposite side of the Earth, a second bulge forms. As the Earth rotates, most coastlines pass through both bulges, so they (c) _________ two high tides and two low tides almost every day. The Sun also affects the tides, but its influence is much (d) _________ because it is so far away. When the Sun and the Moon line up, their pulls combine and the tides are especially high. These are called spring tides, although they have nothing to do with the (e) _________. In some places, engineers now use the energy of the tides to (f) _________ electricity.",
                "gaps": [(["regularly", "regularity", "regulate", "regular", "regulation"], 4),
                         (["slight", "slightly", "slightness", "slighted", "slights"], 2),
                         (["experiential", "experienced", "experience", "inexperience", "experiencing"], 3),
                         (["weakness", "weaken", "weakly", "weaker", "weak"], 4),
                         (["season", "seasonal", "seasonally", "seasoned", "seasoning"], 1),
                         (["generator", "generation", "generous", "generative", "generate"], 5)]},
        "2.2": (["tide", "gravity", "to bulge", "to rotate", "coastline", "influence", "to line up", "opposite"],
                ["to form a straight row", "the power to have an effect on something", "the regular rise and fall of the level of the sea", "a large wave caused by an earthquake", "to swell out in a round shape", "completely different; on the other side", "the land along the edge of the sea", "the force that pulls objects towards each other", "to move slowly and quietly", "to turn around a central point"],
                "38507216"),
        "2.3": {"text": "Seen from the Earth, the Moon looks calm, but its surface is covered with (a) **gigantic** craters. Most of them were formed by (b) **ancient** collisions with rocks from space, which were (c) **frequent** in the early solar system. The landscape is completely (d) **barren**: there is no water, no air and no life. Yet the Moon has a (e) **remarkable** effect on our planet, from the tides to the light on a dark night. Without it, many animals that depend on moonlight would struggle to (f) **survive**.",
                "gaps": [(["tiny", "huge", "shallow", "recent", "round"], 2),
                         (["modern", "sudden", "very old", "gentle", "minor"], 3),
                         (["rare", "dangerous", "quiet", "late", "common"], 5),
                         (["crowded", "fertile", "colourful", "empty", "wet"], 4),
                         (["extraordinary", "ordinary", "slight", "harmful", "invisible"], 1),
                         (["disappear", "sleep", "migrate", "stay alive", "hunt"], 4)]},
    },
})

# ---------------------------------------------------------------- Mock 2
MOCKS.append({
    "theme": "A loyal dog, volcanoes and adopting a pet",
    "g1": [
        ("There isn't ___ milk left, so I'll drink my tea without it.", ["much", "many", "a", "few", "an"], "A"),
        ("Let's go for a walk, ___?", ["shall we", "won't we", "don't we", "do we", "aren't we"], "A"),
        ("You ___ bring any food; lunch is included in the price.", ["don't have to", "mustn't", "can't", "have to", "must"], "A"),
        ("Remember ___ the door when you leave.", ["locking", "to lock", "lock", "locked", "locks"], "B"),
        ("Your bag is the ___ as mine.", ["same", "similar", "like", "as", "alike"], "A"),
        ("She carries a ___ bag.", ["small black Italian leather", "black small leather Italian", "Italian small black leather", "leather small black Italian", "small Italian leather black"], "A"),
    ],
    "g2": [
        ("If you ___ harder, you ___ the exam last week.", ["had studied / would have passed", "studied / would pass", "have studied / will pass", "had studied / will have passed", "would study / had passed"], "A"),
        ("She has two brothers, neither of ___ lives nearby.", ["whom", "who", "which", "them", "those"], "A"),
        ("\"Did you see the volcano?\" she asked me.\nShe asked ___.", ["me if I had seen the volcano", "me if had I seen the volcano", "if I see the volcano", "me did I see the volcano", "me if you had seen the volcano"], "A"),
        ("He went to work ___ having a terrible cold.", ["despite", "although", "even though", "because", "so"], "A"),
        ("Grandma ___ at the hairdresser's every Friday.", ["has her hair done", "does her hair", "has done her hair", "her hair is doing", "gets done her hair"], "A"),
        ("When I finally ___ the station, the last train ___.", ["reached / had already left", "reach / had left", "had reached / left", "reached / has left", "was reaching / leaves"], "A"),
        ("___ dog waited at ___ station every day ___ ten years.", ["A / the / for", "The / a / since", "A / – / for", "The / the / during", "An / the / for"], "A"),
    ],
    "responses": {
        "bank": ["Neither do I.", "So have I.", "Yes, I'd love to.", "I don't think so.", "So do I."],
        "text": "Nomin: I really like this café.\nBat: 14. _________ The coffee is excellent.\nNomin: I've been coming here for years.\nBat: 15. _________ Since I was a student.\nNomin: Would you like to try their new cake?\nBat: 16. _________ It looks delicious.",
        "answers": ["E", "B", "C"],
    },
    "transform": [
        ("This is the first time I have eaten sushi.\n**never**", ["I have never eaten sushi before.", "I never eat sushi before.", "I had never eaten sushi.", "I have ever eaten sushi before.", "Never I have eaten sushi."], "A"),
        ("Someone has stolen my bike.\n**been**", ["My bike has been stolen.", "My bike was been stolen.", "My bike has stolen.", "Someone has been stolen my bike.", "My bike been stolen."], "A"),
    ],
    "v1": [
        ("A very strong wind that destroys buildings is a ___.", ["hurricane", "breeze", "drizzle", "frost", "mist"], "A"),
        ("A ___ is a person who looks after people's teeth.", ["dentist", "surgeon", "vet", "nurse", "pharmacist"], "A"),
        ("___ is the study of the Earth's rocks and soil.", ["Geology", "Astronomy", "Botany", "Zoology", "Psychology"], "A"),
        ("Please plug ___ the charger before you go to bed.", ["in", "on", "up", "at", "for"], "A"),
    ],
    "homonym": {
        "bank": ["season", "coil", "stream", "spring", "fall"],
        "text": "23. Many flowers bloom in _________, after the long winter.\n24. The old mattress has a broken _________ that sticks into my back.\n25. Fresh, cold water flows from a mountain _________.",
        "answers": ["D", "D", "D"],
    },
    "situations": [
        ("What do you need to go swimming in a pool?", ["a swimsuit and goggles", "ski boots", "a climbing rope", "a tennis racket", "a sleeping bag"], "A"),
        ("What expression is used for *stopping a habit*?", ["to give up", "to take up", "to make up", "to look up", "to pick up"], "A"),
    ],
    "affixes": [
        ("A(n) ___ + possible task / patient driver / polite answer", ["im-", "un-", "in-", "dis-", "ir-"], "A"),
        ("A danger(___) + road / animal / job", ["-ous", "-ful", "-less", "-ive", "-al"], "A"),
    ],
    "prepositions": [
        ("Are you afraid ___ the dark?", ["of", "from", "with", "at", "about"], "A"),
        ("We arrived ___ the airport two hours early.", ["at", "in", "to", "on", "by"], "A"),
    ],
    "idioms": [
        ("Don't <u>beat around the bush</u>. Just tell me what happened.", ["Speak directly without avoiding the main point.", "Cut the bushes in the garden.", "Hit someone.", "Go for a walk in the garden.", "Hide the truth carefully."], "A"),
        ("My little brother is <u>the apple of my mother's eye</u>.", ["My mother loves him very much.", "He eats a lot of apples.", "He has problems with his eyes.", "My mother is angry with him.", "He looks like an apple."], "A"),
    ],
    "conversation": {
        "instructions": "Read the conversation about getting a dog and answer the questions.",
        "questions": [
            ("Part 1.\nSaraa: I'm thinking of getting a dog.\nDorj: That's a big decision. Who'll look after it when you're at work?\nSaraa: My mum is at home during the day, and she loves animals.\n\nWho will take care of the dog during the day?", ["Saraa's mother", "Dorj", "Saraa", "A dog walker", "Nobody"], "A"),
            ("Part 2.\nDorj: Are you going to buy one from a breeder?\nSaraa: No, I'd rather adopt one from the animal shelter. They have so many dogs that need homes.\n\nWhere does Saraa want to get a dog?", ["From an animal shelter", "From a breeder", "From a pet shop", "From Dorj", "From the internet"], "A"),
            ("Part 3.\nDorj: Big dogs need a lot of exercise, you know.\nSaraa: I know. That's why I'm looking for a small, calm one. Our flat isn't very big, and I can only walk it in the mornings and evenings.\n\nWhat kind of dog is Saraa looking for?", ["A small, calm dog", "A big, active dog", "A hunting dog", "A dog for Dorj", "A dog that needs a lot of exercise"], "A"),
        ],
    },
    "phrasal": [
        ("A: Is the concert still on?\nB: No, it's been ___ because the singer is ill.", ["called off", "called on", "called up", "called in", "called out"], "A"),
        ("A: What a mess!\nB: Don't worry, I'll ___ it ___ before Mum gets home.", ["clean, up", "take, off", "give, in", "put, on", "look, after"], "A"),
    ],
    "reading": {
        "title": "The Most Loyal Dog",
        "text": "In 1924, a professor at the University of Tokyo named Hidesaburō Ueno took in a white Akita puppy and called him Hachikō. Every morning, the dog walked with the professor to Shibuya Station, and every afternoon he returned to the station to meet him when his train came back.\n\nIn May 1925, the professor died suddenly while he was at work, and he never came home. Hachikō, however, did not understand. The next afternoon he went to the station as usual and waited. When the professor did not appear, he came back the following day, and the day after that.\n\nFor almost ten years, Hachikō went to Shibuya Station every day at the time the professor's train used to arrive. At first, some station workers and shopkeepers were unkind to him. Later, after a newspaper article told his story in 1932, he became famous across Japan. People began to bring him food, and teachers used his story to teach children about loyalty.\n\nIn 1934, a bronze statue of Hachikō was put up at the station, and the dog himself was present at the ceremony. He died the following year. Today, a new statue stands in the same place, and \"meet me at Hachikō\" is one of the most common phrases in Tokyo.\n\nScientists might explain Hachikō's behaviour as a strong habit connected to routine and food. For most people, though, his story is simply about love that does not give up.",
        "questions": [
            ("What is the article about?", ["A dog that waited for its owner for years", "How to train an Akita", "The history of Shibuya Station", "A professor's research", "Trains in Japan"], "A"),
            ("Why did Hachikō go to the station every afternoon at first?", ["To meet the professor's train", "To get food from shopkeepers", "To see the statue", "To travel to the university", "To meet other dogs"], "A"),
            ("What happened in May 1925?", ["The professor died suddenly at work.", "The statue was put up.", "Hachikō became famous.", "Hachikō was born.", "A newspaper wrote about Hachikō."], "A"),
            ("How did people's behaviour towards Hachikō change after 1932?", ["They began to bring him food and admire him.", "They chased him away.", "They ignored him.", "They took him to another city.", "They stopped going to the station."], "A"),
            ("What is compared in the last paragraph?", ["A scientific explanation and the popular view of Hachikō's behaviour", "Two different statues", "Dogs and cats", "Tokyo and other cities", "The professor and his students"], "A"),
            ("What is implied by the phrase \"meet me at Hachikō\"?", ["The statue is a well-known meeting place today.", "The dog is still alive.", "People meet the professor there.", "The station has closed.", "Nobody remembers the dog."], "A"),
        ],
    },
    "summary": {
        "bank": ["because", "unless", "although", "because of", "so"],
        "text": "Hachikō walked with his owner to Shibuya Station every day. In 1925 the professor died at work. 45. _________ Hachikō waited at the station every day for almost ten years, his owner never came back. The dog became famous across Japan 46. _________ a newspaper article about him. 47. _________ his story moved so many people, a statue was put up while he was still alive.",
        "answers": ["C", "D", "A"],
    },
    "part2": {
        "2.1": {"text": "A volcano is an opening in the Earth's surface through which hot, melted rock (a) _________ from deep underground. This melted rock is called magma while it is still inside the Earth and lava once it reaches the surface. Some volcanoes erupt (b) _________, throwing ash and rocks high into the sky, while others release lava slowly and quietly. Scientists who study volcanoes try to (c) _________ eruptions by measuring small earthquakes and changes in the gases that come out of the ground. Their work is extremely (d) _________, because millions of people live close to active volcanoes. Volcanoes are not only destructive, however. Volcanic soil is very (e) _________, so farmers often grow crops on the slopes, and in some countries the heat underground is used to produce (f) _________.",
                "gaps": [(["escape", "escapes", "escaped", "escaping", "escapist"], 2),
                         (["violence", "violate", "violently", "violent", "violation"], 3),
                         (["prediction", "predictable", "predictably", "unpredictable", "predict"], 5),
                         (["importance", "importantly", "import", "important", "imported"], 4),
                         (["fertile", "fertility", "fertilize", "fertilizer", "infertile"], 1),
                         (["electric", "electrical", "electricity", "electrician", "electrify"], 3)]},
        "2.2": (["opening", "surface", "to erupt", "ash", "slope", "crop", "to release", "active"],
                ["the grey powder left after something has burned", "to let something go or allow it to escape", "a hole or space that something can pass through", "a very deep valley under the sea", "still able to erupt", "the outside or top layer of something", "a plant grown in large amounts, especially for food", "to explode and send out smoke, fire and rock", "the side of a hill or mountain, higher at one end", "to become cold and hard"],
                "36819725"),
        "2.3": {"text": "Dogs have lived alongside humans for thousands of years. They are (a) **loyal** companions and can be (b) **trained** to do many jobs. Some dogs guide people who are blind, others (c) **assist** police officers, and some (d) **locate** people trapped under snow. A dog's sense of smell is (e) **extraordinary**: it is many times more (f) **sensitive** than ours.",
                "gaps": [(["lazy", "faithful", "noisy", "wild", "hungry"], 2),
                         (["taught", "bought", "fed", "washed", "punished"], 1),
                         (["avoid", "follow", "chase", "help", "arrest"], 4),
                         (["lose", "leave", "find", "bury", "ignore"], 3),
                         (["ordinary", "weak", "average", "useless", "amazing"], 5),
                         (["keen", "dull", "slow", "rough", "careless"], 1)]},
    },
})

# ---------------------------------------------------------------- Mock 3
MOCKS.append({
    "theme": "A spacecraft lost to a units mix-up, honeybees and a hotel stay",
    "g1": [
        ("There are ___ chairs in the hall for everyone.", ["enough", "a lot", "much", "a", "any"], "A"),
        ("She can't swim, ___?", ["can she", "can't she", "does she", "doesn't she", "is she"], "A"),
        ("You ___ have told me earlier! Now it's too late.", ["should", "must", "can", "may", "will"], "A"),
        ("Would you like ___ dinner with us tonight?", ["to have", "having", "have", "had", "has"], "A"),
        ("The weather today is quite ___ yesterday's.", ["similar to", "same as", "like as", "alike", "same"], "A"),
        ("My aunt gave me a ___ vase.", ["beautiful old blue Chinese", "old beautiful Chinese blue", "blue beautiful old Chinese", "Chinese blue old beautiful", "beautiful Chinese old blue"], "A"),
    ],
    "g2": [
        ("If the engineers ___ the units more carefully, they ___ the spacecraft.", ["had checked / wouldn't have lost", "checked / won't lose", "have checked / wouldn't lose", "would check / hadn't lost", "check / wouldn't have lost"], "A"),
        ("The hotel has two pools, one of ___ is on the roof.", ["which", "whom", "them", "that", "where"], "A"),
        ("\"Where is the nearest bank?\" the tourist asked.\nThe tourist asked ___.", ["where the nearest bank was", "where was the nearest bank", "where is the nearest bank", "where the nearest bank is it", "where the nearest bank were"], "A"),
        ("The match continued ___ the fact that it was raining.", ["despite", "although", "in spite", "because", "even"], "A"),
        ("We ___ by a professional painter last year.", ["had our house painted", "painted our house", "have painted our house", "had painted our house", "our house painted"], "A"),
        ("By the time the police ___, the thieves ___.", ["arrived / had escaped", "arrive / escaped", "had arrived / escaped", "arrived / have escaped", "were arriving / escape"], "A"),
        ("Bees fly ___ flower ___ flower, collecting nectar ___ their hive.", ["from / to / for", "in / on / at", "from / on / to", "at / to / in", "by / by / from"], "A"),
    ],
    "responses": {
        "bank": ["Me neither.", "So was I.", "Not yet.", "So do I.", "Neither was I."],
        "text": "Anu: I was so tired after the trip.\nTom: 14. _________ I slept for twelve hours.\nAnu: I don't want to travel again for a while.\nTom: 15. _________ Home is the best place.\nAnu: Have you unpacked your bags?\nTom: 16. _________ They're still in the hall.",
        "answers": ["B", "A", "C"],
    },
    "transform": [
        ("It's too cold to go swimming.\n**enough**", ["It isn't warm enough to go swimming.", "It isn't enough warm to go swimming.", "It's warm enough to go swimming.", "It isn't cold enough to go swimming.", "Enough cold it is to go swimming."], "A"),
        ("\"I'll help you,\" he said to me.\n**offered**", ["He offered to help me.", "He offered helping me.", "He offered me that he helps.", "He offered me to helped.", "He offered help to me tomorrow."], "A"),
    ],
    "v1": [
        ("We couldn't see the road because of the thick ___.", ["fog", "frost", "hail", "breeze", "thunder"], "A"),
        ("A ___ looks after bees and collects their honey.", ["beekeeper", "butcher", "baker", "plumber", "tailor"], "A"),
        ("___ is the study of living things.", ["Biology", "Geography", "Chemistry", "Physics", "History"], "A"),
        ("Please switch ___ the lights when you leave the room.", ["off", "out", "down", "away", "over"], "A"),
    ],
    "homonym": {
        "bank": ["just", "blond", "show", "fun", "fair"],
        "text": "23. It's not _________ that he got more cake than me.\n24. We rode on the big wheel at the _________.\n25. She has _________ hair and blue eyes.",
        "answers": ["E", "E", "E"],
    },
    "situations": [
        ("What will you need when you go camping in the mountains?", ["a tent and a sleeping bag", "a swimsuit only", "a business suit", "high-heeled shoes", "a laptop and a printer"], "A"),
        ("What expression is used for *postponing something*?", ["to put off", "to put on", "to put up", "to put out", "to put away"], "A"),
    ],
    "affixes": [
        ("A(n) ___ + honest answer / loyal friend / obedient child", ["dis-", "un-", "in-", "im-", "mis-"], "A"),
        ("A comfort(___) + chair / bed / journey", ["-able", "-ful", "-ous", "-ive", "-ly"], "A"),
    ],
    "prepositions": [
        ("The museum is famous ___ its collection of dinosaur bones.", ["for", "of", "with", "about", "by"], "A"),
        ("I'm not very good ___ remembering names.", ["at", "in", "on", "with", "for"], "A"),
    ],
    "idioms": [
        ("After the failure, the engineers had to <u>go back to the drawing board</u>.", ["They had to start planning again from the beginning.", "They had to draw pictures.", "They returned to school.", "They bought a new board.", "They finished the project."], "A"),
        ("At eighty, my grandfather is still <u>as fit as a fiddle</u>.", ["He is very healthy.", "He plays the violin.", "He is very thin.", "He is often ill.", "He is very angry."], "A"),
    ],
    "conversation": {
        "instructions": "Read the conversation at a hotel reception and answer the questions.",
        "questions": [
            ("Part 1.\nReceptionist: Good afternoon. How can I help you?\nGuest: I booked a double room for three nights, but your website charged me twice.\nReceptionist: I'm sorry about that. Let me check... Yes, I can see two payments.\n\nWhat is the guest's problem?", ["She paid twice for the same booking.", "The room is too small.", "The hotel has no free rooms.", "She lost her key.", "The website was closed."], "A"),
            ("Part 2.\nReceptionist: I'll cancel the second payment now. It may take three to five days to appear in your account.\nGuest: That's fine, as long as I get it back.\n\nWhat will happen to the second payment?", ["It will be returned within a few days.", "The hotel will keep it.", "It will be paid in cash.", "It will be used for breakfast.", "It will be returned in a month."], "A"),
            ("Part 3.\nGuest: Also, is it possible to have a room away from the street? I'm a very light sleeper.\nReceptionist: Certainly. I'll give you one on the top floor facing the garden. It's much quieter.\n\nWhy does the guest want a different room?", ["She wakes up easily because of noise.", "She wants a view of the street.", "She wants a cheaper room.", "She is afraid of heights.", "She wants to be near the restaurant."], "A"),
        ],
    },
    "phrasal": [
        ("A: What time does your plane leave?\nB: It ___ at six, so I have to be at the airport by four.", ["takes off", "takes up", "takes in", "takes over", "takes after"], "A"),
        ("A: Can you ___ the music ___? I'm trying to study.\nB: Sorry!", ["turn, down", "take, off", "put, on", "give, up", "fill, in"], "A"),
    ],
    "reading": {
        "title": "The $125 Million Mistake",
        "text": "In December 1998, NASA launched the Mars Climate Orbiter, a spacecraft designed to study the weather on Mars. After a journey of more than nine months, it was due to go into orbit around the planet on 23 September 1999. Instead, it came much too close to Mars and was lost. It probably either burned up in the atmosphere or flew off into space.\n\nAt first, nobody understood what had gone wrong. The engineers checked their calculations again and again. The answer, when they found it, was surprisingly simple. One team had calculated the force of the spacecraft's small engine firings in pounds, a unit used in the United States, while the software of another team expected the numbers in newtons, the metric unit. Nobody had noticed the difference.\n\nBecause of this mismatch, every small correction to the spacecraft's path was slightly wrong. Over many months, the tiny errors added up, until the orbiter was flying far closer to Mars than planned.\n\nThe loss cost around 125 million dollars and years of work. NASA did not blame one person. Instead, it said that the real problem was that the checking process had failed to catch the error. Since then, space agencies have paid much more attention to testing how different teams' work fits together.\n\nToday the story is told in engineering classes all over the world. Its message is simple: the biggest disasters are not always caused by big mistakes, but by small ones that nobody checks.",
        "questions": [
            ("What is the article about?", ["How a mix-up over units caused the loss of a spacecraft", "The weather on Mars", "The history of NASA", "How to calculate in newtons", "A successful landing on Mars"], "A"),
            ("What was the purpose of the Mars Climate Orbiter?", ["To study the weather on Mars", "To land astronauts on Mars", "To take photos of the Earth", "To test a new engine", "To carry supplies to a space station"], "A"),
            ("What does the article suggest about the cause of the loss?", ["Two teams used different units of measurement.", "The engine exploded.", "Astronauts made a mistake.", "The spacecraft hit a rock.", "The weather on Mars was bad."], "A"),
            ("How did NASA react to the loss?", ["It said the checking process had failed instead of blaming one person.", "It punished one engineer.", "It stopped all missions to Mars.", "It blamed the weather.", "It hid the mistake."], "A"),
            ("What comparison does the article make in its last paragraph?", ["Big disasters and the small mistakes that can cause them", "Pounds and kilograms", "Mars and the Earth", "NASA and other space agencies", "Old and new spacecraft"], "A"),
            ("What is implied about the small errors in the spacecraft's path?", ["Each was tiny, but together they became serious over time.", "They were noticed immediately.", "They helped the spacecraft land.", "They were caused by the weather.", "They did not matter."], "A"),
        ],
    },
    "summary": {
        "bank": ["unless", "while", "as a result", "because", "in spite of"],
        "text": "The Mars Climate Orbiter was lost in 1999. One team used pounds, 45. _________ another team's software expected newtons. 46. _________, every small correction to the spacecraft's path was slightly wrong. NASA did not blame one engineer 47. _________ it believed the checking process had failed.",
        "answers": ["B", "C", "D"],
    },
    "part2": {
        "2.1": {"text": "Honeybees live in large colonies that can contain tens of thousands of insects. Each colony has a single queen, whose main job is to lay eggs, while the worker bees do almost everything else. They (a) _________ the young, build the wax comb and defend the hive. When a worker finds a good source of flowers, she returns to the hive and performs a special \"waggle dance\". The direction and length of the dance tell the other bees (b) _________ where the food is. Bees are also extremely (c) _________ to farmers, because they carry pollen from one flower to another. Without this (d) _________, many fruits and vegetables could not grow. Sadly, bee numbers have fallen in many parts of the world, partly because of disease and the (e) _________ use of chemicals on farms. Scientists warn that protecting bees is (f) _________ for our future food supply.",
                "gaps": [(["food", "fed", "feeding", "feeder", "feed"], 5),
                         (["exact", "exactly", "exactness", "exacting", "exacted"], 2),
                         (["use", "usage", "usefully", "useful", "user"], 4),
                         (["pollination", "pollinate", "pollinator", "pollinated", "pollinating"], 1),
                         (["wide", "widely", "widespread", "widen", "width"], 3),
                         (["essence", "essentially", "essentials", "essential", "essentiality"], 4)]},
        "2.2": (["colony", "to lay", "to defend", "source", "direction", "pollen", "disease", "supply"],
                ["the way in which something moves or points", "an illness", "to produce eggs from the body", "a fine yellow powder made by flowers", "a group of animals or insects living together", "an amount of something that is available to use", "a sweet liquid made by bees", "to protect someone or something from attack", "a place or thing that something comes from", "to fly from place to place without a plan"],
                "53891426"),
        "2.3": {"text": "The hotel stands in a (a) **remote** valley, far from any town. Its rooms are (b) **spacious** and bright, and the staff are (c) **courteous** and helpful. Guests can (d) **wander** through the gardens or relax in the (e) **cosy** library. Many visitors say it is the most (f) **tranquil** place they have ever stayed.",
                "gaps": [(["busy", "distant", "modern", "narrow", "famous"], 2),
                         (["large", "dark", "cheap", "noisy", "cold"], 1),
                         (["rude", "tired", "polite", "strict", "shy"], 3),
                         (["rush", "run", "drive", "climb", "stroll"], 5),
                         (["cold", "huge", "crowded", "comfortable", "old"], 4),
                         (["peaceful", "exciting", "noisy", "dangerous", "expensive"], 1)]},
    },
})

# ---------------------------------------------------------------- Mock 4
MOCKS.append({
    "theme": "A television hoax, glaciers and a job interview",
    "g1": [
        ("I've got ___ homework tonight, so I can't go out.", ["a lot of", "many", "a few", "few", "an"], "A"),
        ("Nobody called while I was out, ___?", ["did they", "didn't they", "did he", "didn't he", "does anybody"], "A"),
        ("It's starting to rain. You ___ take an umbrella.", ["had better", "would better", "had to better", "better to", "should to"], "A"),
        ("I forgot ___ my homework, so the teacher was angry.", ["to bring", "bringing", "bring", "brought", "brings"], "A"),
        ("She sings ___ an angel.", ["like", "as", "same", "similar", "alike"], "A"),
        ("We have a ___ table in the kitchen.", ["large round brown wooden", "round large wooden brown", "brown wooden large round", "wooden round brown large", "large brown wooden round"], "A"),
    ],
    "g2": [
        ("If it ___ tomorrow, we ___ the picnic.", ["rains / will cancel", "will rain / cancel", "rained / will cancel", "rains / would cancel", "would rain / cancel"], "A"),
        ("I applied to three universities, all of ___ accepted me.", ["which", "whom", "them", "that", "what"], "A"),
        ("\"Why did you leave your last job?\" the interviewer asked.\nThe interviewer asked ___.", ["me why I had left my last job", "me why had I left my last job", "why did I leave my last job", "me why I leave my last job", "me why you had left your last job"], "A"),
        ("She got the job ___ her lack of experience.", ["in spite of", "although", "even though", "because", "so that"], "A"),
        ("I ___ at the optician's yesterday.", ["had my eyes tested", "tested my eyes", "have my eyes tested", "had tested my eyes", "got tested my eyes"], "A"),
        ("When I ___ home, my parents ___ dinner without me.", ["got / had already eaten", "get / ate", "had got / ate", "got / have eaten", "was getting / eat"], "A"),
        ("One day ___ young man walked ___ the forest and found a cave ___ the hill.", ["a / through / on", "an / through / on", "the / at / for", "a / at / for", "– / through / on"], "A"),
    ],
    "responses": {
        "bank": ["Nor do I.", "So did I.", "I'm afraid so.", "Yes, I'd love to.", "So am I."],
        "text": "Oyun: I'm so nervous about my job interview tomorrow.\nBat: 14. _________ Mine is at ten o'clock.\nOyun: I don't really know what to wear.\nBat: 15. _________ Maybe we should ask my sister.\nOyun: Do you think they'll ask difficult questions?\nBat: 16. _________ But we've practised a lot.",
        "answers": ["E", "A", "C"],
    },
    "transform": [
        ("She started working here in 2020.\n**since**", ["She has worked here since 2020.", "She works here since 2020.", "She worked here since 2020.", "She has been worked here since 2020.", "Since 2020 she works here."], "A"),
        ("\"Don't be late,\" the teacher told us.\n**not**", ["The teacher told us not to be late.", "The teacher told us to not being late.", "The teacher told us don't be late.", "The teacher said us not to be late.", "The teacher told not us to be late."], "A"),
    ],
    "v1": [
        ("Small balls of ice that fall from the sky are called ___.", ["hail", "fog", "dew", "mist", "breeze"], "A"),
        ("A ___ writes articles for a newspaper.", ["journalist", "librarian", "cashier", "mechanic", "plumber"], "A"),
        ("___ is the study of how the human mind works.", ["Psychology", "Geology", "Astronomy", "Archaeology", "Botany"], "A"),
        ("I filled ___ the application form and sent it.", ["in", "at", "on", "by", "of"], "A"),
    ],
    "homonym": {
        "bank": ["clock", "see", "mind", "view", "watch"],
        "text": "23. I got a new _________ for my birthday; it tells the time and counts my steps.\n24. Let's _________ a film tonight.\n25. Could you _________ my bag for a minute while I buy a ticket?",
        "answers": ["E", "E", "E"],
    },
    "situations": [
        ("What will you wear to a job interview?", ["a smart suit", "pyjamas", "a swimsuit", "a football shirt", "slippers"], "A"),
        ("What expression is used for *tricking someone as a joke*?", ["to play a trick on someone", "to play a song", "to play it safe", "to play fair", "to play down"], "A"),
    ],
    "affixes": [
        ("A(n) ___ + understanding / spelled word / leading advertisement", ["mis-", "dis-", "un-", "in-", "re-"], "A"),
        ("A care(___) + driver / mistake / attitude", ["-less", "-ful", "-ing", "-ous", "-ive"], "A"),
    ],
    "prepositions": [
        ("She has applied ___ a job at the bank.", ["for", "to", "at", "on", "in"], "A"),
        ("This book was written ___ a famous journalist.", ["by", "from", "with", "of", "at"], "A"),
    ],
    "idioms": [
        ("He was so nervous in the interview that he <u>got his wires crossed</u> and answered the wrong question.", ["He misunderstood something.", "He got an electric shock.", "He crossed the road.", "He fixed a cable.", "He became angry."], "A"),
        ("My sister always <u>has her head in the clouds</u>.", ["She is a daydreamer and not very practical.", "She is a pilot.", "She is very tall.", "She is very practical.", "She is afraid of flying."], "A"),
    ],
    "conversation": {
        "instructions": "Read the conversation from a job interview and answer the questions.",
        "questions": [
            ("Part 1.\nInterviewer: So, why do you want to work for our company?\nSaraa: I've used your apps for years, and I'd love to help design them.\nInterviewer: Have you done any design work before?\nSaraa: Yes, I designed the website for my university's sports club.\n\nWhat experience does Saraa have?", ["She designed a website for a sports club.", "She has worked for the company before.", "She has never designed anything.", "She coached a sports team.", "She sold apps."], "A"),
            ("Part 2.\nInterviewer: The job involves working in a team. How do you deal with disagreements?\nSaraa: I listen to everyone's ideas first, and then we try to find a solution together.\n\nHow does Saraa deal with disagreements?", ["She listens to everyone and looks for a shared solution.", "She always follows her own ideas.", "She asks the manager to decide.", "She avoids the team.", "She leaves the meeting."], "A"),
            ("Part 3.\nInterviewer: When could you start?\nSaraa: I finish my exams on the 20th of June, so I could start at the beginning of July.\n\nWhen can Saraa start work?", ["At the beginning of July", "On the 20th of June", "Immediately", "In September", "In a year"], "A"),
        ],
    },
    "phrasal": [
        ("A: The meeting starts at nine.\nB: OK, I'll ___ at about quarter to.", ["turn up", "turn down", "turn over", "turn off", "turn in"], "A"),
        ("A: My bike has a flat tyre.\nB: I'll help you ___ it ___.", ["pump, up", "blow, out", "give, away", "take, after", "make, out"], "A"),
    ],
    "reading": {
        "title": "The Spaghetti Harvest",
        "text": "On 1 April 1957, viewers of Panorama, one of the most respected current affairs programmes on British television, saw an unusual report. It showed a family in southern Switzerland happily picking long strands of spaghetti from trees and laying them in the sun to dry.\n\nThe serious voice of the presenter explained that a mild winter had produced an excellent spaghetti crop that year. He even mentioned that a small insect, which had damaged spaghetti in the past, had almost disappeared. Everything looked and sounded like a real news report.\n\nAt that time, spaghetti was not a common food in Britain, and many people had never seen it uncooked. Hundreds of viewers phoned the BBC afterwards. Some asked whether the story was true; others wanted to know how they could grow their own spaghetti tree. According to a popular account, they were told to place a piece of spaghetti in a tin of tomato sauce and hope for the best.\n\nNot everyone was amused. Some viewers complained that a serious programme should not be used for jokes. Most, however, enjoyed being fooled, and the report is now remembered as one of the greatest April Fool's Day jokes ever broadcast.\n\nThe story is often used today to show how easily people believe information when it comes from a trusted source. It reminds us that even a respected programme can, sometimes, be pulling our leg.",
        "questions": [
            ("What is the article about?", ["A famous April Fool's joke on television", "How to grow spaghetti", "Farming in Switzerland", "The life of a television presenter", "Italian cooking"], "A"),
            ("Why did many British viewers believe the report?", ["Spaghetti was not common in Britain then, and the programme was respected.", "They had visited Switzerland.", "They were farmers.", "They had read about it in newspapers.", "The presenter said it was true news from Italy."], "A"),
            ("What does the article suggest about the BBC's answer to people who wanted to grow spaghetti?", ["It continued the joke.", "It apologized immediately.", "It sent them seeds.", "It told them to visit Switzerland.", "It ignored them."], "A"),
            ("How did some viewers react?", ["They complained that a serious programme was used for a joke.", "They grew spaghetti trees.", "They moved to Switzerland.", "They stopped eating spaghetti.", "They became presenters."], "A"),
            ("What is the main lesson of the story, according to the last paragraph?", ["People easily believe information from a trusted source.", "Spaghetti really grows on trees.", "Television is always wrong.", "Jokes are never funny.", "Swiss families are very honest."], "A"),
            ("What is implied about most viewers' reactions?", ["Most viewers were amused rather than angry.", "Everyone was angry.", "Nobody noticed the report.", "The programme lost all its viewers.", "The presenter was punished."], "A"),
        ],
    },
    "summary": {
        "bank": ["although", "despite", "so", "as soon as", "because"],
        "text": "In 1957, a BBC programme showed a family picking spaghetti from trees. Many viewers believed it 45. _________ spaghetti was not a common food in Britain at the time. 46. _________ some people complained, most viewers enjoyed the joke. The report was 47. _________ convincing that hundreds of people phoned the BBC.",
        "answers": ["E", "A", "C"],
    },
    "part2": {
        "2.1": {"text": "Glaciers are huge masses of ice that move (a) _________ down mountains or across land. They form in places where more snow falls in winter than (b) _________ in summer. Over many years, the snow is pressed into thick, solid ice. Although glaciers seem to stand still, most move between a few centimetres and a few metres every day. As they slide, they (c) _________ rocks with them and carve deep valleys. Glaciers and ice sheets store about two-thirds of the world's fresh water, and millions of people (d) _________ on glacier meltwater for drinking and farming. Today, however, most glaciers are (e) _________ because of rising temperatures, and scientists are (f) _________ about the future water supply in many regions.",
                "gaps": [(["slowness", "slow", "slowest", "slowly", "slower"], 4),
                         (["melt", "melts", "melted", "melting", "meltwater"], 2),
                         (["carrier", "carriage", "carry", "carried", "carrying"], 3),
                         (["dependent", "dependence", "dependable", "depend", "independently"], 4),
                         (["shrink", "shrunk", "shrinkage", "shrank", "shrinking"], 5),
                         (["concern", "concerned", "concerning", "concerns", "concernedly"], 2)]},
        "2.2": (["mass", "to press", "solid", "to slide", "to carve", "fresh water", "to store", "region"],
                ["to cut a shape into a hard material", "an area of a country or of the world", "to move smoothly over a surface", "a large amount of a substance without a clear shape", "hard and firm, not liquid or gas", "very hot liquid rock", "to keep something so that you can use it later", "to push firmly against something", "water that is not salty", "to fall as rain"],
                "48531972"),
        "2.3": {"text": "Before a job interview, it is (a) **vital** to find out about the company. On the day, try to arrive (b) **punctually** and dress (c) **appropriately**. During the interview, answer questions (d) **honestly** and keep your answers (e) **concise**. Finally, (f) **demonstrate** that you are enthusiastic about the job.",
                "gaps": [(["optional", "essential", "impossible", "harmful", "boring"], 2),
                         (["late", "slowly", "quietly", "on time", "loudly"], 4),
                         (["suitably", "strangely", "cheaply", "carelessly", "brightly"], 1),
                         (["quickly", "rudely", "truthfully", "shyly", "angrily"], 3),
                         (["long and detailed", "funny", "rude", "false", "short and clear"], 5),
                         (["hide", "show", "deny", "forget", "doubt"], 2)]},
    },
})

# ---------------------------------------------------------------- Mock 5
MOCKS.append({
    "theme": "Apollo 13, the human heart and a surprise party",
    "g1": [
        ("There are only ___ biscuits left; we should buy some more.", ["a few", "a little", "much", "less", "any"], "A"),
        ("Your parents are coming to the party, ___?", ["aren't they", "are they", "don't they", "won't they", "isn't it"], "A"),
        ("She ___ be at home; the lights are on.", ["must", "can't", "mustn't", "needn't", "shouldn't"], "A"),
        ("I'm looking forward ___ you at the party.", ["to seeing", "to see", "seeing", "see", "for seeing"], "A"),
        ("This phone is ___ to mine, but it's a little bigger.", ["similar", "same", "like", "as", "alike"], "A"),
        ("Mum baked a ___ cake.", ["delicious big round chocolate", "big delicious chocolate round", "round big delicious chocolate", "chocolate delicious round big", "delicious chocolate big round"], "A"),
    ],
    "g2": [
        ("If I ___ you, I ___ the invitation.", ["were / would accept", "am / will accept", "was / will accept", "were / will accept", "would be / accepted"], "A"),
        ("She invited twenty friends, most of ___ came.", ["whom", "who", "which", "them", "that"], "A"),
        ("\"Will you be at the party?\" Anu asked me.\nAnu asked me ___.", ["if I would be at the party", "if would I be at the party", "will you be at the party", "if I would been at the party", "if you would be at the party"], "A"),
        ("___ we had little money, we organized a wonderful party.", ["Even though", "Despite", "In spite of", "Because of", "So"], "A"),
        ("We ___ for the party by a professional baker.", ["had a cake made", "made a cake", "have made a cake", "had made a cake", "a cake made"], "A"),
        ("By the time the guests ___, we ___ all the decorations.", ["arrived / had put up", "arrive / put up", "had arrived / put up", "arrived / have put up", "were arriving / put up"], "A"),
        ("In 1970, ___ oxygen tank exploded ___ the way ___ the Moon.", ["an / on / to", "a / in / at", "the / at / for", "an / in / on", "– / on / to"], "A"),
    ],
    "responses": {
        "bank": ["Yes, please.", "So am I.", "So have I.", "Neither can I.", "So do I."],
        "text": "Anu: I can't wait for the party on Saturday!\nBold: 14. _________ It's going to be great.\nAnu: I've already bought a present for Saraa.\nBold: 15. _________ I got her a book.\nAnu: Would you like some help with the decorations?\nBold: 16. _________ That would be great.",
        "answers": ["D", "C", "A"],
    },
    "transform": [
        ("It's a long time since I last saw her.\n**for**", ["I haven't seen her for a long time.", "I didn't see her for a long time.", "I haven't seen her since a long time.", "I don't see her for a long time.", "For a long time I saw her."], "A"),
        ("Perhaps he has missed the train.\n**might**", ["He might have missed the train.", "He might miss the train yesterday.", "He might has missed the train.", "He might be missed the train.", "He might to have missed the train."], "A"),
    ],
    "v1": [
        ("A sudden bright flash of light in the sky during a storm is ___.", ["lightning", "thunder", "hail", "a rainbow", "frost"], "A"),
        ("A ___ prepares food in a restaurant kitchen.", ["chef", "waiter", "cashier", "porter", "host"], "A"),
        ("___ is the study of the past through the objects people left behind.", ["Archaeology", "Astronomy", "Geology", "Ecology", "Botany"], "A"),
        ("Could you print ___ two copies of this document?", ["out", "up", "in", "on", "at"], "A"),
    ],
    "homonym": {
        "bank": ["gift", "here", "present", "give", "attend"],
        "text": "23. She gave me a lovely birthday _________.\n24. All the students were _________ at the meeting.\n25. Who is going to _________ the prize to the winner?",
        "answers": ["C", "C", "C"],
    },
    "situations": [
        ("What will you take with you to a friend's birthday party?", ["a present", "a fishing rod", "a passport", "a school bag", "a toothbrush"], "A"),
        ("What expression is used for *raising glasses to celebrate someone*?", ["to propose a toast", "to break the ice", "to blow out the candles", "to throw a party", "to pay the bill"], "A"),
    ],
    "affixes": [
        ("A(n) ___ + rational fear / regular verb / responsible driver", ["ir-", "un-", "in-", "im-", "dis-"], "A"),
        ("A friend(___) + neighbour / smile / place", ["-ly", "-ful", "-ous", "-able", "-ive"], "A"),
    ],
    "prepositions": [
        ("Thank you ___ inviting me to your party.", ["for", "of", "about", "to", "with"], "A"),
        ("The astronauts depended ___ the engineers on the ground.", ["on", "of", "from", "at", "with"], "A"),
    ],
    "idioms": [
        ("When Anu saw her surprise party, she was <u>over the moon</u>.", ["She was extremely happy.", "She was very angry.", "She flew away.", "She was confused.", "She was frightened."], "A"),
        ("Let's <u>push the boat out</u> for Mum's fiftieth birthday.", ["Let's spend a lot and celebrate in a big way.", "Let's go sailing.", "Let's push a boat into the river.", "Let's have a small, cheap party.", "Let's cancel the party."], "A"),
    ],
    "conversation": {
        "instructions": "Read the conversation about planning a surprise party and answer the questions.",
        "questions": [
            ("Part 1.\nBold: Saraa's birthday is next Saturday. Shall we organize a surprise party?\nAnu: Great idea! But where? My flat is too small for twenty people.\nBold: My uncle has a café. He said we could use it in the evening for free.\n\nWhere will the party probably be held?", ["In Bold's uncle's café", "In Anu's flat", "In Saraa's house", "In a park", "At school"], "A"),
            ("Part 2.\nAnu: What about food?\nBold: Everyone can bring one dish. That way, it won't cost anyone too much.\n\nHow will they organize the food?", ["Each guest will bring one dish.", "Bold's uncle will cook.", "They will order pizza.", "Anu will cook everything.", "There won't be any food."], "A"),
            ("Part 3.\nAnu: How will we keep it a secret? Saraa always notices everything.\nBold: I'll invite her to the café for a quiet coffee. She won't suspect a thing.\n\nHow will Bold get Saraa to the party?", ["By inviting her for a quiet coffee", "By telling her about the party", "By sending her a card", "By asking Anu to bring her", "By meeting her at school"], "A"),
        ],
    },
    "phrasal": [
        ("A: Why are you smiling?\nB: I've just ___ an old friend in the supermarket.", ["run into", "run out", "run over", "run off", "run up"], "A"),
        ("A: It's freezing in here.\nB: ___ your coat ___, then.", ["Put, on", "Take, off", "Give, up", "Turn, down", "Bring, back"], "A"),
    ],
    "reading": {
        "title": "\"Houston, We've Had a Problem\"",
        "text": "In April 1970, Apollo 13 was on its way to the Moon with three astronauts on board: Jim Lovell, Jack Swigert and Fred Haise. It was supposed to be NASA's third Moon landing. Nearly 56 hours after launch, however, one of the spacecraft's oxygen tanks exploded, damaging the main power supply.\n\n\"Houston, we've had a problem,\" Swigert reported calmly to Mission Control. The crew soon realised that the main part of the spacecraft could no longer support them. The Moon landing was cancelled, and the only goal now was to bring the astronauts home alive.\n\nThe crew moved into the small lunar module, which had been designed to keep two people alive on the Moon for about two days. Now it had to support three people for almost four days. It became cold, damp and uncomfortable, and the air began to fill with carbon dioxide. On the ground, engineers used only materials that were available on board, including plastic bags, cardboard and tape, to design a device that cleaned the air. The astronauts followed their instructions and built it.\n\nOn 17 April 1970, the crew splashed down safely in the Pacific Ocean. Although the mission did not reach its goal, it became known as a \"successful failure\", because the team had solved a series of problems under enormous pressure.\n\nToday the story is remembered as an example of calm teamwork. The astronauts and the engineers on the ground never stopped working together, even when the situation looked hopeless.",
        "questions": [
            ("What is the article about?", ["How the crew of a damaged spacecraft returned safely", "The first Moon landing", "How to become an astronaut", "The history of the Pacific Ocean", "A rocket that failed on the ground"], "A"),
            ("What was the original purpose of Apollo 13?", ["To land on the Moon", "To test oxygen tanks", "To study the Pacific Ocean", "To fly around Mars", "To repair a satellite"], "A"),
            ("What does the article suggest about Swigert's report?", ["He spoke calmly although the problem was serious.", "He was panicking.", "He was joking.", "He didn't know about the explosion.", "He wanted to continue to the Moon."], "A"),
            ("What did the astronauts do to clean the air?", ["They built a device that engineers designed from materials on board.", "They opened the windows.", "They returned to the main part of the spacecraft.", "They used new equipment sent from Earth.", "They landed on the Moon."], "A"),
            ("What comparison is made between the lunar module's design and its real use?", ["It was designed for two people for about two days but had to support three for almost four.", "It was bigger than the main spacecraft.", "It was designed to land in the Pacific Ocean.", "It was warmer than expected.", "It was designed for four people."], "A"),
            ("What is implied by the phrase \"successful failure\"?", ["The mission failed its goal but succeeded in saving the crew.", "The mission was a complete success.", "The Moon landing was successful.", "NASA was angry with the crew.", "The engineers failed."], "A"),
        ],
    },
    "summary": {
        "bank": ["unless", "even though", "instead of", "so that", "after"],
        "text": "Apollo 13 was travelling to the Moon in 1970. 45. _________ an oxygen tank exploded, the Moon landing was cancelled. The crew moved into the lunar module, 46. _________ it had been designed for only two people. Engineers on the ground designed a device from materials on board 47. _________ the astronauts could clean the air.",
        "answers": ["E", "B", "D"],
    },
    "part2": {
        "2.1": {"text": "The human heart is a muscle about the size of a fist. It beats around 100,000 times a day, (a) _________ blood through a network of vessels that would stretch for tens of thousands of kilometres if they were laid end to end. Blood carries oxygen and nutrients to every cell and removes waste. The heart has four chambers, and valves between them make sure that blood flows in only one (b) _________. A healthy adult heart usually beats between 60 and 100 times a minute at rest, but it can beat much faster during (c) _________ exercise. Doctors say that regular physical activity, a (d) _________ diet and not smoking are the best ways to keep the heart strong. Heart disease is still one of the most common causes of death in the world, yet many cases are (e) _________ if people change their habits early. Looking after your heart is one of the most (f) _________ things you can do for your health.",
                "gaps": [(["pump", "pumping", "pumped", "pumps", "pumper"], 2),
                         (["director", "directly", "direct", "direction", "directive"], 4),
                         (["intense", "intensity", "intensify", "intensely", "intensities"], 1),
                         (["balance", "balancing", "balances", "balanced", "unbalance"], 4),
                         (["prevent", "prevention", "preventable", "preventive", "preventing"], 3),
                         (["valuation", "valuably", "values", "value", "valuable"], 5)]},
        "2.2": (["fist", "vessel", "to stretch", "nutrient", "chamber", "valve", "at rest", "habit"],
                ["something you do regularly, often without thinking", "a tube that carries blood through the body", "a doctor who treats children", "not moving or active", "a hand with the fingers closed tightly", "a substance that living things need to grow and stay healthy", "an enclosed space inside the body or a machine", "a sudden pain in the chest", "to reach or continue over a distance", "a part that opens and closes to control the flow of a liquid"],
                "52967041"),
        "2.3": {"text": "For my grandmother's eightieth birthday, we held a (a) **lavish** party. Relatives (b) **gathered** from all over the country, and the house was (c) **packed** with people. My grandmother was (d) **astonished** when she walked in. She gave a (e) **brief** speech to thank everyone, and we all agreed that it was a truly (f) **memorable** evening.",
                "gaps": [(["small and quiet", "boring", "expensive and generous", "sad", "cheap"], 3),
                         (["came together", "left", "argued", "waited", "slept"], 1),
                         (["empty", "clean", "crowded", "dark", "cold"], 3),
                         (["bored", "angry", "tired", "disappointed", "amazed"], 5),
                         (["long", "short", "loud", "sad", "boring"], 2),
                         (["forgettable", "ordinary", "tiring", "noisy", "unforgettable"], 5)]},
    },
})
