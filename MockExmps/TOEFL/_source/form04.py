"""TOEFL iBT practice test 04. Structure follows form01.py (see AUTHORING.md)."""

from common import build, lcr, q

# ===============================================================================================================
# READING
# ===============================================================================================================
READING_ROUTER = [
    {
        "type": "complete_words",
        "subject": "Biology",
        "text": (
            "The immune system is the body's defense against bacteria, viruses, and other causes of disease. "
            "White bl[ood] cells tra[vel] through t[he] body a[nd] search f[or] anything th[at] does n[ot] belong. "
            "Some of these cells des[troy] the inv[ader] directly, wh[ile] others produce antibodies that mark it "
            "for removal. "
            "After an infection, the body keeps special cells that remember the germ, so it can respond faster "
            "the next time."
        ),
    },
    {
        "type": "complete_words",
        "subject": "Environmental science",
        "text": (
            "Renewable energy comes from natural sources that are constantly renewed, such as sunlight, wind, and "
            "flowing water. "
            "Unlike co[al] and o[il], these sou[rces] will n[ot] run o[ut] in t[he] future. "
            "They al[so] release f[ar] less car[bon] dioxide wh[en] they are used to make electricity. "
            "However, sunshine and wind are not constant, so engineers are developing larger batteries that can "
            "store electricity until it is needed."
        ),
    },
    {
        "type": "daily_life",
        "format": "notice",
        "heading": "Read a notice.",
        "text": """
NOTICE: STREET CLEANING ON ALDER STREET

City crews will wash Alder Street between Fifth Avenue and Ninth Avenue on Thursday, October 8, from 7:00 a.m. to noon. Parking is not allowed on either side of the street during these hours. Vehicles that are still on the street at 7:00 a.m. will be towed at the owner's expense. Free parking is available that morning in the Marsh Road garage.

Department of Public Works
""".strip(),
        "questions": [
            q("Why was the notice written?",
              "To tell drivers when they must keep their cars off a street",
              "To announce that a parking garage will be closed for cleaning",
              "To explain how to pay a fine for parking illegally",
              "To ask residents to help clean their street",
              "A", "purpose",
              "'Parking is not allowed on either side of the street during these hours', that is, Thursday from "
              "7:00 a.m. to noon."),
            q("What will happen to vehicles left on Alder Street on Thursday morning?",
              "They will be washed by the city crews.",
              "They will be moved to the Marsh Road garage for free.",
              "They will be removed, and their owners will pay.",
              "They will get a warning but no fine.",
              "C", "detail",
              "Such vehicles 'will be towed at the owner's expense'. The garage is only where drivers may park "
              "for free."),
        ],
    },
    {
        "type": "daily_life",
        "format": "email",
        "heading": "Read an email.",
        "text": """
To: Tomás Herrera
From: Brightwater Dental Care
Subject: Your appointment on June 14

Dear Mr. Herrera,

This message confirms your cleaning and checkup with Dr. Anand on Tuesday, June 14, at 2:30 p.m. Please arrive fifteen minutes early to update your patient form, and bring your insurance card.

Our office has moved since your last visit. We are now on the second floor of the Linden Building at 40 Canal Street. Parking behind the building is free for patients; simply give your license plate number to the receptionist.

If you need to change the time, call us at 555-0142 at least 24 hours in advance. Appointments canceled later than that are charged a $25 fee.

We look forward to seeing you.

Brightwater Dental Care
""".strip(),
        "questions": [
            q("What is Mr. Herrera asked to do on the day of his appointment?",
              "Pay a $25 fee at the front desk",
              "Call the office to confirm the time",
              "Send a copy of his insurance card by email",
              "Come early to update some information",
              "D", "detail",
              "'Please arrive fifteen minutes early to update your patient form.' The $25 is charged only for a "
              "late cancellation."),
            q("What can be inferred about Mr. Herrera?",
              "He has never met Dr. Anand.",
              "He has been a patient of this office before.",
              "He asked to change the time of his appointment.",
              "He usually travels to the office by bus.",
              "B", "inference",
              "'Our office has moved since your last visit' shows that he has been there before."),
            q("Which of the following does the email NOT tell Mr. Herrera?",
              "How long the appointment will last",
              "Where the office is now located",
              "What he should bring with him",
              "How he can avoid paying a cancellation fee",
              "A", "negative",
              "The email gives the new address, asks for the insurance card and explains the 24-hour rule. The "
              "length of the visit is never mentioned."),
        ],
    },
    {
        "type": "daily_life",
        "format": "text_messages",
        "heading": "Read a chain of text messages.",
        "text": """
Nadia (3:05 p.m.): Hi Callum, my chemistry lab is running late today. Could we move our tutoring session from 4:00 to 5:30?
Callum (3:09 p.m.): I have soccer practice at 6:00, so 5:30 is too tight. How about tomorrow at 4:00 instead?
Nadia (3:11 p.m.): Tomorrow works. Same table on the third floor of the library?
Callum (3:12 p.m.): Yes. Bring the practice problems from Chapter 6. We'll start with those.
""".strip(),
        "questions": [
            q("Why does Nadia write to Callum?",
              "To cancel her tutoring sessions for the semester",
              "To ask for a later meeting time",
              "To find out where the library is",
              "To tell him that she has finished her lab report",
              "B", "purpose",
              "'Could we move our tutoring session from 4:00 to 5:30?' Her lab is running late."),
            q("What will Nadia and Callum most likely do first when they meet?",
              "Look for a free table in the library",
              "Go to soccer practice together",
              "Finish Nadia's chemistry lab",
              "Work on exercises from a chapter",
              "D", "inference",
              "'Bring the practice problems from Chapter 6. We'll start with those.' They already have a usual "
              "table."),
        ],
    },
    {
        "type": "daily_life",
        "format": "webpage",
        "heading": "Read a webpage.",
        "text": """
HARTWELL MUSEUM OF NATURAL HISTORY
Become a Member

Individual: $60 a year
Unlimited free admission for one adult, 10% off in the museum shop, and our monthly email newsletter.

Family: $110 a year
All Individual benefits for two adults and up to four children under 18, plus two free guest passes each year.

Student: $35 a year
All Individual benefits. A valid student ID must be shown at every visit.

Good to know:
- Membership begins on the day you join and lasts twelve months.
- Members enter special exhibitions at half price. These are not included in free admission.
- Members-only evenings are held on the first Friday of each month, 6:00 to 9:00 p.m.

Join online or at the ticket desk.
""".strip(),
        "questions": [
            q("What do Family members receive that Individual members do not?",
              "A discount in the museum shop",
              "A monthly newsletter",
              "Passes for guests",
              "Entry to members-only evenings",
              "C", "detail",
              "The Family plan has all Individual benefits 'plus two free guest passes each year'. The other "
              "three belong to every plan."),
            q("A member wants to see a special exhibition. What will the member have to do?",
              "Pay half of the regular price",
              "Visit on the first Friday of the month",
              "Show a student ID",
              "Buy a guest pass",
              "A", "inference",
              "'Members enter special exhibitions at half price. These are not included in free admission.'"),
            q("Which of the following is NOT true of a Student membership?",
              "It costs less than an Individual membership.",
              "It can be bought only at the ticket desk.",
              "It requires identification at each visit.",
              "It includes a discount in the museum shop.",
              "B", "negative",
              "Anyone may 'join online or at the ticket desk'. The price ($35), the ID rule and the Individual "
              "benefits (10% off) are all stated."),
        ],
    },
    {
        "type": "academic",
        "subject": "Linguistics",
        "title": "Borrowed Words",
        "paragraphs": [
            "No language is built entirely from its own materials. When speakers of different languages trade, "
            "travel, or live side by side, words pass from one language to another. Linguists call these words "
            "loanwords, although the term is slightly misleading, since a borrowed word is never given back.",
            "Borrowing usually happens when a language lacks a name for something new. English speakers who first "
            "encountered foods such as sushi and yogurt simply adopted the Japanese and Turkish names along with "
            "the products. Borrowed words rarely stay unchanged, however. Their pronunciation is adjusted to fit "
            "the sound system of the new language, and their form may be shortened. In Japanese, for example, "
            "the English word \"television\" became terebi.",
            "Not all borrowing fills a gap. After the Norman Conquest of 1066, French was the language of "
            "England's rulers, and thousands of French words entered English even where native words already "
            "existed. This is why the animals in the field are called cow and sheep, both Old English words, "
            "while the meat on the table is beef and mutton, both from French. Borrowing, in other words, "
            "reflects prestige as well as need, and a language's vocabulary is a record of the peoples its "
            "speakers have met.",
        ],
        "questions": [
            q("What is the passage mainly about?",
              "Why English has more words than most other languages",
              "How the Norman Conquest changed English society",
              "How and why words move from one language to another",
              "Why borrowed words are difficult to pronounce",
              "C", "main_idea",
              "Paragraph 1 defines loanwords, paragraph 2 explains borrowing out of need and paragraph 3 "
              "borrowing out of prestige."),
            q('Why does the author describe the term "loanwords" as slightly misleading?',
              "A loan is normally something that is returned.",
              "Most loanwords are invented by the new language.",
              "Linguists disagree about which words are loans.",
              "Borrowed words usually change their meaning.",
              "A", "inference",
              "The reason given is 'since a borrowed word is never given back': a real loan is returned, a "
              "loanword is not."),
            q('The word "encountered" in the passage is closest in meaning to',
              "learned to cook", "wrote about", "paid for", "came across",
              "D", "vocabulary",
              "To encounter something is to meet or come across it; the speakers met these foods for the first "
              "time."),
            q("According to the passage, what usually happens to a word after it is borrowed?",
              "It replaces an older word that has the same meaning.",
              "Its sound is changed to suit the new language.",
              "It keeps its original spelling and sound.",
              "It is returned to the original language.",
              "B", "factual",
              "Paragraph 2: 'Their pronunciation is adjusted to fit the sound system of the new language.'"),
            q('Why does the author mention the words "beef" and "mutton"?',
              "To show that French cooking became popular in England",
              "To explain why some loanwords change their meaning",
              "To give an example of borrowing without a real need",
              "To prove that Old English had few words for food",
              "C", "purpose",
              "Paragraph 3 opens 'Not all borrowing fills a gap': French words came in 'even where native words "
              "already existed'."),
        ],
    },
]

