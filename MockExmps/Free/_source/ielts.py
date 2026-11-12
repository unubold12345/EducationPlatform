"""IELTS Academic — free half mock (ielts-academic-free).

Listening Parts 1–2 (20 questions), Reading Passages 1–2 (26 questions, 40 minutes), Writing Task 1 and
Speaking Parts 1–2: about half of the test in 84 minutes. Stage IDs reuse "ielts-listening" and
"ielts-listening-check" because the site's audio and practice code key on them.

Listening audio is not generated yet. The full scripts, with speaker labels and the reading pauses, are
written to ielts-academic-free-listening.json for the existing local Kokoro pipeline. Each Listening
question also carries the short excerpt that contains its answer (`listening.script`), which the site shows
only in review. No band score is calculated.
"""

from __future__ import annotations

import re

from common import Figures, write_json

SLUG = "ielts-academic-free"
SPEAK_NOTE = "A qualified human should review fluency and coherence, vocabulary, grammar and pronunciation. This recorded simulation does not assign an automatic band score."
ONE_WORD_NUMBER = "Complete the notes. Write ONE WORD AND/OR A NUMBER for each answer."

PART1_TITLE = "Part 1 · Enquiry about a weekend photography course"
PART1 = [
    ("Narrator", "Part 1. You will hear a man phoning an arts centre to ask about a photography course. First, you have some time to look at questions 1 to 5."),
    ("pause", "30"),
    ("Narrator", "Now listen carefully and answer questions 1 to 5."),
    ("Receptionist", "Good morning, Westbank Arts Centre. How can I help you?"),
    ("Caller", "Hi. I saw a poster about a weekend photography course, and I'd like some more information."),
    ("Receptionist", "Of course. We run two weekend courses at the moment. Can I take your name first?"),
    ("Caller", "Yes, it's Daniel Hartley."),
    ("Receptionist", "Is that H-A-R-T-L-Y?"),
    ("Caller", "Almost. There's an E before the Y. H-A-R-T-L-E-Y."),
    ("Receptionist", "Thank you. Now, have you done any photography courses before?"),
    ("Caller", "Not really. I've had a camera for a couple of years, but I mostly use the automatic setting."),
    ("Receptionist", "Then the intermediate course might move a little fast for you. I'd suggest the one for beginners. It covers the basic controls and how to compose a picture."),
    ("Caller", "That sounds right."),
    ("Receptionist", "The beginners' course used to run on Sundays, but we've moved it, because the museum next door is closed on Sundays and we use its gardens for the outdoor practice. So it's now on Saturdays."),
    ("Caller", "Saturday is fine. What time does it start?"),
    ("Receptionist", "The doors open at nine, and it's a good idea to arrive then if you need help setting up your camera, but the session itself begins at a quarter past nine."),
    ("Caller", "OK, so nine fifteen."),
    ("Receptionist", "That's right. And it finishes at about four."),
    ("Caller", "Where exactly do we meet? Is it here at the arts centre?"),
    ("Receptionist", "Not for this course. The group meets at the museum. The main entrance is often busy with school groups on Saturday mornings, so please go to the garden entrance at the back of the building. The tutor will be waiting there."),
    ("Narrator", "Before you hear the rest of the conversation, you have some time to look at questions 6 to 10."),
    ("pause", "30"),
    ("Narrator", "Now listen and answer questions 6 to 10."),
    ("Caller", "And how much does the course cost?"),
    ("Receptionist", "The full price is ninety-five pounds, but for members of the arts centre it's eighty-five."),
    ("Caller", "I'm not a member yet. Is it worth joining?"),
    ("Receptionist", "Membership is twenty pounds a year, so you'd save ten pounds on this course alone, and you'd get discounts on our other courses too."),
    ("Caller", "I think I'll join today, then. So the course would be eighty-five."),
    ("Receptionist", "Exactly. That includes lunch at the museum café, and at the end of the day you'll receive a certificate. Some people use it for their college applications."),
    ("Caller", "Great. Do I need to bring anything?"),
    ("Receptionist", "Your camera, obviously, with a spare battery if you have one. You don't need a tripod; we lend those. The thing people most often forget is a raincoat. A lot of the day is outside, whatever the weather."),
    ("Caller", "A raincoat. OK. And how many people are usually in a group?"),
    ("Receptionist", "We used to take up to fifteen, but the tutor found that was too many to give everyone enough attention, so the limit is now twelve."),
    ("Caller", "That sounds better. One last question: is there parking near the museum?"),
    ("Receptionist", "The museum's own car park is for staff only. There's a public car park on Bridge Street, about two minutes' walk away, and it's free on Saturdays."),
    ("Caller", "Bridge Street. Perfect. Can I book a place now?"),
    ("Receptionist", "Certainly. I'll just need a few more details."),
    ("Narrator", "That is the end of Part 1. You now have half a minute to check your answers."),
    ("pause", "30"),
]

