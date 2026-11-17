"""TOEFL iBT practice test 06. Structure copied from form01.py; content plan: AUTHORING.md, section 5, "Form 06"."""

from common import build, lcr, q

# ===============================================================================================================
# READING
# ===============================================================================================================
READING_ROUTER = [
    {
        "type": "complete_words",
        "subject": "Oceanography",
        "text": (
            "Tides are the regular rise and fall of the sea along a coast. "
            "The Moon's gra[vity] pulls oc[ean] water tow[ard] it, a[nd] the wa[ter] rises in[to] a bulge. "
            "A sec[ond] bulge fo[rms] on t[he] opposite si[de] of Earth. "
            "As Earth turns, most coasts pass through both bulges, so they have two high tides and two low tides "
            "each day. "
            "The Sun also plays a part, and tides are strongest when the Sun, Earth, and Moon form a line."
        ),
    },
    {
        "type": "complete_words",
        "subject": "Business",
        "text": (
            "Advertising is any paid message that a company uses to tell the public about its products or "
            "services. "
            "Companies pl[ace] advertisements o[n] television, i[n] newspapers, a[nd] on webs[ites] to re[ach] as "
            "ma[ny] people a[s] possible. "
            "A succe[ssful] advertisement cat[ches] attention and persuades consumers to choose one brand over "
            "another. "
            "Because advertising costs money, businesses study their customers carefully before deciding where "
            "and when a message should appear."
        ),
    },
    {
        "type": "daily_life",
        "format": "notice",
        "heading": "Read a sign.",
        "text": """
ELEVATOR MAINTENANCE

The passenger elevator in Juniper Court will be out of service on Thursday, October 15, from 8:00 a.m. to 2:00 p.m. for its yearly safety inspection. During these hours, please use the stairs at either end of the hallway. Residents who cannot use the stairs may call the front desk, and a staff member will take them up or down in the service elevator.

Building Management
""".strip(),
        "questions": [
            q("What is the purpose of the sign?",
              "To ask residents to report any problems with the elevator",
              "To tell residents when an elevator will be unavailable",
              "To announce that the stairs will be closed for inspection",
              "To introduce a new staff member at the front desk",
              "B", "purpose",
              "The sign says the passenger elevator 'will be out of service' on one day from 8:00 a.m. to "
              "2:00 p.m."),
            q("What can be inferred about the service elevator?",
              "It will be inspected on the same day.",
              "Residents usually operate it themselves.",
              "It will be working on Thursday morning.",
              "It is at the end of the hallway.",
              "C", "inference",
              "During the inspection hours 'a staff member will take them up or down in the service elevator', "
              "so it must be running then. The stairs, not this elevator, are at the ends of the hallway."),
        ],
    },
    {
        "type": "daily_life",
        "format": "email",
        "heading": "Read an email.",
        "text": """
To: Bashir Karimi
From: Ingrid Solberg, Marlow Garden Center
Subject: Interview for weekend sales assistant

Dear Mr. Karimi,

Thank you for applying for the position of weekend sales assistant. We were impressed by your experience at a flower shop and would like to invite you to an interview on Wednesday, May 6, at 3:30 p.m. It will take place in the office behind the greenhouse and should last about thirty minutes.

Please bring a photo ID and the names of two people who can describe your work. You do not need to print your application again.

If this time does not suit you, please call me at 555-0142 by Monday, and we will find another one. Visitors can park for free in the lot on Quarry Road.

Best regards,
Ingrid Solberg
Hiring Manager
""".strip(),
        "questions": [
            q("Why did Ms. Solberg write to Mr. Karimi?",
              "To arrange a meeting about a job he applied for",
              "To tell him that he has been chosen for a position",
              "To ask him to send a list of his past employers",
              "To explain that the interview has been postponed",
              "A", "purpose",
              "She thanks him for applying and would 'like to invite you to an interview'. No job has been "
              "offered yet."),
            q("What should Mr. Karimi do if he is not free on Wednesday afternoon?",
              "Send an email suggesting two other dates",
              "Come to the garden center on Monday instead",
              "Wait for Ms. Solberg to contact him again",
              "Telephone Ms. Solberg by Monday",
              "D", "detail",
              "'If this time does not suit you, please call me at 555-0142 by Monday.' Monday is the deadline "
              "for calling, not a new interview day."),
            q("Which of the following is NOT mentioned in the email?",
              "How long the interview will last",
              "Where visitors can leave their cars",
              "What Mr. Karimi should wear",
              "Where the interview will take place",
              "C", "negative",
              "The email gives the length ('about thirty minutes'), the parking ('the lot on Quarry Road') and "
              "the place ('the office behind the greenhouse'). Clothing is never mentioned."),
        ],
    },
    {
        "type": "daily_life",
        "format": "text_messages",
        "heading": "Read a chain of text messages.",
        "text": """
Noor (8:05 a.m.): Hi Stefan! Do you still have your graphing calculator? Mine stopped working last night, and my statistics exam is at 1:00 today.
Stefan (8:09 a.m.): I do, and I don't need it today. I'll be in the chemistry lab until noon, though.
Noor (8:10 a.m.): No problem. I can come by the lab at 11:30. Does it need new batteries?
Stefan (8:12 a.m.): I changed them last week. Just bring it back by Thursday evening. I have a quiz on Friday.
""".strip(),
        "questions": [
            q("Why does Noor send a message to Stefan?",
              "To remind him about an exam",
              "To find out where the chemistry lab is",
              "To offer him some new batteries",
              "To ask if she can use something of his",
              "D", "purpose",
              "Her own calculator 'stopped working', and she asks whether Stefan still has his: she wants to "
              "borrow it."),
            q("What can be inferred about Stefan?",
              "He is taking the same statistics exam as Noor.",
              "He expects to use his calculator on Friday.",
              "He will leave the chemistry lab at 11:30.",
              "He forgot to put new batteries in the calculator.",
              "B", "inference",
              "'Just bring it back by Thursday evening. I have a quiz on Friday.' He wants it back in time for "
              "the quiz."),
        ],
    },
    {
        "type": "daily_life",
        "format": "instructions",
        "heading": "Read an instruction card.",
        "text": """
SUNHEARTH 5-CUP RICE COOKER
Quick Start Card

1. Measure the rice with the cup provided. Rinse it under cold water until the water runs clear.
2. Put the rice in the inner pot. Add water up to the line that matches the number of cups (line 2 for two cups).
3. Dry the outside of the pot, place it in the cooker, and close the lid until it clicks.
4. Press COOK. The orange light turns on.
5. When the rice is ready, the cooker switches to KEEP WARM and the green light turns on. Wait ten minutes before opening the lid.

Important:
- Never use metal spoons. They scratch the pot.
- Do not leave rice on KEEP WARM for more than twelve hours.
- Unplug the cooker before cleaning it.
""".strip(),
        "questions": [
            q("According to the card, how much water should be added to the pot?",
              "Enough to reach the matching line",
              "Two cups of water for every cup of rice",
              "Enough to make the water run clear",
              "One full measuring cup for each person",
              "A", "detail",
              "Step 2: 'Add water up to the line that matches the number of cups.' Clear water (step 1) is about "
              "rinsing the rice."),
            q("What should users do when the green light turns on?",
              "Press the COOK button again",
              "Unplug the cooker immediately",
              "Leave the lid closed for a while",
              "Add water up to the next line",
              "C", "detail",
              "Step 5: when the green light turns on, 'wait ten minutes before opening the lid'."),
            q("Which of the following is NOT an instruction on the card?",
              "Washing the rice before cooking it",
              "Stirring the rice while it cooks",
              "Drying the outside of the pot",
              "Unplugging the cooker before cleaning it",
              "B", "negative",
              "Rinsing (step 1), drying the pot (step 3) and unplugging (last line) are all on the card. "
              "Stirring is not."),
        ],
    },
    {
        "type": "academic",
        "subject": "Linguistics",
        "title": "Two Languages in One Mind",
        "paragraphs": [
            "For a long time, many people assumed that bilingual speakers kept their two languages in separate "
            "mental boxes and simply opened one at a time. Recent research has shown that this picture is wrong. "
            "When bilinguals hear or read a word in one language, related words in their other language become "
            "active as well, even if that language is not being used.",
            "This means that a bilingual brain is constantly managing competition. To speak in one language, it "
            "must select the right words and hold back those from the other. Some researchers believe that this "
            "daily practice strengthens general mental skills, such as focusing attention and switching between "
            "tasks. In several experiments, bilingual children and adults performed slightly better than "
            "monolinguals on tasks that required ignoring distracting information.",
            "The evidence is not conclusive, however. Other studies, including some with very large groups of "
            "participants, have found no such advantage, and the debate continues. Managing two languages also "
            "has small costs. Bilinguals usually know fewer words in each language than people who speak only "
            "that language, and they more often feel that a word is \"on the tip of the tongue.\" Most "
            "researchers agree that these costs are minor compared with the benefit of being able to communicate "
            "in two languages.",
        ],
        "questions": [
            q("According to the passage, what happens when bilinguals read a word in one of their languages?",
              "They translate it silently into the other language.",
              "They need more time than monolinguals to recognize it.",
              "Connected words in their other language are activated too.",
              "Their other language is switched off until it is needed.",
              "C", "factual",
              "Paragraph 1: 'related words in their other language become active as well, even if that language "
              "is not being used'."),
            q('The word "conclusive" in the passage is closest in meaning to',
              "decisive", "available", "positive", "original",
              "A", "vocabulary",
              "Conclusive evidence settles a question. The evidence here does not, because 'the debate "
              "continues'."),
            q("Which of the following is NOT mentioned in the passage as a possible effect of using two "
              "languages?",
              "Being better at ignoring distractions",
              "Knowing fewer words in each language",
              "Failing to recall a familiar word more often",
              "Reading more slowly in both languages",
              "D", "negative_factual",
              "Paragraph 2 mentions ignoring distracting information; paragraph 3 mentions fewer words and the "
              "tip-of-the-tongue feeling. Reading speed is not discussed."),
            q("What can be inferred about the studies with very large groups of participants?",
              "They were carried out only with bilingual children.",
              "They weaken the claim that bilingualism improves thinking skills.",
              "They showed that bilinguals know more words than monolinguals do.",
              "They proved that the two languages are stored separately.",
              "B", "inference",
              "These studies 'found no such advantage', which is why the evidence for stronger mental skills is "
              "'not conclusive'."),
            q('Why does the author mention the feeling that a word is "on the tip of the tongue"?',
              "To show that bilinguals forget their first language over time",
              "To explain how the brain selects words in the right language",
              "To argue that learning a second language is not worth the effort",
              "To illustrate a small disadvantage of managing two languages",
              "D", "purpose",
              "The sentence follows 'Managing two languages also has small costs' and gives two examples of "
              "those costs."),
        ],
    },
]

