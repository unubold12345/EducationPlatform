// Original IELTS-style listening tests for the Workshop Listening Lab. Not taken from any IELTS paper and
// different from the mock exam conversations. Each drill is one full part (10 marks) recorded in the same
// format as the IELTS mocks: narrator introduction, reading time, two halves and checking time.
// Audio is generated from recordingLines() by scripts/generate-listening-lab-audio.py; editing a line changes
// the drill key, and the unit test then asks for the audio to be regenerated.

export type ListeningVoice="narrator"|"woman"|"man"|"tutor";
export type ListeningLine={voice:ListeningVoice;speaker:string;text:string;say?:string;pauseAfter?:number};
export type GapQuestion={kind:"gap";prompt:string;answers:string[];evidence:string};
export type ChoiceQuestion={kind:"choice";prompt:string;options:string[];answer:number;evidence:string};
export type MatchQuestion={kind:"match";prompt:string;answer:number;evidence:string};
export type TwoQuestion={kind:"two";prompt:string;options:string[];answers:[number,number];evidence:[string,string]};
export type ListeningQuestion=GapQuestion|ChoiceQuestion|MatchQuestion|TwoQuestion;
export type QuestionGroup={instruction:string;limit?:string;heading?:string;options?:string[];questions:ListeningQuestion[]};
export type ListeningDrill={
 id:string;test:1|2;part:1|2|3|4;title:string;intro:string;skill:string;
 halves:[ListeningLine[],ListeningLine[]];groups:QuestionGroup[];
};

export const READ_PAUSE=20,MIDDLE_PAUSE=15,CHECK_PAUSE=15;
const ONE="Write ONE WORD AND/OR A NUMBER for each answer.";
const TWO="Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.";
const CHOOSE="Choose the correct letter, A, B or C.";

