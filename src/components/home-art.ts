type HomeArtwork = Record<"studyHero" | "stemCover" | "languageCover" | "japaneseCover" | "eeshCover" | "hskCover" | "workshopCover", { src: string; alt: string }>;
type HomeArtStyle = "handdrawn" | "editorial";

// Switch to "editorial" to restore all previous homepage images. Both sets stay on disk.
export const HOME_ART_STYLE: HomeArtStyle = "editorial";

const artworkSets: Record<HomeArtStyle, HomeArtwork> = {
  handdrawn: {
    studyHero: { src: "/home/study-hero-handdrawn.webp", alt: "Ном, харандаа, уулс болон зорилгод хүрэх замын гар зургийн хэв маягтай бүтээл" },
    stemCover: { src: "/home/stem-cover-handdrawn.webp", alt: "График дэвтэр, геометрийн дүрс, шугамын усан будаг, харандааны хэв маягтай зураг" },
    languageCover: { src: "/home/language-cover-handdrawn.webp", alt: "Нээлттэй дэвтэр, үзэг, чихэвч, ярианы бөмбөлгийн гар зургийн хэв маягтай бүтээл" },
    japaneseCover: { src: "/home/japanese-cover-handdrawn.webp", alt: "Тории хаалга, сакура, дэвүүр, дэвтрийн усан будаг, харандааны хэв маягтай зураг" },
    // The hand-drawn set has no ЭЕШ, HSK or Workshop pictures; it reuses its closest ones.
    eeshCover: { src: "/home/study-hero-handdrawn.webp", alt: "Ном, харандаа, уулс болон зорилгод хүрэх замын гар зургийн хэв маягтай бүтээл" },
    hskCover: { src: "/home/language-cover-handdrawn.webp", alt: "Нээлттэй дэвтэр, үзэг, чихэвч, ярианы бөмбөлгийн гар зургийн хэв маягтай бүтээл" },
    workshopCover: { src: "/home/language-cover-handdrawn.webp", alt: "Нээлттэй дэвтэр, үзэг, чихэвч, ярианы бөмбөлгийн гар зургийн хэв маягтай бүтээл" },
  },
  editorial: {
    studyHero: { src: "/home/study-hero.webp", alt: "Номын санд хамтдаа бэлдэж буй хоёр оюутан" },
    stemCover: { src: "/home/stem-cover.webp", alt: "Геометрийн дүрс, график дэвтэр бүхий математикийн бүтээл" },
    languageCover: { src: "/home/language-cover.webp", alt: "Чихэвчтэй оюутан англи хэлээ бэлдэж байна" },
    japaneseCover: { src: "/home/japanese-cover.webp", alt: "Япон хэлний бэлтгэлийг илэрхийлэх цаасан дэвүүр, сакура, тории хаалга" },
    eeshCover: { src: "/home/eesh-cover.webp", alt: "Улаанбаатарын орон сууцны цонхны дэргэд элсэлтийн шалгалтдаа бэлдэж буй ахлах ангийн сурагч" },
    hskCover: { src: "/home/hsk-cover.webp", alt: "Бийр, бэх, цаасан дэнлүү, ногоон цайны аяга бүхий хятад хэлний бэлтгэлийн бүтээл" },
    workshopCover: { src: "/home/workshop-cover.webp", alt: "Микрофонтой чихэвч зүүсэн оюутан зөөврийн компьютерын өмнө англиар ярьж байна" },
  },
};

export const homeArtwork = artworkSets[HOME_ART_STYLE];
