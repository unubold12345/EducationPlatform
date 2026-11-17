"""TOEFL iBT practice test 09. Structure copied from form01.py; content plan: AUTHORING.md, section 5, "Form 09"."""

from common import build, lcr, q

# ===============================================================================================================
# READING
# ===============================================================================================================
READING_ROUTER = [
    {
        "type": "complete_words",
        "subject": "Biology",
        "text": (
            "DNA is the molecule that stores the genetic instructions of living things. "
            "The mole[cule] looks li[ke] a twi[sted] ladder, a[nd] each st[ep] is ma[de] of two chemical bases. "
            "The sequence of ba[ses] acts a[s] a co[de], which ce[lls] read in order to build proteins. "
            "Before a cell divides, it copies its DNA so that each new cell receives a full set of instructions. "
            "Because this sequence differs slightly between people, DNA can be used to identify individuals."
        ),
    },
    {
        "type": "complete_words",
        "subject": "Earth science",
        "text": (
            "Weather and climate are related, but they are not the same thing. "
            "Weather is the cond[ition] of t[he] atmosphere i[n] one pl[ace] over a short time. "
            "Climate i[s] the ave[rage] weather o[f] a reg[ion], measured ov[er] thirty ye[ars] or more. "
            "A desert can have a rainy day, and one cold winter does not prove that a region's climate has "
            "changed. "
            "Scientists therefore study records covering many decades before drawing conclusions about climate."
        ),
    },
    {
        "type": "daily_life",
        "format": "notice",
        "heading": "Read a notice.",
        "text": """
OUT OF ORDER

This drink machine is not giving change and may keep your coins. Please do not use it until it has been repaired. A technician is expected on Thursday morning.

Lost money? Fill in a refund slip at the front desk of Tennant Hall, open on weekdays from 9 a.m. to 4 p.m. Write the amount and the time you used the machine. Refunds are paid in cash on the spot.

Building Services
""".strip(),
        "questions": [
            q("What is the main purpose of the notice?",
              "To announce that a machine will be removed on Thursday",
              "To warn people about a faulty machine and explain refunds",
              "To explain how to buy drinks without using coins",
              "To ask residents to report problems to a technician",
              "B", "purpose",
              "The notice says the machine 'may keep your coins', asks people not to use it, and then explains how "
              "to get lost money back."),
            q("What must a person write on a refund slip?",
              "The name of the drink that was chosen",
              "The date of the technician's visit",
              "A room number in Tennant Hall",
              "How much money was lost and when",
              "D", "detail",
              "'Write the amount and the time you used the machine.'"),
        ],
    },
    {
        "type": "daily_life",
        "format": "email",
        "heading": "Read an email.",
        "text": """
To: Bilal Rahman
From: Marta Kowalczyk, Volunteer Coordinator
Subject: Your shift on Saturday, October 11

Dear Bilal,

Thank you for signing up to help at the Millbrook Food Bank. I am writing to confirm your shift this Saturday, October 11, from 9:00 a.m. to 12:30 p.m. You will be sorting donated cans and packing boxes with two other volunteers.

Please come to the side entrance on Tanner Street, not the main door, and arrive ten minutes early so that I can show you around. Wear closed shoes; we will give you gloves and an apron. There is no parking at the building, but bus 14 stops right outside.

If you cannot come, please call me by Friday noon so that I can find a replacement.

Best regards,
Marta Kowalczyk
""".strip(),
        "questions": [
            q("Why did Ms. Kowalczyk write to Bilal?",
              "To confirm the details of work he agreed to do",
              "To thank him for a donation of canned food",
              "To ask whether he is free this Saturday",
              "To tell him that his shift has been moved",
              "A", "purpose",
              "'I am writing to confirm your shift this Saturday', followed by the time, the task and the place."),
            q("Why is Bilal asked to arrive ten minutes early?",
              "So that he can find a parking space",
              "So that he can catch bus 14",
              "So that he can be shown the building",
              "So that he can pack the first boxes alone",
              "C", "detail",
              "'Arrive ten minutes early so that I can show you around.' There is no parking at the building."),
            q("Which of the following is Bilal NOT asked to do?",
              "Use the entrance on Tanner Street",
              "Bring his own gloves",
              "Wear closed shoes",
              "Phone if he is unable to come",
              "B", "negative",
              "Gloves and an apron will be given to him. The side entrance, closed shoes and a call by Friday noon "
              "are all requested."),
        ],
    },
    {
        "type": "daily_life",
        "format": "text_messages",
        "heading": "Read a chain of text messages.",
        "text": """
Salma (10:12 a.m.): Guess what? I'm coming home this weekend, but don't tell Mom. I want to surprise her.
Idris (10:15 a.m.): She'll be so happy! When does your train get in?
Salma (10:16 a.m.): Saturday at 4:40. Can you pick me up? Tell her you're going out to buy bread or something.
Idris (10:19 a.m.): Ha, OK. But she's planning to visit Aunt Celia on Saturday afternoon. I'll ask her to go on Sunday instead.
Salma (10:20 a.m.): Perfect. Thanks!
""".strip(),
        "questions": [
            q("Why does Salma send a message to Idris?",
              "To ask what their mother would like as a gift",
              "To find out when their aunt is coming to visit",
              "To get his help with a visit she is keeping secret",
              "To tell him that her train will arrive late",
              "C", "purpose",
              "She is coming home, writes 'don't tell Mom', and asks Idris to pick her up at the station."),
            q("What does Idris say he will do?",
              "Persuade their mother to change her plans",
              "Visit Aunt Celia on Saturday afternoon",
              "Buy bread on the way to the station",
              "Tell their mother when the train gets in",
              "A", "detail",
              "Their mother plans to visit Aunt Celia on Saturday afternoon: 'I'll ask her to go on Sunday "
              "instead.'"),
        ],
    },
    {
        "type": "daily_life",
        "format": "schedule",
        "heading": "Read a train timetable.",
        "text": """
COASTAL LINE: Saltmere Bay to Gannet Point
Weekday timetable (from September 2)

Leaves Saltmere Bay - Arrives Gannet Point
6:15 a.m. - 7:05 a.m.
7:45 a.m. (express) - 8:20 a.m.
10:30 a.m. - 11:20 a.m.
1:10 p.m. - 2:00 p.m.
5:40 p.m. (express) - 6:15 p.m.
9:00 p.m. - 9:50 p.m.

Notes:
- Express trains do not stop at Wren Lake or Dunmore.
- Bicycles may be carried on all trains except the two express services.
- Tickets bought on the train cost $2 more than tickets bought from a station machine.
- On Saturdays and Sundays, only the 10:30 a.m. and 5:40 p.m. trains run, and both stop at every station.
- Seats cannot be reserved on this line.
""".strip(),
        "questions": [
            q("A passenger wants to take a bicycle to Gannet Point on a Tuesday and arrive before 9:00 a.m. Which "
              "train should the passenger take?",
              "The 6:15 a.m. train",
              "The 7:45 a.m. train",
              "The 10:30 a.m. train",
              "The 1:10 p.m. train",
              "A", "inference",
              "The 7:45 is an express, and bicycles are not carried on the express services; the 10:30 arrives at "
              "11:20. Only the 6:15 takes bicycles and arrives before 9:00."),
            q("What is true about the express trains on weekdays?",
              "They are the only trains that run in the evening.",
              "They cost $2 more than the other trains.",
              "They are the only trains with reserved seats.",
              "They pass two stations without stopping.",
              "D", "detail",
              "'Express trains do not stop at Wren Lake or Dunmore.' The $2 difference is for tickets bought on "
              "the train, and no seats can be reserved."),
            q("How can passengers avoid paying an extra $2?",
              "By traveling on a Saturday or Sunday",
              "By using a station machine before boarding",
              "By choosing a train that is not an express",
              "By reserving a seat in advance",
              "B", "detail",
              "'Tickets bought on the train cost $2 more than tickets bought from a station machine.'"),
        ],
    },
    {
        "type": "academic",
        "subject": "Social history",
        "title": "How the Weekend Was Invented",
        "paragraphs": [
            "A two-day break at the end of every week feels natural today, yet it is a fairly recent invention. "
            "In early industrial Britain, factories ran six days a week, and Sunday was the only day off. Many "
            "workers, especially skilled craftsmen who were paid for each item they made, simply stayed away on "
            "Monday as well. This unofficial holiday became so common that it earned a nickname: \"Saint "
            "Monday.\"",
            "Factory owners disliked the custom because they could never predict how many workers would appear. "
            "From the middle of the nineteenth century, some of them proposed a trade: if employees came "
            "reliably on Monday, they could leave early on Saturday afternoon. The half-day proved popular, and "
            "other businesses soon profited from it. Railway companies sold cheap tickets for Saturday trips to "
            "the seaside, and football matches were scheduled for Saturday afternoons.",
            "The full two-day weekend arrived later. In 1926, the carmaker Henry Ford gave his factory workers "
            "both Saturday and Sunday off without cutting their pay. His motive was partly commercial: people "
            "with free time, he reasoned, would spend more money, including on cars. During the economic crisis "
            "of the 1930s, shorter weeks were also seen as a way to share scarce work among more people, and by "
            "1940 the forty-hour week had become the legal standard in the United States.",
        ],
        "questions": [
            q("According to the passage, why did factory owners dislike \"Saint Monday\"?",
              "Workers demanded higher pay for coming in on Mondays.",
              "It reduced the number of customers on Saturdays.",
              "The law required factories to open six days a week.",
              "They could not tell how many workers would come in.",
              "D", "factual",
              "Paragraph 2: owners 'could never predict how many workers would appear'."),
            q("What can be inferred about workers who stayed away on \"Saint Monday\"?",
              "They were paid for the day anyway.",
              "They had no official permission to be absent.",
              "They usually worked on Sundays instead.",
              "They were mostly employed by railway companies.",
              "B", "inference",
              "Paragraph 1 says Sunday was 'the only day off' and calls Monday an 'unofficial holiday'."),
            q("Why does the author mention railway tickets and football matches?",
              "To explain why workers were too tired to work on Mondays",
              "To show that factory owners also ran other businesses",
              "To give examples of how businesses gained from the free afternoon",
              "To argue that leisure mattered more than work in Britain",
              "C", "purpose",
              "The two examples directly follow the statement that 'other businesses soon profited from it'."),
            q('The word "scarce" in the passage is closest in meaning to',
              "hard to find", "poorly paid", "physically tiring", "strictly controlled",
              "A", "vocabulary",
              "Scarce means in short supply: in the crisis there was too little work, so it was shared out."),
            q("According to the passage, all of the following helped to establish the two-day weekend in the "
              "United States EXCEPT",
              "a carmaker's decision about his own factories",
              "the idea that free time would increase spending",
              "pressure from companies that sold train tickets",
              "the wish to spread work among more people",
              "C", "negative_factual",
              "Paragraph 3 gives Ford's decision, his reasoning about spending, and work-sharing in the 1930s. "
              "Railway companies belong to the earlier British half-day in paragraph 2."),
        ],
    },
]