READING_LOWER = [
    {
        "type": "complete_words",
        "subject": "History",
        "text": (
            "The Silk Road was a network of trade routes that connected China with Europe for many centuries. "
            "Traders car[ried] silk, spi[ces], and ot[her] goods acr[oss] deserts a[nd] high moun[tains]. "
            "Most tra[ders] did n[ot] travel t[he] whole w[ay]. "
            "Instead, goods were passed from one merchant to another in busy market towns. "
            "Ideas and inventions, such as the art of making paper, also moved along these routes."
        ),
    },
    {
        "type": "daily_life",
        "format": "review",
        "heading": "Read a review.",
        "text": """
Lemon Tree Kitchen
Review by Hana K. (4 out of 5 stars)

I had lunch here on Saturday with two friends. The vegetable soup was hot and tasty, and the bread was fresh. Our waiter was friendly and brought the food quickly. The only problem was the noise. The room is small, and it was hard to hear my friends. I will go again, but next time I will sit outside.
""".strip(),
        "questions": [
            q("What problem did Hana have at the restaurant?",
              "The food was cold.",
              "The room was too loud.",
              "The waiter was very slow.",
              "The bread was old.",
              "B", "detail",
              "'The only problem was the noise... it was hard to hear my friends.'"),
            q("What will Hana probably do on her next visit?",
              "Order a different soup",
              "Eat at another restaurant",
              "Come with more friends",
              "Choose a table outdoors",
              "D", "inference",
              "'I will go again, but next time I will sit outside.'"),
        ],
    },
    {
        "type": "daily_life",
        "format": "form",
        "heading": "Read a form.",
        "text": """
NORTHFIELD HOME STORE: RETURN FORM

Order number: 77154
Item: Desk lamp, white
Reason for return (check one):
[ ] Wrong item   [X] Item is damaged   [ ] No longer needed

How to return your item:
1. Fill in this form and put it in the box with the item.
2. Use the original box if you still have it.
3. Stick the free return label on the outside of the box.
4. Take the box to any post office within 30 days of delivery.

Your money will be returned to your card about 7 days after we receive the item. Keep your post office receipt until then.
Questions? Call 555-0167, Monday to Friday, 9 a.m. to 5 p.m.
""".strip(),
        "questions": [
            q("Why is the customer sending the lamp back?",
              "It is in bad condition.",
              "It is the wrong color.",
              "It arrived too late.",
              "It is not needed anymore.",
              "A", "detail",
              "The box that is checked is 'Item is damaged'."),
            q("What does the customer NOT need to do?",
              "Put the form inside the box",
              "Attach a label to the box",
              "Bring the box to a post office",
              "Pay to send the box back",
              "D", "negative",
              "Steps 1, 3 and 4 give the other three. The return label is 'free', so the customer does not pay "
              "for sending."),
            q("When will the customer get the money back?",
              "On the same day that the box is mailed",
              "Exactly thirty days after the lamp was delivered",
              "About a week after the store gets the lamp",
              "As soon as the customer calls the store",
              "C", "detail",
              "'Your money will be returned to your card about 7 days after we receive the item.'"),
        ],
    },
]

