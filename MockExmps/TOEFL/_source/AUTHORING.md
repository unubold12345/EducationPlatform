# Writing a TOEFL iBT form for this pack

`form01.py` is the reference. A new form is a copy of its structure with entirely new content. `build.py` enforces
every count below; run `python -B MockExmps/TOEFL/_source/build.py --check N` (from the repository root) until it
prints `errors: 0`, and read every warning.

## 1. Blueprint

Source: ETS, *TOEFL iBT Test: 2026 Update - Test Blueprint and Specifications* (format in use since 21 January 2026).
The blueprint fixes the totals per task type; the split between modules is this pack's reconstruction (it is the
only split that reproduces both of ETS's totals: Lower path 19/10/10/8 and Upper path 15/10/6/16 in Listening).

| Section | Module 1 (routing) | Module 2 Lower | Module 2 Upper |
| --- | --- | --- | --- |
| Reading | 2 Complete the Words (20) · 4 daily-life texts with 2, 3, 2, 3 questions (10) · 1 academic passage (5) = 35 | 1 Complete the Words (10) · daily-life texts with 2 and 3 questions (5) = 15 | 1 Complete the Words (10) · 1 academic passage (5) = 15 |
| Listening | 12 Choose a Response · 4 conversations (8) · 2 announcements (4) · 2 academic talks (8) = 32 | 7 Choose a Response · 1 conversation (2) · 3 announcements (6) = 15 | 3 Choose a Response · 1 conversation (2) · 1 announcement (2) · 2 academic talks (8) = 15 |

Writing (linear): 10 Build a Sentence, 1 Write an Email, 1 Write for an Academic Discussion.
Speaking (linear): 7 Listen and Repeat sentences, 4 Take an Interview questions.

Level: Module 1 mixes A2 to C1. Lower modules are A1 to B1 (short sentences, concrete everyday content, direct
questions). Upper modules are B2 to C2 (denser texts, idiom, implied meaning, attitude and function questions).

## 2. Task rules

**Complete the Words** (`text`, `subject`). An academic paragraph of 55 to 90 words (aim for 65 to 75) that defines
or explains one concept, in 4 or 5 sentences. Sentence 1 and the last sentence are intact. Exactly 10 words are
truncated, starting in sentence 2 and continuing into sentence 3 (and 4 if needed). Inside a sentence the truncated
words are **every second word** (one intact word between two truncated ones). Write a truncated word as
`shown[missing]`, where the missing part is the second half and, for an odd number of letters, the longer half:
`o[n]`, `wi[nd]`, `ca[rry]`, `vis[its]`, `bet[ween]`, `evap[orate]`. Never truncate a name, a number or a
one-letter word. Check each gap yourself: with the letters shown and the context, only one English word may fit
(`s[un]` after "heat from the" could also be "sea": rewrite such a sentence). Mix easy function words with two or
three academic words per paragraph.

**Read in Daily Life** (`format`, `heading`, `text`, `questions`). A realistic everyday text: `email`, `notice`,
`text_messages`, `social_post`, `schedule`, `flyer`, `menu`, `memo`, `advertisement`, `receipt`, `webpage`,
`instructions`, `letter`, `form`, `review`. A 2-question text has 35 to 95 words (aim 45 to 80); a 3-question text
has 90 to 155 words (aim 100 to 130). Use at least five different formats among the six texts of a form. Question
kinds: `purpose`, `detail`, `negative` (NOT/EXCEPT), `inference`. `heading` is the on-screen line, for example
"Read a notice."

**Read an Academic Passage** (`subject`, `title`, `paragraphs`, `questions`). 180 to 230 words (aim 195 to 210) in
three paragraphs, on an accessible modern topic; typical shapes are definition plus example, benefits and
drawbacks, problem and solutions. Five questions using at least four kinds from `main_idea`, `factual`,
`negative_factual`, `vocabulary`, `inference`, `purpose`, `paragraph_relationship`, `sentence_select`. Exactly one
`vocabulary` question per passage, written as `The word "X" in the passage is closest in meaning to`, where X
appears in the passage. Questions do not name a paragraph number unless they must.

**Listen and Choose a Response** (`lcr(...)`). One spoken sentence of 3 to 18 words: a question, a request, an
offer or a remark. It is never printed. Four printed replies of at most 14 words. The key is the natural reply and
is often indirect (it answers without "yes" or "no"). Distractors use the usual traps: a word that sounds like one
in the prompt, an answer to a different question word, the wrong tense or person, a literal reading of an idiom.
Only one option may be a possible reply. Keep the four options similar in length.

