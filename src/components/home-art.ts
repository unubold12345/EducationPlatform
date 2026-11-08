type HomeArtwork = Record<"studyHero" | "stemCover" | "languageCover" | "japaneseCover", { src: string; alt: string }>;
type HomeArtStyle = "handdrawn" | "editorial";

// Switch to "editorial" to restore all previous homepage images. Both sets stay on disk.
export const HOME_ART_STYLE: HomeArtStyle = "editorial";

const artworkSets: Record<HomeArtStyle, HomeArtwork> = {
  handdrawn: {
    studyHero: { src: "/home/study-hero-handdrawn.webp", alt: "Ном, харандаа, уулс болон зорилгод хүрэх замын гар зургийн хэв маягтай бүтээл" },
    stemCover: { src: "/home/stem-cover-handdrawn.webp", alt: "График дэвтэр, геометрийн дүрс, шугамын усан будаг, харандааны хэв маягтай зураг" },
    languageCover: { src: "/home/language-cover-handdrawn.webp", alt: "Нээлттэй дэвтэр, үзэг, чихэвч, ярианы бөмбөлгийн гар зургийн хэв маягтай бүтээл" },
    japaneseCover: { src: "/home/japanese-cover-handdrawn.webp", alt: "Тории хаалга, сакура, дэвүүр, дэвтрийн усан будаг, харандааны хэв маягтай зураг" },
  },
  editorial: {
    studyHero: { src: "/home/study-hero.webp", alt: "Номын санд хамтдаа бэлдэж буй хоёр оюутан" },
    stemCover: { src: "/home/stem-cover.webp", alt: "Геометрийн дүрс, график дэвтэр бүхий математикийн бүтээл" },
    languageCover: { src: "/home/language-cover.webp", alt: "Чихэвчтэй оюутан англи хэлээ бэлдэж байна" },
    japaneseCover: { src: "/home/japanese-cover.webp", alt: "Япон хэлний бэлтгэлийг илэрхийлэх цаасан дэвүүр, сакура, тории хаалга" },
  },
};

export const homeArtwork = artworkSets[HOME_ART_STYLE];
