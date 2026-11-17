"""TOEFL iBT practice test 05. Same structure as form01.py, entirely different content (see AUTHORING.md)."""

from common import build, lcr, q

# ===============================================================================================================
# READING
# ===============================================================================================================
READING_ROUTER = [
    {
        "type": "complete_words",
        "subject": "Ecology",
        "text": (
            "A food chain shows how energy passes from one living thing to another in an ecosystem. "
            "Green pla[nts] use sunl[ight] to ma[ke] their o[wn] food, s[o] scientists call them producers. "
            "Rabbits a[nd] other ani[mals] that e[at] grass a[re] the pri[mary] consumers. "
            "Foxes and other hunters eat these consumers in turn, and the energy moves one more step along the "
            "chain. "
            "When living things die, bacteria and fungi break them down and return nutrients to the soil."
        ),
    },
    {
        "type": "complete_words",
        "subject": "History",
        "text": (
            "The Industrial Revolution was a period of rapid change that began in Britain in the late eighteenth "
            "century. "
            "For cent[uries], most go[ods] had be[en] made b[y] hand i[n] small workshops. "
            "Then engi[neers] built mach[ines] that co[uld] spin thr[ead] and we[ave] cloth far faster than any "
            "person. "
            "Steam engines soon powered this equipment, and production moved into large factories. "
            "As a result, millions of people left farms and villages to find work in growing cities."
        ),
    },
    {
        "type": "daily_life",
        "format": "notice",
        "heading": "Read a note.",
        "text": """
TO EVERYONE WHO SHARES THIS FRIDGE

It is getting hard to find space in here, and some things have clearly been forgotten. Starting this week, I will clear out the fridge every Friday at 6:00 p.m. Anything without a name and a date on it will be thrown away, including the container. So please label whatever you want to keep. Stickers and a pen are in the drawer under the microwave.

Thanks!
Tomasz, Room 12
""".strip(),
        "questions": [
            q("Why did Tomasz write the note?",
              "To find the owner of some forgotten food",
              "To announce a weekly clean-out of the refrigerator",
              "To complain that some of his food has been taken",
              "To tell residents that the refrigerator will be replaced",
              "B", "purpose",
              "'Starting this week, I will clear out the fridge every Friday at 6:00 p.m.' He mentions forgotten "
              "things but does not look for their owners."),
            q("What does Tomasz ask the people who share the refrigerator to do?",
              "Keep their food in the drawer under the microwave",
              "Take all of their food out by Friday evening",
              "Let him know which containers belong to them",
              "Put a name and a date on their food",
              "D", "detail",
              "'Please label whatever you want to keep': anything 'without a name and a date' is thrown away. The "
              "drawer holds only stickers and a pen."),
        ],
    },
    {
        "type": "daily_life",
        "format": "email",
        "heading": "Read an email.",
        "text": """
To: Ines Carvalho
From: BrightLine Internet
Subject: Your installation visit

Dear Ms. Carvalho,

A technician will come to your apartment on Thursday, June 12, to install your internet service. He will arrive between 1:00 and 4:00 p.m. and will call you about 30 minutes before he reaches your building.

An adult must be at home during the visit. Please also clear the area around the wall socket where the cable enters the apartment. You do not need to buy any equipment: the technician will bring a router, which is included in your plan.

If this time does not suit you, you can change it on our website up to 24 hours before the visit. After that, a $25 fee applies for a missed appointment.

Kind regards,
BrightLine Customer Care
""".strip(),
        "questions": [
            q("What is the main purpose of the email?",
              "To give details about an upcoming service appointment",
              "To apologize for a delay in installing an internet service",
              "To offer a customer a faster internet plan",
              "To ask a customer to return some equipment",
              "A", "purpose",
              "The email gives the date, the arrival window and what the customer must do for the installation "
              "visit."),
            q("What will the technician do before he arrives?",
              "Send a message with the exact price",
              "Ask Ms. Carvalho to buy a router",
              "Contact Ms. Carvalho by phone",
              "Change the time on the website",
              "C", "detail",
              "He 'will call you about 30 minutes before he reaches your building'."),
            q("What is suggested about the router?",
              "Ms. Carvalho must collect it from a store.",
              "Ms. Carvalho will not be charged extra for it.",
              "It will be delivered the day before the visit.",
              "It has to be returned after one year.",
              "B", "inference",
              "'You do not need to buy any equipment: the technician will bring a router, which is included in "
              "your plan.'"),
        ],
    },
    {
        "type": "daily_life",
        "format": "social_post",
        "heading": "Read a post in an online student group.",
        "text": """
Maple Hill Students: Buy and Sell
Posted by Kenji W., 40 minutes ago

SELLING: 2 tickets for the Harbor Lights concert at Granville Arena this Saturday at 8 p.m. My brother and I can't go because our cousin's wedding is on the same day. I paid $45 each, and I'm asking $35 each. I'd rather sell them together. They're e-tickets, so I can send them to your phone as soon as you pay. Message me!
""".strip(),
        "questions": [
            q("Why is Kenji selling the tickets?",
              "He bought too many by mistake.",
              "He needs money for a wedding gift.",
              "The concert was moved to a different day.",
              "He has a family event at the same time.",
              "D", "detail",
              "He and his brother cannot go 'because our cousin's wedding is on the same day'."),
            q("What can be inferred about the tickets?",
              "Kenji will lose money on them.",
              "They must be collected at the arena.",
              "Kenji prefers to sell them one at a time.",
              "They are for seats in different rows.",
              "A", "inference",
              "He paid $45 each and is asking $35 each. They are e-tickets sent by phone, and he would 'rather "
              "sell them together'."),
        ],
    },
    {
        "type": "daily_life",
        "format": "schedule",
        "heading": "Read a schedule.",
        "text": """
RIVERBEND SHORT FILM WEEKEND
Old Mill Cinema, October 17 and 18

SATURDAY
11:00 a.m. Animated Shorts (60 minutes), for all ages
2:00 p.m. Student Films (90 minutes), followed by a talk with the directors
7:30 p.m. Opening Night Feature: The Salt Road (110 minutes)

SUNDAY
11:00 a.m. Documentary Shorts (75 minutes)
3:00 p.m. Workshop: Make a Film on Your Phone (2 hours), 20 places, sign up at the box office
6:00 p.m. Award Winners (80 minutes), free entry

Tickets: $8 per screening, $6 for students with ID
Weekend pass: $30 for all screenings (the workshop is not included)
Doors open 20 minutes before each screening. Latecomers are seated only during breaks.
""".strip(),
        "questions": [
            q("Which event can people attend without paying?",
              "Animated Shorts",
              "Student Films",
              "Award Winners",
              "Documentary Shorts",
              "C", "detail",
              "Only Award Winners is marked 'free entry'. Animated Shorts is 'for all ages', which is not the "
              "same thing."),
            q("What can be inferred about the workshop?",
              "Only a limited number of people can take part.",
              "It is open only to student filmmakers.",
              "It is covered by the weekend pass.",
              "It will be taught by the festival's directors.",
              "A", "inference",
              "It has '20 places' and people must 'sign up at the box office'. The pass does not include it, and "
              "the directors' talk follows Student Films."),
            q("Which of the following is NOT mentioned in the schedule?",
              "A lower price for students",
              "A program suitable for all ages",
              "A rule for people who arrive late",
              "A place to buy food and drinks",
              "D", "negative",
              "Students pay $6, Animated Shorts is 'for all ages', and 'latecomers are seated only during "
              "breaks'. Food and drink are never mentioned."),
        ],
    },
    {
        "type": "academic",
        "subject": "Food science",
        "title": "Umami: The Fifth Taste",
        "paragraphs": [
            "For most of the twentieth century, textbooks listed four basic tastes: sweet, sour, salty, and "
            "bitter. Yet as early as 1908, a Japanese chemist named Kikunae Ikeda had argued for a fifth. He "
            "noticed that a traditional broth made from kelp had a rich, savory quality that none of the four "
            "could explain. He went on to isolate the substance responsible, an amino acid called glutamate, and "
            "named the taste umami.",
            "Many scientists outside Japan doubted that umami was truly distinct. They assumed it was merely a "
            "blend of the other tastes. The debate was settled only around 2000, when researchers identified "
            "receptors on the tongue that respond specifically to glutamate. Like sweetness, which signals "
            "energy, umami appears to have a purpose: it tells the body that a food contains protein.",
            "Cooks made use of umami long before it had a name. Glutamate is plentiful in ripe tomatoes, "
            "mushrooms, and aged cheese, and methods such as drying and fermenting release even more of it. That "
            "is why a little soy sauce or grated Parmesan can make a simple dish taste fuller. Some food "
            "scientists also believe that savory ingredients can keep meals satisfying when less salt is used.",
        ],
        "questions": [
            q("According to the passage, what led Ikeda to propose a fifth taste?",
              "A disagreement with scientists outside Japan",
              "A flavor in kelp broth that the four tastes did not explain",
              "The discovery of new receptors on the tongue",
              "An experiment showing how drying changes the flavor of vegetables",
              "B", "factual",
              "Paragraph 1: the kelp broth 'had a rich, savory quality that none of the four could explain'. "
              "The doubts and the receptors came later."),
            q('The word "distinct" in the passage is closest in meaning to',
              "pleasant", "ancient", "separate", "powerful",
              "C", "vocabulary",
              "Scientists doubted that umami was a separate taste; they thought it was 'merely a blend of the "
              "other tastes'."),
            q("What can be inferred about sweetness and umami?",
              "Each tells the body something about a food.",
              "Each was first identified by the same researcher.",
              "Each is detected by the same group of receptors.",
              "Each becomes stronger when a food is dried.",
              "A", "inference",
              "'Like sweetness, which signals energy, umami appears to have a purpose: it tells the body that a "
              "food contains protein.'"),
            q("Which of the following is NOT mentioned as a source of glutamate?",
              "Ripe tomatoes",
              "Aged cheese",
              "Mushrooms",
              "Citrus fruits",
              "D", "negative_factual",
              "Paragraph 3 names ripe tomatoes, mushrooms and aged cheese. Citrus fruits do not appear in the "
              "passage."),
            q("Why does the author mention soy sauce and grated Parmesan?",
              "To show that umami is stronger in Asian cooking than in European cooking",
              "To argue that cooks should stop using salt",
              "To illustrate how glutamate-rich ingredients improve a dish",
              "To explain how Ikeda tested his idea in a kitchen",
              "C", "purpose",
              "They follow the statement that drying and fermenting release glutamate: 'That is why a little soy "
              "sauce or grated Parmesan can make a simple dish taste fuller.'"),
        ],
    },
]