export const listeningDrills:ListeningDrill[]=[
 // ── Test 1 ──────────────────────────────────────────────────────────────────────────────────────────
 {
  id:"t1-cottage",test:1,part:1,title:"Renting a holiday cottage",skill:"Form completion",
  intro:"You will hear a man phoning a holiday letting agency about renting a cottage.",
  halves:[[
   {voice:"woman",speaker:"Agent",text:"Good afternoon, Coastline Holiday Lets. Jenny speaking. How can I help?"},
   {voice:"man",speaker:"Mark",text:"Hello. I'm hoping to rent a cottage for a week in August. My family and I went to the coast last year, but we stayed in a hotel, and this time we'd like somewhere with a kitchen and a bit more space."},
   {voice:"woman",speaker:"Agent",text:"Of course. Let me take a few details first, and then I can tell you what's available. Can I have your name, please?"},
   {voice:"man",speaker:"Mark",text:"Yes, it's Mark Ellingham. That's E, double L, I, N, G, H, A, M."},
   {voice:"woman",speaker:"Agent",text:"Thank you. And how many people will be staying?"},
   {voice:"man",speaker:"Mark",text:"Well, there's my wife and me, our two children, and my mother-in-law. Actually, she may only come for part of the week, but I'd better say five to be safe."},
   {voice:"woman",speaker:"Agent",text:"Five it is. Which week were you thinking of?"},
   {voice:"man",speaker:"Mark",text:"We'd like to arrive on Saturday the ninth of August. We originally thought about the second, but my son has a football tournament that weekend, so the ninth is better."},
   {voice:"woman",speaker:"Agent",text:"The ninth, leaving on the sixteenth. Now, do you have a particular location in mind? We have properties in the town itself and some out in the countryside."},
   {voice:"man",speaker:"Mark",text:"The countryside sounds peaceful, but we'd really like to be near the beach. Last year the hotel was in the town centre, and we spent far too much time in the car."},
   {voice:"woman",speaker:"Agent",text:"I understand. And is there anything else you need? Some guests bring pets, for instance."},
   {voice:"man",speaker:"Mark",text:"No pets, but we do need parking. We'll have two bicycles on the back of the car, so somewhere with a garage would be perfect, although a private driveway would be fine."},
  ],[
   {voice:"woman",speaker:"Agent",text:"Right. I have two cottages that would suit you. The first is called Harbour View. It's an old fisherman's house, about two minutes from the sand, with three bedrooms."},
   {voice:"man",speaker:"Mark",text:"That sounds lovely. What's the price for the week?"},
   {voice:"woman",speaker:"Agent",text:"In August it's eight hundred and fifty pounds. There's also a cleaning charge of forty pounds, which is added at the end."},
   {voice:"man",speaker:"Mark",text:"Hmm. And the other one?"},
   {voice:"woman",speaker:"Agent",text:"The second is Rose Cottage. It's a little further from the sea, about ten minutes on foot, but it's larger, with four bedrooms and a big garden. That one is seven hundred and twenty pounds, and the cleaning is included."},
   {voice:"man",speaker:"Mark",text:"Rose Cottage sounds like better value, and the children would love a garden. Does it have a garage?"},
   {voice:"woman",speaker:"Agent",text:"Yes, there's one at the side of the house. The only thing I should mention is that the kitchen doesn't have a dishwasher. It's an old building, and the owner hasn't modernised everything."},
   {voice:"man",speaker:"Mark",text:"We can live without that. What about the internet? My wife may need to do a little work while we're away."},
   {voice:"woman",speaker:"Agent",text:"There's wireless internet throughout the house, although the signal is weaker in the garden."},
   {voice:"man",speaker:"Mark",text:"That's fine. How do we pay?"},
   {voice:"woman",speaker:"Agent",text:"We take a deposit of twenty per cent to secure the booking, and the rest is due four weeks before you arrive."},
   {voice:"man",speaker:"Mark",text:"And how do we collect the keys? We probably won't arrive until the evening."},
   {voice:"woman",speaker:"Agent",text:"That's no problem. They're kept in a key safe by the front door. We'll send you the code by text message the day before you arrive."},
   {voice:"man",speaker:"Mark",text:"Perfect. Let's book Rose Cottage, then."},
  ]],
  groups:[
   {instruction:"Complete the form below.",limit:ONE,heading:"Holiday booking form",questions:[
    {kind:"gap",prompt:"Name: Mark ______",answers:["Ellingham"],evidence:"E, double L, I, N, G, H, A, M"},
    {kind:"gap",prompt:"Number of guests: ______",answers:["5","five"],evidence:"I'd better say five to be safe"},
    {kind:"gap",prompt:"Arrival: Saturday ______ August",answers:["9","9th","ninth","the ninth","the 9th"],evidence:"arrive on Saturday the ninth of August"},
    {kind:"gap",prompt:"Preferred location: near the ______",answers:["beach"],evidence:"we'd really like to be near the beach"},
    {kind:"gap",prompt:"Parking: ideally a ______",answers:["garage"],evidence:"somewhere with a garage would be perfect"},
   ]},
   {instruction:"Complete the notes below.",limit:TWO,heading:"Rose Cottage",questions:[
    {kind:"gap",prompt:"Distance from the sea: ______ minutes on foot",answers:["10","ten"],evidence:"about ten minutes on foot"},
    {kind:"gap",prompt:"Price for the week: £______",answers:["720","seven hundred and twenty","seven hundred twenty"],evidence:"seven hundred and twenty pounds"},
    {kind:"gap",prompt:"Kitchen has no ______",answers:["dishwasher"],evidence:"the kitchen doesn't have a dishwasher"},
    {kind:"gap",prompt:"Deposit: ______ per cent",answers:["20","twenty","20%"],evidence:"a deposit of twenty per cent"},
    {kind:"gap",prompt:"Key safe code sent by ______",answers:["text message","text","text messages","sms"],evidence:"by text message"},
   ]},
  ],
 },
 {
  id:"t1-marathon",test:1,part:2,title:"Volunteering at a half marathon",skill:"Multiple choice · matching",
  intro:"You will hear a race organiser talking to a group of new volunteers.",
  halves:[[
   {voice:"woman",speaker:"Organiser",text:"Good evening, everyone, and thank you for coming. My name's Helen Price, and I'm the volunteer coordinator for the Northbridge Half Marathon. This is our twelfth year, and with almost six thousand runners registered, it'll be the biggest race we've ever held. None of that would be possible without people like you."},
   {voice:"woman",speaker:"Organiser",text:"Let me start with the most important change this year. In the past, the race began in the market square, but the square is being repaired, so the start has moved to Victoria Park. The finish line is in the same place as always, outside the sports centre."},
   {voice:"woman",speaker:"Organiser",text:"Many of you have asked what time you need to arrive. The race itself starts at nine o'clock, but volunteers must be in position by seven thirty. Please don't come any later than that, because some roads close at a quarter to eight, and you may not be able to get through."},
   {voice:"woman",speaker:"Organiser",text:"You'll each receive a bright yellow jacket. Last year they were orange, but runners told us they were hard to see against the autumn leaves, so we've changed them. Please wear your jacket at all times, as it shows the police that you're an official helper."},
   {voice:"woman",speaker:"Organiser",text:"Food is something people always ask about. We won't be providing a full lunch, but every volunteer will get a voucher for a hot drink and a sandwich from the café at the sports centre."},
   {voice:"woman",speaker:"Organiser",text:"Now, there's one thing I'd like you to remember above all. If a runner looks unwell, don't try to treat them yourself, even if you have first-aid training. Your job is to call the medical team straight away on the number printed on your badge, and stay with the runner until help arrives."},
  ],[
   {voice:"woman",speaker:"Organiser",text:"Let me now explain where you'll be working. Each of you has a location printed on your badge."},
   {voice:"woman",speaker:"Organiser",text:"Those of you at the Victoria Park gate will be the first people the runners meet. You won't be giving out race packs, because runners collected those last week. Instead, you'll make sure that everyone entering the starting area is wearing a race number, as only registered runners are allowed in."},
   {voice:"woman",speaker:"Organiser",text:"Along the route there are four water stations. The local scouts have offered to hand out the cups of water this year, so volunteers there will have a different job. Runners drop a lot of plastic, and your task will be to pick up empty bottles before anyone slips on them."},
   {voice:"woman",speaker:"Organiser",text:"At the river bridge, the road is narrow, and there are always crowds of spectators. The volunteers at the bridge will show people the safest way to cross to the other side without walking into the path of the runners. You'll have maps to hand out."},
   {voice:"woman",speaker:"Organiser",text:"Inside the sports centre hall, we run a bag store. Runners leave their bags with us before the race and pick them up afterwards. Please check the ticket number carefully before you hand anything back."},
   {voice:"woman",speaker:"Organiser",text:"Finally, the team at the finish line. You don't need to worry about recording times, because every runner has an electronic chip in their shoe that does that automatically. What you will be doing is placing a medal around the neck of each runner as they cross the line, which I think is the best job of the day."},
  ]],
  groups:[
   {instruction:CHOOSE,questions:[
    {kind:"choice",prompt:"This year's race will be",options:["shorter than in previous years.","the largest one so far.","held on a different day."],answer:1,evidence:"it'll be the biggest race we've ever held"},
    {kind:"choice",prompt:"What has changed about the route?",options:["The race starts in a different place.","The finish line has moved to the market square.","The race no longer passes the sports centre."],answer:0,evidence:"the start has moved to Victoria Park"},
    {kind:"choice",prompt:"Volunteers must be in position by",options:["7.30.","7.45.","9.00."],answer:0,evidence:"volunteers must be in position by seven thirty"},
    {kind:"choice",prompt:"Why have the jackets changed colour?",options:["The old ones were too expensive.","Runners found them hard to see.","The police asked for a change."],answer:1,evidence:"runners told us they were hard to see against the autumn leaves"},
    {kind:"choice",prompt:"If a runner seems unwell, volunteers should",options:["give first aid if they are trained.","take the runner to the sports centre.","phone the medical team."],answer:2,evidence:"call the medical team straight away"},
   ]},
   {instruction:"What will volunteers do at each location? Choose FIVE answers from the box and write the correct letter, A–G.",options:["handing out medals","giving directions to spectators","collecting empty bottles","checking runners' numbers","looking after bags","recording finishing times","giving out race packs"],questions:[
    {kind:"match",prompt:"Victoria Park gate",answer:3,evidence:"everyone entering the starting area is wearing a race number"},
    {kind:"match",prompt:"Water stations",answer:2,evidence:"pick up empty bottles"},
    {kind:"match",prompt:"River bridge",answer:1,evidence:"show people the safest way to cross"},
    {kind:"match",prompt:"Sports centre hall",answer:4,evidence:"we run a bag store"},
    {kind:"match",prompt:"Finish line",answer:0,evidence:"placing a medal around the neck of each runner"},
   ]},
  ],
 },
 {
  id:"t1-breakfast",test:1,part:3,title:"A survey on breakfast habits",skill:"Multiple choice · matching",
  intro:"You will hear two students, Leo and Priya, talking to their tutor about a survey they carried out.",
  halves:[[
   {voice:"tutor",speaker:"Tutor",text:"Come in, both of you. So, you've finished collecting the data for your breakfast survey. How did it go?"},
   {voice:"woman",speaker:"Priya",text:"Better than we expected, actually. We were aiming for a hundred responses, and in the end we got a hundred and forty."},
   {voice:"tutor",speaker:"Tutor",text:"That's impressive. How did you manage that?"},
   {voice:"man",speaker:"Leo",text:"At first we put the questionnaire online, but hardly anyone filled it in. So we stood outside the library with paper forms instead. People seemed happier to answer when they could see who was asking."},
   {voice:"tutor",speaker:"Tutor",text:"Interesting. And what was the main finding?"},
   {voice:"woman",speaker:"Priya",text:"Well, we'd assumed that students skip breakfast because they get up late. But the most common reason was actually that they simply don't feel hungry in the morning. Getting up late came second."},
   {voice:"man",speaker:"Leo",text:"And cost hardly came up at all, which surprised me, because everyone complains about food prices."},
   {voice:"tutor",speaker:"Tutor",text:"Did you find any difference between first-year and final-year students?"},
   {voice:"man",speaker:"Leo",text:"Yes. Final-year students were much more likely to skip breakfast. We think it's partly because many of them live off campus and have longer journeys."},
   {voice:"woman",speaker:"Priya",text:"Although we can't prove that. We didn't ask where people lived, which was a mistake."},
   {voice:"tutor",speaker:"Tutor",text:"That's a fair point for your limitations section. What about the question on concentration?"},
   {voice:"woman",speaker:"Priya",text:"Students who ate breakfast said they found it easier to concentrate in morning lectures. But of course, that's only what they told us. We didn't measure their concentration in any way."},
   {voice:"tutor",speaker:"Tutor",text:"Exactly. Make that clear in the report."},
  ],[
   {voice:"tutor",speaker:"Tutor",text:"Now, let's look at your draft report. Your introduction is clear, but at the moment it relies on just one article. You need to show that you've read more widely, so find at least three other sources."},
   {voice:"man",speaker:"Leo",text:"OK. We weren't sure how many we needed."},
   {voice:"tutor",speaker:"Tutor",text:"The content of the method section is fine, but you've written it as if you're still planning the survey. It all happened, so describe what you did, not what you will do."},
   {voice:"woman",speaker:"Priya",text:"Right, so change it to the past tense. That's easy enough to fix."},
   {voice:"tutor",speaker:"Tutor",text:"The results section is the one I'm most concerned about. You've described every number in long paragraphs. A reader would understand it far more quickly if the main figures were shown visually."},
   {voice:"man",speaker:"Leo",text:"We did think about that, but we weren't sure which type would be best."},
   {voice:"tutor",speaker:"Tutor",text:"A simple bar chart would do. Then the discussion. There's a lot of good thinking in there, but it's nearly twice as long as the word limit allows. Keep the strongest points and cut the rest."},
   {voice:"woman",speaker:"Priya",text:"That'll be painful, but I see what you mean."},
   {voice:"tutor",speaker:"Tutor",text:"And finally, the conclusion. It's only three sentences long, and it repeats much of what you say at the end of the discussion. I'd suggest you merge the two."},
   {voice:"man",speaker:"Leo",text:"So one section instead of two. Fine."},
   {voice:"tutor",speaker:"Tutor",text:"Oh, and your copy of the questionnaire is in the middle of the method section at the moment. That should really go at the end, in an appendix."},
  ]],
  groups:[
   {instruction:CHOOSE,questions:[
    {kind:"choice",prompt:"How many responses did the students receive?",options:["fewer than they wanted","exactly the number they planned","more than they had hoped for"],answer:2,evidence:"in the end we got a hundred and forty"},
    {kind:"choice",prompt:"Why did they change the way they collected data?",options:["The online form had technical problems.","Few people responded online.","Their tutor recommended paper forms."],answer:1,evidence:"hardly anyone filled it in"},
    {kind:"choice",prompt:"The most common reason for skipping breakfast was",options:["getting up late.","not feeling hungry.","the cost of food."],answer:1,evidence:"they simply don't feel hungry in the morning"},
    {kind:"choice",prompt:"What mistake do the students admit?",options:["not asking where students lived","surveying only first-year students","asking too many questions"],answer:0,evidence:"We didn't ask where people lived"},
    {kind:"choice",prompt:"What is true about the concentration findings?",options:["They are based only on what students said.","They were measured in lectures.","They will be removed from the report."],answer:0,evidence:"that's only what they told us"},
   ]},
   {instruction:"What does the tutor suggest for each section of the report? Choose FIVE answers from the box and write the correct letter, A–G.",options:["shorten it","add a chart","move it to an appendix","include more sources","change the tense","combine it with another section","add more examples"],questions:[
    {kind:"match",prompt:"Introduction",answer:3,evidence:"find at least three other sources"},
    {kind:"match",prompt:"Method",answer:4,evidence:"change it to the past tense"},
    {kind:"match",prompt:"Results",answer:1,evidence:"A simple bar chart would do"},
    {kind:"match",prompt:"Discussion",answer:0,evidence:"Keep the strongest points and cut the rest"},
    {kind:"match",prompt:"Conclusion",answer:5,evidence:"I'd suggest you merge the two"},
   ]},
  ],
 },
 {
  id:"t1-honeybees",test:1,part:4,title:"How honeybees communicate",skill:"Note completion",
  intro:"You will hear part of a lecture about how honeybees share information.",
  halves:[[
   {voice:"man",speaker:"Lecturer",text:"Good morning. Today we're going to look at one of the most remarkable systems of communication in the animal world: the way honeybees tell each other where to find food."},
   {voice:"man",speaker:"Lecturer",text:"A honeybee colony depends on a group of workers known as foragers. Their job is to leave the hive and search for flowers that produce nectar and pollen. When a forager discovers a good source of food, she returns to the hive and performs what scientists call a dance."},
   {voice:"man",speaker:"Lecturer",text:"The first person to explain this behaviour was the Austrian scientist Karl von Frisch, who studied bees for most of his working life. In 1973 he was awarded the Nobel Prize for this work.",say:"The first person to explain this behaviour was the Austrian scientist Karl von Frisch, who studied bees for most of his working life. In nineteen seventy-three he was awarded the Nobel Prize for this work."},
   {voice:"man",speaker:"Lecturer",text:"Von Frisch identified two main types of dance. When food is close to the hive, generally within about fifty metres, the bee performs a round dance. She simply runs in small circles, first in one direction and then the other. This dance doesn't give any direction. It just tells the other bees that food is nearby and that they should go out and search."},
   {voice:"man",speaker:"Lecturer",text:"The other bees also learn something from the smell of the dancer. Tiny traces of scent from the flowers stay on her body, so the bees that follow her know exactly what kind of flower to look for."},
  ],[
   {voice:"man",speaker:"Lecturer",text:"The second type, the waggle dance, is used when food is further away, and it contains a surprising amount of information. The bee runs in a straight line while shaking her body from side to side, then loops back and repeats the movement many times."},
   {voice:"man",speaker:"Lecturer",text:"The direction of that straight run tells the other bees which way to fly. Inside the dark hive, the bee uses gravity as a reference. Straight up represents the direction of the sun. So if the bee runs at an angle of forty degrees to the right of vertical, the food is forty degrees to the right of the sun."},
   {voice:"man",speaker:"Lecturer",text:"Distance is shown by how long the waggle run lasts. Roughly speaking, every second of waggling represents about one kilometre of flight, although this varies between populations of bees."},
   {voice:"man",speaker:"Lecturer",text:"What I find most remarkable is that bees adjust their dance as the day goes on. Because the sun moves across the sky, a dance performed in the morning would be wrong by the afternoon. Bees seem to have an internal clock that allows them to correct for this."},
   {voice:"man",speaker:"Lecturer",text:"Finally, there's a practical reason this matters. Bee populations are falling in many countries, partly because of pesticides, and understanding how bees find food helps farmers decide where to plant the flowers that support them."},
  ]],
  groups:[
   {instruction:"Complete the notes below.",limit:ONE,heading:"Honeybee communication",questions:[
    {kind:"gap",prompt:"Bees that search for food are called ______.",answers:["foragers"],evidence:"known as foragers"},
    {kind:"gap",prompt:"Karl von Frisch won the Nobel Prize in ______.",answers:["1973"],evidence:"In 1973"},
    {kind:"gap",prompt:"Round dance: food is within about ______ metres of the hive.",answers:["50","fifty"],evidence:"within about fifty metres"},
    {kind:"gap",prompt:"The bee runs in small ______.",answers:["circles"],evidence:"runs in small circles"},
    {kind:"gap",prompt:"Other bees learn the type of flower from the dancer's ______.",answers:["smell","scent"],evidence:"from the smell of the dancer"},
    {kind:"gap",prompt:"Waggle dance: the bee runs in a straight ______.",answers:["line"],evidence:"runs in a straight line"},
    {kind:"gap",prompt:"Straight up in the hive represents the ______.",answers:["sun"],evidence:"Straight up represents the direction of the sun"},
    {kind:"gap",prompt:"One second of waggling ≈ one ______ of flight.",answers:["kilometre","kilometer","km"],evidence:"about one kilometre of flight"},
    {kind:"gap",prompt:"Bees correct for the sun's movement with an internal ______.",answers:["clock"],evidence:"an internal clock"},
    {kind:"gap",prompt:"Bee numbers are falling partly because of ______.",answers:["pesticides","pesticide"],evidence:"partly because of pesticides"},
   ]},
  ],
 },
 // ── Test 2 ──────────────────────────────────────────────────────────────────────────────────────────
 {
  id:"t2-swimming",test:2,part:1,title:"Booking swimming lessons",skill:"Form completion",
  intro:"You will hear a woman phoning a leisure centre to book swimming lessons for her son.",
  halves:[[
   {voice:"man",speaker:"Receptionist",text:"Westfield Leisure Centre, good morning. How can I help?"},
   {voice:"woman",speaker:"Anna",text:"Hi. I'd like to book swimming lessons for my son. He's seven, and he's never had proper lessons before."},
   {voice:"man",speaker:"Receptionist",text:"No problem. We run classes for children from four years old. Can I start with his name?"},
   {voice:"woman",speaker:"Anna",text:"Yes, it's Oliver Novak. That's N, O, V, A, K."},
   {voice:"man",speaker:"Receptionist",text:"Thank you. Can he swim at all at the moment?"},
   {voice:"woman",speaker:"Anna",text:"Not really. He's happy in the water, and he can float on his back, but he can't swim a full width yet."},
   {voice:"man",speaker:"Receptionist",text:"Then he'd start in our Starfish group. That's our beginners' level for children aged five to eight."},
   {voice:"woman",speaker:"Anna",text:"Starfish. OK. And when are those classes?"},
   {voice:"man",speaker:"Receptionist",text:"There's one on Monday at half past four and another on Saturday morning at ten."},
   {voice:"woman",speaker:"Anna",text:"Weekdays are difficult. I don't finish work until five, so it would have to be Saturday."},
   {voice:"man",speaker:"Receptionist",text:"Saturday at ten it is. The lessons last thirty minutes, and the course runs for ten weeks."},
   {voice:"woman",speaker:"Anna",text:"And how much does it cost?"},
   {voice:"man",speaker:"Receptionist",text:"For the whole course, it's sixty pounds. Members of the centre pay fifty, but there's a joining fee for membership."},
   {voice:"woman",speaker:"Anna",text:"I'm not a member, and I don't think we'd use the gym, so the normal price is fine."},
  ],[
   {voice:"man",speaker:"Receptionist",text:"Now, a few things you need to know before the first lesson. The changing rooms are very busy on Saturday mornings, so please arrive at least ten minutes early."},
   {voice:"woman",speaker:"Anna",text:"Fine. What does he need to bring?"},
   {voice:"man",speaker:"Receptionist",text:"Just a swimming costume and a towel. We also ask all children to wear a swimming cap. If he doesn't have one, you can buy one at reception for two pounds."},
   {voice:"woman",speaker:"Anna",text:"He's got goggles. Can he wear those?"},
   {voice:"man",speaker:"Receptionist",text:"Yes, goggles are allowed, but we'd rather he didn't wear a watch or any jewellery."},
   {voice:"woman",speaker:"Anna",text:"Do parents stay during the lesson?"},
   {voice:"man",speaker:"Receptionist",text:"You're welcome to watch from the gallery on the first floor. We don't allow parents on the poolside, though, as it can distract the children."},
   {voice:"woman",speaker:"Anna",text:"That's understandable. What happens if he misses a lesson?"},
   {voice:"man",speaker:"Receptionist",text:"We can't give refunds for missed lessons, I'm afraid. But if you let us know a day in advance, he can join a make-up class on Sunday afternoon."},
   {voice:"woman",speaker:"Anna",text:"That's helpful. And at the end of the course?"},
   {voice:"man",speaker:"Receptionist",text:"The instructor assesses every child in the final week, and they all receive a certificate. If he's ready, he'll move up to the next level, which is called Dolphins."},
   {voice:"woman",speaker:"Anna",text:"He'll love that. Thank you very much."},
  ]],
  groups:[
   {instruction:"Complete the form below.",limit:ONE,heading:"Swimming lesson booking",questions:[
    {kind:"gap",prompt:"Child's name: Oliver ______",answers:["Novak"],evidence:"N, O, V, A, K"},
    {kind:"gap",prompt:"Current ability: can float on his ______",answers:["back"],evidence:"he can float on his back"},
    {kind:"gap",prompt:"Group: ______",answers:["Starfish"],evidence:"he'd start in our Starfish group"},
    {kind:"gap",prompt:"Day: ______ at 10 a.m.",answers:["Saturday","Saturdays"],evidence:"so it would have to be Saturday"},
    {kind:"gap",prompt:"Course fee: £______",answers:["60","sixty"],evidence:"For the whole course, it's sixty pounds"},
   ]},
   {instruction:"Complete the notes below.",limit:ONE,heading:"Before the first lesson",questions:[
    {kind:"gap",prompt:"Arrive at least ______ minutes early.",answers:["10","ten"],evidence:"arrive at least ten minutes early"},
    {kind:"gap",prompt:"All children must wear a swimming ______.",answers:["cap"],evidence:"to wear a swimming cap"},
    {kind:"gap",prompt:"Parents can watch from the ______ on the first floor.",answers:["gallery","viewing gallery"],evidence:"watch from the gallery on the first floor"},
    {kind:"gap",prompt:"Missed lessons: make-up class on ______ afternoon.",answers:["Sunday"],evidence:"a make-up class on Sunday afternoon"},
    {kind:"gap",prompt:"Next level: ______",answers:["Dolphins","Dolphin"],evidence:"which is called Dolphins"},
   ]},
  ],
 },
 {
  id:"t2-chocolate",test:2,part:2,title:"A chocolate factory tour",skill:"Multiple choice · matching",
  intro:"You will hear a guide talking to visitors at the start of a tour of a chocolate factory.",
  halves:[[
   {voice:"man",speaker:"Guide",text:"Good morning, everyone, and welcome to Hollis Chocolate. My name's Ben, and I'll be your guide for the next hour and a half."},
   {voice:"man",speaker:"Guide",text:"Before we start, a little history. The company was founded in 1921 by two sisters, Edith and Mary Hollis, who began by making chocolate in their kitchen and selling it at the local market. Today we're still a family business, although we now export to more than thirty countries.",say:"Before we start, a little history. The company was founded in nineteen twenty-one by two sisters, Edith and Mary Hollis, who began by making chocolate in their kitchen and selling it at the local market. Today we're still a family business, although we now export to more than thirty countries."},
   {voice:"man",speaker:"Guide",text:"Many visitors expect to see cocoa growing here, but of course cocoa trees only grow in tropical regions. We buy most of our beans from small farms in Ghana, and we pay above the market price so that the farmers can invest in their land."},
   {voice:"man",speaker:"Guide",text:"For safety reasons, there are a few rules on the tour. You'll need to wear a hairnet, which you'll find in the box by the door, and please don't touch any of the machines. Photography is allowed in most areas, but not in the recipe room, where we develop new flavours. Those recipes are a closely guarded secret."},
   {voice:"man",speaker:"Guide",text:"At the end of the tour, you'll have the chance to make your own chocolate bar. It takes about twenty minutes to set, so you'll be able to take it home with you. And yes, there are free samples along the way, but try not to eat too many before lunch."},
  ],[
   {voice:"man",speaker:"Guide",text:"Let me give you an idea of the route. We'll begin in the Old Kitchen. This is a copy of the room where the Hollis sisters first started, and it's full of the pots and tools they actually used, which the family has kept for over a hundred years."},
   {voice:"man",speaker:"Guide",text:"From there we go to the Roasting Hall. This is where it gets warm. The beans are roasted at around a hundred and thirty degrees, and you'll see them turning in the large drums. The smell is wonderful."},
   {voice:"man",speaker:"Guide",text:"Next is the Moulding Room, where liquid chocolate is poured into shapes. This is where you'll get your first sample. We'll catch a little chocolate as it comes out of the machine, so it'll still be warm."},
   {voice:"man",speaker:"Guide",text:"After that, we'll visit the Studio. A small team of six people decorates our luxury range there. Everything is done by hand, with tiny brushes, and it's fascinating to watch. Some visitors expect to meet our packaging designers in the Studio, but they actually work in a different building."},
   {voice:"man",speaker:"Guide",text:"Finally, the tour ends in the Factory Shop. The products there are the same as in the supermarkets, but because some of the boxes are slightly damaged, the prices are lower, so it's a good chance to pick up a bargain."},
  ]],
  groups:[
   {instruction:CHOOSE,questions:[
    {kind:"choice",prompt:"The company was started by",options:["two sisters.","a married couple.","a group of farmers."],answer:0,evidence:"by two sisters"},
    {kind:"choice",prompt:"Where does the company get most of its cocoa beans?",options:["from its own plantations","from small farms in Ghana","from a local market"],answer:1,evidence:"from small farms in Ghana"},
    {kind:"choice",prompt:"Why does the company pay above the market price?",options:["to guarantee the quality of the beans","so that farmers can invest in their land","because it is required by law"],answer:1,evidence:"so that the farmers can invest in their land"},
    {kind:"choice",prompt:"Visitors are not allowed to take photographs",options:["in the recipe room.","near the machines.","in the factory shop."],answer:0,evidence:"but not in the recipe room"},
    {kind:"choice",prompt:"At the end of the tour, visitors will",options:["taste new flavours.","make their own chocolate bar.","have lunch with the staff."],answer:1,evidence:"make your own chocolate bar"},
   ]},
   {instruction:"What can visitors see or do in each area? Choose FIVE answers from the box and write the correct letter, A–G.",options:["watch beans being roasted","see the original equipment","taste warm chocolate","meet the packaging designers","watch decoration done by hand","see a short film","buy products at reduced prices"],questions:[
    {kind:"match",prompt:"The Old Kitchen",answer:1,evidence:"full of the pots and tools they actually used"},
    {kind:"match",prompt:"The Roasting Hall",answer:0,evidence:"you'll see them turning in the large drums"},
    {kind:"match",prompt:"The Moulding Room",answer:2,evidence:"so it'll still be warm"},
    {kind:"match",prompt:"The Studio",answer:4,evidence:"Everything is done by hand"},
    {kind:"match",prompt:"The Factory Shop",answer:6,evidence:"the prices are lower"},
   ]},
  ],
 },
 {
  id:"t2-language-app",test:2,part:3,title:"Testing a language exchange app",skill:"Multiple choice · choose two",
  intro:"You will hear two students, Sophie and Ahmed, discussing a project in which they tested a language exchange app.",
  halves:[[
   {voice:"man",speaker:"Ahmed",text:"So, Sophie, we need to decide what goes into the final report on the app. Shall we start with how we chose the participants?"},
   {voice:"woman",speaker:"Sophie",text:"Sure. We had twenty volunteers in the end, all from the international students' society. I'd hoped for a wider mix, but the society was the easiest way to reach people quickly."},
   {voice:"man",speaker:"Ahmed",text:"We should admit that in the report. They were all quite confident speakers already, so the results may not apply to beginners."},
   {voice:"woman",speaker:"Sophie",text:"Agreed. What did you think was the most useful feature of the app?"},
   {voice:"man",speaker:"Ahmed",text:"Lots of people mentioned the video calls, but I think the correction tool was the most valuable. When your partner types a correction directly onto your message, you remember it much better."},
   {voice:"woman",speaker:"Sophie",text:"I'd agree. The video calls were popular, but half the participants said the connection kept dropping."},
   {voice:"man",speaker:"Ahmed",text:"And the weakest part?"},
   {voice:"woman",speaker:"Sophie",text:"Definitely the matching system. It's supposed to pair you with someone who shares your interests, but it seemed to match people completely at random. One volunteer who loves football was paired with someone who'd never watched a match."},
   {voice:"man",speaker:"Ahmed",text:"Yes, I remember. And how often did people use it? We asked them to use it three times a week."},
   {voice:"woman",speaker:"Sophie",text:"Most managed about twice a week. The ones who used it more were the ones who'd found a partner in a similar time zone. That seemed to matter more than anything else, even how motivated they were."},
  ],[
   {voice:"woman",speaker:"Sophie",text:"Now, the presentation. We've only got ten minutes. Which recommendations should we focus on?"},
   {voice:"man",speaker:"Ahmed",text:"We came up with five altogether, but there isn't time for all of them. I'd drop the one about adding games. It's a nice idea, but nobody in our group actually asked for it."},
   {voice:"woman",speaker:"Sophie",text:"True. And the one about lowering the subscription price. The app's free for students anyway, so it's not really relevant to our audience."},
   {voice:"man",speaker:"Ahmed",text:"So that leaves improving the matching system, adding a time-zone filter, and making the correction tool work in voice calls."},
   {voice:"woman",speaker:"Sophie",text:"The voice-call idea is good, but it would be very hard for the developers to build. Let's keep it in the report but not in the presentation. The other two came directly from our results, so they're the strongest."},
   {voice:"man",speaker:"Ahmed",text:"Good. Next, we wanted to mention the two things that surprised us most."},
   {voice:"woman",speaker:"Sophie",text:"For me, it was how few people used the text chat. We expected it to be the main way people communicated, but most preferred sending voice messages."},
   {voice:"man",speaker:"Ahmed",text:"And I was surprised that the older participants were more active than the younger ones. I'd assumed it would be the other way round."},
   {voice:"woman",speaker:"Sophie",text:"Me too. The number of people who dropped out didn't surprise me, though. That happens in any study."},
   {voice:"man",speaker:"Ahmed",text:"Right. And the last thing: how should we present the data?"},
   {voice:"woman",speaker:"Sophie",text:"I'd rather avoid a long table on the slides. What if we play two short clips from the interviews? Hearing the participants themselves would be more memorable than a list of numbers."},
   {voice:"man",speaker:"Ahmed",text:"I like that, as long as we have their permission."},
  ]],
  groups:[
   {instruction:CHOOSE,questions:[
    {kind:"choice",prompt:"Why were all the participants from the international students' society?",options:["It was the quickest way to find volunteers.","Their tutor asked them to use the society.","Society members had more free time."],answer:0,evidence:"the society was the easiest way to reach people quickly"},
    {kind:"choice",prompt:"What limitation do they agree to mention in the report?",options:["the small number of participants","the participants' high level of English","the short length of the study"],answer:1,evidence:"They were all quite confident speakers already"},
    {kind:"choice",prompt:"Which feature does Ahmed think was most useful?",options:["video calls","the correction tool","the matching system"],answer:1,evidence:"I think the correction tool was the most valuable"},
    {kind:"choice",prompt:"What was the problem with the matching system?",options:["It was too slow.","It ignored people's interests.","It was hard to understand."],answer:1,evidence:"it seemed to match people completely at random"},
    {kind:"choice",prompt:"Participants who used the app most had partners who",options:["shared their hobbies.","had a similar language level.","lived in a similar time zone."],answer:2,evidence:"found a partner in a similar time zone"},
   ]},
   {instruction:"Choose TWO letters, A–E.",questions:[
    {kind:"two",prompt:"Which TWO recommendations will they include in the presentation?",options:["adding games","lowering the price","improving the matching system","adding a time-zone filter","corrections in voice calls"],answers:[2,3],evidence:["improving the matching system, adding a time-zone filter","The other two came directly from our results"]},
    {kind:"two",prompt:"Which TWO findings surprised the students?",options:["how few people used the text chat","the number of people who dropped out","older participants being more active","how popular the video calls were","how often people used the app"],answers:[0,2],evidence:["how few people used the text chat","the older participants were more active"]},
   ]},
   {instruction:CHOOSE,questions:[
    {kind:"choice",prompt:"How will they present the data?",options:["in a detailed table","with clips from the interviews","with a bar chart"],answer:1,evidence:"play two short clips from the interviews"},
   ]},
  ],
 },
 {
  id:"t2-sleep",test:2,part:4,title:"Sleep and memory",skill:"Note completion",
  intro:"You will hear part of a lecture about the connection between sleep and memory.",
  halves:[[
   {voice:"tutor",speaker:"Lecturer",text:"Good afternoon. In today's lecture, I'll be talking about something every student should know more about: the role that sleep plays in memory."},
   {voice:"tutor",speaker:"Lecturer",text:"For a long time, scientists believed that sleep was simply a period of rest, when the brain more or less switched off. We now know this is completely wrong. During sleep the brain is extremely active, and one of its most important jobs is to process what we learned during the day."},
   {voice:"tutor",speaker:"Lecturer",text:"Sleep happens in cycles that last roughly ninety minutes. Each cycle includes several stages, but the two that matter most for memory are deep sleep and REM sleep, which stands for rapid eye movement.",say:"Sleep happens in cycles that last roughly ninety minutes. Each cycle includes several stages, but the two that matter most for memory are deep sleep and R, E, M sleep, which stands for rapid eye movement."},
   {voice:"tutor",speaker:"Lecturer",text:"Deep sleep seems to be especially important for facts, such as names, dates or vocabulary. During deep sleep, information is moved from a small area of the brain called the hippocampus, which acts as a kind of temporary store, to the outer layer of the brain, where it can be kept for the long term."},
   {voice:"tutor",speaker:"Lecturer",text:"REM sleep, on the other hand, appears to help with skills. Studies with musicians, for example, have shown that people who practise a new piece and then sleep well play it more accurately the next day than those who stay awake for the same length of time.",say:"R, E, M sleep, on the other hand, appears to help with skills. Studies with musicians, for example, have shown that people who practise a new piece and then sleep well play it more accurately the next day than those who stay awake for the same length of time."},
  ],[
   {voice:"tutor",speaker:"Lecturer",text:"So what does this mean in practice? Firstly, staying up all night before an exam is one of the worst things you can do. In one well-known experiment, students who missed a night's sleep were about forty per cent less able to learn new information the following day."},
   {voice:"tutor",speaker:"Lecturer",text:"Secondly, timing matters. Researchers have found that reviewing material shortly before going to bed is particularly effective, because the brain seems to give priority to the most recent information."},
   {voice:"tutor",speaker:"Lecturer",text:"Even short naps can help. A nap of around twenty minutes improves alertness without leaving you feeling heavy. Longer naps, though, can take you into deep sleep, and waking from that leaves many people confused for a while."},
   {voice:"tutor",speaker:"Lecturer",text:"Another factor is light. The blue light from phone and laptop screens reduces the production of a hormone called melatonin, which tells the body that it's time to sleep. So it's a good idea to switch off screens for an hour before bed."},
   {voice:"tutor",speaker:"Lecturer",text:"Finally, caffeine. Many students rely on coffee, but caffeine stays in the body for around six hours, so a cup in the late afternoon can still affect your sleep at night. In our next session, we'll look at the methods used in sleep laboratories."},
  ]],
  groups:[
   {instruction:"Complete the notes below.",limit:ONE,heading:"Sleep and memory",questions:[
    {kind:"gap",prompt:"Sleep was once thought to be just a period of ______.",answers:["rest"],evidence:"simply a period of rest"},
    {kind:"gap",prompt:"Each sleep cycle lasts about ______ minutes.",answers:["90","ninety"],evidence:"last roughly ninety minutes"},
    {kind:"gap",prompt:"Deep sleep is important for remembering ______.",answers:["facts"],evidence:"especially important for facts"},
    {kind:"gap",prompt:"The hippocampus acts as a ______ store.",answers:["temporary"],evidence:"a kind of temporary store"},
    {kind:"gap",prompt:"REM sleep helps with learning ______.",answers:["skills"],evidence:"appears to help with skills"},
    {kind:"gap",prompt:"After a night without sleep, learning falls by about ______ per cent.",answers:["40","forty","40%"],evidence:"about forty per cent less able"},
    {kind:"gap",prompt:"Review material shortly before going to ______.",answers:["bed"],evidence:"shortly before going to bed"},
    {kind:"gap",prompt:"Best nap length: about ______ minutes.",answers:["20","twenty"],evidence:"A nap of around twenty minutes"},
    {kind:"gap",prompt:"Blue light reduces the hormone ______.",answers:["melatonin"],evidence:"a hormone called melatonin"},
    {kind:"gap",prompt:"Caffeine stays in the body for around ______ hours.",answers:["6","six"],evidence:"for around six hours"},
   ]},
  ],
 },
];