READING_LOWER = [
    {
        "type": "complete_words",
        "subject": "History",
        "text": (
            "The ancient Romans built a huge network of roads across their empire. "
            "The fi[rst] roads we[re] made f[or] soldiers, b[ut] traders a[nd] messengers so[on] used them too. "
            "Each ro[ad] was bu[ilt] in lay[ers], with sa[nd] and gravel below and flat stones on top. "
            "The middle of the road was slightly higher than the edges, so rainwater ran off into ditches. "
            "Some modern highways in Europe still follow the routes that Roman engineers chose."
        ),
    },
    {
        "type": "daily_life",
        "format": "advertisement",
        "heading": "Read an advertisement.",
        "text": """
NEED HELP WITH MATH?
Stepwise Tutors

Friendly university students teach children aged 8 to 16.
- One-hour lessons at your home or online
- $18 per lesson; the first lesson is free
- Lessons every day except Sunday

Call 555-0142 or visit our desk in the Oakfield Library on Saturdays, 10 a.m. to 2 p.m.
""".strip(),
        "questions": [
            q("What is true about the first lesson?",
              "It lasts two hours.",
              "It must be online.",
              "It is on a Saturday.",
              "It costs nothing.",
              "D", "detail",
              "'The first lesson is free.' Lessons last one hour and can be at home or online."),
            q("Who teaches the lessons?",
              "University students",
              "Local schoolteachers",
              "Parents of older children",
              "Library staff",
              "A", "detail",
              "'Friendly university students teach children aged 8 to 16.' The library is only where the "
              "company has a desk on Saturdays."),
        ],
    },
    {
        "type": "daily_life",
        "format": "instructions",
        "heading": "Read a set of instructions.",
        "text": """
SETTING UP YOUR NOVALINK HOME WI-FI

1. Take the router out of the box. Put it in an open place, such as a shelf in the living room. Do not put it on the floor or inside a closet.
2. Connect the white cable to the wall socket and to the back of the router.
3. Plug in the power cable and press the ON button. Wait about five minutes. The light on the front will change from red to green.
4. On your phone or computer, choose the network called NOVALINK-HOME. Type the password printed on the card under the router.
5. For safety, change the password the first time you connect.

Is the light still red after ten minutes? Turn the router off, wait thirty seconds, and turn it on again. If this does not help, call 555-0177.
""".strip(),
        "questions": [
            q("Where should the router be placed?",
              "On the floor near a door",
              "Inside a closet",
              "On a shelf in an open area",
              "Behind a sofa",
              "C", "detail",
              "Step 1: 'Put it in an open place, such as a shelf in the living room', not on the floor or inside "
              "a closet."),
            q("What does a green light most likely mean?",
              "The password has been changed.",
              "The router must be turned off.",
              "The white cable is in the wrong place.",
              "The router is ready to use.",
              "D", "inference",
              "After the router is switched on, the light changes 'from red to green' and the next step is to "
              "connect to the network; a light that stays red is treated as a problem."),
            q("What should users do first if the light stays red?",
              "Call the company",
              "Turn the router off and on again",
              "Change the password",
              "Move the router to another room",
              "B", "detail",
              "'Turn the router off, wait thirty seconds, and turn it on again. If this does not help, call "
              "555-0177.'"),
        ],
    },
]