READING_LOWER = [
    {
        "type": "complete_words",
        "subject": "Biology",
        "text": (
            "Bird migration is the regular journey that many birds make each year between a summer home and a "
            "winter home. "
            "Before win[ter] comes, th[ey] fly t[o] warmer ar[eas] where fo[od] is ea[sy] to fi[nd]. "
            "In spr[ing], they ret[urn] home t[o] build nests and raise their young. "
            "Some birds travel thousands of kilometers and use the Sun, the stars, and Earth's magnetic field to "
            "find their way."
        ),
    },
    {
        "type": "daily_life",
        "format": "receipt",
        "heading": "Read a receipt.",
        "text": """
BLUEBELL DRY CLEANERS
27 Larkspur Lane

Receipt No. 3381
Customer: P. Moreno
Date in: Monday, June 8

1 winter coat ........ $14.00
2 shirts ........ $6.00
1 dress ........ $9.00
Total paid: $29.00

Ready for pickup: Thursday, June 11, after 4:00 p.m.

Please bring this receipt when you collect your clothes. Items not collected within 30 days will be given to charity.
""".strip(),
        "questions": [
            q("When can the customer collect the clothes?",
              "From 4:00 p.m. on Thursday",
              "On Monday, June 8",
              "Before 4:00 p.m. on Thursday",
              "On Wednesday, June 10",
              "A", "detail",
              "'Ready for pickup: Thursday, June 11, after 4:00 p.m.' Monday is the day the clothes were "
              "brought in."),
            q("What does the customer need to bring to the shop?",
              "A photo ID",
              "Twenty-nine dollars",
              "A bag for the clothes",
              "The receipt",
              "D", "detail",
              "'Please bring this receipt when you collect your clothes.' The $29.00 is marked 'Total paid', so "
              "nothing more is owed."),
        ],
    },
    {
        "type": "daily_life",
        "format": "webpage",
        "heading": "Read a web page.",
        "text": """
STONEBRIDGE COMMUNITY CENTER
Evening Language Classes - Fall Term

Learn a new language with friendly teachers! Classes meet once a week for ten weeks, starting the week of September 14.

Spanish for Beginners: Mondays, 6:00-7:30 p.m.
French for Beginners: Tuesdays, 6:00-7:30 p.m.
Japanese for Beginners: Wednesdays, 7:00-8:30 p.m.
Spanish Conversation (Level 2): Thursdays, 6:00-7:30 p.m.

Cost: $80 per class. The price includes the textbook. Students and people over 65 pay $60.

Each class has room for 12 people. Sign up online or at the front desk by September 7. Not sure about your level? Come to our free open evening on September 2 at 6:00 p.m. and talk to the teachers.
""".strip(),
        "questions": [
            q("Which class finishes latest in the evening?",
              "Spanish for Beginners",
              "Japanese for Beginners",
              "French for Beginners",
              "Spanish Conversation",
              "B", "detail",
              "Japanese runs from 7:00 to 8:30 p.m.; the other three classes end at 7:30 p.m."),
            q("How much does a university student pay for one class?",
              "$60", "$65", "$80", "$12",
              "A", "detail",
              "'Students and people over 65 pay $60.' The full price is $80; 65 is an age and 12 is the class "
              "size."),
            q("Why would someone go to the open evening on September 2?",
              "To pay for a class",
              "To buy a textbook",
              "To find out which class is right for them",
              "To take the first lesson of the term",
              "C", "inference",
              "'Not sure about your level? Come to our free open evening ... and talk to the teachers.'"),
        ],
    },
]

