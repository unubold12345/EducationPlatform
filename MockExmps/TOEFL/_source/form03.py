"""TOEFL iBT practice test 03. Same structure as form01.py; content follows the Form 03 row of AUTHORING.md."""

from common import build, lcr, q

# ===============================================================================================================
# READING
# ===============================================================================================================
READING_ROUTER = [
    {
        "type": "complete_words",
        "subject": "Geology",
        "text": (
            "Plate tectonics is the theory that Earth's outer shell is broken into large pieces called plates. "
            "These pla[tes] move ve[ry] slowly, usu[ally] by on[ly] a f[ew] centimeters ea[ch] year. "
            "Most earthquakes a[nd] volcanic erup[tions] happen al[ong] the bound[aries] between plates. "
            "When two plates collide, the land can be pushed upward to form mountain ranges such as the "
            "Himalayas. "
            "The theory also explains why the continents have changed position over millions of years."
        ),
    },
    {
        "type": "complete_words",
        "subject": "Psychology",
        "text": (
            "Human memory is the ability to keep information and use it at a later time. "
            "Psychologists bel[ieve] that mem[ory] works i[n] three sta[ges]. "
            "First, the br[ain] receives n[ew] information thr[ough] the sen[ses], such a[s] sight a[nd] "
            "hearing. "
            "Next, it stores this information, sometimes for a few seconds and sometimes for a lifetime. "
            "Finally, the stored information is recalled when a person needs it, for example during an exam."
        ),
    },
    {
        "type": "daily_life",
        "format": "menu",
        "heading": "Read a café menu board.",
        "text": """
THE COPPER KETTLE CAFÉ
Today's Menu: Thursday

Soup of the day (tomato and basil): $4.50
Grilled cheese sandwich: $6.00
Chicken wrap with salad: $7.50
Vegetable pasta: $8.00

LUNCH DEAL, 11:30 a.m. to 2:00 p.m.
Any sandwich or wrap with a cup of soup for $9.00

All hot drinks are half price after 3:00 p.m.
Sorry, we have no blueberry muffins today.
""".strip(),
        "questions": [
            q("How much will a customer pay for a chicken wrap and a cup of soup at 12:30 p.m.?",
              "$7.50",
              "$8.00",
              "$9.00",
              "$12.00",
              "C", "detail",
              "At 12:30 the lunch deal applies: 'Any sandwich or wrap with a cup of soup for $9.00'. $12.00 is "
              "the two prices added together."),
            q("What can be inferred about the café today?",
              "One of its usual items is not for sale.",
              "It will stop serving food at 3:00 p.m.",
              "Every dish on the menu contains cheese.",
              "Its drinks cost more in the afternoon.",
              "A", "inference",
              "'Sorry, we have no blueberry muffins today' shows that muffins are normally sold. Drinks are "
              "cheaper, not dearer, after 3:00."),
        ],
    },
    {
        "type": "daily_life",
        "format": "email",
        "heading": "Read an email.",
        "text": """
To: Students in HIST 214
From: Farida Rahimi, History Department Office
Subject: Change to Dr. Castellano's office hours

Dear students,

Dr. Castellano will be attending a conference from Tuesday to Thursday next week, so his regular office hours on Wednesday afternoon are canceled for that week only. To make up for this, he will hold extra office hours on Monday, October 13, from 10:00 a.m. to 12:00 p.m. in his usual office, Room 318.

If you cannot come on Monday, you may book a fifteen-minute video meeting for Friday using the sign-up sheet on the course website. Please do not email Dr. Castellano to arrange a time, since he will have limited internet access while he is away. Regular office hours will start again the following Wednesday.

Best regards,
Farida Rahimi
Department Assistant
""".strip(),
        "questions": [
            q("Why did Ms. Rahimi send the email?",
              "To invite students to attend a history conference next week",
              "To explain a one-week change to a professor's office hours",
              "To announce that a class has been moved to Room 318",
              "To remind students to register on the course website",
              "B", "purpose",
              "The Wednesday office hours 'are canceled for that week only', and the email gives the "
              "replacement times."),
            q("According to the email, how can students arrange to talk to Dr. Castellano on Friday?",
              "By sending him an email",
              "By calling the History Department Office",
              "By going to his office in Room 318",
              "By signing up on the course website",
              "D", "detail",
              "'You may book a fifteen-minute video meeting for Friday using the sign-up sheet on the course "
              "website.' Students are told not to email him."),
            q("Which of the following is NOT mentioned in the email?",
              "The city where the conference will take place",
              "The room where the extra office hours will be held",
              "The length of each video meeting",
              "The reason Dr. Castellano should not be emailed",
              "A", "negative",
              "The email gives the room (318), the meeting length (fifteen minutes) and the reason (limited "
              "internet access), but never says where the conference is."),
        ],
    },
    {
        "type": "daily_life",
        "format": "social_post",
        "heading": "Read a post in a neighborhood group.",
        "text": """
Maple Street Neighbors
Posted by Tomás R., 40 minutes ago

MISSING CAT: Our cat Pepper got out through an open window last night. He is small and black with one white front paw, and he is wearing a red collar. He is friendly but easily frightened, so please don't run after him. If you see him near Maple Street or Linden Park, call me at 555-0142. Thank you!
""".strip(),
        "questions": [
            q("What does Tomás ask his neighbors to do?",
              "Keep their windows closed at night",
              "Take the cat to Linden Park",
              "Catch the cat as fast as they can",
              "Phone him if they see the cat",
              "D", "detail",
              "'If you see him near Maple Street or Linden Park, call me at 555-0142.' He asks people not to "
              "run after the cat."),
            q("What can be inferred about Pepper?",
              "He has lived outside for many years.",
              "He might run off if someone chases him.",
              "He lost his red collar last night.",
              "He is unfriendly to people he doesn't know.",
              "B", "inference",
              "He is 'easily frightened, so please don't run after him': chasing him would scare him away."),
        ],
    },
    {
        "type": "daily_life",
        "format": "advertisement",
        "heading": "Read an advertisement.",
        "text": """
FOR RENT: BRIGHT ONE-BEDROOM APARTMENT
48 Alder Lane, second floor

- $850 per month. Water and heating are included; the tenant pays for electricity and internet.
- Available from August 1. Minimum lease: twelve months.
- Five-minute walk to the Route 6 bus stop, then fifteen minutes by bus to the university.
- New refrigerator and stove. Shared washing machines in the basement (coins needed).
- Small balcony facing the garden.
- No smoking. Cats are welcome, but sorry, no dogs.

A deposit equal to one month's rent is due when you sign the lease.

Viewings: Saturdays, 10:00 a.m. to 1:00 p.m., by appointment only.
Contact Ms. Ilves at 555-0178 or ilves.rentals@aldermail.example.
""".strip(),
        "questions": [
            q("Which cost is included in the monthly rent?",
              "Electricity",
              "Internet service",
              "Heating",
              "Use of the washing machines",
              "C", "detail",
              "'Water and heating are included; the tenant pays for electricity and internet.' The washing "
              "machines need coins."),
            q("Who would probably NOT be able to rent this apartment?",
              "A student who needs a home for six months",
              "A person who owns a cat",
              "Someone who takes the bus to the university",
              "A person who wants to move in during August",
              "A", "inference",
              "'Minimum lease: twelve months' rules out a six-month stay. Cats are welcome, a bus stop is "
              "nearby, and the apartment is free from August 1."),
            q("What must a person do in order to see the apartment?",
              "Pay a deposit of $850",
              "Visit on a weekday morning",
              "Sign a twelve-month lease",
              "Arrange a time in advance",
              "D", "detail",
              "Viewings are on Saturdays 'by appointment only'. The deposit is due only when the lease is "
              "signed."),
        ],
    },
    {
        "type": "academic",
        "subject": "Psychology",
        "title": "Why We Put Things Off",
        "paragraphs": [
            "Almost everyone has delayed an important task, such as studying for an exam, even when they knew "
            "the delay would cause trouble later. This habit is called procrastination. It is often blamed on "
            "laziness or poor time management, but many psychologists now believe that the real cause lies "
            "elsewhere.",
            "According to this view, procrastination is mainly a way of managing emotions. A difficult task can "
            "produce unpleasant feelings, including boredom, anxiety, and doubt about one's own ability. Turning "
            "to something more enjoyable, like watching videos, brings immediate relief. The human mind also "
            "tends to value rewards that come now more than rewards that come later, so the comfort of the "
            "present moment easily outweighs a distant deadline. The relief is temporary, however, and the "
            "unfinished work usually returns with added stress and guilt.",
            "Understanding this cycle suggests practical remedies. Dividing a large project into small steps "
            "makes the first step less frightening, and removing distractions, for example by switching off a "
            "phone, reduces temptation. Surprisingly, being kind to oneself also seems to help. In one study, "
            "students who forgave themselves for delaying their preparation for an exam procrastinated less "
            "before the next one. Harsh self-criticism, by contrast, tends to increase the negative feelings "
            "that led to the delay in the first place.",
        ],
        "questions": [
            q("What is the passage mainly about?",
              "Methods that teachers use to help students meet their deadlines",
              "The emotional roots of delaying tasks and ways to reduce it",
              "Reasons that time management skills are declining among students",
              "The harmful effects of stress and guilt on exam results",
              "B", "main_idea",
              "Paragraph 2 explains procrastination as 'a way of managing emotions'; paragraph 3 gives "
              "'practical remedies'."),
            q("According to the passage, why do people turn to enjoyable activities instead of a difficult task?",
              "They have forgotten when the task is due.",
              "They believe the task is not really important.",
              "They want quick relief from unpleasant feelings.",
              "They produce better work when a deadline is close.",
              "C", "factual",
              "A difficult task produces 'unpleasant feelings', and turning to something enjoyable 'brings "
              "immediate relief'."),
            q('The word "remedies" in the passage is closest in meaning to',
              "solutions", "warnings", "questions", "experiments",
              "A", "vocabulary",
              "A remedy is a cure or solution; the paragraph goes on to list ways of dealing with the problem."),
            q("Which of the following is NOT mentioned as a way to reduce procrastination?",
              "Breaking a project into smaller parts",
              "Turning off a phone",
              "Forgiving oneself for earlier delays",
              "Promising oneself a reward",
              "D", "negative_factual",
              "Paragraph 3 mentions small steps, switching off a phone and self-forgiveness. Rewards appear "
              "only in paragraph 2, as part of the cause."),
            q("What can be inferred about students who criticize themselves severely for procrastinating?",
              "They usually begin their work earlier the next time.",
              "They are likely to go on delaying their work.",
              "They forget deadlines more often than other students.",
              "They feel less anxious when exams come.",
              "B", "inference",
              "'Harsh self-criticism... tends to increase the negative feelings that led to the delay in the "
              "first place', so the delay is likely to continue."),
        ],
    },
]