READING_UPPER = [
    {
        "type": "complete_words",
        "subject": "Behavioral economics",
        "text": (
            "In behavioral economics, a nudge is a small change in how choices are presented that steers people "
            "toward one option. "
            "A nudge wo[rks] without ban[ning] any alter[native] or chan[ging] financial incen[tives]. "
            "For example, when a com[pany] enrolls n[ew] employees i[n] a pen[sion] plan automa[tically], most "
            "of them stay in it. "
            "When workers must sign up themselves, far fewer join, even though the plan is identical. "
            "Critics warn, however, that nudges can influence people without their noticing."
        ),
    },
    {
        "type": "academic",
        "subject": "Neuroscience",
        "title": "Rewiring the Brain",
        "paragraphs": [
            "For most of the twentieth century, scientists assumed that the adult brain was essentially fixed. "
            "Children's brains developed rapidly, the thinking went, but once a person reached adulthood, the "
            "wiring was complete and could only decline. Research over the past few decades has overturned this "
            "view. The brain, it turns out, keeps reorganizing itself throughout life, a capacity known as "
            "neuroplasticity.",
            "A well-known study of London taxi drivers illustrates the idea. To earn a license, drivers there "
            "must memorize thousands of streets, a task that takes years. Brain scans showed that part of the "
            "hippocampus, a region involved in spatial memory, was larger in these drivers than in other "
            "adults, and the longer they had been driving, the greater the difference. Plasticity also explains "
            "why some patients recover abilities after a stroke: with intensive practice, healthy areas can "
            "take over tasks once handled by damaged ones.",
            "Yet rewiring is neither effortless nor always beneficial. Connections that are not used grow "
            "weaker, so skills fade without practice. The same mechanism can also strengthen unwanted patterns, "
            "as when the nervous system \"learns\" to keep signaling pain after an injury has healed. Nor does "
            "every claim made in the name of plasticity deserve trust: commercial \"brain-training\" games "
            "improve performance on the games themselves, but evidence that they sharpen thinking in general "
            "remains weak.",
        ],
        "questions": [
            q("What is the passage mainly about?",
              "Why children's brains develop faster than adults' brains",
              "The brain's ability to change throughout life, and its limits",
              "How taxi drivers in London are trained and licensed",
              "New treatments that repair damaged brain cells",
              "B", "main_idea",
              "Paragraph 1 introduces neuroplasticity, paragraph 2 gives evidence for it, and paragraph 3 begins "
              "'Yet rewiring is neither effortless nor always beneficial'."),
            q("According to the passage, what did the study of taxi drivers find?",
              "Drivers with larger brains learned the streets faster.",
              "Drivers forgot the streets soon after they retired.",
              "Most drivers needed several attempts to earn a license.",
              "A region linked to spatial memory was larger in drivers.",
              "D", "factual",
              "Paragraph 2: 'part of the hippocampus, a region involved in spatial memory, was larger in these "
              "drivers than in other adults'."),
            q('The word "overturned" in the passage is closest in meaning to',
              "disproved", "supported", "explained", "delayed",
              "A", "vocabulary",
              "To overturn a view is to show that it is wrong; the next sentence states the opposite of the old "
              "belief."),
            q("What can be inferred about a person who stops playing a musical instrument for many years?",
              "The person's hippocampus will grow larger.",
              "The person will be unable to relearn the instrument.",
              "The connections that support the skill will weaken.",
              "The skill will stay the same, since adult brains are fixed.",
              "C", "inference",
              "Paragraph 3: 'Connections that are not used grow weaker, so skills fade without practice.'"),
            q("Why does the author mention \"brain-training\" games?",
              "To recommend an inexpensive way of improving one's memory",
              "To illustrate a claim about plasticity that lacks good evidence",
              "To show that adults learn games more slowly than children",
              "To explain how stroke patients practice lost skills",
              "B", "purpose",
              "The games follow 'Nor does every claim made in the name of plasticity deserve trust'; evidence "
              "for a general benefit 'remains weak'."),
        ],
    },
]

