import writingData from "./ielts-writing-data.json" with { type: "json" };
import type { ExamDefinition } from "./types.ts";

const originalReadingDistractors:Record<string,string[]>={
 ir10:["They enabled comparison of volunteers' individual success rates","They determined which objects should be accepted at reception","They provided evidence that teaching improved repair rates"],
 ir11:["They believed slower repairs produced fewer safety problems","They wanted visitors to watch the full technical procedure before participating","They had to leave work unfinished for volunteers at the next session"],
 ir12:["Its fees had to be used only for replacement components","It had to focus on objects unsuitable for public sessions","It had to be provided by volunteers who did not teach residents"],
 ir13:["The initial equipment investment was less useful than the later funding programme","The service's educational benefits outweighed its environmental contribution","The centre's financial stability depended on increasing successful repairs"],
 ir23:["It fails to account for the age of trees when estimating maintenance costs","It overestimates shade from trees that lose leaves in winter","It gives greater weight to roadside trees than to trees inside parks"],
 ir24:["Establishment costs rise as the number of planted species increases","Visible planting totals can underestimate a city's actual investment","Young trees provide less shade because they are planted too far apart"],
 ir25:["As an interim response that should be removed once canopy targets are met","As a cheaper way to achieve the same range of benefits as trees","As appropriate chiefly where residents oppose additional planting"],
 ir26:["Give priority to the districts showing the highest average radiant heat","Distribute planting budgets in proportion to each district's population","Use the least expensive planting locations to maximise total canopy"],
 ir35:["Choosing a preferred historical name to stabilise a catalogue","Using descriptions to establish the original order of documents","Separating uncertain dates from verified subject classifications"],
 ir36:["Reducing the dependence of preservation on descriptive information","Selecting the original format as the most authentic means of access","Balancing demand for new copies against the costs of physical conservation"],
 ir37:["It does not distinguish failures in searching from errors in catalogue descriptions","It cannot indicate which names should become preferred search terms","It measures the quality of page images rather than the accuracy of transcription"],
 ir38:["It should provide a separate transcript tailored to each researcher's needs","It should ensure source spellings conform to a single shared vocabulary","It should prioritise correction of the documents most frequently consulted"],
 ir39:["They should be chosen chiefly for compatibility with the largest collections","Their principal value is to reduce the need to retain original files","Their use should be restricted to describing features shared by every object"],
 ir40:["The central task is to reconcile historical variation through consistent description","Archives become trustworthy when preservation copies reproduce the original layout","Access should expand only after the archive has resolved descriptive uncertainty"],
};
const originalListeningDistractors:string[][]=[
 ["Transport between campus buildings","Recycling behaviour on campus"],
 ["A questionnaire used as the main source","A combination of interviews and photographs"],
 ["They would make the observation categories harder to compare","They would require equipment the department cannot supply"],
 ["It encouraged respondents to focus on noise alone","It offered too few ways to describe the atmosphere"],
 ["At several lunch periods during the same week","At the busiest periods identified in a preliminary survey"],
 ["A recording device for interviewing visitors","A counter for measuring pedestrian movement"],
 ["The number of organised events","The type of activity at each neighbouring site"],
 ["A mean after removing unusual events","Separate means for every observation period"],
 ["Developing the observation categories and questionnaire","Preparing site descriptions and the map"],
 ["Have each student test a different site independently","Complete the questionnaire before testing the observations"],
];

export function reviseIelts(exam:ExamDefinition):ExamDefinition {
 if(exam.program!=="ielts")return exam;
 const revised=structuredClone(exam),paper=Number(exam.slug.slice(-2)),data=writingData[paper-1];
 revised.version=2;revised.audioRevision=paper===1?1:2;
 revised.description=`Original revised practice form ${String(paper).padStart(2,"0")}: four synthetic Listening recordings, three full-length Reading passages, two Writing tasks and a recorded Speaking simulation. Human review and learner calibration remain pending.`;
 const task=revised.stages[3].questions[0];
 task.id=task.id.replace(/-v1$/,"")+"-v2";
 task.prompt=`You should spend about 20 minutes on this task. The table shows ${data.description}. All figures describe a fictional town. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.`;
 task.passage=data.table;
 task.explanation=`${data.overview} Include a clear overview and support selected comparisons with accurate figures. Do not invent causes. Assess task achievement, coherence/cohesion, lexical resource and grammatical range/accuracy through qualified human review. No automatic band is assigned.`;
 if(paper===5){
   task.prompt="You should spend about 20 minutes on this task. The diagram shows how used glass bottles are recycled into new bottles. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.";
   task.passage=undefined;
   task.figure={kind:"image",src:"/ielts-mocks/bottle-recycling.svg",expandable:true,width:890,height:510,alt:"Used bottles are collected, sorted by colour, washed to remove labels, crushed, melted at 1,400°C, moulded into new bottles, cooled gradually and inspected. Approved bottles are distributed; rejected glass returns to crushing."};
   task.explanation="Describe the main linear sequence from collection to distribution and the recycling loop from inspection back to crushing. Group the preparation and manufacturing stages; include the furnace temperature. Do not invent equipment, durations or additives. Human review should assess task achievement, organisation, vocabulary and grammar; no automatic band is assigned.";
 }
 if(paper===1){
   for(const q of revised.stages[2].questions){
     const wrong=originalReadingDistractors[q.id];if(!wrong)continue;
     const options=[q.answers[0],...wrong],offset=Number(q.id.slice(2))%options.length;
     q.options=options.slice(offset).concat(options.slice(0,offset));
   }
   for(const stage of revised.stages.slice(0,2))for(const [index,q] of stage.questions.entries())if(index>=20&&index<30){
     const options=[q.answers[0],...originalListeningDistractors[index-20]],offset=index%3;
     q.options=options.slice(offset).concat(options.slice(0,offset));
   }
 }
 // Part 1 should sample several familiar topics rather than rehearse only the cue-card theme.
 if(paper>1){
   const questions=revised.stages[4].questions;
   const openings=["Do you work or are you a student?","What would you like to change about your daily routine?"];
   for(let i=0;i<2;i++){questions[i].prompt=openings[i];questions[i].id=questions[i].id.replace(/-v1$/,"")+"-v2";}
 }
 revised.stages[4].instructions="Four minutes. Answer the familiar-topic questions aloud in order. Give natural answers with a brief reason or example where appropriate; do not deliver a memorised speech. This is recorded self-practice, without the follow-up or interruption of a live examiner.";
 revised.stages[7].instructions="Five minutes. Discuss these wider issues linked to Part 2. Explain reasons, compare perspectives and consider how circumstances may change your answer. A live examiner may probe or challenge an answer; this prompt-based recording cannot reproduce that interaction. Human assessment is required.";
 // Revised scored IDs cannot inherit checked practice answers from the old bank.
 for(const stage of revised.stages.slice(0,3))for(const q of stage.questions){
   if(!q.id.endsWith("-v2"))q.id=q.id.replace(/-v1$/,"")+"-v2";
 }
 return revised;
}
