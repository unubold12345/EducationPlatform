"""TOEFL iBT practice test 02. Structure copied from form01.py; content follows the Form 02 row of AUTHORING.md."""

from common import build, lcr, q

# ===============================================================================================================
# READING
# ===============================================================================================================
READING_ROUTER = [
    {
        "type": "complete_words",
        "subject": "Biology",
        "text": (
            "Photosynthesis is the process by which green plants make their own food. "
            "Their lea[ves] take i[n] carbon dio[xide] from t[he] air, a[nd] their ro[ots] absorb water from the "
            "soil. "
            "Inside ea[ch] leaf, li[ght] energy tu[rns] these mate[rials] into sugar. "
            "During this process, the plant also releases oxygen into the air. "
            "Because animals eat plants and breathe oxygen, almost all life on Earth depends on photosynthesis."
        ),
    },
    {
        "type": "complete_words",
        "subject": "Economics",
        "text": (
            "The law of supply and demand explains how prices are set in a market. "
            "When ma[ny] people wa[nt] an it[em] that i[s] hard t[o] find, i[ts] price rises. "
            "In cont[rast], when sup[ply] is gre[ater] than dem[and], sellers lower their prices to attract "
            "buyers. "
            "Over time, these changes push the price toward a level at which the amount offered matches the "
            "amount people wish to buy."
        ),
    },
    {
        "type": "daily_life",
        "format": "notice",
        "heading": "Read a sign.",
        "text": """
MERRITT HOUSE LAUNDRY ROOM
Open daily, 7:00 a.m. to 11:00 p.m.

- Washers: $1.50 per load. Dryers: $1.00 per load.
- The machines take the Merritt laundry card only, not coins. Add money to your card in the lobby.
- Clean the lint filter after using a dryer.
- Remove your clothes as soon as a machine stops. Items left for more than one hour may be moved to the shelf by the door.

Broken machine? Tell the front desk.
""".strip(),
        "questions": [
            q("How do residents pay for a wash?",
              "With coins",
              "With a special card",
              "At the front desk",
              "Through their monthly rent",
              "B", "detail",
              "'The machines take the Merritt laundry card only, not coins.'"),
            q("What may happen to clothes that stay in a dryer for two hours after it stops?",
              "They may be thrown away.",
              "They may be taken to the front desk.",
              "Their owner may have to pay for another load.",
              "They may be put on a shelf.",
              "D", "inference",
              "'Items left for more than one hour may be moved to the shelf by the door.' Two hours is more than "
              "one."),
        ],
    },
    {
        "type": "daily_life",
        "format": "email",
        "heading": "Read an email.",
        "text": """
To: Residents of 48 Alder Street
From: Hana Kobayashi
Subject: Safety inspection on October 13

Dear tenants,

As your landlord, I must have every apartment inspected once a year. This year's inspection will take place on Tuesday, October 13, between 9:00 a.m. and 1:00 p.m. An inspector will test the smoke detectors, check the window locks, and look at the heating system. Each visit should take about fifteen minutes.

You do not need to be at home, because I will come with the inspector and open the door with my key. Before the visit, please clear the space around your heater and keep any pets in a closed room.

If something in your apartment needs repair, such as a dripping faucet, write it on the attached form and leave the form on your kitchen table.

Best regards,
Hana Kobayashi
""".strip(),
        "questions": [
            q("Why did Ms. Kobayashi write the email?",
              "To let tenants know about a coming inspection",
              "To announce that the heaters will be replaced",
              "To ask tenants to pay for new smoke detectors",
              "To remind tenants that pets are not allowed",
              "A", "purpose",
              "'This year's inspection will take place on Tuesday, October 13'; the rest explains what will "
              "happen and how to prepare."),
            q("What are tenants asked to do before the visit?",
              "Test their smoke detectors",
              "Give the inspector a key",
              "Move things away from the heater",
              "Arrange to be at home that morning",
              "C", "detail",
              "'Please clear the space around your heater.' The inspector tests the detectors, the landlord has "
              "a key, and tenants 'do not need to be at home'."),
            q("Which of the following will the inspector NOT examine?",
              "The smoke detectors",
              "The window locks",
              "The heating system",
              "The kitchen faucet",
              "D", "negative",
              "The inspector will test the smoke detectors, check the window locks and look at the heating. A "
              "faucet is only an example of a repair a tenant may report on the form."),
        ],
    },
    {
        "type": "daily_life",
        "format": "text_messages",
        "heading": "Read a chain of text messages.",
        "text": """
Tomás (12:10 p.m.): Ms. Reyes's last day at the lab is Friday. Should we get her something from all of us?
Ji-woo (12:13 p.m.): Good idea! She's always borrowing my pen. What about a nice one with her name on it?
Tomás (12:15 p.m.): Perfect. If the six of us give $5 each, that should be enough. Can you order it?
Ji-woo (12:16 p.m.): Sure. It takes two days to add the name, so I'll order it tonight and collect the money tomorrow.
""".strip(),
        "questions": [
            q("Why does Tomás send the first message?",
              "To ask Ji-woo to return his pen",
              "To invite Ji-woo to a party on Friday",
              "To propose buying a gift as a group",
              "To say that he is leaving the lab",
              "C", "purpose",
              "'Should we get her something from all of us?' It is Ms. Reyes, not Tomás, who is leaving."),
            q("What can be inferred about Ms. Reyes?",
              "She often uses someone else's pen.",
              "She starts a new job on Friday.",
              "She asked her coworkers for a gift.",
              "She will be away for two days.",
              "A", "inference",
              "'She's always borrowing my pen.' The two days are the time needed to add her name to the gift."),
        ],
    },
    {
        "type": "daily_life",
        "format": "webpage",
        "heading": "Read a webpage.",
        "text": """
BRIARWOOD COMMUNITY CENTER
Weekend Workshops in November

Bread Baking Basics
Saturday, Nov. 7, 10:00 a.m. to 1:00 p.m. | $25 | All ingredients included

Healthy Houseplants
Saturday, Nov. 14, 2:00 to 4:00 p.m. | Free | Bring one plant from home

Watercolor Landscapes
Sunday, Nov. 15, 1:00 to 3:30 p.m. | $18 | Paper and paint provided

Knitting for Beginners
Sunday, Nov. 22, 11:00 a.m. to 1:00 p.m. | $12 | Bring your own needles; yarn is supplied

Registration
Sign up online or at the front desk at least three days before the workshop. Each workshop is limited to 12 people. Members of the center pay 20% less for all workshops. Your fee will be returned if you cancel two or more days in advance.
""".strip(),
        "questions": [
            q("Which workshop can people attend without paying?",
              "Bread Baking Basics",
              "Watercolor Landscapes",
              "Knitting for Beginners",
              "Healthy Houseplants",
              "D", "detail",
              "Healthy Houseplants is marked 'Free'; the other three have a price."),
            q("How much would a member of the center pay for the bread workshop?",
              "$5",
              "$20",
              "$23",
              "$25",
              "B", "inference",
              "The workshop costs $25 and members 'pay 20% less', which is $5 off, so $20."),
            q("What is true of every workshop on the page?",
              "It accepts no more than 12 people.",
              "It takes place on a Saturday.",
              "It requires people to bring materials.",
              "It is open only to members.",
              "A", "detail",
              "'Each workshop is limited to 12 people.' Two are on Sundays, and two provide all materials."),
        ],
    },
    {
        "type": "academic",
        "subject": "Urban studies",
        "title": "Gardens Above the Street",
        "paragraphs": [
            "A green roof is a rooftop that is partly or completely covered with living plants. Beneath the "
            "plants lie several layers: soil or a lighter growing material, a drainage layer, and a waterproof "
            "sheet that protects the building. Grass-covered roofs are centuries old, but the modern version was "
            "developed in Germany in the second half of the twentieth century and has since spread worldwide.",
            "The benefits are considerable. During a storm, the soil and plants hold much of the rain and "
            "release it slowly, which reduces the pressure on city drains and lowers the risk of flooded "
            "streets. In summer, a planted roof stays far cooler than a dark conventional one, so the rooms "
            "below need less air conditioning. Green roofs also offer food and shelter to insects and birds in "
            "neighborhoods with little open land.",
            "Nevertheless, green roofs are not suitable everywhere. Wet soil is heavy, and many older buildings "
            "would have to be strengthened before they could carry it. A green roof also costs more to install "
            "than an ordinary one, and its plants need occasional care. For these reasons, some cities offer tax "
            "reductions or direct payments to owners who install them, while others require them on large new "
            "buildings. Supporters argue that the long-term savings outweigh the initial expense.",
        ],
        "questions": [
            q("What is the passage mainly about?",
              "How to choose plants for a rooftop garden",
              "The advantages and limits of planted rooftops",
              "Why flooding has become more common in cities",
              "The history of roof construction in Germany",
              "B", "main_idea",
              "Paragraph 2 sets out the benefits; paragraph 3 begins 'Nevertheless, green roofs are not suitable "
              "everywhere' and gives the drawbacks."),
            q("According to the passage, how do green roofs help during storms?",
              "They direct rainwater into the rooms below.",
              "They keep rain from reaching the soil.",
              "They store rain and let it go gradually.",
              "They make the city's drains wider.",
              "C", "factual",
              "'The soil and plants hold much of the rain and release it slowly.'"),
            q('The word "considerable" in the passage is closest in meaning to',
              "large", "uncertain", "familiar", "recent",
              "A", "vocabulary",
              "Considerable means large in amount or importance; the paragraph then lists several major "
              "benefits."),
            q("What can be inferred about older buildings?",
              "Most of them already have a drainage layer under the roof.",
              "They stay cooler in summer than buildings with planted roofs.",
              "Their owners are not allowed to receive payments from the city.",
              "Many would need structural work before plants could be added.",
              "D", "inference",
              "'Wet soil is heavy, and many older buildings would have to be strengthened before they could "
              "carry it.'"),
            q("Why does the author mention tax reductions and direct payments?",
              "To argue that green roofs are too expensive to be practical",
              "To explain why older buildings are being replaced",
              "To show how some cities encourage green roofs",
              "To compare German cities with cities in other countries",
              "C", "purpose",
              "The sentence begins 'For these reasons' (the weight and the cost) and says the money goes 'to "
              "owners who install them'."),
        ],
    },
]