READING_LOWER = [
    {
        "type": "complete_words",
        "subject": "History",
        "text": (
            "The printing press is a machine that changed the way books were made in Europe. "
            "Before i[t] was inve[nted], people cop[ied] every bo[ok] by ha[nd], so bo[oks] were ra[re] and "
            "expe[nsive]. "
            "In the 1400s, Johannes Gutenberg bu[ilt] a pr[ess] with small metal letters that could be used "
            "again. "
            "Printers could now make many copies of a page in a short time. "
            "As books became cheaper, more people learned to read, and new ideas traveled faster."
        ),
    },
    {
        "type": "daily_life",
        "format": "receipt",
        "heading": "Read a receipt.",
        "text": """
BRIGHTWAY HOME STORE
212 Harbor Road
March 14, 2:35 p.m.

Desk lamp: $18.00
Bath towels (2): $12.00
Coffee mug: $5.00
TOTAL: $35.00
Paid by card

RETURNS: Bring this receipt within 30 days to get your money back. Without a receipt, we can only give store credit. Sale items cannot be returned.

Thank you for shopping with us!
""".strip(),
        "questions": [
            q("What did the customer buy two of?",
              "Desk lamps",
              "Bath towels",
              "Coffee mugs",
              "Store cards",
              "B", "detail",
              "The receipt shows 'Bath towels (2)'. There is one lamp and one mug."),
            q("What happens if a customer returns an item without the receipt?",
              "The customer gets the money back.",
              "The customer must pay a fee.",
              "The store will not accept the item.",
              "The customer receives store credit.",
              "D", "detail",
              "'Without a receipt, we can only give store credit.' Money is returned only with the receipt."),
        ],
    },
    {
        "type": "daily_life",
        "format": "memo",
        "heading": "Read a memo.",
        "text": """
MEMO

To: All employees
From: Grace Mbeki, Office Manager
Date: May 5
Subject: New parking rules

Starting Monday, May 12, the parking lot behind our building will have new rules.

1. Every car must show a parking card in the front window. You can pick up your card at the front desk this week. It is free.
2. The six spaces near the back door are for visitors only. Please do not park there.
3. The lot will be locked at 8:00 p.m. every evening. If you plan to work late, park on Mill Street instead.

Cars without a card may be removed, and the owner will have to pay $60 to get the car back.

Thank you for your help.
""".strip(),
        "questions": [
            q("What should employees who drive to work do this week?",
              "Get a parking card from the front desk",
              "Pay a fee for a parking space",
              "Start parking their cars on Mill Street",
              "Tell the manager when they work late",
              "A", "detail",
              "'You can pick up your card at the front desk this week. It is free.'"),
            q("Who may use the spaces near the back door?",
              "Employees who work late",
              "The office manager",
              "People visiting the company",
              "Employees with a parking card",
              "C", "detail",
              "'The six spaces near the back door are for visitors only.'"),
            q("Why might an employee park on Mill Street?",
              "The parking lot is full of visitors' cars.",
              "The employee will leave after 8:00 p.m.",
              "The employee has lost a parking card.",
              "Parking on that street costs less.",
              "B", "inference",
              "The lot is locked at 8:00 p.m.: 'If you plan to work late, park on Mill Street instead.'"),
        ],
    },
]

