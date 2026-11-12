"""Digital SAT — free half mock (sat-free).

One Reading and Writing module (27 questions, 32 minutes) and one Math module (22 questions, 35 minutes):
half of the 98-question test, with no adaptive second modules and no break. Question IDs start with
"sat-rw" and "sat-math" and the Math stage ID starts with "sat-math", because the site's report sections,
calculator tool and math tutor key on those prefixes. Five Math items take a typed numerical answer.
Raw scores only; no 200–800 scaled score.
"""

from __future__ import annotations

from fractions import Fraction as F

SLUG = "sat-free"
CS, II, SE, EI = "Craft and Structure", "Information and Ideas", "Standard English Conventions", "Expression of Ideas"
A, M, D, G = "Algebra", "Advanced Math", "Problem-Solving and Data Analysis", "Geometry and Trigonometry"
WORD = "Which choice completes the text with the most logical and precise word or phrase?"
CONVENTION = "Which choice completes the text so that it conforms to the conventions of Standard English?"
TRANSITION = "Which choice completes the text with the most logical transition?"


def item(qid: str, domain: str, passage: str, prompt: str, correct: str, wrong: list[str], explanation: str, position: int) -> dict:
    options = list(wrong)
    options.insert(position, correct)
    assert len(options) == 4 and len(set(options)) == 4, qid
    question = {"id": qid, "domain": domain, "kind": "choice", "prompt": prompt, "options": options,
                "answers": [correct], "explanation": explanation}
    if passage:
        question["passage"] = passage
    return question


def numeric(qid: str, domain: str, prompt: str, answer: str, explanation: str) -> dict:
    return {"id": qid, "domain": domain, "kind": "number", "prompt": prompt, "answers": [answer], "explanation": explanation}


# Correct-answer positions (0 = A) chosen so each letter is used about equally.
RW_POSITIONS = [1, 0, 1, 0, 2, 3, 0, 3, 2, 1, 2, 0, 3, 1, 1, 3, 2, 0, 2, 2, 1, 3, 0, 2, 1, 0, 3]