READING_LOWER = [
    {
        "type": "complete_words",
        "subject": "Geology",
        "text": (
            "A volcano is an opening in the surface of the Earth. "
            "Deep be[low] the gro[und], it i[s] so h[ot] that ro[ck] melts in[to] a thick liquid called magma. "
            "Because ma[gma] is lig[hter] than t[he] rock aro[und] it, it slowly rises toward the surface. "
            "When it breaks through, the volcano erupts, and the liquid rock, now called lava, flows over the "
            "land. "
            "Over thousands of years, layers of cooled lava can build a tall mountain."
        ),
    },
    {
        "type": "daily_life",
        "format": "advertisement",
        "heading": "Read an advertisement.",
        "text": """
MOVING SALE: USED FURNITURE

I am moving to another country at the end of May, so everything must go!

- Wooden desk with two drawers: $40
- Desk chair: $15 (free if you buy the desk)
- Bookcase with five shelves: $25
- Small blue sofa: $60

All items are in good condition. You must come and pick them up yourself by May 28. Cash only.
Text Dmitri at 555-0142 to choose a time.
""".strip(),
        "questions": [
            q("Why is Dmitri selling his furniture?",
              "He is going to live abroad.",
              "He has bought new furniture.",
              "His apartment is too small.",
              "He needs money for school.",
              "A", "purpose",
              "'I am moving to another country at the end of May, so everything must go!'"),
            q("What must a buyer do?",
              "Pay with a bank card",
              "Buy more than one item",
              "Collect the furniture",
              "Call Dmitri after May 28",
              "C", "detail",
              "'You must come and pick them up yourself by May 28. Cash only.'"),
        ],
    },
    {
        "type": "daily_life",
        "format": "instructions",
        "heading": "Read a set of instructions.",
        "text": """
HOW TO USE THE SELF-CHECKOUT MACHINE

1. Touch the screen and choose your language.
2. Hold your library card under the red light until you hear a beep.
3. Place your books flat on the gray table, one on top of another. You can borrow up to five items at one time.
4. Look at the list on the screen. If a title is missing, take the books off the table and try again.
5. Touch "Finish." You can get your receipt on paper or by email. It shows the day when your books are due.

Please note:
- DVDs and magazines cannot be borrowed at this machine. Take them to the front desk.
- If you owe more than $10 in fines, the machine will not accept your card. Please speak to a librarian.
""".strip(),
        "questions": [
            q("What should you do if a book is missing from the list on the screen?",
              "Touch the Finish button twice",
              "Put the books on the table again",
              "Take the book to the front desk",
              "Scan your library card a second time",
              "B", "detail",
              "Step 4: 'If a title is missing, take the books off the table and try again.'"),
            q("What can a person NOT do at this machine?",
              "Borrow five books at one time",
              "Get a receipt by email",
              "Choose a language",
              "Borrow a DVD",
              "D", "negative",
              "'DVDs and magazines cannot be borrowed at this machine.' The other three are in steps 1, 3 and 5."),
            q("Who needs to talk to a librarian?",
              "Someone who owes $15 in fines",
              "Someone who wants a paper receipt",
              "Someone who is borrowing four books",
              "Someone who has a new library card",
              "A", "inference",
              "The machine will not accept the card of anyone who owes 'more than $10 in fines', and $15 is more "
              "than $10."),
        ],
    },
]

