"""TOEFL iBT practice test 07. Same structure as form01.py; content plan: AUTHORING.md section 5, Form 07."""

from common import build, lcr, q

# ===============================================================================================================
# READING
# ===============================================================================================================
READING_ROUTER = [
    {
        "type": "complete_words",
        "subject": "Geology",
        "text": (
            "An earthquake is a sudden shaking of the ground that starts at a fault, a deep crack in the Earth's "
            "crust. "
            "The rocks on each side of a fault a[re] pushed i[n] different direc[tions], but fric[tion] holds "
            "th[em] in pl[ace]. "
            "Stress bui[lds] for ma[ny] years un[til] the ro[cks] suddenly slip, and the stored energy travels "
            "outward as waves. "
            "Scientists record these waves with seismographs, but nobody can yet predict exactly when an "
            "earthquake will strike."
        ),
    },
    {
        "type": "complete_words",
        "subject": "Health science",
        "text": (
            "Vitamins are substances that the human body needs in very small amounts in order to stay healthy. "
            "Because the bo[dy] cannot ma[ke] most o[f] them, peo[ple] must g[et] them fr[om] food. "
            "Vitamin C, fo[und] in fr[esh] fruit, he[lps] wounds he[al], while vitamin D keeps bones strong. "
            "Long before vitamins were discovered, sailors who spent months at sea without fruit or vegetables "
            "often developed a disease called scurvy."
        ),
    },
    {
        "type": "daily_life",
        "format": "notice",
        "heading": "Read a notice.",
        "text": """
NOTICE TO ALL RESIDENTS OF LARKSPUR COURT

The water in the building will be shut off on Thursday, October 16, from 9:00 a.m. to 2:00 p.m. so that a plumber can replace a leaking pipe in the basement. Please fill a few containers the night before for drinking and cooking. When the water returns, it may look cloudy at first. Let the cold tap run for two minutes before you use it.

Building Management
""".strip(),
        "questions": [
            q("What is the main purpose of the notice?",
              "To ask residents to report leaking pipes in their apartments",
              "To warn residents that they will have no water for several hours",
              "To explain why water bills will be higher in October",
              "To tell residents that the basement will be closed on Thursday",
              "B", "purpose",
              "The water 'will be shut off on Thursday, October 16, from 9:00 a.m. to 2:00 p.m.'; the rest of "
              "the notice helps residents prepare for that."),
            q("What should residents do when the water comes back on?",
              "Fill several containers with drinking water",
              "Call the plumber if the water is cloudy",
              "Wait until 2:00 p.m. before they cook",
              "Let the cold water run for a short time",
              "D", "detail",
              "'Let the cold tap run for two minutes before you use it.' Filling containers is for the night "
              "before."),
        ],
    },
    {
        "type": "daily_life",
        "format": "email",
        "heading": "Read an email.",
        "text": """
To: Hana Kobayashi
From: Bluefinch Airways
Subject: Change to your flight BF 482

Dear Ms. Kobayashi,

The departure time of your flight from Denver to Seattle on June 14 has changed. Flight BF 482 will now leave at 4:55 p.m. instead of 2:10 p.m. because of a change to our summer schedule. Your seat, 17C, and your checked bag allowance remain the same.

If the new time suits you, you do not need to do anything, since your original ticket is still valid. If it does not suit you, you may move to another Bluefinch flight on the same day at no charge, or cancel your trip for a full refund. To choose either option, visit My Trips on our website by June 7. Please note that changes made by telephone cost $25.

We apologize for the inconvenience.

Bluefinch Airways Customer Care
""".strip(),
        "questions": [
            q("Why did the airline write to Ms. Kobayashi?",
              "To inform her that her flight will depart later than planned",
              "To confirm that her request for a refund was accepted",
              "To tell her that her seat on the flight has been changed",
              "To remind her to check in on the airline's website",
              "A", "purpose",
              "'Flight BF 482 will now leave at 4:55 p.m. instead of 2:10 p.m.' Her seat stays the same, and "
              "a refund is only one of her options."),
            q("What should Ms. Kobayashi do if she is satisfied with the new departure time?",
              "She should reply to the email by June 7.",
              "She should print a new ticket from the website.",
              "She does not have to take any action.",
              "She should call the airline to confirm her seat.",
              "C", "detail",
              "'If the new time suits you, you do not need to do anything, since your original ticket is still "
              "valid.'"),
            q("Which of the following is NOT mentioned in the email?",
              "The reason for the new departure time",
              "The time the flight will arrive in Seattle",
              "The last day to choose a different option",
              "The cost of making a change by telephone",
              "B", "negative",
              "The email gives the reason (a new summer schedule), the deadline (June 7) and the telephone fee "
              "($25). It never gives an arrival time."),
        ],
    },
    {
        "type": "daily_life",
        "format": "social_post",
        "heading": "Read a post in a neighborhood group.",
        "text": """
Riverbend Neighbors Group
Posted by Tomás Herrera, yesterday at 7:15 p.m.

Love reading but never finish a book? Join our new book club! We'll meet on the first Tuesday of every month at 7 p.m. in the back room of Juniper Café. Our first book is short, and the public library has plenty of copies, so there's no need to buy one. Comment below if you're coming so that I know how many chairs to set out.
""".strip(),
        "questions": [
            q("Why did Tomás write the post?",
              "To recommend a café that has opened in the neighborhood",
              "To ask neighbors to give books to the public library",
              "To invite people to take part in a new reading group",
              "To find out which book his neighbors want to read first",
              "C", "purpose",
              "'Join our new book club!' The café is only the meeting place, and the first book has already "
              "been chosen."),
            q("What does Tomás suggest about the first book?",
              "Members can read it without paying for it.",
              "It will be handed out at the first meeting.",
              "It was written by someone from Riverbend.",
              "It is on sale in the back room of the café.",
              "A", "inference",
              "'The public library has plenty of copies, so there's no need to buy one': members can borrow "
              "it."),
        ],
    },
    {
        "type": "daily_life",
        "format": "webpage",
        "heading": "Read a webpage.",
        "text": """
IRONBRIDGE FITNESS: MEMBERSHIP PLANS

Basic: $19 a month
- Gym floor, Monday to Friday, 6:00 a.m. to 4:00 p.m.
- Locker rental: $3 a visit

Standard: $32 a month
- Gym floor at any time
- Two group classes a week
- Free locker

Premium: $48 a month
- Gym floor and pool at any time
- Unlimited group classes
- Free locker and towel service
- One guest pass every month

All plans:
- A one-time joining fee of $25 applies. It is not charged if you sign up for twelve months.
- Students with a valid ID receive 10% off the Standard and Premium plans.
- You may cancel at any time with thirty days' written notice.
""".strip(),
        "questions": [
            q("What can be inferred about a member who has the Basic plan?",
              "The member may bring a guest once a month.",
              "The member does not pay a joining fee.",
              "The member can take two classes a week.",
              "The member cannot use the gym on weekends.",
              "D", "inference",
              "The Basic plan covers the gym floor 'Monday to Friday' only. Guest passes and classes belong to "
              "the other plans, and the joining fee applies to all plans."),
            q("How can a new member avoid paying the joining fee?",
              "By showing a valid student ID",
              "By agreeing to a one-year membership",
              "By choosing the Premium plan",
              "By giving thirty days' written notice",
              "B", "detail",
              "The fee 'is not charged if you sign up for twelve months'. A student ID gives 10% off the "
              "monthly price, not the fee."),
            q("Which of the following is NOT included in the Premium plan?",
              "Personal training sessions",
              "Use of the swimming pool",
              "A locker at no extra cost",
              "As many group classes as the member wants",
              "A", "negative",
              "Premium lists the pool, unlimited group classes and a free locker. Personal training is not "
              "offered in any plan."),
        ],
    },
    {
        "type": "academic",
        "subject": "Psychology",
        "title": "How Habits Take Hold",
        "paragraphs": [
            "A habit is a behavior that a person performs almost automatically, with little conscious thought. "
            "Brushing one's teeth, locking the door, and checking a phone on waking are familiar examples. "
            "Psychologists describe a habit as a loop with three parts: a cue that triggers the behavior, the "
            "routine itself, and a reward that makes the brain want to repeat it.",
            "Habits form through repetition in a stable setting. Each time a routine follows the same cue and "
            "brings a reward, the link between them grows stronger, until the cue alone is enough to start the "
            "action. This takes longer than many people assume. In one well-known study at a London university, "
            "volunteers needed about two months, on average, before a new daily behavior felt automatic, and "
            "some needed far longer. Missing a single day, however, did not noticeably slow their progress.",
            "Because habits are tied to cues, they are hard to break by willpower alone. An old routine tends to "
            "return whenever the familiar cue appears, especially when a person is tired or under stress. For "
            "this reason, psychologists often advise changing the surroundings instead: keeping snacks out of "
            "sight, for instance, or taking a different route home. Research on people who have just moved "
            "suggests the same thing. In a new place, the old cues are missing, so old routines are easier to "
            "replace.",
        ],
        "questions": [
            q("What is the passage mainly about?",
              "Why some people are born with more willpower than others",
              "How scientists measure behavior that is automatic",
              "How habits are built and why they are hard to change",
              "Why bad habits are more common than good ones",
              "C", "main_idea",
              "Paragraphs 1 and 2 explain what a habit is and how repetition builds it; paragraph 3 explains why "
              "habits 'are hard to break by willpower alone'."),
            q("According to the passage, what did the study of volunteers show?",
              "Forming a habit took about two months on average.",
              "Most volunteers gave up before the study had ended.",
              "Missing a single day forced volunteers to start again.",
              "Rewards had little effect on how quickly habits formed.",
              "A", "factual",
              "'Volunteers needed about two months, on average, before a new daily behavior felt automatic.' "
              "Missing one day 'did not noticeably slow their progress'."),
            q('The word "triggers" in the passage is closest in meaning to',
              "follows", "prevents", "rewards", "sets off",
              "D", "vocabulary",
              "A cue that triggers a behavior starts it, or sets it off."),
            q("Why does the author mention people who have just moved?",
              "To show that moving to a new home is a stressful experience",
              "To support the idea that habits weaken when their cues are absent",
              "To argue that willpower is stronger in unfamiliar places",
              "To give an example of a habit that takes months to form",
              "B", "purpose",
              "'In a new place, the old cues are missing, so old routines are easier to replace.' The example "
              "backs up the advice to change the surroundings."),
            q("According to the passage, all of the following are true of habits EXCEPT:",
              "They are carried out with little thought.",
              "They grow stronger through repetition.",
              "They fade when a person is tired.",
              "They are linked to particular cues.",
              "C", "negative_factual",
              "The passage says the opposite of C: an old routine tends to return 'especially when a person is "
              "tired or under stress'. A, B and D are stated in paragraphs 1, 2 and 3."),
        ],
    },
]

