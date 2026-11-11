from common import *

LISTENING=[part("Booking a community kitchen", """
Coordinator: Good afternoon, Riverside Community Kitchen. How can I help?
Caller: Our neighbourhood group wants to run a cooking evening. We used the church hall last year, but it had only two small ovens, and people spent more time waiting than cooking. Someone said your kitchen could accommodate twelve people working together.
Coordinator: Twelve is our maximum for a practical class. We can seat more for a demonstration, but that doesn’t sound like your plan. Will one person be responsible for the booking?
Caller: Yes, that will be me, Anna Mercer. I sometimes get letters addressed to Merker, but it’s Mercer, M-E-R-C-E-R. The group itself is called Shared Table.
Coordinator: Thank you. Were you thinking of a weekday evening or a weekend? Saturday afternoons are mostly reserved for our own courses, although there’s one gap later this month.
Caller: We first discussed Friday, but two members finish work late then. Thursday is the day we’ve agreed on. We’d prefer the second week of next month if that’s available.
Coordinator: It is. You could have the room from six, but another group finishes just before that. If you want it fully reset before you arrive, I’d recommend six thirty. Would that leave enough time?
Caller: Yes, let’s start at 6:30. We can circulate recipes beforehand rather than spend the first half-hour explaining them. Is there a minimum hire period?
Coordinator: Three hours. The charge for a community group is eighteen pounds an hour. Businesses pay twenty-five, but your event qualifies for the lower rate, so the hire will be fifty-four pounds. Cleaning is included if you leave the work surfaces clear.
Caller: That’s manageable. Do we pay the whole amount now?
Coordinator: No, a deposit of twenty pounds confirms it. The balance is due one week beforehand. We send a reminder, but please don’t depend on receiving it if your email changes.
---
Caller: We’ll be making vegetable dishes. Is there anything we should bring besides ingredients? Our organiser has a set of knives, though carrying them across town seems unnecessary.
Coordinator: Knives and boards are supplied, and so are pans. Every participant needs an apron. We used to lend those, but laundering them was becoming difficult. Ordinary comfortable clothes and enclosed shoes are sensible too.
Caller: One member uses a wheelchair. I saw a photograph of steps at the front. Is there another way in?
Coordinator: Yes. The side entrance is level and opens directly into the kitchen corridor. The front doors are mainly used for the meeting rooms. I’ll include a little plan in the confirmation so nobody has to search after dark.
Caller: That would help. Can we store ingredients before the event? A couple of people can deliver things during their lunch break, but nobody wants to leave milk in an office all afternoon.
Coordinator: You can use the fridge from midday on the day. Label everything with your group’s name, please. The freezer is already allocated to our regular classes, so don’t bring anything that requires freezing.
Caller: Fine. What do you need from me to finish the booking?
Coordinator: A contact number and a copy of your proposed menu. We don’t approve individual recipes, but we need to know about activities requiring unusual equipment. Email the menu by Monday, and we’ll confirm any questions before you buy ingredients.
Caller: I’ll send it this weekend. Where should we meet our participants?
Coordinator: The easiest landmark is the library opposite us. Ask everyone to wait there rather than beside the narrow driveway. You can collect the group together and use the side entrance. I’ll arrange for someone to show you the controls when you arrive.
""",[completion([
q("Booking contact’s surname: ____","Mercer","M-E-R-C-E-R"),
q("Chosen day: ____","Thursday","Thursday is the day we’ve agreed on"),
q("Start time: ____","6:30","let’s start at 6:30"),
q("Total hire charge: £____","54","the hire will be fifty-four pounds","The full three-hour charge is £54, not the hourly rate or commercial rate."),
q("Deposit required: £____","20","a deposit of twenty pounds")],numbers=True),completion([
q("Each participant must bring an ____.","apron","Every participant needs an apron"),
q("Wheelchair users should use the ____ entrance.","side","The side entrance is level"),
q("Ingredients may be kept in the ____ from midday.","fridge","use the fridge from midday"),
q("The organiser should email the ____ by Monday.","menu","Email the menu by Monday"),
q("Participants should initially gather outside the ____.","library","The easiest landmark is the library opposite us")])]),
part("Welcome to the riverside craft fair", """
Host: Welcome to our annual riverside craft fair. Before you explore, I’ll explain the site and mention a few changes to the programme. Please keep the printed plan facing the way you entered: the gate is at the bottom and the river at the top. The main path runs straight from the gate towards the river. The letters on the plan mark places, not the names of activities. We have kept the central crossing clear so visitors can move between the two sides without walking through a stall queue.
The information tent is the first place on your left as you come through the gate. You can leave a message there if you become separated from someone. Directly opposite it, on the right-hand side of the entrance path, is the bag store. Please don’t confuse the two. We can keep a coat or shopping bag in the store, but valuables should stay with you. There is no charge, though everything must be collected before we close.
Continue up the path to the crossing. The pottery demonstrations are on the left, in the middle row of the plan. The demonstrators need water, which is why they aren’t using the dry space near the gate this year. Across the path in the same row is the repair stall. Bring a small household object there and the volunteers will discuss what might be possible. They cannot promise to complete every repair during the fair, but can often identify the next useful step.
At the far end, beside the river, you’ll find the quiet seating area. It’s the space on the left, not the performance platform on the right. We’ve kept music away from that seating because some visitors want somewhere to rest and talk without raising their voices. The central space nearest the river is being kept empty for access, and it isn’t an extra picnic area.
---
Now, about today’s arrangements. The fair has been moved from Sunday to Saturday this year because the riverside road will be used for a running event tomorrow. It wasn’t a change caused by the weather forecast, and it has nothing to do with the availability of the makers. Most have reserved both dates anyway. We hope announcing it early has prevented wasted journeys.
There will be a small admission charge for the evening music, but entrance to the craft fair itself is free. The money from the music will pay for next year’s sign-language interpretation. We had considered buying more display tables, but accessibility support was the priority chosen at our last public meeting.
For children, there is a short weaving workshop. Parents sometimes expect to leave children there while they shop. This time an adult must stay with each child, since the activity is designed for them to work together. You don’t need to reserve, but if a table is full you’ll be asked to return at the next starting time rather than stand in the working area.
We ask stallholders to avoid disposable packaging where possible. Visitors can help by bringing containers for small purchases. There is a recycling point near the gate, but using fewer packages is our first aim; the recycling bins aren’t a reason to wrap everything twice. Some delicate pieces do need protection, and makers will explain the options.
Finally, if you have comments about the fair, please use the short paper form at the information tent. We will post an online survey next week, but today’s form asks about routes and seating while they’re fresh in your mind. There’s no prize draw attached. We want to hear about a difficulty even if the rest of your visit was enjoyable. Thank you, and have a good afternoon.
""",[match([
q("Information tent","E","the first place on your left"),q("Bag store","F","on the right-hand side of the entrance path"),q("Pottery demonstrations","C","on the left, in the middle row"),q("Repair stall","D","Across the path in the same row"),q("Quiet seating","A","beside the river","The left riverside space, not the right platform.")],dict.fromkeys('ABCDEF','Location on the plan'),"Label the plan with the correct location letter."),mc([
q("Why is the fair on Saturday?","B","used for a running event tomorrow","Sunday road use caused the change.",['Rain was forecast for Sunday.','The road is needed for another event on Sunday.','The makers requested a shorter weekend.']),
q("What will evening-music income support?","C","pay for next year’s sign-language interpretation","Not tables or musicians' equipment.",['New display tables.','Sound equipment for performers.','Communication access at the next fair.']),
q("What is required at the children’s workshop?","A","an adult must stay with each child","Participation is a shared activity.",['An adult must remain with the child.','A place must be booked beforehand.','Children must bring their own materials.']),
q("What is the main packaging aim?","B","using fewer packages is our first aim","Waste prevention takes priority over recycling.",['To package all items in recyclable layers.','To reduce how much packaging is used.','To prohibit protection of fragile items.']),
q("Why complete the paper form today?","C","while they’re fresh in your mind","It captures immediate experience of routes and seats.",['It is the only way to enter a prize draw.','No online feedback will be accepted.','Details of the visit will still be easy to recall.'])])]),
part("Planning a study of queue information", """
Maya: We need to narrow our project before the methods seminar. I liked the idea of studying queues in the campus café, but counting how long people wait sounds like something the manager could do without us.
Leo: The tutor’s comment was that our original question was too broad. We were trying to measure satisfaction, purchasing and staff performance all at once. Why don’t we focus on whether information changes people’s experience of waiting?
Maya: Like displaying an estimated wait? We shouldn’t promise that information always makes people happier. If the estimate is wrong, it could make things worse.
Leo: Exactly. We could compare a simple expected-wait sign with the ordinary queue. But I don’t think asking people to recall the time afterwards gives us a reliable actual duration.
Maya: Let’s have an observer note arrival and service times. Then the questionnaire can ask about perceived waiting, which is a different thing. That distinction might be the useful part of the project.
Leo: We also need comparable periods. Monday lunchtime and Friday afternoon would differ for too many reasons. The manager says the same lunch menu is served on Tuesday and Thursday, and the usual staffing level is the same.
Maya: That’s better, though a club event could still change the crowd. We should log unusual events rather than assuming two days are identical. Maybe use several weeks so that one odd day doesn’t dominate.
Leo: How do we decide who sees the sign? We can’t put it up for one person and hide it from the next if they’re standing together.
Maya: No. Use whole time blocks, alternating the order across days. Otherwise the sign condition would always be later, when perhaps people are less rushed. We need the schedule written before we see any results.
Leo: And the questionnaire must be optional. People are trying to buy lunch, not volunteering for a long interview. A brief invitation after they’ve been served would interfere less than asking while they’re choosing food.
---
Maya: Let’s allocate the preparation. First, the consent notice. I can draft it, but the tutor needs to check the wording. It’s not ready for customers until we have that approval.
Leo: Agreed. The manager’s permission is already sorted. She signed the email yesterday, including the observation positions. We’ll put that in the project folder as completed rather than spend another meeting rewriting it.
Maya: What about the timing sheet? We’ve designed columns, but we haven’t tried using it while several people arrive together. That’s the thing we should pilot before the main collection.
Leo: Yes. We can practise during a quiet half-hour with volunteers, without treating those entries as study data. If we can’t keep track, the form needs changing, not the customers.
Maya: The question about how much money people spend seems unnecessary now. It belonged to the earlier project, and collecting it would make the survey longer without answering our revised question.
Leo: Let’s remove it. We don’t need personal spending information merely because it might be interesting later. The fewer irrelevant details we ask for, the easier it is to explain the purpose honestly.
Maya: We also need a final chart. I started choosing colours, then realised we don’t know the distribution of the data. We could decide what variables belong on it, but should leave the exact display until after collection.
Leo: Right. Averages might hide a few very long waits. We should show enough detail to make those visible, though we don’t need to decide between every possible graph this afternoon.
Maya: I’m glad we narrowed it. The study won’t tell the manager how to redesign the whole café, but it could show whether estimated-wait information changes perceptions under these conditions.
Leo: And if actual times differ between conditions, we’ll report that rather than attribute every difference to the sign. A small honest study is more useful than a grand conclusion our design can’t support.
""",[mc([
q("Why do the students revise their initial project?","A","our original question was too broad","They were trying to investigate too many outcomes.",['It attempted to examine too many things.','The manager refused all observation.','No queues existed at the café.']),
q("How will actual waiting time be measured?","C","an observer note arrival and service times","Separate observed duration from perceived waiting.",['By customers recalling it later.','By reading the estimated-wait sign.','By recording arrival and service times.']),
q("Why choose Tuesday and Thursday lunch periods?","B","the same lunch menu is served","Menu and staffing are more comparable.",['They attract exactly the same customers.','Some important operating conditions are similar.','No unusual events can occur on those days.']),
q("Why alternate the order of time blocks?","A","the sign condition would always be later","Avoid confounding the sign with time of day.",['To avoid consistently showing the sign later.','To make the café serve everyone faster.','To let each customer choose a condition.']),
q("When will people be invited to answer questions?","C","after they’ve been served","This reduces disruption while ordering.",['As they enter the café.','While they choose their food.','After they have been served.'])]),match([
q("Consent notice","B","the tutor needs to check the wording"),q("Manager’s permission","D","as completed"),q("Timing sheet","A","the thing we should pilot"),q("Spending question","C","Let’s remove it"),q("Final chart format","E","leave the exact display until after collection")],{'A':'Try it out before the main study','B':'Obtain tutor approval','C':'Remove it','D':'Treat it as completed','E':'Decide after collecting data','F':'Ask customers to design it'},"What action do the students decide on for each item?")]),
part("How wetlands preserve traces of the past", """
Lecturer: Today we’ll consider why some wetlands contain remarkable archaeological remains, and why discovering those remains creates a new set of problems. When people imagine an ancient object surviving for centuries, they often think of stone or metal. In waterlogged settings, materials such as wood can sometimes remain where they would ordinarily decay. The important condition is not simply that the object is wet. Water can restrict the supply of oxygen, slowing some of the processes that normally destroy organic material. Conditions vary, so the presence of a wetland is not a guarantee that everything deposited there will survive.
Wetland deposits can also build up in layers. A boat landing, a discarded tool and later plant remains may occupy different levels. Archaeologists record these layers because position helps establish relationships between events. A beautiful object removed without its context can answer fewer questions than a less spectacular object whose location was carefully documented. For that reason, a discovery reported promptly by a walker or landowner can be especially valuable. The object may need to be left in place until its surroundings have been recorded and a suitable recovery plan has been made.
One source of evidence is pollen. These tiny particles can survive in certain deposits, and their forms can indicate groups of plants that were present in the surrounding landscape. This does not produce a perfectly detailed picture of an ancient garden. Wind carries some pollen farther than others, and different plants produce different quantities. Researchers therefore compare patterns and use several sources of evidence. A change in pollen may suggest a change in vegetation, but deciding whether people, climate or another process caused it requires additional argument.
Small samples are often examined under a microscope. The work involves identification, counting and attention to possible contamination from more recent material. Sample containers must be labelled clearly, and the sampling position must be recorded. Without that information, laboratory precision cannot restore a lost connection to the site. Researchers may also examine seeds, insects and pieces of wood. Agreement between these sources can strengthen an interpretation, while disagreement can reveal a question that would remain invisible if only one kind of material were studied.
A particularly important threat is drainage. Lowering the water level can expose deposits to air and alter conditions that had preserved them. Damage may begin before a buried structure becomes visible at the surface. Farmers, engineers and archaeologists consequently need ways to exchange information before major ground changes occur. This is not a demand to prohibit every use of wet land. It is an argument for assessing what may be lost while there is still time to modify a plan or record vulnerable evidence properly.
Recovery itself also changes the environment of an object. A wooden implement that looks solid in the ground may distort or crack if it is allowed to dry without treatment. Conservators must plan stabilisation before excavation, including suitable packaging and access to facilities. Removing an object first and searching for money afterwards can leave an institution responsible for material it cannot care for. Sometimes leaving a deposit undisturbed, with monitoring, is the more responsible choice. Excavation is one method of research rather than an automatic reward for every promising discovery.
Finally, consider public interpretation. Museums often display the surviving object but not the months of recording and treatment around it. A useful display can include a reconstruction, provided visitors can distinguish it from the original material. The distinction matters because a completed shape may contain informed guesses. Good interpretation makes those guesses visible without making the object uninteresting. Wetlands preserve opportunities to ask questions about the past. The purpose of careful archaeology is to keep those opportunities connected to evidence rather than turn a fragile discovery into an attractive object stripped of its story.
""",[completion([
q("Preservation can occur when water restricts the supply of ____.","oxygen","restrict the supply of oxygen"),
q("The position of objects within ____ helps establish relationships between events.","layers","record these layers because position"),
q("An object separated from its ____ answers fewer questions.","context","removed without its context"),
q("The tiny plant particles discussed as evidence of earlier vegetation are ____.","pollen","One source of evidence is pollen"),
q("Tiny samples may be studied using a ____.","microscope","examined under a microscope"),
q("Researchers must guard against ____ by newer material.","contamination","possible contamination from more recent material"),
q("A major threat to preservation is ____.","drainage","A particularly important threat is drainage"),
q("Conservators should plan ____ before objects are excavated.","stabilisation","plan stabilisation before excavation"),
q("Leaving deposits in place may require continuing ____.","monitoring","with monitoring"),
q("Visitors should distinguish a ____ from original material.","reconstruction","include a reconstruction")])])]

LISTENING[1]['visual']="""Plan (not to scale). North / river is at the top. All boxes are beside the straight central path.

```text
                 RIVER / NORTH
       +-------------+   +-------------+
       |      A      |   |      B      |
       +-------------+   +-------------+
                    PATH
       +-------------+   +-------------+
       |      C      |---|      D      |  CROSSING
       +-------------+   +-------------+
                    PATH
       +-------------+   +-------------+
       |      E      |   |      F      |
       +-------------+   +-------------+
                    GATE
```
"""