READING_UPPER = [
    {
        "type": "complete_words",
        "subject": "Sociology",
        "text": (
            "Urbanization is the process by which a growing share of a country's population comes to live in "
            "cities. "
            "It typi[cally] occurs wh[en] people le[ave] rural ar[eas] in sea[rch] of emplo[yment] and "
            "educ[ation]. "
            "Although cities of[fer] greater opport[unities], rapid gro[wth] frequently creates overcrowded "
            "housing and heavy traffic. "
            "Governments must therefore plan carefully for water, transport, and schools. "
            "Today, more than half of the world's people live in urban areas, and the proportion is still rising."
        ),
    },
    {
        "type": "academic",
        "subject": "Environmental science",
        "title": "Reading the Rings",
        "paragraphs": [
            "In regions with distinct seasons, a tree adds a new layer of wood beneath its bark every year. "
            "Rapid growth in spring produces pale wood, while slower growth late in the summer leaves a thin, "
            "dark band. Together, the two form one annual ring, so counting the rings of a trunk reveals the "
            "tree's age. The rings record far more than age, however.",
            "Because trees grow more in favorable years, a wide ring generally indicates plentiful rain and a "
            "narrow one drought or cold. Trees throughout a region therefore share a similar sequence of wide "
            "and narrow rings. By matching the pattern in a living tree with the overlapping pattern in older "
            "wood, such as beams from historic buildings, researchers can extend the record back thousands of "
            "years. This technique has allowed archaeologists to date ancient wooden structures to the very "
            "year their timber was cut, and it has given climate scientists a year-by-year account of past "
            "droughts.",
            "The method is not without shortcomings. Many tropical trees, which grow throughout the year, form "
            "no clear annual rings. Moreover, a narrow ring is ambiguous: it may reflect a dry year, but an "
            "insect attack or the shade of a taller neighbor can stunt growth as well. For this reason, "
            "scientists avoid drawing conclusions from a single tree and compare samples from many trees "
            "instead.",
        ],
        "questions": [
            q("What is the passage mainly about?",
              "How certain trees manage to survive long periods of drought",
              "Why trees in tropical regions grow faster than those elsewhere",
              "How the rings in wood supply information about the past",
              "Which methods archaeologists use to preserve very old timber",
              "C", "main_idea",
              "The passage explains how rings form, what they record ('far more than age') and the limits of "
              "the method."),
            q("According to the passage, what makes it possible to extend the tree-ring record beyond the life "
              "of a living tree?",
              "Patterns in older wood overlap with those in living trees.",
              "Tropical trees live much longer than trees in other regions.",
              "The dark bands in very old wood are easier to count.",
              "Historic buildings contain written records of past weather.",
              "A", "factual",
              "'By matching the pattern in a living tree with the overlapping pattern in older wood... "
              "researchers can extend the record back thousands of years.'"),
            q('The word "ambiguous" in the passage is closest in meaning to',
              "rare", "damaged", "misplaced", "unclear",
              "D", "vocabulary",
              "Something ambiguous can be understood in more than one way; a narrow ring may have several "
              "causes."),
            q("What can be inferred about a tree that shows one very narrow ring?",
              "It was growing in a tropical region.",
              "That tree alone cannot reveal the cause.",
              "It was cut down during that year.",
              "It must have lived through a severe drought.",
              "B", "inference",
              "A narrow ring may mean a dry year, insects or shade, so scientists 'avoid drawing conclusions "
              "from a single tree'."),
            q("Why does the author mention beams from historic buildings?",
              "To show that old buildings were stronger than modern ones",
              "To explain why narrow rings are common in old wood",
              "To give an example of older wood that researchers use",
              "To argue that historic buildings deserve better protection",
              "C", "purpose",
              "The beams follow 'such as': they are an example of the 'older wood' whose pattern is matched "
              "with living trees."),
        ],
    },
]