READING_UPPER = [
    {
        "type": "complete_words",
        "subject": "Anthropology",
        "text": (
            "Cultural diffusion is the process by which ideas, customs, and technologies spread from one society "
            "to another. "
            "It of[ten] occurs thr[ough] trade, migr[ation], and conq[uest], which br[ing] different gro[ups] "
            "into con[tact]. "
            "The num[bers] we u[se] today, f[or] example, were developed in India and reached Europe through "
            "the Arab world. "
            "Societies rarely copy what they borrow exactly; instead, they adapt new ideas to fit their own "
            "needs and traditions."
        ),
    },
    {
        "type": "academic",
        "subject": "Engineering",
        "title": "Learning from Nature's Designs",
        "paragraphs": [
            "Engineers facing a difficult problem sometimes look for an answer in an unexpected place: the "
            "natural world. This approach is known as biomimicry. Over millions of years, evolution has tested "
            "countless designs, and those that survive tend to be efficient. Rather than starting from nothing, "
            "a designer can study how a plant or animal has already solved a similar problem.",
            "The best-known example is Velcro. In the 1940s, the Swiss engineer George de Mestral noticed that "
            "seeds stuck to his dog's fur after a walk. Under a microscope, he saw that each seed was covered "
            "with tiny hooks, and he copied the idea to create a new fastener. Decades later, engineers in Japan "
            "reshaped the nose of a high-speed train to resemble the beak of a kingfisher, a bird that dives "
            "into water with barely a splash. The redesigned train was quieter when it left tunnels and consumed "
            "less electricity.",
            "Biomimicry is not a shortcut, however. Nature builds with materials and methods that factories "
            "cannot easily reproduce; spider silk, for instance, is remarkably strong for its weight, yet "
            "producing it in large quantities has proved difficult. Moreover, living things are shaped by the "
            "need to survive and reproduce, not to serve human purposes, so a natural design usually has to be "
            "adapted rather than simply copied.",
        ],
        "questions": [
            q("What is the passage mainly about?",
              "The history of a popular type of fastener",
              "Why natural materials are stronger than artificial ones",
              "How evolution produces new species of plants and animals",
              "The promise and limits of copying nature in engineering",
              "D", "main_idea",
              "Paragraphs 1 and 2 present biomimicry and two successes; paragraph 3 begins 'Biomimicry is not a "
              "shortcut, however' and gives its limits."),
            q("According to the passage, what did George de Mestral see through the microscope?",
              "Small hooks on the surface of each seed",
              "A sticky liquid that coated each seed",
              "Fine hairs that tied the seeds together",
              "Sharp points that cut into the fur",
              "A", "factual",
              "Paragraph 2: 'he saw that each seed was covered with tiny hooks'."),
            q('The word "resemble" in the passage is closest in meaning to',
              "protect", "replace", "look like", "move past",
              "C", "vocabulary",
              "To resemble something is to look like it; the train's nose was given the shape of the bird's "
              "beak."),
            q("What can be inferred about the high-speed train before its nose was reshaped?",
              "It could not travel through tunnels.",
              "It was noisy when it came out of tunnels.",
              "It needed far less electricity than it does now.",
              "Its nose had been modeled on a different bird.",
              "B", "inference",
              "'The redesigned train was quieter when it left tunnels', so the earlier design was louder at "
              "that moment."),
            q("Why does the author mention spider silk?",
              "To give another example of a successful product based on nature",
              "To show that some natural materials are hard to manufacture",
              "To compare the strength of silk with that of steel",
              "To argue that factories should stop using artificial materials",
              "B", "purpose",
              "It illustrates 'materials and methods that factories cannot easily reproduce': producing silk "
              "'in large quantities has proved difficult'."),
        ],
    },
]

