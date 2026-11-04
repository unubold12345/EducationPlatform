import "server-only";

export const guidedTasks = [
  {
    slug: "ielts-writing-data", title: "Writing Task 1 · A changing commute", skill: "Writing", minutes: 20, minWords: 150,
    prompt: "The table shows how people in a fictional town travelled to work in 2010 and 2025. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.",
    table: { headings: ["Transport", "2010", "2025"], rows: [["Car", "60%", "40%"], ["Bus", "25%", "35%"], ["Bicycle", "10%", "20%"], ["Walking", "5%", "5%"]] },
    tips: "Эхлээд ерөнхий чиг хандлагаа ол. Дараа нь гол өөрчлөлтүүдийг тоогоор харьцуул. Шалтгааныг хүснэгтэд өгөөгүй тул зохиож нэмэхгүй.",
    checklist: ["Хүснэгтийн сэдэв, хоёр оныг өөрийн үгээр танилцуулсан", "Гол чиг хандлагыг тоймлосон", "Ижил нэгж, зөв тоо ашиглан харьцуулсан", "Баримтгүй шалтгаан, хувийн бодол нэмээгүй", "Догол мөр, холбоос болон өгүүлбэрийн бүтцээ шалгасан"],
    model: `The table compares the proportions of commuters using four forms of transport in a fictional town in 2010 and 2025.

Overall, cars remained the most common means of travelling to work, although their share fell considerably. Both buses and bicycles became more popular, while the proportion of people walking was unchanged.

In 2010, 60% of commuters travelled by car, which was more than twice the share using buses, at 25%. By 2025, the figure for cars had dropped to 40%, a decrease of 20 percentage points. Bus use, by contrast, rose by 10 percentage points to 35%, leaving a gap of only five points between the two leading categories.

Cycling also increased, with its share doubling from 10% to 20%. Despite this growth, bicycles were still less widely used than either cars or buses in 2025. Walking accounted for 5% of journeys in both years and remained the least common option. Taken together, the three alternatives to driving represented 60% of commuting in 2025, compared with 40% in 2010.`,
  },
  {
    slug: "ielts-writing-opinion", title: "Writing Task 2 · Learning beyond the classroom", skill: "Writing", minutes: 40, minWords: 250,
    prompt: "Some people believe that secondary schools should require all students to take part in community service. Others think students should decide for themselves. Discuss both views and give your own opinion. Write at least 250 words. Give reasons and include relevant examples from your own knowledge or experience.",
    table: null,
    tips: "Хоёр байр суурийг хоёуланг нь тайлбарла. Өөрийн байр суурийг тодорхой гаргаж, шалтгаан → тайлбар → жишээ гэсэн холбоогоор хөгжүүл. Доорх жишиг хариу нь нэг боломжит байр суурь.",
    checklist: ["Хоёр байр суурийг хоёуланг хэлэлцсэн", "Өөрийн бодол эхлэлээс төгсгөл хүртэл тодорхой", "Гол санаа бүр тайлбар, жишээтэй", "Догол мөрүүд логик дараалалтай", "Үгийн сонголт, дүрэм, цэг тэмдгээ шалгасан"],
    model: `Community service can give teenagers experience that classroom lessons cannot provide. While some people argue that schools should make it compulsory, others believe that participation should remain a personal choice. In my view, schools should offer structured opportunities but allow students some freedom over how they contribute.

Those who support a requirement point to the educational value of working with others. A student who helps organise a neighbourhood clean-up, for example, must cooperate with people of different ages and take responsibility for a practical task. Making service compulsory could also ensure that these experiences are available to students who would not volunteer independently. Schools could reduce barriers by providing transport and arranging suitable projects during normal school hours.

However, opponents have reasonable concerns. Some students already care for younger relatives or have paid jobs after school. A rigid service requirement could place an unfair burden on them. In addition, volunteering is partly valuable because it reflects a willingness to help. If students attend only to complete a fixed number of hours, they may concentrate on meeting the requirement rather than understanding the people they are supposed to support.

I therefore favour a flexible approach. Schools could introduce several community projects and let students choose one that fits their interests and circumstances. Existing responsibilities, such as regular family care, should also be recognised where appropriate. A short reflection on what students learned would be more useful than simply counting hours.

In conclusion, community service has clear educational benefits, but a uniform requirement may create unnecessary difficulties. Giving every student access to meaningful projects, while respecting different circumstances, is likely to encourage more thoughtful participation.`,
  },
  {
    slug: "ielts-speaking-place", title: "Speaking Part 2 · A place to learn", skill: "Speaking", minutes: 3, minWords: 0,
    prompt: "Describe a place where you enjoy learning something new. You should say: where it is; what you learn there; who you usually go with; and explain why this place helps you learn. Take one minute to prepare, then speak for one to two minutes. Follow-up: Has the way you use this place changed over time?",
    table: null,
    tips: "Бүтэн өгүүлбэрээр цээжлэхийн оронд 4–5 түлхүүр үг тэмдэглэ. Өөрийн утасны цагийг ашиглан чангаар ярь. Доорх талбарт төлөвлөгөө эсвэл ярьсан хариуныхаа буулгалтыг бичиж болно. Энэ хуудас дуу бичихгүй.",
    checklist: ["Картын бүх санааг хамарсан", "Тодорхой жишээ, хувийн туршлага оруулсан", "Нэгээс хоёр минутын турш санаагаа үргэлжлүүлсэн", "Холбоос, үйл үгийн цагуудаа тохируулсан", "Дуудлага, өргөлтөө чангаар ярьж шалгасан"],
    model: `A place I really enjoy learning in is a small public library near my home. It is about ten minutes away on foot, and I usually go there on Saturday mornings. I often go with a friend, although we normally work on different things once we arrive.

Recently, I have been using the library to learn basic photography. There is a shelf of practical guides, and I can compare the explanations in several books before trying a technique myself. For instance, last month I read about how the direction of light changes a portrait. After reading, my friend and I went outside and took photographs in different places around the building.

What makes the library useful is the balance between quiet study and practical exploration. At home, I am easily distracted by messages and household tasks. In the library, I find it easier to concentrate on one idea for a while. I also like being able to ask a librarian to suggest another book when an explanation is unclear.

Over time, I have become less dependent on following every instruction exactly. I now use the books as a starting point and experiment with my own ideas. So the library has helped me develop confidence as well as a new skill.`,
  },
  {
    slug: "ielts-speaking-discussion", title: "Speaking Parts 1 & 3 · Study and technology", skill: "Speaking", minutes: 10, minWords: 0,
    prompt: "Part 1: What do you study? Which subject do you enjoy most, and why? Do you prefer studying alone or with others?\n\nPart 3: How has technology changed the way people learn? What are the disadvantages of relying on online lessons? Should schools teach students how to judge information on the internet? Why?\n\nAnswer each question aloud. Give short personal answers in Part 1, then develop reasons, examples and qualifications in Part 3.",
    table: null,
    tips: "Part 1-д өөрийн туршлагаас шууд хариул. Part 3-д ерөнхий асуудлын талаар бодол → шалтгаан → жишээ → хязгаар гэсэн холбоо гарга. Жишиг хариуны үгийг цээжлэх шаардлагагүй.",
    checklist: ["Бүх асуултад шууд хариулсан", "Part 1-д хувийн жишээ оруулсан", "Part 3-д шалтгаан, жишээгээр санаагаа хөгжүүлсэн", "Давуу болон сул талыг ялгаж тайлбарласан", "Өөрийн үгээр, ойлгомжтой хэмнэлээр чангаар ярьсан"],
    model: `Part 1 — I study several subjects at school, but I especially enjoy physics. I like being able to connect an equation with something I can observe, such as the movement of a bicycle. I usually start studying alone so I can identify what I do not understand, and then discuss difficult questions with a friend.

Part 3 — Technology has made learning more flexible. Someone who cannot attend a class at a fixed time can watch a recorded explanation later. Videos can also make an abstract process easier to visualise. For example, an animation may help students follow how an electric circuit works.

However, online lessons do not automatically produce understanding. Students may watch passively without checking whether they can solve a problem themselves. Access is another concern: a reliable connection and a quiet place to study are not available to everyone. Online material is therefore most useful when it is combined with practice and opportunities to ask questions.

Schools should teach students to judge information because finding a page is easier than deciding whether it is trustworthy. Students can learn to check who produced a claim, what evidence supports it and whether other reliable sources agree. These habits are useful well beyond school.`,
  },
];
