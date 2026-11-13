import { additionalMath, additionalReading } from "./sat-additional.ts";
import { readingCases } from "./ielts-additional-passages.ts";
import { additionalListening } from "./ielts-additional-listening.ts";
import readingReview from "./ielts-reading-review.json" with { type: "json" };
import { choice, short } from "./builders.ts";
import type { ExamDefinition, ExamQuestion } from "./types.ts";

const writingSets = [
  {topic:"community facilities",table:"Facility | 2012 | 2024\nLibrary | 45% | 55%\nSports centre | 35% | 50%\nArts centre | 20% | 30%\nCommunity garden | 10% | 25%",overview:"All four shares increased. Library use remained highest, while sports-centre and community-garden use each rose by 15 percentage points. Residents could use more than one facility, so the columns need not sum to 100%.",essay:"Some people believe local governments should prioritise public parks over new sports buildings. Discuss both views and give your own opinion."},
  {topic:"household electricity",table:"Use | 2010 | 2025\nHeating | 45% | 30%\nLighting | 20% | 10%\nAppliances | 25% | 40%\nOther | 10% | 20%",overview:"Heating and lighting lost share; appliances became the largest category. These are shares of electricity, so no conclusion about absolute consumption follows without totals.",essay:"Museums should focus on preserving objects rather than creating interactive experiences. To what extent do you agree or disagree?"},
  {topic:"commuting distances",table:"Distance | 2015 | 2025\nUnder 2 km | 20% | 25%\n2–5 km | 30% | 35%\n5–10 km | 35% | 25%\nOver 10 km | 15% | 15%",overview:"Shorter journeys gained share, 5–10 km journeys declined, and the longest category was unchanged. The 2–5 km category became the largest.",essay:"Some people think reliable public transport is the best way to reduce traffic, while others favour restrictions on private cars. Discuss both views and give your opinion."},
  {topic:"adult learning enrolments",table:"Subject | 2014 | 2024\nLanguages | 240 | 300\nDigital skills | 120 | 360\nArts | 180 | 210\nPractical crafts | 160 | 230",overview:"All subjects grew. Digital skills tripled and became the largest category, while arts showed the smallest numerical increase. Values are enrolments, not necessarily distinct individuals.",essay:"Practical subjects such as music and design deserve as much school time as academic subjects. To what extent do you agree or disagree?"},
  {topic:"municipal water use",table:"Sector | 2011 | 2025\nHouseholds | 50% | 45%\nIndustry | 30% | 20%\nPublic services | 15% | 20%\nUrban agriculture | 5% | 15%",overview:"Households remained the largest share. Industry's share fell by ten percentage points, while urban agriculture's share tripled. Shares do not establish changes in total water use.",essay:"Cities should encourage residents to grow food in shared spaces. What are the advantages and disadvantages of this approach?"},
];
const speakingTopics = [
  {topic:"a useful public facility",details:"where it is, what people do there, how you have used it, and why you think it is useful",follow:["How should cities decide which public facilities to fund?","Why might some residents find public facilities difficult to use?","Should access always be free?","How can public facilities adapt to changing needs?","What can governments learn from how people use shared spaces?"]},
  {topic:"an object that has personal or historical value",details:"what it is, where it came from, what you know about its history, and why it matters to you",follow:["Why do people keep old objects?","How can museums make objects meaningful to visitors?","Should damaged historic objects be restored?","What are the benefits and limits of digital museum collections?","Who should decide which objects a community preserves?"]},
  {topic:"a journey that you remember clearly",details:"where you went, how you travelled, what happened on the journey, and why it was memorable",follow:["What makes public transport dependable?","How do transport needs differ between rural and urban areas?","Should governments subsidise lightly used transport services?","How might travel habits change in the future?","Why can better information make journeys easier?"]},
  {topic:"a skill that you learned through practice",details:"what the skill is, how you started, what was difficult, and how practice helped you improve",follow:["What is the role of mistakes in learning?","How can teachers help learners practise effectively?","Are competitions always useful for developing skills?","How does technology affect access to learning?","Why do some adults find it difficult to learn new skills?"]},
  {topic:"an outdoor place you would like to improve",details:"where it is, who uses it, what you would change, and why that change would be helpful",follow:["How should cities balance green space and new buildings?","Who should look after shared outdoor places?","What are the benefits of involving residents in planning?","Can a popular place become too crowded?","How should environmental projects be evaluated?"]},
];
const interviews = [
  ["What public places do you visit regularly?","What do you enjoy doing at a library or community centre?","Do you prefer quiet places or busy places?","How often do you spend time outdoors near home?","Has your neighbourhood changed since you first knew it?","What new facility would you like near your home?"],
  ["Do you keep objects from your childhood?","What kinds of things do people in your family collect?","Do you enjoy visiting museums?","How do you usually learn about the past?","Do you prefer printed photographs or digital photographs?","What would you like to know about your town's history?"],
  ["How do you usually travel to work or study?","What do you do while travelling as a passenger?","Do you prefer travelling alone or with friends?","Is it easy to get around the area where you live?","Have your travel habits changed recently?","Where would you like to go for a short trip?"],
  ["What practical skill do you use regularly?","Did you learn to play an instrument when you were younger?","When do you find time to practise a hobby?","Do you prefer written instructions or demonstrations?","How do you feel when a task takes longer than expected?","What kind of class would you like to try?"],
  ["What outdoor places do you visit near home?","Do you enjoy growing plants?","What do you usually do in a park?","Do you prefer being outdoors in the morning or the evening?","Have you helped with a community activity?","What would make it easier for you to spend time outside?"],
];
const tableDescriptions = [
  "the percentages of residents using four community facilities in 2012 and 2024. Residents could use more than one facility",
  "the percentage distribution of household electricity use by purpose in 2010 and 2025",
  "the percentage distribution of commuters by distance travelled in 2015 and 2025",
  "the numbers of adult course enrolments by subject in 2014 and 2024. One person could enrol in more than one course",
  "the percentage distribution of municipal water use by sector in 2011 and 2025",
];