READING_LOWER = [
    {
        "type": "complete_words",
        "subject": "Earth science",
        "text": (
            "A glacier is a large body of ice that moves slowly over land. "
            "It fo[rms] in pla[ces] where mo[re] snow fa[lls] in win[ter] than me[lts] in summer. "
            "Over ma[ny] years, t[he] snow i[s] pressed in[to] hard ice. "
            "When the ice becomes thick and heavy, it starts to slide downhill. "
            "As it moves, a glacier can cut deep valleys into the rock below it."
        ),
    },
    {
        "type": "daily_life",
        "format": "text_messages",
        "heading": "Read a chain of text messages.",
        "text": """
Farid (3:05 p.m.): I caught an earlier train, so I'll get in at 4:10, not 4:40. Can you still pick me up?
Lucia (3:07 p.m.): Sure, I'm free. Which exit should I wait at?
Farid (3:08 p.m.): The north exit, next to the flower shop. I have a big blue suitcase.
Lucia (3:10 p.m.): OK. I'll park across the street and meet you there.
""".strip(),
        "questions": [
            q("Why does Farid write to Lucia?",
              "To ask her where the flower shop is",
              "To say that he missed his train",
              "To tell her about a new arrival time",
              "To thank her for carrying his suitcase",
              "C", "purpose",
              "'I caught an earlier train, so I'll get in at 4:10, not 4:40.' He did not miss a train; he took "
              "an earlier one."),
            q("What can be inferred about Lucia?",
              "She will come to the station by car.",
              "She works at a shop near the north exit.",
              "She will take the bus home with Farid.",
              "She is on the same train as Farid.",
              "A", "inference",
              "Farid asks her to pick him up, and she says, 'I'll park across the street.'"),
        ],
    },
    {
        "type": "daily_life",
        "format": "letter",
        "heading": "Read a letter.",
        "text": """
Westbrook Public Library
14 Canal Street

March 3

Dear Ms. Novak,

Our records show that two items on your library card are late:

The Garden in Winter (book), due February 10
Easy Italian, Level 1 (audio CD), due February 17

The fine is 20 cents a day for each item. Today you owe $7.00. The fine stops growing when you return the items.

You can return items at the front desk or put them in the box outside the main door at any time. You can pay at the front desk or on our website. Please note that you cannot borrow new items while you owe more than $5.00.

If you think this letter is a mistake, please call us at 555-0142.

Sincerely,
Rosa Delgado
Circulation Desk
""".strip(),
        "questions": [
            q("Why did the library send this letter?",
              "To tell Ms. Novak that her library card will expire soon",
              "To tell Ms. Novak that she has kept two items too long",
              "To ask Ms. Novak to pay for a lost book",
              "To invite Ms. Novak to an Italian class",
              "B", "purpose",
              "'Our records show that two items on your library card are late.'"),
            q("Where can Ms. Novak leave the items when the library is closed?",
              "At the front desk inside the library",
              "At the circulation office upstairs",
              "On the library's website",
              "In the box outside the main door",
              "D", "detail",
              "She can 'put them in the box outside the main door at any time'. The website is only for paying."),
            q("What can be inferred about Ms. Novak?",
              "She has already paid part of her fine.",
              "She cannot borrow library items right now.",
              "She returned one of the two items last week.",
              "She has lost one of the two items.",
              "B", "inference",
              "She owes $7.00, and 'you cannot borrow new items while you owe more than $5.00'."),
        ],
    },
]

