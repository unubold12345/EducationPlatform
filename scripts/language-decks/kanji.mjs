// Source kanji lists for the JLPT N5 and N4 kanji decks (Workshop → JLPT). Kanji only: on/kun readings, Mongolian
// meanings and example words are drafted by scripts/build-language-decks.mjs and kept for teacher review in
// MockExmps/Decks/jlpt-kanji-<level>.json. Example words come from the N5/N4 word decks first.
//
// JLPT has published no kanji list since 2010. These are author-selected from the common study lists (about 100 for N5,
// about 175 more for N4; 2026-11-19), grouped by topic. N4 never repeats an N5 kanji; an N4 learner studies both decks.

const split = text => text.trim().split(/\s+/);

export const KANJI_DECKS = [
  {
    id: "jlpt-kanji-n5", level: "N5", title: "JLPT N5 ханз",
    lessons: [
      ["Тоо, мөнгө", "一 二 三 四 五 六 七 八 九 十 百 千 万 円"],
      ["Гараг", "日 月 火 水 木 金 土 曜"],
      ["Цаг хугацаа", "年 時 分 半 今 毎 週 午 前 後 何"],
      ["Хүн, бие", "人 男 女 子 父 母 友 名 目 口 耳 手 足"],
      ["Байрлал, чиглэл", "上 下 中 外 右 左 東 西 南 北 間"],
      ["Байгаль", "山 川 天 気 雨 花 空 魚"],
      ["Тэмдэг нэр", "大 小 高 安 新 古 長 白 多 少"],
      ["Үйл үг", "行 来 見 食 飲 聞 読 書 話 言 買 休 出 入 立 会"],
      ["Сургууль, хот", "学 校 生 先 本 語 国 店 駅 道 社 電 車"],
    ],
  },
  {
    id: "jlpt-kanji-n4", level: "N4", title: "JLPT N4 ханз",
    lessons: [
      ["Гэр бүл, хүмүүс", "兄 弟 姉 妹 家 族 親 私 自 主 者 員"],
      ["Бие, эрүүл мэнд", "体 頭 顔 心 力 病 医 院 死 元"],
      ["Хот, газар", "町 村 市 区 京 世 界 地 図 場 所 公 館 室 屋 堂 階"],
      ["Тээвэр, аялал", "歩 走 止 乗 降 飛 動 運 転 旅 送 通 急 着 発"],
      ["Өдөр тутмын үйл үг", "起 寝 開 閉 待 持 作 使 始 終 借 貸 引"],
      ["Сурах, бодох", "思 知 考 答 教 習 勉 強 研 究 説"],
      ["Үйл үг 2", "売 洗 歌 映 写 集 帰 返 住 働 切 注 建"],
      ["Сургууль, хэл", "文 字 問 題 質 試 験 英 漢 意 味 音 楽 画 紙"],
      ["Ажил, бараа", "仕 事 業 工 品 物 料 理 代 銀 計 台"],
      ["Хоол, хувцас, амьтан", "肉 牛 鳥 茶 飯 犬 服 洋"],
      ["Байгаль, улирал", "春 夏 秋 冬 風 海 田 野"],
      ["Цаг хугацаа", "朝 昼 晩 夜 夕 昨 早 去 度 以"],
      ["Өнгө, тэмдэг нэр", "赤 青 黒 色 明 暗 重 軽 近 遠 広 弱 冷 好 悪 便 利"],
      ["Хийсвэр үг", "同 方 不 無 有 正 真 特 別 用 合 番 部"],
    ],
  },
].map(deck => ({ ...deck, lessons: deck.lessons.map(([title, kanji], index) => ({ id: "k" + (index + 1), title, terms: split(kanji) })) }));