function readingSection(paper:number) {
  const cases=readingCases.slice((paper-2)*3,(paper-1)*3);
  const passages=cases.map((c,i)=>({title:`Reading passage ${i+1} · ${c.title}`,text:c.paragraphs.map((p,j)=>`${String.fromCharCode(65+j)}. ${p}`).join("\n\n")}));
  const questions:ExamQuestion[]=[];
  cases.forEach((c,index)=>{
    const passage=passages[index].title;
    const mc=(prompt:string,answer:string,wrong:string[],explanation:string)=>questions.push(choice(`ir-${paper}-${questions.length+1}-v1`,"Academic Reading",passage,prompt,answer,wrong,explanation));
    c.completions.forEach(([prompt,answer])=>questions.push({...short(`ir-${paper}-${questions.length+1}-v1`,"Academic Reading",`Complete the summary using ONE WORD from the passage. ${prompt}`,[answer],`The passage explicitly uses “${answer}” in the described context.`,1),passage}));
    const review=readingReview[(paper-2)*3+index];
    // Each explanation quotes the sentence that decides the answer (or says what the passage leaves out).
    const statements = [
      [c.trueStatement,"TRUE",review.statements.true],
      [c.falseStatement,"FALSE",review.statements.false],
      [c.absentStatement,"NOT GIVEN",review.statements.notGiven],
    ];
    for(const [statement,answer,explanation] of statements.slice((paper+index)%3).concat(statements.slice(0,(paper+index)%3))) {
      mc(`Do the following statements agree with the information in the passage? Choose TRUE, FALSE or NOT GIVEN.\n${statement}`,answer,["TRUE","FALSE","NOT GIVEN"].filter(v=>v!==answer),explanation);
      questions[questions.length-1].options=["TRUE","FALSE","NOT GIVEN"];
    }
    for(const [letter,detail] of review.matches) {
      // Fixed paragraph labels allow reuse, as in an IELTS matching-information task.
      questions.push({id:`ir-${paper}-${questions.length+1}-v2`,domain:"Academic Reading",passage,kind:"choice",
        prompt:`Which paragraph contains the following information? Choose A–H. You may use a letter more than once.\n${detail}`,
        options:["A","B","C","D","E","F","G","H"],answers:[letter],explanation:`Paragraph ${letter}: ${c.paragraphs[letter.charCodeAt(0)-65]}`});
    }
    mc("Which statement best expresses the passage's central argument?",c.mainIdea,review.mainWrong,"Read the opening problem alongside the conclusion. "+c.mainIdea);
    mc("Which conclusion can reasonably be drawn from the passage?",c.inference,review.inferenceWrong,"The evidence supports this conclusion within the limits stated: "+c.inference);
    if(index===2&&review.extra)questions.push({id:`ir-${paper}-${questions.length+1}-v2`,domain:"Academic Reading",passage,kind:"choice",
      prompt:`Which paragraph discusses this issue? Choose A–H.\n${review.extra[1]}`,options:["A","B","C","D","E","F","G","H"],answers:[review.extra[0]],explanation:`Paragraph ${review.extra[0]}: ${c.paragraphs[review.extra[0].charCodeAt(0)-65]}`});
  });
  return {questions,passages};
}