**Listen to a Conversation** (`setting`, `voices`, `script`, `questions`). Two speakers, 6 to 12 turns, 70 to 150
words (aim 85 to 115). Campus services, professors, part-time work, friends, shops. Two questions. The second
question is usually what a speaker will do next, suggests, implies or means.

**Listen to an Announcement** (`setting`, `voice`, `script`, `questions`). One speaker, 55 to 115 words (aim 70 to
90): a classroom, campus or public announcement. Two questions (purpose or main idea, then a detail or an
inference).

**Listen to an Academic Talk** (`subject`, `voice`, `script`, `questions`). One lecturer, 170 to 250 words (aim 200
to 225), spoken style: direct address, a question to the class, contractions, an example. Numbers are written as
they are spoken ("eighteen eighty-three"). Four questions using at least three kinds from `main_idea`, `purpose`,
`detail`, `inference`, `function`, `prediction`, `negative`, `attitude`; the first is the main idea or purpose.

**Voices.** `F-US`, `M-US`, `F-UK`, `M-UK`, `F-AU`, `M-AU`. Alternate them; each accent must appear in at least six
listening parts of a form, and the two speakers of a conversation are a woman and a man with different voices.

**Build a Sentence** (`build(...)`). Ten two-line exchanges between students or with campus staff: a context line
(4 to 16 words) and a reply of 6 to 14 words that the test taker assembles. `chips` are the 4 to 8 boxes **in the
correct order** (the builder scrambles them); boxes are lowercase and several hold two or three words. `prefix` and
`suffix` are words already fixed on screen (use them in 3 or 4 items). `extra` is a single unused distractor box,
in 2 to 4 items, and it must make a wrong sentence if used (`are you` beside `you are`; `are` beside `is`). 4 to 6
of the ten replies are questions. Order the items from easy to hard and cover at least five focuses: `negation`,
`statement`, `yes_no_question`, `wh_question`, `embedded_question`, `relative_clause`, `modal`, `perfect`,
`passive`, `comparison`, `conditional`, `infinitive`. Only one order of the boxes may give a correct, natural
sentence: avoid words that can move ("yet", "also", "today", "right away") unless they are joined to a neighbour in
one box.

**Write an Email** (`scenario`, `to`, `subject`, `bullets`, `model`). A campus or everyday situation of 40 to 100
words written to "you", ending with the reason to write to a named person. Exactly three bullet points, each a
different function (describe, explain, ask, suggest, apologise, request). The model answer has 110 to 180 words,
covers every bullet, and has a greeting and a sign-off with an invented name.

**Write for an Academic Discussion** (`course`, `professor`, `students`, `model`). `course` completes "Your
professor is teaching a class on ...". The professor's post (45 to 110 words) introduces a debatable question and
ends with it. Two student posts (35 to 85 words) take different sides with one reason each. The model answer
(110 to 180 words) takes a position, refers to a classmate by name and adds a new idea.

**Listen and Repeat** (`scenario`, `picture`, `voice`, `sentences`). The scenario is "You are learning how to ...
Listen to your [manager] and repeat what [she] says. Repeat only once." Seven sentences on that one situation, all
natural things the person would say, getting longer: sentences 1 and 2 have 8 to 12 syllables, 3 to 5 have 12 to
18, 6 and 7 have 18 to 26 and contain a subordinate clause.

**Take an Interview** (`topic`, `scenario`, `voice`, `questions`). "You have agreed to take part in a research
study about [topic]. You will have a short online interview with a researcher. The researcher will ask you some
questions." Four spoken questions of 15 to 60 words with a short lead-in each ("Thank you for joining me today.",
"Now I'd like to hear your opinion.", "Here is my last question."). Kinds, in order: `event` or `life` (a personal
experience or routine), `life` (a preference, with a reason), `opinion` (agree or disagree with a view), `opinion`
(a "should" question about schools, cities, employers or society). Each has a model answer of 80 to 130 words, the
amount a strong speaker says in 45 seconds.

## 3. Quality rules

1. **Everything is new.** No sentence, scenario, name, title or question stem body may be reused from another form
   or copied from any published test or book. Standard stems ("What is the main purpose of the announcement?") are
   fine. People, shops, streets, products and course codes are invented; real places, scientists and historical
   facts may be named when they are accurate.
2. **Facts must be true.** Academic passages, talks and Complete the Words paragraphs state well-established
   knowledge only. If you are not sure of a date, number or attribution, leave it out or generalise it.