# ===============================================================================================================
# LISTENING
# ===============================================================================================================
LISTENING_ROUTER = [
    lcr("F-UK", "Where should I leave these lab reports?",
        "I left at about four o'clock.",
        "They report to the dean.",
        "Just put them on the desk by the door.",
        "Yes, you really should.",
        "C", "'Where' needs a place. A repeats 'leave' as 'left'; B repeats 'report'."),
    lcr("M-US", "Could you keep an eye on my bag while I get a coffee?",
        "Sure, I'm not going anywhere.",
        "My eyes are fine, thanks.",
        "No, I bought it last year.",
        "It's a brown leather one.",
        "A", "'Keep an eye on' means watch. A agrees to the request; B takes 'eye' literally."),
    lcr("F-AU", "I can't believe it's already the end of term.",
        "No, I don't believe him either.",
        "The bus terminal is over there.",
        "Please wait until the end.",
        "I know. The weeks have flown by.",
        "D", "The speaker is surprised at how fast time has passed; D agrees. B plays on 'term' and "
             "'terminal'."),
    lcr("M-UK", "Do you want me to print a copy for you as well?",
        "The printer is on the left.",
        "That'd be great, if it's no trouble.",
        "Yes, I feel very well today.",
        "No, I don't drink coffee.",
        "B", "An offer is accepted politely in B. C misuses 'well'; D mishears 'copy' as 'coffee'."),
    lcr("F-US", "How about asking the tutor to explain it again?",
        "I doubt she has time before Friday.",
        "About twenty minutes ago.",
        "It's about the French Revolution.",
        "I asked for a glass of water.",
        "A", "'How about ...?' is a suggestion. A responds to it indirectly, with a reason it may not work."),
    lcr("M-AU", "How much longer do you need the microscope?",
        "About thirty centimeters, I think.",
        "It was quite expensive.",
        "Give me five more minutes.",
        "I need it for my biology class.",
        "C", "'How much longer' asks about time. A gives a length, B a price, and D says why, not how long."),
    lcr("F-UK", "Didn't you say the seminar was canceled?",
        "Yes, I can sell it to you.",
        "That was last week's, not today's.",
        "No, I didn't see him there.",
        "Yes, I'd like to say a few words.",
        "B", "B corrects the misunderstanding: a different seminar was canceled."),
    lcr("M-US", "The Wi-Fi in this building keeps cutting out.",
        "I cut the picture out of a magazine.",
        "The building opens at seven.",
        "No, I keep mine in a drawer.",
        "Try sitting nearer the window.",
        "D", "A complaint about a weak connection is answered with a practical tip. A takes 'cutting out' "
             "literally."),
    lcr("F-AU", "Are you taking the morning section or the afternoon one?",
        "Whichever one still has space.",
        "Yes, I am taking it.",
        "I took it this morning.",
        "It's the section on grammar.",
        "A", "An either/or question cannot be answered with 'yes'. A answers it indirectly: the choice "
             "depends on which has room."),
    lcr("M-UK", "You haven't heard back from the housing office, have you?",
        "Yes, I heard it was quite loud.",
        "The office is behind the gym.",
        "They've lived in that house for years.",
        "Not a word. I'll call them tomorrow.",
        "D", "'Not a word' means there has been no reply at all."),
    lcr("F-US", "Who do I talk to about joining the debate team?",
        "We talked about it for hours last night.",
        "Try the captain. She's in my class.",
        "Every Thursday at four, in Room 9.",
        "The team won its third debate in a row.",
        "B", "'Who' needs a person. C answers when and where."),
    lcr("M-AU", "I'm afraid I've bitten off more than I can chew with this project.",
        "You should eat more slowly.",
        "I'm not afraid of dogs.",
        "Could you share the work with someone?",
        "The cafeteria closes at eight.",
        "C", "'To bite off more than you can chew' is to take on too much. C offers a way to reduce the "
             "load; A takes the idiom literally."),
    {
        "type": "conversation",
        "setting": "Listen to a conversation in a campus bookstore.",
        "voices": {"Woman": "F-AU", "Man": "M-US"},
        "script": [
            ("Woman", "Hi. I'd like to sell back these two textbooks from last semester."),
            ("Man", "Sure. Let me scan them. OK, the biology one is still on next year's reading list, so I can "
                    "give you forty dollars for it."),
            ("Woman", "That's better than I expected. And the economics book?"),
            ("Man", "I'm afraid there's a new edition coming out, so we're not buying that one anymore."),
            ("Woman", "Oh. So it's worth nothing?"),
            ("Man", "Not to us. But you could put a notice on the student board upstairs. Some professors still "
                    "let students use the old edition."),
            ("Woman", "Good idea. I'll take the forty dollars and try that."),
        ],
        "questions": [
            q("Why won't the bookstore buy the economics book?",
              "It is in poor condition.",
              "A newer version is about to replace it.",
              "The store already has too many copies.",
              "The course is no longer taught.",
              "B", "detail",
              "'There's a new edition coming out, so we're not buying that one anymore.'"),
            q("What will the woman probably do with the economics book?",
              "Give it to a professor",
              "Keep it for next semester",
              "Exchange it for the new edition",
              "Try to sell it to another student",
              "D", "prediction",
              "The man suggests a notice on the student board, and she answers, 'Good idea. I'll ... try "
              "that.'"),
        ],
    },
    {
        "type": "conversation",
        "setting": "Listen to a conversation between two friends.",
        "voices": {"Man": "M-UK", "Woman": "F-US"},
        "script": [
            ("Man", "So, Pilar's birthday is next Saturday. Are we still doing the surprise party?"),
            ("Woman", "Definitely. I've booked the back room at the pizza place for seven."),
            ("Man", "Great. How do we get her there without her guessing?"),
            ("Woman", "I told her that the two of us are going to see a film, and that we'd eat first."),
            ("Man", "Clever. What about the cake?"),
            ("Woman", "That's the problem. The bakery I wanted is closed that day."),
            ("Man", "My cousin makes amazing chocolate cakes. I could ask her tonight."),
            ("Woman", "Would you? Then all that's left is telling everyone to arrive by six thirty."),
        ],
        "questions": [
            q("How does the woman plan to get Pilar to the restaurant?",
              "By saying they will eat before a film",
              "By asking the man's cousin to drive her",
              "By telling her about the party early",
              "By inviting her to help choose a cake",
              "A", "detail",
              "'I told her that the two of us are going to see a film, and that we'd eat first.'"),
            q("What will the man probably do next?",
              "Book a room at the pizza place",
              "Go to the bakery",
              "Ask a relative to make a cake",
              "Buy tickets for a film",
              "C", "prediction",
              "'My cousin makes amazing chocolate cakes. I could ask her tonight.' The room is already booked."),
        ],
    },
    {
        "type": "conversation",
        "setting": "Listen to a conversation between a student and a librarian.",
        "voices": {"Man": "M-AU", "Woman": "F-UK"},
        "script": [
            ("Man", "Excuse me. I found a journal article online last night, but the website asked me to pay "
                    "thirty dollars to read it."),
            ("Woman", "Were you at home when you tried?"),
            ("Man", "Yes, on my own laptop."),
            ("Woman", "That explains it. Off campus, the publisher doesn't know you're one of our students. You "
                      "need to start from the library's website and sign in with your student number first."),
            ("Man", "And then it's free?"),
            ("Woman", "If we subscribe to that journal, yes. If we don't, fill in a request form, and we'll get "
                      "you a copy from another library in a few days."),
            ("Man", "Great. I'll try signing in tonight."),
        ],
        "questions": [
            q("Why was the man asked to pay for the article?",
              "The library does not subscribe to the journal.",
              "He had already downloaded too many articles.",
              "His student account had expired.",
              "He had not signed in through the library.",
              "D", "detail",
              "'Off campus, the publisher doesn't know you're one of our students. You need to ... sign in with "
              "your student number first.' Whether the library subscribes is still unknown."),
            q("What does the librarian say the man can do if the library does not have the journal?",
              "Pay the publisher a reduced price",
              "Ask the library to obtain a copy for him",
              "Visit another library in person",
              "Read the article on a library computer",
              "B", "detail",
              "'Fill in a request form, and we'll get you a copy from another library in a few days.'"),
        ],
    },
    {
        "type": "conversation",
        "setting": "Listen to a conversation in an outdoor clothing shop.",
        "voices": {"Woman": "F-US", "Man": "M-UK"},
        "script": [
            ("Woman", "Can I help you find something?"),
            ("Man", "Yes, I need a rain jacket. I'm going hiking in the mountains next month."),
            ("Woman", "OK. This blue one is our lightest. It folds up small, so it's easy to carry."),
            ("Man", "Would it keep me dry all day?"),
            ("Woman", "In a light shower, yes. In heavy rain, I'd choose this green one. It's fully waterproof, "
                      "but it's heavier and costs thirty dollars more."),
            ("Man", "Hmm. The weather up there changes quickly. I'd rather carry a bit more than get soaked."),
            ("Woman", "Good thinking. Would you like to try a medium?"),
            ("Man", "Yes, please."),
        ],
        "questions": [
            q("What does the woman say about the blue jacket?",
              "It is the most expensive one in the shop.",
              "It is fully waterproof.",
              "It weighs less than the other jackets.",
              "It is sold only in a medium size.",
              "C", "detail",
              "'This blue one is our lightest.' The green one is the waterproof, more expensive jacket."),
            q("What does the man imply when he says, \"I'd rather carry a bit more than get soaked\"?",
              "He prefers the green jacket.",
              "He wants to take two jackets.",
              "He thinks both jackets cost too much.",
              "He will wait for better weather.",
              "A", "inference",
              "The green jacket is heavier ('carry a bit more') but fully waterproof (he will not 'get "
              "soaked'), so that is his choice."),
        ],
    },
    {
        "type": "announcement",
        "setting": "Listen to an announcement at a university.",
        "voice": "F-AU",
        "script": (
            "Good morning, everyone. Just a reminder that the student union is holding its blood-donation drive "
            "this Wednesday, from ten until four, in the main hall of the sports center. The whole visit takes "
            "about forty-five minutes, although giving blood itself takes only ten. You'll need to bring your "
            "student card, and please book a time on the union's website so that nobody has to wait in line. "
            "Afterward, there'll be free juice and sandwiches for everyone who takes part. Thanks, and we hope "
            "to see you there."
        ),
        "questions": [
            q("What is the main purpose of the announcement?",
              "To thank students who gave blood last week",
              "To encourage students to take part in an event",
              "To explain a change to the sports center's hours",
              "To ask for volunteers to serve food",
              "B", "purpose",
              "It is 'a reminder' about Wednesday's blood-donation drive and ends 'we hope to see you there'."),
            q("Why are students asked to book a time online?",
              "So that enough sandwiches can be ordered",
              "So that their student cards can be checked",
              "So that the visit takes only ten minutes",
              "So that they will not have to wait",
              "D", "detail",
              "'Please book a time on the union's website so that nobody has to wait in line.'"),
        ],
    },
    {
        "type": "announcement",
        "setting": "Listen to an announcement in a classroom.",
        "voice": "M-US",
        "script": (
            "Before you go, a word about Thursday's quiz. Several of you have told me that there are too many "
            "formulas to memorize in chapter six, and, well, I agree. So I've decided to make the quiz "
            "open-book. You may use your textbook and your own handwritten notes, but no phones or laptops. "
            "Don't relax too much, though. An open-book quiz means I can ask harder questions, and you'll have "
            "only twenty minutes, so you won't have time to look everything up. Know where things are in the "
            "chapter before you come."
        ),
        "questions": [
            q("What is the professor mainly doing?",
              "Announcing a change in the rules for a quiz",
              "Explaining the formulas in chapter six",
              "Telling students that a quiz has been postponed",
              "Reminding students to buy the textbook",
              "A", "main_idea",
              "'I've decided to make the quiz open-book', followed by what students may and may not use."),
            q("What does the professor imply about the open-book quiz?",
              "It will be shorter than earlier quizzes.",
              "It will cover more chapters than planned.",
              "Students will still need to prepare for it.",
              "Students may share their notes during it.",
              "C", "inference",
              "'Don't relax too much ... you won't have time to look everything up. Know where things are in "
              "the chapter before you come.'"),
        ],
    },
    {
        "type": "talk",
        "subject": "History",
        "voice": "F-UK",
        "script": (
            "Today's story starts with a vegetable. I want to argue that the potato, yes, the ordinary potato, "
            "changed the history of Europe. Potatoes come from the Andes mountains of South America, where "
            "people had grown them for thousands of years. Spanish ships carried them to Europe in the fifteen "
            "hundreds. And at first? Almost nobody wanted them. They looked strange, they grew underground, and "
            "they belong to the same plant family as some poisonous species, so people didn't trust them. For a "
            "long time, in many places, potatoes were mostly fed to animals. So what changed people's minds? "
            "Hunger, mainly. A field of potatoes can feed far more people than the same field planted with "
            "wheat. Potatoes also grow in poor soil and in cool, wet weather, which describes a lot of northern "
            "Europe. And here's a detail I like. In wartime, soldiers could easily carry off the grain stored "
            "in a farmer's barn, but potatoes left in the ground were much harder to take. By the seventeen "
            "hundreds, rulers such as Frederick the Great of Prussia were actually ordering farmers to plant "
            "them. The result was a better-fed population that grew quickly, and many historians think that "
            "this growth supplied the workers for Europe's new factories and cities. Not bad for a vegetable "
            "nobody wanted."
        ),
        "questions": [
            q("What is the talk mainly about?",
              "How farming began in the Andes mountains",
              "Why wheat was replaced by other crops in South America",
              "How a new food crop affected European society",
              "How European armies were fed in wartime",
              "C", "main_idea",
              "The professor wants 'to argue that the potato ... changed the history of Europe' and ends with "
              "its effect on population, factories and cities."),
            q("According to the professor, why did many Europeans refuse to eat potatoes at first?",
              "The plant seemed odd and possibly dangerous.",
              "Potatoes cost more than bread.",
              "Rulers did not allow farmers to grow them.",
              "Potatoes spoiled on the long sea journey.",
              "A", "detail",
              "'They looked strange, they grew underground, and they belong to the same plant family as some "
              "poisonous species, so people didn't trust them.'"),
            q("Why does the professor mention soldiers?",
              "To explain how potatoes first reached northern Europe",
              "To show that armies preferred bread to potatoes",
              "To describe who worked in the new factories",
              "To give one advantage of a crop that grows underground",
              "D", "function",
              "Soldiers could carry off stored grain, 'but potatoes left in the ground were much harder to "
              "take'."),
            q("What do many historians believe about Europe's population growth?",
              "It caused food shortages in the cities.",
              "It provided labor for growing industries.",
              "It began before potatoes arrived.",
              "It was slower in northern Europe.",
              "B", "detail",
              "'Many historians think that this growth supplied the workers for Europe's new factories and "
              "cities.'"),
        ],
    },
    {
        "type": "talk",
        "subject": "Chemistry",
        "voice": "M-AU",
        "script": (
            "Let's start with something you've all seen: ice cubes floating in a glass of water. It looks "
            "completely ordinary, right? But it's actually strange. With almost every other substance, the "
            "solid form is denser than the liquid, so the solid sinks. Drop a piece of solid wax into melted "
            "wax, and down it goes. So why is water different? It comes down to the shape of the water molecule "
            "and the way these molecules attract one another. In liquid water, the molecules are constantly "
            "moving, sliding past each other, and they can crowd fairly close together. But when water freezes, "
            "each molecule locks onto its neighbors in a fixed, open pattern, a bit like people holding hands "
            "at arm's length. That pattern has a lot of empty space in it. So the same amount of water takes up "
            "about nine percent more room as ice, which makes ice less dense than the water around it. Now, why "
            "should you care? Well, think about a lake in winter. Because ice floats, the lake freezes from the "
            "top down, and that layer of ice works like a blanket. The water underneath stays liquid, and fish "
            "survive until spring. If ice sank, lakes could freeze solid from the bottom up. Life in cold "
            "regions would look very different."
        ),
        "questions": [
            q("What is the main topic of the talk?",
              "How fish find food under the ice in winter",
              "Why wax melts at a higher temperature than ice",
              "How lakes in cold regions are formed",
              "Why frozen water is less dense than liquid water",
              "D", "main_idea",
              "The professor asks why ice floats and explains it by the open pattern of molecules in ice, then "
              "shows why it matters."),
            q("Why does the professor mention wax?",
              "To describe a substance that never freezes",
              "To show how most substances behave when they are solid",
              "To explain what water molecules are made of",
              "To give an example of a solid that floats",
              "B", "function",
              "Wax illustrates the normal case: 'the solid form is denser than the liquid, so the solid "
              "sinks'. Solid wax goes down, so D is the opposite."),
            q("According to the professor, what happens to water molecules when water freezes?",
              "They join in a fixed pattern with space between them.",
              "They move faster and slide past each other.",
              "They crowd more closely together than before.",
              "They break apart into smaller pieces.",
              "A", "detail",
              "'Each molecule locks onto its neighbors in a fixed, open pattern ... That pattern has a lot of "
              "empty space in it.'"),
            q("What does the professor imply would happen if ice were denser than liquid water?",
              "Lakes would never freeze at all.",
              "Ice cubes would melt more quickly in a glass.",
              "Fish in cold lakes might not survive the winter.",
              "Lakes would freeze only on the surface.",
              "C", "inference",
              "Fish survive because floating ice keeps the water below liquid. 'If ice sank, lakes could freeze "
              "solid from the bottom up.'"),
        ],
    },
]