PART2_TITLE = "Part 2 · Volunteer orientation at a nature reserve"
PART2 = [
    ("Narrator", "Part 2. You will hear a volunteer coordinator welcoming new volunteers to a nature reserve. First, you have some time to look at questions 11 to 14."),
    ("pause", "30"),
    ("Narrator", "Now listen carefully and answer questions 11 to 14."),
    ("Coordinator", "Good morning, everyone, and welcome to Greenfield Nature Reserve. My name's Helen Price, and I coordinate our volunteers. Before you start, I'll explain how the reserve works and what you'll be doing."),
    ("Coordinator", "First, a little history. The reserve was created in 1987, when the old gravel pits here were allowed to flood. Visitors often assume the lakes are natural, but every one of them was dug by machines for gravel. Today they attract more than a hundred and forty species of birds, although the number that visit each winter changes a great deal with the weather further north."),
    ("Coordinator", "Many of you have asked about the timetable. Volunteer days run from Tuesday to Saturday. We tried Sunday sessions last year, but so many families visit at the weekend that the paths were too crowded for practical work, so Sunday is now for visitors only."),
    ("Coordinator", "As for what to wear, the reserve provides gloves and tools, and each of you will be given a high-visibility vest, which you must wear whenever you're working near the road. Please bring your own boots, though. We used to keep a supply, but finding the right sizes was always a problem."),
    ("Coordinator", "The reserve also has some rules that may seem strict. Dogs are welcome on the main circular path, but not on the lake trails, because of nesting birds. And please ask visitors not to feed the ducks bread. It's bad for them, and it attracts rats. The visitor centre sells bags of grain instead, and the money goes to the reserve."),
    ("Narrator", "Before you hear the rest of the talk, you have some time to look at questions 15 to 20."),
    ("pause", "30"),
    ("Narrator", "Now listen and answer questions 15 to 20."),
    ("Coordinator", "Now let me tell you about the different areas on your map and the work we'll be doing in each this season."),
    ("Coordinator", "Starting from the visitor centre, the first area you come to is the Reed Beds. The reeds there need cutting back every autumn, and that's the main job this month. It's hard work, but very satisfying."),
    ("Coordinator", "Next to them is Kingfisher Lake. There's nothing for volunteers to do there at the moment, because the birds are breeding, so we keep people well away."),
    ("Coordinator", "The Meadow is where we're running a wildflower survey. Volunteers count the plants in marked squares. No experience is necessary; we'll train you."),
    ("Coordinator", "In the Woodland, our priority is the paths. Tree roots and mud have made some sections dangerous, so we're laying new surfaces."),
    ("Coordinator", "The Hide, the wooden building overlooking the main lake, is used by birdwatchers. We need volunteers there at weekends to chat with visitors and help them identify the birds they see. We had planned to build a second hide this year, but that's been postponed."),
    ("Coordinator", "Finally, the Orchard. Last year we planted thirty young apple trees there, and they need protecting from rabbits, so we'll be putting a fence around each one."),
    ("Coordinator", "Right. If you'd like to collect your vests from the table by the door, we'll make a start."),
    ("Narrator", "That is the end of Part 2. You now have half a minute to check your answers."),
    ("pause", "30"),
]


def script_text(lines) -> str:
    return "\n".join(f"{speaker}: {text}" for speaker, text in lines if speaker != "pause")