3. **One defensible key.** The key is supported by a specific sentence that the explanation (`why`) quotes or
   points to. Each distractor is wrong for a reason you could state, but plausible to someone who understood only
   part of the text. No option is true but "less good". Negative questions have three options clearly in the text.
4. **No outside knowledge.** Every question can be answered from the text or recording alone, and cannot be
   answered without it.
5. **Keys are spread.** Plan the letters before writing options. Per module of 12 or more questions each letter
   takes 15 to 36 %; over a whole section about a quarter each; never four identical keys in a row. Do not make
   the key the longest option.
6. **Listening is written for the ear.** Short clauses, contractions, natural fillers ("Well,", "Hmm."), no lists
   of more than three items, no abbreviations or symbols.
7. **Fair and international.** No topic that needs local cultural knowledge, nothing about religion, party
   politics, violence, disasters with victims, alcohol or medical advice. Mix names from many backgrounds.
8. **Spelling** is American in printed text (color, center, canceled).

## 4. Self-check before you report

- `--check N` prints `errors: 0`; each warning was looked at.
- Every Complete the Words gap has only one possible word.
- Every key was re-derived from the text after the options were written (cover the key, answer it again).
- Every Build a Sentence item was tried in other orders; the extra box cannot make a correct sentence.
- No two tasks of the form use the same situation.

## 5. Mistakes found while reviewing forms 01 to 09

- **Build a Sentence with two valid orders.** "the meetings are a lot of fun" / "a lot of the meetings are fun";
  "Did they say what time it will close?" / "What time did they say it will close?"; "I chose the one that fits..."
  / "The one that I chose fits...". Fix by fixing the opening words in `prefix` or by joining the movable words to
  a neighbour in one box. Try every item starting from each box.
- **Authors working separately write the same generic items.** Before finishing, compare response prompts, Build a
  Sentence contexts and answers, and Listen and Repeat sentences with every other form, looking for near matches,
  not only identical text. Prompts about turning music down, a shuttle to the station, a guest lecture, covering a
  shift, keeping an eye on a bag and "front steps being repaired" each appeared in two or three drafts.
- **A more natural word than the key.** "works in three st[eps]" made solvers write "stages"; use the collocation a
  reader expects.
- **A distractor that is true on a second reading** ("does not include the cost of delivery" beside a free-shipping
  line). Make each wrong option contradict a specific line.

## 6. Content plan for forms 02 to 09

Each form uses only its own row. "R:" marks Module 1, "L:" Lower, "U:" Upper. Details inside a situation are yours.

### Form 02
- Complete the Words: R: photosynthesis (Biology); supply and demand (Economics). L: volcanoes (Geology). U: confirmation bias (Psychology).
- Academic passages: R: green roofs in cities (Urban studies). U: cooking and human evolution (Anthropology).
- Academic talks: R: why Pluto is no longer called a planet (Astronomy); the moving assembly line (Business history). U: coral bleaching (Environmental science); how children learn their first language (Linguistics).
- Conversations: R: registrar's office, adding a class after the deadline; two roommates dividing cleaning duties; professor's feedback on a lab report draft; a bike shop and a flat tire. L: two classmates arranging to study at a café. U: a student and an academic advisor about changing majors.
- Announcements: R: a campus shuttle route change; a professor announcing a guest speaker. L: a gym pool closed for cleaning; first meeting of a language exchange club; a teacher's reminder to return textbooks. U: a career fair moved to a new date with a new sign-up procedure.
- Daily-life texts: R: laundry room sign (2); landlord's email about an inspection (3); text messages about a group gift (2); webpage listing weekend workshops (3). L: advertisement for used furniture (2); instructions for a library self-checkout machine (3).
- Email: your group must present on Monday but one member will be away at a competition; write to Professor Lindqvist.
- Discussion: education policy - should universities require every student to take courses outside their major?
- Listen and Repeat: you are training to work at a campus café. Interview topic: sleep habits.

### Form 03
- Complete the Words: R: plate tectonics (Geology); human memory (Psychology). L: the printing press (History). U: urbanization (Sociology).
- Academic passages: R: why people procrastinate (Psychology). U: tree rings as a record of the past (Environmental science).
- Academic talks: R: how bats use echolocation (Zoology); why countries trade with each other (Economics). U: why Roman concrete has lasted (Engineering); the strength of weak ties (Sociology).
- Conversations: R: campus print center, collecting a poster; two friends deciding what to cook for a shared dinner; a student asking a professor for a place in a full seminar; returning shoes to a store. L: two students looking for a classroom. U: two students discussing a job offer versus finishing a degree first.
- Announcements: R: a museum guide's rules before a tour; a professor changing an assignment's due date and format. L: new cafeteria opening hours; a school sports day; a train platform change. U: a study-abroad information session with eligibility conditions.
- Daily-life texts: R: café menu board (2); email from a department assistant about changed office hours (3); social post about a lost cat (2); apartment rental advertisement (3). L: store receipt with a return policy (2); memo to employees about new parking rules (3).
- Email: an online seller sent the wrong edition of a textbook and class starts next week; write to the seller's customer service manager, Ms. Brandt.
- Discussion: business - should companies let employees work from home permanently?
- Listen and Repeat: you are training to be a museum guide. Interview topic: cooking and eating habits.