READING_UPPER = [
    {
        "type": "complete_words",
        "subject": "Psychology",
        "text": (
            "Confirmation bias is the tendency to favor information that supports what a person already "
            "believes. "
            "People not[ice] and reme[mber] evidence th[at] agrees wi[th] their opin[ions] while igno[ring] facts "
            "that challenge them. "
            "For inst[ance], a man[ager] who exp[ects] a wor[ker] to fail may see only that person's mistakes. "
            "Because the bias usually operates unconsciously, researchers are trained to look deliberately for "
            "evidence that could prove their own ideas wrong."
        ),
    },
    {
        "type": "academic",
        "subject": "Anthropology",
        "title": "Did Cooking Make Us Human?",
        "paragraphs": [
            "The human brain is an expensive organ. Although it makes up only about two percent of body weight, "
            "it consumes roughly a fifth of the energy the body uses at rest. How our ancestors managed to feed "
            "such a demanding organ is a long-standing puzzle. One influential answer, proposed by the "
            "primatologist Richard Wrangham, is that they learned to cook.",
            "Heat softens food and begins to break it down before it is eaten. As a result, the body obtains "
            "more energy from a cooked meal than from the same meal raw and spends less effort chewing and "
            "digesting it. Wild chimpanzees spend several hours a day simply chewing. According to Wrangham, "
            "cooking freed early humans from this burden, and the surplus energy allowed the brain to expand. He "
            "links the change to Homo erectus, a species that appeared nearly two million years ago with smaller "
            "teeth and a larger brain than its predecessors.",
            "Skeptics point to a gap in the record. Clear traces of controlled fire, such as hearths, are much "
            "younger than the first Homo erectus fossils. Some researchers therefore credit other changes, "
            "including eating more meat or pounding food with stone tools, for the early growth of the brain. "
            "The debate remains open, yet few doubt that cooking, whenever it began, reshaped the human body.",
        ],
        "questions": [
            q("What is the passage mainly about?",
              "The ways in which chimpanzees and humans digest raw food",
              "The reasons archaeologists find it hard to date ancient fires",
              "The methods scientists use to measure the brain's energy needs",
              "A proposed link between cooking and brain growth",
              "D", "main_idea",
              "The passage presents Wrangham's answer to how the brain was fed ('they learned to cook'), "
              "explains it, and then gives the objections."),
            q("According to the passage, what is one effect of heating food?",
              "It removes most of the energy from the food.",
              "It lowers the effort of chewing and digestion.",
              "It makes meat safer to store for long periods.",
              "It causes teeth to grow smaller within a lifetime.",
              "B", "factual",
              "With cooked food the body 'spends less effort chewing and digesting it'."),
            q('The word "surplus" in the passage is closest in meaning to',
              "necessary", "hidden", "extra", "limited",
              "C", "vocabulary",
              "Surplus energy is energy left over beyond what is needed, that is, extra energy."),
            q("Why does the author mention wild chimpanzees?",
              "To illustrate how much time eating raw food can take",
              "To show that some animals have learned to use fire",
              "To suggest that their brains are as large as early humans'",
              "To explain where Wrangham carried out his research",
              "A", "purpose",
              "'Wild chimpanzees spend several hours a day simply chewing'; cooking 'freed early humans from "
              "this burden'."),
            q("What does the passage imply about Wrangham's proposal?",
              "Nearly all researchers have now rejected it.",
              "Direct evidence for its timing has not been found.",
              "It was based mainly on the study of stone tools.",
              "It claims that cooking began after the brain had grown.",
              "B", "inference",
              "'Clear traces of controlled fire... are much younger than the first Homo erectus fossils', so "
              "nothing yet shows fire at the time the theory requires. The debate 'remains open'."),
        ],
    },
]