export function findListeningDrill(id:string){return listeningDrills.find(d=>d.id===id);}

export type NumberedQuestion={question:ListeningQuestion;group:QuestionGroup;index:number;number:number;marks:number};
// Questions in order with their IELTS numbers: Part 2 starts at 11, and a "choose TWO" item takes two numbers.
export function numberedQuestions(drill:ListeningDrill):NumberedQuestion[] {
 const out:NumberedQuestion[]=[];let number=(drill.part-1)*10+1,index=0;
 for(const group of drill.groups)for(const question of group.questions){
  const marks=question.kind==="two"?2:1;out.push({question,group,index:index++,number,marks});number+=marks;
 }
 return out;
}
export const totalMarks=(drill:ListeningDrill)=>numberedQuestions(drill).reduce((n,q)=>n+q.marks,0);

// The full recording in IELTS order: introduction and reading time, first half, second reading time,
// second half, then checking time. Narrator lines are part of the transcript.
export function recordingLines(drill:ListeningDrill):ListeningLine[] {
 const start=(drill.part-1)*10+1,firstHalf=numberedQuestions(drill).filter(q=>q.number<start+5).reduce((n,q)=>n+q.marks,0);
 const narrator=(text:string,pauseAfter:number):ListeningLine=>({voice:"narrator",speaker:"Narrator",text,pauseAfter});
 return [
  narrator(`Part ${drill.part}. ${drill.intro} First, you have some time to look at questions ${start} to ${start+firstHalf-1}.`,READ_PAUSE),
  ...drill.halves[0],
  narrator(`Now look at questions ${start+firstHalf} to ${start+9}.`,MIDDLE_PAUSE),
  ...drill.halves[1],
  narrator(`That is the end of part ${drill.part}. You now have time to check your answers.`,CHECK_PAUSE),
 ];
}