LISTENING_LOWER = [
    lcr("M-UK", "What's your favorite subject at school?",
        "At eight o'clock.",
        "I like science best.",
        "It's next to the gym.",
        "Yes, I go every day.",
        "B", "The question asks which subject. A gives a time and C a place."),
    lcr("F-US", "Could you open the door for me, please?",
        "It's a big door.",
        "No, it's closed on Sunday.",
        "I opened it yesterday.",
        "Of course. Here you go.",
        "D", "A polite request is answered by agreeing to help."),
    lcr("M-AU", "How old is your little brother?",
        "He's seven.",
        "He's my brother.",
        "He's at school.",
        "He's very tall.",
        "A", "'How old' needs an age."),
    lcr("F-UK", "Do you want to play football after class?",
        "I'm in class 3B.",
        "Yes, I watched it on TV.",
        "Sorry, I have a piano lesson.",
        "He plays very well.",
        "C", "C refuses the invitation politely and gives a reason."),
    lcr("M-US", "It's raining. Did you bring an umbrella?",
        "I like sunny days.",
        "Yes, I'll bring it tomorrow.",
        "It rained last week, too.",
        "No, I left it at home.",
        "D", "The question is about now. D answers it; B talks about tomorrow."),
    lcr("F-AU", "When does the film start?",
        "At half past seven.",
        "At the cinema.",
        "For two hours.",
        "With my friends.",
        "A", "'When' needs a time. B answers where and C how long."),
    lcr("M-UK", "This soup is delicious. Did you make it?",
        "Yes, I'd like some soup.",
        "Thanks. My dad taught me.",
        "No, I'm not hungry.",
        "It's on the table.",
        "B", "B accepts the compliment and shows that the speaker did make the soup."),
    {
        "type": "conversation",
        "setting": "Listen to a conversation between two students.",
        "voices": {"Man": "M-US", "Woman": "F-AU"},
        "script": [
            ("Man", "Excuse me. Do you know where the lab building is? I have chemistry at ten."),
            ("Woman", "Sure. It's not far. Go straight down this path and turn left at the fountain."),
            ("Man", "Left at the fountain. OK."),
            ("Woman", "Then you'll see a tall white building with a blue door. That's it."),
            ("Man", "Thanks. Is it a long walk?"),
            ("Woman", "No, only about five minutes. I'm going to the library next to it. We can walk together."),
            ("Man", "Great. I'm new here, and I always get lost."),
            ("Woman", "Don't worry. The campus is small. You'll learn it fast."),
        ],
        "questions": [
            q("Where should the man turn left?",
              "At the library",
              "At the blue door",
              "At the fountain",
              "At the white building",
              "C", "detail",
              "'Go straight down this path and turn left at the fountain.'"),
            q("What will the speakers do next?",
              "Walk in the same direction together",
              "Look at a map of the campus",
              "Study chemistry in the library",
              "Wait for the man's teacher",
              "A", "prediction",
              "The woman is going to the library next to the lab building: 'We can walk together.'"),
        ],
    },
    {
        "type": "announcement",
        "setting": "Listen to an announcement on a tour bus.",
        "voice": "F-UK",
        "script": (
            "OK, everyone, we are going to stop here in the village of Pendlow for lunch. It is twelve fifteen "
            "now. The bus will leave again at one thirty, so you have just over an hour. There is a small "
            "restaurant across the street and a bakery next to the post office. Please take your money and your "
            "phone with you, but you can leave your bags and coats on the bus. I will lock the doors. Please be "
            "back on time, because we have a long drive to the lake this afternoon."
        ),
        "questions": [
            q("What time will the bus leave the village?",
              "At twelve fifteen",
              "At twelve thirty",
              "At one o'clock",
              "At one thirty",
              "D", "detail",
              "'The bus will leave again at one thirty.' Twelve fifteen is the time now."),
            q("What can the passengers leave on the bus?",
              "Their phones",
              "Their coats and bags",
              "Their money",
              "Their lunch",
              "B", "detail",
              "'You can leave your bags and coats on the bus.' Money and phones should be taken."),
        ],
    },
    {
        "type": "announcement",
        "setting": "Listen to an announcement in a café.",
        "voice": "M-AU",
        "script": (
            "Good morning, and welcome to the Blue Kettle Café. Today's special is tomato soup with a cheese "
            "sandwich for only six dollars. If you buy the special, you also get a small coffee or tea for "
            "free. We made the soup fresh this morning, and we only have twenty bowls, so please order early. "
            "The special is on sale from eleven until two. And don't forget: on Fridays, every piece of cake is "
            "half price after three o'clock. Thank you, and enjoy your day."
        ),
        "questions": [
            q("What is the announcement mainly about?",
              "A lunch offer that is available today",
              "A new café that opens on Friday",
              "A change in the café's opening hours",
              "A cooking lesson for customers",
              "A", "main_idea",
              "Most of the announcement describes 'today's special': soup and a sandwich for six dollars."),
            q("Why should customers order the special early?",
              "It is cheaper before eleven o'clock.",
              "The café closes at two o'clock.",
              "There is only a limited amount of soup.",
              "The cake is sold only in the morning.",
              "C", "detail",
              "'We only have twenty bowls, so please order early.'"),
        ],
    },
    {
        "type": "announcement",
        "setting": "Listen to an announcement in a classroom.",
        "voice": "F-US",
        "script": (
            "Before you go home, please listen. Next Tuesday, our class is visiting the city zoo. To come with "
            "us, you need a permission slip signed by your mother, your father, or another adult at home. I am "
            "giving you the paper now. Please bring it back to me by Friday. If I don't have your slip, you "
            "will have to stay at school with Mr. Olsen's class. Also, the trip costs five dollars, so please "
            "put the money in the envelope with your slip. Any questions?"
        ),
        "questions": [
            q("Why is the teacher speaking to the students?",
              "To tell them the zoo trip is canceled",
              "To ask them to bring back a signed paper",
              "To give them their homework for Friday",
              "To introduce a new teacher",
              "B", "purpose",
              "Students need 'a permission slip signed by' an adult: 'Please bring it back to me by Friday.'"),
            q("What will happen to students who do not bring the slip?",
              "They will pay five dollars more.",
              "They will go to the zoo on Friday.",
              "They will have to call their parents.",
              "They will stay at school that day.",
              "D", "detail",
              "'If I don't have your slip, you will have to stay at school with Mr. Olsen's class.'"),
        ],
    },
]