def reading_writing() -> list[dict]:
    rows = [
        (CS, "Engineers who design bridges for earthquake zones cannot rely on strength alone. A structure that is too rigid may crack when the ground moves, so designers often include joints and bearings that allow parts of the bridge to ______ slightly without breaking.",
         WORD, "shift", ["collapse", "vanish", "harden"],
         "The text contrasts rigidity with flexibility: the joints let parts of the bridge move, or shift, a little. Collapsing or vanishing would be failures, and hardening is the opposite of what the joints allow."),
        (CS, "The novelist's early reviewers called her prose plain, but later critics argued that its apparent simplicity was ______: each short sentence, they noted, had been carefully revised to carry several layers of meaning.",
         WORD, "deceptive", ["accidental", "unfinished", "repetitive"],
         "The simplicity only seemed simple; it hid careful, layered work. That makes it deceptive. 'Carefully revised' rules out accidental and unfinished."),
        (CS, "Although the committee had been expected to reject the proposal outright, its final report was more ______, praising the plan's goals while recommending changes to its budget.",
         WORD, "measured", ["hostile", "secretive", "enthusiastic"],
         "'Although' signals a contrast with outright rejection. A report that praises some parts and asks for changes in others is balanced, or measured, not hostile; the requested changes show it was not simply enthusiastic."),
        (CS, "In the 1950s, many cities removed their tram lines to make room for cars. In recent decades, several of those cities have ______ that decision, building new light-rail networks along routes where trams once ran.",
         WORD, "reversed", ["predicted", "concealed", "imitated"],
         "Building rail where trams were removed undoes the earlier choice, so the cities reversed it."),
        (CS, "Honeybees share the location of food through a 'waggle dance': a returning forager moves in a figure-eight pattern, and the angle of the straight middle run indicates the direction of the food relative to the sun. Researchers once assumed that the dance was the colony's main source of information about food. However, when experiments made the dances impossible to follow, colonies in some environments gathered food nearly as well as colonies whose dances could be read.",
         "Which choice best describes the overall structure of the text?",
         "It describes a behaviour, presents an assumption about the behaviour's importance, and then reports a finding that complicates that assumption.",
         ["It compares the dances of two bee species and explains why one is more accurate.",
          "It proposes a new theory of bee communication and then rejects every earlier study.",
          "It describes an experiment in detail and then explains how the experiment was funded."],
         "The text explains the dance, states what researchers 'once assumed', and then introduces evidence with 'However' that weakens that assumption."),
        (CS, "Mara had walked past the old clock shop every morning for years without once looking in. On the day it closed, she stopped. Through the dusty window she could see the empty hooks where the clocks had hung, and for the first time she noticed how quiet the street had become.",
         "Which choice best states the main purpose of the text?",
         "To show a character becoming aware of something she had long overlooked",
         ["To explain why the clock shop went out of business", "To describe the history of the street in detail", "To argue that old shops should be protected by law"],
         "Mara ignores the shop for years and only notices the loss, and the new quiet, when it closes. The text gives no reasons for the closure, no history and no argument."),
        (CS, "Text 1\nSome urban planners argue that adding lanes to busy highways reduces traffic jams. More space, they say, lets more cars move at once, so journeys become faster.\n\nText 2\nStudies of several cities have found that new highway lanes are often filled within a few years. When driving becomes easier, people make trips they previously avoided, and congestion returns. This effect, known as induced demand, suggests that wider roads alone rarely solve traffic problems.",
         "Based on the texts, how would the author of Text 2 most likely respond to the planners described in Text 1?",
         "By arguing that the planners overlook how people change their driving habits when roads are widened",
         ["By agreeing that wider highways permanently end traffic jams", "By claiming that cities should remove all of their highways", "By noting that the planners' proposal would cost too much"],
         "Text 2's point is that easier driving creates new trips, which the planners' reasoning ignores. It never discusses cost or removing highways."),
        (II, "Farmers in dry regions often face a difficult choice: water crops heavily and risk running short later in the season, or water lightly and accept smaller harvests. In one study, farmers in an arid region used soil sensors that report moisture at several depths. These farmers applied about a fifth less water than nearby farmers without sensors, yet their harvests were nearly the same size.",
         "Which choice best states the main idea of the text?",
         "Soil sensors may help farmers use less water without reducing their harvests.",
         ["Farmers in dry regions should stop growing crops that need water.", "Soil sensors are too expensive for most farmers to use.", "Heavy watering always produces the largest harvests."],
         "The study's result is less water with almost the same harvest. Nothing in the text discusses cost, and the result contradicts 'always'."),
        (II, "In 2019, volunteers began counting the bird species that visited a city park each weekend. In the first year they recorded 41 species. After the park replaced part of its lawn with native shrubs and flowering plants, the yearly count rose to 58 species within three years, including several insect-eating birds that had never been recorded there.",
         "According to the text, what happened after the park changed its plantings?",
         "More bird species were recorded in the park.",
         ["The volunteers stopped counting birds.", "Insect-eating birds disappeared from the park.", "The remaining lawn attracted more species than the shrubs did."],
         "The count rose from 41 to 58 species after the change. The text says new insect-eating birds appeared, not that they left."),
        (II, "In the poem 'The Ford', the speaker returns as an adult to a stream that she crossed every day as a child. A student claims that the poem uses images of water to suggest that time has changed the speaker.",
         "Which quotation from the poem would most effectively illustrate the student's claim?",
         "\"The stream that used to hold my face / now hurries it away downstream.\"",
         ["\"The stones are grey, the sky is wide, / the path runs on along the side.\"", "\"I left my boots beside the door / the way I always did before.\"", "\"My brother laughed, and so did I, / and neither of us asked him why.\""],
         "Only this quotation uses water, and the image of the reflection once held still and now carried away suggests change over time."),
        (II, "A researcher recorded the average weekly study time and the average score on a final test for four groups of students.\n\nGroup | Weekly study (hours) | Average score\nW | 4 | 68\nX | 6 | 74\nY | 8 | 81\nZ | 10 | 79\n\nThe researcher concluded that scores generally rose with study time but that the group that studied most did not have the highest average score.",
         "Which choice best describes data from the table that support the researcher's conclusion?",
         "Group Y had a higher average score than Group Z, although Group Z studied more hours each week.",
         ["Group W studied the fewest hours and had the lowest average score.", "Group X studied six hours each week.", "Every group had an average score above 60."],
         "The second half of the conclusion needs the top-study group (Z, 10 hours) to score below another group: Y scored 81 and Z scored 79. Choice about Group W supports only the first half."),
        (II, "Archaeologists studying an ancient inland trading town found large numbers of fish bones, although the town was more than 200 kilometres from the nearest coast. The bones came from sea fish rather than river fish, and there is no evidence that the town's residents travelled to the coast themselves. The archaeologists therefore concluded that ______",
         "Which choice most logically completes the text?",
         "the residents probably obtained sea fish from traders.",
         ["the town was originally built on the coast.", "the residents did not eat fish at all.", "river fish were more popular in the town than sea fish."],
         "Sea fish reached a town whose people did not travel to the sea, so someone else brought them: trade fits the evidence. The bones themselves contradict the other choices."),
        (II, "A biologist observed that a species of desert lizard is active in the early morning and late afternoon but hides under rocks around midday. When she measured the ground temperature, she found that it often rose above the highest body temperature the lizards can safely tolerate between late morning and early afternoon.",
         "Which choice best states a conclusion that the biologist's findings support?",
         "The lizards probably avoid midday activity to keep from overheating.",
         ["The lizards prefer cold climates to warm ones.", "Rocks are warmer than open ground at midday.", "The lizards are active only at night."],
         "The lizards hide exactly when the ground exceeds their safe temperature, which suggests the hiding prevents overheating. The text says they are active in the morning and afternoon."),
        (II, "Grandfather never wrote down his recipes. When I asked him how much salt to add to the soup, he would taste it, frown and say, 'Until it tells you it's ready.' For years I thought he was teasing me. Only after I began cooking for my own family did I understand that he had been teaching me to pay attention rather than to measure.",
         "Based on the text, what does the narrator eventually realise about the grandfather's advice?",
         "It was meant to teach careful observation.",
         ["It was a joke with no real meaning.", "It showed that he had forgotten his recipes.", "It was meant to discourage the narrator from cooking."],
         "The final sentence states the realisation: the advice taught the narrator to pay attention rather than measure."),
        (SE, "The museum's new exhibition features more than 300 ______ many of them have never been displayed before.",
         CONVENTION, "objects;", ["objects,", "objects", "objects, which"],
         "Two independent clauses need a semicolon (or a comma with a conjunction). A comma alone creates a comma splice; 'which' leaves 'many of them have…' without a proper structure."),
        (SE, "Each of the paintings in the collection ______ been restored by the museum's conservation team.",
         CONVENTION, "has", ["have", "are", "were"],
         "The subject is 'Each', which is singular, so the verb is 'has'. 'Paintings' is inside the prepositional phrase."),
        (SE, "After studying the data for several weeks, ______",
         CONVENTION, "the team concluded that the model needed revision.",
         ["the team's conclusion was that the model needed revision.", "the model was revised by the team.", "revision of the model was the team's conclusion."],
         "The opening phrase describes who studied the data, so 'the team' must come right after the comma. Otherwise the conclusion, the model or the revision seems to have studied the data."),
        (SE, "The two scientists published ______ findings in the same issue of the journal.",
         CONVENTION, "their", ["they're", "there", "its"],
         "A plural possessive pronoun is needed for 'the two scientists': their. 'They're' means 'they are', and 'its' is singular."),
        (SE, "Mount Kilimanjaro, the highest mountain in Africa, ______ nearly 5,900 metres above sea level.",
         CONVENTION, "rises", ["rise", "rising", "have risen"],
         "The singular subject 'Mount Kilimanjaro' needs a singular finite verb; the appositive between the commas does not change it. 'Rising' is not a finite verb."),
        (SE, "The recipe requires only three ______ flour, water and salt.",
         CONVENTION, "ingredients:", ["ingredients;", "ingredients, which", "ingredients, they are"],
         "A colon introduces a list after a complete clause. A semicolon must join two independent clauses, 'which' would need a verb of its own, and 'ingredients, they are' is a comma splice."),
        (SE, "Last summer, the city ______ a programme that offers free swimming lessons to children.",
         CONVENTION, "launched", ["launches", "will launch", "is launching"],
         "'Last summer' sets the action in the past, so the simple past 'launched' is needed."),
        (SE, "The researchers counted the seabirds' nests and found that the ______ eggs were laid weeks earlier than in previous years.",
         CONVENTION, "birds'", ["bird's", "birds", "birds's"],
         "The eggs belong to many birds, so the plural possessive 'birds'' is correct."),
        (EI, "Concrete is made from cement, water and sand, and sand seems to be everywhere. ______ not all sand is suitable: the smooth, rounded grains of desert sand do not lock together well, so builders usually rely on sand from rivers and quarries.",
         TRANSITION, "However,", ["Therefore,", "For example,", "Similarly,"],
         "The second sentence limits the first ('sand seems to be everywhere' versus 'not all sand is suitable'), so a contrast is needed."),
        (EI, "Researchers first measured the height of each seedling. ______ they moved half of the seedlings into a shaded greenhouse and left the rest in full sun.",
         TRANSITION, "Next,", ["In contrast,", "For instance,", "Nevertheless,"],
         "The sentences describe steps in order: first measuring, then moving the seedlings."),
        (EI, "Many people assume that cacti need very little care. ______ cacti grown indoors more often die from too much water than from too little.",
         TRANSITION, "In fact,", ["Similarly,", "Meanwhile,", "Instead,"],
         "The second sentence adds a striking detail that supports and sharpens the first: the usual danger is over-care. 'In fact' introduces that emphasis."),
        (EI, "While researching a topic, a student has taken the following notes:\n• The Orkhon Valley is in central Mongolia.\n• It was added to UNESCO's World Heritage List in 2004.\n• The valley contains archaeological remains from many centuries, including the ruins of Kharkhorum.\n• Kharkhorum was the capital of the Mongol Empire in the 13th century.",
         "The student wants to emphasise the historical importance of the Orkhon Valley. Which choice most effectively uses relevant information from the notes to accomplish this goal?",
         "The Orkhon Valley, a UNESCO World Heritage site since 2004, contains the ruins of Kharkhorum, the 13th-century capital of the Mongol Empire.",
         ["The Orkhon Valley is a valley in central Mongolia.", "In 2004, UNESCO added several new places to its list.", "Kharkhorum is mentioned in the student's notes."],
         "Only this choice links the valley to both its World Heritage status and an imperial capital, which shows its historical importance."),
        (EI, "While researching a topic, a student has taken the following notes:\n• Solar panels convert sunlight into electricity.\n• Panels produce less electricity when they become hot.\n• In one test, panels were installed above a canal.\n• The water below cooled the panels, and they produced slightly more electricity than similar panels on land.\n• Covering the canal also reduced evaporation.",
         "The student wants to present a benefit of placing solar panels above canals. Which choice most effectively uses relevant information from the notes to accomplish this goal?",
         "In one test, solar panels above a canal produced slightly more electricity than panels on land because the water kept them cooler.",
         ["Solar panels convert sunlight into electricity.", "Solar panels produce less electricity when they become hot.", "Researchers once installed some panels in a test."],
         "Only this choice states a benefit of the canal location and the reason for it. The others give background without the benefit."),
    ]
    assert len(rows) == 27 and len(RW_POSITIONS) == 27
    return [item(f"sat-rw-free-{i + 1}", *row, RW_POSITIONS[i]) for i, row in enumerate(rows)]