# ===============================================================================================================
# LISTENING
# ===============================================================================================================
LISTENING_ROUTER = [
    lcr("M-US", "Where did you get that jacket?",
        "It's made of wool, I think.",
        "About two weeks ago, actually.",
        "At the market by the station.",
        "Yes, I've got it right here.",
        "C", "'Where' needs a place. A describes the jacket, B answers 'when', and D only repeats 'get'."),
    lcr("F-UK", "Could you turn the music down a little?",
        "Sure. I didn't know it was that loud.",
        "It's the third song on their new album.",
        "Turn right just after the bridge.",
        "No, I haven't written it down anywhere.",
        "A", "A request to lower the volume is answered by agreeing to do it. C and D only repeat 'turn' and "
             "'down'."),
    lcr("M-AU", "How was the food at that new noodle place?",
        "It's on Clark Street, right next to the bank.",
        "I usually have lunch around noon.",
        "Yes, I knew the place quite well.",
        "A bit salty, but the portions were huge.",
        "D", "'How was the food?' asks for an opinion. A answers 'where', and C plays on 'new' and 'knew'."),
    lcr("F-US", "Have you finished the reading for tomorrow's seminar?",
        "The seminar is in Room 310 this week.",
        "I still have two chapters to go.",
        "Yes, she reads very quickly.",
        "It usually finishes at four o'clock.",
        "B", "B means 'not yet' without saying 'no'. C changes the person, and D is about when the seminar "
             "ends."),
    lcr("M-UK", "My laptop battery barely lasts an hour these days.",
        "Maybe it's time to replace it.",
        "It lasted from nine until noon.",
        "I'll be there in about an hour.",
        "Yes, the days are getting shorter.",
        "A", "The speaker is complaining about a weak battery; A offers a sensible suggestion. B, C and D only "
             "repeat 'last', 'an hour' and 'days'."),
    lcr("F-AU", "Who's leading the discussion group this week?",
        "It's at three in the library.",
        "We're reading chapter nine, I think.",
        "About ten people usually come along.",
        "Amira volunteered, as far as I know.",
        "D", "'Who' needs a person. A answers when and where, B what, C how many."),
    lcr("M-US", "Would you rather meet on Tuesday or Thursday?",
        "Yes, that would be great.",
        "We met at a conference last year.",
        "Thursday works better for me.",
        "I'd rather have the chicken, thanks.",
        "C", "The speaker offers two days, so the reply must pick one; 'Yes' picks neither. D repeats 'rather' "
             "but chooses food."),
    lcr("F-UK", "Do you mind if I borrow your charger for a minute?",
        "It costs about fifteen dollars.",
        "Go ahead. It's in my bag.",
        "Yes, I charged it last night.",
        "I don't mind walking, really.",
        "B", "'Go ahead' gives permission and says where the charger is."),
    lcr("M-AU", "This line for coffee is taking forever.",
        "A large one with milk, please.",
        "You can take it for free.",
        "I drew the line with a ruler.",
        "Let's try the stand outside.",
        "D", "The speaker is complaining about the wait, so the natural reply proposes another place. C takes "
             "'line' literally."),
    lcr("F-US", "Aren't you supposed to be in chemistry lab right now?",
        "It was canceled this morning.",
        "Yes, I suppose it's a hard subject.",
        "The lab is on the ground floor.",
        "I'll be there at two tomorrow.",
        "A", "The speaker is surprised to see the other person; A explains why he or she is not in the lab."),
    lcr("M-UK", "What did Professor Hale say about your proposal?",
        "He's in his office until five today.",
        "It's about pollution in local rivers.",
        "He wants me to narrow it down.",
        "I'll say it again more slowly.",
        "C", "The question asks for the professor's comment. B gives the topic of the proposal instead."),
    lcr("F-AU", "Let me know if you need a hand moving those boxes.",
        "My hands are quite cold, actually.",
        "Thanks, but I think I can manage.",
        "No, I don't know where they are.",
        "The boxes were moved last week.",
        "B", "'Need a hand' is an offer of help; B politely turns it down. A takes 'hand' literally."),
    {
        "type": "conversation",
        "setting": "Listen to a conversation between a student and an employee at the registrar's office.",
        "voices": {"Woman": "F-AU", "Man": "M-UK"},
        "script": [
            ("Woman", "Hi. I'd like to add Statistics 210, but the website says the add period ended on Friday."),
            ("Man", "That's right. After the deadline, you need a late-add form signed by the instructor."),
            ("Woman", "Oh. So I'm not too late?"),
            ("Man", "Not if there's still space in the class."),
            ("Woman", "There is. Actually, I've been sitting in on the lectures since the first week."),
            ("Man", "That'll help. Take this form to your instructor. If she signs it, bring it back here by "
                    "Wednesday."),
            ("Woman", "Is there a fee?"),
            ("Man", "Twenty-five dollars, but you only pay when you hand in the form."),
            ("Woman", "OK. Her office hours start at two, so I'll go straight there."),
        ],
        "questions": [
            q("Why does the woman go to the registrar's office?",
              "To drop a class she finds too hard",
              "To join a class after the deadline",
              "To pay a fee that she owes",
              "To ask about an instructor's office hours",
              "B", "purpose",
              "'I'd like to add Statistics 210, but the website says the add period ended on Friday.'"),
            q("What will the woman probably do next?",
              "Pay the fee at the counter",
              "Go to a statistics lecture",
              "Fill out a form on the website",
              "Go to see her instructor",
              "D", "prediction",
              "The form must be signed by the instructor, and she says 'Her office hours start at two, so I'll "
              "go straight there.' The fee is paid later, with the form."),
        ],
    },
    {
        "type": "conversation",
        "setting": "Listen to a conversation between two roommates.",
        "voices": {"Man": "M-US", "Woman": "F-UK"},
        "script": [
            ("Man", "Nadia, can we talk about the apartment? The kitchen's getting pretty messy."),
            ("Woman", "I know. And I feel like I'm the only one who ever takes out the trash."),
            ("Man", "Fair enough. And I always end up doing the dishes. Why don't we split things up properly?"),
            ("Woman", "OK. I don't mind the dishes, honestly. It's the bathroom I can't stand."),
            ("Man", "Then I'll take the bathroom and the trash, and you do the dishes and the floors."),
            ("Woman", "Deal. Should we write it down so we don't forget?"),
            ("Man", "Good idea. I'll put a list on the fridge tonight."),
        ],
        "questions": [
            q("What are the speakers mainly discussing?",
              "How to share the cleaning",
              "Where to put a new fridge",
              "Who broke some dishes",
              "When to move out",
              "A", "main_idea",
              "The man suggests they 'split things up properly', and they divide the bathroom, trash, dishes "
              "and floors."),
            q("What will the man do tonight?",
              "Clean the bathroom and the floors",
              "Wash the dishes in the sink",
              "Put up a list of their tasks",
              "Take the trash out to the street",
              "C", "prediction",
              "'I'll put a list on the fridge tonight.' The other options are tasks they share out, not plans "
              "for tonight."),
        ],
    },
    {
        "type": "conversation",
        "setting": "Listen to a conversation between a student and a professor.",
        "voices": {"Man": "M-AU", "Woman": "F-US"},
        "script": [
            ("Man", "Come in, Leila. I've read the draft of your lab report."),
            ("Woman", "Thanks, Professor Vasquez. Was it all right?"),
            ("Man", "Well, your method section is excellent. Anyone could repeat the experiment from it."),
            ("Woman", "Oh, good. I spent ages on that part."),
            ("Man", "It shows. The results are where I got lost, though. You've put all the numbers into long "
                    "paragraphs."),
            ("Woman", "Should I use a table instead?"),
            ("Man", "A table, and maybe a graph of the temperature changes. Then the pattern jumps out."),
            ("Woman", "OK. And the conclusion?"),
            ("Man", "It's only two sentences. Tell me whether the results matched your prediction, and why."),
            ("Woman", "Got it. I'll send you a new version by Monday."),
        ],
        "questions": [
            q("What does the professor like about the student's report?",
              "The length of the conclusion",
              "The graph of temperature changes",
              "The way the numbers are presented",
              "The explanation of her method",
              "D", "detail",
              "'Your method section is excellent. Anyone could repeat the experiment from it.' The graph does "
              "not exist yet, and he criticizes the numbers and the conclusion."),
            q("What does the professor suggest the student do with her results?",
              "Show them in a table and a graph",
              "Move them to the method section",
              "Check the numbers again in the lab",
              "Describe them in longer paragraphs",
              "A", "detail",
              "'A table, and maybe a graph of the temperature changes. Then the pattern jumps out.'"),
        ],
    },
    {
        "type": "conversation",
        "setting": "Listen to a conversation at a bicycle repair shop.",
        "voices": {"Woman": "F-AU", "Man": "M-US"},
        "script": [
            ("Woman", "Morning. What can I do for you?"),
            ("Man", "My back tire keeps going flat. I pumped it up last night, and it was empty again this "
                    "morning."),
            ("Woman", "Sounds like a slow leak. Let me see. Yep, there's a tiny piece of glass stuck in the "
                      "tire."),
            ("Man", "Can you patch it?"),
            ("Woman", "I could, but this tube already has two patches on it. I'd put in a new one. It's eight "
                      "dollars, plus five for the work."),
            ("Man", "That's fine. How long will it take?"),
            ("Woman", "About fifteen minutes. But honestly, the tire itself is pretty worn. You'll want to "
                      "replace it before winter."),
            ("Man", "I'll think about that next month. Just the tube today, please."),
        ],
        "questions": [
            q("What caused the problem with the man's bicycle?",
              "The tire was pumped up too much.",
              "The tube was the wrong size.",
              "Something sharp went into the tire.",
              "The bicycle was left outside all winter.",
              "C", "detail",
              "'There's a tiny piece of glass stuck in the tire.'"),
            q("What does the man decide to do?",
              "Have the old tube patched again",
              "Have only the tube replaced",
              "Replace both the tire and the tube",
              "Bring the bicycle back in fifteen minutes",
              "B", "detail",
              "He agrees to the new tube ('That's fine') but says of the tire, 'I'll think about that next "
              "month. Just the tube today, please.'"),
        ],
    },
    {
        "type": "announcement",
        "setting": "Listen to an announcement on a campus shuttle bus.",
        "voice": "F-UK",
        "script": (
            "Attention, passengers. Starting this Monday, the Blue Line shuttle will follow a different route "
            "because Hillcrest Road is being repaired. The shuttle will not stop at the Arts Center. Instead, it "
            "will stop on Mill Street, in front of the bookstore, about a three-minute walk away. All other "
            "stops stay the same, and buses will still come every fifteen minutes. The road work should last "
            "about six weeks. You can get a new route map from your driver or on the transportation website."
        ),
        "questions": [
            q("What is the main purpose of the announcement?",
              "To explain why the shuttle has been late",
              "To introduce a new shuttle line to the Arts Center",
              "To tell riders that a route is changing",
              "To ask riders to buy new passes",
              "C", "purpose",
              "'The Blue Line shuttle will follow a different route because Hillcrest Road is being repaired.'"),
            q("Where will the Blue Line stop instead of the Arts Center?",
              "In front of the bookstore",
              "On Hillcrest Road",
              "At the transportation office",
              "Behind the Arts Center",
              "A", "detail",
              "'Instead, it will stop on Mill Street, in front of the bookstore.'"),
        ],
    },
    {
        "type": "announcement",
        "setting": "Listen to an announcement in a classroom.",
        "voice": "M-UK",
        "script": (
            "One more thing before you go. Next Thursday, we'll have a guest in class. Dr. Farah Aziz, who "
            "designs bridges for a living, will talk to us about how engineers test new materials. She took this "
            "very course twelve years ago, so she knows exactly what you're going through. Please read the short "
            "article I posted online, and come with at least one question for her. Oh, and we'll meet in the "
            "auditorium downstairs, not here, because the other section is joining us."
        ),
        "questions": [
            q("What is the announcement mainly about?",
              "A change to the course reading list",
              "A visitor who will give a talk",
              "A field trip to look at a bridge",
              "A test on engineering materials",
              "B", "main_idea",
              "'Next Thursday, we'll have a guest in class', an engineer who will give a talk."),
            q("Why will the class meet in the auditorium?",
              "The usual room is being repaired.",
              "The speaker needs special equipment.",
              "The talk is open to the public.",
              "Extra students will be there.",
              "D", "inference",
              "They will meet there 'because the other section is joining us', so the audience will be larger."),
        ],
    },
    {
        "type": "talk",
        "subject": "Astronomy",
        "voice": "F-US",
        "script": (
            "Raise your hand if you learned in school that there are nine planets. OK, quite a few of you. So "
            "what happened to number nine? Well, Pluto didn't change. Our definition did. Pluto was discovered "
            "in nineteen thirty, and for decades it was simply the ninth planet. But it was always a strange "
            "one. It's tiny, smaller than our own Moon, and its orbit is tilted compared with the others. Then, "
            "in the nineteen nineties, astronomers started finding more and more icy objects out beyond Neptune, "
            "in a region called the Kuiper Belt. And in two thousand five, they found one, later named Eris, "
            "that's about the same size as Pluto. So here was the problem. If Pluto's a planet, then Eris is "
            "too, and maybe dozens of others. Where do you stop? So in two thousand six, the International "
            "Astronomical Union voted on an official definition. A planet has to orbit the Sun, it has to be big "
            "enough for its gravity to pull it into a round shape, and it has to have cleared other objects out "
            "of its path. Pluto passes the first two tests. But it shares its neighborhood with all those icy "
            "bodies, so it fails the third. That's why it's now called a dwarf planet. Not everybody was happy "
            "about that, by the way, and some astronomers still argue the definition should change."
        ),
        "questions": [
            q("What is the talk mainly about?",
              "How Pluto was discovered in 1930",
              "Why Pluto was put in a new category",
              "What the Kuiper Belt is made of",
              "How astronomers measure the size of planets",
              "B", "main_idea",
              "The professor asks 'what happened to number nine?' and explains the new definition that made "
              "Pluto a dwarf planet."),
            q("Why does the professor mention Eris?",
              "To prove that Pluto is larger than the Moon",
              "To show that Neptune has an unusual orbit",
              "To give an example of an object with a tilted orbit",
              "To explain why a definition became necessary",
              "D", "function",
              "'If Pluto's a planet, then Eris is too, and maybe dozens of others. Where do you stop?' The vote "
              "on a definition followed."),
            q("According to the professor, which test does Pluto fail?",
              "Clearing objects from its path",
              "Traveling in an orbit around the Sun",
              "Being pulled into a round shape",
              "Being larger than Earth's Moon",
              "A", "detail",
              "Pluto 'passes the first two tests' but 'shares its neighborhood with all those icy bodies, so "
              "it fails the third'. Size compared with the Moon is not one of the tests."),
            q("What does the professor imply about the decision made in 2006?",
              "It will be reversed within a few years.",
              "It was based on a mistake about Pluto's size.",
              "Some astronomers still do not accept it.",
              "It was made without a vote.",
              "C", "inference",
              "'Not everybody was happy about that... and some astronomers still argue the definition should "
              "change.'"),
        ],
    },
    {
        "type": "talk",
        "subject": "Business history",
        "voice": "M-AU",
        "script": (
            "Let's start with a number. Before nineteen thirteen, it took workers at Henry Ford's factory more "
            "than twelve hours to assemble the chassis of one Model T, that's the frame with the engine and "
            "wheels. About a year later, it took an hour and a half. "
            "What changed? Not the car. What changed was how the work moved. Before, the car stayed in one "
            "place, and teams of workers walked around it, fetching parts. Ford's engineers turned that around. "
            "They put the car on a moving line and had it travel past the workers. Each person stood in one spot "
            "and did one small job, over and over, maybe tightening the same two bolts all day. The results were "
            "dramatic. Because cars were faster to build, they were cheaper to build, and the price of a Model T "
            "fell year after year, until ordinary families could afford one. But there was a cost. The work was "
            "so dull and so tiring that workers kept quitting, and Ford had to keep hiring and training new "
            "ones. His answer, in nineteen fourteen, was the five-dollar day, roughly double the usual pay. It "
            "worked. People stayed. And, as it happened, with wages like that, his own workers could now buy the "
            "cars they were building."
        ),
        "questions": [
            q("What is the talk mainly about?",
              "A change in how cars were put together",
              "Why the Model T was redesigned in 1914",
              "How Henry Ford chose and trained engineers",
              "Why the earliest cars broke down so often",
              "A", "main_idea",
              "'What changed was how the work moved': the talk describes the moving line and its results."),
            q("According to the professor, what was new about Ford's system?",
              "Teams of workers walked around each car.",
              "Each worker learned to do every job.",
              "The car moved, and the workers did not.",
              "Parts were made in a separate factory.",
              "C", "detail",
              "'They put the car on a moving line and had it travel past the workers. Each person stood in one "
              "spot.' A describes the old system."),
            q("What problem did the new system create?",
              "Cars became too expensive for families.",
              "Engineers refused to change the factory.",
              "The cars took longer to build.",
              "Many workers left their jobs.",
              "D", "detail",
              "'The work was so dull and so tiring that workers kept quitting.'"),
            q("What does the professor imply about the five-dollar day?",
              "It was lower than the pay at other factories.",
              "It benefited Ford in more than one way.",
              "It forced Ford to raise the price of his cars.",
              "It was introduced before the moving line.",
              "B", "inference",
              "It kept workers ('People stayed'), and 'his own workers could now buy the cars they were "
              "building', so it also created customers."),
        ],
    },
]