LISTENING_UPPER = [
    lcr("F-AU", "Is there any wiggle room on the deadline for the essay?",
        "No, the room is fully booked.",
        "It's about two thousand words long.",
        "Only if I see a draft by Monday.",
        "Yes, the line was dead when I called.",
        "C", "'Wiggle room' means flexibility. C grants a little, on a condition; A takes 'room' literally "
             "and D plays on 'deadline'."),
    lcr("M-UK", "Frankly, I think the committee has missed the point entirely.",
        "Really? Their report seemed sensible to me.",
        "Yes, they scored one more point than us.",
        "I'll miss them when they leave.",
        "It's pointing toward the parking lot.",
        "A", "The speaker criticizes the committee; A politely disagrees. B, C and D reuse 'point' or "
             "'miss' with other meanings."),
    lcr("F-US", "I'm in two minds about applying for the exchange program.",
        "The exchange rate is good today.",
        "I applied two coats of paint.",
        "Yes, great minds think alike.",
        "What's holding you back?",
        "D", "'In two minds' means undecided, so the natural reply asks what the doubt is."),
    {
        "type": "conversation",
        "setting": "Listen to a conversation between a student and her thesis supervisor.",
        "voices": {"Woman": "F-AU", "Man": "M-UK"},
        "script": [
            ("Woman", "Professor Aldous, do you have a minute? I've been having second thoughts about my thesis "
                      "topic."),
            ("Man", "Oh? You're four months in, Kirra. What's brought this on?"),
            ("Woman", "I came across some letters in the city archive, written by dock workers in the nineteen "
                      "twenties. Nobody's studied them. I'd love to build my thesis around them instead of the "
                      "newspaper coverage."),
            ("Man", "It sounds tempting, I'll grant you. But new material has a way of looking better from a "
                    "distance. Have you actually read them all?"),
            ("Woman", "About a third."),
            ("Man", "Then here's my suggestion. Finish reading them, and write me two pages on what they'd let "
                    "you argue that the newspapers don't. If you can't fill two pages, you have your answer."),
            ("Woman", "That's fair. I'll have it to you by the end of the month."),
        ],
        "questions": [
            q("What is the professor's attitude toward the student's new idea?",
              "He is enthusiastic and wants her to switch immediately.",
              "He is cautious and wants more evidence before agreeing.",
              "He is annoyed that she visited the archive without asking.",
              "He is certain that the letters are not genuine.",
              "B", "attitude",
              "'It sounds tempting, I'll grant you. But new material has a way of looking better from a "
              "distance.' He then asks for two pages before deciding."),
            q("What does the professor mean when he says, \"If you can't fill two pages, you have your "
              "answer\"?",
              "A two-page thesis would be too short to be accepted.",
              "He will give his own answer after reading two pages.",
              "Failing to write it would show the new topic is too thin.",
              "The archive holds only two pages of useful letters.",
              "C", "function",
              "The two pages must show what the letters 'let you argue that the newspapers don't'. If she "
              "cannot write them, the letters do not support a thesis."),
        ],
    },
    {
        "type": "announcement",
        "setting": "Listen to an announcement in a university residence hall.",
        "voice": "F-UK",
        "script": (
            "Attention, residents of Wexford Hall. If you're returning in the autumn, you may store belongings "
            "in the basement over the summer, subject to a few conditions. Each resident is limited to four "
            "boxes and one large item, such as a bicycle or a suitcase. Everything must be labeled with your "
            "name and next year's room number, and nothing perishable or breakable will be accepted. Storage "
            "opens on the second of June, and the final drop-off is noon on the sixth. Anything left in rooms "
            "after that will be removed, and you'll be billed for its disposal. The hall can't accept "
            "responsibility for loss or damage, so take valuables home with you."
        ),
        "questions": [
            q("What will happen to items left in rooms after the final drop-off time?",
              "They will be moved to the basement for free.",
              "They will be stored until the next term begins.",
              "They will be given to other residents.",
              "They will be removed at the owner's cost.",
              "D", "detail",
              "'Anything left in rooms after that will be removed, and you'll be billed for its disposal.'"),
            q("What does the speaker imply about valuable items?",
              "They must be packed in a separate box.",
              "The hall will not pay if they are lost.",
              "They are kept in the hall office instead.",
              "They count as one large item.",
              "B", "inference",
              "'The hall can't accept responsibility for loss or damage, so take valuables home with you.'"),
        ],
    },
    {
        "type": "talk",
        "subject": "Economics",
        "voice": "M-US",
        "script": (
            "Suppose I gave you the only telephone in the world. What would it be worth to you? Nothing, "
            "obviously. There'd be nobody to call. Give a second person a phone, and yours suddenly has some "
            "value. Add a million people, and it becomes something you can hardly live without. Economists call "
            "this a network effect: a product becomes more valuable to each user as the number of users grows. "
            "Notice how odd that is. With most goods, it makes no difference to me how many other people own "
            "one. My umbrella keeps me just as dry whether or not you have an umbrella too. Now, network "
            "effects have a couple of consequences worth remembering. First, getting started is brutally hard. "
            "Nobody wants to join an empty network, which is why new platforms so often give their service away "
            "for free at the beginning. They're buying a crowd. Second, once a network gets big enough, it "
            "tends to pull ahead and stay ahead. A competitor might offer something technically superior and "
            "still fail, because what people are really paying for isn't the technology. It's access to "
            "everyone else. So when you hear that a market has ended up with one giant firm, don't assume the "
            "best product won. Sometimes it's simply the one that got big first."
        ),
        "questions": [
            q("What is the talk mainly about?",
              "Why some products gain value as more people use them",
              "How the telephone was invented and sold",
              "Why new companies should charge low prices",
              "How governments control very large firms",
              "A", "main_idea",
              "The professor defines a network effect, 'a product becomes more valuable to each user as the "
              "number of users grows', and gives two consequences."),
            q("Why does the professor mention an umbrella?",
              "To give an example of a product that people rarely share",
              "To show that cheap goods lose value quickly",
              "To contrast an ordinary good with a networked one",
              "To explain why some products are sold in pairs",
              "C", "function",
              "'With most goods, it makes no difference to me how many other people own one.' The umbrella is "
              "that ordinary case, unlike the telephone."),
            q("According to the professor, why do new platforms often offer their service for free?",
              "To test whether their technology works",
              "To avoid paying taxes at the beginning",
              "To prove that they are better than their larger rivals",
              "To build up a large number of users quickly",
              "D", "detail",
              "'Nobody wants to join an empty network, which is why new platforms so often give their service "
              "away for free ... They're buying a crowd.'"),
            q("What does the professor imply about a market that is dominated by one giant firm?",
              "The firm must have broken competition laws.",
              "Its product may not be the best one available.",
              "It will soon be replaced by a newer rival.",
              "It probably offers its service free of charge.",
              "B", "inference",
              "'Don't assume the best product won. Sometimes it's simply the one that got big first.'"),
        ],
    },
    {
        "type": "talk",
        "subject": "Literature",
        "voice": "F-US",
        "script": (
            "The Iliad runs to more than fifteen thousand lines, and it took shape before the Greeks were "
            "widely using writing. So how on earth did anyone remember it? For a long time, the assumption was "
            "that poets simply had extraordinary memories and recited the poem word for word. Then, in the "
            "nineteen thirties, a young American scholar named Milman Parry tried something different. Instead "
            "of only studying old texts, he traveled to the Balkans, where singers still performed long heroic "
            "poems without being able to read, and he recorded them. What he found was that the singers weren't "
            "reciting from memory at all. They were composing as they sang. How? They'd absorbed a huge stock "
            "of ready-made phrases, each one shaped to fit the rhythm of a line. Think of Homer's 'swift-footed "
            "Achilles' or 'rosy-fingered dawn.' Readers today may find those repetitions tedious, but for the "
            "poet, they were building blocks. Whole scenes, like a feast, followed familiar patterns too. And "
            "here's the part I find most striking. The singers insisted that they sang a story exactly the same "
            "way every time. The recordings showed otherwise: no two performances matched. For them, 'the same' "
            "meant the same story, not the same words. So perhaps we should think of an epic less as a fixed "
            "text and more as a tradition of performances."
        ),
        "questions": [
            q("What is the talk mainly about?",
              "Why the Iliad was finally written down",
              "How modern readers should study Homer's language",
              "How poets performed long poems without written texts",
              "Why Balkan singers stopped performing heroic poems",
              "C", "main_idea",
              "The professor asks how anyone remembered so long a poem and answers that singers composed as "
              "they sang, using ready-made phrases."),
            q("What did Milman Parry do that earlier scholars had not done?",
              "He translated the Iliad into a modern language.",
              "He recorded living singers who could not read.",
              "He counted the number of lines in the poem.",
              "He taught Balkan singers to read old texts.",
              "B", "detail",
              "'Instead of only studying old texts, he traveled to the Balkans, where singers still performed "
              "... without being able to read, and he recorded them.'"),
            q("Why does the professor mention \"swift-footed Achilles\"?",
              "To show that Homer's heroes were skilled athletes",
              "To point out a mistake in a modern translation",
              "To explain why modern readers find the poem exciting",
              "To illustrate the ready-made phrases poets relied on",
              "D", "function",
              "It is given as an example of the 'ready-made phrases, each one shaped to fit the rhythm of a "
              "line'."),
            q("What can be inferred about the singers Parry recorded?",
              "They did not think of a poem as a fixed set of words.",
              "They refused to let their performances be compared.",
              "They had learned their poems from printed books.",
              "They changed the story completely each time.",
              "A", "inference",
              "They said they sang a story 'exactly the same way', yet no two performances matched: 'the same' "
              "meant 'the same story, not the same words'."),
        ],
    },
]