READING_UPPER = [
    {
        "type": "complete_words",
        "subject": "Economics",
        "text": (
            "Inflation is a general rise in the prices of goods and services across an economy over time. "
            "As pri[ces] climb, ea[ch] unit o[f] currency bu[ys] less th[an] it d[id] before. "
            "Economists usu[ally] measure infl[ation] by trac[king] the co[st] of a fixed basket of everyday "
            "items. "
            "When wages fail to keep pace, households can afford less. "
            "Central banks therefore try to keep inflation low and steady, often by raising or lowering interest "
            "rates."
        ),
    },
    {
        "type": "academic",
        "subject": "Astronomy",
        "title": "Detecting Distant Worlds",
        "paragraphs": [
            "Astronomers long suspected that the Sun was not the only star with planets, but proof was slow to "
            "come. A planet shines only by reflected light, and that faint glow is drowned out by the star it "
            "circles. Seeing one directly is like trying to spot a firefly beside a lighthouse from many "
            "kilometers away. The first planet orbiting a Sun-like star was not confirmed until 1995.",
            "Because direct observation is so difficult, most discoveries have relied on indirect evidence. One "
            "approach watches for a wobble: as a planet orbits, its gravity tugs the star slightly back and "
            "forth, and this motion subtly shifts the color of the star's light. Another, the transit method, "
            "monitors a star's brightness. If a planet happens to pass between the star and Earth, the light "
            "dims by a tiny fraction at regular intervals. Space telescopes using this technique have identified "
            "thousands of planets.",
            "Neither method is neutral, however. A large planet close to its star produces a stronger wobble and "
            "deeper, more frequent dips in brightness than a small, distant one, so giant planets in tight "
            "orbits dominated the early lists. Astronomers therefore caution that the catalog reflects the "
            "limits of their instruments as much as the true population of planets. Worlds resembling Earth may "
            "be common; they are simply harder to detect.",
        ],
        "questions": [
            q("Why does the author mention a firefly and a lighthouse?",
              "To explain how planets reflect the light of a star",
              "To show how hard it is to see a planet near its star",
              "To describe the instruments astronomers used before 1995",
              "To suggest that most stars are brighter than the Sun",
              "B", "purpose",
              "The comparison follows 'that faint glow is drowned out by the star it circles': the firefly is "
              "the planet, the lighthouse the star."),
            q("According to the passage, what does the transit method measure?",
              "Slight changes in the color of a star's light",
              "The glow reflected by a planet's surface",
              "The distance between a star and Earth",
              "Small, regular drops in a star's brightness",
              "D", "factual",
              "The transit method 'monitors a star's brightness': 'the light dims by a tiny fraction at regular "
              "intervals'. Color shifts belong to the wobble method."),
            q('The word "neutral" in the passage is closest in meaning to',
              "unbiased", "accurate", "modern", "simple",
              "A", "vocabulary",
              "The next sentence shows that both methods favor one kind of planet, so 'not neutral' means not "
              "unbiased."),
            q("What can be inferred about a small planet that orbits far from its star?",
              "It cannot have formed in the same way as Earth.",
              "It reflects more light than a giant planet does.",
              "It is more likely to be missed by both methods.",
              "It causes its star to wobble more strongly.",
              "C", "inference",
              "A small, distant planet gives a weaker wobble and shallower, rarer dips, so such worlds are "
              "'simply harder to detect'."),
            q("What is the passage mainly about?",
              "Why the first planet beyond the solar system was found only in 1995",
              "How distant planets are found and why the results may be one-sided",
              "Why planets like Earth are probably rare in the galaxy",
              "How space telescopes have replaced observatories on the ground",
              "B", "main_idea",
              "Paragraphs 1 and 2 explain the difficulty and the two indirect methods; paragraph 3 explains why "
              "the catalog 'reflects the limits of their instruments'."),
        ],
    },
]

