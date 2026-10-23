// Original practice material. Import from server modules only; publicExercise strips keys.
// IDs describe immutable v1 content. Publish a new version rather than editing saved content.
import type { ExerciseProgram, ExerciseSet } from "./types.ts";

type Item = [prompt: string, options: string[], answer: string, explanation: string];
function set(slug: string, program: ExerciseProgram, title: string, subject: string, description: string, minutes: number, items: Item[]): ExerciseSet {
  return { slug, examId: slug + "-v1", program, title, subject, description, minutes,
    questions: items.map(([prompt, options, answer, explanation], index) => {
      if (!options.includes(answer)) throw new Error("Missing answer: " + slug);
      return { id: `${slug}-q${index + 1}-v1`, prompt, options, correct: options.indexOf(answer), explanation };
    }),
  };
}

const library = `A. In the fictional town of Northbridge, a public library converted an unused storeroom into a repair room in 2023. Residents can bring small household items there on Saturday afternoons. Volunteer technicians explain how to repair the objects rather than simply doing the work for visitors. The service is free, although residents pay for any replacement parts.

B. During its first six months, the room received 240 visits, each involving one item. Kitchen appliances accounted for half of the items brought in. Volunteers successfully repaired three quarters of all items. The library recorded the number of visits, not the number of individual visitors, so these figures cannot show how many different people used the service.

C. At first, volunteers assumed that saving money would be visitors' main reason for attending. However, informal conversations suggested that many visitors particularly valued learning a practical skill. These conversations were not a formal survey, and the library cautioned against treating them as representative of every visitor.

D. The library plans to run evening sessions next year if it can recruit more volunteers. It has not yet decided whether to open a second repair room. Staff say that expanding too quickly could reduce the time available to teach each visitor.`;
const gardens = `A. A fictional research team compared twelve school gardens over one growing season. Six used raised beds and six planted directly in the ground. The team measured the mass of vegetables harvested and recorded the hours of sunlight at each site. All schools grew the same three varieties of vegetable.

B. On average, raised-bed gardens produced more vegetables. However, these gardens also received more sunlight. The researchers therefore could not conclude that the beds themselves caused the difference. They recommended a follow-up study in which the two garden types would receive similar amounts of sunlight.

C. Teachers reported another benefit: pupils became more willing to taste unfamiliar vegetables after helping to grow them. The study did not measure whether this willingness continued after the season ended. Nor did it record how much food pupils ate at home.

D. Installing raised beds cost more at the beginning, but teachers found their height convenient for younger children. The report recommended that schools consider access, sunlight and maintenance time before choosing a garden design. It did not recommend one design for every school.`;
function reading(passage: string, items: Item[]): Item[] {
  return items.map(([prompt, options, answer, explanation]) => [passage + "\n\n[QUESTION]\n\n" + prompt, options, answer, explanation]);
}