export function createAdditionalExams(base: ExamDefinition[]):ExamDefinition[] {
  return [2,3,4,5,6].flatMap(paper=>{
    const number=String(paper).padStart(2,"0");
    const sat=structuredClone(base.find(e=>e.program==="sat")!);
    sat.slug=`sat-full-${number}`;sat.title=`Digital SAT · Full Mock ${number}`;
    sat.description=`Original parallel practice form ${number}: new contexts and numerical problems across all four domains, with separate lower and higher practice routes. 98 delivered questions; standard-time modules.`;
    sat.stages[0].questions=additionalReading(paper,"first");
    sat.stages[1].variants={lower:additionalReading(paper,"lower"),higher:additionalReading(paper,"higher")};
    sat.stages[3].questions=additionalMath(paper,"first");
    sat.stages[4].variants={lower:additionalMath(paper,"lower"),higher:additionalMath(paper,"higher")};
    const ielts=structuredClone(base.find(e=>e.program==="ielts")!);
    ielts.version=2;ielts.slug=`ielts-academic-${number}`;ielts.title=`IELTS Academic · Full Mock ${number}`;
    const listening=additionalListening(paper),reading=readingSection(paper),w=writingSets[paper-2],s=speakingTopics[paper-2];
    ielts.description=`Original practice form ${number}: four new synthetic Listening recordings, three new Reading passages, a table about ${w.topic}, two Writing tasks and a Speaking simulation.`;
    ielts.stages[0].questions=listening.questions;ielts.stages[1].questions=listening.questions;
    ielts.stages[2].questions=reading.questions;ielts.stages[2].passages=reading.passages;
    ielts.stages[3].questions=[
      {id:`iw-${paper}-1-v1`,domain:"Writing",kind:"essay",minWords:150,answers:[],prompt:`Spend about 20 minutes on this task. The table shows ${tableDescriptions[paper-2]}. All data refer to a fictional town. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.`,passage:w.table,explanation:`Include an overview and accurate comparisons. ${w.overview} A qualified human reviewer should assess task achievement, coherence/cohesion, vocabulary and grammar; no automatic band is assigned.`},
      {id:`iw-${paper}-2-v1`,domain:"Writing",kind:"essay",minWords:250,answers:[],prompt:`Spend about 40 minutes on this task. ${w.essay} Give reasons for your answer and include relevant examples. Write at least 250 words.`,explanation:"Answer every part of the question, develop relevant reasons and examples, and maintain a clear position. Human review is required; no official band is calculated. Task 2 carries twice the official weighting of Task 1."},
    ];
    const speak=(id:string,prompt:string):ExamQuestion=>({id:`is-${paper}-${id}-v1`,domain:"Speaking",kind:"speaking",answers:[],prompt,explanation:"A qualified human should review fluency/coherence, vocabulary, grammar and pronunciation. This recorded simulation does not assign an automatic band score."});
    const cue=`Describe ${s.topic}. Say ${s.details}.`;
    ielts.stages[4].questions=interviews[paper-2].map((p,i)=>speak(`part1-${i}`,p));
    ielts.stages[5].questions=[speak("notes",cue)];ielts.stages[6].questions=[speak("part2",cue)];
    ielts.stages[7].questions=s.follow.map((p,i)=>speak(`part3-${i}`,p));
    ielts.stages[7].instructions="Five minutes. Develop your answers with reasons, examples and qualifications. These broader questions follow your Part 2 topic. The test ends automatically after this part.";
    return [sat,ielts];
  });
}