# ===============================================================================================================
# LISTENING
# ===============================================================================================================
LISTENING_ROUTER = [
    lcr("M-US", "Where did you park your bike this morning?",
        "About ten minutes ago.",
        "I usually walk in the park.",
        "Behind the science lab.",
        "It's a blue one.",
        "C", "'Where' needs a place. B only repeats the word 'park'; A answers 'when'."),
    lcr("F-UK", "Have you handed in your history essay yet?",
        "Not yet. It's almost done.",
        "Yes, he handed it to me.",
        "It's about trade in ancient Egypt.",
        "By hand, with a blue pen.",
        "A", "A answers the yes/no question and adds how far the essay is. C answers 'what about'."),
    lcr("M-AU", "Would you mind keeping your voice down in here?",
        "It's down the hall, second door on the left.",
        "I've kept all of my old notes.",
        "No, I've never heard her sing.",
        "Sorry. I didn't realize I was so loud.",
        "D", "A request to speak quietly is met with an apology. A and B reuse 'down' and 'keep'."),
    lcr("F-US", "How often does the shuttle to the train station run?",
        "It takes about half an hour by road.",
        "Every twenty minutes, I think.",
        "By bus, most of the time.",
        "I ran there this morning.",
        "B", "'How often' asks for frequency. A answers 'how long' and C answers 'how'."),
    lcr("M-UK", "I think I left my umbrella in the lecture hall.",
        "Let's go back and look for it.",
        "Yes, the lecture was really long.",
        "I'd rather sit on the left.",
        "It hasn't rained much this month.",
        "A", "The helpful reaction to a forgotten item is to offer to go back for it."),
    lcr("F-AU", "What did you think of the guest speaker?",
        "I think she's speaking at four o'clock.",
        "About two hundred guests.",
        "Honestly, I expected a bit more.",
        "Yes, I thought about it.",
        "C", "The question asks for an opinion. C gives one indirectly: the speaker was disappointing."),
    lcr("M-US", "Would you like me to save you a seat at the front?",
        "I saved the file on my laptop.",
        "Please do. I might be a little late.",
        "The front door is usually locked at night.",
        "No, I haven't seen it anywhere.",
        "B", "An offer is accepted with 'Please do'. A takes 'save' in its computer sense."),
    lcr("F-UK", "Isn't the chemistry lab closed on Fridays?",
        "Yes, I closed the window.",
        "I'd like some fries with that, please.",
        "It's close to the library.",
        "Only in the afternoon, I think.",
        "D", "D corrects the speaker's belief: the lab is closed for only part of the day."),
    lcr("M-AU", "Do you know who's teaching the drawing class next term?",
        "I heard it's Mr. Banerjee again.",
        "She's drawing a picture of the lake.",
        "Next term starts in January.",
        "I've been teaching for two years.",
        "A", "'Who' needs a person. Only A names the teacher."),
    lcr("F-US", "This coffee machine just took my money and gave me nothing.",
        "I'll take mine with milk, thanks.",
        "It's two dollars a cup.",
        "No, I gave it back to you.",
        "Tell the front desk about it.",
        "D", "The speaker is complaining about a broken machine; D suggests what to do about it."),
    lcr("M-UK", "How come you weren't at practice yesterday?",
        "I usually come here by bus.",
        "It was held at the gym at six.",
        "I had a dentist appointment.",
        "Yes, I try to practice every day.",
        "C", "'How come' means 'why'. Only C gives a reason."),
    lcr("F-AU", "Should I bring anything to the study session tonight?",
        "It's in room twelve tonight.",
        "Just your notes from last week.",
        "Yes, I brought it back.",
        "The session lasted two whole hours.",
        "B", "B says what to bring. A answers 'where' and C is in the wrong tense."),
    {
        "type": "conversation",
        "setting": "Listen to a conversation between a student and an employee at a campus print center.",
        "voices": {"Man": "M-AU", "Woman": "F-US"},
        "script": [
            ("Man", "Hi. I'm here to pick up a poster. I sent the file on Monday. The name's Emre Kaya."),
            ("Woman", "Kaya... here it is. Oh. It looks like it was printed in the small size, not the large one "
                      "you ordered."),
            ("Man", "Oh no. My presentation is at two o'clock this afternoon."),
            ("Woman", "Don't worry. The large printer's free right now, so I can print it again. It takes about "
                      "forty minutes."),
            ("Man", "Will I have to pay again?"),
            ("Woman", "No, of course not. It was our mistake. Do you want to wait here?"),
            ("Man", "I've got a class now. I'll come back at noon."),
            ("Woman", "That's fine. It'll be rolled up and waiting at this desk."),
        ],
        "questions": [
            q("What is the problem with the man's poster?",
              "It has not been printed yet.",
              "It was printed in the wrong size.",
              "The colors are different from his file.",
              "It was given to another student.",
              "B", "detail",
              "'It was printed in the small size, not the large one you ordered.'"),
            q("What will the man probably do next?",
              "Wait at the print center",
              "Pay for a second poster",
              "Give his presentation",
              "Attend one of his classes",
              "D", "prediction",
              "'I've got a class now. I'll come back at noon.' The presentation is not until two o'clock."),
        ],
    },
    {
        "type": "conversation",
        "setting": "Listen to a conversation between two friends.",
        "voices": {"Man": "M-UK", "Woman": "F-AU"},
        "script": [
            ("Man", "So, what should we make for the dinner on Friday? Everyone's bringing something."),
            ("Woman", "I was thinking of my chicken curry. People always like it."),
            ("Man", "Hmm, but Jonas and Mei don't eat meat, remember?"),
            ("Woman", "Oh, right. I forgot. What about a vegetable curry, then? With chickpeas."),
            ("Man", "That works. And I could make rice to go with it."),
            ("Woman", "Perfect. But we don't have a pot that's big enough for eight people."),
            ("Man", "My neighbor has a huge one. I'll ask her tonight."),
            ("Woman", "Great. Then I'll go shopping for the vegetables tomorrow morning."),
        ],
        "questions": [
            q("Why do the speakers decide not to make chicken curry?",
              "It takes too long to cook.",
              "They made it for the last dinner.",
              "Some of the guests do not eat meat.",
              "Chicken is too expensive this week.",
              "C", "detail",
              "'Jonas and Mei don't eat meat, remember?' The woman then suggests a vegetable curry."),
            q("What will the man do tonight?",
              "Ask to borrow a large pot",
              "Buy vegetables at the market",
              "Cook rice for eight people",
              "Invite his neighbor to the dinner",
              "A", "prediction",
              "'My neighbor has a huge one. I'll ask her tonight.' The woman, not the man, will shop for "
              "vegetables."),
        ],
    },
    {
        "type": "conversation",
        "setting": "Listen to a conversation between a student and a professor.",
        "voices": {"Woman": "F-UK", "Man": "M-US"},
        "script": [
            ("Woman", "Professor Voss, do you have a minute? I wanted to ask about your seminar on city "
                      "planning."),
            ("Man", "Of course. Though I should tell you, it's been full since the first day of registration."),
            ("Woman", "I know. I'm on the waiting list. But I need it to graduate in the spring."),
            ("Man", "I see. The trouble is, the room only seats fifteen, so I can't simply add a chair."),
            ("Woman", "Is there any chance someone will drop it?"),
            ("Man", "It happens. Usually one or two students leave after the first week. Come to the first "
                    "meeting on Monday anyway."),
            ("Woman", "So I should just show up?"),
            ("Man", "Yes. If a seat opens up, I'll give it to whoever's there. And final-year students come "
                    "first."),
        ],
        "questions": [
            q("Why can the professor not add the woman to the seminar right away?",
              "She has not taken the required courses.",
              "She missed the registration deadline.",
              "The seminar is only for first-year students.",
              "The classroom has a limited number of seats.",
              "D", "detail",
              "'The room only seats fifteen, so I can't simply add a chair.'"),
            q("What does the professor imply about the woman's chances?",
              "She is certain to get a place on Monday.",
              "Her final-year status will work in her favor.",
              "She ought to wait and take the seminar next year.",
              "She would do better in another seminar.",
              "B", "inference",
              "She needs the seminar 'to graduate in the spring', and he says 'final-year students come "
              "first'. A place is possible, not certain."),
        ],
    },
    {
        "type": "conversation",
        "setting": "Listen to a conversation in a shoe store.",
        "voices": {"Woman": "F-AU", "Man": "M-US"},
        "script": [
            ("Woman", "Hello. I'd like to return these running shoes. I bought them last Saturday."),
            ("Man", "Sure. Is there something wrong with them?"),
            ("Woman", "They're a little tight. I wore them around the house for an hour, and my toes hurt."),
            ("Man", "That's no problem, as long as you haven't worn them outside. Do you have the receipt?"),
            ("Woman", "Yes, here it is."),
            ("Man", "Thanks. Would you like to try a bigger size? We have a half size up in the same color."),
            ("Woman", "Hmm. Actually, I'd rather just get my money back. I want to look around some other "
                      "stores first."),
            ("Man", "All right. The refund will go back onto your card in three to five days."),
        ],
        "questions": [
            q("Why is the woman returning the shoes?",
              "They do not fit comfortably.",
              "They are the wrong color.",
              "She found them cheaper elsewhere.",
              "They were damaged when she bought them.",
              "A", "detail",
              "'They're a little tight... my toes hurt.'"),
            q("What does the woman decide to do?",
              "Exchange the shoes for a slightly larger pair",
              "Keep the shoes and wear them at home",
              "Take a refund instead of another pair",
              "Come back with her receipt later",
              "C", "detail",
              "Offered a bigger size, she says, 'I'd rather just get my money back.'"),
        ],
    },
    {
        "type": "announcement",
        "setting": "Listen to an announcement by a museum guide.",
        "voice": "M-AU",
        "script": (
            "Good morning, everyone, and welcome to the Harrowgate Museum of Natural History. My name's Callum, "
            "and I'll be your guide for the next hour. Before we go in, just a few rules. You're welcome to "
            "take photos, but please switch off your flash, because bright light can damage some of the older "
            "objects. Food and drinks have to stay in your bags. And please keep together as a group, since "
            "some of the rooms are quite narrow. If you have any questions, just ask me as we go. All right, "
            "let's begin with the dinosaur hall."
        ),
        "questions": [
            q("What is the main purpose of the announcement?",
              "To describe the history of the museum",
              "To sell tickets for a special exhibit",
              "To tell visitors the rules for a tour",
              "To introduce a new guide to the staff",
              "C", "purpose",
              "'Before we go in, just a few rules', followed by rules on photos, food and staying together."),
            q("What does the guide say about taking photographs?",
              "It is allowed without a flash.",
              "It is not allowed in narrow rooms.",
              "It is allowed only in the dinosaur hall.",
              "It is not allowed anywhere in the museum.",
              "A", "detail",
              "'You're welcome to take photos, but please switch off your flash.'"),
        ],
    },
    {
        "type": "announcement",
        "setting": "Listen to an announcement in a classroom.",
        "voice": "F-US",
        "script": (
            "OK, before you pack up, a quick change to the research assignment. I know several of you have "
            "other papers due this week, so I've decided to move our deadline from this Friday to next "
            "Wednesday. There's one more change. Instead of a written report, I'd like each of you to prepare a "
            "five-minute presentation with slides. You'll present in class on Wednesday and Thursday, and I'll "
            "post the order of speakers online tomorrow. You don't need to hand in anything on paper, but "
            "please upload your slides the night before you present."
        ),
        "questions": [
            q("What is the announcement mainly about?",
              "The topics that students may choose for their papers",
              "Changes to when and how an assignment will be done",
              "The results of last week's presentations",
              "A new rule about uploading files online",
              "B", "main_idea",
              "The professor moves the deadline and replaces the written report with a presentation."),
            q("Why did the professor move the deadline?",
              "She will be away on Friday.",
              "The classroom is not available.",
              "Students asked for more time to prepare their slides.",
              "Students have other work due at the same time.",
              "D", "detail",
              "'I know several of you have other papers due this week, so I've decided to move our deadline.'"),
        ],
    },
    {
        "type": "talk",
        "subject": "Zoology",
        "voice": "F-UK",
        "script": (
            "OK, let's start with a puzzle. How does an animal catch a tiny flying insect in complete darkness? "
            "Bats do it hundreds of times a night. And no, it's not because they have amazing eyes. By the way, "
            "bats aren't blind. That's a myth. But in the dark, they rely on something else, called "
            "echolocation. Here's how it works. As a bat flies, it sends out very short, very high calls. Most "
            "of them are too high for human ears, so to us the night seems quiet. When a call hits an object, "
            "say, a moth, an echo bounces back. The bat's brain measures how long that echo took to return. A "
            "quick echo means the moth is close. A slower one means it's farther away. And the bat doesn't call "
            "at a steady rate. When it's just searching, it might call ten or twenty times a second. But as it "
            "closes in on an insect, the calls come faster and faster, up to two hundred a second. Scientists "
            "actually call this the feeding buzz. So the bat gets more and more detail exactly when it needs "
            "it. Now, the insects aren't helpless. Some moths have ears that can pick up bat calls, and when "
            "they hear one, they dive toward the ground. So next time, we'll look at this contest between the "
            "hunter and the hunted."
        ),
        "questions": [
            q("What is the talk mainly about?",
              "Why bats are active only at night",
              "How bats use sound to find their prey",
              "How moths protect themselves from birds",
              "Why bats have poor eyesight",
              "B", "main_idea",
              "The professor explains echolocation: calls, echoes and what the bat learns from them."),
            q("According to the professor, what does a quick echo tell a bat?",
              "The insect is large.",
              "The insect is moving fast.",
              "Another bat is calling.",
              "The object is nearby.",
              "D", "detail",
              "'A quick echo means the moth is close.'"),
            q("Why does the professor mention that the calls come faster as a bat approaches an insect?",
              "To show that the bat gains detail at the key moment",
              "To explain why people can sometimes hear bats at night",
              "To suggest that bats become tired while they are hunting",
              "To prove that most insects fly faster than bats do",
              "A", "function",
              "She sums up the faster calls with 'So the bat gets more and more detail exactly when it needs "
              "it.'"),
            q("What will the professor probably discuss in the next class?",
              "How bats raise their young",
              "Why some bats eat fruit",
              "How insects try to escape from bats",
              "How human hearing differs from a bat's",
              "C", "prediction",
              "After describing moths that dive when they hear a bat, she says 'next time, we'll look at this "
              "contest between the hunter and the hunted'."),
        ],
    },
    {
        "type": "talk",
        "subject": "Economics",
        "voice": "M-UK",
        "script": (
            "Let's begin with a simple question. Why do countries trade at all? Why doesn't each country just "
            "make everything it needs? Well, part of the answer is obvious. Bananas grow easily in Ecuador. "
            "They don't grow easily in Norway. So Norway buys bananas, and it sells things like fish and oil. "
            "But here's the less obvious part. Trade can help both sides even when one country is better at "
            "making everything. This idea goes back to David Ricardo, an English economist writing in the early "
            "eighteen hundreds. Economists call it comparative advantage. Let me give you an everyday example. "
            "Imagine a doctor who also happens to type faster than her assistant. Should she do her own typing? "
            "No. Every hour she spends typing is an hour she isn't seeing patients, and that's where she's most "
            "valuable. So she hires the assistant, and they're both better off. Countries work the same way. A "
            "country gains by concentrating on what it does best, compared with its other options, and trading "
            "for the rest. Now, I'm not saying trade is painless. When cheaper imports arrive, some local "
            "factories close, and those workers pay a real price. But for the economy as a whole, most "
            "economists agree that specializing and trading leaves countries richer than doing everything "
            "alone."
        ),
        "questions": [
            q("What is the main topic of the talk?",
              "Why some countries produce more than others",
              "How doctors organize their working day",
              "Why imports are cheaper than local products",
              "Why trading makes countries better off",
              "D", "main_idea",
              "The talk opens with 'Why do countries trade at all?' and answers it with comparative advantage."),
            q("Why does the professor talk about a doctor and her assistant?",
              "To illustrate the benefit of focusing on one's best work",
              "To show that assistants are usually the faster typists",
              "To explain how medical services are traded between countries",
              "To argue that doctors should learn to type faster",
              "A", "function",
              "The doctor types faster but is 'most valuable' seeing patients; 'Countries work the same way.'"),
            q("According to the professor, who is hurt when cheaper imports arrive?",
              "Shoppers who buy imported goods",
              "Economists who study trade",
              "Workers in some local factories",
              "Farmers who export fruit",
              "C", "detail",
              "'Some local factories close, and those workers pay a real price.'"),
            q("What is the professor's opinion of international trade?",
              "It benefits only wealthy countries.",
              "Its benefits outweigh its real costs.",
              "It should be limited to food products.",
              "It is less useful today than in the past.",
              "B", "attitude",
              "'I'm not saying trade is painless... But for the economy as a whole' it 'leaves countries "
              "richer'."),
        ],
    },
]