def listening() -> list[dict]:
    full1, full2 = script_text(PART1), script_text(PART2)
    out: list[dict] = []

    def note(n, label, answers, max_words, evidence, explanation):
        assert evidence in full1, evidence
        out.append({"id": f"il-free-{n}", "number": str(n), "domain": "Listening", "kind": "short", "answers": answers,
                    "maxWords": max_words, "prompt": f"{PART1_TITLE}\n{label}: {ONE_WORD_NUMBER}",
                    "explanation": f"Evidence: “{evidence}”. {explanation}".strip(),
                    "listening": {"part": 1, "script": evidence}})

    note(1, "Caller's surname: ____", ["Hartley"], 1, "H-A-R-T-L-E-Y", "The receptionist first misses the E.")
    note(2, "Course level: ____", ["beginners", "beginner", "beginners'"], 1, "I'd suggest the one for beginners", "The intermediate course is rejected as too fast.")
    note(3, "Day of the course: ____", ["Saturday", "Saturdays"], 1, "So it's now on Saturdays", "Sunday was the old day.")
    note(4, "Session starts at: ____", ["9:15", "9.15", "9:15am", "9.15am", "9:15 am", "9.15 am"], 2,
         "the session itself begins at a quarter past nine", "Nine o'clock is only when the doors open.")
    note(5, "Meet at the ____ entrance of the museum", ["garden"], 1, "please go to the garden entrance", "The main entrance is busy with school groups.")
    note(6, "Course price for members: £____", ["85", "eighty-five"], 1, "for members of the arts centre it's eighty-five", "£95 is the full price; the caller decides to join.")
    note(7, "Price includes lunch and a ____", ["certificate"], 1, "you'll receive a certificate", "")
    note(8, "Remember to bring a ____", ["raincoat"], 1, "The thing people most often forget is a raincoat", "A tripod is lent, so it is not needed.")
    note(9, "Maximum number of people in a group: ____", ["12", "twelve"], 1, "so the limit is now twelve", "Fifteen was the old limit.")
    note(10, "Public car park: ____ Street", ["Bridge"], 1, "There's a public car park on Bridge Street", "The museum car park is for staff only.")

    def mc(n, question, options, answer, evidence, explanation):
        assert evidence in full2, evidence
        out.append({"id": f"il-free-{n}", "number": str(n), "domain": "Listening", "kind": "choice",
                    "prompt": f"{PART2_TITLE}\n{question}: Choose the correct letter, A, B or C.",
                    "options": options, "optionLabels": ["A", "B", "C"], "answers": [options["ABC".index(answer)]],
                    "explanation": f"Evidence: “{evidence}”. {explanation}", "listening": {"part": 2, "script": evidence}})

    mc(11, "The lakes at the reserve were formed by", ["natural flooding of low ground", "digging for gravel", "a river changing its course"], "B",
       "every one of them was dug by machines for gravel", "Visitors wrongly assume the lakes are natural.")
    mc(12, "Why are there no volunteer sessions on Sundays?", ["The reserve is closed to the public.", "There are not enough staff to supervise.", "Too many visitors use the paths."], "C",
       "the paths were too crowded for practical work", "Sunday is now for visitors only.")
    mc(13, "Volunteers must bring their own", ["gloves", "vests", "boots"], "C",
       "Please bring your own boots", "Gloves, tools and vests are provided.")
    mc(14, "Visitors should be asked not to", ["walk dogs anywhere on the reserve", "feed bread to the ducks", "buy grain from the visitor centre"], "B",
       "please ask visitors not to feed the ducks bread", "Dogs are allowed on the main path, and grain is sold for the ducks.")

    bank = ["counting plants", "repairing paths", "cutting plants back", "protecting young trees", "talking to visitors",
            "building a new hide", "no work at present", "clearing litter from the water"]
    labels = list("ABCDEFGH")
    for n, area, answer, evidence in [
        (15, "Reed Beds", "C", "The reeds there need cutting back every autumn"),
        (16, "Kingfisher Lake", "G", "There's nothing for volunteers to do there at the moment"),
        (17, "Meadow", "A", "Volunteers count the plants in marked squares"),
        (18, "Woodland", "B", "our priority is the paths"),
        (19, "Hide", "E", "to chat with visitors and help them identify the birds"),
        (20, "Orchard", "D", "we'll be putting a fence around each one"),
    ]:
        assert evidence in full2, evidence
        out.append({"id": f"il-free-{n}", "number": str(n), "domain": "Listening", "kind": "choice",
                    "prompt": f"{PART2_TITLE}\n{area}: What work will volunteers do in each area this season? Choose the correct letter, A–H. Two letters are not used.",
                    "options": bank, "optionLabels": labels, "answers": [bank[labels.index(answer)]],
                    "explanation": f"Evidence: “{evidence}”." + (" A second hide was postponed, so F is not used." if area == "Hide" else ""),
                    "listening": {"part": 2, "script": evidence}})
    return out