LISTENING_LOWER = [
    lcr("F-AU", "How much is a sandwich here?",
        "Yes, with cheese, please.",
        "Four dollars fifty.",
        "Every day at noon.",
        "It's very fresh today.",
        "B", "'How much' asks for a price."),
    lcr("M-UK", "Can you help me carry this bag?",
        "It's a black bag.",
        "Yes, I can swim.",
        "No, it's on the kitchen table.",
        "Sure. Where do you want it?",
        "D", "The speaker asks for help; D agrees and asks where to put the bag."),
    lcr("F-US", "When is your birthday?",
        "It's on May second.",
        "I'm twenty years old.",
        "At my parents' house.",
        "A cake and some gifts.",
        "A", "'When' needs a date. B gives an age and C a place."),
    lcr("M-AU", "Do you have any brothers or sisters?",
        "They're at school now.",
        "Yes, he is my brother.",
        "Just one sister.",
        "My mother is a nurse.",
        "C", "C answers the question about brothers and sisters directly."),
    lcr("F-UK", "Let's have pizza tonight.",
        "It was delicious.",
        "At seven last night.",
        "The kitchen is over there.",
        "Great. I'm really hungry.",
        "D", "A suggestion is accepted with 'Great'. A and B are about the past."),
    lcr("M-US", "Which bus goes to the city center?",
        "It takes twenty minutes.",
        "The number nine does.",
        "It's a very big city.",
        "Two tickets, please.",
        "B", "'Which bus' needs the name or number of a bus. A answers 'how long'."),
    lcr("F-AU", "How was your weekend?",
        "Very relaxing, thanks.",
        "On Saturday and Sunday.",
        "Next weekend, I think.",
        "It's the end of the week.",
        "A", "'How was...?' asks for an opinion about something in the past."),
    {
        "type": "conversation",
        "setting": "Listen to a conversation between two classmates.",
        "voices": {"Man": "M-UK", "Woman": "F-US"},
        "script": [
            ("Man", "Hi, Sofia. Do you want to study for the history test together?"),
            ("Woman", "Yes, good idea. But the library is closed on Sunday."),
            ("Man", "We can go to the Corner Cup Café. It's quiet in the afternoon."),
            ("Woman", "OK. What time?"),
            ("Man", "Is two o'clock good for you?"),
            ("Woman", "I have lunch with my aunt at one. Can we meet at three?"),
            ("Man", "Three is fine. I'll bring my notes from class."),
            ("Woman", "Great. And I'll bring the textbook. See you on Sunday."),
        ],
        "questions": [
            q("What time will the students meet?",
              "At 1:00",
              "At 2:00",
              "At 3:00",
              "At 4:00",
              "C", "detail",
              "The woman asks 'Can we meet at three?' and the man answers 'Three is fine.'"),
            q("What will the man bring on Sunday?",
              "His notes from class",
              "The history textbook",
              "Lunch for his aunt",
              "A library book",
              "A", "detail",
              "'I'll bring my notes from class.' The woman will bring the textbook."),
        ],
    },
    {
        "type": "announcement",
        "setting": "Listen to an announcement at a gym.",
        "voice": "M-AU",
        "script": (
            "Good morning, members. Here is a short message. The swimming pool will be closed tomorrow, "
            "Wednesday, for cleaning. It will open again on Thursday morning at six o'clock. Tomorrow's swimming "
            "class for beginners will not take place. Instead, the teacher will give an extra class next Monday "
            "at five. The exercise rooms and the changing rooms are open as usual. Thank you, and enjoy your "
            "workout."
        ),
        "questions": [
            q("Why will the pool be closed tomorrow?",
              "A class is using it.",
              "The teacher is away.",
              "It is a holiday.",
              "It will be cleaned.",
              "D", "detail",
              "'The swimming pool will be closed tomorrow, Wednesday, for cleaning.'"),
            q("When is the extra class for beginners?",
              "Tomorrow at six",
              "Next Monday at five",
              "On Thursday morning",
              "On Wednesday at five",
              "B", "detail",
              "'The teacher will give an extra class next Monday at five.'"),
        ],
    },
    {
        "type": "announcement",
        "setting": "Listen to an announcement from a student club.",
        "voice": "F-UK",
        "script": (
            "Hello, everyone. Do you want to practice a new language and make new friends? Then come to the "
            "first meeting of the Language Exchange Club. We meet this Wednesday at four thirty in Room 12 of "
            "the Student Center. At each meeting, you help a partner with your language for half an hour. Then "
            "your partner helps you with theirs. You don't need to sign up, and it's free. Just bring a notebook "
            "and a pen. Come and say hello!"
        ),
        "questions": [
            q("What is the announcement mainly about?",
              "A club for language practice",
              "A language class with a new teacher",
              "A trip for international students",
              "A shop that sells notebooks and pens",
              "A", "main_idea",
              "It invites students to 'the first meeting of the Language Exchange Club'."),
            q("What should students bring to the meeting?",
              "A language textbook",
              "A sign-up form",
              "A notebook and a pen",
              "Some money for the fee",
              "C", "detail",
              "'Just bring a notebook and a pen.' There is no sign-up and no fee."),
        ],
    },
    {
        "type": "announcement",
        "setting": "Listen to an announcement in a classroom.",
        "voice": "M-US",
        "script": (
            "Before you go, please listen. This Friday is the last day of the term, so you need to return your "
            "science textbooks. Bring them to me here in Room 8 before lunch. Please look inside your book first "
            "and take out any papers. Also, check that your name is still on the cover. If you have lost your "
            "book, tell me today. A new one costs twenty dollars. Thank you, everyone."
        ),
        "questions": [
            q("What does the teacher ask the students to do?",
              "Buy a new science book",
              "Write their names in a notebook",
              "Give back their textbooks",
              "Come to class early on Friday",
              "C", "main_idea",
              "'You need to return your science textbooks.'"),
            q("What should students do if they have lost their book?",
              "Wait until Friday",
              "Look for it in Room 8",
              "Take out any papers",
              "Tell the teacher",
              "D", "detail",
              "'If you have lost your book, tell me today.'"),
        ],
    },
]