LISTENING_LOWER = [
    lcr("F-AU", "Where is the nearest bus stop?",
        "At seven thirty.",
        "Across the street.",
        "By bus.",
        "Two tickets, please.",
        "B", "'Where' needs a place. A gives a time."),
    lcr("M-UK", "Can I borrow your pen for a minute?",
        "It's a blue pen.",
        "For ten minutes.",
        "No, I can't write it.",
        "Sure. Here you go.",
        "D", "A request is answered by agreeing and handing the pen over."),
    lcr("F-US", "How was the concert last night?",
        "Great. The band played for two hours.",
        "At the town hall, I think.",
        "I'm fine, thank you.",
        "It starts at eight o'clock.",
        "A", "'How was...?' asks for a description. C answers 'How are you?'"),
    lcr("M-AU", "Do you have any pets at home?",
        "It is near my school.",
        "Yes, he is my brother.",
        "I have one small dog.",
        "My home is very old.",
        "C", "C tells the speaker about a pet. The other replies do not answer the question."),
    lcr("F-UK", "Let's meet in front of the cinema at six.",
        "I met him last year.",
        "It's a very funny movie.",
        "There are six of us.",
        "OK. See you there.",
        "D", "A plan to meet is accepted with 'OK. See you there.'"),
    lcr("M-US", "It's really cold in this room.",
        "I'll close the window.",
        "Yes, it's a big room.",
        "I caught a cold last week.",
        "The room is on the left.",
        "A", "The speaker feels cold; A offers to fix the problem. C uses 'cold' as an illness."),
    lcr("F-AU", "How much is this notebook?",
        "It has eighty pages.",
        "Two dollars fifty.",
        "It's on the top shelf.",
        "Yes, I'd like one.",
        "B", "'How much is...?' asks for a price."),
    {
        "type": "conversation",
        "setting": "Listen to a conversation between two students.",
        "voices": {"Man": "M-US", "Woman": "F-UK"},
        "script": [
            ("Man", "Excuse me. Do you know where Room 15 is? I have a math class there."),
            ("Woman", "I'm looking for the same room. It's my first day here."),
            ("Man", "Mine, too. I walked down this hall, but the numbers stop at twelve."),
            ("Woman", "Maybe it's upstairs. Oh, look. There's a map on the wall."),
            ("Man", "Good idea. Let's see... Room 15 is on the second floor, next to the library."),
            ("Woman", "Great. The class starts in five minutes."),
            ("Man", "Then let's go up together. I'm Kenji, by the way."),
            ("Woman", "Nice to meet you. I'm Sofia."),
        ],
        "questions": [
            q("What are the speakers trying to do?",
              "Borrow a book from the library",
              "Meet their math teacher",
              "Find the room for their class",
              "Buy a map of the school",
              "C", "detail",
              "The man asks where Room 15 is, and the woman says, 'I'm looking for the same room.'"),
            q("How do the speakers learn where the room is?",
              "They look at a map.",
              "They ask a teacher.",
              "They read a sign on a door.",
              "They call a friend.",
              "A", "detail",
              "'There's a map on the wall.' The map shows that Room 15 is on the second floor."),
        ],
    },
    {
        "type": "announcement",
        "setting": "Listen to an announcement in a school cafeteria.",
        "voice": "M-AU",
        "script": (
            "Attention, students. Starting next Monday, the cafeteria will have new opening hours. Breakfast "
            "will be served from seven to nine thirty. Lunch will start at eleven thirty and finish at two. In "
            "the evening, the cafeteria will now stay open until eight o'clock, one hour later than before. On "
            "Saturdays and Sundays, it will open only for lunch. You can find the new hours on the cafeteria "
            "door. Thank you."
        ),
        "questions": [
            q("What is the announcement about?",
              "A new menu in the cafeteria",
              "New hours for the cafeteria",
              "A cafeteria job for students",
              "The price of cafeteria meals",
              "B", "main_idea",
              "'Starting next Monday, the cafeteria will have new opening hours.'"),
            q("What will happen on weekends?",
              "The cafeteria will be closed all day.",
              "Breakfast will start later.",
              "The cafeteria will stay open until eight.",
              "Only lunch will be served.",
              "D", "detail",
              "'On Saturdays and Sundays, it will open only for lunch.'"),
        ],
    },
    {
        "type": "announcement",
        "setting": "Listen to an announcement by a teacher.",
        "voice": "F-US",
        "script": (
            "Good morning, everyone. I have some news about our school sports day. It will be this Friday on "
            "the playing field behind the gym. We start at nine o'clock with the running races, and after lunch "
            "there will be a football game between the teachers and the students. Please wear your sports "
            "clothes and bring a hat and a bottle of water. If it rains, we will move everything into the gym. "
            "Parents are welcome to come and watch."
        ),
        "questions": [
            q("What will happen after lunch on sports day?",
              "A football game will be played.",
              "The running races will begin.",
              "Parents will run in a race together.",
              "Students will go home early.",
              "A", "detail",
              "'After lunch there will be a football game between the teachers and the students.'"),
            q("What should students bring?",
              "A football",
              "Their lunch",
              "A hat and water",
              "A note from their parents",
              "C", "detail",
              "'Bring a hat and a bottle of water.'"),
        ],
    },
    {
        "type": "announcement",
        "setting": "Listen to an announcement in a train station.",
        "voice": "M-UK",
        "script": (
            "Attention, please. This is a platform change for passengers going to Westbridge. The ten fifteen "
            "train to Westbridge will now leave from platform six, not platform two. Please go to platform six "
            "now. You can use the stairs or the elevator near the ticket office. The train will leave on time, "
            "so please do not be late. We are sorry for the change. Thank you."
        ),
        "questions": [
            q("Which platform will the train to Westbridge leave from?",
              "Platform two",
              "Platform ten",
              "Platform fifteen",
              "Platform six",
              "D", "detail",
              "The train 'will now leave from platform six, not platform two'. Ten fifteen is the time."),
            q("What does the speaker say about the train?",
              "It will be about fifteen minutes late.",
              "It will not stop at Westbridge.",
              "It will leave at the planned time.",
              "It has been canceled today.",
              "C", "detail",
              "'The train will leave on time.'"),
        ],
    },
]