READING_LOWER = [
    {
        "type": "complete_words",
        "subject": "History",
        "text": (
            "Hieroglyphs were the picture signs that people in ancient Egypt used for writing. "
            "Ea[ch] sign w[as] a sm[all] picture, a[nd] it co[uld] stand f[or] a wh[ole] word o[r] just for a "
            "sound. "
            "The Egyptians car[ved] these si[gns] into stone walls and wrote them on paper made from a river "
            "plant. "
            "The skill of reading them was later lost, until a French scholar worked out their meaning in 1822 "
            "with the help of the Rosetta Stone."
        ),
    },
    {
        "type": "daily_life",
        "format": "text_messages",
        "heading": "Read a chain of text messages.",
        "text": """
Dario (8:05 a.m.): Hi Mei. Can you work for me on Saturday morning? My brother's wedding is that day.
Mei (8:11 a.m.): I can work from 8 to 12, but I have a class at 1.
Dario (8:13 a.m.): That's fine. My shift ends at noon. I'll take your Sunday shift in return.
Mei (8:14 a.m.): Deal! Please tell Ms. Farrow, the manager, that we changed.
Dario (8:15 a.m.): I'll call her right now.
""".strip(),
        "questions": [
            q("Why does Dario write to Mei?",
              "To invite her to a wedding",
              "To ask what time her class starts",
              "To tell her that the store is closed on Saturday",
              "To ask her to work in his place",
              "D", "purpose",
              "'Can you work for me on Saturday morning?' He will be at his brother's wedding."),
            q("What will Dario do next?",
              "Phone the manager",
              "Go to his class",
              "Start his Saturday shift",
              "Send Mei the new schedule",
              "A", "detail",
              "Mei asks him to tell Ms. Farrow, the manager, and he answers, 'I'll call her right now.'"),
        ],
    },
    {
        "type": "daily_life",
        "format": "flyer",
        "heading": "Read a flyer.",
        "text": """
ELM STREET YARD SALE
Saturday, May 9, 8:00 a.m. to 2:00 p.m.

Twelve families on Elm Street are selling things they no longer need. Come and find a bargain!

For sale:
- Children's clothes, toys, and bicycles
- Books and board games (most under $2)
- Kitchen items and small furniture
- Garden tools

Good to know:
- Please bring cash. Sellers cannot take cards.
- Free parking is available at Elm Street School. Please do not park in front of driveways.
- Lemonade and cookies will be sold at number 14. All the money will go to the animal shelter.
- Nothing will be sold before 8:00 a.m., so please do not come early.

Do you want to sell something, too? Call Rosa at 555-0142 before May 6.
""".strip(),
        "questions": [
            q("What is NOT on the list of things for sale?",
              "Toys",
              "Garden tools",
              "Computers",
              "Board games",
              "C", "negative",
              "The list has toys, board games and garden tools. Computers are not on it."),
            q("What should shoppers bring to the sale?",
              "A credit card",
              "Cash",
              "Their own bags",
              "A parking ticket",
              "B", "detail",
              "'Please bring cash. Sellers cannot take cards.'"),
            q("What will happen to the money from the lemonade and cookies?",
              "It will pay for parking at the school.",
              "It will be shared by the twelve families.",
              "It will be given to Rosa.",
              "It will help an animal shelter.",
              "D", "detail",
              "'All the money will go to the animal shelter.'"),
        ],
    },
]