# ===============================================================================================================
# LISTENING
# ===============================================================================================================
LISTENING_ROUTER = [
    lcr("F-US", "Did you remember to lock the lab when you left?",
        "I left it in my locker.",
        "Oh no. I'd better run back and check.",
        "The lab report is due on Friday.",
        "No, I don't remember his name.",
        "B", "The speaker asks whether something was done. B admits doubt and offers to check; A and D only "
             "repeat 'left', 'lock' and 'remember'."),
    lcr("M-UK", "How do you like your new roommate?",
        "I'd like a room with a view.",
        "By bus, most mornings.",
        "Yes, I'd like that very much.",
        "She's quiet, which suits me fine.",
        "D", "'How do you like...?' asks for an opinion of a person. Only D gives one."),
    lcr("F-AU", "Any idea why the fire alarm went off this morning?",
        "Someone burned toast in the kitchen, I heard.",
        "My alarm clock is on the shelf.",
        "I'm alarmed by the price, too.",
        "The fire station is on Thornby Road.",
        "A", "'Any idea why...?' asks for a reason. Only A gives one; the others repeat 'alarm' or 'fire'."),
    lcr("M-US", "The choir rehearsal's been moved to Thursday, hasn't it?",
        "It was quite moving, actually.",
        "I moved in last Thursday.",
        "As far as I know, yes.",
        "Yes, she has a lovely voice.",
        "C", "A tag question asks for confirmation. C confirms, with a little caution."),
    lcr("F-UK", "What's the quickest way to the engineering building from here?",
        "Cut through the parking lot behind the gym.",
        "Every ten minutes or so.",
        "It's the tallest one on campus.",
        "I'm studying civil engineering.",
        "A", "The speaker wants a route. Only A gives directions."),
    lcr("M-AU", "I'm not sure I can finish this report by five.",
        "It finished at five thirty.",
        "I'm sure the reporter will call back.",
        "Five copies should be enough.",
        "Would it help if I checked the figures?",
        "D", "The speaker is worried about a deadline. D offers help; the others repeat 'finish', 'report' or "
             "'five'."),
    lcr("F-US", "What's taking the bus so long today?",
        "The ride is forty minutes long.",
        "There's roadwork on the bridge, apparently.",
        "I usually take the number six.",
        "It's been a long day for me, too.",
        "B", "The speaker wonders why the bus is late. B gives a likely cause; A answers 'How long does the "
             "trip take?'"),
    lcr("M-UK", "Is there anywhere around here I can get a key cut?",
        "I cut my hand on it last week.",
        "The keys are on the kitchen table.",
        "There's a hardware store two streets down.",
        "Yes, it was cut by ten percent.",
        "C", "The speaker needs a shop that copies keys. C names one; the others only repeat 'cut' or "
             "'key'."),
    lcr("F-AU", "You might as well ask for an extension. What's the worst that could happen?",
        "The extension cord is in the drawer.",
        "The worst part was the ending.",
        "It happened last semester.",
        "I suppose it can't hurt to try.",
        "D", "The speaker encourages a request for more time. D accepts the advice; A takes 'extension' "
             "literally."),
    lcr("M-US", "How was the turnout for the film club last night?",
        "Better than usual. We ran out of chairs.",
        "It turned out to be a comedy.",
        "Turn left just after the cinema.",
        "It starts at eight every Tuesday.",
        "A", "'Turnout' is the number of people who came. A says that many did; B only sounds similar."),
    lcr("F-UK", "Are we meeting at your place or at the library?",
        "Yes, that's absolutely fine with me.",
        "It's a really nice place to live.",
        "The library. My place is too noisy.",
        "I met her outside the library.",
        "C", "The speaker offers two places to meet, so the reply must pick one. C does, and gives a reason."),
    lcr("M-AU", "I could really do with a break from all this studying.",
        "Don't worry, it isn't broken.",
        "Let's go for a walk and clear our heads.",
        "I studied there for two years.",
        "It could use a new battery.",
        "B", "'Could do with a break' means needs a rest. B suggests one; A takes 'break' literally."),
    {
        "type": "conversation",
        "setting": "Listen to a conversation between a student and a parking office employee.",
        "voices": {"Woman": "F-UK", "Man": "M-US"},
        "script": [
            ("Woman", "Hi. I bought a semester parking permit online last week, but it still hasn't come in the "
                      "mail."),
            ("Man", "Let me look you up. What's your name?"),
            ("Woman", "Nasrin Siddiqui."),
            ("Man", "OK. It says the permit was mailed on the third. Oh, I see. It went to an address on Birch "
                    "Street."),
            ("Woman", "That's my old apartment. I moved in August."),
            ("Man", "Well, that explains it. I can print a replacement right now, but there's a five-dollar "
                    "fee."),
            ("Woman", "That's fine. And could you change my address so this doesn't happen again?"),
            ("Man", "I'm afraid you have to do that yourself, on the student portal. We can't edit it from "
                    "here."),
            ("Woman", "All right. I'll do it tonight."),
        ],
        "questions": [
            q("Why has the woman's permit not arrived?",
              "She has not paid for it yet.",
              "The office has run out of permits.",
              "It was sent to her previous address.",
              "She ordered it only this morning.",
              "C", "detail",
              "The permit 'went to an address on Birch Street', and she says, 'That's my old apartment.'"),
            q("What does the man say the woman must do herself?",
              "Correct her address online",
              "Print a replacement permit",
              "Pay a fee at the post office",
              "Collect her mail from Birch Street",
              "A", "detail",
              "'You have to do that yourself, on the student portal. We can't edit it from here.' The man prints "
              "the replacement."),
        ],
    },
    {
        "type": "conversation",
        "setting": "Listen to a conversation between two friends.",
        "voices": {"Man": "M-AU", "Woman": "F-US"},
        "script": [
            ("Man", "So, Mr. Abernethy retires at the end of June. Have you thought about a gift from our class?"),
            ("Woman", "I was thinking of a nice fountain pen. He was always writing with one."),
            ("Man", "True, but he probably owns a dozen. What about something he can't buy, like a book of "
                    "messages from his old students?"),
            ("Woman", "Oh, I love that. Everyone could write down a memory from his geography lessons."),
            ("Man", "Exactly. I can collect the messages by email."),
            ("Woman", "And I'll get the book printed. My cousin works at a print shop, so it won't cost much."),
            ("Man", "Great. We'd better start soon, though. People are slow to reply."),
            ("Woman", "I'll post in the class group tonight."),
        ],
        "questions": [
            q("Why does the man not like the idea of a pen?",
              "It would cost too much for the class.",
              "The teacher probably has many already.",
              "The teacher never writes by hand.",
              "Another class has already bought one.",
              "B", "detail",
              "'True, but he probably owns a dozen.'"),
            q("What will the woman probably do next?",
              "Visit her cousin's print shop",
              "Buy a fountain pen",
              "Send an email to the teacher",
              "Write to their former classmates",
              "D", "prediction",
              "'I'll post in the class group tonight.' The printing comes later, once the messages have been "
              "collected."),
        ],
    },
    {
        "type": "conversation",
        "setting": "Listen to a conversation between a student and a professor.",
        "voices": {"Man": "M-UK", "Woman": "F-AU"},
        "script": [
            ("Man", "Professor Szabo, thanks for seeing me. I got your note that my project proposal wasn't "
                    "approved."),
            ("Woman", "Yes, have a seat, Dev. The idea is good. The trouble is the scale. You want to survey five "
                      "hundred commuters in six weeks."),
            ("Man", "I thought a bigger sample would make the results stronger."),
            ("Woman", "It would, if you had a team. Alone, you'd spend the whole term collecting data and have "
                      "no time to analyze it."),
            ("Man", "So should I drop the survey?"),
            ("Woman", "No, shrink it. Pick one bus route and aim for sixty responses. Then add a few short "
                      "interviews to give the numbers some depth."),
            ("Man", "That sounds doable. When do you need the new version?"),
            ("Woman", "By Monday. One page is enough."),
        ],
        "questions": [
            q("Why was the student's proposal not approved?",
              "It was too much work for one person in the time allowed.",
              "Another student had already chosen the same topic.",
              "It did not include any plan to collect data.",
              "It was handed in after the deadline had passed.",
              "A", "detail",
              "'The trouble is the scale... Alone, you'd spend the whole term collecting data and have no time "
              "to analyze it.'"),
            q("What does the professor suggest?",
              "Working with a team of classmates",
              "Choosing a completely different topic",
              "Making the survey smaller and adding interviews",
              "Continuing the project in the following term",
              "C", "detail",
              "'No, shrink it. Pick one bus route and aim for sixty responses. Then add a few short "
              "interviews.'"),
        ],
    },
    {
        "type": "conversation",
        "setting": "Listen to a conversation in a tailor's shop.",
        "voices": {"Man": "M-AU", "Woman": "F-UK"},
        "script": [
            ("Man", "Good morning. I bought this suit for my sister's wedding, but the sleeves are too long."),
            ("Woman", "Let's have a look. Stand up straight for me. Hmm, yes. About two centimeters off each "
                      "sleeve, and I'd take in the waist a little as well."),
            ("Man", "Is the jacket too big? I thought it was just the sleeves."),
            ("Woman", "It hangs loose at the back. It's a small job, and it'll look much smarter."),
            ("Man", "All right, I trust you. The wedding's on the twentieth. Will it be ready in time?"),
            ("Woman", "Normally I need a week, but I can have it done by Friday. Come in and try it on then, in "
                      "case anything needs adjusting."),
            ("Man", "Perfect. Do I pay now?"),
            ("Woman", "Half now, and half when you collect it."),
        ],
        "questions": [
            q("What extra change does the woman recommend?",
              "Shortening the jacket at the back",
              "Replacing the buttons on the sleeves",
              "Making the sleeves a little wider",
              "Making the jacket narrower at the waist",
              "D", "detail",
              "'I'd take in the waist a little as well', because the jacket 'hangs loose at the back'."),
            q("What can be inferred about the woman?",
              "She thinks the suit is of poor quality.",
              "She will finish the job faster than she usually does.",
              "She will charge extra for quick service.",
              "She wants the man to buy a new jacket.",
              "B", "inference",
              "'Normally I need a week, but I can have it done by Friday.' She says nothing about an extra "
              "charge."),
        ],
    },
    {
        "type": "announcement",
        "setting": "Listen to an announcement in a campus theater.",
        "voice": "F-US",
        "script": (
            "Welcome to the Ellery Theater, and thank you for coming to tonight's student production. Before the "
            "lights go down, a few quick reminders. Please switch your phones off completely, because even a "
            "silent phone lights up and distracts the actors. Photography isn't allowed during the show, but "
            "the cast will be in the lobby afterward and would love to take pictures with you. Tonight's "
            "performance runs about ninety minutes, with one fifteen-minute intermission. If you leave your "
            "seat during the show, an usher will let you back in at a suitable moment. Thank you, and enjoy the "
            "play."
        ),
        "questions": [
            q("What is the main purpose of the announcement?",
              "To remind the audience of the rules before a show",
              "To introduce the actors in tonight's play",
              "To announce that the performance will start late",
              "To invite students to join a theater group",
              "A", "purpose",
              "'Before the lights go down, a few quick reminders', followed by rules about phones, photographs "
              "and leaving one's seat."),
            q("What does the speaker say about taking photographs?",
              "It is allowed if the flash is turned off.",
              "It is permitted only during the intermission.",
              "It will be possible in the lobby after the show.",
              "It must be approved by an usher.",
              "C", "detail",
              "'Photography isn't allowed during the show, but the cast will be in the lobby afterward and would "
              "love to take pictures with you.'"),
        ],
    },
    {
        "type": "announcement",
        "setting": "Listen to an announcement in a classroom.",
        "voice": "M-UK",
        "script": (
            "Right, I'll let you go in a moment, but first, a quick request. This afternoon you'll get an email "
            "with a link to our mid-semester feedback survey. It takes about five minutes, and it's anonymous, so I won't know who "
            "wrote what. Now, this isn't the official evaluation you fill in at the end of term. This one comes "
            "straight to me, and I use it to adjust the course while you're still taking it. Last year, for "
            "instance, students asked for more worked examples, so I added them. The survey closes on Sunday "
            "night, and on Monday I'll tell you what I plan to change."
        ),
        "questions": [
            q("What is the professor mainly talking about?",
              "The results of last year's final evaluation",
              "A change to the date of the midterm exam",
              "A new rule about emailing the professor",
              "A chance to comment on the course while it is running",
              "D", "main_idea",
              "The mid-semester survey 'comes straight to me, and I use it to adjust the course while you're "
              "still taking it'."),
            q("Why does the professor mention worked examples?",
              "To explain what will be on the next test",
              "To show that earlier feedback led to a change",
              "To describe a problem with this year's class",
              "To remind students what to bring on Monday",
              "B", "function",
              "'Last year, for instance, students asked for more worked examples, so I added them.' It is an "
              "example of feedback being used."),
        ],
    },
    {
        "type": "talk",
        "subject": "Botany",
        "voice": "F-AU",
        "script": (
            "Plants have a problem that animals don't. When something comes along to eat them, they can't run "
            "away. So, how does a plant protect itself? Well, the first line of defense is physical. Think of "
            "the thorns on a rose, or the tough, waxy surface of a holly leaf. Some leaves are even covered in "
            "tiny hairs that make it hard for small insects to walk on them. The second line is chemical. Many "
            "plants fill their leaves with substances that taste bitter or are actually poisonous. Caffeine is "
            "a good example. We enjoy it in coffee and tea, but the plant makes it to poison insects that chew "
            "on its leaves. Now, here's the part I find most impressive. Some plants call for help. When "
            "caterpillars start chewing on a corn plant, the damaged leaves release a scent into the air. That "
            "scent attracts a certain kind of wasp, and the wasps attack the caterpillars. In other words, the "
            "plant is sending out a signal that says, 'Your lunch is over here.' And all of this costs the "
            "plant energy, which is why many plants don't produce these chemicals all the time. They wait until "
            "they're actually attacked. So next time you walk past a quiet green field, remember, it's not as "
            "peaceful as it looks."
        ),
        "questions": [
            q("What is the talk mainly about?",
              "Why insects prefer some plants to others",
              "Ways in which plants protect themselves from being eaten",
              "How farmers keep caterpillars away from their corn",
              "The effects that caffeine has on the human body",
              "B", "main_idea",
              "The professor asks 'how does a plant protect itself?' and then describes physical, chemical and "
              "indirect defenses."),
            q("According to the professor, why do some plants produce caffeine?",
              "To attract insects that carry pollen",
              "To help their leaves hold water",
              "To grow faster in poor soil",
              "To poison insects that feed on them",
              "D", "detail",
              "'The plant makes it to poison insects that chew on its leaves.'"),
            q("What happens when caterpillars chew on a corn plant?",
              "The plant gives off a smell that brings wasps.",
              "The plant's leaves grow tiny hairs.",
              "The caterpillars are poisoned by caffeine.",
              "The plant stops producing chemicals.",
              "A", "detail",
              "'The damaged leaves release a scent into the air. That scent attracts a certain kind of wasp, and "
              "the wasps attack the caterpillars.'"),
            q("What is the professor's attitude toward plants that \"call for help\"?",
              "She doubts that it has been proved.",
              "She thinks it is less effective than thorns.",
              "She finds it especially remarkable.",
              "She worries that it harms useful insects.",
              "C", "attitude",
              "She introduces this defense with 'here's the part I find most impressive'."),
        ],
    },
    {
        "type": "talk",
        "subject": "Marketing",
        "voice": "M-US",
        "script": (
            "Here's a price tag that every one of you has seen a thousand times. A shirt costs nineteen "
            "ninety-nine. Not twenty dollars. Why? It's only one cent. Well, marketers have a name for this: charm pricing. "
            "And there are two main reasons it works. The first is the way we read numbers. We read from left "
            "to right, and our brain starts judging the price as soon as it sees the first digit. So nineteen "
            "ninety-nine gets filed under 'nineteen-something,' not 'twenty.' Researchers call this the "
            "left-digit effect. And notice, it only works when the first digit changes. Dropping a price from "
            "three sixty to three fifty-nine does almost nothing. The second reason is what a nine signals. "
            "Over the years, shoppers have learned to connect prices ending in nine with sales and discounts. "
            "In one well-known experiment, a clothing catalog offered the same dress at thirty-four, "
            "thirty-nine, and forty-four dollars. Which sold best? The thirty-nine-dollar one. It even beat the "
            "cheaper price. Now, does that mean every store should use nines? Not quite. Have a look at the "
            "menu in an expensive restaurant, or the price tag on a luxury watch. You'll usually see round "
            "numbers there. A round price says quality, and a nine says discount. So the right ending depends "
            "on what you want your customers to think."
        ),
        "questions": [
            q("What is the main topic of the talk?",
              "How stores decide when to hold sales",
              "Why luxury products cost more to make",
              "Why prices just below a round number affect shoppers",
              "How shoppers calculate discounts in their heads",
              "C", "main_idea",
              "The professor asks why a shirt costs nineteen ninety-nine instead of twenty dollars and gives two "
              "reasons that 'charm pricing' works."),
            q("According to the professor, what is the left-digit effect?",
              "People judge a price mainly by its first number.",
              "People remember the last number of a price best.",
              "People read prices more slowly than words.",
              "People prefer prices that have fewer digits.",
              "A", "detail",
              "'Our brain starts judging the price as soon as it sees the first digit.'"),
            q("Why does the professor mention a price change from $3.60 to $3.59?",
              "To prove that even a one-cent discount always raises sales",
              "To give an example of the prices used in luxury stores",
              "To explain how the experiment with the dress was designed",
              "To show that the first digit must change for the effect to work",
              "D", "function",
              "'It only works when the first digit changes. Dropping a price from three sixty to three "
              "fifty-nine does almost nothing.'"),
            q("What does the professor imply about an expensive restaurant that used prices ending in "
              "ninety-nine?",
              "It would sell more meals than before.",
              "It might make its food seem lower in quality.",
              "It would confuse customers who read quickly.",
              "It would have to change its prices more often.",
              "B", "inference",
              "'A round price says quality, and a nine says discount', which is why expensive restaurants use "
              "round numbers."),
        ],
    },
]