LISTENING_UPPER = [
    lcr("F-UK", "I don't suppose you could look after my cat this weekend?",
        "I suppose it looks a bit like yours.",
        "Yes, the weekend was lovely.",
        "I would, but I've got family visiting.",
        "It's after the weekend, I think.",
        "C", "'I don't suppose you could...?' is a polite request. C refuses politely by giving a reason."),
    lcr("M-US", "That exam wasn't nearly as bad as everyone made out.",
        "Speak for yourself. I ran out of time.",
        "They made it out of recycled paper, I think.",
        "Yes, it's nearly eight o'clock already.",
        "Everyone went out afterwards.",
        "A", "'Speak for yourself' signals disagreement: the second speaker found the exam hard."),
    lcr("F-AU", "You might want to back up your files before you install that update.",
        "I'll move the car back a little.",
        "No, I don't want to file a complaint.",
        "The update is printed on the very back page.",
        "Good point. I learned that the hard way.",
        "D", "'You might want to' is polite advice. D accepts it and hints at a past loss of files."),
    {
        "type": "conversation",
        "setting": "Listen to a conversation between two students.",
        "voices": {"Woman": "F-US", "Man": "M-AU"},
        "script": [
            ("Woman", "You look like you've got something on your mind."),
            ("Man", "I have. That software company I worked for last summer offered me a full-time job. They "
                    "want me to start in January."),
            ("Woman", "That's fantastic! But... you've still got a year left of your degree."),
            ("Man", "Exactly. They say I could finish part-time, but realistically, how many people ever do?"),
            ("Woman", "Not many, I'd guess. Then again, offers like that don't grow on trees."),
            ("Man", "I know. My parents think I'd be mad to turn it down."),
            ("Woman", "And what do you think?"),
            ("Man", "Honestly? I'd hate to be thirty and still two courses short of a degree."),
            ("Woman", "Have you asked whether they'd hold the job until you graduate?"),
            ("Man", "No... I suppose it can't hurt to ask."),
        ],
        "questions": [
            q("What does the woman mean when she says, \"offers like that don't grow on trees\"?",
              "The company has a poor reputation.",
              "Such opportunities are rare.",
              "The man should ask for more money.",
              "The job involves working outdoors.",
              "B", "function",
              "Something that 'doesn't grow on trees' is hard to come by; she is reminding him how unusual the "
              "offer is."),
            q("What will the man probably do?",
              "Accept the job and study part-time",
              "Turn the offer down straight away",
              "Ask his parents what they would do",
              "Ask whether the company will wait",
              "D", "prediction",
              "Asked whether the company would hold the job until he graduates, he says, 'I suppose it can't "
              "hurt to ask.'"),
        ],
    },
    {
        "type": "announcement",
        "setting": "Listen to an announcement from a university office.",
        "voice": "M-UK",
        "script": (
            "Good afternoon. A reminder from the International Programs Office: our information session on next "
            "year's exchange programs is this Thursday at four in Ashby Hall. Please note that the exchange is "
            "open only to students who will have completed two full semesters here before they leave, and whose "
            "grade average is at least a B. For partner universities where English isn't the main language, "
            "you'll also need an intermediate level in the local language, unless your courses are taught in "
            "English. Not sure whether you qualify? Come anyway. Advisers will be on hand to look at individual "
            "cases. Applications close on the first of March, and late ones won't be considered."
        ),
        "questions": [
            q("According to the speaker, when is the local-language requirement waived?",
              "When a student's courses are given in English",
              "When a student has an unusually high grade average",
              "When a student has completed four semesters",
              "When an adviser approves a late application",
              "A", "detail",
              "Students need the local language 'unless your courses are taught in English'."),
            q("What does the speaker imply about students who are unsure whether they qualify?",
              "They should apply after the first of March.",
              "They will take a language test at the session.",
              "Their situations may be judged one by one.",
              "They are unlikely to be accepted.",
              "C", "inference",
              "'Come anyway. Advisers will be on hand to look at individual cases.'"),
        ],
    },
    {
        "type": "talk",
        "subject": "Engineering",
        "voice": "M-US",
        "script": (
            "Here's something that ought to embarrass modern engineers a little. A concrete sea wall built "
            "today may start crumbling within fifty years. Yet Roman harbors have sat in salt water for two "
            "thousand years, and the Pantheon's concrete dome in Rome is still standing after nearly nineteen "
            "centuries. So what did the Romans know that we don't? Well, their recipe was different. Instead of "
            "modern cement, they mixed lime with volcanic ash. And in sea water, something remarkable happens. "
            "The water seeps in and reacts with the ash, and over time new crystals grow inside the concrete. "
            "In other words, the very thing that destroys our concrete made theirs stronger. There's a second "
            "clue. Roman concrete is full of tiny white lumps of lime. For years, people wrote these off as "
            "sloppy mixing. But recent research suggests they act as a repair kit. When a crack opens and "
            "rainwater gets in, it dissolves some of that lime, which then hardens again and seals the crack. "
            "Now, before you get carried away, Roman concrete isn't better across the board. It's weaker than "
            "ours under heavy loads, and it sets slowly. You couldn't build a skyscraper with it. Still, cement "
            "production is a major source of carbon emissions, so a concrete that repairs itself and lasts for "
            "centuries is well worth a second look."
        ),
        "questions": [
            q("What is the talk mainly about?",
              "How the Romans designed large domes",
              "Why modern engineers no longer use lime",
              "What makes Roman concrete so durable",
              "How sea water damages modern harbors",
              "C", "main_idea",
              "The professor asks 'what did the Romans know that we don't?' and gives two reasons their "
              "concrete has lasted."),
            q("According to the professor, what happens when sea water enters Roman concrete?",
              "The lime is slowly washed out.",
              "New crystals form and strengthen it.",
              "The volcanic ash turns into salt.",
              "Cracks spread through the structure.",
              "B", "detail",
              "'The water seeps in and reacts with the ash, and over time new crystals grow inside the "
              "concrete', which 'made theirs stronger'."),
            q("Why does the professor mention the white lumps of lime?",
              "To show that Roman builders worked carelessly",
              "To explain why Roman concrete is weak under heavy loads",
              "To describe how the Romans colored their concrete",
              "To introduce a feature that lets cracks seal up",
              "D", "function",
              "People once 'wrote these off as sloppy mixing', but 'they act as a repair kit' that 'seals the "
              "crack'."),
            q("What is the professor's attitude toward Roman concrete?",
              "It has real limits, but it deserves further study.",
              "It should replace modern concrete in all buildings.",
              "Its reputation is based mostly on myth.",
              "It is interesting only to historians.",
              "A", "attitude",
              "It 'isn't better across the board', yet it 'is well worth a second look'."),
        ],
    },
    {
        "type": "talk",
        "subject": "Sociology",
        "voice": "F-AU",
        "script": (
            "Think about the last time you heard about a job opening, or an apartment, or even a good film. Who "
            "told you? Your best friend? Possibly. But there's a fair chance it was someone you barely know. "
            "Back in nineteen seventy-three, the sociologist Mark Granovetter published a paper with a "
            "wonderfully paradoxical title, The Strength of Weak Ties. By strong ties, he meant close friends "
            "and family. Weak ties are acquaintances: an old classmate, a neighbor you nod to. Granovetter had "
            "asked people near Boston how they'd found their jobs. And of those who'd heard through a personal "
            "contact, most said it was someone they saw only occasionally or rarely. Not a close friend. Why "
            "would that be? Well, your close friends know one another. They read the same things and hear the "
            "same news, so what they tell you is, more often than not, something you already know. An "
            "acquaintance, on the other hand, moves in different circles. She's a bridge to information that "
            "would never reach you otherwise. Now, I'm not suggesting close friends don't matter. They're the "
            "ones who'll help you move house or sit with you when things go wrong. Weak ties won't do that. But "
            "when it comes to fresh information, it's the people at the edge of your social world who tend to "
            "deliver."
        ),
        "questions": [
            q("What is the main point of the talk?",
              "Close friends are the best source of career advice.",
              "Acquaintances often bring us new information.",
              "People today have fewer close friends than in the past.",
              "Most jobs are found through advertisements.",
              "B", "main_idea",
              "'When it comes to fresh information, it's the people at the edge of your social world who tend "
              "to deliver.'"),
            q("What did Granovetter find out about people who got jobs through a personal contact?",
              "Most heard about it from someone they seldom saw.",
              "Most were helped by a close member of their own family.",
              "Most had changed jobs several times before.",
              "Most had contacted the employer directly.",
              "A", "detail",
              "'Most said it was someone they saw only occasionally or rarely. Not a close friend.'"),
            q("According to the professor, why do close friends rarely provide new information?",
              "They are too busy to share it.",
              "They prefer to keep opportunities for themselves.",
              "They tend to know the same things that you do.",
              "They do not understand your interests.",
              "C", "detail",
              "Close friends 'read the same things and hear the same news', so what they say is usually "
              "'something you already know'."),
            q("Why does the professor mention helping someone move house?",
              "To give an example of a job found through friends",
              "To suggest that acquaintances are usually generous",
              "To explain how neighbors can become close friends",
              "To show that strong ties have their own value",
              "D", "function",
              "'I'm not suggesting close friends don't matter. They're the ones who'll help you move house'; "
              "'weak ties won't do that'."),
        ],
    },
]

