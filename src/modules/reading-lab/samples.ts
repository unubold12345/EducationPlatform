// Five original IELTS Academic-style reading practices for the Workshop Reading Lab. Written for this site, not
// taken from any IELTS paper or from the mock exams. Each is one passage with 12–13 questions, ordered from the
// easiest to the hardest. Answers, explanations and evidence ship with the page (like the Listening Lab drills):
// these are self-study materials graded in the browser. Every `evidence` must be an exact quote from a paragraph;
// tests/reading-lab.test.mjs checks that, and the answer keys, on every run.
import { AI_GROUPS, type FullGroup, type FullQuestion, type Passage } from "./contracts.ts";

export type ReadingSample = Passage & { id: string; topic: string; level: string; summary: string; groups: FullGroup[] };

type Draft<T> = T extends unknown ? Omit<T, "id"> : never;
type DraftGroup = Omit<FullGroup, "questions"> & { questions: Draft<FullQuestion>[] };
type DraftSample = Omit<ReadingSample, "groups"> & { groups: DraftGroup[] };

const TFNG = AI_GROUPS.tfng;
const CHOOSE = AI_GROUPS.choice;
const SENTENCES = AI_GROUPS.gap;
const T = 0, F = 1, NG = 2;

/** Numbers the questions q1, q2… in paper order. */
function numbered(sample: DraftSample): ReadingSample {
  let n = 0;
  return { ...sample, groups: sample.groups.map(group => ({ ...group, questions: group.questions.map(question => ({ ...question, id: "q" + ++n }) as FullQuestion) })) };
}