READING_UPPER = [
    {
        "type": "complete_words",
        "subject": "Economics",
        "text": (
            "Globalization is the process by which the economies of different countries become increasingly "
            "connected through trade, investment, and technology. "
            "Falling tran[sport] costs a[nd] faster commun[ication] have all[owed] companies t[o] manufacture "
            "go[ods] wherever produ[ction] is chea[pest]. "
            "As a result, cons[umers] often en[joy] lower prices and greater variety, although workers in some "
            "industries have lost their jobs to foreign competition. "
            "Economists therefore continue to debate how the gains from open markets should be shared."
        ),
    },
    {
        "type": "academic",
        "subject": "History of science",
        "title": "Penicillin and the Rise of Resistance",
        "paragraphs": [
            "In 1928, the Scottish scientist Alexander Fleming returned from a holiday to find that mold had "
            "grown on one of the dishes in which he was raising bacteria. Around the mold, the bacteria had "
            "died. Fleming named the substance responsible penicillin, but he could not produce enough of it to "
            "treat patients. That step was taken more than a decade later by a team at Oxford that included "
            "Howard Florey and Ernst Chain, and by the mid-1940s factories were turning out the drug in "
            "enormous quantities.",
            "Penicillin transformed medicine. Infections that had often been fatal could now be cured within "
            "days. Yet Fleming himself sounded a warning. Accepting the Nobel Prize in 1945, he pointed out that "
            "careless use of the drug might allow bacteria to become resistant to it.",
            "His fear proved justified. In any large population of bacteria, a few may happen to carry a trait "
            "that lets them survive a drug. When an antibiotic kills their competitors, these survivors multiply "
            "and pass the trait on. The more widely antibiotics are used, therefore, the more chances resistant "
            "strains have to spread. Today some infections no longer respond to drugs that once cured them "
            "easily, and few new antibiotics have reached the market in recent decades. The discovery that "
            "seemed to defeat bacterial disease turned out to be only the opening move in a much longer contest.",
        ],
        "questions": [
            q("According to the passage, why was penicillin not used to treat patients soon after its discovery?",
              "Doctors doubted that a mold could cure infections.",
              "Fleming was unable to make it in sufficient amounts.",
              "The first tests on bacteria gave disappointing results.",
              "Factories were busy producing other medicines.",
              "B", "factual",
              "Paragraph 1: Fleming 'could not produce enough of it to treat patients'; the Oxford team solved "
              "that more than a decade later."),
            q('The word "fatal" in the passage is closest in meaning to',
              "painful", "common", "lasting", "deadly",
              "D", "vocabulary",
              "A fatal infection is one that kills; the sentence contrasts such infections with ones that can "
              "'be cured within days'."),
            q("Why does the author mention what Fleming said when he accepted the Nobel Prize?",
              "To show that the risk of resistance was recognized very early",
              "To prove that Fleming deserved more credit than the Oxford team",
              "To explain how penicillin came to be produced in factories",
              "To suggest that the prize was awarded too soon",
              "A", "purpose",
              "Already in 1945 Fleming 'pointed out that careless use of the drug might allow bacteria to become "
              "resistant'; paragraph 3 begins 'His fear proved justified.'"),
            q("According to the passage, how does resistance spread among bacteria?",
              "Bacteria learn to avoid the places where drugs are used.",
              "Antibiotics lose their strength when stored for too long.",
              "Surviving bacteria reproduce and hand down their advantage.",
              "Mold gradually stops making the substance that kills bacteria.",
              "C", "factual",
              "Paragraph 3: a few bacteria carry a trait that lets them survive, and 'these survivors multiply "
              "and pass the trait on'."),
            q('What does the author imply by describing penicillin as "the opening move in a much longer '
              'contest"?',
              "Scientists competed fiercely to be the first to discover it.",
              "The struggle between medicine and bacteria is still going on.",
              "Other antibiotics had been discovered before penicillin.",
              "Bacterial disease will soon be defeated completely.",
              "B", "inference",
              "An opening move is only the start of a game. Bacteria keep adapting and few new drugs are "
              "appearing, so the contest has not ended."),
        ],
    },
]