# ===============================================================================================================
# WRITING
# ===============================================================================================================
WRITING = {
    "build": [
        build("I finally finished my chemistry report.",
              "Did you remember to add the list of sources?",
              ["did you", "remember to", "add", "the list", "of sources"], "yes_no_question"),
        build("Should we take the bus back after the concert?",
              "I do not think that the buses are running tonight.",
              ["I", "do not", "think that", "the buses", "are", "running tonight"], "negation"),
        build("I'm going to the farmers' market on Saturday morning.",
              "How much does a basket of strawberries cost there?",
              ["how much", "does", "a basket", "of strawberries", "cost", "there"], "wh_question",
              extra="do"),
        build("The microwave in our kitchen stopped working yesterday.",
              "You can use the one in the student lounge.",
              ["you can", "use", "the one", "in the", "student lounge"], "modal"),
        build("How was the new Thai place near the station?",
              "The food was much better than I had expected.",
              ["the food", "was", "much better", "than", "I had", "expected"], "comparison"),
        build("I'm applying for a summer job at the city aquarium.",
              "Have you already asked a professor for a reference letter?",
              ["have you", "already asked", "a professor", "for", "a reference letter"], "perfect",
              extra="did you"),
        build("I want to return these books before my morning class.",
              "Do you know if the library opens before eight?",
              ["do you", "know", "if", "the library", "opens"], "embedded_question",
              suffix="before eight"),
        build("Why is there a sign on the chemistry lab door?",
              "The equipment is being checked by a safety inspector.",
              ["the equipment", "is", "being", "checked by", "a safety inspector"], "passive",
              extra="are"),
        build("Did you find someone to help you with calculus?",
              "Yes, the tutor who taught my cousins has agreed to help me.",
              ["the tutor", "who taught", "my cousins", "has agreed", "to help me"], "relative_clause",
              prefix="Yes,"),
        build("I missed the last bus and had to walk home in the rain.",
              "If I had known, I would have driven over to pick you up.",
              ["I", "would have", "driven over", "to pick", "you up"], "conditional",
              prefix="If I had known,"),
    ],
    "email": {
        "scenario": (
            "You ordered a textbook for your biology course from an online bookstore. The course requires the "
            "fifth edition, but the package you received yesterday contains the third edition, which has "
            "different chapters and exercises. Your class begins next week, so you need the correct book "
            "quickly. You decide to write to the store's customer service manager, Ms. Brandt."
        ),
        "to": "Ms. Brandt",
        "subject": "Wrong edition of a textbook",
        "bullets": [
            "Describe the mistake in your order.",
            "Explain why you need the correct book soon.",
            "Suggest how the store could solve the problem.",
        ],
        "model": """
Dear Ms. Brandt,

I am writing about order number 60731, which I placed on your website on August 18. I ordered the fifth edition of my biology textbook, but the package that arrived yesterday contained the third edition. The covers look similar, but the chapters and exercises are different.

I need the correct edition urgently because my course begins next Monday, and the professor will assign reading and exercises from the fifth edition in the first week. Without it, I will not be able to do the homework.

Could you please send the fifth edition by express delivery so that it arrives before Monday? I would be happy to return the wrong book if you email me a prepaid shipping label. If the fifth edition is not in stock, I would prefer a full refund so that I can buy it elsewhere.

Thank you for your help.

Sincerely,
Aigerim Sadykova
""".strip(),
    },
    "discussion": {
        "course": "business management",
        "professor": {
            "name": "Dr. Nakamura",
            "post": (
                "This week we are examining how the workplace has changed. In recent years, millions of office "
                "employees have started working from home, and many companies have found that the work still "
                "gets done. Some firms have since told their staff that they never need to return to the "
                "office, while others have called everyone back. I would like to hear your view. Should "
                "companies allow employees to work from home permanently? Why or why not?"
            ),
        },
        "students": [
            {
                "name": "Yuki",
                "post": (
                    "I think companies should allow it. My mother used to spend almost three hours a day "
                    "traveling to and from her office. Now she works from home, and she uses that time to "
                    "exercise and to have dinner with us. She says she is less tired and gets more done, so "
                    "both she and her employer benefit."
                ),
            },
            {
                "name": "Mateus",
                "post": (
                    "I disagree. When everyone works at home all the time, new employees have nobody to learn "
                    "from. In my first part-time job, I learned the most by watching experienced coworkers and "
                    "asking quick questions at the next desk. That kind of learning does not happen in a video "
                    "meeting."
                ),
            },
        ],
        "model": (
            "In my view, companies should let employees work from home permanently if they wish, but they "
            "should not close their offices completely. I agree with Yuki that avoiding a long commute gives "
            "people more time and energy. However, Mateus makes a fair point about new staff, who need contact "
            "with experienced colleagues. I would add an idea that neither of them mentioned: permanent remote "
            "work allows a company to hire talented people who live far from its office, including parents of "
            "young children and people with disabilities who find daily travel difficult. This makes the "
            "workforce more diverse and gives the company a wider choice of candidates. To deal with the "
            "problem Mateus describes, firms could bring teams together for a few days each month for training "
            "and planning. In this way, employees keep their freedom, and the company keeps its team spirit."
        ),
    },
}