// Lower-case, trim and drop spacing, currency/percent signs and trailing full stops so "BS9 4RJ" = "bs94rj".
export function normalizeListeningAnswer(value:string){
 return value.normalize("NFKC").toLowerCase().replace(/[\s\-–£$%]/g,"").replace(/\.+$/,"");
}

export function gapCorrect(question:GapQuestion,value:string){
 const given=normalizeListeningAnswer(value);
 return !!given&&question.answers.some(answer=>normalizeListeningAnswer(answer)===given);
}

export type ListeningAnswer=string|number|number[];
// Marks for one question: a "choose TWO" item scores one mark per correct letter, in any order.
export function questionMarks(question:ListeningQuestion,value:ListeningAnswer|undefined):number {
 if(question.kind==="two")return Array.isArray(value)?[...new Set(value)].slice(0,2).filter(v=>question.answers.includes(v)).length:0;
 if(question.kind==="gap")return typeof value==="string"&&gapCorrect(question,value)?1:0;
 return value===question.answer?1:0;
}
export const questionCorrect=(question:ListeningQuestion,value:ListeningAnswer|undefined)=>questionMarks(question,value)===(question.kind==="two"?2:1);
export const evidenceOf=(question:ListeningQuestion)=>question.kind==="two"?question.evidence:[question.evidence];