### Form 04
- Complete the Words: R: the immune system (Biology); renewable energy (Environmental science). L: the Silk Road (History). U: inflation (Economics).
- Academic passages: R: how languages borrow words (Linguistics). U: finding planets around other stars (Astronomy).
- Academic talks: R: the placebo effect (Psychology); why deserts are cold at night (Geography). U: the tragedy of the commons (Economics); light made by deep-sea animals (Marine biology).
- Conversations: R: housing office, asking to change rooms; two coworkers swapping shifts at a part-time job; a student and a teaching assistant about a quiz grade; a post office and a package going abroad. L: two students choosing a movie. U: a student unsure about presenting at a student conference, with a professor.
- Announcements: R: a community center moving a yoga class; a professor on safety goggles for the next lab. L: a store closing in fifteen minutes; a school library book sale; class photo day. U: a university changing its course registration to staggered times.
- Daily-life texts: R: street-cleaning parking notice (2); dentist's office email confirming an appointment (3); text messages rescheduling a tutoring session (2); museum membership webpage (3). L: short restaurant review (2); form with instructions for returning a product (3).
- Email: you want a recommendation letter from Professor Haddad for a summer program whose deadline is close.
- Discussion: environmental studies - is it better to ban single-use plastic bags or to charge a fee for them?
- Listen and Repeat: you are learning how to show new members around a fitness center. Interview topic: travel and vacations.

### Form 05
- Complete the Words: R: food chains (Ecology); the Industrial Revolution (History). L: glaciers (Earth science). U: democracy (Political science).
- Academic passages: R: umami, the fifth taste (Food science). U: the first paper money (Economic history).
- Academic talks: R: how hurricanes form (Meteorology); the invention of perspective in painting (Art history). U: how octopuses change color (Biology); gift giving as an economic system (Anthropology).
- Conversations: R: campus health center, making an appointment; two neighbors and a package left at the wrong door; a student who missed a quiz because a bus broke down, with a professor; ordering a cake at a bakery. L: two students planning to watch a football match. U: two students about a group member who is not doing their share.
- Announcements: R: a delayed train; a professor explaining a field notebook check. L: swimming pool rules; school concert tickets; lost property at a shopping mall. U: a scholarship office's new application portal and required documents.
- Daily-life texts: R: note on a shared refrigerator (2); internet provider's email about a technician's visit (3); social post selling concert tickets (2); weekend film festival schedule (3). L: text messages about meeting at a station (2); library letter about overdue fines (3).
- Email: your mock interview at the career center now clashes with a rescheduled exam; write to the career adviser, Ms. Rao.
- Discussion: education technology - should laptops and phones be banned in lecture halls?
- Listen and Repeat: you are training to work at a hotel front desk. Interview topic: music listening habits.

### Form 06
- Complete the Words: R: ocean tides (Oceanography); advertising (Business). L: bird migration (Biology). U: cultural diffusion (Anthropology).
- Academic passages: R: the bilingual brain (Linguistics). U: biomimicry, engineering inspired by nature (Engineering).
- Academic talks: R: how the potato changed Europe (History); why ice floats (Chemistry). U: network effects (Economics); how oral poets remembered long epics (Literature).
- Conversations: R: campus bookstore, selling back textbooks; two friends organizing a surprise birthday party; a librarian helping a student reach a journal article from home; a customer choosing a rain jacket in an outdoor shop. L: asking a classmate the way to the lab building. U: a student who wants to change a thesis topic and a doubtful professor.
- Announcements: R: a campus blood-donation drive; a professor making a quiz open-book. L: a tour bus stopping for lunch; a café's daily special; a teacher asking for permission slips. U: a residence hall's summer storage policy with limits and deadlines.
- Daily-life texts: R: elevator maintenance sign (2); hiring manager's email arranging an interview (3); text messages about borrowing a calculator (2); instruction card for a rice cooker (3). L: dry-cleaning receipt (2); webpage for community language classes (3).
- Email: two of your final exams are scheduled at the same time; write to Professor Whitfield.
- Discussion: sociology - has social media made people more connected or more isolated?
- Listen and Repeat: you are learning how to volunteer at an animal shelter. Interview topic: shopping habits.