# ===============================================================================================================
# WRITING
# ===============================================================================================================
WRITING = {
    "build": [
        build("Did you go to the review session last night?",
              "No, I did not know about it.",
              ["I", "did not", "know", "about", "it"], "negation", prefix="No,"),
        build("There's a free jazz concert in the park this Sunday.",
              "Are you planning to go with your sister?",
              ["are you", "planning", "to go", "with", "your sister"], "yes_no_question"),
        build("My cousin just started working at the science museum.",
              "What kind of work does she do there?",
              ["what kind", "of work", "does", "she", "do", "there"], "wh_question"),
        build("Do you like your new apartment?",
              "It is much quieter than my old one.",
              ["it is", "much quieter", "than", "my old", "one"], "comparison"),
        build("Why did you come to the lecture hall so early?",
              "I wanted to get a seat near the front.",
              ["I wanted", "to get", "a seat", "near", "the front"], "infinitive"),
        build("Who decided which photo won the contest?",
              "The winner was chosen by a group of local artists.",
              ["was chosen", "by", "a group", "of", "local artists"], "passive", prefix="The winner"),
        build("I applied for the lab assistant job two weeks ago.",
              "Have you heard anything from them yet?",
              ["have", "you", "heard", "anything", "from them yet"], "perfect", extra="has"),
        build("The airport bus leaves from a different stop now.",
              "Could you show me where the new stop is on this map?",
              ["could you", "show me", "where", "the new stop is"], "embedded_question",
              suffix="on this map", extra="is the new stop"),
        build("Look at the woman standing next to the dean.",
              "Is that the professor who gave the talk on city planning?",
              ["is that", "the professor", "who", "gave", "the talk", "on city planning"], "relative_clause",
              extra="whom"),
        build("I can't decide whether to take the extra math course.",
              "I would take it if my schedule were not so full.",
              ["take it", "if", "my schedule", "were not", "so full"], "conditional", prefix="I would"),
    ],
    "email": {
        "scenario": (
            "You are a student at a university. The final exam schedule was posted this morning, and you "
            "noticed that two of your exams, Introduction to Statistics and World History, are both scheduled "
            "for Thursday, December 17, at 9:00 a.m. You cannot be in two rooms at once. Your statistics "
            "instructor, Professor Whitfield, has told the class to contact her about any scheduling problems. "
            "You decide to write to her."
        ),
        "to": "Professor Whitfield",
        "subject": "Two final exams at the same time",
        "bullets": [
            "Explain the problem with your exam schedule.",
            "Suggest a way to solve the problem.",
            "Ask what you need to do next.",
        ],
        "model": """
Dear Professor Whitfield,

I am a student in your Introduction to Statistics class, and I am writing because I have a problem with the final exam schedule that was posted this morning. Your exam is on Thursday, December 17, at 9:00 a.m., and my World History exam is at exactly the same time in a different building.

Since I cannot attend both, I would like to suggest taking the statistics exam at another time. I am free on Thursday afternoon and all day Friday, and I would be happy to take it with another section or in your office, whichever is easier for you.

Could you please let me know what I need to do next? If there is a form to complete or an office I should contact, I will do so right away. I can also send you a copy of my schedule.

Thank you very much for your help.

Sincerely,
Camila Duarte
""".strip(),
    },
    "discussion": {
        "course": "sociology",
        "professor": {
            "name": "Dr. Navarro",
            "post": (
                "This week we are examining how technology shapes relationships. Billions of people now use "
                "social media to share news, photos, and opinions with friends and strangers. Some researchers "
                "argue that these platforms strengthen our ties by keeping us in touch across long distances. "
                "Others claim that time spent online replaces deeper, face-to-face contact and leaves people "
                "lonelier. What is your view? Has social media made people more connected or more isolated, "
                "and why?"
            ),
        },
        "students": [
            {
                "name": "Thabo",
                "post": (
                    "I believe social media has made us more connected. My family lives in three different "
                    "countries, and before these apps existed we spoke only a few times a year. Now we share "
                    "photos and messages every day in a group chat. I know what my cousins are doing, and I "
                    "feel much closer to them than my parents did to their relatives."
                ),
            },
            {
                "name": "Elif",
                "post": (
                    "In my opinion, people are more isolated now. We may have hundreds of online friends, but "
                    "most of those relationships are shallow. I often see groups of friends sitting together in "
                    "a café while each person looks at a phone. Liking someone's photo takes one second, and it "
                    "is not the same as really listening to them."
                ),
            },
        ],
        "model": (
            "I think social media can do both, but in my experience it has made people more connected overall. "
            "Thabo's example of a family spread across several countries is convincing, and I would add another "
            "kind of connection that he did not mention: people with unusual interests or problems can now find "
            "others like them. A teenager in a small town who loves astronomy, or someone learning a rare "
            "language, used to have no one to talk to. Today such people can join online communities and feel "
            "that they belong somewhere. I understand Elif's point that many online friendships are shallow, "
            "and it is true that phones sometimes interrupt real conversations. However, that is a problem of "
            "how we use the technology, not of the technology itself. If people set limits, for example by "
            "putting their phones away during meals, they can enjoy both kinds of contact."
        ),
    },
}