const samples: DraftSample[] = [
  {
    id: "urban-heat",
    title: "Cooling the Concrete Jungle",
    topic: "Хот, уур амьсгал",
    level: "Band 5.5–6.5",
    summary: "Хотууд яагаад хөдөөгөөс илүү халуун байдаг, түүнийг хэрхэн бууруулах вэ.",
    paragraphs: [
      "On a still summer evening, the centre of a large city can be several degrees warmer than the farmland only a short drive away. Scientists call this difference an urban heat island. The effect was first described in the early nineteenth century, when the amateur meteorologist Luke Howard noticed that his thermometers in London gave higher readings than those in the surrounding countryside. Today, with more than half of the world's population living in towns and cities, the question of why urban areas trap heat, and what can be done about it, has become far more pressing.",
      "The main cause lies in the materials that cities are built from. Asphalt roads, dark roofs and concrete walls absorb a large share of the sunlight that falls on them and store it as heat. In the countryside, by contrast, much of the sun's energy is used to evaporate water from soil and leaves, a process that cools the surrounding air. Because a city has fewer plants and less exposed soil, less of this natural cooling takes place. Moreover, tall buildings standing close together trap the heat that is released at night, so the streets between them cool down much more slowly than open fields.",
      "Human activity adds to the problem. Cars, factories and air-conditioning units all release waste heat directly into the streets. Air conditioning creates a particularly unfortunate cycle: as outdoor temperatures rise, people switch on more cooling units, and these units pump even more hot air outside. In some of the world's densest districts, researchers have estimated that waste heat from buildings and traffic can add a degree or more to night-time temperatures on its own.",
      "The consequences are more serious than mere discomfort. Hot nights prevent the body from recovering after a hot day, and doctors have linked prolonged heat to a rise in hospital admissions, especially among elderly people and those with heart or breathing problems. Higher temperatures also speed up the chemical reactions that produce ground-level ozone, a pollutant that irritates the lungs. Finally, there is an economic cost: the demand for electricity during heat waves can push power networks close to their limits.",
      "Fortunately, a number of solutions are relatively simple. One of the cheapest is to paint roofs white or cover them with reflective materials, which send sunlight back into the sky instead of absorbing it. Several cities have run programmes to coat thousands of roofs in this way. Planting trees is another effective measure, since trees provide shade and release water vapour through their leaves. Some city governments have gone further and now require new buildings above a certain size to include a green roof, a layer of soil and plants that insulates the building and absorbs rainwater.",
      "However, experts warn that no single measure is enough. White roofs work best in places with strong sunshine and may slightly increase heating costs in winter, while trees need water and years of growth before they provide much shade. The most successful plans therefore combine several approaches and, crucially, involve local residents, who are more likely to look after new trees and gardens if they have helped to plan them. As climate change brings more frequent heat waves, such planning is likely to become a normal part of how cities are designed.",
    ],
    groups: [
      {
        instruction: "The reading passage has six paragraphs, A–F. Choose the correct heading for paragraphs B–F from the list of headings below.",
        heading: "List of headings", labels: "roman",
        options: [
          "Combining methods and involving the public",
          "Why building materials hold heat",
          "Early weather records in London",
          "Risks to health, air quality and energy supply",
          "Heat produced by people and machines",
          "Low-cost ways to cool buildings and streets",
          "Why some cities are cooler than others",
          "The rising price of air conditioning",
        ],
        questions: [
          { kind: "match", prompt: "Paragraph B", answer: 1, evidence: "The main cause lies in the materials that cities are built from.", explanation: "B догол мөр асфальт, бетон зэрэг материал нарны илчийг шингээж, дулаан болгон хадгалдаг тухай өгүүлнэ." },
          { kind: "match", prompt: "Paragraph C", answer: 4, evidence: "Cars, factories and air-conditioning units all release waste heat directly into the streets.", explanation: "C догол мөр машин, үйлдвэр, агааржуулагчаас гарах хаягдал дулааны тухай. Агааржуулагч бол нэг жишээ нь, гол санаа биш." },
          { kind: "match", prompt: "Paragraph D", answer: 3, evidence: "The consequences are more serious than mere discomfort.", explanation: "D догол мөрт эрүүл мэнд, озоны бохирдол, цахилгааны сүлжээний ачаалал гэсэн гурван эрсдэлийг дурдсан." },
          { kind: "match", prompt: "Paragraph E", answer: 5, evidence: "Fortunately, a number of solutions are relatively simple.", explanation: "E догол мөр цагаан дээвэр, мод тарих, ногоон дээвэр зэрэг хялбар, хямд шийдлүүдийг тайлбарлана." },
          { kind: "match", prompt: "Paragraph F", answer: 0, evidence: "However, experts warn that no single measure is enough.", explanation: "F догол мөр нэг арга хангалтгүй тул хэд хэдэн аргыг хослуулж, иргэдийг оролцуулах хэрэгтэй гэнэ." },
        ],
      },
      {
        ...TFNG,
        questions: [
          { kind: "tfng", prompt: "Luke Howard studied London's weather as part of his paid employment.", answer: F, evidence: "the amateur meteorologist Luke Howard", explanation: "Текстэд Howard-ыг «amateur» буюу сонирхогч цаг уур судлаач гэжээ. Энэ нь цалинтай ажлынхаа хүрээнд судалсан гэдэгтэй зөрчилдөнө." },
          { kind: "tfng", prompt: "In rural areas, water evaporating from plants and soil helps to cool the air.", answer: T, evidence: "much of the sun's energy is used to evaporate water from soil and leaves, a process that cools the surrounding air", explanation: "B догол мөрт хөдөө нутагт хөрс, навчнаас ус ууршиж, эргэн тойрны агаарыг хөргөдөг гэж шууд бичсэн." },
          { kind: "tfng", prompt: "The urban heat island effect is stronger in winter than in summer.", answer: NG, explanation: "Текст зуны үдшийн жишээ өгдөг ч өвөл, зуны нөлөөг хооронд нь харьцуулаагүй." },
          { kind: "tfng", prompt: "Long periods of heat have been connected with more people being taken to hospital.", answer: T, evidence: "doctors have linked prolonged heat to a rise in hospital admissions", explanation: "D догол мөр: эмч нар удаан үргэлжилсэн халууныг эмнэлэгт хэвтэх хүмүүсийн тоо өсөхтэй холбосон." },
          { kind: "tfng", prompt: "White roofs help to reduce the cost of heating buildings in winter.", answer: F, evidence: "may slightly increase heating costs in winter", explanation: "F догол мөрт цагаан дээвэр өвөл халаалтын зардлыг бага зэрэг нэмэгдүүлж магадгүй гэжээ. Энэ нь өгүүлбэрийн эсрэг санаа." },
        ],
      },
      {
        ...SENTENCES,
        questions: [
          { kind: "gap", prompt: "In crowded city centres, tall buildings ______ heat after dark, so the streets stay warm.", answers: ["trap"], evidence: "tall buildings standing close together trap the heat that is released at night", explanation: "B догол мөрт ойрхон байрлах өндөр барилгууд шөнө ялгарах дулааныг «trap» буюу барьж үлдээдэг гэжээ." },
          { kind: "gap", prompt: "Trees cool a street by giving shade and by releasing ______ from their leaves.", answers: ["water vapour", "water vapor"], evidence: "release water vapour through their leaves", explanation: "E догол мөр: модод сүүдэр өгч, навчаараа «water vapour» буюу усны уур ялгаруулдаг." },
          { kind: "gap", prompt: "Local people are more likely to care for new trees and gardens if they have helped to ______ them.", answers: ["plan"], evidence: "who are more likely to look after new trees and gardens if they have helped to plan them", explanation: "F догол мөрт иргэд төлөвлөхөд оролцсон бол шинэ мод, цэцэрлэгээ илүү арчилдаг гэжээ." },
        ],
      },
    ],
  },
  {
    id: "takhi",
    title: "The Return of the Takhi",
    topic: "Байгаль хамгаалал",
    level: "Band 6–6.5",
    summary: "Тахь буюу Пржевальскийн адуу Монголын тал нутагт хэрхэн эргэн ирсэн түүх.",
    paragraphs: [
      "Visitors to Hustai National Park, about a hundred kilometres from Ulaanbaatar, can sometimes watch small herds of stocky, sand-coloured horses grazing on the hillsides. With their short, upright manes and pale noses, these animals look quite different from the domestic horses that Mongolian herders ride. They are takhi, known in English as Przewalski's horses, and their presence in the park is the result of one of the most remarkable conservation efforts of the twentieth century.",
      "The horse takes its English name from the Russian explorer Nikolai Przhevalsky, who brought a skull and a hide back to St Petersburg in the late 1870s. European scientists were fascinated, and around 1900 several expeditions captured foals in the Dzungarian Gobi, on the border between Mongolia and China, to send to zoos and private collections. Many of the young animals died on the long journey. Meanwhile, the wild population continued to shrink as hunting increased, domestic livestock competed for scarce water and grazing, and harsh winters took their toll.",
      "The last confirmed sighting of a wild herd took place in 1969, and the species was later classified as extinct in the wild. Its survival depended entirely on the animals in captivity, all of which were descended from just over a dozen individuals. Such a small group carried a serious risk of inbreeding, which can lead to weaker and less fertile animals. To reduce this danger, zoos in different countries began to cooperate, keeping a shared record of every horse's ancestry and exchanging animals so that closely related horses would not breed with one another.",
      "By the late 1980s the captive population had grown to more than a thousand, and conservationists began to plan a return to Mongolia. In 1992 the first horses were flown from Europe to two sites: Hustai and Takhin Tal, on the edge of the Gobi Desert. The animals were first kept in large fenced areas so that they could adjust to the climate and learn to find food before being released. A third site, Khomiin Tal in the west of the country, was added later.",
      "The return has not been without setbacks. Wolves kill a number of foals each year, and in the winter of 2009–2010 extreme cold and deep snow killed a large share of the herd at Takhin Tal. There is also concern that takhi may breed with domestic horses, which would weaken their distinct genetic identity: Przewalski's horses have 66 chromosomes, while domestic horses have 64. Even so, numbers have risen steadily. In 2008 the species was moved out of the 'extinct in the wild' category, and in 2011 its status was improved again, to endangered.",
      "Ironically, new genetic research has raised questions about what kind of animal the takhi really is. A study published in 2018 suggested that Przewalski's horses are descended from horses kept by the Botai people of northern Kazakhstan more than five thousand years ago. If this is correct, the takhi may be feral, the descendants of domesticated animals that returned to the wild, rather than a truly wild species. For the herders and rangers who protect them, however, this debate changes little: the horses remain a living part of Mongolia's natural and cultural heritage.",
    ],
    groups: [
      {
        instruction: "The reading passage has six paragraphs, A–F. Which paragraph contains the following information?",
        labels: "paragraph",
        questions: [
          { kind: "match", prompt: "how the horses were prepared before being set free", answer: 3, evidence: "The animals were first kept in large fenced areas so that they could adjust to the climate and learn to find food before being released.", explanation: "D догол мөрт адуунуудыг эхлээд том хашаатай талбайд байлгаж, уур амьсгалд дасгаж, хоол олж сурсны дараа тавьсан гэжээ." },
          { kind: "match", prompt: "a comparison of the appearance of two kinds of horse", answer: 0, evidence: "these animals look quite different from the domestic horses that Mongolian herders ride", explanation: "A догол мөр тахийн богино босоо дэл, цайвар хамрыг малчдын унадаг гэрийн адуутай харьцуулна." },
          { kind: "match", prompt: "a genetic difference between takhi and domestic horses", answer: 4, evidence: "Przewalski's horses have 66 chromosomes, while domestic horses have 64", explanation: "E догол мөрт хромосомын тоог (66 ба 64) дурдсан нь генетикийн ялгаа. F догол мөр удам гарлын тухай, ялгааны тухай биш." },
          { kind: "match", prompt: "a method used to reduce the dangers of a small population", answer: 2, evidence: "exchanging animals so that closely related horses would not breed with one another", explanation: "C догол мөр: амьтны хүрээлэнгүүд удам угсааг бүртгэж, адуу солилцон ойр төрлийн үржлээс сэргийлсэн." },
        ],
      },
      {
        ...TFNG,
        questions: [
          { kind: "tfng", prompt: "Przhevalsky captured several live horses and took them to St Petersburg.", answer: F, evidence: "who brought a skull and a hide back to St Petersburg in the late 1870s", explanation: "Тэрээр амьд адуу биш, гавлын яс ба арьс авчирсан. Унага барьсан нь 1900 оны үеийн өөр экспедицүүд." },
          { kind: "tfng", prompt: "Competition with farm animals was one reason for the decline of the wild takhi.", answer: T, evidence: "domestic livestock competed for scarce water and grazing", explanation: "B догол мөрт мал ус, бэлчээрийн төлөө өрсөлдсөн нь зэрлэг сүрэг цөөрсөн шалтгааны нэг гэжээ." },
          { kind: "tfng", prompt: "All of the horses flown to Mongolia in 1992 came from the same zoo.", answer: NG, explanation: "1992 онд Европоос нисгэж авчирсан гэж бичсэн ч аль амьтны хүрээлэнгээс ирснийг дурдаагүй." },
          { kind: "tfng", prompt: "The takhi's conservation status has been improved on two occasions.", answer: T, evidence: "in 2011 its status was improved again, to endangered", explanation: "2008 онд «байгальд устсан» ангиллаас гарч, 2011 онд дахин сайжирсан. Өөрөөр хэлбэл хоёр удаа." },
        ],
      },
      {
        ...SENTENCES,
        questions: [
          { kind: "gap", prompt: "Every takhi in captivity was descended from just over a ______ animals.", answers: ["dozen"], evidence: "all of which were descended from just over a dozen individuals", explanation: "C догол мөр: «just over a dozen individuals», өөрөөр хэлбэл арван хоёроос арай олон адуу." },
          { kind: "gap", prompt: "Takhin Tal is located on the edge of the ______.", answers: ["Gobi Desert", "Gobi"], evidence: "on the edge of the Gobi Desert", explanation: "D догол мөр: Тахийн тал «on the edge of the Gobi Desert», Говийн захад оршдог." },
          { kind: "gap", prompt: "Many horses at Takhin Tal died during a winter of extreme cold and deep ______.", answers: ["snow"], evidence: "extreme cold and deep snow killed a large share of the herd at Takhin Tal", explanation: "E догол мөр: 2009–2010 оны өвөл хүйтэн ба зузаан цас олон адууг хорогдуулсан." },
          { kind: "gap", prompt: "Research from 2018 suggests that takhi may be ______ animals rather than a truly wild species.", answers: ["feral"], evidence: "the takhi may be feral", explanation: "F догол мөр: «feral» гэдэг нь гаршуулсан амьтдын байгальд буцсан үр удам гэсэн утгатай." },
        ],
      },
    ],
  },
  {
    id: "sleep-memory",
    title: "Why We Sleep on It",
    topic: "Тархи, нойр",
    level: "Band 6–7",
    summary: "Нойр шинэ мэдлэгийг тархинд хэрхэн бататгадаг тухай судалгаа.",
    paragraphs: [
      "For most of history, sleep was regarded as a period of rest in which the brain simply switched off. It was only in the 1950s, when researchers began recording the electrical activity of sleeping volunteers, that this view started to change. They discovered that sleep is made up of distinct stages that repeat in cycles of roughly ninety minutes throughout the night, and that during some of these stages the brain is almost as active as it is during the day.",
      "Two stages have attracted particular attention from memory researchers. In deep sleep, also known as slow-wave sleep, large groups of neurons fire together in slow, regular waves. In rapid eye movement (REM) sleep, the stage in which most vivid dreams occur, brain activity becomes fast and irregular, while the muscles of the body are temporarily paralysed. Deep sleep is concentrated in the first half of the night, whereas REM periods grow longer towards the morning.",
      "A large body of evidence now suggests that sleep helps to strengthen, or consolidate, new memories. In a typical experiment, volunteers learn a list of word pairs and are tested twelve hours later. Those who have slept during the interval usually remember more pairs than those who have stayed awake for the same length of time, even though both groups were equally good at the task before the break. Researchers have also tried to rule out a simpler explanation: that sleepers remember more only because they meet no new information that could interfere with what they learned. Several studies suggest that this passive protection cannot account for the whole effect.",
      "One explanation involves a small, curved structure deep in the brain called the hippocampus, which plays a central role in recording new experiences. Recordings in rats have shown that patterns of activity produced while an animal explores a maze are replayed in the hippocampus during later sleep, often at a much faster speed. Many scientists believe that this replay gradually transfers memories to the outer layer of the brain, the cortex, where they can be stored for the long term and linked to existing knowledge.",
      "The role of REM sleep is less clear. Some studies indicate that it is especially important for emotional memories and for skills such as playing a musical instrument, while others suggest that it helps the brain to find hidden connections between pieces of information. In one well-known experiment, which did not separate the different stages of sleep, people who were given a mathematical task containing a hidden shortcut were more than twice as likely to discover it after a night's sleep as those who had stayed awake.",
      "These findings have practical implications for students. Staying up all night before an examination may provide extra hours of study, but it also removes the very process that helps new information to settle. Short daytime naps can bring some of the same benefits, although researchers caution that a nap is not a substitute for regular, sufficient sleep at night. Perhaps the most useful advice is also the simplest: learning a little each day, and sleeping on it, appears to be more effective than cramming everything into a single session.",
    ],
    groups: [
      {
        ...CHOOSE,
        questions: [
          { kind: "choice", prompt: "What did researchers discover in the 1950s?", options: ["The brain stops working completely during deep sleep.", "Sleep consists of separate stages that are repeated during the night.", "People need at least ninety minutes of sleep to feel rested.", "The brain is more active at night than during the day."], answer: 1, evidence: "sleep is made up of distinct stages that repeat in cycles of roughly ninety minutes throughout the night", explanation: "A догол мөр: нойр давтагддаг тусдаа үе шатуудаас бүрддэг болохыг илрүүлсэн. 90 минут бол нэг мөчлөгийн урт, шаардлагатай нойрны хэмжээ биш." },
          { kind: "choice", prompt: "During REM sleep,", options: ["neurons fire together in slow, regular waves.", "the body's muscles are unusually active.", "most vivid dreams take place.", "the brain is less active than in deep sleep."], answer: 2, evidence: "the stage in which most vivid dreams occur", explanation: "B догол мөр: REM үед хамгийн тод зүүд зүүдэлдэг. Удаан, жигд долгион бол гүн нойрны шинж, булчин харин түр саажилттай байдаг." },
          { kind: "choice", prompt: "In the word-pair experiments, the two groups", options: ["learned different lists of words.", "performed equally well before the break.", "were tested immediately after waking up.", "were given new information during the interval."], answer: 1, evidence: "both groups were equally good at the task before the break", explanation: "C догол мөр: завсарлагаанаас өмнө хоёр бүлэг адилхан сайн байсан тул ялгаа нь нойроос үүдэлтэй гэж үздэг." },
          { kind: "choice", prompt: "What does the writer say about the experiment with the mathematical task?", options: ["It proved that REM sleep is needed to solve problems.", "It was carried out with professional musicians.", "It did not show which stage of sleep was responsible.", "It found that sleep doubles the amount people remember."], answer: 2, evidence: "which did not separate the different stages of sleep", explanation: "E догол мөрт энэ туршилт нойрны үе шатуудыг ялгаагүй гэжээ, тиймээс аль үе шат нөлөөлснийг харуулаагүй. «Twice as likely» нь далд аргыг олох магадлалын тухай." },
        ],
      },
      {
        ...TFNG,
        questions: [
          { kind: "tfng", prompt: "Most deep sleep takes place in the second half of the night.", answer: F, evidence: "Deep sleep is concentrated in the first half of the night", explanation: "B догол мөрт гүн нойр шөнийн эхний хагаст төвлөрдөг гэжээ. Шөнийн хоёр дахь хагаст REM уртасдаг." },
          { kind: "tfng", prompt: "In rats, patterns of brain activity are often replayed faster during sleep than they first occurred.", answer: T, evidence: "often at a much faster speed", explanation: "D догол мөр: харханд идэвхийн хэв маяг нойронд дахин тоглогдохдоо ихэвчлэн хамаагүй хурдан явагддаг." },
          { kind: "tfng", prompt: "Rats that slept after exploring a maze found their way through it more quickly the next day.", answer: NG, explanation: "Текст нойрны үеийн тархины идэвхийг дурдсан ч дараагийн өдөр хархнууд төөрдөг байшинг хэр хурдан туулсныг хэлээгүй." },
          { kind: "tfng", prompt: "Scientists agree about the main purpose of REM sleep.", answer: F, evidence: "The role of REM sleep is less clear.", explanation: "E догол мөрт REM-ийн үүрэг тодорхой бус, судалгаанууд өөр өөр дүгнэлт хийдэг гэжээ, тиймээс санал нэгдээгүй." },
          { kind: "tfng", prompt: "Studying through the night before an exam takes away a process that helps learning.", answer: T, evidence: "it also removes the very process that helps new information to settle", explanation: "F догол мөр: шөнөжин унших нь шинэ мэдээллийг тогтооход тусалдаг процессыг арилгадаг." },
        ],
      },
      {
        instruction: "Complete the summary below.",
        limit: "Choose NO MORE THAN TWO WORDS from the passage for each answer.",
        heading: "How sleep may help memory",
        questions: [
          { kind: "gap", prompt: "The hippocampus has an important part in recording new ______.", answers: ["experiences"], evidence: "plays a central role in recording new experiences", explanation: "D догол мөр: hippocampus шинэ «experiences» буюу туршлагыг бүртгэхэд гол үүрэгтэй." },
          { kind: "gap", prompt: "During sleep, patterns of activity from earlier in the day are ______.", answers: ["replayed"], evidence: "are replayed in the hippocampus during later sleep", explanation: "D догол мөр: өдрийн идэвхийн хэв маяг нойронд «replayed» буюу дахин тоглогддог." },
          { kind: "gap", prompt: "This may move memories to the cortex, where they are connected to ______.", answers: ["existing knowledge"], evidence: "linked to existing knowledge", explanation: "D догол мөр: cortex-д дурсамж урт хугацаанд хадгалагдаж, «existing knowledge» буюу өмнөх мэдлэгтэй холбогддог." },
          { kind: "gap", prompt: "For students, learning a little each day works better than ______ everything at once.", answers: ["cramming"], evidence: "more effective than cramming everything into a single session", explanation: "F догол мөр: өдөр бүр бага багаар сурах нь нэг дор «cramming» буюу шахаж цээжлэхээс үр дүнтэй." },
        ],
      },
    ],
  },
  {
    id: "paper",
    title: "Paper's Long Journey West",
    topic: "Түүх",
    level: "Band 6.5–7.5",
    summary: "Цаас Хятадаас Төв Ази, Багдадаар дамжин Европ хүртэл хэрхэн тархсан бэ.",
    paragraphs: [
      "Long before paper existed, people wrote on whatever durable surface they could find. The Egyptians pressed strips of the papyrus plant into sheets, while in Europe and the Middle East scribes used parchment, made from carefully prepared animal skin. In China, texts were written on strips of bamboo, which were heavy, or on silk, which was light but very expensive. A material that was both cheap and easy to carry would transform the way knowledge was recorded and shared.",
      "Chinese tradition credits a court official named Cai Lun with the invention of paper in the year 105 CE. According to the historical records, he made sheets from tree bark, hemp, old rags and fishing nets, which were soaked, beaten into a pulp and spread thinly on a screen to dry. However, archaeologists have since found fragments of paper that are considerably older, some dating back to the second century BCE. It now seems more likely that Cai Lun improved and promoted an existing technique, rather than inventing it from nothing.",
      "For several centuries, the method of making paper remained largely within East Asia, reaching Korea and then Japan by the seventh century. Its arrival in the Islamic world is often linked to the Battle of Talas in 751, after which, according to a popular story, Chinese prisoners taught papermaking to craftsmen in Samarkand. Many historians now doubt this account, pointing out that paper may already have been known in Central Asia before the battle. Whatever the exact route, Samarkand soon became famous for the quality of its paper.",
      "From Central Asia the craft spread quickly. By the end of the eighth century there were paper mills in Baghdad, then the capital of a vast empire with a large and busy administration. Officials found that paper had a practical advantage over parchment: ink soaked into its fibres, so a document could not easily be scraped clean and altered. Within a few generations, paper was being produced in Damascus and Cairo, and it had become the standard material for books, letters and government records across the region.",
      "Europe was slower to adopt the new material. Paper reached Spain under Muslim rule, and one of the earliest European paper mills operated at Xàtiva in the twelfth century. Some Christian authorities were suspicious of it, partly because of its origins and partly because they believed it would not last as long as parchment. It was in Italy, in the town of Fabriano, that European papermakers made their most important improvements in the thirteenth century, including water-powered hammers to beat the pulp and watermarks that identified each mill's products.",
      "The real breakthrough came with the printing press in the fifteenth century. Printing a large number of books on parchment would have required the skins of a great many animals, so cheap paper and the press quickly became partners. Demand grew so fast that rags, the main raw material, were often in short supply. The problem was only solved in the nineteenth century, when manufacturers learned to make paper from wood pulp, the material from which most of the world's paper is still made today.",
    ],
    groups: [
      {
        ...CHOOSE,
        questions: [
          { kind: "choice", prompt: "What does the writer say about bamboo and silk?", options: ["Both were used mainly for official documents.", "Bamboo was costly, while silk was easy to carry.", "One was heavy and the other was expensive.", "Both were replaced by parchment in China."], answer: 2, evidence: "strips of bamboo, which were heavy, or on silk, which was light but very expensive", explanation: "A догол мөр: хулс хүнд, торго хөнгөн ч маш үнэтэй байсан. B сонголт эсрэгээр нь хольсон." },
          { kind: "choice", prompt: "What do archaeological finds suggest about Cai Lun?", options: ["He did not live at the time recorded in Chinese history.", "He probably developed a method that already existed.", "He was the first person to use fishing nets for paper.", "He learned papermaking from craftsmen in the west."], answer: 1, evidence: "It now seems more likely that Cai Lun improved and promoted an existing technique", explanation: "B догол мөр: илүү эртний цаас олдсон тул Цай Лунь байсан аргыг сайжруулж, түгээсэн байх магадлалтай." },
          { kind: "choice", prompt: "Why do many historians doubt the story about the Battle of Talas?", options: ["There are no records that the battle took place.", "Chinese prisoners were not allowed to work in Samarkand.", "Paper from Samarkand was of poor quality.", "Paper may have reached Central Asia before 751."], answer: 3, evidence: "paper may already have been known in Central Asia before the battle", explanation: "C догол мөр: тулалдаанаас өмнө Төв Азид цаас мэдэгдэж байсан байж болзошгүй гэж түүхчид үздэг." },
          { kind: "choice", prompt: "According to the writer, officials in Baghdad valued paper because", options: ["it was cheaper than parchment.", "writing on it was difficult to change.", "it could be produced in large mills.", "it lasted longer than parchment."], answer: 1, evidence: "ink soaked into its fibres, so a document could not easily be scraped clean and altered", explanation: "D догол мөр: бэх цаасны ширхэгт шингэдэг тул бичгийг хусаж өөрчлөх хэцүү байсан." },
        ],
      },
      {
        instruction: "Complete the summary using the list of words, A–H, below.",
        heading: "Paper in Europe", labels: "letter",
        options: ["durability", "watermarks", "Spain", "wood pulp", "Italy", "rags", "printing", "silk"],
        questions: [
          { kind: "match", prompt: "Paper first arrived in Europe through ______, where one of the earliest mills was built.", answer: 2, evidence: "Paper reached Spain under Muslim rule", explanation: "E догол мөр: цаас Европт Испаниар дамжин орж, Xàtiva-д анхны тээрмүүдийн нэг ажилласан. Итали бол хожмын сайжруулалтын газар." },
          { kind: "match", prompt: "Some religious authorities doubted the ______ of the new material.", answer: 0, evidence: "they believed it would not last as long as parchment", explanation: "E догол мөр: зарим христийн удирдлага цаас илгэн цаас шиг удаан эдэлгээтэй биш гэж үзсэн, өөрөөр хэлбэл «durability»." },
          { kind: "match", prompt: "Papermakers in Fabriano introduced ______ to show which mill had made a sheet.", answer: 1, evidence: "watermarks that identified each mill's products", explanation: "E догол мөр: Fabriano-д тээрэм бүрийн бүтээгдэхүүнийг тодорхойлох «watermarks» нэвтрүүлсэн." },
          { kind: "match", prompt: "The arrival of ______ greatly increased the demand for paper.", answer: 6, evidence: "The real breakthrough came with the printing press in the fifteenth century.", explanation: "F догол мөр: XV зууны хэвлэх машин цаасны эрэлтийг огцом өсгөсөн." },
          { kind: "match", prompt: "Because ______ were often scarce, a new raw material was eventually needed.", answer: 5, evidence: "rags, the main raw material, were often in short supply", explanation: "F догол мөр: гол түүхий эд болох «rags» буюу өөдөс хомсдож, хожим модны нухаш (wood pulp) орлосон." },
        ],
      },
      {
        ...TFNG,
        questions: [
          { kind: "tfng", prompt: "Paper reached Japan before it reached Korea.", answer: F, evidence: "reaching Korea and then Japan by the seventh century", explanation: "C догол мөр: цаас эхлээд Солонгост, дараа нь Японд хүрсэн." },
          { kind: "tfng", prompt: "Samarkand became well known for producing high-quality paper.", answer: T, evidence: "Samarkand soon became famous for the quality of its paper", explanation: "C догол мөр: Самарканд удалгүй цаасныхаа чанараар алдаршсан." },
          { kind: "tfng", prompt: "The first books printed in Europe were religious texts.", answer: NG, explanation: "F догол мөр хэвлэх машины тухай өгүүлдэг ч анхны хэвлэмэл номуудын агуулгыг дурдаагүй." },
        ],
      },
    ],
  },
  {
    id: "bird-navigation",
    title: "How Birds Find Their Way",
    topic: "Амьтан судлал",
    level: "Band 7+",
    summary: "Нүүдлийн шувууд нар, од, соронзон орноор хэрхэн чиглэлээ олдог вэ.",
    paragraphs: [
      "Every autumn, billions of birds leave their breeding grounds and fly hundreds or even thousands of kilometres to spend the winter in warmer regions. Many of them travel at night, alone, and without ever having made the journey before. How they manage to find their way has puzzled naturalists for centuries, and although scientists have learned a great deal since the middle of the twentieth century, the full answer is still not known.",
      "Researchers usually distinguish between two abilities. The first is a compass sense: the ability to fly in a particular direction, such as south-west. The second is a map sense: the ability to know where one is in relation to a destination. A bird with only a compass could keep a steady course, but if a storm blew it off course it would have no way of knowing that it needed to change direction. A true navigator needs both.",
      "The first compass to be identified was based on the sun. In the early 1950s the German zoologist Gustav Kramer kept starlings in circular cages and noticed that, during the migration season, they fluttered restlessly in the direction they would normally fly. When he used mirrors to change the apparent position of the sun, the birds changed their direction by a corresponding angle. Because the sun moves across the sky during the day, Kramer concluded that the birds must also use an internal clock to adjust for its movement.",
      "Night-flying birds cannot use the sun, and in the 1960s the American biologist Stephen Emlen showed that some of them rely on the stars instead. Working with indigo buntings in a planetarium, he found that young birds learned to identify the point in the night sky around which the stars appear to rotate. When he raised birds under an artificial sky that rotated around a different star, they treated that star as north. Their star compass, in other words, is learned rather than inherited.",
      "Birds also possess a magnetic compass. In the 1960s and 1970s Wolfgang and Roswitha Wiltschko showed that European robins kept in cages, with no view of the sky, still chose the correct migratory direction, and that their choice changed when the magnetic field around them was altered. Surprisingly, the robins did not respond to the north and south poles of the field as a human compass does; instead, they detected the angle at which the field lines meet the Earth's surface. Exactly how they sense the field remains uncertain, although some scientists suspect that light-sensitive proteins in the eye are involved.",
      "The map sense is even more mysterious, but a famous experiment by the Dutch biologist A. C. Perdeck in the 1950s showed how important experience is. Thousands of starlings caught in the Netherlands during their autumn migration were taken by plane to Switzerland and released. Adult birds corrected their course and flew towards their usual winter quarters in Britain and northern France, while young birds continued in their original direction and ended up in Spain. Smell may also play a part in the map of some species: in the 1970s the Italian researcher Floriano Papi found that homing pigeons whose sense of smell had been blocked often failed to find their way home.",
    ],
    groups: [
      {
        instruction: "Look at the following findings and the list of researchers below. Match each finding with the correct researcher, A–E.",
        heading: "List of researchers", labels: "letter",
        options: ["Gustav Kramer", "Stephen Emlen", "Wolfgang and Roswitha Wiltschko", "A. C. Perdeck", "Floriano Papi"],
        questions: [
          { kind: "match", prompt: "Birds respond to the angle of the Earth's magnetic field rather than to its poles.", answer: 2, evidence: "they detected the angle at which the field lines meet the Earth's surface", explanation: "E догол мөр: Wiltschko-гийн туршилтад улаан хөхт шувуу туйл биш, соронзон шугамын газрын гадаргатай үүсгэх өнцгийг мэдэрсэн." },
          { kind: "match", prompt: "Birds have to learn which part of the night sky marks north.", answer: 1, evidence: "Their star compass, in other words, is learned rather than inherited.", explanation: "D догол мөр: Emlen одны луужин төрөлхийн биш, сурдаг болохыг харуулсан." },
          { kind: "match", prompt: "Experienced birds can find their route again after being moved to a new place.", answer: 3, evidence: "Adult birds corrected their course", explanation: "F догол мөр: Perdeck-ийн туршилтад насанд хүрсэн шувууд Швейцариас замаа засаж, ердийн өвөлжөөндөө очсон." },
          { kind: "match", prompt: "Birds use a sense of time to allow for the sun's movement.", answer: 0, evidence: "the birds must also use an internal clock to adjust for its movement", explanation: "C догол мөр: Kramer шувууд нарны хөдөлгөөнийг дотоод цагаараа тооцдог гэж дүгнэсэн." },
        ],
      },
      {
        ...CHOOSE,
        questions: [
          { kind: "choice", prompt: "According to the writer, a bird that has only a compass sense", options: ["cannot fly in a straight line.", "would not realise that it had been blown off course.", "can only migrate during the day.", "needs to follow other birds."], answer: 1, evidence: "it would have no way of knowing that it needed to change direction", explanation: "B догол мөр: зөвхөн луужинтай шувуу чиглэлээ барьж чадна, гэхдээ шуурганд хөөгдвөл чиглэлээ өөрчлөх ёстойгоо мэдэхгүй." },
          { kind: "choice", prompt: "What did Kramer notice about his starlings during the migration season?", options: ["They refused to move when the sky was cloudy.", "They tried to escape through the top of the cage.", "Their restless movements pointed in their migratory direction.", "They became active only at night."], answer: 2, evidence: "they fluttered restlessly in the direction they would normally fly", explanation: "C догол мөр: шувууд ердийн нүүдлийн чиглэл рүүгээ тайван бус далавчаа дэвсэж байсан." },
          { kind: "choice", prompt: "What does the writer say about how birds detect the magnetic field?", options: ["It has been proven to depend on the eye.", "It works in the same way as a human compass.", "It requires a clear view of the sky.", "The mechanism is not yet fully understood."], answer: 3, evidence: "Exactly how they sense the field remains uncertain", explanation: "E догол мөр: шувуу соронзон орныг яг яаж мэдэрдэг нь тодорхойгүй. Нүдний уураг бол зөвхөн таамаглал, батлагдаагүй." },
        ],
      },
      {
        ...TFNG,
        questions: [
          { kind: "tfng", prompt: "Some birds migrate alone along a route they have never flown before.", answer: T, evidence: "Many of them travel at night, alone, and without ever having made the journey before.", explanation: "A догол мөр: олон шувуу шөнө, ганцаараа, урьд нь хэзээ ч нисээгүй замаар нүүдэллэдэг." },
          { kind: "tfng", prompt: "Other zoologists at first rejected Kramer's findings about the sun compass.", answer: NG, explanation: "Текст Kramer-ын туршилт, дүгнэлтийг тайлбарласан ч бусад эрдэмтэд хэрхэн хүлээж авсныг дурдаагүй." },
          { kind: "tfng", prompt: "The young starlings released in Switzerland reached their usual winter quarters.", answer: F, evidence: "young birds continued in their original direction and ended up in Spain", explanation: "F догол мөр: залуу шувууд анхны чиглэлээрээ нисэж Испанид очсон, ердийн өвөлжөөндөө (Британи, Францын хойд хэсэг) хүрээгүй." },
        ],
      },
      {
        ...SENTENCES,
        questions: [
          { kind: "gap", prompt: "Kramer used ______ to make the sun appear to be in a different position.", answers: ["mirrors"], evidence: "When he used mirrors to change the apparent position of the sun", explanation: "C догол мөр: Kramer «mirrors» буюу толь ашиглан нарны харагдах байрлалыг өөрчилсөн." },
          { kind: "gap", prompt: "Pigeons that could not use their sense of ______ often failed to return home.", answers: ["smell"], evidence: "homing pigeons whose sense of smell had been blocked often failed to find their way home", explanation: "F догол мөр: Papi-гийн туршилтад үнэрлэх мэдрэмжээ хаасан тагтаа ихэвчлэн гэрээ олж чадаагүй." },
        ],
      },
    ],
  },
];

export const readingSamples: ReadingSample[] = samples.map(numbered);
export function findReadingSample(id: unknown) {
  return readingSamples.find(sample => sample.id === id) ?? null;
}