# ===============================================================================================================
# LISTENING
# ===============================================================================================================
LISTENING_ROUTER = [
    lcr("F-US", "Have you seen the sign-up sheet for the volleyball tournament?",
        "Yes, I signed the letter yesterday.",
        "The tournament was really exciting.",
        "It's pinned to the board by the gym door.",
        "We need six players on each side.",
        "C", "The speaker is looking for the sheet. C says where it is; A only repeats the sound of 'sign'."),
    lcr("M-UK", "What's that new sandwich place on Mill Street like?",
        "Not bad, though the portions are rather small.",
        "Yes, I'd like a cheese sandwich, please.",
        "It's just past the bridge on the left.",
        "I usually have lunch at about one.",
        "A", "'What's it like?' asks for an opinion. B confuses it with 'would like'; C says where it is."),
    lcr("F-AU", "Could you save my seat while I print something?",
        "No thanks, I've already saved the file.",
        "I think the printer is upstairs.",
        "It's a comfortable chair, isn't it?",
        "Sure, but I have to leave in ten minutes.",
        "D", "'Save my seat' means keep it for me. D agrees to the request, with a condition; A uses another "
             "meaning of 'save'."),
    lcr("M-US", "When are the lab reports supposed to be handed in?",
        "In the box outside Room 210.",
        "Not until the end of next week.",
        "Yes, I handed mine in already.",
        "They're supposed to be ten pages long.",
        "B", "'When' needs a time. A answers 'where', and C answers a yes/no question."),
    lcr("F-UK", "The heating in our dorm keeps switching itself off.",
        "I know. I've started working in the library instead.",
        "No, I switched to a different course last term.",
        "No, the dorm doesn't close until midnight.",
        "I kept it in the drawer by the door.",
        "A", "A agrees and says how the speaker deals with the cold room. B uses another meaning of 'switch', "
             "and D plays on 'keeps'."),
    lcr("M-AU", "Who's bringing the projector for our presentation tomorrow?",
        "It's in Room 12 at half past nine.",
        "It's about the history of jazz.",
        "Lena said she'd borrow one.",
        "Yes, the presentation went very well.",
        "C", "'Who' needs a person. A answers where and when, B answers what about."),
    lcr("F-US", "Do you want me to print the handouts, or will you do it?",
        "Yes, I'd like that one, please.",
        "The printer is on the second floor, I think.",
        "They were really useful handouts, thank you.",
        "Leave it to me. You've done enough.",
        "D", "An either/or question needs a choice, not 'yes'. D chooses: the second speaker will print them."),
    lcr("M-UK", "Mind if I sit in on your rehearsal this afternoon?",
        "I usually sit near the back.",
        "Be my guest. We start at three.",
        "The rehearsal went well, thank you.",
        "The afternoon show is sold out.",
        "B", "'Mind if I...?' asks for permission. 'Be my guest' gives it."),
    lcr("F-AU", "Why wasn't Carlos at the seminar this morning?",
        "It was held in the main hall.",
        "Because it starts at nine tomorrow.",
        "Yes, he gave a great talk.",
        "His train was canceled, apparently.",
        "D", "'Why wasn't he there?' needs a reason for his absence. B begins with 'because' but explains "
             "nothing about Carlos."),
    lcr("M-US", "You look exhausted. Were you up late again?",
        "Until three, finishing my chemistry homework.",
        "No, I looked for it everywhere this morning.",
        "I'll wake you up early tomorrow, I promise.",
        "Yes, it's up on the top shelf.",
        "A", "A confirms it without saying 'yes' and gives the reason. The others reuse 'look' and 'up' with "
             "other meanings."),
    lcr("F-UK", "I can't decide which elective to take next term.",
        "Yes, the election is next week.",
        "Well, which ones are you choosing between?",
        "I took the bus this morning.",
        "It took me two terms to finish.",
        "B", "A friend who hears this would ask about the options. 'Election' only sounds like 'elective'."),
    lcr("M-AU", "The bookshop says my textbook won't arrive until after the exam.",
        "I'd like to order the same thing.",
        "Great! Then you'll have plenty of time.",
        "You can share my copy until it comes.",
        "The exam is in the main hall.",
        "C", "The speaker has a problem; C offers a solution. B treats bad news as good news."),
    {
        "type": "conversation",
        "setting": "Listen to a conversation at a university financial aid office.",
        "voices": {"Man": "M-US", "Woman": "F-AU"},
        "script": [
            ("Man", "Good morning. How can I help you?"),
            ("Woman", "Hi. I got a message saying my grant application is incomplete, but I'm sure I uploaded "
                      "everything."),
            ("Man", "Let me pull up your file. What's your name?"),
            ("Woman", "Ingrid Solberg."),
            ("Man", "OK, Ingrid. We have your form and your bank details, but your parents' income statement is "
                    "missing."),
            ("Woman", "That's strange. I scanned it last week."),
            ("Man", "Hmm. It looks like the file was too large, so the system rejected it. That happens a lot "
                    "with scans."),
            ("Woman", "Oh, no. And the deadline's tomorrow, isn't it?"),
            ("Man", "It is, but you don't need to upload it again. Bring the paper copy here before five today, "
                    "and I'll add it myself."),
            ("Woman", "Great. It's in my room. I'll go and get it now."),
        ],
        "questions": [
            q("Why does the woman go to the office?",
              "She wants to change her bank details.",
              "She was told that her application was not complete.",
              "She needs more time to finish a form.",
              "She cannot find the paper copy of a document.",
              "B", "purpose",
              "'I got a message saying my grant application is incomplete.'"),
            q("What will the woman probably do next?",
              "Scan the document a second time",
              "Ask her parents for a new statement",
              "Upload a smaller file from her computer",
              "Fetch a document from her room",
              "D", "prediction",
              "The man asks for the paper copy before five; she says, 'It's in my room. I'll go and get it "
              "now.'"),
        ],
    },
    {
        "type": "conversation",
        "setting": "Listen to a conversation between two friends.",
        "voices": {"Woman": "F-US", "Man": "M-UK"},
        "script": [
            ("Woman", "Kofi, are you around next week? I need a huge favor."),
            ("Man", "I should be. What's up?"),
            ("Woman", "I'm going to my cousin's graduation, and I can't take Biscuit with me. Could you look "
                      "after him?"),
            ("Man", "Your dog? I'd love to, but my landlord doesn't allow pets."),
            ("Woman", "Oh, he wouldn't stay with you. You'd just come over twice a day to feed him and take him "
                      "for a walk."),
            ("Man", "That's doable. Mornings are easy, but on Wednesday I don't finish work until eight at "
                    "night."),
            ("Woman", "That's fine. He's used to eating late."),
            ("Man", "All right, then. You'd better show me where everything is."),
            ("Woman", "Come by on Sunday, and I'll give you the spare key, too."),
        ],
        "questions": [
            q("What does the woman want the man to do?",
              "Visit her home to take care of her dog",
              "Keep her dog at his apartment for a week",
              "Travel with her to a graduation",
              "Ask his landlord to allow pets",
              "A", "detail",
              "'He wouldn't stay with you. You'd just come over twice a day to feed him and take him for a "
              "walk.'"),
            q("What will the man probably do on Sunday?",
              "Take the dog to his own apartment",
              "Talk to his landlord about keeping the dog",
              "Go to the woman's place for instructions",
              "Drive the woman to the graduation",
              "C", "prediction",
              "He says, 'You'd better show me where everything is', and she answers, 'Come by on Sunday, and "
              "I'll give you the spare key.'"),
        ],
    },
    {
        "type": "conversation",
        "setting": "Listen to a conversation between a student and a professor.",
        "voices": {"Woman": "F-UK", "Man": "M-AU"},
        "script": [
            ("Woman", "Professor Demir, do you have a minute? I really enjoyed this week's unit on ocean "
                      "currents."),
            ("Man", "Glad to hear it, Yuki. What can I do for you?"),
            ("Woman", "I was wondering if you could recommend something extra to read. The textbook chapter was "
                      "a bit short."),
            ("Man", "It is, isn't it? Well, there's a classic book on the subject, but honestly, it's rather "
                    "technical for a first-year student."),
            ("Woman", "I don't mind a challenge."),
            ("Man", "Even so, I'd start with something lighter. A colleague of mine wrote a series of magazine "
                    "articles about the Gulf Stream. They're on the course website, in the folder called "
                    "Optional."),
            ("Woman", "Oh, I never noticed that folder."),
            ("Man", "Hardly anyone does. Read those first, and if you still want more, come and borrow my copy "
                    "of the book."),
        ],
        "questions": [
            q("Why does the student go to see the professor?",
              "To ask for help with a difficult chapter",
              "To borrow a book for an assignment",
              "To get suggestions for further reading",
              "To find out how to use the course website",
              "C", "purpose",
              "'I was wondering if you could recommend something extra to read.' She found the chapter short, "
              "not difficult."),
            q("What does the professor suggest the student do first?",
              "Read some articles posted online",
              "Borrow his copy of a technical book",
              "Read the textbook chapter again",
              "Write to the author of the articles",
              "A", "detail",
              "The articles are on the course website: 'Read those first, and if you still want more, come and "
              "borrow my copy of the book.'"),
        ],
    },
    {
        "type": "conversation",
        "setting": "Listen to a conversation at a hotel front desk.",
        "voices": {"Man": "M-UK", "Woman": "F-AU"},
        "script": [
            ("Man", "Good evening. How can I help?"),
            ("Woman", "Hi, I'm in room three oh eight. There's some kind of machine humming right outside my "
                      "window, and I can't sleep."),
            ("Man", "I'm so sorry. That'll be the air-conditioning unit on the roof next door. It usually "
                    "switches off at ten."),
            ("Woman", "Well, it's nearly eleven, and it's still going. I have an interview at eight tomorrow."),
            ("Man", "I understand. I can move you to a room on the other side of the building. It faces the "
                    "garden, so it's much quieter."),
            ("Woman", "Is it the same price?"),
            ("Man", "It's actually a larger room, but there'd be no extra charge. I'll send someone up to help "
                    "with your bags."),
            ("Woman", "Thank you. Give me ten minutes to pack."),
        ],
        "questions": [
            q("What is the woman's problem?",
              "Her room is too warm.",
              "Her window will not close.",
              "The guests next door are talking loudly.",
              "A noise is keeping her awake.",
              "D", "detail",
              "'There's some kind of machine humming right outside my window, and I can't sleep.' The noise "
              "comes from a machine on the roof next door, not from guests."),
            q("What does the man offer to do?",
              "Turn off the air-conditioning unit",
              "Move the woman to a quieter room",
              "Lower the price of the woman's room",
              "Wake the woman before her interview",
              "B", "detail",
              "'I can move you to a room on the other side of the building... it's much quieter.' The price "
              "stays the same."),
        ],
    },
    {
        "type": "announcement",
        "setting": "Listen to an announcement on a tour boat.",
        "voice": "M-US",
        "script": (
            "Good morning, everyone, and welcome aboard the Heron. Before we leave the dock, I have a few safety "
            "rules for you. Life jackets are under your seats, and children under twelve must wear one for the "
            "whole trip. Please stay seated while the boat is turning, and keep your arms inside the rail. If "
            "you'd like to take photos from the upper deck, wait until I tell you it's safe to use the stairs. "
            "One last thing. The deck gets slippery when it's wet, so please, no running. Now sit back and "
            "enjoy the river."
        ),
        "questions": [
            q("What is the main purpose of the announcement?",
              "To describe the sights along the river",
              "To tell passengers how to stay safe on board",
              "To explain why the tour is leaving late",
              "To sell tickets for seats on the upper deck",
              "B", "purpose",
              "'Before we leave the dock, I have a few safety rules for you.'"),
            q("What must passengers do before they go to the upper deck?",
              "Put on a life jacket",
              "Leave their cameras at their seats",
              "Wait for the guide's permission",
              "Show their tickets again",
              "C", "detail",
              "'Wait until I tell you it's safe to use the stairs.'"),
        ],
    },
    {
        "type": "announcement",
        "setting": "Listen to an announcement in a business class.",
        "voice": "F-UK",
        "script": (
            "All right, before you go, let's sort out the teams for the market research project. This year, I'm "
            "not letting you choose your own partners. I've put you into groups of four, and I've mixed people "
            "from different majors on purpose, because you'll each see the problem differently. The list goes "
            "up on the course page at noon. Your first job is to meet this week and pick a local business to "
            "study. Send me its name by Monday. And if there's a real scheduling problem in your team, come and "
            "see me. Don't just swap on your own."
        ),
        "questions": [
            q("What is the professor mainly doing?",
              "Describing the results of a research project",
              "Asking students to choose their own partners",
              "Announcing a new date for a project",
              "Explaining how project teams have been arranged",
              "D", "main_idea",
              "'Let's sort out the teams for the market research project... I've put you into groups of four.'"),
            q("Why did the professor put students from different majors together?",
              "So that each team would have a range of viewpoints",
              "So that every team would be the same size",
              "So that students could meet at convenient times",
              "So that weaker students would get extra help",
              "A", "detail",
              "She mixed majors 'on purpose, because you'll each see the problem differently'."),
        ],
    },
    {
        "type": "talk",
        "subject": "Architecture",
        "voice": "F-AU",
        "script": (
            "Here's something that might surprise you. If you stand at the top of a very tall building on a "
            "windy day, the floor under your feet is moving. Skyscrapers sway. The very tallest can move a "
            "meter or more in a storm, and they're designed to. A tower that can bend a little is actually "
            "safer than one that can't. So the real problem for engineers isn't keeping the building up. It's "
            "keeping the people inside comfortable, because nobody wants to feel seasick at their desk. So, how "
            "do they do it? One answer is shape. When wind flows around a square tower, it breaks into swirls "
            "of air that push the building from side to side. Rounded corners, or an outline that changes as "
            "the tower rises, break up those swirls before they get strong. The Burj Khalifa in Dubai does "
            "exactly that. Its outline keeps changing on the way up, so the wind never gets organized. A second "
            "answer is weight. Near the top of Taipei 101, in Taiwan, there's an enormous steel ball, more than "
            "six hundred tons of it, hanging from cables. When the wind pushes the tower one way, the ball "
            "swings the other way and absorbs much of the movement. And it isn't hidden. Visitors can go and "
            "look at it. For next time, I'd like each of you to find one more building that uses a trick like "
            "this."
        ),
        "questions": [
            q("What is the talk mainly about?",
              "Ways of reducing the movement of tall buildings in wind",
              "Reasons why modern towers are taller than older ones",
              "The history of the world's most famous skyscrapers",
              "How engineers measure the speed of the wind",
              "A", "main_idea",
              "After explaining that towers sway, the professor asks 'how do they do it?' and gives two answers: "
              "shape and weight."),
            q("According to the professor, what is the main challenge for engineers?",
              "Stopping the building from falling over",
              "Keeping the windows from breaking",
              "Making sure people inside do not feel sick",
              "Making the elevators run smoothly",
              "C", "detail",
              "'The real problem for engineers isn't keeping the building up. It's keeping the people inside "
              "comfortable, because nobody wants to feel seasick.'"),
            q("How does the steel ball in Taipei 101 reduce swaying?",
              "It makes the top of the tower lighter.",
              "It breaks the wind into small swirls.",
              "It ties the tower to the ground with cables.",
              "It swings in the opposite direction to the tower.",
              "D", "detail",
              "'When the wind pushes the tower one way, the ball swings the other way and absorbs much of the "
              "movement.'"),
            q("What does the professor ask the students to do?",
              "Visit a tall building on a windy day",
              "Find another building that uses a similar method",
              "Calculate how far a tower moves in a storm",
              "Draw a tower with rounded corners",
              "B", "prediction",
              "'For next time, I'd like each of you to find one more building that uses a trick like this.'"),
        ],
    },
    {
        "type": "talk",
        "subject": "Agriculture",
        "voice": "M-UK",
        "script": (
            "Today's topic is a farming idea that's thousands of years old and still in use: crop rotation. "
            "The idea is simple. You don't grow the same crop in the same field year after year. Why not? "
            "Well, think about what happens if you plant wheat again and again. Wheat takes a lot of nitrogen "
            "out of the soil, so each harvest gets a little smaller. And the insects and diseases that like "
            "wheat stay right there in the field, waiting for next year's meal. Now, farmers long ago knew "
            "nothing about nitrogen, but they could see the results. In medieval Europe, many villages divided "
            "their land into three big fields, and each year one of the three was left empty to rest. It "
            "worked. But notice the cost. A third of the land grew nothing. The real breakthrough, which spread "
            "across England in the seventeen hundreds, was a four-year rotation. Two of the years were for "
            "grain. In the other two, farmers grew turnips and clover. No resting year at all. How was that "
            "possible? Clover belongs to the same family as peas and beans, and bacteria living on the "
            "roots of these plants take nitrogen from the air and put it back into the soil. So the clover was "
            "feeding the field. And the turnips and clover also fed the farm animals through the winter, which "
            "meant more animals and more manure for the soil. More food from the same land. Not bad for a "
            "simple change of plan."
        ),
        "questions": [
            q("What is the main topic of the talk?",
              "Why wheat became the most important crop in Europe",
              "How medieval villages shared their farmland",
              "How farm animals were kept alive through the winter",
              "Why farmers change the crop grown in a field",
              "D", "main_idea",
              "The topic is named at the start, 'crop rotation', and the talk explains why it works and how it "
              "improved."),
            q("According to the professor, what was the disadvantage of the three-field system?",
              "It required too many farm animals.",
              "Part of the land produced no food each year.",
              "It allowed insects to spread between fields.",
              "It could be used only for growing wheat.",
              "B", "detail",
              "'It worked, but notice the cost. A third of the land grew nothing.'"),
            q("What does the professor say about clover?",
              "It helps return nitrogen to the soil.",
              "It removes more nitrogen than wheat does.",
              "It was left in the field to rest for a year.",
              "It protects other crops from insects.",
              "A", "detail",
              "Bacteria on the roots of clover 'take nitrogen from the air and put it back into the soil. So the "
              "clover was feeding the field.'"),
            q('Why does the professor say this: "Not bad for a simple change of plan"?',
              "To admit that the four-year rotation had some weaknesses",
              "To suggest that farmers disliked changing their methods",
              "To stress how much was gained from a small idea",
              "To remind students that the plan is no longer used",
              "C", "function",
              "'Not bad' is understatement: he has just listed the gains ('more food from the same land') that "
              "came from merely changing the order of crops."),
        ],
    },
]