LISTENING_LOWER = [
    lcr("M-UK", "What did you have for breakfast today?",
        "At a quarter to eight.",
        "In the dining room.",
        "Some toast and an egg.",
        "Yes, I had it early.",
        "C", "'What did you have' asks about food. A gives a time and B a place."),
    lcr("F-UK", "Can I try these shoes on, please?",
        "Of course. What size do you need?",
        "Yes, I tried very hard.",
        "They are forty dollars.",
        "No, I walk to school.",
        "A", "The speaker asks permission in a shop. A agrees and offers help; B uses 'try' with a different "
             "meaning."),
    lcr("M-AU", "What color is your new bike?",
        "It's quite heavy.",
        "I ride it to school.",
        "It was a birthday gift.",
        "It's dark green.",
        "D", "'What color' needs a color."),
    lcr("F-US", "Let's make a cake for Mom's birthday.",
        "She is forty-five.",
        "Good idea. I'll buy the eggs.",
        "The cake was delicious.",
        "He bakes bread every day.",
        "B", "'Let's...' is a suggestion. B accepts it and offers to help."),
    lcr("M-US", "Where do you keep the scissors?",
        "In the top drawer of my desk.",
        "They cost three dollars.",
        "I cut the paper already.",
        "Yes, you can keep them.",
        "A", "'Where' needs a place. D repeats 'keep' with a different meaning."),
    lcr("F-AU", "Your English is getting much better.",
        "Yes, I feel much better today.",
        "It's getting dark outside.",
        "Thanks. I practice every evening.",
        "She's from England.",
        "C", "A polite reply to praise is thanks. A uses 'better' to talk about health."),
    lcr("M-UK", "Do you want an apple or a pear?",
        "Yes, very much.",
        "A pear, please.",
        "They are in the basket.",
        "I had lunch at noon.",
        "B", "The speaker offers two kinds of fruit. B picks one; 'yes' does not answer the question."),
    {
        "type": "conversation",
        "setting": "Listen to a conversation between two students.",
        "voices": {"Woman": "F-AU", "Man": "M-US"},
        "script": [
            ("Woman", "Did you see the note on the door? Mr. Banda is sick today, so there's no history class."),
            ("Man", "Really? So we have a free hour. What do you want to do?"),
            ("Woman", "I'm hungry. Let's go to the cafeteria."),
            ("Man", "It doesn't open until twelve, and it's only ten thirty."),
            ("Woman", "Oh, right. Then how about the library? We can start our science homework."),
            ("Man", "Good idea. But I left my science book at home."),
            ("Woman", "That's OK. We can share mine."),
            ("Man", "Thanks. And after that, lunch!"),
        ],
        "questions": [
            q("Why do the students have a free hour?",
              "Their teacher is sick.",
              "Their class ended early.",
              "Their classroom is being cleaned.",
              "They came to school too early.",
              "A", "detail",
              "'Mr. Banda is sick today, so there's no history class.'"),
            q("What will the students do next?",
              "Eat in the cafeteria",
              "Go home to get a book",
              "Visit their teacher",
              "Do homework in the library",
              "D", "prediction",
              "The cafeteria is still closed, so they agree to go to the library and start their science "
              "homework. Lunch comes 'after that'."),
        ],
    },
    {
        "type": "announcement",
        "setting": "Listen to an announcement in a supermarket.",
        "voice": "F-UK",
        "script": (
            "Good morning, shoppers, and welcome to Fairway Market. Today only, all fresh bread from our bakery "
            "is half price. That's right, choose any loaf and pay just fifty percent. We also have a special "
            "offer on oranges. Buy two bags and get one more bag free. You can find the bakery at the back of "
            "the store, next to the milk and cheese. These offers end at six o'clock this evening, so don't "
            "wait. Thank you for shopping with us."
        ),
        "questions": [
            q("What is the announcement mainly about?",
              "A new bakery in the store",
              "Special prices on some food today",
              "A change in opening hours",
              "Free drinks for shoppers",
              "B", "main_idea",
              "Bread is half price and there is an offer on oranges, 'today only'."),
            q("What do shoppers get if they buy two bags of oranges?",
              "A loaf of bread",
              "Half of their money back",
              "Another bag for free",
              "A bottle of milk",
              "C", "detail",
              "'Buy two bags and get one more bag free.'"),
        ],
    },
    {
        "type": "announcement",
        "setting": "Listen to an announcement at a sports center.",
        "voice": "M-AU",
        "script": (
            "Good afternoon, parents and swimmers. Sign-up for summer swimming lessons starts this Monday. Lessons are for children "
            "from five to twelve years old, and they take place on Tuesday and Thursday afternoons. Each class "
            "has only eight children, so please sign up early. You can put your name on the list at the front "
            "desk of the sports center. You can't sign up by phone. The cost is forty dollars for eight "
            "lessons. Children need to bring a towel and a swimming cap. See you at the pool!"
        ),
        "questions": [
            q("How can people sign up for the lessons?",
              "By calling the sports center",
              "By sending an email",
              "By paying at the pool",
              "By writing their name on a list",
              "D", "detail",
              "'You can put your name on the list at the front desk of the sports center. You can't sign up by "
              "phone.'"),
            q("Why should people sign up early?",
              "The classes are small.",
              "The price will go up.",
              "The pool closes in summer.",
              "Lessons start on Monday.",
              "A", "detail",
              "'Each class has only eight children, so please sign up early.' Monday is when sign-up starts."),
        ],
    },
    {
        "type": "announcement",
        "setting": "Listen to an announcement in a classroom.",
        "voice": "F-US",
        "script": (
            "Hello, everyone. Before you sit down, please listen. Our English lesson today is not in this room, "
            "because the heater here is broken and it's too cold. We are moving to Room 15 on the second floor, "
            "next to the computer room. Please take your books and your coats with you. We will start ten "
            "minutes late, at nine ten, so you have time to walk there. Tomorrow we will be back in our usual "
            "room. OK, let's go."
        ),
        "questions": [
            q("Why is the class moving to another room today?",
              "The room is too small.",
              "They need computers.",
              "The room is too cold.",
              "Another class is using it.",
              "C", "detail",
              "'The heater here is broken and it's too cold.' The new room is only next to the computer room."),
            q("What time will the lesson start today?",
              "At nine o'clock",
              "At nine fifteen",
              "At ten o'clock",
              "At nine ten",
              "D", "detail",
              "'We will start ten minutes late, at nine ten.' Fifteen is the number of the room."),
        ],
    },
]