# ===============================================================================================================
# SPEAKING
# ===============================================================================================================
SPEAKING = {
    "repeat": {
        "scenario": (
            "You are learning how to volunteer at an animal shelter. Listen to your supervisor and repeat what "
            "he says. Repeat only once."
        ),
        "picture": "The entrance of an animal shelter with a sign-in desk, a row of dog kennels and a shelf of "
                   "food bowls and leashes.",
        "voice": "M-AU",
        "sentences": [
            "Please sign in when you arrive each morning.",
            "The dogs are fed at eight and at four.",
            "Always wash your hands before you touch the animals' food bowls.",
            "Every cat has a card on its door with its name and its age.",
            "Remember never to open two kennel doors at the same time.",
            "If a dog seems nervous or frightened, speak softly and wait until it comes to you.",
            "Before you take a dog out for a walk, make sure that the front gate is closed behind you.",
        ],
    },
    "interview": {
        "topic": "shopping habits",
        "scenario": (
            "You have agreed to take part in a research study about shopping habits. You will have a short "
            "online interview with a researcher. The researcher will ask you some questions."
        ),
        "voice": "F-UK",
        "questions": [
            {
                "kind": "event",
                "q": (
                    "Thank you for joining me today. I'd like to begin with a recent experience. Please tell me "
                    "about the last time you bought something that you were really pleased with. What was it, "
                    "and why were you happy with it?"
                ),
                "model": (
                    "A few weeks ago, I bought a secondhand bicycle, and I am still very pleased with it. I had "
                    "been taking the bus to the university every day, which was slow and cost me quite a lot "
                    "each month. I found the bike on a website where students sell things they no longer need, "
                    "and the price was less than half of what a new one costs. The owner let me ride it around "
                    "the block before I paid, so I knew that the brakes and the gears worked well. Now I get to "
                    "class in fifteen minutes, I save money, and I get some exercise at the same time. It was "
                    "easily my best purchase this year."
                ),
            },
            {
                "kind": "life",
                "q": (
                    "Some people enjoy going to stores in person, while others would rather buy almost "
                    "everything online. Which do you prefer, and why?"
                ),
                "model": (
                    "I prefer shopping online for most things, mainly because it saves time. I have classes all "
                    "day and a part-time job in the evening, so I can't easily get to the stores before they "
                    "close. Online, I can compare prices from several sellers in a few minutes and read what "
                    "other buyers thought of the product. That said, there are some things I always buy in "
                    "person. Shoes are a good example, because sizes differ so much between brands, and I also "
                    "like to choose my own fruit and vegetables. So I would say I do about three-quarters of my "
                    "shopping online and the rest in real stores."
                ),
            },
            {
                "kind": "opinion",
                "q": (
                    "Now I'd like to hear your opinion. Some people believe that discounts and sales encourage "
                    "shoppers to spend more money than they had planned. Do you agree or disagree? Why?"
                ),
                "model": (
                    "Yes, I mostly agree. When people see a sign that says fifty percent off, they focus on how "
                    "much they are saving rather than on how much they are spending. I have done this myself. "
                    "Last winter I went into a store for a pair of gloves and came out with a jacket as well, "
                    "only because it was on sale. I didn't really need it, and I have worn it twice. Sales also "
                    "create a feeling of hurry, because the offer ends soon, so shoppers don't take time to "
                    "think. Of course, a sale is useful if you were already planning to buy that item. The "
                    "trick, I think, is to make a list first and keep to it."
                ),
            },
            {
                "kind": "opinion",
                "q": (
                    "Here is my last question. Do you think schools should teach students how to manage their "
                    "money, for example how to plan a budget and compare prices? Why or why not?"
                ),
                "model": (
                    "Yes, I strongly believe schools should teach this. Managing money is a skill that everyone "
                    "needs, but many young people only learn it by making expensive mistakes. When I first "
                    "lived away from home, I spent most of my monthly budget in two weeks because nobody had "
                    "shown me how to plan. A short course could cover simple things, such as writing a budget, "
                    "comparing prices, and understanding how interest on a loan works. Some people argue that "
                    "parents should teach these things, but not every parent has the time or the knowledge. If "
                    "schools include this, every student gets the same chance to start adult life with good "
                    "habits."
                ),
            },
        ],
    },
}

FORM = {
    "number": 6,
    "theme": "Bilingual brains and biomimicry; potatoes, floating ice, network effects, oral epics",
    "reading": {"router": READING_ROUTER, "lower": READING_LOWER, "upper": READING_UPPER},
    "listening": {"router": LISTENING_ROUTER, "lower": LISTENING_LOWER, "upper": LISTENING_UPPER},
    "writing": WRITING,
    "speaking": SPEAKING,
}