READING_UPPER = [
    {
        "type": "complete_words",
        "subject": "Political science",
        "text": (
            "Democracy is a system of government in which political power ultimately belongs to the people. "
            "In mod[ern] states, citi[zens] rarely vo[te] on la[ws] directly; ins[tead], they el[ect] officials "
            "to decide for them. "
            "Regular elec[tions] give vot[ers] a cha[nce] to rem[ove] leaders who have lost public support. "
            "A democracy also depends on freedoms that let people criticize those in power, such as a free press. "
            "Without these protections, voting alone cannot guarantee that a government truly answers to the "
            "people it governs."
        ),
    },
    {
        "type": "academic",
        "subject": "Economic history",
        "title": "The First Paper Money",
        "paragraphs": [
            "Paper money was born from an inconvenience. In the Chinese region of Sichuan about a thousand years "
            "ago, everyday coins were made of iron, and a large purchase could require a load of coins too heavy "
            "to carry. So merchants left their coins with trusted shops and received paper receipts in return. "
            "Because a receipt could be exchanged for coins at any time, people soon began to trade the receipts "
            "themselves.",
            "In the 1020s the government of the Song dynasty took over the system and began issuing official "
            "notes, generally regarded as the first paper money issued by a state. The idea astonished later "
            "visitors. When the Venetian traveler Marco Polo described China in the thirteenth century, he wrote "
            "with amazement about sheets of paper that people accepted as readily as silver or gold.",
            "Yet the invention carried a danger. Coins are limited by the supply of metal, but paper can be "
            "printed at almost no cost. When rulers needed funds, they issued more and more notes, and each note "
            "bought less than before. Repeated episodes of this kind eventually led China to abandon paper "
            "notes and rely on silver for several centuries. Paper money, it turned out, depends less on paper "
            "than on trust in whoever prints it.",
        ],
        "questions": [
            q("What is the passage mainly about?",
              "Why iron coins were replaced by silver ones across China",
              "How Marco Polo introduced paper money to European traders",
              "Why merchants in Sichuan refused to trust official notes",
              "How paper money began in China and where its risk lay",
              "D", "main_idea",
              "Paragraphs 1 and 2 trace paper money from merchants' receipts to state notes; paragraph 3 explains "
              "the danger of printing too much."),
            q("According to the passage, why did merchants in Sichuan begin using paper receipts?",
              "The government had forbidden the use of iron coins.",
              "Coins for large payments were too heavy.",
              "Paper was much cheaper to produce than metal coins.",
              "Foreign traders refused to accept iron coins.",
              "B", "factual",
              "Paragraph 1: 'a large purchase could require a load of coins too heavy to carry. So merchants "
              "left their coins with trusted shops and received paper receipts'."),
            q('The word "abandon" in the passage is closest in meaning to',
              "give up", "improve", "hide", "copy",
              "A", "vocabulary",
              "China stopped using paper notes and relied on silver instead; to abandon something is to give it "
              "up."),
            q("What can be inferred from the passage about coins made of metal?",
              "They were never used again after the 1020s.",
              "They were preferred by visitors from Europe.",
              "A ruler cannot easily make too many of them.",
              "They lose value faster than paper notes do.",
              "C", "inference",
              "'Coins are limited by the supply of metal, but paper can be printed at almost no cost', so only "
              "paper was easy to overissue."),
            q("Why does the author mention Marco Polo?",
              "To identify the traveler who first designed paper notes",
              "To show how remarkable paper money seemed to outsiders",
              "To explain how paper receipts first reached Sichuan",
              "To prove that silver was more valuable than gold",
              "B", "purpose",
              "He illustrates the sentence before it, 'The idea astonished later visitors': he 'wrote with "
              "amazement' about paper accepted like silver or gold."),
        ],
    },
]