def checks() -> None:
    assert (11 + 7) / 3 == 6
    assert (10 - 4) / (2 - 0) == 3
    assert F(18, 60) == F(3, 10)
    assert (900 - 80) // 20 == 41
    assert -2 * 3 + 7 == 1
    assert 2 * (-2) ** 2 - 3 == 5
    assert 40 * 0.85 == 34
    x, y = 8, 4
    assert x + y == 12 and x - y == 4 and x * y == 32
    assert 6**2 - 4 * 9 == 0
    assert (12**2 + 5**2) ** 0.5 == 13
    assert 180 - 48 - 67 == 65
    assert (17**2 - 8**2) ** 0.5 == 15
    assert 15000 * 120 // 200 == 9000
    assert (7 + 2) ** 0.5 == 3


MATH_POSITIONS = [1, None, 2, None, 0, 3, None, 1, 2, 0, 3, 1, 2, 3, 0, 1, 2, None, 3, 1, 0, None]


def math() -> list[dict]:
    rows = [
        (A, "If 3x − 7 = 11, what is the value of x?", "6", ["4", "5", "18"], "Add 7 to both sides: 3x = 18. Divide by 3: x = 6."),
        (A, "A line in the xy-plane passes through the points (0, 4) and (2, 10). What is the slope of the line?", "3", None,
         "Slope = (10 − 4)/(2 − 0) = 6/2 = 3."),
        (M, "Which expression is equivalent to (x + 5)(x − 3)?", "x² + 2x − 15", ["x² − 2x − 15", "x² + 2x + 15", "x² − 15"],
         "Expand: x² − 3x + 5x − 15 = x² + 2x − 15."),
        (D, "A shirt regularly costs $40. During a sale, its price is reduced by 15%. What is the sale price of the shirt, in dollars?", "34", None,
         "The discount is 0.15 × 40 = 6 dollars, so the sale price is 40 − 6 = 34. Equivalently, 0.85 × 40 = 34."),
        (A, "A gym charges a one-time joining fee of $40 plus $25 per month. Which equation gives the total cost C, in dollars, of a membership for m months?",
         "C = 25m + 40", ["C = 40m + 25", "C = 65m", "C = 25(m + 40)"],
         "The monthly charge is multiplied by the number of months, and the one-time fee is added once: C = 25m + 40."),
        (G, "In a triangle, two of the angles measure 48° and 67°. What is the measure, in degrees, of the third angle?", "65", ["55", "75", "115"],
         "The angles of a triangle add to 180°: 180 − 48 − 67 = 65. 115 is the sum of the two given angles."),
        (M, "The function f is defined by f(x) = 2x² − 3. What is the value of f(−2)?", "5", None,
         "f(−2) = 2(−2)² − 3 = 2(4) − 3 = 5. Squaring −2 gives a positive 4."),
        (A, "If 2(x + 3) = 5x − 9, what is the value of x?", "5", ["1", "3", "15"],
         "Expand: 2x + 6 = 5x − 9. Then 15 = 3x, so x = 5."),
        (D, "A school club has 12 students in grade 9, 18 in grade 10, 15 in grade 11 and 15 in grade 12. If one club member is chosen at random, what is the probability that the student is in grade 10?",
         "3/10", ["1/4", "1/3", "3/7"],
         "There are 12 + 18 + 15 + 15 = 60 members, and 18 are in grade 10: 18/60 = 3/10."),
        (M, "What are the solutions of the equation x² − 7x + 10 = 0?", "2 and 5", ["−2 and −5", "1 and 10", "−2 and 5"],
         "Factor: (x − 2)(x − 5) = 0, so x = 2 or x = 5. Check: the solutions add to 7 and multiply to 10."),
        (A, "Which of the following points lies on the line y = −2x + 7?", "(3, 1)", ["(1, 3)", "(2, 4)", "(−1, 5)"],
         "Substitute x = 3: y = −6 + 7 = 1. For (1, 3), y would be 5; for (2, 4), 3; for (−1, 5), 9."),
        (G, "A rectangle has a length of 12 and a width of 5. What is the length of a diagonal of the rectangle?", "13", ["7", "17", "60"],
         "The diagonal is the hypotenuse of a right triangle with legs 12 and 5: √(144 + 25) = √169 = 13."),
        (A, "If x + y = 12 and x − y = 4, what is the value of xy?", "32", ["12", "16", "48"],
         "Adding the equations gives 2x = 16, so x = 8 and y = 4. Then xy = 32."),
        (M, "A population of bacteria starts at 200 and triples every hour. Which function gives the population P after t hours?",
         "P(t) = 200(3)ᵗ", ["P(t) = 200 + 3t", "P(t) = 3(200)ᵗ", "P(t) = 200(1/3)ᵗ"],
         "Tripling is repeated multiplication by 3, starting from 200: P(t) = 200 · 3ᵗ. Adding 3t would be linear growth."),
        (D, "A data set of 8 values has a median of 21. If 4 is added to each value, what is the median of the new data set?", "25", ["21", "29", "84"],
         "Adding the same number to every value shifts every value, and therefore the median, by that number: 21 + 4 = 25."),
        (A, "The equation y = 0.5x + 12 models the height y, in centimetres, of a plant x days after it was first measured. What is the best interpretation of 0.5 in this context?",
         "The plant grows 0.5 centimetre each day.", ["The plant was 0.5 centimetre tall when first measured.", "The plant grows for 0.5 day.", "The plant grows 12 centimetres each day."],
         "0.5 is the slope: the change in height for each additional day. 12 is the height when x = 0."),
        (M, "The function g is defined by g(x) = (x − 4)² + 1. What is the minimum value of g(x)?", "1", ["−4", "4", "17"],
         "A square is never negative, so (x − 4)² is smallest, 0, when x = 4. Then g(4) = 1."),
        (A, "A delivery van can carry at most 900 kilograms, including the driver. The driver weighs 80 kilograms and each box weighs 20 kilograms. What is the greatest number of boxes the van can carry on one trip with the driver?", "41", None,
         "80 + 20b ≤ 900 gives 20b ≤ 820, so b ≤ 41. The greatest whole number of boxes is 41."),
        (D, "In a random sample of 200 voters in a town, 120 said they support building a new park. The town has 15,000 voters. Based on the sample, about how many voters in the town support the new park?",
         "9,000", ["120", "6,000", "12,000"],
         "The sample proportion is 120/200 = 0.6, and 0.6 × 15,000 = 9,000. 6,000 is the estimate of voters who do not support it."),
        (M, "If x > 0 and x² = 49, what is the value of √(x + 2)?", "3", ["7", "9", "√51"],
         "Since x > 0, x = 7. Then √(7 + 2) = √9 = 3."),
        (G, "In right triangle ABC, angle C is a right angle, AC = 8 and AB = 17. What is the value of cos A?", "8/17", ["15/17", "8/15", "15/8"],
         "BC = √(17² − 8²) = 15. Cosine is adjacent over hypotenuse: for angle A, the adjacent side is AC = 8 and the hypotenuse is AB = 17."),
        (M, "For what value of k does the equation x² + 6x + k = 0 have exactly one real solution?", "9", None,
         "One real solution means the discriminant is zero: 6² − 4k = 0, so k = 9. Then x² + 6x + 9 = (x + 3)²."),
    ]
    assert len(rows) == 22 and len(MATH_POSITIONS) == 22
    out = []
    for i, (domain, prompt, answer, wrong, explanation) in enumerate(rows):
        qid = f"sat-math-free-{i + 1}"
        if wrong is None:
            assert MATH_POSITIONS[i] is None
            out.append(numeric(qid, domain, prompt, answer, explanation))
        else:
            out.append(item(qid, domain, "", prompt, answer, wrong, explanation, MATH_POSITIONS[i]))
    return out