LISTENING_LOWER = [
    lcr("M-US", "What are you going to wear to the school dance?",
        "At seven o'clock on Friday.",
        "My blue dress, I think.",
        "I can't dance very well.",
        "It's in the school gym.",
        "B", "'What... wear' needs clothes. A answers 'when' and D answers 'where'."),
    lcr("F-UK", "Does this bus stop near the swimming pool?",
        "I swim every Saturday.",
        "It's two dollars.",
        "Yes, I can stop now.",
        "Yes, it's the third stop.",
        "D", "The speaker asks about the bus route. D says yes and adds which stop."),
    lcr("M-AU", "Your new haircut looks great!",
        "Thanks! I got it done yesterday.",
        "Yes, I look for it every day.",
        "It's next to the bank.",
        "I'd like it shorter, please.",
        "A", "The natural reply to a compliment is thanks."),
    lcr("F-US", "How many people are coming to the picnic?",
        "In the park by the lake.",
        "At twelve thirty.",
        "About ten, I think.",
        "Fruit and cold drinks.",
        "C", "'How many' needs a number."),
    lcr("M-UK", "Could you spell your last name for me, please?",
        "Nice to meet you, too.",
        "It's my first day here.",
        "I'm from Portugal.",
        "Sure. It's M-O-R-A-L-E-S.",
        "D", "The speaker asks for the spelling of a name; D gives the letters."),
    lcr("F-AU", "I forgot my lunch at home today.",
        "You can have half of my sandwich.",
        "I usually eat at one o'clock.",
        "Yes, lunch was very good.",
        "My home is near the school.",
        "A", "A kind reply to this problem is an offer to share."),
    lcr("M-US", "Whose red backpack is this?",
        "It's red and black.",
        "It's under the chair.",
        "I think it's Omar's.",
        "Yes, it is.",
        "C", "'Whose' asks about the owner."),
    {
        "type": "conversation",
        "setting": "Listen to a conversation between two students.",
        "voices": {"Man": "M-AU", "Woman": "F-US"},
        "script": [
            ("Man", "Hi, Nadia. Are you going to choir practice?"),
            ("Woman", "Yes. It starts in ten minutes. Why?"),
            ("Man", "I'd like to join, but I'm a little nervous. Do I have to sing alone in front of everyone?"),
            ("Woman", "No, not at all. New members just sing with the group."),
            ("Man", "That's good. I can't read music, though."),
            ("Woman", "That's OK. Ms. Castillo plays each song on the piano first, and we learn it by "
                      "listening."),
            ("Man", "And when do you practice?"),
            ("Woman", "Every Tuesday and Thursday after school, in the music room."),
            ("Man", "Great. Can I come with you today?"),
            ("Woman", "Of course. Let's go!"),
        ],
        "questions": [
            q("Why is the man nervous about joining the choir?",
              "He does not know where the choir practices.",
              "He thinks he may have to sing by himself.",
              "He does not like the songs.",
              "He is too busy on Tuesdays.",
              "B", "detail",
              "'I'm a little nervous. Do I have to sing alone in front of everyone?'"),
            q("How do choir members learn a new song?",
              "They read the music at home.",
              "They sing it alone for the teacher.",
              "They listen to the teacher play it.",
              "They watch a video of it.",
              "C", "detail",
              "'Ms. Castillo plays each song on the piano first, and we learn it by listening.'"),
        ],
    },
    {
        "type": "announcement",
        "setting": "Listen to a recorded telephone message from a school.",
        "voice": "F-UK",
        "script": (
            "Good morning. This is a message for all students and parents of Hillcrest School. Because of the "
            "heavy snow last night, the school is closed today, Tuesday. The roads are not safe for the school "
            "buses. Teachers will put today's homework on the school website by ten o'clock. The basketball "
            "game this afternoon will be played next Monday instead. We hope to open again tomorrow. Please "
            "check the website tonight after six for news."
        ),
        "questions": [
            q("Why is the school closed today?",
              "There was a lot of snow.",
              "The buses are being repaired.",
              "It is a holiday.",
              "The teachers have a meeting.",
              "A", "detail",
              "'Because of the heavy snow last night, the school is closed today.'"),
            q("What will happen to the basketball game?",
              "It will be played tomorrow.",
              "It will be played at another school.",
              "It will start at six o'clock.",
              "It will be played on a different day.",
              "D", "detail",
              "'The basketball game this afternoon will be played next Monday instead.'"),
        ],
    },
    {
        "type": "announcement",
        "setting": "Listen to an announcement in a museum.",
        "voice": "M-US",
        "script": (
            "Attention, visitors. The museum will close in twenty minutes, at five o'clock. Please start walking "
            "to the main exit on the ground floor. The gift shop will stay open until five fifteen, so you still "
            "have time to buy postcards and books. If you left a coat or a bag in the cloakroom, please pick it "
            "up now. We are open again tomorrow from nine in the morning. Thank you for visiting the Harborview "
            "Museum, and have a good evening."
        ),
        "questions": [
            q("What is the announcement mainly about?",
              "A new show at the museum",
              "A sale in the gift shop",
              "The museum's closing time",
              "A lost coat",
              "C", "main_idea",
              "'The museum will close in twenty minutes, at five o'clock.'"),
            q("What can visitors still do after five o'clock?",
              "Look at the rooms on the ground floor",
              "Buy things in the gift shop",
              "Leave bags in the cloakroom",
              "Get tickets for tomorrow",
              "B", "detail",
              "'The gift shop will stay open until five fifteen.'"),
        ],
    },
    {
        "type": "announcement",
        "setting": "Listen to an announcement by a sports coach.",
        "voice": "M-AU",
        "script": (
            "OK, team, listen up. The field is too wet after all this rain, so we can't play outside today. "
            "Practice will be in the gym instead. Go and change your shoes, because you can't wear your soccer "
            "shoes on the gym floor. Wear clean sneakers, please. We'll start at four, not at three thirty, "
            "because the volleyball team is using the gym first. We'll finish at five as usual. And don't "
            "forget your water bottles!"
        ),
        "questions": [
            q("Why is practice in the gym today?",
              "The field is wet.",
              "It is too cold outside.",
              "The volleyball team is on the field.",
              "The coach is late.",
              "A", "detail",
              "'The field is too wet after all this rain, so we can't play outside today.'"),
            q("What time will practice start?",
              "At three thirty",
              "At four o'clock",
              "At five o'clock",
              "At four thirty",
              "B", "detail",
              "'We'll start at four, not at three thirty.' Five o'clock is when practice ends."),
        ],
    },
]