### Form 07
- Complete the Words: R: earthquakes (Geology); vitamins (Health science). L: Egyptian hieroglyphs (History). U: globalization (Economics).
- Academic passages: R: how habits form (Psychology). U: penicillin and the problem of resistance (History of science).
- Academic talks: R: how tall buildings resist wind (Architecture); crop rotation (Agriculture). U: why the sky is blue (Physics); languages in danger of disappearing (Linguistics).
- Conversations: R: financial aid office and a missing document; two friends about looking after a dog for a week; a student asking a professor for extra reading; a hotel guest reporting a noisy room. L: two students about joining the school choir. U: two student lab assistants deciding whether to report an error in shared data.
- Announcements: R: safety rules on a boat tour; a professor forming teams for a group assignment. L: a school closed because of snow; a museum closing soon; a coach moving practice indoors. U: a library's new rules for overnight study rooms and card access.
- Daily-life texts: R: notice that water will be shut off in an apartment building (2); airline email about a changed flight time (3); social media invitation to a book club (2); table of gym membership plans (3). L: text messages between coworkers about covering a shift (2); flyer for a neighborhood yard sale (3).
- Email: you left a jacket with your keys in a lecture hall after a public lecture; write to the building coordinator, Ms. Okonkwo.
- Discussion: public health - should governments tax sugary drinks?
- Listen and Repeat: you are training to work at a train station information desk. Interview topic: friendship and keeping in touch.

### Form 08
- Complete the Words: R: the solar system (Astronomy); brands (Marketing). L: rainforests (Ecology). U: the scientific method (Science studies).
- Academic passages: R: third places, where communities meet (Sociology). U: the bacteria that live inside us (Biology).
- Academic talks: R: how the compass changed navigation (History of technology); too many choices (Psychology). U: urban heat islands (Environmental science); how fossils form (Paleontology).
- Conversations: R: ID card office, replacing a lost student card; two friends budgeting a road trip; a student choosing between two elective courses with a professor; arranging furniture delivery in a store. L: borrowing lecture notes after an absence. U: an internship supervisor giving mid-term feedback with implied criticism.
- Announcements: R: a public library's author reading; a professor replacing next week's class with an online module. L: feeding time at a zoo; a late school bus; a cafeteria menu change. U: a university IT office's planned email outage and how to prepare.
- Daily-life texts: R: park entrance rules sign (2); professor's email to a class about a field trip (3); text messages about collecting someone from a delayed flight (2); online product page for headphones with a return policy (3). L: memo about cleaning out a break-room refrigerator (2); letter welcoming a new tenant (3).
- Email: you would like to volunteer as an assistant in Professor Marlowe's research lab.
- Discussion: labor economics - should unpaid internships be allowed?
- Listen and Repeat: you are learning the safety rules of a teaching laboratory. Interview topic: learning new skills and hobbies.

### Form 09
- Complete the Words: R: DNA (Biology); weather and climate (Earth science). L: Roman roads (History). U: nudges (Behavioral economics).
- Academic passages: R: the invention of the weekend (Social history). U: how the brain rewires itself (Neuroscience).
- Academic talks: R: how plants defend themselves (Botany); why prices end in ninety-nine (Marketing). U: how astronomers detect black holes (Astronomy); the ship of Theseus (Philosophy).
- Conversations: R: parking office and a permit; two friends choosing a gift for a retiring teacher; a student revising a rejected project proposal with a professor; a tailor's shop altering a suit. L: two students with a free hour after a canceled class. U: two students disagreeing about the value of a semester abroad.
- Announcements: R: a campus theater before a performance; a professor on a mid-semester feedback survey. L: a supermarket special offer; swimming lesson sign-up; a class moved to another room today. U: a graduate school's thesis submission deadline and format check.
- Daily-life texts: R: out-of-order notice on a vending machine with refund information (2); volunteer coordinator's email confirming a shift (3); text messages about a surprise visit (2); train timetable with notes (3). L: advertisement for a tutoring service (2); instructions for setting up home Wi-Fi (3).
- Email: you received a campus parking ticket although a valid permit was displayed; write to Mr. Deng at the Parking Office.
- Discussion: political science - should voting be compulsory?
- Listen and Repeat: you are assisting the teacher of a cooking class. Interview topic: volunteering and community.