# ===============================================================================================================
# LISTENING
# ===============================================================================================================
LISTENING_ROUTER = [
    lcr("F-US", "Is the chemistry lab open on Saturdays?",
        "It's on the third floor.",
        "Yes, I opened it for you.",
        "Only in the morning, I think.",
        "I took chemistry in my first year.",
        "C", "A yes/no question about opening days. C answers it indirectly with a limit; A answers 'where'."),
    lcr("M-UK", "Could you lend me a pen for a moment?",
        "Sure. Here, take this one.",
        "It ended just a moment ago.",
        "I can't open it either.",
        "No, I didn't land there.",
        "A", "A request to borrow something is met by handing it over. B and D only echo 'lend' and 'moment'."),
    lcr("F-AU", "What did you make of the documentary we saw in class?",
        "I made it at home last night.",
        "Yes, I've seen the classroom.",
        "It lasted about fifty minutes.",
        "Slow at first, but it got better.",
        "D", "'What did you make of...?' asks for an opinion. A takes 'make' literally, and C gives a length."),
    lcr("M-US", "When is our history essay due, do you know?",
        "About ten pages long.",
        "A week from Monday.",
        "On the Roman Empire.",
        "Yes, I do my essays early.",
        "B", "'When' needs a time. A answers 'how long' and C answers 'what about'."),
    lcr("F-UK", "I can't get this window to close.",
        "Let me try. Sometimes it sticks.",
        "Yes, it's quite close to the door.",
        "The shop closes at nine.",
        "I got it at the window.",
        "A", "The speaker has a small problem; A offers help. B and C use other meanings of 'close'."),
    lcr("M-AU", "Shall I save you a seat at the lecture?",
        "I saved the file already.",
        "It's a lecture on climate change.",
        "No, the seats were all blue.",
        "Please do. I may be a bit late.",
        "D", "'Shall I...?' is an offer, and 'Please do' accepts it. A uses a different meaning of 'save'."),
    lcr("F-US", "Why is the cafeteria so crowded today?",
        "It's across from the gym.",
        "Because I wasn't hungry.",
        "There's a conference on campus.",
        "Yes, the crowd was extremely loud.",
        "C", "'Why' needs a reason for the crowd. C gives one without saying 'because'; B is a reason for "
             "something else."),
    lcr("M-UK", "You've met my lab partner, haven't you?",
        "The lab is closed on Fridays.",
        "Just once, at the welcome event.",
        "No, I haven't finished the report.",
        "Yes, I'll meet you at the lab.",
        "B", "The tag question checks whether they have met. B confirms it without saying 'yes'."),
    lcr("F-AU", "The projector in the seminar room isn't working again.",
        "The project is due next week.",
        "Yes, it works on weekends.",
        "The seminar is down the hall.",
        "I'll let the technician know.",
        "D", "The speaker reports a fault; D promises to do something about it. A plays on 'projector/project'."),
    lcr("M-US", "How about going over our notes together tonight?",
        "Sure. Is seven all right?",
        "They're in my other backpack.",
        "It's over on the left.",
        "I went there last night.",
        "A", "'How about...?' is a suggestion to study together. A accepts and proposes a time."),
    lcr("F-UK", "I can't believe how much the textbook costs.",
        "It costs less to travel by coach.",
        "Tell me about it. I got mine used.",
        "Yes, I believe it's in the library.",
        "The text arrived this morning.",
        "B", "'Tell me about it' means 'I completely agree'. It is not a request for information."),
    lcr("M-AU", "Are you presenting first, or is Dana?",
        "Yes, it's my very first time.",
        "It was a present from Dana.",
        "She is. I'm right after her.",
        "The first slide is missing.",
        "C", "An either/or question needs a choice, not 'yes'. C says Dana goes first."),
    {
        "type": "conversation",
        "setting": "Listen to a conversation at a campus health center.",
        "voices": {"Man": "M-US", "Woman": "F-AU"},
        "script": [
            ("Man", "Hi. I'd like to make an appointment for a sports check-up. I need a form signed before I can "
                    "join the rowing team."),
            ("Woman", "Sure. Have you been here before?"),
            ("Man", "No, this is my first year."),
            ("Woman", "Then there's a new patient form to fill in first. The earliest check-up I have is Thursday "
                      "at two fifteen."),
            ("Man", "Hmm, I have a lab until three on Thursdays. Is there anything later?"),
            ("Woman", "Let me see. There's four thirty on Thursday, or Friday morning at nine."),
            ("Man", "Four thirty works. Should I bring anything?"),
            ("Woman", "Just your student card and the form from the team. And please come ten minutes early to do "
                      "the paperwork."),
        ],
        "questions": [
            q("Why does the man need an appointment?",
              "He hurt his shoulder while he was rowing.",
              "He needs a form signed to join a team.",
              "He wants to change his doctor.",
              "He missed a check-up last year.",
              "B", "detail",
              "'I need a form signed before I can join the rowing team.'"),
            q("What will the man probably do on Thursday?",
              "Go to the health center at a quarter past two",
              "Leave his lab class before it finishes",
              "Return the signed form to his team",
              "Get to the health center by four twenty",
              "D", "prediction",
              "He takes the four thirty appointment and is asked to 'come ten minutes early'. Two fifteen is the "
              "time he could not accept."),
        ],
    },
    {
        "type": "conversation",
        "setting": "Listen to a conversation between two neighbors.",
        "voices": {"Woman": "F-UK", "Man": "M-AU"},
        "script": [
            ("Woman", "Hi, sorry to bother you. I'm Yasmin, from the flat upstairs. I think this box is yours. It "
                      "was outside my door when I got home."),
            ("Man", "Oh! That must be the desk lamp I ordered. The tracking page said it was delivered on Monday, "
                    "and I couldn't find it anywhere."),
            ("Woman", "The driver must have mixed up Three B and Two B. It happened to me last month, too."),
            ("Man", "Really? Maybe the numbers on our doors are hard to read from the stairs."),
            ("Woman", "Could be. Mine is half hidden behind a plant, actually."),
            ("Man", "Well, I'm going to ask the building manager for bigger ones. Thanks so much for bringing it "
                    "down."),
            ("Woman", "No trouble at all."),
        ],
        "questions": [
            q("Why does the woman visit the man?",
              "To bring him a package left at her door",
              "To ask whether he has seen her package",
              "To complain about a plant on the stairs",
              "To introduce the new building manager",
              "A", "purpose",
              "'I think this box is yours. It was outside my door when I got home.'"),
            q("What does the man say he will do?",
              "Call the delivery company",
              "Move the plant near his door",
              "Ask for larger door numbers",
              "Order a different lamp",
              "C", "detail",
              "'I'm going to ask the building manager for bigger ones', meaning the numbers on the doors."),
        ],
    },
    {
        "type": "conversation",
        "setting": "Listen to a conversation between a student and a professor.",
        "voices": {"Man": "M-UK", "Woman": "F-US"},
        "script": [
            ("Man", "Professor Hartmann, do you have a minute? I missed the quiz this morning."),
            ("Woman", "I noticed. What happened, Callum?"),
            ("Man", "My bus broke down halfway to campus, and we waited forty minutes for another one. I took a "
                    "photo of the notice the bus company posted, if that helps."),
            ("Woman", "It does, thank you. Well, things like that can't be helped. Now, I don't give the same "
                      "quiz twice, but you can take a different version."),
            ("Man", "That's fair. When could I do it?"),
            ("Woman", "During my office hours tomorrow, at three. It covers the same two chapters."),
            ("Man", "I'll be there. And I think I'll start catching the earlier bus."),
            ("Woman", "On quiz days, that's probably wise."),
        ],
        "questions": [
            q("Why did the man miss the quiz?",
              "He went to the wrong classroom.",
              "He forgot which day it was on.",
              "He was waiting at the professor's office.",
              "His bus stopped working on the way.",
              "D", "detail",
              "'My bus broke down halfway to campus, and we waited forty minutes for another one.'"),
            q('What does the professor mean when she says, "Things like that can\'t be helped"?',
              "She is unable to help him prepare for the quiz.",
              "She does not blame him for being absent.",
              "She thinks the bus company should apologize.",
              "She believes he should have left home earlier.",
              "B", "function",
              "'It can't be helped' means nobody could have prevented it. She then lets him take another version "
              "of the quiz."),
        ],
    },
    {
        "type": "conversation",
        "setting": "Listen to a conversation at a bakery.",
        "voices": {"Woman": "F-AU", "Man": "M-UK"},
        "script": [
            ("Woman", "Hello. I'd like to order a cake for Saturday. It's for my grandmother's eightieth "
                      "birthday."),
            ("Man", "How lovely. How many people does it need to feed?"),
            ("Woman", "About twenty."),
            ("Man", "Then you'll want our large round one. We do chocolate, lemon, or carrot."),
            ("Woman", "She loves lemon. Could you write 'Happy Birthday, Nana' on top?"),
            ("Man", "Of course. That comes to forty-eight dollars, and we ask for half when you order."),
            ("Woman", "That's fine. Oh, one more thing. Two of the guests can't eat nuts."),
            ("Man", "No problem. There are no nuts in the lemon cake, and I'll put a note on the order anyway."),
            ("Woman", "Perfect. I'll pick it up on Saturday at ten."),
        ],
        "questions": [
            q("Which cake does the woman order?",
              "A chocolate cake",
              "A carrot cake",
              "A lemon cake",
              "A cake with nuts",
              "C", "detail",
              "Offered chocolate, lemon or carrot, she says, 'She loves lemon.'"),
            q("What will the woman probably do next?",
              "Pay half of the price",
              "Choose a different flavor",
              "Call her grandmother",
              "Take the cake home",
              "A", "prediction",
              "The baker says 'we ask for half when you order', and she answers, 'That's fine.' She collects the "
              "cake on Saturday."),
        ],
    },
    {
        "type": "announcement",
        "setting": "Listen to an announcement at a train station.",
        "voice": "M-AU",
        "script": (
            "Attention, please, passengers waiting for the nine forty-five service to Clearwater. This train is "
            "running about twenty-five minutes late because of a signal problem further up the line. It is now "
            "expected at ten past ten, and it will leave from platform six instead of platform two. Your tickets "
            "are still valid, and seat reservations have not changed. If you have a connection at Clearwater, "
            "please speak to a member of staff at the information desk. We are sorry for the delay to your "
            "journey."
        ),
        "questions": [
            q("What is the main purpose of the announcement?",
              "To tell passengers that a train has been canceled",
              "To report a late train and a platform change",
              "To ask passengers to exchange their tickets",
              "To announce the opening of an information desk",
              "B", "purpose",
              "The train is 'about twenty-five minutes late' and 'will leave from platform six instead of "
              "platform two'."),
            q("Who should go to the information desk?",
              "Passengers who have lost their tickets",
              "Passengers who want to reserve a seat",
              "Passengers who are still waiting on platform two",
              "Passengers who must catch another train later",
              "D", "detail",
              "'If you have a connection at Clearwater, please speak to a member of staff at the information "
              "desk.'"),
        ],
    },
    {
        "type": "announcement",
        "setting": "Listen to an announcement in a geology class.",
        "voice": "F-US",
        "script": (
            "One more thing before you go. Next Tuesday I'll be collecting your field notebooks for a quick "
            "check. Now, don't panic. I'm not grading your handwriting or your drawing skills. What I want to see "
            "is that every entry has a date, a location, and a labeled sketch. Just those three things. If an "
            "entry is missing one of them, add it this weekend, but please don't copy old pages out again to make "
            "them look neat. A messy notebook from the field is worth more to me than a clean copy. You'll get "
            "them back on Thursday, in time for our trip to the quarry."
        ),
        "questions": [
            q("What is the professor mainly doing?",
              "Describing the schedule for a class trip to a quarry",
              "Returning notebooks that she graded last week",
              "Explaining how she will check students' notebooks",
              "Teaching students how to sketch rock samples",
              "C", "main_idea",
              "She says she will collect the notebooks and names the three things she wants to see in every "
              "entry."),
            q("What does the professor ask students not to do?",
              "Copy old pages to make them tidy",
              "Add missing dates to their entries",
              "Hand in their notebooks on Tuesday",
              "Label the sketches in their entries",
              "A", "detail",
              "'Please don't copy old pages out again to make them look neat.' Adding a missing date or label is "
              "what she wants."),
        ],
    },
    {
        "type": "talk",
        "subject": "Meteorology",
        "voice": "M-US",
        "script": (
            "OK, so last time we talked about ordinary thunderstorms. Today, something much bigger: hurricanes. "
            "And I want you to think of a hurricane as an engine. Like any engine, it needs fuel. So what's the "
            "fuel? It's warm ocean water. The sea surface has to be at least about twenty-seven degrees Celsius. "
            "That's why these storms are born in the tropics, in late summer and early fall, when the ocean is "
            "at its warmest. Here's what happens. Warm, wet air rises from the sea surface. As it rises, it "
            "cools, and the water vapor in it turns into cloud droplets. Now, this is the key step. When vapor "
            "turns into liquid, it gives off heat. That heat warms the air around it, so the air rises even "
            "faster, and more wet air gets pulled in below to replace it. You see? The storm feeds itself. Now, "
            "why does it spin? That comes from the rotation of the Earth, which bends the path of the moving "
            "air. Interestingly, that effect is too weak right at the equator, so hurricanes don't form there. "
            "And what stops the engine? Well, take away the fuel. Once a hurricane moves over land or over "
            "cooler water, its supply of warm, wet air is cut off, and it gradually weakens."
        ),
        "questions": [
            q("What is the talk mainly about?",
              "How a hurricane forms and keeps going",
              "How hurricanes differ from thunderstorms",
              "Why hurricanes are becoming more frequent",
              "How scientists measure wind speed at sea",
              "A", "main_idea",
              "The professor explains the fuel, the rising air that makes the storm 'feed itself', the spin and "
              "what finally weakens it."),
            q("According to the professor, what happens when water vapor turns into liquid?",
              "The air becomes drier.",
              "The ocean cools down.",
              "Heat is released.",
              "The storm stops rising.",
              "C", "detail",
              "'When vapor turns into liquid, it gives off heat.'"),
            q("Why do hurricanes not form at the equator?",
              "The ocean is too cold there.",
              "There is not enough wet air.",
              "Storms there move over land too quickly.",
              "The turning effect is too weak there.",
              "D", "detail",
              "The spin comes from the Earth's rotation, and 'that effect is too weak right at the equator, so "
              "hurricanes don't form there'."),
            q("Why does the professor compare a hurricane to an engine?",
              "To explain why hurricanes make so much noise",
              "To stress that it needs a source of energy",
              "To show that hurricanes can be controlled",
              "To describe how fast a hurricane travels",
              "B", "function",
              "'Like any engine, it needs fuel', and later, 'what stops the engine? Well, take away the fuel.'"),
        ],
    },
    {
        "type": "talk",
        "subject": "Art history",
        "voice": "F-UK",
        "script": (
            "Take a look at these two paintings. The one on the left is from the thirteen hundreds. Notice "
            "anything odd? The most important figure is huge, even though he's standing at the back, and the "
            "buildings look as if they might slide off the wall. Now the one on the right, painted about a "
            "century later. Suddenly you feel you could walk into the room. So what changed? Painters didn't "
            "simply get better at drawing. They learned a system, and we call it linear perspective. The idea is "
            "simple. Lines that are parallel in real life, like the edges of a road, seem to come together as "
            "they move away from you. In a painting, they meet at a single spot called the vanishing point. And "
            "the farther away an object is, the smaller you paint it. We usually give the credit to an "
            "architect, Filippo Brunelleschi, working in Florence in the early fourteen hundreds. He painted a "
            "building in his city so accurately that people standing in front of it could compare the two, and "
            "they matched. Some years later, another architect, Leon Battista Alberti, wrote the rules down, so "
            "any painter could learn them. Alberti said a painting should be like an open window. And for the "
            "next four hundred years or so, that's pretty much what European painting tried to be."
        ),
        "questions": [
            q("What is the main topic of the talk?",
              "The life of a famous architect in Florence",
              "Why early painters preferred large figures",
              "How windows were shown in early paintings",
              "A method that let painters show depth",
              "D", "main_idea",
              "The talk introduces linear perspective, the 'system' that makes you feel 'you could walk into the "
              "room'."),
            q("According to the professor, what is the vanishing point?",
              "The largest figure in a painting",
              "The spot where parallel lines meet",
              "The place where the painter must stand",
              "The exact center of a real building",
              "B", "detail",
              "Parallel lines 'seem to come together', and in a painting 'they meet at a single spot called the "
              "vanishing point'."),
            q("Why does the professor mention Leon Battista Alberti?",
              "To identify who recorded the rules of perspective",
              "To name the painter of the picture on the left",
              "To give an example of an artist who rejected perspective",
              "To explain who paid for Brunelleschi's work",
              "A", "function",
              "Alberti 'wrote the rules down, so any painter could learn them'."),
            q("What does the professor imply about painters in the 1300s?",
              "They were not interested in painting people.",
              "They copied their buildings from Florence.",
              "They did not use size to show distance.",
              "They refused to paint rooms and streets.",
              "C", "inference",
              "In the older painting the most important figure 'is huge, even though he's standing at the back'. "
              "She also says the change was not simply better drawing."),
        ],
    },
]