# ===============================================================================================================
# LISTENING
# ===============================================================================================================
LISTENING_ROUTER = [
    lcr("F-UK", "Where did you put the charger for the laptop?",
        "It took about an hour.",
        "No, the laptop is mine.",
        "It's plugged in by the sofa.",
        "They charge ten dollars a day.",
        "C", "'Where' needs a place. D only repeats the sound of 'charge'."),
    lcr("M-US", "Have you had a chance to look over my essay yet?",
        "I'm about halfway through it.",
        "Yes, the chances are good.",
        "It's over there, on the shelf.",
        "I looked everywhere for it.",
        "A", "A answers indirectly: the reading has started but is not finished. B, C and D reuse 'chance', "
             "'over' and 'look'."),
    lcr("F-AU", "Could you give me a hand with these posters?",
        "I handed it in on Monday.",
        "My hands are really cold.",
        "The posters cost five dollars.",
        "Sure. Where do you want them?",
        "D", "'Give me a hand' is a request for help; D agrees. A and B take 'hand' literally."),
    lcr("M-UK", "What did you think of the campus tour?",
        "I think it starts at the main gate.",
        "A bit rushed, but the guide was helpful.",
        "Yes, I thought so, too.",
        "We're expecting about fifty visitors today.",
        "B", "'What did you think of...?' asks for an opinion. A answers where, and C agrees with nothing."),
    lcr("F-US", "Shouldn't you be at swimming practice by now?",
        "It was canceled at the last minute.",
        "Yes, the pool is on the right.",
        "I suppose it's about three o'clock.",
        "No, I've never swum there before.",
        "A", "The speaker is surprised to see the other person; A explains why they are not at practice."),
    lcr("M-AU", "How often do you go back to your hometown?",
        "It takes about five hours by train.",
        "I often go running in the morning.",
        "From the station near the river.",
        "Only two or three times a year.",
        "D", "'How often' asks about frequency. A gives a length of time and C a place."),
    lcr("F-UK", "I heard the cafeteria is raising its prices again.",
        "The prize was a free lunch for two.",
        "It's on the ground floor.",
        "Again? It's already expensive.",
        "Yes, I heard the music, too.",
        "C", "A natural reaction to unwelcome news. A plays on 'prices' and 'prize'."),
    lcr("M-US", "Would it be all right if I turned in the assignment tomorrow?",
        "Turn right at the corner.",
        "As long as it's on my desk by noon.",
        "It was assigned at the start of last week.",
        "Yes, you turned it off.",
        "B", "The speaker asks for permission. B gives it with a condition, without saying 'yes'."),
    lcr("F-AU", "Which bus should I take to get downtown?",
        "It takes about half an hour.",
        "Downtown is very busy on weekends.",
        "I took it last night.",
        "The 12 or the 40. Both go there.",
        "D", "'Which bus' needs a bus. A answers 'how long' and C uses the wrong tense."),
    lcr("M-UK", "This room is freezing. Is the heating on?",
        "Let me check the thermostat.",
        "No, the meeting is in the next room.",
        "Yes, he's sitting over there.",
        "The freezer is in the kitchen.",
        "A", "The speaker is cold; A offers to find out. B confuses 'heating' with 'meeting'."),
    lcr("F-US", "When is the last day to sign up for the trip?",
        "At the student center.",
        "It lasted three days.",
        "I believe it's this Friday.",
        "There's a sign on the door.",
        "C", "'When' needs a time. A is a place; B and D reuse 'last' and 'sign'."),
    lcr("M-AU", "You've done a great job on these slides.",
        "Yes, I'm looking for a job.",
        "Thanks. They took me all weekend.",
        "The slide is next to the playground.",
        "No, I haven't done it yet.",
        "B", "The remark is a compliment, and B accepts it. A and C take 'job' and 'slides' literally."),
    {
        "type": "conversation",
        "setting": "Listen to a conversation between a student and a housing office employee.",
        "voices": {"Man": "M-AU", "Woman": "F-US"},
        "script": [
            ("Man", "Hi. I'd like to ask about moving to a different room. I'm in Dalton Hall, on the first "
                    "floor."),
            ("Woman", "OK. Is there a problem with your room?"),
            ("Man", "It's right next to the laundry room. The machines run until midnight, and I can't sleep."),
            ("Woman", "I see. We do have a few empty rooms, but room changes only start in the third week of "
                      "the semester."),
            ("Man", "So I have to wait until next Monday?"),
            ("Woman", "That's right. But you can fill out the request form today, and you'll be first on the "
                      "list."),
            ("Man", "All right. Is there a fee?"),
            ("Woman", "No, the first change is free. Here's the form."),
        ],
        "questions": [
            q("Why does the man want to change rooms?",
              "His roommate stays up until midnight.",
              "Noise from machines keeps him awake.",
              "His room is too far from the laundry room.",
              "He wants to live in a different building.",
              "B", "detail",
              "His room is next to the laundry room: 'The machines run until midnight, and I can't sleep.'"),
            q("What will the man probably do next?",
              "Pay a fee for the room change",
              "Move his things to an empty room",
              "Come back to the office next Monday",
              "Complete a request form",
              "D", "prediction",
              "'You can fill out the request form today... Here's the form.' The move itself must wait, and "
              "there is no fee."),
        ],
    },
    {
        "type": "conversation",
        "setting": "Listen to a conversation between two coworkers.",
        "voices": {"Woman": "F-UK", "Man": "M-US"},
        "script": [
            ("Woman", "Ravi, are you working this Saturday?"),
            ("Man", "No, I've got the day off. Why?"),
            ("Woman", "I'm down for the morning shift at the bakery counter, but my cousin's graduation is at "
                      "eleven. Could you cover for me?"),
            ("Man", "Saturday morning... I suppose I could. But then I'd need someone to take my Sunday evening "
                    "shift. I have a paper due Monday."),
            ("Woman", "I can do Sunday evening. That's easy."),
            ("Man", "Great. Should we tell the manager?"),
            ("Woman", "We have to. She wants every swap written in the schedule book before Friday."),
            ("Man", "Then let's go and see her now, before she leaves."),
        ],
        "questions": [
            q("Why does the woman need Saturday morning off?",
              "She wants to attend a family event.",
              "She has to finish a paper.",
              "She is starting a new job at a bakery.",
              "She is graduating that day.",
              "A", "detail",
              "'My cousin's graduation is at eleven.' The paper is the man's reason for giving up Sunday."),
            q("What will the speakers probably do next?",
              "Work together on Sunday evening",
              "Look for another coworker to help",
              "Speak to their manager",
              "Check the schedule for next month",
              "C", "prediction",
              "The manager wants every swap recorded: 'Then let's go and see her now.'"),
        ],
    },
    {
        "type": "conversation",
        "setting": "Listen to a conversation between a student and a teaching assistant.",
        "voices": {"Woman": "F-AU", "Man": "M-UK"},
        "script": [
            ("Woman", "Excuse me, Tunde? Do you have a minute? It's about my quiz from last week."),
            ("Man", "Of course. What's the matter?"),
            ("Woman", "I got six out of ten, but I think question four was marked wrong by mistake. My answer "
                      "matches the one in the textbook."),
            ("Man", "Let me see. Hmm, your final number is right, but you didn't show any of your steps. The "
                    "instructions said to show all work."),
            ("Woman", "Oh. I did the steps on scrap paper."),
            ("Man", "I can't give credit for that, I'm afraid. But look at question seven. I took off two "
                    "points, and your answer is actually correct. That's my mistake."),
            ("Woman", "So my grade goes up after all?"),
            ("Man", "To eight. I'll change it in the system this afternoon."),
        ],
        "questions": [
            q("Why did the student lose points on question four?",
              "Her final answer was incorrect.",
              "She copied the answer from the textbook.",
              "She ran out of time during the quiz.",
              "She did not show her steps on the quiz.",
              "D", "detail",
              "'Your final number is right, but you didn't show any of your steps.'"),
            q("What does the teaching assistant say about question seven?",
              "He graded it incorrectly.",
              "The student should answer it again.",
              "It was removed from the quiz.",
              "It was the hardest question.",
              "A", "detail",
              "'I took off two points, and your answer is actually correct. That's my mistake.'"),
        ],
    },
    {
        "type": "conversation",
        "setting": "Listen to a conversation at a post office.",
        "voices": {"Man": "M-AU", "Woman": "F-UK"},
        "script": [
            ("Man", "Good morning. I'd like to send this package to my sister in Portugal."),
            ("Woman", "Sure. Put it on the scale, please. It's just under two kilos. What's inside?"),
            ("Man", "Two books and a photo album. It's a birthday present."),
            ("Woman", "OK. Standard delivery is twenty-two dollars and takes about ten working days. Express is "
                      "forty-five, and it gets there in three."),
            ("Man", "Her birthday isn't until the end of the month, so there's plenty of time. Standard should "
                    "be fine."),
            ("Woman", "Then I'll need you to fill in this customs form. Just list the contents and their "
                      "value."),
            ("Man", "Do I have to write the exact price?"),
            ("Woman", "A rough figure is fine. Bring it back to this window when you're done."),
        ],
        "questions": [
            q("Why does the man choose standard delivery?",
              "Express delivery is not available for Portugal.",
              "The package is too heavy for express delivery.",
              "The package does not need to arrive quickly.",
              "He does not have enough money for express delivery.",
              "C", "detail",
              "'Her birthday isn't until the end of the month, so there's plenty of time.' He never says the "
              "price is a problem."),
            q("What does the woman ask the man to do?",
              "Wrap the package more carefully",
              "List the items in the package",
              "Buy a birthday card",
              "Pay forty-five dollars for delivery",
              "B", "detail",
              "'I'll need you to fill in this customs form. Just list the contents and their value.'"),
        ],
    },
    {
        "type": "announcement",
        "setting": "Listen to an announcement at a community center.",
        "voice": "F-AU",
        "script": (
            "Good evening, everyone. Before you go, a quick note about next week. The gym floor is being "
            "repainted, so Wednesday's yoga class can't be held in here. We're moving it upstairs to the dance "
            "studio at the usual time, six thirty. The studio is a bit smaller, so we'll be closer together than "
            "usual. Also, there are no mats up there, so please pick one up from the cupboard by the front desk "
            "on your way. We'll be back in the gym the week after."
        ),
        "questions": [
            q("What is the main purpose of the announcement?",
              "To say that a class will meet in another room",
              "To announce that next week's class is canceled",
              "To introduce a new yoga teacher",
              "To ask people to help paint the gym",
              "A", "purpose",
              "'We're moving it upstairs to the dance studio at the usual time.'"),
            q("What should people do before next week's class?",
              "Arrive fifteen minutes early",
              "Sign up at the front desk",
              "Collect a mat on their way",
              "Bring a mat from home",
              "C", "detail",
              "'There are no mats up there, so please pick one up from the cupboard by the front desk on your "
              "way.'"),
        ],
    },
    {
        "type": "announcement",
        "setting": "Listen to an announcement in a chemistry class.",
        "voice": "M-UK",
        "script": (
            "One more thing before you pack up. Next Tuesday we'll be heating liquids in the lab, so safety "
            "goggles are required for everyone. No goggles, no experiment. I'm serious about that. Regular "
            "glasses don't count, I'm afraid, because they're open at the sides. If you don't own a pair, the "
            "campus bookstore sells them for about eight dollars. We do keep a few spare pairs in the lab, but "
            "only six, and there are thirty of you. So please don't rely on those."
        ),
        "questions": [
            q("What is the professor mainly telling the students?",
              "Where the next lab session will take place",
              "How to heat liquids safely",
              "Why the bookstore has changed its prices",
              "What they must bring to the next lab",
              "D", "main_idea",
              "'Safety goggles are required for everyone. No goggles, no experiment.'"),
            q("Why does the professor mention that there are thirty students?",
              "To explain why the lab will be divided into groups",
              "To show that the spare goggles will not be enough",
              "To complain that the class is too large",
              "To remind students to arrive on time",
              "B", "function",
              "There are 'only six' spare pairs for thirty students: 'So please don't rely on those.'"),
        ],
    },
    {
        "type": "talk",
        "subject": "Psychology",
        "voice": "F-UK",
        "script": (
            "Imagine you have a headache, and I give you a pill. Half an hour later, the pain is gone. Now, what "
            "if I told you that pill was made of sugar? Nothing in it at all. Would you believe me? Well, this "
            "happens all the time, and psychologists call it the placebo effect. A placebo is a treatment with "
            "no active ingredient. What does the work isn't the pill. It's your expectation that you're going to "
            "feel better. And here's the part I find fascinating. The details of the treatment matter. In "
            "experiments, people report more relief from two sugar pills than from one. A placebo they're told "
            "is expensive works better than one they think is cheap. So it's really the meaning we attach to the "
            "treatment that counts. Is it all imagination, then? Not exactly. When people expect pain relief, "
            "their brains actually release natural painkilling chemicals. So the change is real. But let's be "
            "careful here. Placebos mostly affect things we feel, like pain or tiredness. A sugar pill won't "
            "mend a broken bone. And this is exactly why researchers testing a new medicine give one group the "
            "real drug and another group a placebo. Only if the drug beats the placebo can they say it really "
            "works."
        ),
        "questions": [
            q("What is the talk mainly about?",
              "How researchers develop and produce new medicines",
              "How expecting to improve can make people feel better",
              "Why eating too much sugar can affect the brain",
              "Why some patients refuse the treatment they are given",
              "B", "main_idea",
              "The placebo effect: 'What does the work isn't the pill. It's your expectation that you're going "
              "to feel better.'"),
            q("What does the professor say about a placebo that people believe is expensive?",
              "It usually contains some real medicine.",
              "People refuse to take it.",
              "It works only for headaches.",
              "It gives more relief than a cheap one.",
              "D", "detail",
              "'A placebo they're told is expensive works better than one they think is cheap.'"),
            q("Why does the professor mention a broken bone?",
              "To show that placebos have limits",
              "To give an example of pain that placebos remove",
              "To explain how natural painkillers are released",
              "To describe an experiment with two groups",
              "A", "function",
              "'Placebos mostly affect things we feel... A sugar pill won't mend a broken bone.'"),
            q("Why do researchers give a placebo to one group when they test a new medicine?",
              "To save money on the real drug",
              "To prevent the people in the study from feeling any pain",
              "To see whether the drug works better than belief alone",
              "To find out which people are easy to fool",
              "C", "inference",
              "'Only if the drug beats the placebo can they say it really works': the drug must do more than "
              "expectation does."),
        ],
    },
    {
        "type": "talk",
        "subject": "Geography",
        "voice": "M-US",
        "script": (
            "OK, let's start with a little puzzle. In the Sahara, an afternoon can easily reach forty degrees "
            "Celsius. But stay there after dark, and the temperature may fall by twenty degrees or more. On a "
            "winter night, it can even come close to freezing. So where does all that heat go? Any ideas? Well, "
            "the short answer is: straight up. Let me explain. During the day, the "
            "ground soaks up energy from the sun. At night, it gives that energy back as heat, which escapes "
            "upward. Now, in most places, something keeps a lot of that heat from getting away. Water. Water "
            "vapor in the air and clouds overhead absorb the heat and send part of it back down. They work like "
            "a blanket. That's why a cloudy night usually feels milder than a clear one. But desert air is "
            "extremely dry, and the sky is almost always clear. There's no blanket. So the heat just leaks away "
            "into space. And there's a second reason. Sand itself. Sand warms up fast, but only the top layer "
            "gets hot, so it doesn't hold much heat, and it loses it quickly once the sun goes down. Compare "
            "that with a tropical rainforest. The air there is full of moisture, so the nights are only a little "
            "cooler than the days. Same sun, very different nights."
        ),
        "questions": [
            q("What is the main topic of the talk?",
              "How animals survive in the Sahara",
              "Why deserts receive very little rain",
              "Why desert nights are so cold",
              "How clouds form over tropical forests",
              "C", "main_idea",
              "The professor's puzzle is hot afternoons and cold nights in the Sahara: 'So where does all that "
              "heat go?'"),
            q("According to the professor, what do water vapor and clouds do at night?",
              "They return some heat toward the ground.",
              "They cool the air by blocking the sun.",
              "They carry heat from deserts to forests.",
              "They make the ground lose heat faster.",
              "A", "detail",
              "They 'absorb the heat and send part of it back down. They work like a blanket.'"),
            q("What does the professor say about sand?",
              "It reflects most of the sun's energy away.",
              "It stores little heat and cools quickly.",
              "It stays warm long after sunset.",
              "It holds more water than soil does.",
              "B", "detail",
              "'It doesn't hold much heat, and it loses it quickly once the sun goes down.'"),
            q("Why does the professor mention a tropical rainforest?",
              "To describe a place that gets less sunlight than a desert",
              "To explain where desert moisture comes from",
              "To give an example of a place with cold nights",
              "To show what happens at night where the air is moist",
              "D", "function",
              "It is the contrast case: 'The air there is full of moisture, so the nights are only a little "
              "cooler than the days.'"),
        ],
    },
]