LISTENING_UPPER = [
    lcr("F-US", "Any chance you could cover my shift on Saturday?",
        "Yes, the cover was torn already.",
        "I've already shifted all the furniture.",
        "I would, but I'm away all weekend.",
        "No, Saturday turned out quite busy.",
        "C", "To 'cover a shift' is to work in someone's place. C refuses politely with a reason; A and B take "
             "'cover' and 'shift' literally."),
    lcr("M-AU", "That midterm was a piece of cake, wasn't it?",
        "Speak for yourself. I ran out of time.",
        "No thanks, I've only just had lunch.",
        "Yes, I'll bring some dessert on Friday.",
        "It's on the fifteenth, as far as I know.",
        "A", "'A piece of cake' means very easy. 'Speak for yourself' disagrees: the exam was hard for the "
             "second speaker."),
    lcr("F-UK", "Apparently, they're thinking of cutting the funding for the writing center.",
        "Sure, I'll write to you soon.",
        "I had mine cut just yesterday.",
        "It's right in the center of the campus.",
        "That would be a real loss for students.",
        "D", "The speaker reports worrying news; D reacts to what the cut would mean. B takes 'cutting' "
             "literally."),
    {
        "type": "conversation",
        "setting": "Listen to a conversation between a student and an academic advisor.",
        "voices": {"Woman": "F-AU", "Man": "M-US"},
        "script": [
            ("Woman", "So, Kenji, your email said you're having second thoughts about engineering."),
            ("Man", "That's putting it mildly. I've been dragging myself to every lecture since September."),
            ("Woman", "And yet your grades are solid. What's drawing you to linguistics?"),
            ("Man", "I took the intro course as an elective, and for the first time I was actually reading "
                    "ahead."),
            ("Woman", "That counts for something. Still, switching in your third year isn't trivial. You'd need "
                      "at least two extra semesters."),
            ("Man", "I figured as much. My parents won't be thrilled about the tuition."),
            ("Woman", "Then before you burn any bridges, why not declare a minor this term? If you're still "
                      "hooked by spring, we'll file the paperwork."),
            ("Man", "A trial run. I can live with that."),
        ],
        "questions": [
            q("What does the man imply about his engineering lectures?",
              "They are too difficult for him to pass.",
              "He goes to them without any enthusiasm.",
              "He has stopped attending them.",
              "They clash with his linguistics course.",
              "B", "inference",
              "'I've been dragging myself to every lecture': he attends, but unwillingly. His grades are "
              "'solid', so difficulty is not the problem."),
            q("What does the advisor suggest the man do?",
              "Finish his engineering degree first",
              "Ask his parents to cover the extra tuition",
              "Change his major before the spring",
              "Try linguistics as a minor before deciding",
              "D", "detail",
              "'Before you burn any bridges, why not declare a minor this term? If you're still hooked by "
              "spring, we'll file the paperwork.'"),
        ],
    },
    {
        "type": "announcement",
        "setting": "Listen to an announcement from a university careers office.",
        "voice": "M-UK",
        "script": (
            "A quick update for anyone planning to attend the Spring Career Fair. Owing to a clash with "
            "final-year exams, the fair has been pushed back from March third to March seventeenth. The venue, "
            "Rowan Sports Hall, is unchanged. What has changed is how you sign up. Rather than simply turning "
            "up, you'll need to reserve a one-hour entry slot through the careers portal and upload a résumé "
            "when you do. Slots open this Friday at noon, and judging by last year, the morning ones won't last "
            "long. Employers will see your résumé in advance, so make sure it's the version you'd want them to "
            "read."
        ),
        "questions": [
            q("Why has the career fair been moved to a later date?",
              "It fell during an exam period.",
              "The sports hall was not available.",
              "Too few employers had signed up.",
              "The careers portal was not ready.",
              "A", "detail",
              "'Owing to a clash with final-year exams, the fair has been pushed back.' The hall 'is "
              "unchanged'."),
            q("What does the speaker imply about the morning entry slots?",
              "They are reserved for final-year students.",
              "They will be longer than one hour.",
              "They are likely to be taken quickly.",
              "They were not offered last year.",
              "C", "inference",
              "'Judging by last year, the morning ones won't last long', so students who want one should book "
              "soon after noon on Friday."),
        ],
    },
    {
        "type": "talk",
        "subject": "Environmental science",
        "voice": "F-UK",
        "script": (
            "I'd like to clear up a misconception before we go any further. When people see photos of a "
            "bleached reef, all that ghostly white, they tend to assume they're looking at dead coral. They're "
            "not. Not yet, anyway. Here's what's going on. A coral is an animal, and living inside its tissue "
            "are microscopic algae. It's a partnership. The coral provides shelter, and the algae, through "
            "photosynthesis, supply most of the coral's food. They're also what gives a reef its color. Now, "
            "when the water stays unusually warm for several weeks, even by just a degree or two, that "
            "partnership breaks down. The algae start producing substances that are toxic to their host, and "
            "the coral responds by, well, evicting them. What's left is transparent tissue over a white "
            "skeleton. Hence, bleaching. So a bleached coral is alive, but it's essentially starving. If the "
            "water cools in time, the algae come back and the coral recovers. If it doesn't, the coral dies. "
            "And this is where I struggle to sound optimistic. A reef can bounce back from one bad summer, but "
            "that takes a decade or so. What we're seeing now are heat waves arriving every few years, which "
            "simply doesn't leave enough time. So when you read that a reef has recovered, I'd encourage you to "
            "ask: recovered for how long?"
        ),
        "questions": [
            q("What is the main purpose of the talk?",
              "To describe the fish that live on coral reefs",
              "To argue that bleached reefs can never recover",
              "To compare algae with other ocean plants",
              "To explain what happens when coral bleaches",
              "D", "purpose",
              "The professor corrects the idea that bleached coral is dead ('Here's what's going on') and "
              "describes the process and its outcome. B is wrong because a reef 'can bounce back from one bad "
              "summer'."),
            q("According to the professor, what do the algae give the coral?",
              "A hard white skeleton",
              "Most of its food",
              "Protection from warm water",
              "A place to shelter",
              "B", "detail",
              "'The algae, through photosynthesis, supply most of the coral's food.' Shelter is what the coral "
              "gives the algae."),
            q('Why does the professor say this: "Not yet, anyway"?',
              "To signal that the coral may still die",
              "To admit that she is unsure of the facts",
              "To show that the photos are out of date",
              "To suggest that the reef was never alive",
              "A", "function",
              "Bleached coral is alive but 'essentially starving'; if the water does not cool, 'the coral "
              "dies'. 'Not yet' points ahead to that risk."),
            q("What is the professor's attitude toward reports that a reef has recovered?",
              "She is confident that they are accurate.",
              "She thinks they exaggerate the damage.",
              "She doubts that the recovery will last.",
              "She finds them too technical for the public.",
              "C", "attitude",
              "'This is where I struggle to sound optimistic... I'd encourage you to ask: recovered for how "
              "long?'"),
        ],
    },
    {
        "type": "talk",
        "subject": "Linguistics",
        "voice": "M-AU",
        "script": (
            "Here's something that ought to puzzle us more than it does. Nobody sits a two-year-old down and "
            "explains the past tense. And yet, by four or so, virtually every child is using it. So how do they "
            "pull that off? The obvious guess is imitation. Children just copy what they hear. But listen to "
            "the mistakes they make. A child will say 'I goed to the park' or 'two foots.' Now, no adult says "
            "'goed.' The child can't be copying. What she's done is work out a rule, put a 'd' sound on the end "
            "for the past, and apply it a little too enthusiastically. There's a lovely experiment from the "
            "nineteen fifties that makes the same point. The researcher, Jean Berko, showed young children a "
            "drawing of an imaginary creature and said, 'This is a wug.' Then she showed them two. 'Now there "
            "are two...' And the children said 'wugs.' They'd never heard that word in their lives, so they "
            "couldn't have memorized its plural. And interestingly, when parents do correct their children, it "
            "tends to be about facts, not grammar. Call a dog a cat, and you'll be corrected. Say something "
            "true in broken grammar, and you'll get a smile. So children aren't parrots. They're more like "
            "little scientists, testing guesses about a system no one has explained to them."
        ),
        "questions": [
            q("What is the main point of the talk?",
              "Parents should correct children's grammar more often.",
              "Children work out grammar rules for themselves.",
              "Children learn nouns earlier than they learn verbs.",
              "Language experiments on young children are unreliable.",
              "B", "main_idea",
              "'The child can't be copying. What she's done is work out a rule'; 'children aren't parrots'."),
            q('Why does the professor mention the word "goed"?',
              "To show that children hear adults make mistakes",
              "To explain why the past tense is taught at school",
              "To give evidence that children are not simply imitating",
              "To illustrate a word that children find hard to pronounce",
              "C", "function",
              "'No adult says goed. The child can't be copying.'"),
            q("What did the experiment with the imaginary creature show?",
              "Children can make plurals of unfamiliar words.",
              "Children remember drawings better than words.",
              "Children enjoy invented words more than real ones.",
              "Children learn plurals by repeating their parents.",
              "A", "detail",
              "The children said 'wugs' although 'they'd never heard that word in their lives, so they couldn't "
              "have memorized its plural'."),
            q("What does the professor imply about parents' corrections?",
              "They are the main way children learn grammar.",
              "They usually leave young children confused.",
              "They happen more often with older children.",
              "They are too rarely about grammar to teach it.",
              "D", "inference",
              "Corrections tend 'to be about facts, not grammar', so they cannot be the source of children's "
              "grammar."),
        ],
    },
]