def build(program_dir):
    checks()
    return {
        "slug": SLUG, "version": 1, "program": "sat",
        "title": "Digital SAT · Free Half Mock",
        "description": "Half of a Digital SAT: one Reading and Writing module (27 questions, 32 minutes) and one Math module (22 questions, 35 minutes), with numerical responses. Free sampler; raw scores only.",
        "sources": [
            {"label": "College Board — SAT structure", "url": "https://satsuite.collegeboard.org/sat/whats-on-the-test/structure"},
            {"label": "College Board — Math overview", "url": "https://satsuite.collegeboard.org/sat/whats-on-the-test/math/overview"},
        ],
        "notes": [
            "Free half-length sampler: one module of each section, without adaptive routing or the ten-minute break.",
            "Original practice questions, not College Board material. Raw correct counts only; no 200–800 scaled score.",
        ],
        "stages": [
            {"id": "sat-rw-1", "title": "Reading & Writing · Module 1", "seconds": 1920, "kind": "questions",
             "instructions": "27 questions · 32 minutes. Read each short text and select one answer. Move freely within this module and flag questions for review. The Math module begins when this timer ends.",
             "questions": reading_writing()},
            {"id": "sat-math-1", "title": "Math · Module 1", "seconds": 2100, "kind": "questions",
             "instructions": "22 questions · 35 minutes. A calculator is permitted throughout Math. Some questions require a numerical response: enter an integer, decimal or fraction, without units. Reference formulas and a graphing calculator are available from Tools.",
             "questions": math()},
        ],
    }, None