LISTENING_UPPER = [
    lcr("F-AU", "I gather the committee wasn't exactly thrilled with our budget proposal.",
        "Yes, we gathered in the main hall at noon.",
        "The thriller starts at eight, I believe.",
        "That's putting it mildly. They sent it back.",
        "I'm so glad to hear they liked it.",
        "C", "'Wasn't exactly thrilled' is understatement for 'disliked it'. C agrees and goes further; D misses "
             "the understatement."),
    lcr("M-UK", "You couldn't spare five minutes to look over my abstract, could you?",
        "Go on, then. Send it over before lunch.",
        "No, I couldn't find a spare one anywhere.",
        "It took me about five minutes to walk here.",
        "Abstract art has never really appealed to me.",
        "A", "A tentative request for help. 'Go on, then' agrees to it; the others reuse 'spare', 'five "
             "minutes' and 'abstract' with other meanings."),
    lcr("F-US", "If I'd known the seminar would drag on like that, I'd have brought a snack.",
        "Thanks, but I've only just had lunch.",
        "Yes, he dragged the chairs to the back.",
        "I didn't know you had brought any.",
        "Tell me about it. I was starving.",
        "D", "'Drag on' means last too long. 'Tell me about it' is an idiom of strong agreement; A answers an "
             "offer that was not made."),
    {
        "type": "conversation",
        "setting": "Listen to a conversation between two student lab assistants.",
        "voices": {"Woman": "F-UK", "Man": "M-US"},
        "script": [
            ("Woman", "Ravi, have a look at this. The temperature readings from last Thursday can't be right. "
                      "They're all exactly two degrees higher than every other day."),
            ("Man", "Huh. Did somebody forget to recalibrate the sensor?"),
            ("Woman", "That'd be my guess. The trouble is, half the department has already downloaded this data "
                      "set."),
            ("Man", "So if we flag it, Dr. Castellan has to email everyone, and it looks as if the mistake came "
                    "from our shift."),
            ("Woman", "It wasn't our shift. We weren't even in on Thursday."),
            ("Man", "True. Still, I'd rather not be the one to rock the boat. Couldn't we just quietly correct "
                    "the file?"),
            ("Woman", "And leave people working with the old version? That's worse. Somebody's thesis could be "
                      "built on those numbers."),
            ("Man", "Yeah. When you put it like that, it's hard to argue. All right. But let's go and tell her "
                    "together."),
        ],
        "questions": [
            q('What does the man mean when he says he would "rather not be the one to rock the boat"?',
              "He thinks the sensor should not be moved.",
              "He is reluctant to cause trouble by reporting the error.",
              "He believes the error is too small to matter.",
              "He wants the woman to take the blame for the mistake.",
              "B", "function",
              "To 'rock the boat' is to disturb a calm situation. He fears the email to everyone and looking "
              "responsible, so he suggests correcting the file quietly."),
            q("Why does the woman object to correcting the file quietly?",
              "The supervisor would notice the change at once.",
              "They do not know what the correct values are.",
              "It would take too long to fix every reading.",
              "Others would keep using the faulty version.",
              "D", "inference",
              "'And leave people working with the old version? That's worse.' Half the department has already "
              "downloaded the data."),
        ],
    },
    {
        "type": "announcement",
        "setting": "Listen to an announcement in a university library.",
        "voice": "F-US",
        "script": (
            "May I have your attention, please. Starting Monday, the library is changing the way its overnight "
            "study rooms work. Between midnight and six a.m., the main doors will open only for people who tap "
            "a valid student card, and guests will no longer be admitted during those hours. Study rooms must "
            "now be reserved online, for a maximum of three hours per person each night. If you haven't checked "
            "in within fifteen minutes of your start time, the booking is released to the next person in line. "
            "These changes follow a number of complaints about rooms being held all night by groups who weren't "
            "actually using them."
        ),
        "questions": [
            q("What is the main purpose of the announcement?",
              "To explain new rules for late-night library use",
              "To announce that the library will close earlier",
              "To invite students to apply for a library card",
              "To apologize for noise in the study rooms",
              "A", "purpose",
              "'Starting Monday, the library is changing the way its overnight study rooms work', followed by "
              "the rules for card access and bookings."),
            q("What can be inferred about the reason for the new rules?",
              "Too few students were using the library at night.",
              "Guests had damaged equipment in the study rooms.",
              "Some students kept rooms they were not really using.",
              "The library could not afford to keep every floor open.",
              "C", "inference",
              "The changes 'follow a number of complaints about rooms being held all night by groups who weren't "
              "actually using them'."),
        ],
    },
    {
        "type": "talk",
        "subject": "Physics",
        "voice": "F-UK",
        "script": (
            "Why is the sky blue? It sounds like a child's question, and that's exactly why I like it, because "
            "most adults can't answer it. A surprising number will tell you, quite confidently, that the sky "
            "reflects the ocean. It doesn't. So let's do this properly. Sunlight looks white, but it's really a "
            "mixture of every color, and each color travels as a wave of a different length. Red waves are "
            "long. Blue and violet waves are short. Now, the air is full of gas molecules, far smaller than any "
            "of those waves, and when sunlight hits them, it gets scattered, sent off in all directions. But "
            "not equally. Short waves are scattered far more strongly than long ones. So blue light ends up "
            "bouncing around the whole sky and reaching your eyes from every direction, while most of the red "
            "passes straight through. We call this Rayleigh scattering, after the British physicist who worked "
            "out the mathematics in the nineteenth century. Now, some of you are already thinking, hang on, "
            "violet is even shorter than blue, so why isn't the sky violet? Good. Partly, the sun gives off "
            "less violet to begin with, and partly, our eyes just aren't very sensitive to it. And sunsets? At "
            "the end of the day, sunlight has to cross far more air to reach you. By then, most of the blue has "
            "been scattered out of the beam, and what's left is orange and red."
        ),
        "questions": [
            q("What is the talk mainly about?",
              "How the human eye tells colors apart",
              "How scattered sunlight gives the sky its color",
              "Why the ocean and the sky are the same color",
              "How a physicist measured the length of light waves",
              "B", "main_idea",
              "The professor answers her opening question, 'Why is the sky blue?', with the scattering of "
              "sunlight by air molecules."),
            q("What is the professor's attitude toward the idea that the sky reflects the ocean?",
              "She thinks it is partly correct.",
              "She is unsure whether it has been tested.",
              "She finds it a useful way to teach children.",
              "She considers it a widespread mistake.",
              "D", "attitude",
              "'A surprising number will tell you, quite confidently, that the sky reflects the ocean. It "
              "doesn't.'"),
            q("According to the professor, why does blue light reach our eyes from every part of the sky?",
              "Air molecules scatter short waves more than long ones.",
              "Blue light travels faster than red light.",
              "The sun produces more blue light than any other color.",
              "Blue waves are too long to pass through the air.",
              "A", "detail",
              "'Short waves are scattered far more strongly than long ones. So blue light ends up bouncing "
              "around the whole sky.'"),
            q("Why does the professor bring up violet light?",
              "To correct a mistake in Rayleigh's mathematics",
              "To show that sunsets contain every color",
              "To answer a question students are likely to ask",
              "To prove that human eyes cannot see short waves",
              "C", "function",
              "'Some of you are already thinking, hang on, violet is even shorter than blue, so why isn't the "
              "sky violet?' She raises the objection herself and answers it."),
        ],
    },
    {
        "type": "talk",
        "subject": "Linguistics",
        "voice": "M-US",
        "script": (
            "There are roughly seven thousand languages spoken in the world today. By the end of this century, "
            "by many estimates, around half of them will have fallen silent. Now, I want to be careful here, "
            "because people tend to picture this the wrong way. Languages rarely die because their speakers "
            "die. They die because parents, usually for perfectly sensible reasons, stop passing them on. If "
            "the language of school, of work, of the city is something else, then speaking that other language "
            "to your children looks like giving them a head start. Nobody decides to kill a language. It just "
            "isn't handed down. And one generation is all it takes. So what, you might say. Wouldn't life be "
            "simpler with fewer languages? Well, consider what goes with them. A community that has lived in "
            "one place for centuries has names for plants, for animals, for kinds of weather, that often exist "
            "nowhere else and were never written down. And for us linguists, every language is a piece of "
            "evidence about what the human mind can do. Lose it, and that evidence is gone for good. It isn't "
            "hopeless, though. In New Zealand in the nineteen eighties, Māori communities began running "
            "preschools, called language nests, where small children heard nothing but Māori all day. The idea "
            "has since been copied elsewhere, including Hawaii. It doesn't guarantee survival. But it does show "
            "that the decline is not a law of nature."
        ),
        "questions": [
            q("What is the talk mainly about?",
              "How linguists count the world's languages",
              "Why children learn languages faster than adults",
              "How the Māori language spread to Hawaii",
              "Why languages disappear and why it matters",
              "D", "main_idea",
              "The professor explains how languages are lost (they are not passed on), what is lost with them, "
              "and one attempt to stop the decline."),
            q("According to the professor, what usually causes a language to disappear?",
              "Its speakers are forbidden to use it.",
              "It is no longer taught to the next generation.",
              "Its vocabulary becomes too old-fashioned.",
              "Its last speakers move to other countries.",
              "B", "detail",
              "'They die because parents, usually for perfectly sensible reasons, stop passing them on.'"),
            q('Why does the professor say this: "So what, you might say. Wouldn\'t life be simpler with fewer '
              'languages?"',
              "To raise an objection that he then answers",
              "To show that he agrees with this view",
              "To ask the students to vote on the question",
              "To suggest that the estimates are exaggerated",
              "A", "function",
              "He voices a doubt a listener might have and at once replies, 'Well, consider what goes with "
              "them.'"),
            q("What is the professor's view of the language nests?",
              "They have solved the problem in New Zealand.",
              "They are encouraging, though not a certain solution.",
              "They work only for languages with written records.",
              "They are too expensive to copy in other places.",
              "B", "attitude",
              "'It doesn't guarantee survival. But it does show that the decline is not a law of nature.'"),
        ],
    },
]