LISTENING_LOWER = [
    lcr("F-US", "How much are these pencils?",
        "They're blue ones.",
        "Fifty cents each.",
        "I have two of them at home.",
        "In my bag.",
        "B", "'How much are...?' asks for a price."),
    lcr("M-UK", "Can you close the door, please?",
        "It's very close to here.",
        "The door is brown.",
        "Yes, I closed it yesterday.",
        "Sure, no problem.",
        "D", "A polite request is answered by agreeing to do it."),
    lcr("F-AU", "When does the next train leave?",
        "In about ten minutes.",
        "From platform two.",
        "It goes to the city center.",
        "Yes, I left early.",
        "A", "'When' needs a time. B answers 'where from'."),
    lcr("M-US", "Do you live with your family?",
        "Yes, she is my little sister.",
        "He is ten years old.",
        "No, I live with two friends.",
        "No, I don't have it.",
        "C", "C answers the question about where the person lives."),
    lcr("F-UK", "It's really hot in here today.",
        "Let's turn on the fan.",
        "Yes, I heard it, too.",
        "It's half past two.",
        "I'd like a hot coffee.",
        "A", "The speaker feels hot; A suggests a way to cool the room."),
    lcr("M-AU", "Who is your English teacher this year?",
        "On Mondays and Thursdays.",
        "In Room 9.",
        "I like English a lot.",
        "Mr. Petersen. He's new.",
        "D", "'Who' needs a person. A answers 'when' and B 'where'."),
    lcr("F-US", "Would you like to come to my party on Saturday?",
        "It was a great party.",
        "I'd love to. What time?",
        "Yes, I like Saturdays a lot.",
        "She came last week.",
        "B", "An invitation is accepted with 'I'd love to'."),
    {
        "type": "conversation",
        "setting": "Listen to a conversation between two students.",
        "voices": {"Woman": "F-AU", "Man": "M-UK"},
        "script": [
            ("Woman", "Do you want to see a movie tonight?"),
            ("Man", "Sure. What's on?"),
            ("Woman", "There's a space movie at seven and a comedy at eight."),
            ("Man", "I don't really like space movies. They're too long."),
            ("Woman", "OK. The comedy, then. My sister saw it, and she laughed a lot."),
            ("Man", "Great. How much are the tickets?"),
            ("Woman", "Nine dollars. But on Tuesdays, students pay only six."),
            ("Man", "Good, today is Tuesday! Let's meet at the theater at seven forty-five."),
            ("Woman", "OK. I'll bring my student card. See you there."),
        ],
        "questions": [
            q("Which movie do the students choose?",
              "A space movie",
              "A movie about a sister",
              "A funny movie",
              "A long movie",
              "C", "detail",
              "The man does not like space movies, so the woman says, 'The comedy, then.'"),
            q("How much will each student pay for a ticket tonight?",
              "Six dollars",
              "Seven dollars",
              "Eight dollars",
              "Nine dollars",
              "A", "detail",
              "'On Tuesdays, students pay only six', and 'today is Tuesday'."),
        ],
    },
    {
        "type": "announcement",
        "setting": "Listen to an announcement in a store.",
        "voice": "M-AU",
        "script": (
            "Attention, shoppers. The store will close in fifteen minutes, at nine o'clock. Please finish your "
            "shopping and bring your items to the checkout now. Checkouts one and two are open. The café on the "
            "second floor is already closed. If you have a shopping cart, please leave it by the front doors. We "
            "open again tomorrow at eight in the morning. Thank you for shopping with us, and good night."
        ),
        "questions": [
            q("What is the announcement mainly about?",
              "A new café in the store",
              "A sale on shopping carts",
              "A store that opens late tomorrow",
              "A store that will close soon",
              "D", "main_idea",
              "'The store will close in fifteen minutes.'"),
            q("Where should shoppers leave their carts?",
              "At the checkout",
              "Near the front doors",
              "Upstairs, on the second floor",
              "Outside the café",
              "B", "detail",
              "'If you have a shopping cart, please leave it by the front doors.'"),
        ],
    },
    {
        "type": "announcement",
        "setting": "Listen to an announcement at a school.",
        "voice": "F-UK",
        "script": (
            "Hello, students. The school library is having a book sale this Thursday and Friday. The sale is in "
            "the library, from twelve to two, during lunch. We have many old books, and we need space for new "
            "ones. Every book costs one dollar. Comic books are fifty cents. Please bring coins, because we "
            "cannot take cards. The money will help us buy new computers for the library. Come early for the "
            "best books!"
        ),
        "questions": [
            q("Why is the library selling its old books?",
              "It is closing on Friday.",
              "The books are damaged.",
              "It needs room for new books.",
              "Students do not read them anymore.",
              "C", "detail",
              "'We have many old books, and we need space for new ones.'"),
            q("What will the library do with the money?",
              "Get new computers",
              "Buy more comic books",
              "Pay for lunch",
              "Build a bigger room",
              "A", "detail",
              "'The money will help us buy new computers for the library.'"),
        ],
    },
    {
        "type": "announcement",
        "setting": "Listen to an announcement in a classroom.",
        "voice": "M-US",
        "script": (
            "Good morning, class. Tomorrow is class photo day. The photographer will come at ten o'clock, so "
            "please don't be late for school. We will take the photo outside, in front of the big tree. If it "
            "rains, we will use the gym. Please wear your school shirt, the white one. After the group photo, "
            "the photographer will take a picture of each student. You will get your photos in two weeks."
        ),
        "questions": [
            q("Where will the class photo be taken if the weather is good?",
              "In the classroom",
              "Near a tree outside",
              "In the gym",
              "At the photographer's shop",
              "B", "detail",
              "'We will take the photo outside, in front of the big tree.' The gym is only for rain."),
            q("What should students wear tomorrow?",
              "A sports uniform",
              "Their best clothes and shoes",
              "A white school shirt",
              "A warm jacket",
              "C", "detail",
              "'Please wear your school shirt, the white one.'"),
        ],
    },
]