P1_TITLE = "Reading passage 1 · The rise of the repair café"
P1 = """A. On the first Saturday of every month, the community hall in the small town of Holbrook fills with broken things. People arrive carrying lamps that no longer light, jackets with failed zips, radios that have fallen silent and chairs with loose legs. Waiting for them at a row of tables are volunteers with screwdrivers, sewing machines and soldering irons. Nobody pays for the repairs, and nobody is promised that their object will be fixed. The only condition is that owners stay and watch and, where possible, help.

B. Holbrook's repair café is one of thousands of similar events now held around the world. The idea spread from the Netherlands in the late 2000s, and its appeal is easy to understand. Many household products are designed in ways that make them difficult to open, and spare parts can be expensive or impossible to find. When something breaks, buying a replacement is often cheaper and quicker than finding someone to mend it. Repair cafés offer an alternative: free expertise, shared tools and a social occasion.

C. The organisers in Holbrook keep careful records. Of the 1,200 items brought in during the café's first three years, a little under two thirds left in working order. Textiles and furniture had the highest success rates, since they rarely need specialised parts. Electronic devices were the most difficult. 'Often we can find the fault,' says Rob Ellis, a retired electrician who has volunteered since the beginning, 'but if the part is glued in or the manufacturer doesn't sell it, there's nothing we can do except explain why.'

D. Ellis believes that the explanations matter almost as much as the repairs. Visitors who watch a fault being found begin to see their possessions differently, he argues. A toaster stops being a sealed box and becomes a collection of parts, some of which can be replaced. Several regular visitors now use their own tools to fix simple problems at home, coming to the café only when they need advice. For the organisers, this is a sign of success rather than a loss of visitors.

E. Not everyone is convinced. Some local shopkeepers worried at first that free repairs would take business away from them. In practice, the café has sent work their way: when a repair needs a part or a skill the volunteers lack, owners are given a list of nearby businesses. One shoe repairer estimates that a tenth of his customers now come to him through the café. Others question whether the events make any measurable difference to waste, since the number of items repaired is small compared with the quantity of goods a town throws away.

F. Supporters accept that the direct effect on waste is modest. Their argument is that repair cafés change attitudes, and that changed attitudes eventually affect what people buy. Visitors who have struggled to open a product held together with glue are more likely, they suggest, to look for products that can be repaired. In several countries, campaigners have used records from repair cafés as evidence in calls for a 'right to repair': laws requiring manufacturers to make spare parts and repair information available.

G. In Holbrook, the volunteers are less interested in legislation than in the atmosphere of the hall itself. Tea is served, children are encouraged to take apart objects that cannot be saved, and conversations between strangers are common. 'People come in with a broken lamp,' says the café's founder, Asha Patel, 'and leave having spent two hours talking to neighbours they had never met. Sometimes the lamp still doesn't work. They come back anyway.'"""

P2_TITLE = "Reading passage 2 · The record in the rings"
P2 = """A. Cut through the trunk of a tree that grew in a temperate climate and you will usually see a series of rings. Each ring represents a single year's growth. In spring, when water is plentiful, the tree produces large, thin-walled cells that look pale; later in the season, growth slows and the cells become smaller and darker. The sharp boundary between the dark wood of one year and the pale wood of the next makes the rings easy to count.

B. The width of each ring is not constant. In years with good growing conditions, with enough rain and suitable temperatures, trees tend to lay down wide rings, while a drought or a cold summer produces narrow ones. Because trees of the same species in the same region respond to the same weather, they share a recognisable pattern of wide and narrow rings. This shared pattern is the basis of dendrochronology, the scientific dating of wood using tree rings.

C. The method was developed in the early twentieth century by the American astronomer A. E. Douglass, who hoped that tree rings might reveal past cycles of activity on the Sun. Although that hope was never fully realised, Douglass found that he could match ring patterns between living trees and old timbers. By overlapping the patterns of progressively older samples, a process known as cross-dating, researchers have since built continuous ring sequences that extend back thousands of years in some regions.

D. These sequences have practical uses that Douglass could hardly have imagined. Archaeologists use them to date wooden beams in old buildings, sometimes to the exact year in which the tree was cut down, provided that the outermost ring under the bark survives. Art historians have dated the wooden panels on which some paintings were made, and in a number of cases have shown that a work could not have been painted by the artist to whom it was attributed, because the wood was cut after the artist's death.

E. Tree rings also serve as a record of past climate. Since ring width reflects growing conditions, long sequences allow scientists to estimate rainfall and temperature for periods before measuring instruments existed. Such reconstructions are not simple. A narrow ring might be caused by drought, by an unusually cold season or by insects stripping a tree of its leaves, and researchers must compare many trees and sites to separate these influences. Nevertheless, ring-based reconstructions have helped to identify long droughts that coincided with the decline of some past societies.

F. The method has limits. In many tropical regions, where there is little seasonal change, trees grow almost continuously and do not form clear annual rings. Some trees occasionally produce two rings in a single year, or none at all in a severe drought, which is why dendrochronologists never rely on a single sample. And although the oldest living trees, such as certain bristlecone pines in the western United States, are several thousand years old, extending a sequence beyond their age depends on finding well-preserved dead wood.

G. Recent technology has extended what rings can tell us. Researchers now measure the density of the wood and the chemical composition of individual rings, which can reveal details invisible to the eye, such as the source of the water a tree absorbed. Yet the basic principle remains the one Douglass recognised: year by year, a tree keeps a faithful record of the conditions in which it grew."""