LISTENING_UPPER = [
    lcr("M-AU", "I wouldn't hold your breath waiting for the registrar to reply.",
        "I can only hold it for a minute.",
        "I know. Last time it took them a month.",
        "The registrar's office is next to the bank.",
        "Take a deep breath before you start.",
        "B", "'Don't hold your breath' means do not expect it soon. B agrees from experience; A and D take the "
             "idiom literally."),
    lcr("F-US", "Of all the weeks to ask me for a favor, you had to pick this one.",
        "I picked it up on Monday, actually.",
        "Thanks, that's a weight off my mind.",
        "It was the best week of the whole term.",
        "Sorry, I had no idea you were so snowed under.",
        "D", "The speaker means she is far too busy to help. D apologizes; B wrongly treats the remark as "
             "agreement."),
    lcr("M-UK", "If it weren't for the lab fees, I'd have signed up for that course in a heartbeat.",
        "They are steep. Have you looked into the department grant?",
        "My heart races before every exam, too.",
        "Then I'm glad you signed up in time.",
        "The lab is free on Wednesday afternoons.",
        "A", "The speaker did not sign up, because of the cost. A sympathizes and suggests a solution; C "
             "misreads the conditional."),
    {
        "type": "conversation",
        "setting": "Listen to a conversation between two students.",
        "voices": {"Man": "M-US", "Woman": "F-UK"},
        "script": [
            ("Man", "So you're really going to spend the spring in Lisbon? I can't help thinking it's a glorified "
                    "vacation."),
            ("Woman", "That's a bit harsh. I'll be taking four courses, and two of them are taught in "
                      "Portuguese."),
            ("Man", "Sure, but will any of it count toward your degree? My cousin went abroad and ended up "
                    "graduating a semester late."),
            ("Woman", "I checked. Three of the four transfer. And frankly, there's more to university than "
                      "ticking boxes."),
            ("Man", "Easy to say until you see the bill."),
            ("Woman", "The exchange fee's the same as our tuition. It's the flights that sting. Look, I'm not "
                      "saying it's for everyone, but you might surprise yourself."),
            ("Man", "Maybe. I'll believe it when I see your transcript."),
        ],
        "questions": [
            q('What does the man mean when he calls the semester abroad "a glorified vacation"?',
              "He thinks the woman has earned a holiday.",
              "He believes Lisbon is too expensive to live in.",
              "He doubts that it has much academic value.",
              "He wishes that he could travel with her.",
              "C", "function",
              "A 'glorified vacation' is a holiday made to sound more serious than it is; he goes on to ask "
              "whether any of it will count toward her degree."),
            q("What can be inferred about the man at the end of the conversation?",
              "He is still not convinced by the woman's arguments.",
              "He has decided to apply for the same program.",
              "He agrees that flights are the biggest problem.",
              "He plans to check the woman's grades for her.",
              "A", "inference",
              "'Maybe. I'll believe it when I see your transcript' shows that he remains skeptical."),
        ],
    },
    {
        "type": "announcement",
        "setting": "Listen to an announcement from a university's graduate school.",
        "voice": "F-AU",
        "script": (
            "Attention, all master's and doctoral students who plan to graduate this spring. The Graduate "
            "School's final deadline for submitting a thesis is April twenty-fourth, and I should stress that no "
            "extensions will be granted. Before you can submit, however, your document must pass a format "
            "check, which covers margins, page numbering, and the reference list. That check takes up to five "
            "working days, and in our experience roughly half of all theses are sent back for corrections at "
            "least once. So, realistically, if you haven't uploaded your draft for checking by the tenth, "
            "you're cutting it very fine. The format guidelines are on the Graduate School website."
        ),
        "questions": [
            q("What is the main purpose of the announcement?",
              "To announce that a deadline has been extended",
              "To urge students to start a required check early",
              "To explain how a finished thesis will be graded",
              "To introduce new rules for reference lists",
              "B", "purpose",
              "The speaker explains that the format check takes time and often has to be repeated, and warns "
              "students not to leave it until after the tenth."),
            q("What does the speaker imply about students who upload a draft after the tenth?",
              "They will have to pay a late fee.",
              "Their format check will be refused.",
              "They may run out of time for corrections.",
              "They can ask for a short extension.",
              "C", "inference",
              "The check takes up to five working days and about half of theses come back for corrections, so "
              "later than the tenth is 'cutting it very fine' for a deadline with no extensions."),
        ],
    },
    {
        "type": "talk",
        "subject": "Astronomy",
        "voice": "M-UK",
        "script": (
            "So here's the obvious problem. A black hole, by definition, gives off no light. Its gravity is so "
            "strong that nothing that falls in can get back out, not even light itself. So how on earth do you "
            "find something you can't see? The short answer is, you watch what it does to its surroundings. One "
            "approach is to track stars. At the center of our galaxy, astronomers spent years following a "
            "handful of stars that whip around an empty-looking point at tremendous speeds. From those orbits, "
            "they worked out that the invisible object must have the mass of about four million suns, packed "
            "into a tiny region. Nothing else we know of fits that description. A second clue is X-rays. When a "
            "black hole pulls gas off a neighboring star, that gas doesn't drop straight in. It spirals, and as "
            "it does, it heats up to millions of degrees and glows in X-rays. And then there's a much more "
            "recent method, which, frankly, still gives me goosebumps. In twenty fifteen, detectors picked up "
            "gravitational waves, tiny ripples in space itself, produced when two black holes collided more "
            "than a billion years ago. So notice the pattern here. In none of these cases are we observing the "
            "black hole directly. We're inferring it, the way you'd infer wind from the movement of the trees."
        ),
        "questions": [
            q("What is the talk mainly about?",
              "How black holes form when large stars collapse",
              "Why the center of our galaxy contains so many stars",
              "How X-ray telescopes were first developed",
              "How scientists find objects that cannot be seen directly",
              "D", "main_idea",
              "The professor asks 'how on earth do you find something you can't see?' and describes three "
              "indirect methods."),
            q("How did astronomers work out the mass of the object at the center of our galaxy?",
              "By studying the orbits of stars near it",
              "By measuring the X-rays coming from it",
              "By counting the stars that had fallen into it",
              "By recording gravitational waves from it",
              "A", "detail",
              "'From those orbits, they worked out that the invisible object must have the mass of about four "
              "million suns.'"),
            q("What is the professor's attitude toward the detection of gravitational waves?",
              "He considers it unreliable.",
              "He thinks it has been overpraised.",
              "He finds it thrilling.",
              "He regards it as routine.",
              "C", "attitude",
              "He says the method 'frankly, still gives me goosebumps', an expression of excitement."),
            q("Why does the professor mention wind and trees?",
              "To explain how gas moves around a black hole",
              "To illustrate how an unseen thing is known by its effects",
              "To describe the conditions needed for observation",
              "To suggest that black holes are common in nature",
              "B", "function",
              "'We're inferring it, the way you'd infer wind from the movement of the trees': wind is invisible, "
              "but its effects are not."),
        ],
    },
    {
        "type": "talk",
        "subject": "Philosophy",
        "voice": "F-US",
        "script": (
            "I want to start today with a ship. According to the ancient writer Plutarch, the people of Athens "
            "kept the ship of their hero Theseus for centuries as a kind of monument. Wood rots, of course, so "
            "whenever a plank decayed, they swapped in a new one. Now suppose that, in the end, not a single "
            "original plank is left. Is it still the ship of Theseus? Hands up if you say yes. Hmm, most of "
            "you. OK. Now let me spoil your confidence. In the seventeenth century, Thomas Hobbes added a "
            "twist. Suppose somebody had quietly collected every old plank as it was removed, and then put them "
            "all back together. Now there are two ships. Which one is the real one? If you think a thing is "
            "just its material, you have to pick the rebuilt pile of old wood. If you think what matters is a "
            "continuous history, an unbroken story, you'll stay with the ship that was repaired. And notice, "
            "this isn't really about boats. Many of the cells in your body have been replaced since you were a "
            "child, and yet you'd insist you're the same person. I'm not going to hand you a solution, by the "
            "way. Philosophers have been arguing over this one for two thousand years, and I'd be suspicious of "
            "anyone who tells you it's settled."
        ),
        "questions": [
            q("What is the talk mainly about?",
              "Whether a thing stays the same when its parts change",
              "The methods ancient Athenians used to repair ships",
              "A disagreement between two historians about Theseus",
              "The reasons the cells of the body are replaced",
              "A", "main_idea",
              "The professor asks whether a ship whose planks have all been replaced is 'still the ship of "
              "Theseus' and then extends the question."),
            q("What did Hobbes add to the original story?",
              "The claim that the ship had never existed",
              "The idea that the ship was finally lost at sea",
              "The idea that the old planks were rebuilt into a ship",
              "The fact that the new planks were a different wood",
              "C", "detail",
              "'Suppose somebody had quietly collected every old plank as it was removed, and then put them all "
              "back together. Now there are two ships.'"),
            q("Why does the professor mention the cells of the human body?",
              "To explain why wood decays faster than living tissue",
              "To prove that people become different every few years",
              "To correct a mistake in Plutarch's account",
              "To show that the puzzle also applies to people",
              "D", "function",
              "'This isn't really about boats': our cells are replaced, 'and yet you'd insist you're the same "
              "person'."),
            q("What does the professor imply about the puzzle?",
              "Hobbes solved it in the seventeenth century.",
              "It has no generally accepted answer.",
              "Most students already know the right answer.",
              "Philosophers have lost interest in it.",
              "B", "inference",
              "'Philosophers have been arguing over this one for two thousand years, and I'd be suspicious of "
              "anyone who tells you it's settled.'"),
        ],
    },
]

