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
 id:string;test:1|2|3|4|5;part:1|2|3|4;title:string;intro:string;skill:string;
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
 // ── Test 3 ──────────────────────────────────────────────────────────────────────────────────────────
 {
  id:"t3-library",test:3,part:1,title:"Joining a city library",skill:"Form completion",
  intro:"You will hear a man talking to a librarian about joining a library.",
  halves:[[
   {voice:"woman",speaker:"Librarian",text:"Good morning, Riverside Central Library. Can I help you?"},
   {voice:"man",speaker:"Daniel",text:"Hi, yes. I've just moved to the area, and I'd like to join the library. Do I need to book an appointment?"},
   {voice:"woman",speaker:"Librarian",text:"Not at all. I can fill in the form with you now, and your card will be ready in a couple of minutes. Could I take your name?"},
   {voice:"man",speaker:"Daniel",text:"It's Daniel Okafor. The surname is O, K, A, F, O, R."},
   {voice:"woman",speaker:"Librarian",text:"Thank you. And your address?"},
   {voice:"man",speaker:"Daniel",text:"It's twenty-seven Linden Road. That's L, I, N, D, E, N. I was in a flat on Station Road until last month, so some of my post still goes there."},
   {voice:"woman",speaker:"Librarian",text:"Linden Road, lovely. We also ask about your occupation, just for our records. Are you a student?"},
   {voice:"man",speaker:"Daniel",text:"I was until last year. I'm a nurse now, at the children's hospital."},
   {voice:"woman",speaker:"Librarian",text:"Wonderful. Now, I need to see something with your new address on it. A bank statement is fine, or a bill."},
   {voice:"man",speaker:"Daniel",text:"I haven't had a bank statement yet, and the electricity is in my flatmate's name. Would a gas bill do? I've got one here."},
   {voice:"woman",speaker:"Librarian",text:"That's perfect. And finally, what do you mostly like to read? It helps us decide what to buy."},
   {voice:"man",speaker:"Daniel",text:"I used to read a lot of crime novels, but these days it's mainly history. I'm working my way through a series about ancient Rome."},
  ],[
   {voice:"woman",speaker:"Librarian",text:"Right, here's your card. Let me explain how it works. You can take out up to twelve books at a time. It used to be eight, but we raised the limit this year."},
   {voice:"man",speaker:"Daniel",text:"That's more than enough for me. How long can I keep them?"},
   {voice:"woman",speaker:"Librarian",text:"The loan period is three weeks, and you can renew online twice, as long as nobody else has reserved the book."},
   {voice:"man",speaker:"Daniel",text:"And if I forget to bring something back?"},
   {voice:"woman",speaker:"Librarian",text:"There's a fine of twenty pence a day for each book. Films are more, I'm afraid. They're one pound a day."},
   {voice:"man",speaker:"Daniel",text:"I'd better set a reminder. Do you have computers I can use? My laptop is being repaired."},
   {voice:"woman",speaker:"Librarian",text:"We do, on the first floor. Members can use them free of charge for up to two hours a day. Printing costs extra, though."},
   {voice:"man",speaker:"Daniel",text:"Great. One last thing. My niece is four, and she often stays with me. Is there anything for young children?"},
   {voice:"woman",speaker:"Librarian",text:"Yes, there's a story time for under-fives every Wednesday morning at half past ten. There's also a homework club on Thursdays, but that's for older children."},
   {voice:"man",speaker:"Daniel",text:"The story time would suit her perfectly. Thanks for your help."},
   {voice:"woman",speaker:"Librarian",text:"You're welcome. Enjoy the library."},
  ]],
  groups:[
   {instruction:"Complete the form below.",limit:ONE,heading:"Library membership form",questions:[
    {kind:"gap",prompt:"Name: Daniel ______",answers:["Okafor"],evidence:"O, K, A, F, O, R"},
    {kind:"gap",prompt:"Address: 27 ______ Road",answers:["Linden"],evidence:"L, I, N, D, E, N"},
    {kind:"gap",prompt:"Occupation: ______",answers:["nurse","a nurse"],evidence:"I'm a nurse now"},
    {kind:"gap",prompt:"Proof of address: a ______ bill",answers:["gas"],evidence:"Would a gas bill do"},
    {kind:"gap",prompt:"Mainly reads: ______",answers:["history","history books"],evidence:"these days it's mainly history"},
   ]},
   {instruction:"Complete the notes below.",limit:ONE,heading:"Using the library",questions:[
    {kind:"gap",prompt:"Borrow up to ______ books at a time.",answers:["12","twelve"],evidence:"up to twelve books at a time"},
    {kind:"gap",prompt:"Loan period: ______ weeks",answers:["3","three"],evidence:"The loan period is three weeks"},
    {kind:"gap",prompt:"Late books: ______ pence a day",answers:["20","twenty","20p"],evidence:"a fine of twenty pence a day"},
    {kind:"gap",prompt:"Free computer use: up to ______ hours a day",answers:["2","two"],evidence:"for up to two hours a day"},
    {kind:"gap",prompt:"Story time for under-fives: every ______ morning",answers:["Wednesday","Wednesdays"],evidence:"every Wednesday morning"},
   ]},
  ],
 },
 {
  id:"t3-garden",test:3,part:2,title:"A community garden open day",skill:"Multiple choice · matching",
  intro:"You will hear the coordinator of a community garden talking to visitors at an open day.",
  halves:[[
   {voice:"woman",speaker:"Coordinator",text:"Good morning, everybody, and welcome to the open day at Greenway Community Garden. I'm Rosa, the garden coordinator. Some of you have already put your names down for a plot, and others are just curious, so let me tell you a little about how the place works."},
   {voice:"woman",speaker:"Coordinator",text:"The garden opened nine years ago on land that used to be a car park for the old bus depot. People often assume the council created it, but in fact it was started by a group of neighbours who were tired of looking at an empty space, and the council only became involved later."},
   {voice:"woman",speaker:"Coordinator",text:"We now have sixty plots, and every one of them is taken, so I should be honest about the waiting list. At the moment, new members wait about eight months for a plot of their own. In the meantime, you can join one of the shared beds, which is how most people begin."},
   {voice:"woman",speaker:"Coordinator",text:"Membership costs thirty pounds a year. That doesn't pay for seeds or plants, which you buy yourselves. What it covers is the water we use, and believe me, in a dry summer that is our biggest bill. Tools are donated, so those cost us nothing."},
   {voice:"woman",speaker:"Coordinator",text:"The garden is open to members every day from seven in the morning. We ask everyone to leave by sunset rather than at a fixed time, because, as you can see, there are no lights on the site."},
   {voice:"woman",speaker:"Coordinator",text:"One rule surprises people. You're welcome to bring children, and there's no problem with picnics, but we don't allow dogs, even on a lead. We had too many young plants dug up in our first year."},
  ],[
   {voice:"woman",speaker:"Coordinator",text:"Now, before you explore, let me point out the main areas, because the garden is bigger than it looks."},
   {voice:"woman",speaker:"Coordinator",text:"Straight ahead of you is the greenhouse. We don't keep finished crops in there. It's where seeds are started in trays in early spring, so that the small plants are strong enough to go outside in May."},
   {voice:"woman",speaker:"Coordinator",text:"To the left is the wooden cabin. People assume it's where the tools are locked away, but those are actually kept in a metal container. The cabin is where our committee meets once a month, and where we run workshops on things like pruning."},
   {voice:"woman",speaker:"Coordinator",text:"In the far corner, behind the fence, you'll see three large wooden boxes. That's where all our garden waste goes. It takes about a year to rot down into rich, dark soil, which members can then take for their plots."},
   {voice:"woman",speaker:"Coordinator",text:"The orchard, on your right, has twelve apple and pear trees. Two years ago a local beekeeper asked whether she could put her hives among the trees, and they've been there ever since. Please don't walk too close to them."},
   {voice:"woman",speaker:"Coordinator",text:"And finally, the table by the gate. Whenever members have more vegetables than they can eat, they leave them there, and passers-by buy them for a small price. The money goes into a tin, and last year it paid for our new shed."},
   {voice:"woman",speaker:"Coordinator",text:"Right, do have a wander, and come and find me if you have any questions."},
  ]],
  groups:[
   {instruction:CHOOSE,questions:[
    {kind:"choice",prompt:"The garden was created by",options:["the local council.","a group of local residents.","a bus company."],answer:1,evidence:"it was started by a group of neighbours"},
    {kind:"choice",prompt:"How long do new members currently wait for their own plot?",options:["about eight months","about nine months","about a year"],answer:0,evidence:"wait about eight months for a plot"},
    {kind:"choice",prompt:"The membership fee is used to pay for",options:["seeds and plants.","tools.","water."],answer:2,evidence:"What it covers is the water we use"},
    {kind:"choice",prompt:"Members must leave the garden",options:["at seven in the evening.","when it gets dark.","when the coordinator locks the gate."],answer:1,evidence:"leave by sunset rather than at a fixed time"},
    {kind:"choice",prompt:"What is not allowed in the garden?",options:["dogs","picnics","young children"],answer:0,evidence:"we don't allow dogs, even on a lead"},
   ]},
   {instruction:"What is each part of the garden used for? Choose FIVE answers from the box and write the correct letter, A–G.",options:["keeping bees","storing tools","selling vegetables","growing young plants","washing vegetables","holding meetings and classes","making compost"],questions:[
    {kind:"match",prompt:"The greenhouse",answer:3,evidence:"where seeds are started in trays"},
    {kind:"match",prompt:"The wooden cabin",answer:5,evidence:"where our committee meets once a month"},
    {kind:"match",prompt:"The far corner",answer:6,evidence:"where all our garden waste goes"},
    {kind:"match",prompt:"The orchard",answer:0,evidence:"put her hives among the trees"},
    {kind:"match",prompt:"The table by the gate",answer:2,evidence:"passers-by buy them for a small price"},
   ]},
  ],
 },
 {
  id:"t3-river",test:3,part:3,title:"Plastic in a local river",skill:"Multiple choice · choose two",
  intro:"You will hear two students, Maya and Tom, discussing a project about plastic waste in a local river.",
  halves:[[
   {voice:"man",speaker:"Tom",text:"Hi, Maya. Have you got a minute to talk about the river project? The presentation is only two weeks away."},
   {voice:"woman",speaker:"Maya",text:"Sure. I've been looking at the samples we collected. Honestly, I expected the water near the factory to be the worst, but the highest amount of plastic was actually just below the shopping centre."},
   {voice:"man",speaker:"Tom",text:"That surprised me too. I suppose it's all the takeaway packaging. What about the type of plastic? I assumed it would be mostly bottles."},
   {voice:"woman",speaker:"Maya",text:"There were bottles, but the most common item by far was food wrappers. Bags came third, which I didn't expect, given how many you see caught in the trees."},
   {voice:"man",speaker:"Tom",text:"Maybe the charge for bags in shops is working. Now, our method. We only sampled on three days, and I'm worried that isn't enough."},
   {voice:"woman",speaker:"Maya",text:"I don't think the number of days is the real problem. All three days were dry. If we'd gone after heavy rain, we'd probably have found far more, because rain washes rubbish off the streets and into the river."},
   {voice:"man",speaker:"Tom",text:"Good point. We should say that clearly. Did you manage to speak to anyone at the council?"},
   {voice:"woman",speaker:"Maya",text:"I emailed them twice and heard nothing. In the end, the person who helped most was a volunteer from the local fishing club. He's been recording rubbish in the river for ten years, and he's happy to share his notes with us."},
   {voice:"man",speaker:"Tom",text:"That's brilliant. Ten years of data would let us show a trend."},
   {voice:"woman",speaker:"Maya",text:"Exactly. Though his records are all handwritten, so somebody will have to type them up before we can use them."},
   {voice:"man",speaker:"Tom",text:"I'll do that this weekend. I'm quicker on a keyboard than you are."},
  ],[
   {voice:"woman",speaker:"Maya",text:"So, the presentation itself. We've got fifteen minutes, and the tutor said most groups try to include too much."},
   {voice:"man",speaker:"Tom",text:"Then let's choose. We've got five possible sections: the history of the river, our method, the results, a comparison with other towns, and our recommendations."},
   {voice:"woman",speaker:"Maya",text:"The results have to be in, obviously. And I'd keep the method quite short but include it, because the tutor is marking us on it."},
   {voice:"man",speaker:"Tom",text:"Hmm, I'm not sure about the method. Couldn't we just put it on a handout?"},
   {voice:"woman",speaker:"Maya",text:"Actually, yes, a handout would work. Then the recommendations could have more time, and that's the part the audience will remember."},
   {voice:"man",speaker:"Tom",text:"Agreed. So results and recommendations on the slides. The history is interesting, but it isn't really ours, and we don't have enough data on other towns to compare properly."},
   {voice:"woman",speaker:"Maya",text:"Fine. What shall we recommend? I'd like to suggest more bins along the river path."},
   {voice:"man",speaker:"Tom",text:"The council would say they can't afford to empty them. What about asking the takeaway shops to change their packaging? That's where most of it comes from."},
   {voice:"woman",speaker:"Maya",text:"They'd never agree unless they were forced to. I think the most realistic idea is a monthly clean-up run by volunteers. The fishing club already does one twice a year, so we'd just be building on that."},
   {voice:"man",speaker:"Tom",text:"You're right. It costs nothing, and it's already half organised."},
   {voice:"woman",speaker:"Maya",text:"And how do we open the presentation? I thought about starting with a graph."},
   {voice:"man",speaker:"Tom",text:"A graph is a bit dry for the first minute. Why don't we bring in one of the actual bags of rubbish we collected and put it on the table? Everyone will look at that."},
   {voice:"woman",speaker:"Maya",text:"I love that. A bit smelly, but effective."},
   {voice:"man",speaker:"Tom",text:"Last thing. Who's going to answer the questions at the end?"},
   {voice:"woman",speaker:"Maya",text:"You know the numbers better than I do, but you hate speaking without notes. Shall I take the questions, and you step in if someone asks about a specific figure?"},
   {voice:"man",speaker:"Tom",text:"That sounds fair. Thanks, Maya."},
  ]],
  groups:[
   {instruction:CHOOSE,questions:[
    {kind:"choice",prompt:"Where did the students find the most plastic?",options:["below the shopping centre","near the factory","beside the playing fields"],answer:0,evidence:"just below the shopping centre"},
    {kind:"choice",prompt:"The most common type of plastic was",options:["bottles.","bags.","food wrappers."],answer:2,evidence:"the most common item by far was food wrappers"},
    {kind:"choice",prompt:"What weakness in their method does Maya point out?",options:["They sampled on too few days.","All the samples were taken in dry weather.","The sampling sites were too close together."],answer:1,evidence:"All three days were dry"},
    {kind:"choice",prompt:"Who gave the students the most useful help?",options:["a volunteer from a fishing club","an officer at the council","a manager at the factory"],answer:0,evidence:"a volunteer from the local fishing club"},
    {kind:"choice",prompt:"What will Tom do at the weekend?",options:["collect more samples","type up some records","email the council again"],answer:1,evidence:"I'll do that this weekend"},
   ]},
   {instruction:"Choose TWO letters, A–E.",questions:[
    {kind:"two",prompt:"Which TWO sections will the students put on their slides?",options:["the history of the river","the method","the results","a comparison with other towns","the recommendations"],answers:[2,4],evidence:["The results have to be in","So results and recommendations on the slides"]},
   ]},
   {instruction:CHOOSE,questions:[
    {kind:"choice",prompt:"Which recommendation do they think is the most realistic?",options:["more bins by the river","different takeaway packaging","regular clean-ups by volunteers"],answer:2,evidence:"the most realistic idea is a monthly clean-up"},
    {kind:"choice",prompt:"How will they begin the presentation?",options:["by showing a graph","by showing some rubbish they collected","by playing a short video"],answer:1,evidence:"bring in one of the actual bags of rubbish"},
    {kind:"choice",prompt:"Who will answer questions from the audience?",options:["Maya, with Tom helping on the figures","Tom on his own","both students, taking turns"],answer:0,evidence:"Shall I take the questions"},
   ]},
  ],
 },
 {
  id:"t3-tea",test:3,part:4,title:"A short history of tea",skill:"Note completion",
  intro:"You will hear part of a lecture about the history of tea.",
  halves:[[
   {voice:"man",speaker:"Lecturer",text:"Good afternoon. In this lecture I want to trace the history of a drink that most of us take for granted. After water, tea is the most widely consumed drink in the world, and its story takes us across several continents."},
   {voice:"man",speaker:"Lecturer",text:"According to Chinese legend, tea was discovered almost five thousand years ago by an emperor who liked his drinking water boiled. One day, the story goes, some leaves from a nearby tree blew into his pot, and he enjoyed the taste. Whether or not that's true, we do know that tea was first valued not as an everyday drink but as a medicine."},
   {voice:"man",speaker:"Lecturer",text:"For centuries, tea leaves were not sold loose, as they are today. They were pressed into hard blocks, known as bricks, which were easy to carry over long distances. In some regions these blocks were even used as money."},
   {voice:"man",speaker:"Lecturer",text:"Tea reached Japan in around the ninth century, carried there by monks who had studied in China. They found that it helped them to stay awake during long hours of meditation, and over time the preparation of tea developed into a formal ceremony."},
  ],[
   {voice:"man",speaker:"Lecturer",text:"Tea did not arrive in Europe until the early seventeenth century, when Dutch traders brought the first shipments by sea. At first it was extremely expensive. In England, the leaves were so valuable that wealthy families kept them in a locked box, and the lady of the house carried the key."},
   {voice:"man",speaker:"Lecturer",text:"The price fell dramatically in the nineteenth century. Until then, almost all tea had come from China, but the British began to grow it on a huge scale in India, and later in Sri Lanka. Faster ships, known as clippers, raced each other to bring the new season's tea to London."},
   {voice:"man",speaker:"Lecturer",text:"Two inventions of the early twentieth century changed the way tea was drunk. The first was the tea bag, which was created by accident. An American merchant sent out samples of tea in small bags made of silk, and his customers simply put the whole bag into the pot. The second was iced tea, which became popular at a fair in the United States during an unusually hot summer."},
   {voice:"man",speaker:"Lecturer",text:"Today, tea is grown in more than sixty countries, and the industry employs millions of people. However, it faces a serious challenge. Tea plants need steady rainfall, and in several regions the changing climate is already reducing the size of the harvest. Researchers are now working to develop varieties that can survive with less water."},
  ]],
  groups:[
   {instruction:"Complete the notes below.",limit:ONE,heading:"The history of tea",questions:[
    {kind:"gap",prompt:"In a Chinese legend, tea was discovered by an ______.",answers:["emperor"],evidence:"by an emperor who liked his drinking water boiled"},
    {kind:"gap",prompt:"Tea was first used as a ______.",answers:["medicine"],evidence:"but as a medicine"},
    {kind:"gap",prompt:"Leaves were pressed into hard blocks called ______.",answers:["bricks","brick"],evidence:"known as bricks"},
    {kind:"gap",prompt:"In some regions the blocks were used as ______.",answers:["money"],evidence:"were even used as money"},
    {kind:"gap",prompt:"Tea was taken to Japan by ______.",answers:["monks"],evidence:"carried there by monks"},
    {kind:"gap",prompt:"It was first brought to Europe by ______ traders.",answers:["Dutch"],evidence:"when Dutch traders brought"},
    {kind:"gap",prompt:"Wealthy English families kept tea in a locked ______.",answers:["box"],evidence:"kept them in a locked box"},
    {kind:"gap",prompt:"19th century: the British grew tea on a huge scale in ______.",answers:["India"],evidence:"on a huge scale in India"},
    {kind:"gap",prompt:"The first tea bags were made of ______.",answers:["silk"],evidence:"small bags made of silk"},
    {kind:"gap",prompt:"Harvests are now being reduced by the changing ______.",answers:["climate"],evidence:"the changing climate is already reducing"},
   ]},
  ],
 },
 // ── Test 4 ──────────────────────────────────────────────────────────────────────────────────────────
 {
  id:"t4-removal",test:4,part:1,title:"Booking a removal van",skill:"Form completion",
  intro:"You will hear a woman phoning a removal company about moving house.",
  halves:[[
   {voice:"man",speaker:"Adviser",text:"Good morning, Swift Removals. Paul speaking."},
   {voice:"woman",speaker:"Claire",text:"Hello. I'm moving house next month, and I'd like to get a price for a van and a couple of people to help."},
   {voice:"man",speaker:"Adviser",text:"Certainly. I'll take some details. What's your name, please?"},
   {voice:"woman",speaker:"Claire",text:"Claire Whitlock. That's W, H, I, T, L, O, C, K."},
   {voice:"man",speaker:"Adviser",text:"Thanks, Claire. And where are you moving from?"},
   {voice:"woman",speaker:"Claire",text:"A flat in the city centre, on Bridge Street. It's on the second floor, and I should warn you that there's no lift. The building does have one, but it's been broken since the summer."},
   {voice:"man",speaker:"Adviser",text:"Stairs only. That's useful to know. And where are you going?"},
   {voice:"woman",speaker:"Claire",text:"To a house in Denby. That's D, E, N, B, Y. It's about fifteen miles away."},
   {voice:"man",speaker:"Adviser",text:"I know it. When would you like to move?"},
   {voice:"woman",speaker:"Claire",text:"My contract ends on the twentieth of March, but I'd rather not leave it until the last minute. Could you do the fourteenth? That's a Friday."},
   {voice:"man",speaker:"Adviser",text:"That Friday is free at the moment. Now, is there anything large or awkward? A big wardrobe, for example?"},
   {voice:"woman",speaker:"Claire",text:"The wardrobes are built in, so they're staying. The only difficult thing is a piano. It was my grandmother's, and I couldn't possibly leave it behind."},
   {voice:"man",speaker:"Adviser",text:"No problem. We move those quite often, though we'll need to send a third person."},
  ],[
   {voice:"man",speaker:"Adviser",text:"Right, based on what you've told me, I'd recommend our large van. A medium one would be cheaper, but with a piano you'd need two trips, and that ends up costing more."},
   {voice:"woman",speaker:"Claire",text:"That makes sense. And what would the total be?"},
   {voice:"man",speaker:"Adviser",text:"With three people, it comes to three hundred and forty pounds. That includes insurance for everything we carry."},
   {voice:"woman",speaker:"Claire",text:"That's less than I expected. I was quoted over four hundred by another firm. Do you provide boxes?"},
   {voice:"man",speaker:"Adviser",text:"We do. Thirty boxes are included in the price, and we'll deliver them five days before the move, so you've got time to pack."},
   {voice:"woman",speaker:"Claire",text:"Lovely. Is there anything you won't take?"},
   {voice:"man",speaker:"Adviser",text:"Just one thing, really. We don't carry plants. They get damaged very easily in the back of a van, and our insurance doesn't cover them. Most customers take those in their own car."},
   {voice:"woman",speaker:"Claire",text:"That's fine. I've only got a few. And how do I pay?"},
   {voice:"man",speaker:"Adviser",text:"We'll email you an invoice. We ask customers to pay by bank transfer, and the money needs to arrive before the van leaves your flat. I'm afraid our drivers can't accept cash."},
   {voice:"woman",speaker:"Claire",text:"Understood. What time will they arrive?"},
   {voice:"man",speaker:"Adviser",text:"At eight o'clock sharp. One last piece of advice: do tell your neighbours, because the van will block the street for an hour or so."},
   {voice:"woman",speaker:"Claire",text:"Good idea. I'll put a note through their doors."},
  ]],
  groups:[
   {instruction:"Complete the form below.",limit:ONE,heading:"Removal enquiry",questions:[
    {kind:"gap",prompt:"Customer: Claire ______",answers:["Whitlock"],evidence:"W, H, I, T, L, O, C, K"},
    {kind:"gap",prompt:"Moving from: a flat on the ______ floor",answers:["second","2nd"],evidence:"It's on the second floor"},
    {kind:"gap",prompt:"Moving to: a house in ______",answers:["Denby"],evidence:"D, E, N, B, Y"},
    {kind:"gap",prompt:"Moving date: ______ March",answers:["14","14th","fourteenth","the fourteenth","the 14th"],evidence:"Could you do the fourteenth"},
    {kind:"gap",prompt:"Difficult item: a ______",answers:["piano"],evidence:"The only difficult thing is a piano"},
   ]},
   {instruction:"Complete the notes below.",limit:TWO,heading:"Quotation",questions:[
    {kind:"gap",prompt:"Van recommended: ______",answers:["large","large van","a large van"],evidence:"I'd recommend our large van"},
    {kind:"gap",prompt:"Total cost: £______",answers:["340","three hundred and forty","three hundred forty"],evidence:"three hundred and forty pounds"},
    {kind:"gap",prompt:"Boxes delivered ______ days before the move",answers:["5","five"],evidence:"five days before the move"},
    {kind:"gap",prompt:"The company does not carry ______.",answers:["plants","plant"],evidence:"We don't carry plants"},
    {kind:"gap",prompt:"Payment: by ______",answers:["bank transfer","transfer"],evidence:"pay by bank transfer"},
   ]},
  ],
 },
 {
  id:"t4-museum",test:4,part:2,title:"A family science weekend",skill:"Multiple choice · matching",
  intro:"You will hear a member of staff from a science museum talking on local radio about a family event.",
  halves:[[
   {voice:"man",speaker:"Speaker",text:"Hello, and thanks for having me on the programme. I'm Marcus Bell from the Harcourt Science Museum, and I'm here to tell your listeners about our Family Science Weekend, which takes place on the last weekend of this month."},
   {voice:"man",speaker:"Speaker",text:"This is the fourth time we've run the event. It began as a single afternoon for local schools, but it proved so popular that we now open it to everybody, and last year more than three thousand people came through the doors."},
   {voice:"man",speaker:"Speaker",text:"The theme changes every year. Last time it was the ocean, and before that, space. This year, after a vote among our younger visitors, the theme is the human body, so expect plenty of skeletons."},
   {voice:"man",speaker:"Speaker",text:"A word about tickets. Entry to the museum itself is free, as it always is. However, the workshops have limited places, so for those you do need to book in advance on our website. Please don't just turn up and hope, because they fill up quickly."},
   {voice:"man",speaker:"Speaker",text:"Getting to us is easy, but I wouldn't recommend driving. Our car park will be closed that weekend, because that's where the big outdoor experiments are happening. There's a free bus from the railway station every fifteen minutes instead."},
   {voice:"man",speaker:"Speaker",text:"And if you get hungry, the café will be open as normal. In previous years the queues were terrible, so this time families are also welcome to bring their own food and eat it in the garden behind the museum."},
  ],[
   {voice:"man",speaker:"Speaker",text:"Let me pick out a few of the activities, because there are over twenty and I can't describe them all."},
   {voice:"man",speaker:"Speaker",text:"The most popular with small children will probably be Build a Skeleton. Each child is given a set of cardboard bones to fit together, and the finished model is theirs to keep, which should save parents a visit to the gift shop."},
   {voice:"man",speaker:"Speaker",text:"Then there's the Heart Lab, where a surgeon from the city hospital will show how the heart works, using a real one from an animal. It's fascinating, but it is quite detailed, and we wouldn't recommend it for anyone under the age of eight."},
   {voice:"man",speaker:"Speaker",text:"The Giant Bubble Show needs a lot of space and makes a lot of mess, so we've put that one in the open air rather than in the main hall. If it rains, bring a coat, because it will go ahead whatever the weather."},
   {voice:"man",speaker:"Speaker",text:"On Saturday evening, once the families have gone home, we're holding an event called After Hours. It's a talk about the science of sleep, followed by a quiz, and it's strictly for people aged eighteen and over."},
   {voice:"man",speaker:"Speaker",text:"And finally, the Reaction Race, which tests how quickly you can respond to a light or a sound. It doesn't run continuously. There's one session at eleven in the morning and another at three in the afternoon, so check the timetable when you arrive."},
   {voice:"man",speaker:"Speaker",text:"That's all from me. We look forward to seeing you there."},
  ]],
  groups:[
   {instruction:CHOOSE,questions:[
    {kind:"choice",prompt:"The first Family Science Weekend was",options:["only for schools.","a two-day festival.","held in the city centre."],answer:0,evidence:"It began as a single afternoon for local schools"},
    {kind:"choice",prompt:"What is this year's theme?",options:["space","the ocean","the human body"],answer:2,evidence:"the theme is the human body"},
    {kind:"choice",prompt:"Visitors need to book in advance",options:["to enter the museum.","to take part in a workshop.","to use the free bus."],answer:1,evidence:"for those you do need to book in advance"},
    {kind:"choice",prompt:"Why does the speaker advise against driving?",options:["The car park is being used for the event.","Nearby roads will be closed.","Parking will cost more than usual."],answer:0,evidence:"that's where the big outdoor experiments are happening"},
    {kind:"choice",prompt:"What is different about food this year?",options:["The café will stay open later.","Visitors may bring a picnic.","There will be food stalls outside."],answer:1,evidence:"welcome to bring their own food"},
   ]},
   {instruction:"What does the speaker say about each activity? Choose FIVE answers from the box and write the correct letter, A–G.",options:["It takes place outdoors.","Children must stay with an adult.","It is only for adults.","It happens twice a day.","It lasts the whole day.","Children take something home.","It is unsuitable for young children."],questions:[
    {kind:"match",prompt:"Build a Skeleton",answer:5,evidence:"the finished model is theirs to keep"},
    {kind:"match",prompt:"The Heart Lab",answer:6,evidence:"we wouldn't recommend it for anyone under the age of eight"},
    {kind:"match",prompt:"The Giant Bubble Show",answer:0,evidence:"we've put that one in the open air"},
    {kind:"match",prompt:"After Hours",answer:2,evidence:"strictly for people aged eighteen and over"},
    {kind:"match",prompt:"The Reaction Race",answer:3,evidence:"another at three in the afternoon"},
   ]},
  ],
 },
 {
  id:"t4-cafe",test:4,part:3,title:"A case study of a campus café",skill:"Multiple choice · matching",
  intro:"You will hear two business students, Hannah and Luke, talking to their tutor about a case study of a café.",
  halves:[[
   {voice:"tutor",speaker:"Tutor",text:"Hello, Hannah. Hello, Luke. Sit down. So, you chose the campus café for your business case study. Why that one?"},
   {voice:"woman",speaker:"Hannah",text:"Mainly because it was practical, to be honest. We considered the bookshop in town, but the owner wouldn't let us see any sales figures, whereas the café manager offered us everything."},
   {voice:"tutor",speaker:"Tutor",text:"Access to data matters. And what's the basic problem the café has?"},
   {voice:"man",speaker:"Luke",text:"It's losing customers. Sales are down by about a fifth compared with two years ago. The manager blames the new coffee shop across the road, but we're not convinced."},
   {voice:"woman",speaker:"Hannah",text:"No. When we looked at the figures by time of day, mornings were as busy as ever. Almost all of the fall was at lunchtime."},
   {voice:"tutor",speaker:"Tutor",text:"Interesting. So what's going wrong in the middle of the day?"},
   {voice:"man",speaker:"Luke",text:"We interviewed forty students. Hardly anyone mentioned the prices, which is what we'd expected to hear. The main complaint was the queue. People have fifty minutes between lectures, and they said they can't afford to spend twenty of them waiting."},
   {voice:"tutor",speaker:"Tutor",text:"And did the manager know that?"},
   {voice:"woman",speaker:"Hannah",text:"He knew people were waiting, but he thought the answer was to hire more staff. When we watched the counter for a week, though, the delay wasn't the staff at all. It was the payment system. There's only one till, and it's very slow."},
   {voice:"tutor",speaker:"Tutor",text:"Good observation. How did you record that?"},
   {voice:"man",speaker:"Luke",text:"We timed fifty customers with a stopwatch. I wanted to film the counter instead, but we'd have needed permission from everyone in the shot, so we dropped that idea."},
  ],[
   {voice:"tutor",speaker:"Tutor",text:"Now, your recommendations. You've listed five ideas in your draft. Talk me through them."},
   {voice:"woman",speaker:"Hannah",text:"The first is a second till. From everything we've seen, that would make the biggest difference, so it's going to be the centre of our report."},
   {voice:"tutor",speaker:"Tutor",text:"Fine. And ordering by phone? Lots of cafés do that now."},
   {voice:"man",speaker:"Luke",text:"We like the idea of an app, but we honestly can't say how many students would use one. We'd want to run a short survey before we suggest it seriously."},
   {voice:"tutor",speaker:"Tutor",text:"Sensible. What about the loyalty card?"},
   {voice:"woman",speaker:"Hannah",text:"We were keen on that until we spoke to the manager again. Apparently they had one three years ago, and hardly anybody bothered with it. So there's no point in proposing it as something new."},
   {voice:"tutor",speaker:"Tutor",text:"No. And longer opening hours?"},
   {voice:"man",speaker:"Luke",text:"Staying open in the evening would bring in people from the library, but the manager would have to take on at least two more people to cover those hours. We'll mention it, but with that warning."},
   {voice:"tutor",speaker:"Tutor",text:"And the last one, a shorter lunch menu?"},
   {voice:"woman",speaker:"Hannah",text:"That's my favourite of the small ideas. Fewer dishes means faster service, it costs nothing, and the café could start next week if it wanted to."},
   {voice:"tutor",speaker:"Tutor",text:"Good. Then you have a clear order of importance. Send me the final draft by Friday."},
   {voice:"man",speaker:"Luke",text:"We will. Thank you."},
  ]],
  groups:[
   {instruction:CHOOSE,questions:[
    {kind:"choice",prompt:"Why did the students choose the campus café?",options:["They could get the information they needed.","They had both worked there.","Their tutor suggested it."],answer:0,evidence:"the café manager offered us everything"},
    {kind:"choice",prompt:"The fall in sales has mainly been",options:["in the mornings.","at lunchtime.","in the evenings."],answer:1,evidence:"Almost all of the fall was at lunchtime"},
    {kind:"choice",prompt:"What did students complain about most?",options:["high prices","a limited menu","a long wait"],answer:2,evidence:"The main complaint was the queue"},
    {kind:"choice",prompt:"According to the students, the delay is caused by",options:["a shortage of staff.","a small kitchen.","a slow payment system."],answer:2,evidence:"It was the payment system"},
    {kind:"choice",prompt:"How did they collect information about waiting times?",options:["They filmed the counter.","They timed customers themselves.","They asked staff to keep a record."],answer:1,evidence:"We timed fifty customers with a stopwatch"},
   ]},
   {instruction:"What do the students say about each idea? Choose FIVE answers from the box and write the correct letter, A–G.",options:["It would need extra staff.","It has been tried before.","It would be too expensive.","It will be their main recommendation.","It could be introduced quickly.","Students would dislike it.","It needs more research first."],questions:[
    {kind:"match",prompt:"A second till",answer:3,evidence:"it's going to be the centre of our report"},
    {kind:"match",prompt:"Ordering by app",answer:6,evidence:"run a short survey before we suggest it"},
    {kind:"match",prompt:"A loyalty card",answer:1,evidence:"they had one three years ago"},
    {kind:"match",prompt:"Longer opening hours",answer:0,evidence:"take on at least two more people"},
    {kind:"match",prompt:"A shorter lunch menu",answer:4,evidence:"the café could start next week"},
   ]},
  ],
 },
 {
  id:"t4-desert",test:4,part:4,title:"How desert plants survive",skill:"Note completion",
  intro:"You will hear part of a lecture about plants that live in deserts.",
  halves:[[
   {voice:"tutor",speaker:"Lecturer",text:"Good morning. Today's topic is survival in one of the harshest environments on Earth. Deserts cover about a third of the planet's land surface, and yet thousands of plant species manage to live there. I want to look at how they do it."},
   {voice:"tutor",speaker:"Lecturer",text:"The first problem a desert plant faces is, of course, the lack of water. Many species solve this by storing it. A large cactus, for example, can hold several hundred litres in its stem, which swells after rain and slowly shrinks during the dry months."},
   {voice:"tutor",speaker:"Lecturer",text:"Storing water is only useful if you can avoid losing it. Most plants lose water through their leaves, so desert plants have reduced them. The sharp spines of a cactus are in fact leaves that have changed shape over millions of years. As well as saving water, they protect the plant from thirsty animals."},
   {voice:"tutor",speaker:"Lecturer",text:"The surface of the plant matters too. Many desert species are covered in a thick layer of wax, which works like a waterproof coat and also reflects some of the sunlight."},
   {voice:"tutor",speaker:"Lecturer",text:"Then there are the roots. Some plants spread their roots very widely just below the surface, to catch rain before it disappears. Others do the opposite. One desert tree sends a single root more than fifty metres down to reach underground water."},
  ],[
   {voice:"tutor",speaker:"Lecturer",text:"A second group of plants avoids the problem altogether. These are the so-called annuals, which live for less than a year. Their seeds can lie in the sand for a decade or more, waiting. When enough rain finally falls, they grow, flower and produce the next generation within a few weeks, before the ground dries out again."},
   {voice:"tutor",speaker:"Lecturer",text:"How does a seed know that there has been enough rain? In many species the seed is covered with a chemical that prevents it from growing. A light shower isn't enough to remove it. Only heavy rain washes it away, and that is the signal that it's safe to begin."},
   {voice:"tutor",speaker:"Lecturer",text:"Desert plants have also changed the timing of their activity. Ordinary plants open the tiny holes in their surface during the day to take in the gas they need. Many desert plants open them only at night, when the air is cooler and far less water escapes."},
   {voice:"tutor",speaker:"Lecturer",text:"Finally, why does any of this matter to us? As the climate becomes drier in many farming regions, scientists are studying desert plants in the hope of breeding food crops that need less water. Some early results with wheat have been encouraging."},
  ]],
  groups:[
   {instruction:"Complete the notes below.",limit:ONE,heading:"Desert plants",questions:[
    {kind:"gap",prompt:"Deserts cover about a ______ of the Earth's land.",answers:["third"],evidence:"cover about a third of"},
    {kind:"gap",prompt:"A large cactus stores water in its ______.",answers:["stem"],evidence:"several hundred litres in its stem"},
    {kind:"gap",prompt:"The ______ of a cactus are leaves that have changed shape.",answers:["spines","spine"],evidence:"The sharp spines of a cactus"},
    {kind:"gap",prompt:"A thick layer of ______ keeps water in and reflects sunlight.",answers:["wax"],evidence:"a thick layer of wax"},
    {kind:"gap",prompt:"One desert tree has a root more than ______ metres long.",answers:["50","fifty"],evidence:"more than fifty metres down"},
    {kind:"gap",prompt:"Plants that live for less than a year are called ______.",answers:["annuals","annual"],evidence:"the so-called annuals"},
    {kind:"gap",prompt:"Their ______ can wait in the sand for ten years or more.",answers:["seeds","seed"],evidence:"Their seeds can lie in the sand"},
    {kind:"gap",prompt:"A ______ on the seed stops it growing until heavy rain falls.",answers:["chemical"],evidence:"covered with a chemical"},
    {kind:"gap",prompt:"Many desert plants take in gas only at ______.",answers:["night"],evidence:"open them only at night"},
    {kind:"gap",prompt:"Scientists hope to breed food ______ that need less water.",answers:["crops","crop"],evidence:"breeding food crops that need less water"},
   ]},
  ],
 },
 // ── Test 5 ──────────────────────────────────────────────────────────────────────────────────────────
 {
  id:"t5-lost-bag",test:5,part:1,title:"Reporting a lost bag",skill:"Form completion",
  intro:"You will hear a man phoning a railway lost property office about a bag he left on a train.",
  halves:[[
   {voice:"woman",speaker:"Officer",text:"Good afternoon, lost property office, Northern Rail. How can I help?"},
   {voice:"man",speaker:"James",text:"Hello. I left a bag on one of your trains this morning, and I'm hoping somebody has handed it in."},
   {voice:"woman",speaker:"Officer",text:"Let's see what we can do. I'll need to complete a report first. Could you give me your name?"},
   {voice:"man",speaker:"James",text:"James Hartley. That's H, A, R, T, L, E, Y."},
   {voice:"woman",speaker:"Officer",text:"Thank you, Mr Hartley. And when did you lose it? Today, you said?"},
   {voice:"man",speaker:"James",text:"Yes, today, the third of June. I was on the early train from Leeds, the one that gets in just after nine."},
   {voice:"woman",speaker:"Officer",text:"Thank you. And do you remember where on the train you left it?"},
   {voice:"man",speaker:"James",text:"I do. I didn't keep it by my seat, because the train was crowded. I put it up on the luggage rack near the door, and then I got off in such a hurry that I forgot all about it."},
   {voice:"woman",speaker:"Officer",text:"That happens more often than you'd think. Can you describe the bag for me? What colour is it?"},
   {voice:"man",speaker:"James",text:"It's green. Quite a dark shade, so in poor light people sometimes think it's black."},
   {voice:"woman",speaker:"Officer",text:"I see. And is it a suitcase, or something smaller?"},
   {voice:"man",speaker:"James",text:"Smaller. It's a rucksack, the kind you'd take walking, with a broken zip on the front pocket."},
  ],[
   {voice:"woman",speaker:"Officer",text:"And what was inside? The more detail you can give, the easier it is to prove that it's yours."},
   {voice:"man",speaker:"James",text:"The most important thing is my laptop. It belongs to my company, so I really do need it back. There's a charger with it as well."},
   {voice:"woman",speaker:"Officer",text:"I've made a note of that. Anything else?"},
   {voice:"man",speaker:"James",text:"A water bottle, a newspaper, and a pair of glasses in a red case. I need those for reading, so I've been struggling all day."},
   {voice:"woman",speaker:"Officer",text:"Give me a moment. Yes, I think you're in luck. A cleaner handed in a bag matching that description at about ten o'clock."},
   {voice:"man",speaker:"James",text:"Oh, that's a relief. Can I come and collect it this evening?"},
   {voice:"woman",speaker:"Officer",text:"You can. We're on platform one, next to the ticket office, and we're open until six p.m. on weekdays. On Saturdays we close at one."},
   {voice:"man",speaker:"James",text:"I'll come straight from work, then. Do I need to bring anything?"},
   {voice:"woman",speaker:"Officer",text:"Yes, we need to see some photo identification. A passport is best. We can't accept a bank card, I'm afraid, because it doesn't have your picture on it."},
   {voice:"man",speaker:"James",text:"That's fine. And is there a charge?"},
   {voice:"woman",speaker:"Officer",text:"There's a small handling fee of four pounds for each item. It goes towards the cost of running the office."},
   {voice:"man",speaker:"James",text:"That seems very reasonable. Thank you so much."},
  ]],
  groups:[
   {instruction:"Complete the form below.",limit:ONE,heading:"Lost property report",questions:[
    {kind:"gap",prompt:"Name: James ______",answers:["Hartley"],evidence:"H, A, R, T, L, E, Y"},
    {kind:"gap",prompt:"Date lost: ______ June",answers:["3","3rd","third","the third","the 3rd"],evidence:"the third of June"},
    {kind:"gap",prompt:"Left on the luggage ______ near the door",answers:["rack"],evidence:"up on the luggage rack"},
    {kind:"gap",prompt:"Colour of bag: dark ______",answers:["green"],evidence:"It's green"},
    {kind:"gap",prompt:"Type of bag: a ______",answers:["rucksack"],evidence:"It's a rucksack"},
   ]},
   {instruction:"Complete the notes below.",limit:ONE,heading:"Contents and collection",questions:[
    {kind:"gap",prompt:"Most important item: a ______",answers:["laptop"],evidence:"The most important thing is my laptop"},
    {kind:"gap",prompt:"Also inside: a pair of ______ in a red case",answers:["glasses"],evidence:"a pair of glasses in a red case"},
    {kind:"gap",prompt:"Office open on weekdays until ______ p.m.",answers:["6","six"],evidence:"we're open until six p.m. on weekdays"},
    {kind:"gap",prompt:"Identification to bring: a ______",answers:["passport"],evidence:"A passport is best"},
    {kind:"gap",prompt:"Handling fee: £______ per item",answers:["4","four"],evidence:"handling fee of four pounds"},
   ]},
  ],
 },
 {
  id:"t5-campsite",test:5,part:2,title:"Welcome to Lakeside Campsite",skill:"Multiple choice · matching",
  intro:"You will hear the manager of a campsite talking to a group of visitors who have just arrived.",
  halves:[[
   {voice:"woman",speaker:"Manager",text:"Hello, everyone, and welcome to Lakeside Campsite. I'm Fiona, the site manager. I know you've had a long journey, so I'll keep this short, but there are a few things you need to know before you put up your tents."},
   {voice:"woman",speaker:"Manager",text:"First, a little about the site. We've been welcoming campers for over forty years. My parents ran it as a farm as well, and the fields you're standing in were once used for sheep. We stopped farming about ten years ago, and now camping is all we do."},
   {voice:"woman",speaker:"Manager",text:"The reception, where you checked in, is open from eight in the morning until eight at night. If you arrive back later than that, don't worry. The gate is never locked, but please drive in slowly and keep your headlights low."},
   {voice:"woman",speaker:"Manager",text:"One thing that's different this year is the shop. We used to sell only basics, like milk and bread. Since the spring we've also had fresh food from local farms, including eggs, vegetables and some very good cheese, so you don't need to drive into town for supplies."},
   {voice:"woman",speaker:"Manager",text:"Now, fires. Open fires on the grass are not allowed, because they leave marks that take years to disappear. You can hire a metal fire bowl from reception for a small charge, and that's the only way to have a fire here."},
   {voice:"woman",speaker:"Manager",text:"And finally, noise. We're a family site, and we ask everyone to be quiet after ten thirty. Music is fine during the day, as long as your neighbours can't hear it from their own tent."},
  ],[
   {voice:"woman",speaker:"Manager",text:"Let me tell you what you'll find around the site. You've all got a map, so follow along if you like."},
   {voice:"woman",speaker:"Manager",text:"The old barn, next to reception, is not a café, although people keep hoping. We've put washing machines and dryers in there, and they take coins, so you can deal with muddy clothes after a day on the hills."},
   {voice:"woman",speaker:"Manager",text:"If you walk down to the lake, the path divides. Turn left and you reach the north shore. The water there is shallow and there are no boats, so it's the one place where we're happy for people to swim. Everywhere else, the lake gets deep very quickly."},
   {voice:"woman",speaker:"Manager",text:"Turn right instead and you come to the jetty. A local company keeps canoes there, and you can take one out by the hour. Life jackets are included, and you must wear them."},
   {voice:"woman",speaker:"Manager",text:"Beyond the jetty are the reed beds. There's a small wooden shelter with narrow windows, and if you sit quietly at dawn, you'll see herons and, with luck, a kingfisher. Bring binoculars if you have them."},
   {voice:"woman",speaker:"Manager",text:"Lastly, the information hut by the main entrance. Every morning at nine, one of our rangers sets off from there to lead a group around the lake. It takes about two hours, it's free, and you don't need to book."},
   {voice:"woman",speaker:"Manager",text:"That's everything. Enjoy your stay."},
  ]],
  groups:[
   {instruction:CHOOSE,questions:[
    {kind:"choice",prompt:"What does the manager say about the campsite?",options:["It is still a working farm.","It used to be farmland.","It opened ten years ago."],answer:1,evidence:"were once used for sheep"},
    {kind:"choice",prompt:"Campers who return after eight in the evening",options:["must leave their car outside.","need to collect a key first.","can still drive onto the site."],answer:2,evidence:"The gate is never locked"},
    {kind:"choice",prompt:"What is new about the shop this year?",options:["It sells fresh local food.","It opens earlier in the morning.","It sells camping equipment."],answer:0,evidence:"we've also had fresh food from local farms"},
    {kind:"choice",prompt:"Campers who want a fire must",options:["use the stone circles.","hire a fire bowl.","ask the manager for permission."],answer:1,evidence:"You can hire a metal fire bowl"},
    {kind:"choice",prompt:"Campers should be quiet after",options:["ten o'clock.","half past ten.","eleven o'clock."],answer:1,evidence:"to be quiet after ten thirty"},
   ]},
   {instruction:"What can visitors do at each place? Choose FIVE answers from the box and write the correct letter, A–G.",options:["watch birds","buy a hot meal","hire a boat","join a guided walk","wash clothes","charge a phone","swim safely"],questions:[
    {kind:"match",prompt:"The old barn",answer:4,evidence:"We've put washing machines and dryers in there"},
    {kind:"match",prompt:"The north shore",answer:6,evidence:"the one place where we're happy for people to swim"},
    {kind:"match",prompt:"The jetty",answer:2,evidence:"you can take one out by the hour"},
    {kind:"match",prompt:"The reed beds",answer:0,evidence:"you'll see herons"},
    {kind:"match",prompt:"The information hut",answer:3,evidence:"to lead a group around the lake"},
   ]},
  ],
 },
 {
  id:"t5-coast",test:5,part:3,title:"A coastal erosion field trip",skill:"Choose two · multiple choice · matching",
  intro:"You will hear two geography students, Ella and Sam, talking about a field trip to study coastal erosion.",
  halves:[[
   {voice:"man",speaker:"Sam",text:"Ella, shall we go through the notes from the field trip while it's still fresh in our minds?"},
   {voice:"woman",speaker:"Ella",text:"Good idea. I thought the day went well, on the whole. Which parts did you find most useful?"},
   {voice:"man",speaker:"Sam",text:"For me, the best thing was measuring the cliff ourselves. I'd read about the method, but actually doing it made me understand how rough the numbers can be."},
   {voice:"woman",speaker:"Ella",text:"I agree about that. I'd add the talk from the local resident, the woman whose garden is getting shorter every year. The lecture in the visitor centre was fine, but it was nothing we couldn't have found in a book."},
   {voice:"man",speaker:"Sam",text:"True. The boat trip was fun, but I'm not sure we learned much from it. And we ran out of time for the museum, so we can't count that."},
   {voice:"woman",speaker:"Ella",text:"Now, the data. According to our measurements, the cliff has moved back about two metres since last year's group came. That's double the average for the past ten years."},
   {voice:"man",speaker:"Sam",text:"Which sounds dramatic, but last winter there were three big storms. I don't think we can say that erosion is speeding up in general. One unusual year doesn't prove anything."},
   {voice:"woman",speaker:"Ella",text:"Fair enough. What did you think of the sea wall at the north end of the beach?"},
   {voice:"man",speaker:"Sam",text:"It obviously protects the houses behind it. But did you notice the beach just past the end of the wall? It's almost disappeared. The wall seems to have moved the problem along the coast rather than solving it."},
   {voice:"woman",speaker:"Ella",text:"That would make a good point for the report. Shall we use the photos we took?"},
   {voice:"man",speaker:"Sam",text:"Ours aren't great. It was so grey that you can hardly see the cliff edge. The visitor centre has a set taken from the same spot every year since nineteen ninety. If they let us use those, the change would be obvious."},
  ],[
   {voice:"woman",speaker:"Ella",text:"The last section is the one comparing ways of protecting the coast. Shall we agree on what to say about each?"},
   {voice:"man",speaker:"Sam",text:"OK. Sea walls first. We've covered the effect on the beach. I'd also mention that they're ugly. A concrete wall three metres high ruins the view of the sea."},
   {voice:"woman",speaker:"Ella",text:"Yes. Then there's adding sand to the beach. It works, and it looks natural, but the sea carries the new sand away again, so the whole job has to be done every few years."},
   {voice:"man",speaker:"Sam",text:"What about the lines of large rocks at the foot of the cliff?"},
   {voice:"woman",speaker:"Ella",text:"Rock barriers. According to the figures the guide gave us, nothing else costs so little per metre. That's the main reason councils choose them."},
   {voice:"man",speaker:"Sam",text:"And planting grass on the sand dunes? I liked that idea."},
   {voice:"woman",speaker:"Ella",text:"So did I. The roots hold the sand together. But the guide said it can be ten years before the dunes are strong enough to make a difference, so it's no help in an emergency."},
   {voice:"man",speaker:"Sam",text:"Finally, the idea of doing nothing and moving people away from the edge."},
   {voice:"woman",speaker:"Ella",text:"It may be the sensible choice in the long run. But you heard that woman who spoke to us. The people who live there are furious about it, and I can't blame them."},
   {voice:"man",speaker:"Sam",text:"No. Right, I think that gives us a plan. I'll write the first draft of that section tonight."},
  ]],
  groups:[
   {instruction:"Choose TWO letters, A–E.",questions:[
    {kind:"two",prompt:"Which TWO parts of the trip did the students find most useful?",options:["measuring the cliff","the lecture in the visitor centre","the boat trip","the talk by a local resident","the museum visit"],answers:[0,3],evidence:["the best thing was measuring the cliff ourselves","I'd add the talk from the local resident"]},
   ]},
   {instruction:CHOOSE,questions:[
    {kind:"choice",prompt:"What does Sam say about this year's erosion figure?",options:["It proves that erosion is speeding up.","It was probably measured wrongly.","It may be explained by unusual weather."],answer:2,evidence:"last winter there were three big storms"},
    {kind:"choice",prompt:"What is Sam's opinion of the sea wall?",options:["It has failed to protect the houses.","It has made erosion worse nearby.","It is too expensive to maintain."],answer:1,evidence:"moved the problem along the coast"},
    {kind:"choice",prompt:"Which photographs would the students prefer to use?",options:["their own photographs","pictures from a newspaper","the visitor centre's photographs"],answer:2,evidence:"The visitor centre has a set taken from the same spot"},
   ]},
   {instruction:"What do the students say about each way of protecting the coast? Choose FIVE answers from the box and write the correct letter, A–G.",options:["It takes years to have an effect.","It is the most effective method.","It is unpopular with local people.","It is the cheapest method.","It has to be repeated regularly.","It damages wildlife.","It spoils the appearance of the coast."],questions:[
    {kind:"match",prompt:"Sea walls",answer:6,evidence:"ruins the view of the sea"},
    {kind:"match",prompt:"Adding sand to the beach",answer:4,evidence:"the whole job has to be done every few years"},
    {kind:"match",prompt:"Rock barriers",answer:3,evidence:"nothing else costs so little per metre"},
    {kind:"match",prompt:"Planting grass on dunes",answer:0,evidence:"it can be ten years before the dunes are strong enough"},
    {kind:"match",prompt:"Moving people away",answer:2,evidence:"The people who live there are furious about it"},
   ]},
  ],
 },
 {
  id:"t5-birds",test:5,part:4,title:"City birds and noise",skill:"Note completion",
  intro:"You will hear part of a lecture about how noise affects birds in cities.",
  halves:[[
   {voice:"man",speaker:"Lecturer",text:"Good morning. Over the last few weeks we've looked at how animals adapt to natural habitats. Today I'd like to turn to an artificial one, the city, and to one group of animals in particular: songbirds."},
   {voice:"man",speaker:"Lecturer",text:"Birds sing for two main reasons. A male sings to attract a partner, and he sings to warn other males to stay out of his territory. In both cases, the song only works if it can be heard, and in a modern city that is far from easy."},
   {voice:"man",speaker:"Lecturer",text:"The main problem is traffic. The sound of engines is low in pitch, and it covers the deeper notes of birdsong almost completely. Researchers in the Netherlands compared birds of the same species in forests and in city centres, and found that the city birds sang at a noticeably higher pitch, above the noise of the traffic."},
   {voice:"man",speaker:"Lecturer",text:"Pitch is not the only thing that changes. City birds also sing more loudly, and their songs tend to be shorter, with fewer different notes. Some scientists worry that these simpler songs may be less attractive to females."},
   {voice:"man",speaker:"Lecturer",text:"Timing changes too. In the countryside, most birds begin to sing at dawn. In cities, some species, such as the robin, now sing at night, when the streets are quiet. For a long time people assumed this was caused by street lighting, but studies suggest that daytime noise is the more important cause."},
  ],[
   {voice:"man",speaker:"Lecturer",text:"So, are city birds simply learning new habits, or are they changing in a deeper way? To find out, researchers raised young birds from city and forest parents in exactly the same quiet conditions. The young birds from city families still sang higher songs, which suggests that the difference is at least partly passed on from the parents."},
   {voice:"man",speaker:"Lecturer",text:"Not every species can adapt in this way. Birds with naturally deep voices, such as some pigeons and owls, cannot raise their pitch very far, and these are the species that are disappearing from the noisiest districts. So noise does not just change how birds behave. It changes which birds we live alongside."},
   {voice:"man",speaker:"Lecturer",text:"Noise also affects birds that are not singing at all. A bird feeding on the ground listens for danger. In a noisy place it cannot hear a cat approaching, so it has to look up more often, and that leaves less time for eating. Chicks raised beside busy roads have been found to weigh less than those from quiet areas."},
   {voice:"man",speaker:"Lecturer",text:"What can be done? Planting rows of trees along main roads helps a little, and quieter road surfaces help more. But the most promising change is one that is happening anyway. Electric vehicles produce far less of this deep noise, and in a few decades our cities may sound quite different, to birds as well as to us."},
  ]],
  groups:[
   {instruction:"Complete the notes below.",limit:ONE,heading:"Birdsong in cities",questions:[
    {kind:"gap",prompt:"Male birds sing to attract a partner and to defend their ______.",answers:["territory"],evidence:"stay out of his territory"},
    {kind:"gap",prompt:"Traffic noise is ______ in pitch.",answers:["low"],evidence:"The sound of engines is low in pitch"},
    {kind:"gap",prompt:"City birds were compared with birds living in ______.",answers:["forests","forest"],evidence:"in forests and in city centres"},
    {kind:"gap",prompt:"City birds' songs are louder and ______.",answers:["shorter"],evidence:"their songs tend to be shorter"},
    {kind:"gap",prompt:"In cities, some robins now sing at ______.",answers:["night"],evidence:"now sing at night"},
    {kind:"gap",prompt:"Young birds were raised in the same ______ conditions.",answers:["quiet"],evidence:"in exactly the same quiet conditions"},
    {kind:"gap",prompt:"Species with deep voices, such as pigeons and ______, are disappearing.",answers:["owls","owl"],evidence:"some pigeons and owls"},
    {kind:"gap",prompt:"In a noisy place, a feeding bird cannot hear a ______ approaching.",answers:["cat"],evidence:"it cannot hear a cat approaching"},
    {kind:"gap",prompt:"Chicks raised beside busy roads ______ less.",answers:["weigh"],evidence:"weigh less than those from quiet areas"},
    {kind:"gap",prompt:"The most promising change is the spread of ______ vehicles.",answers:["electric"],evidence:"Electric vehicles produce far less"},
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

// What the recording is doing over time, for the player: the narrator speaking ("intro"), silent reading or
// checking time ("break") and the conversation or talk itself ("talk"). Built from the line start times; a
// narrator line ends with its pause, and the generator adds one second of gap before that pause.
export type RecordingPhase={kind:"intro"|"break"|"talk";start:number;end:number};
export function recordingPhases(lines:ListeningLine[],starts:number[],duration:number):RecordingPhase[] {
 const out:RecordingPhase[]=[];
 const add=(kind:RecordingPhase["kind"],start:number,end:number)=>{
  const last=out.at(-1);
  if(end<=start)return;
  if(last&&last.kind===kind)last.end=end;else out.push({kind,start,end});
 };
 lines.forEach((line,i)=>{
  const start=i===0?0:starts[i],end=i<lines.length-1?starts[i+1]:duration;
  if(line.voice!=="narrator"){add("talk",start,end);return;}
  const rest=Math.max(start,end-(line.pauseAfter??0)-1);
  add("intro",start,rest);add("break",rest,end);
 });
 return out;
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