LISTENING_LOWER = [
    lcr("F-UK", "Excuse me, where is the computer room?",
        "At nine o'clock.",
        "Next to the main office.",
        "Yes, I have a new computer.",
        "It's very fast.",
        "B", "'Where' needs a place."),
    lcr("M-US", "How much does a cup of tea cost here?",
        "It's very hot in here today.",
        "I have two cups at home.",
        "Yes, I like green tea.",
        "Two dollars, I think.",
        "D", "'How much does it cost?' asks for a price. B answers 'how many'."),
    lcr("F-AU", "Can you help me move this table to the window?",
        "Sure. Let me take this end.",
        "It's made of very dark wood.",
        "I moved here in May.",
        "Yes, it's a table.",
        "A", "A request for help is accepted with 'Sure'."),
    lcr("M-UK", "What did you do after school yesterday?",
        "I'm going to the beach.",
        "At half past three.",
        "I visited my aunt.",
        "Yes, I did it yesterday.",
        "C", "The question asks about an activity in the past. A is about the future, and B gives a time."),
    lcr("F-US", "Happy birthday, Ana! This is for you.",
        "Yes, I can do it for you.",
        "Oh, thank you! That's so kind.",
        "I'm twenty years old this year.",
        "Yes, it's my bag.",
        "B", "The speaker is giving a present; the natural reply is thanks."),
    lcr("M-AU", "Is it still raining? I want to walk home.",
        "No, it stopped an hour ago.",
        "I like the rain.",
        "It's just outside the front door.",
        "My coat is in the car.",
        "A", "A yes/no question about the weather now. Only A answers it; D is about a coat, not the rain."),
    lcr("F-UK", "Who teaches your art class on Mondays?",
        "In Room 5.",
        "Art is my favorite subject.",
        "For two years.",
        "Mr. Banerjee. He's great.",
        "D", "'Who' needs a person."),
    {
        "type": "conversation",
        "setting": "Listen to a conversation between two students.",
        "voices": {"Man": "M-UK", "Woman": "F-AU"},
        "script": [
            ("Man", "Hi, Sofia. Are you going to watch the football match on Saturday?"),
            ("Woman", "The one against North College? Yes! What time does it start?"),
            ("Man", "At three o'clock. But I want to get there early to find good seats."),
            ("Woman", "Good idea. How much are the tickets?"),
            ("Man", "They're free for students. You just show your student card."),
            ("Woman", "Great. Shall we meet at the main gate at two thirty?"),
            ("Man", "OK. And bring a jacket. It gets cold in the stadium."),
            ("Woman", "I will. See you on Saturday!"),
        ],
        "questions": [
            q("What time does the match start?",
              "At two o'clock",
              "At two thirty",
              "At three o'clock",
              "At three thirty",
              "C", "detail",
              "'At three o'clock.' Two thirty is when they will meet at the gate."),
            q("What does the man tell the woman to bring?",
              "Something warm to wear",
              "Money for the tickets",
              "Food for the match",
              "An umbrella for the rain",
              "A", "detail",
              "'Bring a jacket. It gets cold in the stadium.' The tickets are free for students."),
        ],
    },
    {
        "type": "announcement",
        "setting": "Listen to an announcement at a swimming pool.",
        "voice": "F-US",
        "script": (
            "Good morning, swimmers, and welcome to Hillside Pool. Please listen to a few rules. First, take a "
            "shower before you get into the water. Second, please walk. Do not run next to the pool, because the "
            "floor is wet. Third, food and drinks stay in the café area. And one more thing: the deep end is only "
            "for good swimmers. If you are not sure, ask a lifeguard. The pool closes at eight tonight. Have a "
            "nice swim!"
        ),
        "questions": [
            q("What is the announcement mainly about?",
              "Swimming lessons for children",
              "A new café at the pool",
              "The price of a ticket",
              "Rules for using the pool",
              "D", "main_idea",
              "'Please listen to a few rules', followed by rules about showers, running, food and the deep end."),
            q("Why should people not run next to the pool?",
              "The pool is very deep.",
              "The floor is wet.",
              "The lifeguard is busy.",
              "The café is closed.",
              "B", "detail",
              "'Do not run next to the pool, because the floor is wet.'"),
        ],
    },
    {
        "type": "announcement",
        "setting": "Listen to an announcement at a school.",
        "voice": "M-AU",
        "script": (
            "Hello, everyone. Our spring concert is next Friday at six thirty in the school hall. The school band "
            "and the choir will both perform. Tickets go on sale tomorrow. You can buy them at lunchtime in the "
            "music room. They cost four dollars for adults and two dollars for students. Each family can buy up "
            "to five tickets, because the hall is small. Please don't wait until Friday. Last year, the tickets "
            "were gone in three days!"
        ),
        "questions": [
            q("What is the announcement mainly about?",
              "Tickets for a school concert",
              "A new teacher for the school choir",
              "Lunchtime rules in the hall",
              "A trip for the school band",
              "A", "main_idea",
              "The speaker gives the date of the spring concert and explains when, where and for how much "
              "tickets are sold."),
            q("Why can each family buy only five tickets?",
              "The tickets cost a lot.",
              "The concert is very short.",
              "The hall is not very big.",
              "The band is very small.",
              "C", "detail",
              "'Each family can buy up to five tickets, because the hall is small.'"),
        ],
    },
    {
        "type": "announcement",
        "setting": "Listen to an announcement at a shopping mall.",
        "voice": "M-US",
        "script": (
            "Attention, shoppers. A small black backpack was found this afternoon near the escalators on the "
            "second floor. There is a red water bottle in the side pocket. If this is your backpack, please come "
            "to the customer service desk on the ground floor, next to the bookstore. You will need to tell us "
            "what is inside. The desk is open until nine o'clock tonight. Thank you."
        ),
        "questions": [
            q("What is the announcement about?",
              "A sale at the bookstore",
              "A bag that someone lost",
              "A broken escalator",
              "New opening hours",
              "B", "main_idea",
              "'A small black backpack was found', and its owner is asked to come and collect it."),
            q("What must the owner do at the desk?",
              "Show a receipt from a store",
              "Pay a small fee first",
              "Fill in a long form",
              "Say what is in the bag",
              "D", "detail",
              "'You will need to tell us what is inside.'"),
        ],
    },
]