# ===============================================================================================================
# WRITING
# ===============================================================================================================
WRITING = {
    "build": [
        build("Why didn't you answer when I called last night?",
              "I did not hear my phone ring.",
              ["I", "did not", "hear", "my phone", "ring"], "negation"),
        build("The new student café finally opened this morning.",
              "Have you tried the coffee there yet?",
              ["have", "you", "tried", "the coffee", "there yet"], "yes_no_question"),
        build("I'm catching the 6:40 to the airport tomorrow.",
              "Which platform does the train leave from?",
              ["which platform", "does", "the train", "leave from"], "wh_question", extra="do"),
        build("Are you going to buy the new edition of the textbook?",
              "It costs almost twice as much as the used one.",
              ["it costs", "almost", "twice as much", "as", "the used one"], "comparison"),
        build("I have to return all these library books before five.",
              "Would you like me to take a few?",
              ["would", "you like", "me", "to take", "a few"], "infinitive"),
        build("Is the poster session still in the seminar room?",
              "It has already been moved to the main hall.",
              ["it has", "already been", "moved", "to", "the main hall"], "passive"),
        build("The hiking club is camping by the lake next weekend.",
              "Do you know whether we need to bring our own tents?",
              ["whether", "we", "need", "to bring", "our own tents"], "embedded_question",
              prefix="Do you know", extra="needs"),
        build("Did you enjoy the documentary on ocean currents?",
              "It was the best film that I have seen this year.",
              ["it was", "the best film", "that", "I have", "seen"], "perfect", suffix="this year."),
        build("How do I apply to change my lab section?",
              "The form that you need has to be signed by your advisor.",
              ["that", "you need", "has to be", "signed", "by your advisor"], "relative_clause",
              prefix="The form", extra="have to be"),
        build("Do you think I can still join the photography workshop?",
              "You will not get a place unless somebody drops out.",
              ["you", "will not", "get", "a place", "unless", "somebody"], "conditional",
              suffix="drops out."),
    ],
    "email": {
        "scenario": (
            "You are a student who drives to campus. Yesterday you parked in Lot C, where your semester permit "
            "allows you to park, and the permit was clearly displayed inside your car. When you returned after "
            "class, you found a $40 ticket for parking without a permit. You believe the ticket was given by "
            "mistake. You decide to write to Mr. Deng at the Parking Office."
        ),
        "to": "Mr. Deng",
        "subject": "Parking ticket given by mistake",
        "bullets": [
            "Describe what happened when you parked on campus.",
            "Explain why you think the ticket is a mistake.",
            "Ask Mr. Deng to cancel the ticket.",
        ],
        "model": """
Dear Mr. Deng,

I am writing about a parking ticket that I received yesterday, March 12. I parked my car in Lot C at about 9:30 a.m. and went to my classes. When I came back at 2:00 p.m., I found ticket number 30417 under the wiper. It says that I parked without a permit.

I believe this is a mistake. I bought a semester permit for Lot C in January, and it was hanging from the mirror, where it always is. I have attached a photo of the permit, which I took as soon as I found the ticket, and a copy of my payment receipt.

Could you please check your records and cancel the ticket? If you need any other information, or if I should bring the permit to your office, please let me know.

Thank you for your time.

Sincerely,
Gabriela Montoya
""".strip(),
    },
    "discussion": {
        "course": "political science",
        "professor": {
            "name": "Dr. Estrada",
            "post": (
                "This week we are studying how citizens take part in elections. In most democracies, voting is "
                "a choice, and in some elections fewer than half of the people who are allowed to vote actually "
                "do so. A number of countries, including Australia and Belgium, take a different approach: "
                "citizens are required by law to vote, and those who do not may have to pay a small fine. What "
                "is your view? Should voting in national elections be compulsory? Why or why not?"
            ),
        },
        "students": [
            {
                "name": "Nikolai",
                "post": (
                    "I support compulsory voting. When everyone has to vote, the result reflects the whole "
                    "population, not just the people who are most interested in politics or who have time to "
                    "go. Leaders then have to pay attention to every group, including young people and those "
                    "with low incomes, who often stay home."
                ),
            },
            {
                "name": "Zainab",
                "post": (
                    "I disagree. In my opinion, the right to vote includes the right not to vote. If people are "
                    "forced to go, many will choose without knowing anything about the candidates, just to "
                    "avoid a fine. I think it is better to make voting easier, for example by letting people "
                    "vote by mail or on a weekend."
                ),
            },
        ],
        "model": (
            "I believe that voting should remain voluntary, although I understand Nikolai's point that a higher "
            "turnout makes a result more representative. As Zainab says, a vote that is cast only to avoid a "
            "fine is not a real opinion, and it may even make the result less meaningful. I would add another "
            "reason: a law is only useful if it can be enforced fairly. Checking millions of citizens and "
            "collecting small fines costs money, and the people who are fined are often those who had the most "
            "difficulty reaching a polling place. Instead of punishing people, governments should remove the "
            "obstacles that keep them away. Election day could be a public holiday, registration could be "
            "automatic, and schools could teach students how elections work. If voting is convenient and people "
            "understand why it matters, most of them will take part without being forced."
        ),
    },
}