TFNG = "Do these statements agree with the information in the passage? Write TRUE, FALSE or NOT GIVEN."
SENTENCE = "Complete the sentences. Write ONE WORD ONLY from the passage for each answer."
CHOOSE4 = "Choose the correct letter, A, B, C or D."
HEADINGS = ["Where the method cannot easily be used", "An astronomer's unexpected discovery", "The commercial value of old timber",
            "How the yearly pattern forms", "Reconstructing conditions before measurements", "Why scientists prefer young trees",
            "Dating objects made of wood", "Weather written in the width of wood"]
ROMAN = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii"]


def reading() -> list[dict]:
    out: list[dict] = []

    def add(n, passage, prompt, kind, answer, explanation, options=None, labels=None, max_words=None, evidence=None, text=None):
        if evidence:
            assert evidence in text, evidence
        question = {"id": f"ir-free-{n}", "number": str(n), "domain": "Academic Reading", "passage": passage, "kind": kind,
                    "prompt": prompt, "explanation": explanation + (f" Evidence: “{evidence}”" if evidence else "")}
        if kind == "choice":
            question["options"] = options
            if labels:
                question["optionLabels"] = labels
            question["answers"] = [options[labels.index(answer)] if labels else answer]
        else:
            question["answers"] = answer
            question["maxWords"] = max_words
        out.append(question)

    tf = ["TRUE", "FALSE", "NOT GIVEN"]
    for n, statement, answer, explanation, evidence in [
        (1, "Owners must stay at the café while their item is being repaired.", "TRUE", "Staying is the only condition.", "The only condition is that owners stay and watch"),
        (2, "Volunteers promise to repair every item that is brought in.", "FALSE", "The passage says the opposite.", "nobody is promised that their object will be fixed"),
        (3, "The first repair café was held in Holbrook.", "FALSE", "The idea came to Holbrook from elsewhere.", "The idea spread from the Netherlands in the late 2000s"),
        (4, "Most of the items brought to the Holbrook café in its first three years were repaired successfully.", "TRUE", "A little under two thirds is still a majority.", "a little under two thirds left in working order"),
        (5, "Electronic devices are the type of item most often brought to the café.", "NOT GIVEN", "The passage says electronics were the most difficult to repair, not the most common.", None),
        (6, "The café charges local businesses to appear on its list of repairers.", "NOT GIVEN", "A list of nearby businesses is mentioned, but nothing is said about charges.", None),
    ]:
        add(n, P1_TITLE, f"{TFNG}\n{statement}", "choice", answer, explanation, options=tf, evidence=evidence, text=P1)
    for n, sentence, answers, explanation, evidence in [
        (7, "Textiles and ____ were the categories most likely to be repaired successfully.", ["furniture"], "Paragraph C.", "Textiles and furniture had the highest success rates"),
        (8, "A repair to an electronic device may be impossible when a part is ____ in.", ["glued"], "Paragraph C.", "if the part is glued in"),
        (9, "Some regular visitors now use their own ____ to fix simple problems at home.", ["tools"], "Paragraph D.", "use their own tools to fix simple problems at home"),
        (10, "Campaigners have used the ____ kept by repair cafés to support calls for a 'right to repair'.", ["records"], "Paragraph F.", "campaigners have used records from repair cafés"),
    ]:
        add(n, P1_TITLE, f"{SENTENCE}\n{sentence}", "short", answers, explanation, max_words=1, evidence=evidence, text=P1)
    abcd = list("ABCD")
    add(11, P1_TITLE, f"{CHOOSE4}\nAccording to paragraph D, Rob Ellis believes that watching repairs helps visitors to", "choice", "B",
        "Seeing a fault found changes how visitors see their possessions.",
        options=["save money on new products.", "understand how their possessions are made.", "start their own repair businesses.", "choose better tools."],
        labels=abcd, evidence="A toaster stops being a sealed box and becomes a collection of parts", text=P1)
    add(12, P1_TITLE, f"{CHOOSE4}\nWhich criticism of repair cafés is mentioned in paragraph E?", "choice", "C",
        "Critics doubt that the cafés make a measurable difference to waste.",
        options=["They take too long to repair items.", "They are run by people without training.", "Their effect on waste may be very small.", "They mainly attract retired people."],
        labels=abcd, evidence="the number of items repaired is small compared with the quantity of goods a town throws away", text=P1)
    add(13, P1_TITLE, f"{CHOOSE4}\nWhat does Asha Patel suggest about the café's visitors?", "choice", "D",
        "Visitors return even when their lamp is not fixed, because of the time spent with neighbours.",
        options=["They are disappointed when a repair fails.", "They would rather repair things alone.", "They want new laws on repair.", "They value the social side of the café."],
        labels=abcd, evidence="They come back anyway.", text=P1)

    for n, paragraph, answer, explanation in [
        (14, "A", "iv", "Spring and late-season wood make one visible ring a year."),
        (15, "B", "viii", "Ring width follows the weather, and the shared pattern is the basis of dating."),
        (16, "C", "ii", "Douglass looked for solar cycles and instead found that ring patterns could be matched."),
        (17, "D", "vii", "Beams and painted panels are dated from their rings."),
        (18, "E", "v", "Rings let scientists estimate rainfall and temperature before instruments existed."),
        (19, "F", "i", "Tropical trees and missing or double rings limit the method."),
    ]:
        add(n, P2_TITLE, f"Choose the correct heading for each paragraph from the list below. Write the Roman numeral. Use each heading at most once.\nParagraph {paragraph}",
            "choice", answer, explanation, options=HEADINGS, labels=ROMAN)
    for n, sentence, answers, explanation, evidence in [
        (20, "Wood formed in spring looks ____ because its cells are large and thin-walled.", ["pale"], "Paragraph A.", "large, thin-walled cells that look pale"),
        (21, "Overlapping the ring patterns of older and older samples is known as ____.", ["cross-dating", "crossdating"], "Paragraph C. A hyphenated word counts as one word.", "a process known as cross-dating"),
        (22, "A beam can be dated to the exact year of felling only if the outermost ring under the ____ survives.", ["bark"], "Paragraph D.", "the outermost ring under the bark survives"),
        (23, "As well as drought and cold, ____ that strip a tree of its leaves can cause a narrow ring.", ["insects"], "Paragraph E.", "by insects stripping a tree of its leaves"),
    ]:
        add(n, P2_TITLE, f"{SENTENCE}\n{sentence}", "short", answers, explanation, max_words=1, evidence=evidence, text=P2)
    add(24, P2_TITLE, f"{CHOOSE4}\nWhy did A. E. Douglass first study tree rings?", "choice", "C",
        "His original aim was evidence of solar cycles.",
        options=["to date old buildings", "to measure rainfall in deserts", "to look for past cycles of activity on the Sun", "to find the oldest living tree"],
        labels=abcd, evidence="hoped that tree rings might reveal past cycles of activity on the Sun", text=P2)
    add(25, P2_TITLE, f"{CHOOSE4}\nAccording to paragraph D, art historians have used tree rings to", "choice", "A",
        "Wood cut after an artist's death shows the attribution is wrong.",
        options=["show that some paintings were attributed to the wrong artist.", "restore damaged paintings.", "identify the paints an artist used.", "find out where an artist lived."],
        labels=abcd, evidence="a work could not have been painted by the artist to whom it was attributed", text=P2)
    add(26, P2_TITLE, f"{CHOOSE4}\nWhat does the writer say about trees in many tropical regions?", "choice", "D",
        "With little seasonal change, growth is almost continuous.",
        options=["They grow faster than temperate trees.", "They always produce two rings a year.", "They are the oldest trees on Earth.", "They often lack clear annual rings."],
        labels=abcd, evidence="do not form clear annual rings", text=P2)
    return out