# ===============================================================================================================
# WRITING
# ===============================================================================================================
WRITING = {
    "build": [
        build("Is the projector in Room 5 working again?",
              "I do not think anyone has repaired it.",
              ["I", "do not", "think", "anyone", "has", "repaired it"], "negation"),
        build("I'm going to the post office after class.",
              "Could you mail this letter for me?",
              ["could", "you", "mail", "this letter", "for me"], "modal"),
        build("I finally bought a ticket for the spring concert.",
              "How much did you pay for it?",
              ["how much", "did", "you", "pay", "for it"], "wh_question"),
        build("Should we take the bus or walk to the stadium?",
              "Walking is faster than waiting for the bus.",
              ["is", "faster than", "waiting", "for", "the bus"], "comparison", prefix="Walking"),
        build("I need to print my poster in color before class.",
              "Do you know whether the computer lab has a color printer?",
              ["do", "you know", "whether", "the computer lab", "has", "a color printer"], "embedded_question",
              extra="have"),
        build("Why is the main entrance closed?",
              "The front steps are being repaired this week.",
              ["the front steps", "are", "being", "repaired"], "passive", suffix="this week.", extra="is"),
        build("I've decided to study in Canada next year.",
              "Have you told your parents about your plans?",
              ["have", "you", "told", "your parents", "about your plans"], "perfect"),
        build("I need some advice about applying for the scholarship.",
              "Ask the professor who helped me with my application.",
              ["ask", "the professor", "who", "helped me", "with", "my application"], "relative_clause",
              extra="which"),
        build("Is the housing form due this week?",
              "I'm not sure when the form has to be submitted.",
              ["when", "the form", "has to", "be", "submitted"], "embedded_question",
              prefix="I'm not sure", extra="does"),
        build("I stayed up all night finishing the slides by myself.",
              "If you had called me, I would have helped you finish them.",
              ["I", "would have", "helped", "you finish", "them"], "conditional",
              prefix="If you had called me,"),
    ],
    "email": {
        "scenario": (
            "You are taking a marketing course, and your group of four is scheduled to give its final "
            "presentation next Monday. One member of your group, who prepared the section on survey results, has "
            "just learned that she will be away at a national swimming competition that day. The rest of the "
            "group does not want to present without her. You decide to write to your instructor, Professor "
            "Lindqvist."
        ),
        "to": "Professor Lindqvist",
        "subject": "Group 3 presentation on Monday",
        "bullets": [
            "Describe the problem your group has with the presentation date.",
            "Suggest one or two possible solutions.",
            "Ask how the change might affect your group's grade.",
        ],
        "model": """
Dear Professor Lindqvist,

I am writing on behalf of Group 3 in your marketing class. We are scheduled to give our final presentation next Monday, but one of our members, Aiko Tanaka, has been selected for a national swimming competition and will be out of town that day. Aiko prepared the section on our survey results, so it would be difficult for the rest of us to present it well without her.

We would like to suggest two possible solutions. We could exchange dates with one of the groups presenting on Wednesday, if one of them agrees. Alternatively, Aiko could record her part in advance, and we would play the video during our presentation on Monday.

Could you please tell us which of these you would accept? We would also like to ask whether presenting on a different day, or with a recorded section, would affect our grade.

Thank you for your understanding.

Sincerely,
Rahul Mehta
""".strip(),
    },
    "discussion": {
        "course": "education policy",
        "professor": {
            "name": "Dr. Moreau",
            "post": (
                "This week, we are examining how universities design their degree programs. At many "
                "universities, students must complete general education courses in fields unrelated to their "
                "major, so an engineering student may have to study literature and a history student may have "
                "to take a science class. Some educators see this as essential to a complete education, whereas "
                "others consider it a waste of students' time and money. What is your view? Should universities "
                "require every student to take courses outside their major? Why or why not?"
            ),
        },
        "students": [
            {
                "name": "Lucas",
                "post": (
                    "I support the requirement. Most of us chose our majors at eighteen, before we had tried "
                    "many subjects. A required course in another field can reveal an interest we never knew we "
                    "had. My cousin started in accounting, took a required geology class, and ended up changing "
                    "her major. Without that rule, she would never have found the career she loves."
                ),
            },
            {
                "name": "Yuna",
                "post": (
                    "I see it differently. University is already expensive, and every required course outside "
                    "my major costs money and delays the classes I actually need for my career. If I want to "
                    "learn about art or history, I can read books or watch free lectures online. Universities "
                    "should let adults decide how to spend their own time and tuition."
                ),
            },
        ],
        "model": (
            "In my view, universities should keep a requirement for courses outside the major, but it should be "
            "small and flexible. I understand Yuna's concern about cost; nobody wants to pay for classes that "
            "feel irrelevant. However, I think she overlooks how much working life changes. Many graduates end "
            "up in jobs that did not exist when they started their degrees, and they need skills from several "
            "fields to adapt. A programmer who has studied psychology, for example, can design software that "
            "people actually enjoy using. Lucas mentions discovering new interests, and I would add that mixed "
            "classes also teach students to work with people who think differently from them. To limit the "
            "cost, universities could require only three or four such courses and let students choose freely "
            "among them. That way, the requirement broadens students' education without holding them back."
        ),
    },
}