# ===============================================================================================================
# SPEAKING
# ===============================================================================================================
SPEAKING = {
    "repeat": {
        "scenario": (
            "You are learning how to assist the teacher of a cooking class. Listen to the teacher and repeat "
            "what she says. Repeat only once."
        ),
        "picture": "A teaching kitchen with six cooking stations, aprons hanging by the door and an oven with "
                   "a timer.",
        "voice": "F-AU",
        "sentences": [
            "Today we are baking fresh bread rolls.",
            "Every student needs a clean apron.",
            "The sharp knives are kept in the drawer under the sink.",
            "Put a damp cloth under each cutting board so it doesn't slip.",
            "Measure the flour and sugar carefully before you mix them.",
            "When the timer rings, take the bread out of the oven and let it cool on the rack.",
            "Before the students go home, check that every stove is off and that the floor has been swept.",
        ],
    },
    "interview": {
        "topic": "volunteering and community",
        "scenario": (
            "You have agreed to take part in a research study about volunteering and community. You will have a "
            "short online interview with a researcher. The researcher will ask you some questions."
        ),
        "voice": "M-US",
        "questions": [
            {
                "kind": "event",
                "q": (
                    "Thanks for making time for this interview. First, I'd like to hear about your own "
                    "experience. Please tell me about a time when you helped someone in your community or took "
                    "part in a volunteer activity. What did you do, and how did you feel afterward?"
                ),
                "model": (
                    "Last spring, I took part in a clean-up day along the river near my home. A local group "
                    "organized it, and about thirty people came. We spent the morning picking up plastic "
                    "bottles and old bags, and my job was to sort what could be recycled. It was harder than I "
                    "expected, because it was hot and my back hurt after two hours. But afterward I felt proud. "
                    "When I walked along the river the next week, the path looked completely different, and I "
                    "knew I had helped a little. I also met two neighbors that I had never spoken to before, "
                    "and we still greet each other."
                ),
            },
            {
                "kind": "life",
                "q": (
                    "Some people like to volunteer as part of a large, organized group, while others prefer to "
                    "help in small, informal ways, such as assisting a neighbor. Which do you prefer, and why?"
                ),
                "model": (
                    "I prefer to help in small, informal ways. The main reason is my schedule. I study during "
                    "the day and work some evenings, so I cannot promise to be somewhere every Saturday "
                    "morning. But I can carry shopping for the older woman who lives next door, or help my "
                    "friend's younger brother with his math homework when I have a free hour. I also like that "
                    "I can see the result immediately and that I know the person I am helping. Large "
                    "organizations do important work, of course, and maybe I will join one when my hours are "
                    "more regular. For now, small things suit me better."
                ),
            },
            {
                "kind": "opinion",
                "q": (
                    "Let's turn to your opinion now. It is sometimes said that volunteering mainly benefits the "
                    "volunteer, for example because it looks good on a job application, rather than the "
                    "community. Do you agree? Why or why not?"
                ),
                "model": (
                    "I don't really agree. It is true that some people volunteer because they want something to "
                    "write on a job application, and we should not pretend otherwise. But the community still "
                    "benefits. If someone spends a Saturday serving meals, the people who eat those meals are "
                    "helped, whatever the reason was. In addition, people often start for selfish reasons and "
                    "continue for better ones. A friend of mine began tutoring children because her scholarship "
                    "required it, and two years later she is still doing it because she enjoys it. So in my "
                    "view, the motive matters much less than the work that actually gets done."
                ),
            },
            {
                "kind": "opinion",
                "q": (
                    "Here is my last question. In many towns, volunteers do jobs such as cleaning parks or "
                    "running the local library. Should work like this be left to volunteers, or should local "
                    "governments pay people to do it? Why?"
                ),
                "model": (
                    "I think it should be a mix of both. Basic services, like collecting trash and keeping "
                    "parks safe, are the government's job, and people already pay taxes for them. If a town "
                    "depends on volunteers for essential work, the richer neighborhoods, where people have more "
                    "free time, will end up cleaner than the poorer ones, and that is not fair. However, "
                    "volunteers can add something extra. For example, residents can plant flowers, paint a "
                    "wall, or organize a street party, and these activities also help neighbors get to know "
                    "each other. So the town should guarantee the basics and then support volunteers with tools "
                    "and small grants instead of replacing them."
                ),
            },
        ],
    },
}

FORM = {
    "number": 9,
    "theme": "The weekend and the rewiring brain; plant defenses, prices ending in 99, black holes, the ship of "
             "Theseus",
    "reading": {"router": READING_ROUTER, "lower": READING_LOWER, "upper": READING_UPPER},
    "listening": {"router": LISTENING_ROUTER, "lower": LISTENING_LOWER, "upper": LISTENING_UPPER},
    "writing": WRITING,
    "speaking": SPEAKING,
}