LISTENING_UPPER = [
    lcr("F-AU", "I'm completely swamped with this grant report.",
        "The swamp is past the river.",
        "They granted it last spring.",
        "Can I take some off your hands?",
        "Yes, I reported it this morning.",
        "C", "'Swamped' means overloaded with work, so the natural reply is an offer of help. A takes the word "
             "literally."),
    lcr("M-US", "You're not seriously thinking of handing it in like that, are you?",
        "Why, what's wrong with it?",
        "Yes, he's a very serious person.",
        "I'll hand you the other one.",
        "No, I rarely think about it.",
        "A", "The question implies criticism of the work; A asks what the problem is."),
    lcr("F-UK", "It looks as though the dean has finally come round to our proposal.",
        "She came round at about six.",
        "I proposed last summer, actually.",
        "I'll look for it in the morning.",
        "About time. It's been months.",
        "D", "'Come round to' means to accept an idea after resisting it; D reacts to that news. A treats it as "
             "a visit."),
    {
        "type": "conversation",
        "setting": "Listen to a conversation between a student and a professor.",
        "voices": {"Woman": "F-US", "Man": "M-AU"},
        "script": [
            ("Woman", "Kofi, have you sent in your abstract for the undergraduate conference? The deadline's on "
                      "Friday."),
            ("Man", "Not yet. To be honest, Professor, I'm having second thoughts. My results are so thin. I "
                    "only finished half the interviews."),
            ("Woman", "Nobody expects a finished study at a student conference. Half of what you'll hear is "
                      "work in progress."),
            ("Man", "I suppose. But what if someone asks a question I can't answer?"),
            ("Woman", "Then you say, 'That's a good point, and I haven't looked into it yet.' I say it myself "
                      "more often than you'd think."),
            ("Man", "Really? Still, standing in front of a room full of strangers..."),
            ("Woman", "Which is exactly why you should do it now, while the stakes are low. Would it help to "
                      "run through your slides with me first?"),
            ("Man", "It would, actually. Could I come by on Wednesday?"),
        ],
        "questions": [
            q("Why does the professor say that she gives the same answer herself?",
              "To admit that she has not read the student's work",
              "To reassure him that not knowing something is normal",
              "To show that she dislikes answering questions",
              "To suggest that his research question is too difficult",
              "B", "function",
              "He fears a question he cannot answer; she replies that even she says 'I haven't looked into it "
              "yet' 'more often than you'd think'."),
            q("What does the professor imply about presenting at the student conference?",
              "It will be judged as strictly as a professional meeting.",
              "It is only for students who have completed their studies.",
              "It matters less than finishing the interviews.",
              "It is a safe place to gain experience.",
              "D", "inference",
              "'Nobody expects a finished study', and he should do it now, 'while the stakes are low'."),
        ],
    },
    {
        "type": "announcement",
        "setting": "Listen to an announcement from a university office.",
        "voice": "M-UK",
        "script": (
            "Good afternoon. This is a message from the Registrar's Office about a change to course "
            "registration. As many of you will recall, last term the system crashed within minutes of opening, "
            "when several thousand students logged in at once. To avoid a repeat, registration will no longer "
            "open to everyone at the same moment. Instead, you will be assigned a time slot according to the "
            "number of credits you have completed, with final-year students going first. Your slot will appear "
            "on your student portal by Monday. Logging in ahead of your slot won't work, I'm afraid, but you may "
            "register at any point after it begins."
        ),
        "questions": [
            q("Why is the university changing the way students register?",
              "The system failed when too many students used it at once.",
              "Final-year students complained that they could not get into classes.",
              "The Registrar's Office has too few employees.",
              "Students were registering for more credits than allowed.",
              "A", "detail",
              "'The system crashed within minutes of opening, when several thousand students logged in at "
              "once. To avoid a repeat...'"),
            q("What can be inferred about a student who has completed few credits?",
              "The student will not be able to register this term.",
              "The student must register in person at the office.",
              "The student will probably get a later time slot.",
              "The student may log in early to save a place.",
              "C", "inference",
              "Slots depend on credits completed, 'with final-year students going first', so fewer credits "
              "means a later slot."),
        ],
    },
    {
        "type": "talk",
        "subject": "Economics",
        "voice": "F-AU",
        "script": (
            "Picture a pasture that belongs to no one and is open to every herder in the village. Each herder "
            "asks a perfectly reasonable question: should I add one more cow? Well, the profit from that cow is "
            "mine alone. The damage it does to the grass, on the other hand, is shared by everybody. So I add "
            "the cow. And so does my neighbor, and hers. Before long, the pasture is bare, and everyone is worse "
            "off. In nineteen sixty-eight, the ecologist Garrett Hardin called this the tragedy of the commons, "
            "and you can see why the label stuck. Swap the pasture for the open ocean, and the cows for fishing "
            "boats, and you have a fair description of overfishing. Notice that nobody in the story is a "
            "villain. Each person acts sensibly, and together they wreck the thing they depend on. Hardin saw "
            "essentially two ways out: divide the resource into private property, or have the government "
            "regulate it. Now, that's where I think he was too gloomy. The political scientist Elinor Ostrom "
            "spent decades studying real communities, Swiss mountain villages sharing pastures, farmers sharing "
            "irrigation water, and she found that many had managed common resources for centuries. They made "
            "their own rules, kept an eye on one another, and punished cheats. So the tragedy is a real risk. It "
            "just isn't destiny."
        ),
        "questions": [
            q("What is the talk mainly about?",
              "How Swiss villages divide their land",
              "Why fishing boats have become larger",
              "How governments decide who should own a resource",
              "Why shared resources risk being overused",
              "D", "main_idea",
              "The pasture story, the overfishing example and Ostrom's findings all concern the tragedy of the "
              "commons."),
            q('Why does the professor say that "nobody in the story is a villain"?',
              "To suggest that the herders did not understand the problem",
              "To stress that the harm comes from reasonable behavior",
              "To defend Hardin against his critics",
              "To show that the story is not based on real events",
              "B", "function",
              "She continues: 'Each person acts sensibly, and together they wreck the thing they depend on.'"),
            q("What is the professor's opinion of Hardin's two solutions?",
              "They leave out a third possibility.",
              "They have been proved to work everywhere.",
              "They are too expensive to try.",
              "They apply only to fishing.",
              "A", "attitude",
              "'That's where I think he was too gloomy': Ostrom showed that communities can manage a resource "
              "themselves."),
            q("According to the professor, what did Elinor Ostrom find?",
              "Private owners protect resources better than villages do.",
              "Most shared pastures disappeared centuries ago.",
              "Some communities look after shared resources themselves.",
              "Government rules are rarely obeyed.",
              "C", "detail",
              "'Many had managed common resources for centuries. They made their own rules, kept an eye on one "
              "another, and punished cheats.'"),
        ],
    },
    {
        "type": "talk",
        "subject": "Marine biology",
        "voice": "M-US",
        "script": (
            "Go down a thousand meters into the ocean, and the last trace of sunlight is gone. You'd expect "
            "total darkness. And yet, if you switch off your submarine's lights, the water around you flickers "
            "and sparkles. That's bioluminescence, light made by living things, and down there it's not the "
            "exception. It's the rule. The chemistry is fairly simple. A molecule called luciferin reacts with "
            "oxygen, with help from an enzyme, and the energy comes out as light instead of heat. What's more "
            "interesting is what the light is for. The anglerfish dangles a glowing lure in front of its mouth, "
            "and you can guess how that ends for a curious little fish. Some shrimp do the opposite. When "
            "attacked, they spit out a glowing cloud and slip away while the predator is dazzled. Then there's "
            "my favorite trick, and for this one we go a little higher, where a faint glow still filters down "
            "from the surface. The hatchetfish has lights along its belly. Odd place for them, isn't it? But "
            "seen from below, a fish is a dark shape against that glow. By lighting its belly to match, the "
            "hatchetfish erases its own shadow. It hides by shining. Most of this light is blue, because blue "
            "travels farthest through seawater. A few dragonfish, though, make red light, which most of their "
            "neighbors can't see at all. In effect, they hunt with a private flashlight."
        ),
        "questions": [
            q("What is the talk mainly about?",
              "How submarines explore the deep ocean",
              "How and why deep-sea animals produce light",
              "Why sunlight cannot reach the deep ocean floor",
              "How anglerfish differ from hatchetfish",
              "B", "main_idea",
              "The professor explains the chemistry of bioluminescence and then 'what the light is for'."),
            q('What does the professor imply when he says "you can guess how that ends for a curious little '
              'fish"?',
              "The small fish is eaten.",
              "The small fish learns to avoid light.",
              "The small fish steals the lure.",
              "The small fish begins to glow.",
              "A", "inference",
              "The glowing lure hangs 'in front of its mouth', so a fish that comes to look becomes a meal."),
            q("Why does the hatchetfish have lights on its belly?",
              "To attract smaller fish swimming below it",
              "To warn other hatchetfish of danger",
              "To hide its outline from animals below",
              "To find its way in total darkness",
              "C", "detail",
              "'By lighting its belly to match, the hatchetfish erases its own shadow. It hides by shining.'"),
            q("Why does the professor call the dragonfish's red light \"a private flashlight\"?",
              "Because red light travels farther than blue light",
              "Because dragonfish live alone",
              "Because the light is too weak to be useful",
              "Because most other animals cannot see it",
              "D", "function",
              "The red light is something 'most of their neighbors can't see at all', so only the dragonfish "
              "benefits from it."),
        ],
    },
]