LISTENING_UPPER = [
    lcr("M-UK", "I don't suppose you'd be up for proofreading my cover letter tonight?",
        "No, I suppose the cover is torn.",
        "The letter came by post yesterday.",
        "Send it over. I'm free after nine.",
        "Yes, I was up all night reading.",
        "C", "'I don't suppose you'd be up for...' is a hesitant request. C agrees; D takes 'up' literally."),
    lcr("F-US", "Rumor has it the midterm's being pushed back a week.",
        "What a relief. I'm way behind.",
        "I pushed it back against the wall.",
        "No, the room is at the back.",
        "I heard the rumor was about her.",
        "A", "'Pushed back' means postponed. A reacts to that news; B takes the phrase literally."),
    lcr("M-AU", "You'd think they'd have fixed the heating in this library by now.",
        "I think they fixed the price last week.",
        "The library opens at eight, I think.",
        "Yes, I'll have it fixed by now.",
        "I know. I've kept my coat on all day.",
        "D", "'You'd think they'd have...' is a complaint that something has still not been done. D agrees with "
             "it."),
    {
        "type": "conversation",
        "setting": "Listen to a conversation between two students.",
        "voices": {"Woman": "F-AU", "Man": "M-US"},
        "script": [
            ("Woman", "Have you heard anything from Dmitri about his section of the report?"),
            ("Man", "Not a word. He said he'd upload it on Sunday, and it's now Wednesday."),
            ("Woman", "That's the second time. I'm tempted to just write it myself and be done with it."),
            ("Man", "I get that, but then he gets credit for our work. And honestly, we don't know what's going "
                    "on with him."),
            ("Woman", "True. He did seem pretty stretched at the last meeting. Didn't he mention taking on extra "
                      "shifts?"),
            ("Man", "He did. Look, why don't we ask him straight out? Give him until Friday, and offer to split "
                    "his part if he's swamped."),
            ("Woman", "And if Friday comes and goes?"),
            ("Man", "Then we bring Professor Mensah into it. But I'd rather not go over his head before we've "
                    "even asked."),
            ("Woman", "Fair enough. I'll message him now."),
        ],
        "questions": [
            q("What does the man imply about the woman's idea of writing the section herself?",
              "It would take more time than they have.",
              "It would reward Dmitri for doing nothing.",
              "It would improve the quality of the report.",
              "It would annoy their professor.",
              "B", "inference",
              "'I get that, but then he gets credit for our work.'"),
            q('What does the man mean when he says he would rather not "go over his head"?',
              "He thinks the report is far too difficult for Dmitri.",
              "He wants to avoid missing the Friday deadline.",
              "He refuses to do any of Dmitri's work.",
              "He prefers to talk to Dmitri before the professor.",
              "D", "function",
              "To go over someone's head is to take a problem to a person in authority without speaking to them "
              "first. He wants to wait 'before we've even asked'."),
        ],
    },
    {
        "type": "announcement",
        "setting": "Listen to an announcement from a university scholarship office.",
        "voice": "F-UK",
        "script": (
            "Good afternoon. This is a notice for anyone applying for next year's scholarships. As of March "
            "first, paper applications will no longer be accepted. Everything now goes through the new online "
            "portal, which you can reach from the Scholarship Office home page. You'll need to upload three "
            "things: an academic transcript, a personal statement of no more than five hundred words, and one "
            "letter of recommendation. Please note that the portal will not let you submit until all three are "
            "attached, so do chase up your referee in good time. Applications already started on paper must be "
            "entered again online. The deadline remains April fifteenth."
        ),
        "questions": [
            q("What is the main purpose of the announcement?",
              "To explain a new way of applying for scholarships",
              "To announce a new scholarship for next year",
              "To warn students that the deadline has been moved",
              "To describe how to write a personal statement",
              "A", "purpose",
              "Paper applications end and 'everything now goes through the new online portal'. The deadline "
              "'remains' the same."),
            q("Why does the speaker advise students to contact their referee early?",
              "Referees have to create their own portal accounts.",
              "Letters sent by post often arrive late.",
              "An application cannot be sent without the letter.",
              "The office needs time to check each letter.",
              "C", "inference",
              "'The portal will not let you submit until all three are attached, so do chase up your referee in "
              "good time.'"),
        ],
    },
    {
        "type": "talk",
        "subject": "Biology",
        "voice": "F-US",
        "script": (
            "If you've ever watched an octopus on a reef, you'll know it can vanish in front of your eyes. One "
            "moment it's brown, the next it's the exact pattern of the rock behind it. And we're talking well "
            "under a second. So how on earth does it manage that? The secret is in the skin, which is packed "
            "with thousands of tiny organs called chromatophores. Picture each one as a little elastic bag of "
            "pigment, with a ring of muscles around it. When those muscles tighten, they stretch the bag out "
            "flat, and you see a spot of color. When they relax, the bag shrinks to a dot you can barely see. "
            "Now, here's the crucial part. Each of those muscles is wired straight to the brain. In many other "
            "animals that change color, the signal is chemical. It travels in the blood, so it's slow. The "
            "octopus uses nerves, and that's why the change is practically instant. But there's a twist, and "
            "frankly, it still bothers researchers. As far as we can tell, octopuses are color-blind. Their eyes "
            "have just one kind of light-detecting cell. So how do they match colors they can't see? One "
            "suggestion is that the skin itself detects light. It's an attractive idea, but I'd call it unproven "
            "for now."
        ),
        "questions": [
            q("What is the talk mainly about?",
              "Why octopuses live on coral reefs",
              "How octopuses alter their color so quickly",
              "How octopuses' eyes differ from human eyes",
              "Why octopuses are difficult to study",
              "B", "main_idea",
              "The professor asks 'how on earth does it manage that?' and explains the chromatophores and the "
              "nerves that control them."),
            q("According to the professor, what happens when the muscles around a chromatophore tighten?",
              "The pigment drains away into the blood.",
              "The bag shrinks to a small dot.",
              "The skin becomes thicker.",
              "The pigment is spread out and shows.",
              "D", "detail",
              "'When those muscles tighten, they stretch the bag out flat, and you see a spot of color.' The "
              "bag shrinks when they relax."),
            q("Why is the octopus's color change faster than that of many other animals?",
              "Its signals travel along nerves, not in blood.",
              "Its skin holds far more pigment than theirs does.",
              "Its skin muscles are much stronger than theirs.",
              "Its eyes detect more colors than theirs.",
              "A", "detail",
              "In many other animals the signal 'travels in the blood, so it's slow. The octopus uses nerves, "
              "and that's why the change is practically instant.'"),
            q("What is the professor's attitude toward the idea that the skin detects light?",
              "She is certain that it is correct.",
              "She thinks it has been disproved.",
              "She finds it appealing but unproven.",
              "She considers it irrelevant to color change.",
              "C", "attitude",
              "'It's an attractive idea, but I'd call it unproven for now.'"),
        ],
    },
    {
        "type": "talk",
        "subject": "Anthropology",
        "voice": "M-UK",
        "script": (
            "Let me start with a confession. Last week a neighbor brought me a jar of homemade jam, and my first "
            "thought wasn't 'how nice.' It was, 'Now I owe her something.' Well, according to the French scholar "
            "Marcel Mauss, that reaction is the whole point. In a famous essay from the nineteen twenties, Mauss "
            "argued that there's no such thing as a free gift. A gift carries three duties: to give, to accept, "
            "and, sooner or later, to give something back. Some of his best-known evidence came from the "
            "Trobriand Islands, near New Guinea. There, men sailed long distances to exchange shell necklaces "
            "and armbands with partners on other islands. Now, these objects were of no practical use. Nobody "
            "kept one for long, either. You held it for a while, then passed it on. So what was the point? The "
            "point was the partnership itself. Each exchange renewed a bond between two people, sometimes for "
            "life, and ordinary trade in food and tools followed along behind it. Compare that with buying "
            "something in a shop. You pay, you leave, and you and the cashier are even. A gift does the "
            "opposite. It leaves a debt hanging, and that debt is precisely what holds people together. So the "
            "next time you get a present you didn't ask for, well, you'll know what you've signed up for."
        ),
        "questions": [
            q("What is the talk mainly about?",
              "How shell jewelry was made on Pacific islands",
              "Why shopping has replaced gift giving",
              "How gifts create lasting ties between people",
              "Why the professor dislikes receiving presents",
              "C", "main_idea",
              "Mauss's argument is that a gift creates duties, and the resulting debt 'is precisely what holds "
              "people together'."),
            q("Why does the professor mention the jar of jam?",
              "To illustrate the feeling of debt a gift creates",
              "To show that homemade gifts are the most appreciated",
              "To explain how the professor met a neighbor",
              "To compare food with shell necklaces",
              "A", "function",
              "His first thought was 'Now I owe her something', and he says 'that reaction is the whole point'."),
            q("What does the professor say about the shell objects exchanged in the Trobriand Islands?",
              "They were used as money to buy food and tools.",
              "They did not stay with one owner for long.",
              "They were made by the men who sailed.",
              "They became more useful over time.",
              "B", "detail",
              "'Nobody kept one for long, either. You held it for a while, then passed it on.' They were 'of no "
              "practical use'."),
            q("What does the professor imply about paying for something in a shop?",
              "It is a modern form of the island exchanges.",
              "It usually costs more than giving a gift.",
              "It makes people trust each other more.",
              "It leaves no tie between the two sides.",
              "D", "inference",
              "'You pay, you leave, and you and the cashier are even. A gift does the opposite. It leaves a debt "
              "hanging.'"),
        ],
    },
]