export const exerciseSets: ExerciseSet[] = [
  set("sat-algebra", "sat", "Algebra · Тэгшитгэл ба шугаман хамаарал", "Algebra", "Тэгшитгэл, систем, налалт, тэнцэтгэл бишийг нөхцөлтэй нь холбож бодоорой.", 18, [
    ["If 5x − 9 = 26, what is x?", ["5", "6", "7", "9"], "7", "Хоёр талд 9 нэмэхэд 5x = 35. 5-д хуваавал x = 7."],
    ["A line passes through (2, 7) and (6, 19). What is its slope?", ["2", "3", "4", "6"], "3", "Налалт = (19 − 7)/(6 − 2) = 12/4 = 3."],
    ["If x + y = 8 and 2x − y = 7, what is x?", ["3", "4", "5", "6"], "5", "Тэгшитгэлүүдийг нэмбэл 3x = 15. Тэгэхээр x = 5, y = 3."],
    ["Which inequality is equivalent to 3x + 2 < 14?", ["x < 4", "x > 4", "x < 6", "x > 6"], "x < 4", "2-ыг хасаад эерэг 3-т хуваана: 3x < 12 тул x < 4. Тэмдэг өөрчлөгдөхгүй."],
    ["The line y = 2x + b passes through (3, 10). What is b?", ["2", "3", "4", "5"], "4", "Координатыг орлуулбал 10 = 2 × 3 + b. Иймээс b = 4."],
    ["Adult tickets cost $12 and student tickets cost $8. Ten tickets cost $104 in total. How many adult tickets were sold?", ["4", "5", "6", "8"], "6", "Насанд хүрэгчийн тоог a гэвэл 12a + 8(10 − a) = 104. 4a = 24 тул a = 6."],
    ["y is directly proportional to x. When x = 5, y = 20. What is y when x = 3?", ["8", "12", "15", "18"], "12", "y = kx бөгөөд k = 20/5 = 4. x = 3 үед y = 4 × 3 = 12."],
    ["How many solutions does 2x + 4 = 2x + 7 have?", ["None", "One", "Two", "Infinitely many"], "None", "Хоёр талаас 2x-ийг хасахад 4 = 7 гэсэн худал тэнцэтгэл гарна. Шийдгүй."],
  ]),
  set("sat-advanced", "sat", "Advanced Math · Квадрат ба зэрэгт хамаарал", "Advanced Math", "Квадрат функц, язгуур, зэрэг болон илэрхийллийг хялбарчлах 8 бодлого.", 22, [
    ["What are the solutions of x² − 7x + 10 = 0?", ["−2 and −5", "1 and 10", "2 and 5", "−1 and −10"], "2 and 5", "x² − 7x + 10 = (x − 2)(x − 5). Үржвэр тэг тул x = 2 эсвэл x = 5."],
    ["What is the minimum value of f(x) = (x − 4)² − 9?", ["−9", "−4", "4", "9"], "−9", "Квадрат үргэлж сөрөг биш. x = 4 үед квадрат 0 болж, хамгийн бага утга −9 байна."],
    ["A population is initially 200 and increases by 10% each year. What is the population after two years?", ["220", "240", "242", "244"], "242", "Жил бүр өмнөх хэмжээг 1.10-аар үржүүлнэ. 200 × 1.10² = 242."],
    ["For x ≠ 2, which expression equals (x² − 4)/(x − 2)?", ["x − 2", "x + 2", "x² + 2", "1"], "x + 2", "x² − 4 = (x − 2)(x + 2). x ≠ 2 үед x − 2-ыг хурааж болно."],
    ["If √(x + 5) = 4, what is x?", ["9", "11", "16", "21"], "11", "Хоёр талыг квадратлавал x + 5 = 16. x = 11; орлуулж шалгахад √16 = 4."],
    ["For what value of k does x² − 6x + k = 0 have exactly one distinct real solution?", ["3", "6", "9", "12"], "9", "Дискриминант 0 байх ёстой: (−6)² − 4k = 0. 36 − 4k = 0 тул k = 9."],
    ["What is the value of 16^(3/4)?", ["4", "6", "8", "12"], "8", "16-ын дөрөвдүгээр язгуур 2. Түүнийг куб зэрэгт дэвшүүлэхэд 2³ = 8."],
    ["Which is a factorization of x² − 9?", ["(x − 9)(x + 1)", "(x − 3)²", "(x + 3)²", "(x − 3)(x + 3)"], "(x − 3)(x + 3)", "Квадратын ялгаврын томьёо a² − b² = (a − b)(a + b). Энд b = 3."],
  ]),
  set("sat-data", "sat", "Data Analysis · Хувь, магадлал, өгөгдөл", "Problem-Solving and Data Analysis", "Өгөгдлийг уншиж, дундаж, харьцаа, хувь болон дүгнэлтийн хязгаарыг ойлгоорой.", 18, [
    ["A price rises from $800 to $920. What is the percentage increase?", ["12%", "15%", "20%", "25%"], "15%", "Өсөлт 120. Анхны үнэд хуваахад 120/800 × 100% = 15%."],
    ["What is the mean of 8, 10, 12 and 14?", ["10", "11", "12", "13"], "11", "Нийлбэр 44. Дөрвөн тоонд хуваахад арифметик дундаж 11."],
    ["A bag contains 3 red and 5 blue counters. One counter is selected at random. What is the probability it is red?", ["3/5", "5/8", "3/8", "1/2"], "3/8", "Нийт 8 ижил боломжтой сонголтоос 3 нь улаан. Магадлал 3/8."],
    ["Twenty students have a mean score of 80. Ten other students have a mean score of 95. What is the mean for all 30 students?", ["82.5", "85", "87.5", "90"], "85", "Нийт оноо 20 × 80 + 10 × 95 = 2550. 2550/30 = 85. Бүлгийн хэмжээг жинлэнэ."],
    ["A region has 240 residents and an area of 6 square kilometres. What is its population density?", ["24 per km²", "40 per km²", "60 per km²", "1440 per km²"], "40 per km²", "Нягт = хүн ам / талбай = 240/6 = 40 хүн/км²."],
    ["What is the median of 3, 9, 4, 12 and 7?", ["4", "6", "7", "9"], "7", "Өсөхөөр эрэмбэлбэл 3, 4, 7, 9, 12. Голын буюу гурав дахь утга 7."],
    ["Students who spend more time reading tend to have higher vocabulary scores. This observational result alone supports which conclusion?", ["Reading time and scores are positively associated", "Reading more must cause every score to rise", "Vocabulary scores cause reading time", "There is no relationship"], "Reading time and scores are positively associated", "Ажиглалтын хамаарал нь шалтгааныг дангаараа нотлохгүй. Зөвхөн эерэг хамаарал байна гэж хэлж болно."],
    ["A school randomly selects 100 students from its full list of 1,000 students to estimate support for a new club. Which statement is justified?", ["Exactly the same percentage of all students supports it", "The sample can help estimate school-wide support", "Only club members can be surveyed", "Every student must be surveyed for any estimate"], "The sample can help estimate school-wide support", "Бүрэн жагсаалтаас санамсаргүй түүвэр авсан тул сургуулийн нийт сурагчдын дэмжлэгийг ойролцоолно. Түүврийн алдаа байж болно."],
  ]),
  set("sat-geometry", "sat", "Geometry & Trigonometry · Дүрс ба өнцөг", "Geometry and Trigonometry", "Талбай, эзлэхүүн, төсөө, тойрог, тэгш өнцөгт гурвалжны харьцааг давтаарай.", 20, [
    ["A right triangle has legs of length 6 and 8. What is the hypotenuse?", ["9", "10", "12", "14"], "10", "Пифагорын теоремоор c² = 6² + 8² = 100. Урт эерэг тул c = 10."],
    ["A circle has radius 7. What is its area?", ["14π", "28π", "49π", "98π"], "49π", "Тойргийн талбай πr² = π × 7² = 49π."],
    ["A cylinder has radius 3 and height 10. What is its volume?", ["30π", "60π", "90π", "180π"], "90π", "Эзлэхүүн = суурийн талбай × өндөр = π × 3² × 10 = 90π."],
    ["Two angles of a triangle measure 65° and 55°. What is the third angle?", ["50°", "55°", "60°", "65°"], "60°", "Гурвалжны дотоод өнцгүүдийн нийлбэр 180°. 180 − 65 − 55 = 60°."],
    ["In a right triangle, the side opposite angle θ has length 3 and the hypotenuse has length 5. What is sin θ?", ["3/4", "4/5", "3/5", "5/3"], "3/5", "Синус = эсрэг катет / гипотенуз = 3/5."],
    ["The side lengths of one square are 3 times those of another. What is the ratio of the larger area to the smaller area?", ["3:1", "6:1", "9:1", "12:1"], "9:1", "Шугаман хэмжээ 3 дахин өсвөл талбай 3² = 9 дахин өснө."],
    ["Which angle in radians equals 180°?", ["π/4", "π/2", "π", "2π"], "π", "Бүтэн эргэлт 360° = 2π радиан. Хагас эргэлт 180° = π радиан."],
    ["A line has slope 2. What is the slope of a line perpendicular to it?", ["−2", "−1/2", "1/2", "2"], "−1/2", "Перпендикуляр шулууны налалтуудын үржвэр −1. 2m = −1 тул m = −1/2."],
  ]),
  set("ielts-reading-library", "ielts", "Reading · A library that repairs", "Academic Reading", "Нэг эх дээр гол санаа, баримт, дүгнэлт болон True / False / Not Given-ийг ялгаарай.", 20, reading(library, [
    ["What is the main purpose of the repair room?", ["To sell new appliances", "To teach residents to repair household items", "To train professional librarians", "To collect unused books"], "To teach residents to repair household items", "A хэсэгт техникчид зүгээр засаж өгөхийн оронд хэрхэн засахыг тайлбарладаг гэжээ. Гол зорилго нь чадвар заах."],
    ["When can residents use the room?", ["Every weekday morning", "Saturday afternoons", "Sunday evenings", "Every evening"], "Saturday afternoons", "A хэсэгт Saturday afternoons гэж цагийг шууд өгсөн."],
    ["How many of the 240 items brought in were kitchen appliances?", ["60", "90", "120", "180"], "120", "B хэсэгт ирсэн зүйлсийн тал нь гал тогооны хэрэгсэл гэсэн. 240 × 1/2 = 120."],
    ["Residents must pay a fee to enter the repair room. Is this True, False or Not Given?", ["True", "False", "Not Given"], "False", "A хэсэгт үйлчилгээ үнэгүй гэж тодорхой заасан. Сэлбэгийн мөнгө төлөх нь нэвтрэх хураамж гэсэн үг биш."],
    ["Exactly 240 different residents used the service in the first six months. Is this True, False or Not Given?", ["True", "False", "Not Given"], "Not Given", "B хэсгийн 240 нь ирэлтийн тоо болохоос ялгаатай хүний тоо биш. Давтан ирсэн эсэх өгөгдөөгүй тул яг 240 өөр хүн гэж батлах ч, няцаах ч боломжгүй."],
    ["Which paragraph discusses the limits of the evidence about visitors' motivations?", ["A", "B", "C", "D"], "C", "C хэсэгт албан бус яриа нь бүх зочдыг төлөөлөх судалгаа биш гэдгийг анхааруулсан."],
    ["What does the planned introduction of evening sessions depend on?", ["Charging an entry fee", "Recruiting more volunteers", "Closing the library", "Buying a second building"], "Recruiting more volunteers", "D хэсгийн if it can recruit more volunteers гэдэг нь оройн цагийг нээх нөхцөл."],
    ["Why are staff cautious about expanding quickly?", ["They have no visitors", "It could leave less teaching time per visitor", "All items are already repaired", "Evening sessions are illegal"], "It could leave less teaching time per visitor", "D хэсэгт хурдан тэлэх нь нэг зочинд заах хугацааг багасгаж болзошгүй гэжээ."],
  ])),
  set("ielts-reading-gardens", "ielts", "Reading · Learning in the garden", "Academic Reading", "Судалгааны тайлбараас нотолгоо, шалтгаан, хязгаарлалтыг олж уншаарай.", 20, reading(gardens, [
    ["How many schools used raised beds?", ["Three", "Six", "Twelve", "Eighteen"], "Six", "A хэсэгт арван хоёр цэцэрлэгийн зургаа нь өндөрлөсөн мандал ашигласан гэжээ."],
    ["Which feature was the same across all twelve gardens?", ["Sunlight hours", "Initial cost", "Vegetable varieties", "Harvest mass"], "Vegetable varieties", "A хэсэгт бүх сургууль ижил гурван сортын ногоо тарьсан гэж заасан."],
    ["Raised beds alone were proven to cause larger harvests. Is this True, False or Not Given?", ["True", "False", "Not Given"], "False", "B хэсэгт гэрлийн ялгаанаас шалтгаалан мандал өөрөө ургацын ялгааг үүсгэсэн гэж дүгнэж болохгүй гэсэн. Proven гэдэг нь эхтэй зөрчилдөнө."],
    ["What should be controlled in the recommended follow-up study?", ["The amount of sunlight", "Pupils' favourite colours", "The number of classrooms", "School uniform prices"], "The amount of sunlight", "B хэсэгт хоёр төрлийн цэцэрлэг ижил хэмжээний нарны гэрэл авах дараагийн судалгааг санал болгосон."],
    ["Pupils continued eating more vegetables at home after the study. Is this True, False or Not Given?", ["True", "False", "Not Given"], "Not Given", "C хэсэгт гэртээ хэр их идсэн болон улирлын дараах өөрчлөлтийг хэмжээгүй гэжээ. Үргэлжилсэн эсэх нь өгөгдөөгүй."],
    ["Which benefit of raised beds did teachers identify?", ["They required no maintenance", "Their height suited younger children", "They were free to install", "They worked without sunlight"], "Their height suited younger children", "D хэсэгт мандлын өндөр нь бага насны хүүхдэд тохиромжтой гэж багш нар хэлсэн."],
    ["In paragraph C, 'unfamiliar' most nearly means:", ["Unknown to the pupils", "Unhealthy", "Locally grown", "Expensive"], "Unknown to the pupils", "Unfamiliar нь танил бус, өмнө нь мэдэхгүй гэсэн утгатай. Энэ нь эрүүл бус эсвэл үнэтэй гэсэн үг биш."],
    ["Which title best reflects the report's conclusion?", ["One perfect garden for every school", "Raised beds guarantee better diets", "Choosing a garden requires several considerations", "Why schools should stop gardening"], "Choosing a garden requires several considerations", "D хэсгийн дүгнэлтээр хүртээмж, гэрэл, арчилгааны цагийг хамтад нь бодолцоно. Бүх сургуульд ганц шийдэл санал болгоогүй."],
  ])),
  set("ielts-language", "ielts", "Language Lab · Academic English", "Vocabulary & Grammar", "Бичих, уншихад хэрэгтэй холбоос, академик үг болон өгүүлбэрийн бүтцээ бататгаарай.", 15, [
    ["Choose the best connector: The sample was small. ___, the findings should be interpreted cautiously.", ["Nevertheless", "Therefore", "For instance", "Similarly"], "Therefore", "Жижиг түүвэртэй учраас болгоомжтой дүгнэнэ гэсэн үр дагаврын холбоос нь therefore. Nevertheless нь эсрэгцүүлэл."],
    ["Which sentence describes the data without adding an unsupported cause?", ["Sales rose because everyone became richer", "Sales rose from 100 to 150 units", "Sales rose because advertising always works", "Sales will certainly keep rising"], "Sales rose from 100 to 150 units", "100-аас 150 болсон гэдэг нь ажиглагдсан өөрчлөлт. Бусад өгүүлбэр өгөгдөлгүй шалтгаан эсвэл баталгаагүй ирээдүйн таамаг нэмсэн."],
    ["Choose the correct form: The number of international students ___ increased.", ["have", "has", "are", "were"], "has", "The number of ... нь нэг тоон хэмжээг заасан ганц тоон өгүүлэгдэхүүн тул has increased хэрэглэнэ."],
    ["In academic writing, 'a significant decline' means:", ["A noticeable decrease", "A small increase", "No change", "A temporary maximum"], "A noticeable decrease", "Decline нь бууралт, significant нь энд мэдэгдэхүйц гэсэн утгатай. Статистикийн тестийн тухай тусгайлан заагаагүй."],
    ["Choose the best paraphrase: Public transport is less expensive than private car travel.", ["Private cars are always free", "Using public transport costs less than travelling by private car", "Public transport costs more than cars", "Both forms of travel cost exactly the same"], "Using public transport costs less than travelling by private car", "Утгыг хадгалахдаа less expensive-ийг costs less гэж сольж болно. Харьцуулалтын чиглэл өөрчлөгдөхгүй."],
    ["Choose the correct sentence.", ["Although the cost fell, demand remained stable", "Although the cost fell, but demand remained stable", "Although the cost fell, so demand remained stable", "Although the cost fell, and demand remained stable"], "Although the cost fell, demand remained stable", "Although нь өөрөө эсрэгцүүлсэн дэд өгүүлбэр үүсгэнэ. Гол өгүүлбэрийн өмнө давхар but, so, and нэмэхгүй."],
    ["Choose the correct preposition: There was an increase ___ the proportion of commuters cycling to work.", ["at", "on", "in", "by"], "in", "An increase in + нэмэгдсэн зүйл гэж хэлнэ. Increase by нь хэдээр нэмэгдсэнийг илэрхийлнэ."],
    ["Which sentence most appropriately expresses a cautious conclusion?", ["This proves the policy can never fail", "The results suggest that the policy may be effective", "Everybody agrees with this policy", "The results guarantee permanent success"], "The results suggest that the policy may be effective", "Suggest болон may нь нотолгооны хязгаарыг илэрхийлдэг. Proves, never, everybody, guarantee нь үндэслэлгүй туйлширсан дүгнэлт."],
  ]),
  set("entrance-math", "entrance", "Математик · Суурь ба хэрэглээ", "Математик", "Алгебр, дараалал, логарифм, уламжлал болон магадлалын сууриа шалгаарай.", 20, [
    ["2³ × 2⁴ хэдтэй тэнцэх вэ?", ["32", "64", "128", "256"], "128", "Ижил суурьтай зэргүүдийг үржүүлэхэд илтгэгчүүдийг нэмнэ. 2^(3+4) = 2⁷ = 128."],
    ["log₂ 32-ийн утгыг ол.", ["4", "5", "6", "16"], "5", "2-ыг хэдэн зэрэгт дэвшүүлэхэд 32 болохыг олно. 2⁵ = 32 тул log₂32 = 5."],
    ["x² − 5x + 6 = 0 тэгшитгэлийн язгууруудын нийлбэр хэд вэ?", ["2", "3", "5", "6"], "5", "Виетийн теоремоор язгууруудын нийлбэр −b/a = 5. Мөн (x − 2)(x − 3) гэж задлаж болно."],
    ["Арифметик прогрессын a₁ = 4, ялгавар d = 3 бол a₁₀ хэд вэ?", ["27", "30", "31", "34"], "31", "aₙ = a₁ + (n − 1)d. a₁₀ = 4 + 9 × 3 = 31."],
    ["f(x) = x³ − 2x бол f′(2)-ын утгыг ол.", ["4", "6", "10", "12"], "10", "f′(x) = 3x² − 2. x = 2 үед 3 × 4 − 2 = 10."],
    ["sin 30° + cos 60° хэд вэ?", ["1/2", "1", "√2", "2"], "1", "sin30° = 1/2, cos60° = 1/2 тул нийлбэр 1."],
    ["Шударга зургаан талт шоог нэг удаа хаяхад тэгш тоо буух магадлал хэд вэ?", ["1/6", "1/3", "1/2", "2/3"], "1/2", "2, 4, 6 гэсэн 3 таатай үр дүнтэй. Нийт 6 боломжтой тул 3/6 = 1/2."],
    ["80,000₮ үнэтэй барааг 15% хямдруулжээ. Шинэ үнэ хэд вэ?", ["12,000₮", "65,000₮", "68,000₮", "72,000₮"], "68,000₮", "Үнийн 85%-ийг төлнө. 80,000 × 0.85 = 68,000₮. Хямдрал нь 12,000₮."],
  ]),
  set("entrance-english", "entrance", "Англи хэл · Grammar & Reading", "Англи хэл", "Цаг, нөхцөлт өгүүлбэр, идэвхгүй хэв болон богино эхийн ойлголтоо давтаарай.", 15, [
    ["Choose the correct form: She ___ English every day.", ["study", "studies", "studying", "have studied"], "studies", "She нь гуравдугаар биеийн ганц тоо. Энгийн одоо цагт study → studies болно."],
    ["Choose the correct form: We ___ here since 2020.", ["live", "lived", "have lived", "are live"], "have lived", "Since + эхэлсэн үе нь одоо хүртэл үргэлжилсэн хугацааг заана. Present perfect: have lived."],
    ["If I had more time, I ___ a new language.", ["learn", "will learn", "would learn", "had learned"], "would learn", "Бодит бус одоо нөхцөлийн бүтэц: If + past simple, would + үйл үгийн үндсэн хэлбэр."],
    ["Choose the passive form of: They built the bridge in 2010.", ["The bridge builds in 2010", "The bridge was built in 2010", "The bridge has build in 2010", "The bridge is building in 2010"], "The bridge was built in 2010", "Өнгөрсөн цагийн идэвхгүй хэв нь was/were + past participle. Bridge ганц тоо тул was built."],
    ["Choose the correct form: This is the ___ route to the station.", ["short", "shorter", "shortest", "most short"], "shortest", "The + давуу зэргийн хэлбэр хэрэглэнэ. Short гэсэн нэг үет тэмдэг нэрийн хэлбэр shortest."],
    ["Mira missed the bus, so she walked to school. Why did Mira walk?", ["She disliked all buses", "She missed the bus", "The school was closed", "She was training for a race"], "She missed the bus", "So-ийн өмнөх хэсэгт шалтгаан нь автобуснаас хоцорсон гэж өгөгдсөн. Бусад шалтгаан эхэд байхгүй."],
    ["Choose the closest meaning of 'reliable'.", ["Able to be trusted", "Very expensive", "Difficult to carry", "Quickly forgotten"], "Able to be trusted", "Reliable нь найдаж болох, итгэлтэй гэсэн утгатай. Үнэ, жин, мартахтай холбоогүй."],
    ["Choose the correct form: There isn't ___ water in the bottle.", ["many", "a few", "much", "several"], "much", "Water нь тоологддоггүй нэр үг. Үгүйсгэсэн өгүүлбэрт much хэрэглэнэ. Many, a few, several нь тоологдох нэртэй хэрэглэгддэг."],
  ]),
  set("entrance-physics", "entrance", "Физик · Хөдөлгөөн, энерги, цахилгаан", "Физик", "SI нэгжтэй бодлогоор хурд, хүч, ажил, чадал, хэлхээ болон дулааныг бататгаарай.", 20, [
    ["Бие 120 м замыг 10 с-д тогтмол хурдтай туулжээ. Хурд хэд вэ?", ["10 м/с", "12 м/с", "20 м/с", "1200 м/с"], "12 м/с", "v = s/t = 120/10 = 12 м/с."],
    ["2 кг масстай биед 6 Н нийлбэр хүч үйлчилбэл хурдатгал хэд вэ?", ["2 м/с²", "3 м/с²", "6 м/с²", "12 м/с²"], "3 м/с²", "Ньютоны II хууль F = ma. a = F/m = 6/2 = 3 м/с²."],
    ["Хөдөлгөөний чиглэлд үйлчилсэн 10 Н тогтмол хүч биеийг 4 м шилжүүлэв. Хүчний ажил хэд вэ?", ["2.5 Ж", "14 Ж", "40 Ж", "80 Ж"], "40 Ж", "Хүч шилжилттэй нэг чиглэлтэй тул W = Fs = 10 × 4 = 40 Ж."],
    ["Төхөөрөмж 600 Ж ажлыг 20 с-д хийжээ. Дундаж чадал хэд вэ?", ["20 Вт", "30 Вт", "60 Вт", "120 Вт"], "30 Вт", "P = W/t = 600/20 = 30 Вт. Нэг ватт нь секундэд нэг жоуль."],
    ["6 Ом эсэргүүцэлд 12 В хүчдэл өгвөл гүйдэл хэд вэ?", ["0.5 А", "2 А", "6 А", "72 А"], "2 А", "Омын хууль I = U/R = 12/6 = 2 А."],
    ["2 Ом ба 3 Ом эсэргүүцлийг цуваа холбоход нийт эсэргүүцэл хэд вэ?", ["1.2 Ом", "2.5 Ом", "5 Ом", "6 Ом"], "5 Ом", "Цуваа холбоонд эсэргүүцлүүд нэмэгдэнэ: R = 2 + 3 = 5 Ом."],
    ["2 кг масстай биеийг 5 м өндөрт өргөв. g = 10 м/с² гэвэл хүндийн потенциал энергийн өсөлт хэд вэ?", ["10 Ж", "25 Ж", "50 Ж", "100 Ж"], "100 Ж", "ΔE = mgh = 2 × 10 × 5 = 100 Ж. Өндрийн өөрчлөлт 5 м."],
    ["0.5 кг усыг 10°C-аар халаахад хэдэн Ж дулаан хэрэгтэй вэ? c = 4200 Ж/(кг·°C), дулаан алдагдалгүй.", ["2100 Ж", "4200 Ж", "21,000 Ж", "42,000 Ж"], "21,000 Ж", "Q = mcΔT = 0.5 × 4200 × 10 = 21,000 Ж. Температурын өөрчлөлтийг хэрэглэнэ."],
  ]),
];

export function findExercise(slug: string) { return exerciseSets.find(item => item.slug === slug); }
export function publicExercise(set: ExerciseSet) {
  return { ...set, questions: set.questions.map(({ id, prompt, options }) => ({ id, prompt, options })) };
}