# ===============================================================================================================
# WRITING
# ===============================================================================================================
WRITING = {
    "build": [
        build("Do you want to get lunch at the new noodle place?",
              "Sorry, my class does not end until one o'clock.",
              ["my class", "does", "not", "end", "until", "one o'clock"], "negation", prefix="Sorry,"),
        build("I just came back from the bookstore.",
              "Did they have the book that you needed?",
              ["did", "they", "have", "the book", "that", "you needed"], "yes_no_question"),
        build("I finally found an apartment near the university.",
              "How long does it take to walk to campus?",
              ["how long", "does", "it", "take", "to walk", "to campus"], "wh_question"),
        build("Did you enjoy the new science fiction movie?",
              "It was not as exciting as the book.",
              ["it was", "not as", "exciting", "as", "the book"], "comparison"),
        build("The heater in the seminar room is broken again.",
              "Should we ask the technician to bring a new one?",
              ["should", "we", "ask", "the technician", "to bring", "a new one"], "infinitive"),
        build("Why is the main entrance to the science building blocked?",
              "A new glass door is being installed today.",
              ["a new", "glass door", "is", "being", "installed"], "passive",
              suffix="today", extra="are"),
        build("Professor Ivanova's seminar sounds really interesting.",
              "Have you ever taken a course with her before?",
              ["have", "you ever", "taken", "a course", "with her"], "perfect",
              suffix="before", extra="took"),
        build("What are you working on this afternoon?",
              "I am reading the article that the professor mentioned yesterday.",
              ["I am", "reading", "the article", "that", "the professor", "mentioned yesterday"],
              "relative_clause"),
        build("I heard the campus gym is changing its opening hours.",
              "Did they say what time the gym will close on weekends?",
              ["what time", "the gym", "will", "close on weekends"], "embedded_question",
              prefix="Did they say"),
        build("The scholarship applications closed last Friday.",
              "If I had known about the deadline, I would have applied earlier.",
              ["I had known", "about", "the deadline", "I would", "have", "applied earlier"], "conditional",
              prefix="If"),
    ],
    "email": {
        "scenario": (
            "You want to apply for a six-week summer program in science journalism at another university. The "
            "application requires a recommendation letter from a professor, and the deadline is only ten days "
            "away. Last semester you took Professor Haddad's news writing course and received a high grade on "
            "your final article. You decide to write to Professor Haddad to ask for a letter."
        ),
        "to": "Professor Haddad",
        "subject": "Request for a recommendation letter",
        "bullets": [
            "Explain why you want to attend the program.",
            "Describe the work you did in Professor Haddad's course.",
            "Ask for the letter and say when it is needed.",
        ],
        "model": """
Dear Professor Haddad,

I hope you are well. I am writing to ask whether you would be willing to write a recommendation letter for me.

I am applying to the Summer Program in Science Journalism at Northgate University. I hope to become a science reporter, and the program would let me practice interviewing researchers and writing for a real student magazine.

I took your News Writing course last semester. For my final project, I wrote an article about water quality in the campus lake, and you kindly said that it was clear and carefully researched. I learned a great deal from your comments on my drafts.

I am sorry for the short notice, but the letter must be uploaded by March 20, which is ten days from now. I have attached my résumé and the program description. Please let me know if you need anything else.

Thank you very much for considering my request.

Sincerely,
Linh Tran
""".strip(),
    },
    "discussion": {
        "course": "environmental studies",
        "professor": {
            "name": "Dr. Marchetti",
            "post": (
                "This week we are looking at policies designed to reduce plastic waste. Many governments have "
                "targeted single-use plastic bags, but they have chosen different tools. Some, such as Kenya "
                "and Rwanda, have banned the bags completely. Others, such as Ireland, require stores to charge "
                "customers a small fee for each bag. Both approaches aim to change shoppers' habits. Which do "
                "you think is the better policy: banning single-use plastic bags or charging a fee for them? "
                "Why?"
            ),
        },
        "students": [
            {
                "name": "Yusuf",
                "post": (
                    "I think a ban is better because it is simple and it works immediately. When a fee is "
                    "small, many shoppers just pay it and keep using plastic bags, especially people with "
                    "higher incomes. A ban treats everyone the same way. After a few weeks, bringing a reusable "
                    "bag becomes a normal habit, just like bringing a wallet."
                ),
            },
            {
                "name": "Greta",
                "post": (
                    "I prefer a fee. A ban removes people's choice, and sometimes a plastic bag is really "
                    "necessary, for example when you buy fresh fish or forget your own bag. A fee still makes "
                    "people think twice, and the money collected can pay for recycling programs or beach "
                    "cleanups. A ban produces no money at all for the environment."
                ),
            },
        ],
        "model": (
            "I believe that charging a fee is the better policy, as long as the fee is high enough to matter. "
            "Yusuf is right that a very small charge is easy to ignore, but that is an argument for raising the "
            "price, not for a ban. Greta mentions that the money can support recycling, and I would add another "
            "advantage: a fee is much easier to enforce. When bags are banned completely, some shops keep "
            "handing them out secretly, and inspectors must visit every market to stop them. With a fee, stores "
            "simply record each bag at the cash register, so the rule is followed almost automatically. "
            "Finally, a fee can be adjusted. If people are still using too many bags after a year, the "
            "government can increase the charge step by step until the habit really changes."
        ),
    },
}