CHART = {"years": ["2005", "2015", "2025"],
         "series": [("Desktop computer", [48, 41, 22], "#3F6E9A"), ("Laptop", [12, 54, 71], "#D08B3E"), ("Tablet", [0, 30, 46], "#5E9E77")]}


def chart_svg() -> str:
    width, height, left, top, bottom, right = 1000, 620, 90, 70, 110, 40
    plot_w, plot_h = width - left - right, height - top - bottom
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-label="Household device ownership in Norland, 2005–2025">',
             f'<rect width="{width}" height="{height}" fill="#ffffff"/>',
             f'<text x="{width / 2}" y="36" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#1f2933" text-anchor="middle">Households owning each device in Norland (%)</text>']
    for value in range(0, 81, 20):
        y = top + plot_h - value / 80 * plot_h
        parts.append(f'<line x1="{left}" y1="{y:.1f}" x2="{width - right}" y2="{y:.1f}" stroke="#d9dee3" stroke-width="1"/>')
        parts.append(f'<text x="{left - 12}" y="{y + 6:.1f}" font-family="Arial, sans-serif" font-size="18" fill="#3e4c59" text-anchor="end">{value}</text>')
    group_w = plot_w / 3
    bar_w = 62
    for g, year in enumerate(CHART["years"]):
        centre = left + group_w * (g + 0.5)
        for s, (_, values, colour) in enumerate(CHART["series"]):
            value = values[g]
            x = centre + (s - 1) * (bar_w + 10) - bar_w / 2
            h = value / 80 * plot_h
            y = top + plot_h - h
            if value:
                parts.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="{bar_w}" height="{h:.1f}" fill="{colour}"/>')
            parts.append(f'<text x="{x + bar_w / 2:.1f}" y="{y - 8:.1f}" font-family="Arial, sans-serif" font-size="17" fill="#1f2933" text-anchor="middle">{value}</text>')
        parts.append(f'<text x="{centre:.1f}" y="{top + plot_h + 32}" font-family="Arial, sans-serif" font-size="20" fill="#1f2933" text-anchor="middle">{year}</text>')
    parts.append(f'<line x1="{left}" y1="{top + plot_h}" x2="{width - right}" y2="{top + plot_h}" stroke="#52606d" stroke-width="2"/>')
    lx = left + 120
    for s, (name, _, colour) in enumerate(CHART["series"]):
        x = lx + s * 250
        parts.append(f'<rect x="{x}" y="{height - 44}" width="22" height="22" fill="{colour}"/>')
        parts.append(f'<text x="{x + 32}" y="{height - 26}" font-family="Arial, sans-serif" font-size="19" fill="#1f2933">{name}</text>')
    parts.append("</svg>")
    return "\n".join(parts)