# ===============================================================================================================
# WRITING
# ===============================================================================================================
WRITING = {
    "build": [
        build("Is your brother coming to the game with us?",
              "I doubt it. He does not like watching sports at all.",
              ["he", "does not", "like", "watching", "sports at all"], "negation", prefix="I doubt it."),
        build("I can't log in to the course website.",
              "Have you tried changing your password?",
              ["have you", "tried", "changing", "your", "password"], "yes_no_question"),
        build("I finally bought a bike for getting to campus.",
              "How often do you plan to ride it?",
              ["how often", "do you", "plan", "to ride", "it"], "wh_question"),
        build("How was the second exam?",
              "It was much harder than the first one.",
              ["it was", "much", "harder", "than", "the first", "one"], "comparison"),
        build("I don't have a car to get to the airport.",
              "You can take the shuttle from the student center.",
              ["you", "can take", "the shuttle", "from", "the student", "center"], "modal"),
        build("My cousin is moving to Toronto next month.",
              "Has she already found a place to live?",
              ["has she", "already found", "a place", "to live"], "perfect", extra="did she"),
        build("Why is the gym closed this week?",
              "It is being painted and will reopen on Monday.",
              ["it is", "being", "painted", "and will", "reopen on Monday"], "passive"),
        build("The syllabus doesn't say much about the final project.",
              "I wonder whether we have to work in groups.",
              ["I wonder", "whether", "we", "have to", "work", "in groups"], "embedded_question",
              extra="do we"),
        build("Which section of the writing course did you pick?",
              "I chose the one that fits best with my work schedule.",
              ["the one", "that", "fits best", "with"], "relative_clause",
              prefix="I chose", suffix="my work schedule", extra="what"),
        build("I emailed the landlord twice about the broken window.",
              "What will you do if he does not reply by Friday?",
              ["if", "he", "does not", "reply", "by Friday"], "conditional",
              prefix="What will you do"),
    ],
    "email": {
        "scenario": (
            "You booked a mock job interview at your university's career center for Thursday at 2:00 p.m. "
            "Yesterday, your statistics professor announced that the midterm exam has been moved to the same "
            "time. The practice is important to you because you have a real interview for a summer internship in "
            "two weeks. You decide to write to the career adviser, Ms. Rao."
        ),
        "to": "Ms. Rao",
        "subject": "Mock interview on Thursday",
        "bullets": [
            "Explain the problem with your appointment.",
            "Suggest another time for the mock interview.",
            "Ask how you should prepare for it.",
        ],
        "model": """
Dear Ms. Rao,

I am writing about the mock interview that I booked with you for this Thursday at 2:00 p.m. Unfortunately, my statistics professor announced yesterday that our midterm exam has been moved to exactly that time, so I will not be able to come. I am sorry for the short notice.

I would still very much like to do the practice interview, because I have a real interview for a summer internship in two weeks. Would it be possible to meet on Friday morning, or at any time next Monday or Tuesday afternoon? I have no classes then.

Finally, could you tell me how I should prepare? For example, should I send you my résumé and the internship description in advance, and should I dress as I would for the real interview?

Thank you very much for your understanding.

Best regards,
Mateo Fernandes
""".strip(),
    },
    "discussion": {
        "course": "education technology",
        "professor": {
            "name": "Dr. Halvorsen",
            "post": (
                "This week we are examining how digital devices affect learning in the classroom. Some "
                "universities, and many individual instructors, now ask students to put away laptops and phones "
                "during lectures. They argue that screens distract both the user and the people sitting nearby. "
                "Others reply that devices are essential tools for taking notes and looking things up. I would "
                "like to know where you stand. Should laptops and phones be banned in lecture halls? Why or why "
                "not?"
            ),
        },
        "students": [
            {
                "name": "Yuki",
                "post": (
                    "I support a ban. Whenever the person in front of me opens a shopping site or a game, I end "
                    "up watching that screen instead of the professor, even though I don't want to. A lecture "
                    "lasts only an hour or so. Everyone can manage that long with a pen and paper, and we would "
                    "all pay more attention."
                ),
            },
            {
                "name": "Emeka",
                "post": (
                    "I disagree with a ban. I type much faster than I write, and I keep my notes in folders that "
                    "I can search before exams. Some students also depend on a device to enlarge the slides or to "
                    "record the lecture. We are adults, and we should be trusted to decide how we learn best."
                ),
            },
        ],
        "model": (
            "I do not think laptops and phones should be banned completely, but I would treat the two devices "
            "differently. Yuki is right that a screen showing a game pulls everyone's eyes toward it, and that "
            "problem is real. However, as Emeka says, many students take better notes on a laptop, and some need "
            "one to follow the slides. A total ban would punish them for other people's habits. My suggestion is "
            "a simple seating rule: students who use laptops sit in the back rows or along the sides, where their "
            "screens are not in front of anyone, and phones stay in bags unless the professor asks the class to "
            "use them, for example for a quick poll. In my experience, the phone is the bigger danger because of "
            "its constant notifications, while a laptop is mostly a tool. A rule like this protects students who "
            "are easily distracted without taking a useful tool away from the others."
        ),
    },
}