# ===============================================================================================================
# SPEAKING
# ===============================================================================================================
SPEAKING = {
    "repeat": {
        "scenario": (
            "You are learning how to show new members around a fitness center. Listen to your manager and "
            "repeat what he says. Repeat only once."
        ),
        "picture": "A fitness center lobby with a reception desk, treadmills behind a glass wall and a pool "
                   "entrance on the left.",
        "voice": "M-AU",
        "sentences": [
            "The changing rooms are down the hall.",
            "Every member gets a free towel.",
            "The swimming pool is open from six in the morning until nine.",
            "You can book a fitness class online or on our phone app.",
            "Please wipe down each machine after you finish using it.",
            "If you'd like a personal training session, you can sign up with any of our coaches.",
            "Before you leave today, I'll show you how the lockers work so that you can store your things safely.",
        ],
    },
    "interview": {
        "topic": "travel and vacations",
        "scenario": (
            "You have agreed to take part in a research study about travel and vacations. You will have a short "
            "online interview with a researcher. The researcher will ask you some questions."
        ),
        "voice": "F-UK",
        "questions": [
            {
                "kind": "event",
                "q": (
                    "Thank you for taking part in this study. Let's start with your own experience. Please "
                    "tell me about a trip you took that you remember well. Where did you go, and what made it "
                    "memorable?"
                ),
                "model": (
                    "A trip I remember very well is a visit to my grandparents' village two summers ago. I "
                    "went with my cousin, and we traveled by train for almost nine hours. The village is in "
                    "the mountains, so the air was cool and clean, which was a big change from the city. What "
                    "made the trip memorable was how simple each day was. We helped my grandfather pick apples "
                    "in the morning, swam in the river in the afternoon, and listened to his stories at night. "
                    "There was almost no phone signal, so nobody looked at a screen. I came home feeling "
                    "completely rested."
                ),
            },
            {
                "kind": "life",
                "q": (
                    "Some people like to plan every detail of a vacation in advance, while others prefer to "
                    "decide what to do after they arrive. Which kind of traveler are you, and why?"
                ),
                "model": (
                    "I am definitely a planner, although I leave a little free time. Before a trip, I book my "
                    "transportation and my accommodation, and I make a short list of places I really want to "
                    "see. The main reason is money. Tickets and rooms are usually cheaper when you reserve "
                    "them early, and as a student I have to be careful with my budget. Planning also saves "
                    "time, because I don't spend half a morning deciding where to go. However, I never fill "
                    "the whole schedule. I always keep one afternoon open, since the best moments often happen "
                    "when you simply walk around without a plan."
                ),
            },
            {
                "kind": "opinion",
                "q": (
                    "Now I'd like to ask for your opinion. Some people say that you learn more by traveling to "
                    "another country than by reading or watching videos about it. Do you agree or disagree? "
                    "Why?"
                ),
                "model": (
                    "I mostly agree. Books and videos can give you facts, but they are chosen and edited by "
                    "someone else, so you only see what that person wants to show. When you travel, you notice "
                    "small things that nobody films, such as how people wait in line, how loudly they speak, "
                    "or what they eat for breakfast. You also have to solve real problems, like buying a "
                    "ticket in another language, and that teaches you a lot. On the other hand, a short trip "
                    "can give a false picture, because tourists usually see only the most famous places. So I "
                    "think travel teaches more, but only if you stay long enough and talk to local people."
                ),
            },
            {
                "kind": "opinion",
                "q": (
                    "Here is my final question. Popular tourist destinations sometimes become so crowded that "
                    "daily life gets harder for the people who live there. Do you think cities should limit "
                    "the number of tourists who can visit? Why or why not?"
                ),
                "model": (
                    "Yes, I think cities should be able to limit tourist numbers when it is really necessary. "
                    "In very popular places, residents face higher rents, crowded buses, and noise late at "
                    "night, and some of them finally move away. If that continues, the city loses the local "
                    "life that made it attractive in the first place. However, I would not close the city to "
                    "visitors. A better method is to control the busiest places and times, for example by "
                    "selling a fixed number of tickets for a famous square or museum each day. Cities can also "
                    "encourage people to come in the quiet season. In this way, tourism still supports local "
                    "jobs without making life unpleasant for residents."
                ),
            },
        ],
    },
}

FORM = {
    "number": 4,
    "theme": "Borrowed words and distant planets; placebos, cold desert nights, shared pastures, living light",
    "reading": {"router": READING_ROUTER, "lower": READING_LOWER, "upper": READING_UPPER},
    "listening": {"router": LISTENING_ROUTER, "lower": LISTENING_LOWER, "upper": LISTENING_UPPER},
    "writing": WRITING,
    "speaking": SPEAKING,
}