# ===============================================================================================================
# WRITING
# ===============================================================================================================
WRITING = {
    "build": [
        build("Is your roommate coming to the party tonight?",
              "No, she does not like loud music.",
              ["she", "does not", "like", "loud", "music"], "negation", prefix="No,"),
        build("I heard you moved out of the dorm.",
              "Is your new apartment far from campus?",
              ["is", "your", "new", "apartment", "far", "from campus"], "yes_no_question"),
        build("I have to give a talk in my history seminar.",
              "Which topic did you choose for your talk?",
              ["which", "topic", "did", "you", "choose for", "your talk"], "wh_question"),
        build("Should I take the morning or the evening section?",
              "The evening class is less crowded than the morning one.",
              ["is", "less", "crowded", "than", "the morning", "one"], "comparison",
              prefix="The evening class"),
        build("The concert is likely to sell out quickly.",
              "You might want to buy your ticket before the weekend.",
              ["you", "might", "want", "to buy", "your ticket"], "modal", suffix="before the weekend"),
        build("Our group presentation is on Thursday morning.",
              "Has everyone sent you their slides yet?",
              ["has", "everyone", "sent", "you", "their slides yet"], "perfect", extra="have"),
        build("How do we hand in the final essay?",
              "All assignments must be submitted through the course website.",
              ["all", "assignments", "must", "be", "submitted through", "the course website"], "passive"),
        build("Why do you look so worried?",
              "I can't find the charger that you lent me.",
              ["I", "can't find", "the charger", "that", "you", "lent me"], "relative_clause", extra="who"),
        build("The swimming pool has been closed since Monday.",
              "Does anyone know how long the repairs will take?",
              ["does", "anyone", "know", "how long", "the repairs will", "take"], "embedded_question",
              extra="will the repairs"),
        build("I don't think I can finish my project on time.",
              "What would you do if the professor refused to extend the deadline?",
              ["what", "would you", "do if", "the professor", "refused", "to extend", "the deadline"],
              "conditional"),
    ],
    "email": {
        "scenario": (
            "Yesterday evening you attended a public lecture in a university building. When you got home, you "
            "realized that you had left your jacket on your seat, and your keys were in one of its pockets. You "
            "went back, but the building was already locked. You decide to write to the building coordinator, "
            "Ms. Okonkwo."
        ),
        "to": "Ms. Okonkwo",
        "subject": "Jacket left in the lecture hall",
        "bullets": [
            "Explain what happened.",
            "Describe the jacket and where you left it.",
            "Ask how you can get your belongings back.",
        ],
        "model": """
Dear Ms. Okonkwo,

I am writing because I left something behind in Whitlock Hall yesterday. I attended the public lecture on city gardens, which ended at about 8:30 p.m. When I got home, I realized that my jacket was missing. I went back at once, but the building was already locked.

The jacket is dark green with a gray hood. I was sitting in the fourth row of the lecture hall, near the left aisle, and I believe I hung it over the back of my seat. My house keys are in the inside pocket, on a red key ring, so I am anxious to find it.

Could you please tell me whether the jacket has been handed in? If it has, when and where could I collect it? I can come to the building at any time today or tomorrow, and I will bring my student card.

Thank you very much for your help.

Sincerely,
Lucía Ferrer
""".strip(),
    },
    "discussion": {
        "course": "public health",
        "professor": {
            "name": "Dr. Halvorsen",
            "post": (
                "This week we are studying how governments try to influence what people eat and drink. Dozens "
                "of countries, including Mexico and the United Kingdom, now place a special tax on sugary "
                "drinks. Supporters argue that higher prices lead people to consume less sugar and that the "
                "money can pay for health programs. Critics reply that such taxes fall hardest on families with "
                "low incomes and that people should be free to choose. What is your view? Should governments "
                "tax sugary drinks? Why or why not?"
            ),
        },
        "students": [
            {
                "name": "Renata",
                "post": (
                    "I support the tax. When something costs more, people buy less of it, and that is "
                    "especially true of teenagers, who have little money of their own. A tax also pushes "
                    "companies to put less sugar in their products so that they pay less. A small change in "
                    "price seems to me an easy way to protect children."
                ),
            },
            {
                "name": "Callum",
                "post": (
                    "I don't think a tax is the right tool. Rich people will hardly notice a few extra cents, "
                    "so the cost falls mostly on poorer families. Besides, people can simply switch to other "
                    "sweet foods. I would rather see governments spend money on education and on free drinking "
                    "water in every school."
                ),
            },
        ],
        "model": (
            "I believe governments should tax sugary drinks, but only if the tax is designed carefully. Callum "
            "is right that a higher price is harder on families with little money. However, those same "
            "families often suffer most from the health problems connected with too much sugar, so they also "
            "have the most to gain. To make the policy fair, the money collected should go back to the "
            "communities that pay it, for example by lowering the price of fruit and vegetables or by putting "
            "free water fountains in public places. I would also add an idea that has not been mentioned: the "
            "tax could depend on the amount of sugar in each drink rather than on the size of the bottle. Then "
            "companies would have a strong reason to change their recipes, and people could keep buying their "
            "favorite brands in a healthier form."
        ),
    },
}