# ===============================================================================================================
# SPEAKING
# ===============================================================================================================
SPEAKING = {
    "repeat": {
        "scenario": (
            "You are learning how to guide visitors around a history museum. Listen to your trainer and repeat "
            "what he says. Repeat only once."
        ),
        "picture": "A museum gallery with glass display cases, a rope barrier and a guide wearing a name badge.",
        "voice": "M-UK",
        "sentences": [
            "Welcome to the history museum.",
            "Our tour today will last about an hour.",
            "Please stay behind the rope in front of every display case.",
            "The oldest objects in our collection are in the first room.",
            "You can borrow an audio guide at the information desk.",
            "If you would like to know more about any of the objects, please ask me during the tour.",
            "When the tour is over, you are welcome to visit the gift shop next to the main entrance.",
        ],
    },
    "interview": {
        "topic": "cooking and eating habits",
        "scenario": (
            "You have agreed to take part in a research study about cooking and eating habits. You will have a "
            "short online interview with a researcher. The researcher will ask you some questions."
        ),
        "voice": "F-US",
        "questions": [
            {
                "kind": "event",
                "q": (
                    "Thank you for taking part today. Let's start with something simple. Think about the last "
                    "meal that you cooked or helped to cook. What was it, and who did you make it for?"
                ),
                "model": (
                    "The last meal I cooked was a simple fried rice, which I made on Sunday evening for my two "
                    "roommates. We had some rice left from the day before, so I added eggs, carrots, green "
                    "onions, and a little soy sauce. It took only about fifteen minutes. I chose it because it "
                    "is cheap and fast, and because I did not want to waste the leftover rice. My roommates "
                    "said it was delicious, although I think they were just being polite, since I put in too "
                    "much salt. Anyway, we ate together at the kitchen table and talked for an hour, which was "
                    "the best part."
                ),
            },
            {
                "kind": "life",
                "q": (
                    "Thanks. Now let's talk about your routine. Some people like to cook at home most days, "
                    "while others prefer to eat out or order food. Which do you prefer, and why?"
                ),
                "model": (
                    "I prefer cooking at home on most days. The main reason is money: as a student, I cannot "
                    "afford to eat in restaurants very often, and a home-cooked meal costs less than half as "
                    "much. Another reason is that I know exactly what is in my food, so I can use more "
                    "vegetables and less oil. Cooking also helps me relax after a long day of classes. Of "
                    "course, I still enjoy eating out with friends once or twice a month, especially when we "
                    "want to try food from another country. But for everyday meals, my own kitchen is the "
                    "better choice."
                ),
            },
            {
                "kind": "opinion",
                "q": (
                    "Now I'd like to hear your opinion. Some people think that eating meals together as a "
                    "family is less important now than it was in the past, because everyone is so busy. Do you "
                    "agree with this view? Why or why not?"
                ),
                "model": (
                    "No, I don't agree. I think eating together is more important now exactly because everyone "
                    "is so busy. During the day, the people in a family are in different places, and in the "
                    "evening they often look at their own screens. A shared meal may be the only time when "
                    "they really talk to each other. In my family, dinner was the moment when my parents found "
                    "out what was happening at school, and when my sister and I heard their stories from work. "
                    "It does not have to happen every day, and the food does not have to be special. Even two "
                    "or three meals a week can keep a family close."
                ),
            },
            {
                "kind": "opinion",
                "q": (
                    "Here is my final question. Do you think schools should teach all students how to cook "
                    "basic meals? Why or why not?"
                ),
                "model": (
                    "Yes, I believe schools should teach every student to cook a few basic meals. Cooking is a "
                    "life skill, just like managing money, and not all children can learn it at home, because "
                    "many parents work long hours. Students who know how to prepare simple dishes will be able "
                    "to eat well and save money when they live alone for the first time. Cooking classes are "
                    "also a practical way to learn about other subjects, for example measuring in mathematics "
                    "or how heat changes food in science. The lessons would not need much time. One hour a "
                    "week for a single school year would probably be enough to give young people confidence in "
                    "the kitchen."
                ),
            },
        ],
    },
}

FORM = {
    "number": 3,
    "theme": "Procrastination and tree rings; bat echolocation, trade, Roman concrete, weak ties",
    "reading": {"router": READING_ROUTER, "lower": READING_LOWER, "upper": READING_UPPER},
    "listening": {"router": LISTENING_ROUTER, "lower": LISTENING_LOWER, "upper": LISTENING_UPPER},
    "writing": WRITING,
    "speaking": SPEAKING,
}