# ===============================================================================================================
# SPEAKING
# ===============================================================================================================
SPEAKING = {
    "repeat": {
        "scenario": (
            "You are learning how to welcome guests at a hotel front desk. Listen to your manager and repeat "
            "what he says. Repeat only once."
        ),
        "picture": "A hotel lobby with a front desk, elevators beside a small gift shop and a dining room behind "
                   "glass doors.",
        "voice": "M-AU",
        "sentences": [
            "Good evening, and welcome to our hotel.",
            "May I see your passport or photo ID?",
            "Your room is on the fifth floor, at the end of the hallway.",
            "Breakfast is served from six thirty until ten in the dining room.",
            "The elevators are just behind you, next to the gift shop.",
            "If you need extra towels or pillows, just call the front desk and we'll bring them up right away.",
            "Please remember that checkout is at eleven, although we can store your bags if you leave later.",
        ],
    },
    "interview": {
        "topic": "music listening habits",
        "scenario": (
            "You have agreed to take part in a research study about music listening habits. You will have a "
            "short online interview with a researcher. The researcher will ask you some questions."
        ),
        "voice": "F-UK",
        "questions": [
            {
                "kind": "event",
                "q": (
                    "Thank you for joining me today. To start, please tell me about the last time you listened "
                    "to music. Where were you, what were you listening to, and why did you choose it?"
                ),
                "model": (
                    "The last time I listened to music was this morning on the bus to campus. The ride takes "
                    "about twenty-five minutes, and I almost always put my headphones on as soon as I sit down. "
                    "Today I listened to a playlist of quiet piano music, because I had a presentation in my "
                    "first class and I wanted to feel calm. Usually I prefer pop songs with a strong beat, but "
                    "when I am nervous, music without words helps me organize my thoughts. By the time I got off "
                    "the bus, I felt much more relaxed and ready to speak."
                ),
            },
            {
                "kind": "life",
                "q": (
                    "Some people like to have music playing while they study or work. Others need silence to "
                    "concentrate. Which is true for you, and why?"
                ),
                "model": (
                    "It depends on the task, but most of the time I need silence. When I read a difficult "
                    "chapter or write an essay, songs with lyrics pull my attention away, because I start "
                    "following the words instead of my own ideas. I have tried it many times, and I always work "
                    "more slowly. However, for simple tasks, such as copying my notes or cleaning up my files, I "
                    "enjoy having music on. It makes boring work feel shorter. So my rule is easy: silence for "
                    "thinking and music for routine jobs."
                ),
            },
            {
                "kind": "opinion",
                "q": (
                    "Now I'd like to hear your opinion. Some people say that wearing headphones in public places "
                    "makes people less friendly and less aware of others. Do you agree or disagree? Why?"
                ),
                "model": (
                    "I partly disagree. It is true that someone wearing headphones is less likely to start a "
                    "conversation with a stranger, and sometimes people do not notice that another person needs "
                    "to get past them. But I do not think this makes them unfriendly. On a crowded train, most "
                    "people would not talk to each other anyway. Headphones simply give them a little private "
                    "space in a noisy place, and that can make them calmer and more patient. The important thing "
                    "is to stay aware, for example by keeping the volume low and taking the headphones off when "
                    "someone speaks to you."
                ),
            },
            {
                "kind": "opinion",
                "q": (
                    "Here is my last question. Do you think every school should require students to learn a "
                    "musical instrument? Why or why not?"
                ),
                "model": (
                    "I think schools should give every student the chance to learn an instrument, but I would "
                    "not make it a requirement for many years. Learning an instrument teaches patience, because "
                    "you improve only through regular practice, and playing in a group teaches students to "
                    "listen to each other. For those reasons, one or two years of lessons in primary school "
                    "would be valuable for everyone. After that, students should be free to choose. If teenagers "
                    "are forced to continue with an instrument they dislike, the lessons become a punishment, "
                    "and that time could be spent on art, sports, or another skill."
                ),
            },
        ],
    },
}

FORM = {
    "number": 5,
    "theme": "Umami and paper money; hurricanes, perspective, octopus skin, the gift",
    "reading": {"router": READING_ROUTER, "lower": READING_LOWER, "upper": READING_UPPER},
    "listening": {"router": LISTENING_ROUTER, "lower": LISTENING_LOWER, "upper": LISTENING_UPPER},
    "writing": WRITING,
    "speaking": SPEAKING,
}