# ===============================================================================================================
# SPEAKING
# ===============================================================================================================
SPEAKING = {
    "repeat": {
        "scenario": (
            "You are learning how to help travelers at a train station information desk. Listen to your "
            "supervisor and repeat what he says. Repeat only once."
        ),
        "picture": "A train station hall with an information desk, a departure board, ticket machines and "
                   "stairs leading down to the platforms.",
        "voice": "M-AU",
        "sentences": [
            "The ticket office is on your left.",
            "Trains to the airport leave every half hour.",
            "The next train to the coast leaves from platform six at noon.",
            "You can buy a day pass at any of the blue machines.",
            "Lost property is kept in the small office near the exit.",
            "If a passenger has missed the last train, show them the list of night buses on the screen.",
            "When a platform changes, tell the passengers right away so that nobody misses the train.",
        ],
    },
    "interview": {
        "topic": "friendship and keeping in touch",
        "scenario": (
            "You have agreed to take part in a research study about friendship and keeping in touch. You will "
            "have a short online interview with a researcher. The researcher will ask you some questions."
        ),
        "voice": "F-US",
        "questions": [
            {
                "kind": "event",
                "q": (
                    "Thank you for joining me today. I'd like to start with your own experience. Think of a "
                    "friend you don't see very often. How did the two of you meet, and how do you stay in "
                    "contact now?"
                ),
                "model": (
                    "One friend I don't see very often is Mateo. We met on the first day of high school, "
                    "because the teacher gave us seats next to each other. We soon discovered that we "
                    "supported the same football team, and after that we spent almost every weekend together. "
                    "Two years ago, he moved to another city to study engineering, so now we mostly keep in "
                    "touch online. We send each other short voice messages a few times a week, usually about "
                    "football or something funny that happened. About once a month we have a long video call, "
                    "and during the holidays we always try to meet in person."
                ),
            },
            {
                "kind": "life",
                "q": (
                    "Some people like to have a large circle of friends, while others prefer just a few close "
                    "ones. Which is closer to your own preference, and why?"
                ),
                "model": (
                    "I definitely prefer having a few close friends. For me, friendship takes time, and I only "
                    "have a limited amount of it because of my studies and my part-time job. If I tried to "
                    "stay close to twenty people, I would not be able to give any of them real attention. With "
                    "my three best friends, I can talk about serious things, such as family problems or "
                    "worries about the future, and I know they will listen. Of course, I enjoy meeting new "
                    "people in class, and I am friendly with many of them. But I would call them acquaintances "
                    "rather than true friends."
                ),
            },
            {
                "kind": "opinion",
                "q": (
                    "Now I'd like to hear your opinion. Some people believe that a friendship cannot really "
                    "stay strong when two friends live far away from each other. Do you agree or disagree? Why?"
                ),
                "model": (
                    "I disagree with that view. Distance certainly makes a friendship harder, because you "
                    "cannot share everyday moments, like eating lunch together. However, I think the strength "
                    "of a friendship depends on effort, not on location. My cousin and her best friend have "
                    "lived in different countries for ten years, and they are still very close because they "
                    "call each other every Sunday. In some ways, distance can even improve a friendship, since "
                    "people stop taking each other for granted. On the other hand, if neither person makes "
                    "time for the other, the friendship will fade, even if they live on the same street."
                ),
            },
            {
                "kind": "opinion",
                "q": (
                    "Here is my last question. Many students move to a new city for university and find it "
                    "hard to make friends there. Do you think universities should do more to help new students "
                    "build friendships, or is that the students' own responsibility? Please explain."
                ),
                "model": (
                    "I think universities should do more, although students also have to make an effort. "
                    "Starting university can be very lonely, especially for students who come from another "
                    "city or country and know nobody. Loneliness affects their health and their grades, so it "
                    "is in the university's interest to help. For example, universities could organize small "
                    "group activities in the first weeks, such as hiking trips or cooking evenings, instead of "
                    "only big welcome parties where shy people feel lost. They could also match each new "
                    "student with an older student from the same department. After that first step, it is up "
                    "to the students to keep the friendships going."
                ),
            },
        ],
    },
}

FORM = {
    "number": 7,
    "theme": "Habits and penicillin; swaying towers, crop rotation, the blue sky, endangered languages",
    "reading": {"router": READING_ROUTER, "lower": READING_LOWER, "upper": READING_UPPER},
    "listening": {"router": LISTENING_ROUTER, "lower": LISTENING_LOWER, "upper": LISTENING_UPPER},
    "writing": WRITING,
    "speaking": SPEAKING,
}