def build(program_dir):
    figures = Figures(program_dir, "ielts-free", "/ielts-mocks/ielts-free")
    listening_questions = listening()
    table = "Data (% of households owning each device; a household may own more than one):\n\nDevice | 2005 | 2015 | 2025\n" + "\n".join(
        f"{name} | " + " | ".join(str(v) for v in values) for name, values, _ in CHART["series"])
    writing = [{
        "id": "iw-free-1", "domain": "Writing", "kind": "essay", "minWords": 150, "answers": [],
        "prompt": "You should spend about 20 minutes on this task. The bar chart shows the percentage of households in the fictional country of Norland that owned a desktop computer, a laptop and a tablet in 2005, 2015 and 2025. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.",
        "passage": table,
        "figure": figures.add("writing-1", chart_svg(), "Households owning a desktop computer, a laptop and a tablet in Norland, 2005, 2015 and 2025", expandable=True),
        "explanation": "An overview can contrast the steady fall in desktop ownership with the rise of laptops and tablets, and note that laptops overtook desktops by 2015 and were the most common device in 2025. Useful details: desktops 48% → 22%; laptops 12% → 71%; tablets from none in 2005 to 46%. Percentages can exceed 100 in total because households own several devices. Causes are not shown, so do not invent them. A qualified human reviewer should assess task achievement, coherence and cohesion, lexical resource and grammatical range and accuracy; no automatic band is assigned.",
    }]
    part1 = [("Home town", "Where is your home town?"), ("Home town", "What do you like most about living there?"),
             ("Home town", "How has your home town changed in recent years?"), ("Reading", "Do you enjoy reading? Why or why not?"),
             ("Reading", "What kinds of things do you usually read?"), ("Reading", "Did you read more when you were a child than you do now?")]
    card = ("Describe a useful skill you learned outside school. You should say: what the skill is, who taught you or how you learned it, "
            "how long it took to learn, and explain why this skill is useful to you.")
    speaking1 = [{"id": f"is-free-p1-{i + 1}", "domain": "Speaking", "kind": "speaking", "answers": [], "prompt": f"{topic} · {text}", "explanation": SPEAK_NOTE}
                 for i, (topic, text) in enumerate(part1)]
    notes = {"id": "is-free-notes", "domain": "Speaking", "kind": "speaking", "answers": [], "prompt": card, "explanation": SPEAK_NOTE}
    speaking2 = [{"id": "is-free-p2", "domain": "Speaking", "kind": "speaking", "answers": [], "prompt": card, "explanation": SPEAK_NOTE},
                 {"id": "is-free-p2-round", "domain": "Speaking", "kind": "speaking", "answers": [], "prompt": "Do you think you will teach this skill to someone else?", "explanation": SPEAK_NOTE}]

    for question in listening_questions:
        assert any(re.search(re.escape(answer), script_text(PART1 if question["listening"]["part"] == 1 else PART2), re.I)
                   for answer in question["answers"]) or question["kind"] == "choice" or question["number"] in {"1", "4", "6"}, question["id"]
    write_json(program_dir / f"{SLUG}-listening.json", {
        "slug": SLUG,
        "note": "Listening scripts for audio synthesis (not yet recorded). Speaker lines are read in order; 'pause' rows are silences in seconds. Keep these out of the exam definition and attempt snapshots.",
        "suggestedVoices": {"Narrator": "bf_emma", "Receptionist": "af_heart", "Caller": "am_michael", "Coordinator": "bf_isabella"},
        "parts": [
            {"part": 1, "title": PART1_TITLE, "questions": "1–10", "lines": [{"speaker": s, "text": t} if s != "pause" else {"pause": float(t)} for s, t in PART1]},
            {"part": 2, "title": PART2_TITLE, "questions": "11–20", "lines": [{"speaker": s, "text": t} if s != "pause" else {"pause": float(t)} for s, t in PART2]},
        ],
    })
    definition = {
        "slug": SLUG, "version": 1, "program": "ielts",
        "title": "IELTS Academic · Free Half Mock",
        "description": "Half of an IELTS Academic test: Listening Parts 1–2, Reading Passages 1–2 (repair cafés; tree rings), Writing Task 1 and Speaking Parts 1–2. Free sampler; no band score.",
        "sources": [
            {"label": "IELTS — Academic test format", "url": "https://ielts.org/take-a-test/test-types/ielts-academic-test"},
            {"label": "IELTS — Reading", "url": "https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-reading"},
        ],
        "notes": ["Free half-length sampler: two of the four Listening parts, two of the three Reading passages, Writing Task 1 and Speaking Parts 1–2.",
                  "Original practice content. No IELTS band score is calculated; Writing and Speaking are saved for review."],
        "stages": [
            {"id": "ielts-listening", "title": "Listening · Parts 1–2", "seconds": 900, "kind": "listening",
             "instructions": "20 questions · two recordings, played once in order. Use headphones. The audio contains time to read and check each group of questions. Follow the word/number limit printed on each item. Recordings continue when you change questions; there is no pause or replay.",
             "questions": listening_questions},
            {"id": "ielts-listening-check", "title": "Listening · Final answer check", "seconds": 120, "kind": "questions",
             "instructions": "Two minutes to check your Listening answers. Audio has ended; Listening locks when this timer expires.",
             "questions": listening_questions},
            {"id": "ielts-reading", "title": "Academic Reading · Passages 1–2", "seconds": 2400, "kind": "questions",
             "instructions": "26 questions · 40 minutes, including answer entry. Two original texts. Follow each task's instructions. For TRUE/FALSE/NOT GIVEN, distinguish contradiction from missing information. You may move between both passages until time ends.",
             "questions": reading(), "passages": [{"title": P1_TITLE, "text": P1}, {"title": P2_TITLE, "text": P2}]},
            {"id": "ielts-writing", "title": "Academic Writing · Task 1", "seconds": 1200, "kind": "writing",
             "instructions": "20 minutes. Write at least 150 words about the chart. Your response is saved for review; no automated band is claimed.",
             "questions": writing},
            {"id": "ielts-speaking-1", "title": "Speaking · Part 1 interview", "seconds": 240, "kind": "speaking",
             "instructions": "Four minutes. Enable your microphone and answer these familiar-topic questions aloud, in order. Aim for natural, developed answers. Do not include identity documents or private contact details.",
             "questions": speaking1},
            {"id": "ielts-speaking-prep", "title": "Speaking · Part 2 preparation", "seconds": 60, "kind": "preparation",
             "instructions": "You have exactly one minute to prepare. Make brief notes. Speaking Part 2 begins automatically; you will then have two minutes to speak.",
             "questions": [notes]},
            {"id": "ielts-speaking-2", "title": "Speaking · Part 2 long turn", "seconds": 120, "kind": "speaking",
             "instructions": "Speak for up to two minutes about your prepared topic. If time remains, answer the short rounding-off question. The recording is saved for review.",
             "questions": speaking2},
        ],
    }
    return definition, figures