# ===============================================================================================================
# SPEAKING
# ===============================================================================================================
SPEAKING = {
    "repeat": {
        "scenario": (
            "You are learning how to serve customers at a campus café. Listen to your manager and repeat what "
            "he says. Repeat only once."
        ),
        "picture": "A campus café counter with an espresso machine, a pastry case and a small refrigerator.",
        "voice": "M-AU",
        "sentences": [
            "Greet every customer with a smile.",
            "The cups and lids are under the counter.",
            "Always ask whether the drink is for here or to go.",
            "Write the customer's name on the side of the cup.",
            "Milk and cream are kept in the small refrigerator on the left.",
            "If a customer asks for a drink we don't have, suggest something similar from the menu.",
            "When the line gets long, call a coworker from the back so that nobody waits more than five minutes.",
        ],
    },
    "interview": {
        "topic": "sleep habits",
        "scenario": (
            "You have agreed to take part in a research study about sleep habits. You will have a short online "
            "interview with a researcher. The researcher will ask you some questions."
        ),
        "voice": "F-US",
        "questions": [
            {
                "kind": "life",
                "q": (
                    "Thank you for joining me today. To start, I'd like to hear about a typical night. What "
                    "time do you usually go to bed and get up, and what do you do in the last hour before you "
                    "sleep?"
                ),
                "model": (
                    "On a normal weekday, I go to bed at around half past eleven and get up at seven, so I "
                    "sleep for about seven and a half hours. In the last hour before bed, I try to follow the "
                    "same routine. First, I prepare my bag and my clothes for the next morning so that I don't "
                    "have to rush. Then I take a warm shower and read a few pages of a novel. I have to admit "
                    "that I often look at my phone as well, even though I know it keeps me awake longer. On "
                    "weekends, I go to bed much later and sleep until nine or ten."
                ),
            },
            {
                "kind": "life",
                "q": (
                    "Some people do their best work early in the morning, while others feel more awake late at "
                    "night. Which kind of person are you, and how does that affect the way you plan your day?"
                ),
                "model": (
                    "I am definitely a morning person. My mind is clearest between about seven and eleven, so "
                    "I plan my day around those hours. I do the tasks that need the most concentration, such as "
                    "writing essays or solving math problems, before lunch. In the afternoon, I feel slower, so "
                    "I use that time for easier things like answering messages, shopping, or going to the gym. "
                    "By ten at night, I can hardly keep my eyes open, and anything I study then, I forget by "
                    "the next day. My friends who are night owls think this is strange, but getting up early "
                    "suits me."
                ),
            },
            {
                "kind": "opinion",
                "q": (
                    "Now I'd like to hear your opinion. Some people say that students today do not get enough "
                    "sleep because of smartphones and social media. Do you agree? Why or why not?"
                ),
                "model": (
                    "I mostly agree. Many students I know take their phones to bed and plan to check one "
                    "message, but then they keep watching videos for an hour. The content never ends, so it is "
                    "hard to stop. Messages also arrive late at night, and people feel they must reply at once. "
                    "However, I don't think phones are the only cause. Students also lose sleep because of "
                    "homework, part-time jobs, and early classes. Even without a phone, a student who finishes "
                    "work at eleven and has a class at eight will be tired. So phones make the problem worse, "
                    "but they did not create it."
                ),
            },
            {
                "kind": "opinion",
                "q": (
                    "Here is my last question. Some schools have moved the start of the school day to a later "
                    "hour so that teenagers can sleep longer. Do you think more schools should do this? Why or "
                    "why not?"
                ),
                "model": (
                    "Yes, I think more schools should start later, at least for teenagers. When I was in high "
                    "school, my first class began at half past seven, and most of us were half asleep. We did "
                    "not learn much in that first hour, so the time was wasted. If classes began an hour later, "
                    "students would be more awake, and I believe their grades and their mood would improve. Of "
                    "course, there are practical problems. Parents who start work early may have difficulty "
                    "taking their children to school, and sports practice would finish later in the evening. "
                    "Still, I think these problems can be solved, and well-rested students are worth the effort."
                ),
            },
        ],
    },
}

FORM = {
    "number": 2,
    "theme": "Green roofs and cooking; Pluto, the assembly line, coral bleaching, first words",
    "reading": {"router": READING_ROUTER, "lower": READING_LOWER, "upper": READING_UPPER},
    "listening": {"router": LISTENING_ROUTER, "lower": LISTENING_LOWER, "upper": LISTENING_UPPER},
    "writing": WRITING,
    "speaking": SPEAKING,
}
