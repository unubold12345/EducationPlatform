"""JLPT N4 — free half mock (jlpt-n4-free).

Vocabulary 14 items / 13 min, grammar and reading 15 / 27 min, listening 14 / 18 min: 43 items in 58 minutes
(the full form is 85 items in 115 minutes). Every group type of the N4 paper appears at least once.
"""

from __future__ import annotations

from jlpt_common import JlptMock

SLUG = "jlpt-n4-free"


def build(program_dir):
    m = JlptMock(SLUG, "N4-FREE", {"V": 13, "G": 27, "L": 18})
    w = m.written

    m.group("V", "kanji-reading")
    w("V", "この 【地図】を 見て ください。", ["じず", "ちず", "ちと", "ちづ"], 2, "地図 (map) is read ちず.")
    w("V", "【去年】 日本へ 行きました。", ["きょうねん", "こねん", "きょねん", "さるとし"], 3, "去年 (last year) is read きょねん, with a short きょ.")
    w("V", "つぎの 駅で 【急行】に 乗りかえて ください。", ["きゅうこう", "きゅこう", "きょうこう", "いそぎこう"], 1, "急行 (express train) is read きゅうこう.")
    w("V", "くだものの 中で 【特に】 りんごが 好きです。", ["ときに", "どくに", "とっくに", "とくに"], 4, "特に (especially) is read とくに.")

    m.group("V", "orthography")
    w("V", "あの 【はいしゃ】は とても やさしいです。", ["葉医者", "歯医者", "歯医社", "歯病者"], 2, "はいしゃ (dentist) is 歯 (tooth) + 医者 (doctor).")
    w("V", "来週 【しけん】が あります。", ["試験", "試検", "式験", "誠験"], 1, "しけん (examination) is written 試験.")
    w("V", "この 道を まっすぐ 【すすんで】 ください。", ["運んで", "送んで", "進んで", "道んで"], 3, "すすむ (to go forward) is written 進む; 運ぶ is はこぶ (carry).")

    m.group("V", "context")
    w("V", "大事な 書類なので、（　） なくさないで ください。", ["なかなか", "ぜったいに", "ちっとも", "そろそろ"], 2, "ぜったいに ～ないで means never, under any circumstances.")
    w("V", "雨が 降りそうなので、せんたくものを 外に （　）のを やめました。", ["ひろう", "あずける", "ならべる", "ほす"], 4, "Laundry is hung out to dry: ほす.")
    w("V", "かぜを ひいたので、きょうは 学校を （　）。", ["休みました", "止めました", "終わりました", "遅れました"], 1, "学校を 休む means to stay away from school. 遅れる takes に (学校に 遅れる).")

    m.group("V", "paraphrase")
    w("V", "【この 店は いつも すいて います】。", ["この 店は いつも 人が 多いです。", "この 店は いつも 人が 少ないです。", "この 店は いつも 安いです。", "この 店は いつも しずかじゃ ありません。"], 2,
      "すいて いる (not crowded) means there are few people.")
    w("V", "【けさ ねぼうしました】。", ["けさ 早く 起きました。", "けさ よく ねられませんでした。", "けさ 起きるのが おそく なりました。", "けさ 朝ごはんを 食べませんでした。"], 3,
      "ねぼうする means to oversleep, to get up later than planned.")

    m.group("V", "usage")
    w("V", "ふくざつ", ["この 問題は ふくざつで、なかなか わかりません。", "きょうは ふくざつな 天気で、あたたかいです。", "この 道は ふくざつに まっすぐです。", "かれは ふくざつな 声で 歌いました。"], 1,
      "ふくざつ (complicated) describes a problem that is hard to understand.")
    w("V", "わたす", ["毎朝 犬と こうえんを わたします。", "この 手紙を 先生に わたして ください。", "電車が 駅に わたしました。", "かぜが つよく わたして います。"], 2,
      "わたす means to hand something to someone.")

    m.group("G", "grammar-form")
    w("G", "ゆうべは つかれて いた（　）、早く ねました。", ["のに", "ので", "けど", "ても"], 2, "ので gives the reason: I was tired, so I went to bed early.")
    w("G", "いっしょうけんめい 勉強した（　）、試験に 落ちて しまいました。", ["ので", "から", "のに", "ために"], 3, "のに marks an unexpected result: despite studying hard, I failed.")
    w("G", "先生に 作文を （　）、とても うれしかったです。", ["ほめさせて", "ほめて", "ほめたら", "ほめられて"], 4, "The writer was praised by the teacher: passive ほめられる.")
    w("G", "まどが （　） いますね。だれが 開けたんでしょう。", ["開いて", "開けて", "開き", "開く"], 1, "With が, the intransitive 開く describes the state: まどが 開いて いる.")
    w("G", "（ケーキを 見て）わあ、この ケーキ、（　）ですね。", ["おいしそう", "おいしいそう", "おいしいよう", "おいしかったそう"], 1,
      "Judging by appearance uses the stem + そう: おいしそう. おいしいそう reports what someone else said.")
    w("G", "毎日 練習したので、日本語で 電話が （　）ように なりました。", ["かける", "かけて", "かけられる", "かけた"], 3,
      "電話が needs the potential form: 電話が かけられるように なった (became able to make calls).")

    m.group("G", "sentence-order")
    w("G", "これは ____  ____  ★  ____ です。", ["セーター", "作って", "くれた", "母が"], 3,
      "これは 母が 作って くれた セーター です。The third blank is くれた.")
    w("G", "雨が ____  ____  ★  ____ 行きます。", ["練習", "に", "サッカーの", "降っても"], 1,
      "雨が 降っても サッカーの 練習 に 行きます。The third blank is 練習.")

    passage = ("先月、わたしは 初めて 一人で 旅行を しました。前から 京都へ 行って みたかった【1】、思い切って 新幹線の きっぷを 買いました。"
               "京都では 古い お寺を たくさん 見ました。道が わからなくて 困って いた とき、知らない おばあさんが 駅まで【2】。とても 親切で、うれしかったです。"
               "【3】 また 一人で どこかへ 行きたいと 思って います。")
    m.group("G", "text-grammar")
    w("G", "【1】", ["のに", "ので", "のは", "でも"], 2, "Having long wanted to go is the reason for buying the ticket: ので.", passage=passage)
    w("G", "【2】", ["連れて 行って あげました", "連れて 行って もらいました", "連れて 行かれました", "連れて 行って くれました"], 4,
      "The old woman did a favour for the writer: ～て くれました.", passage=passage)
    w("G", "【3】", ["それに", "ところで", "今度", "けれども"], 3, "今度 また (next time, again) fits the wish for another trip.", passage=passage)

    m.group("G", "short-reading")
    w("G", "この お知らせを 読んだ 人は 何を しなければ なりませんか。",
      ["重い 荷物は 10時より 前か 2時より 後に 運ぶ。", "月曜日に 管理室へ 行く。", "10時から 2時まで 家に いる。", "エレベーターを 直す 手伝いを する。"], 1,
      "The lift cannot be used from 10:00 to 14:00, so heavy items must be moved before or after.",
      passage="（お知らせ）\n来週の 月曜日、エレベーターを 直します。午前10時から 午後2時まで エレベーターは 使えません。"
              "重い 荷物が ある 方は、その 前か 後に 運んで ください。よろしく お願いします。\n管理室")

    reading = ("わたしの しゅみは 料理です。子どもの ころは 料理が 全然 できませんでしたが、大学生に なって 一人で 住み始めてから、自分で 作るように なりました。"
               "初めは 失敗ばかりで、カレーを こがして しまった ことも あります。でも、インターネットで 作り方を 調べたり、母に 電話で 聞いたり して、少しずつ 上手に なりました。"
               "今では 週末に 友だちを 家に 呼んで、料理を 作って あげる ことも あります。友だちが「おいしい」と 言って くれると、とても うれしいです。"
               "来年は 料理教室に 通って、パンの 作り方を 習う つもりです。")
    m.group("G", "medium-reading")
    w("G", "この 人は いつから 料理を するように なりましたか。", ["子どもの ころから", "一人で 住み始めてから", "料理教室に 通ってから", "友だちに 習ってから"], 2,
      "一人で 住み始めてから、自分で 作るように なりました.", passage=reading)
    w("G", "この 人が 来年 したい ことは 何ですか。", ["カレーの 作り方を 調べる こと", "友だちを 家に 呼ぶ こと", "母に 料理を 教える こと", "パンの 作り方を 習う こと"], 4,
      "来年は 料理教室に 通って、パンの 作り方を 習う つもりです.", passage=reading)

    m.group("G", "information-retrieval")
    w("G", "リーさんは 週末に 教室に 入りたいです。週末の 教室で、いちばん 安いのは どれですか。", ["水泳教室", "テニス教室", "ヨガ教室", "ダンス教室"], 4,
      "Weekend classes are tennis (Saturday, 5,000 yen) and dance (Sunday, 4,500 yen); dance is cheaper.",
      passage="さくら市 スポーツセンター　教室の 案内\n・水泳教室：火・木 18:00〜19:00　1か月 4,000円\n・テニス教室：土 10:00〜12:00　1か月 5,000円\n"
              "・ヨガ教室：月・水 19:30〜20:30　1か月 3,500円\n・ダンス教室：日 14:00〜15:30　1か月 4,500円")

    m.group("L", "task-comprehension")
    m.heard(["資料の 数字を 直す", "資料を コピーする", "会議に 出る", "女の人に 資料を わたす"], 1,
            "ナレーター：会社で 女の人と 男の人が 話しています。男の人は このあと まず 何を しますか。\n"
            "女：田中さん、あしたの 会議の 資料、もう コピーしましたか。\n男：いいえ、まだです。今から します。\n"
            "女：あ、その 前に、3ページ目の 数字が 違って いるので、直して ください。コピーは その あとで いいです。\n男：わかりました。\n"
            "男の人は このあと まず 何を しますか。",
            "The woman asks him to correct the figures before copying.")
    m.heard(["発表の 資料を 作る", "発表の テーマを 送る", "本を 読む", "先生に 電話する"], 2,
            "ナレーター：学校で 先生が 話しています。学生は あしたまでに 何を しなければ なりませんか。\n"
            "男：来週の 発表の テーマは、あしたまでに メールで 送って ください。発表の 資料は 来週の 月曜日までで いいです。それから、本を 読む 宿題は 今週は ありません。\n"
            "学生は あしたまでに 何を しなければ なりませんか。",
            "Only the topic is due tomorrow; the slides are due next Monday and there is no reading this week.")
    m.heard(["2時", "2時半", "1時", "12時"], 3,
            "ナレーター：男の人と 女の人が 話しています。二人は 何時に 会いますか。\n男：あしたの 映画、何時からでしたっけ。\n女：2時半からです。\n"
            "男：じゃあ、2時に 映画館の 前で 会いましょうか。\n女：始まる 前に 昼ごはんを 食べたいので、もう 少し 早く 会いませんか。1時は どうですか。\n男：いいですよ。\n"
            "二人は 何時に 会いますか。",
            "They change the meeting from 2:00 to 1:00 so they can have lunch first.")
    m.heard(["スカーフ", "かばん", "くつ", "かさ"], 4,
            "ナレーター：店で 女の人と 店の人が 話しています。女の人は 何を 買いますか。\n女：すみません、母の 誕生日の プレゼントを さがして いるんですが。\n"
            "男：こちらの スカーフは いかがですか。人気が ありますよ。\n女：きれいですね。でも、母は スカーフを あまり しないんです。\n"
            "男：では、こちらの かさは どうですか。軽くて 使いやすいですよ。\n女：あ、いいですね。母は よく 散歩するので、それに します。\n女の人は 何を 買いますか。",
            "Her mother rarely wears scarves; she chooses the light umbrella.")

    m.group("L", "key-points")
    m.heard(["駅から 遠いから", "姉と いっしょに 住むから", "家賃が 高いから", "会社が 変わったから"], 2,
            "女の人は どうして 引っ越しを しますか。\n男：引っ越すそうですね。今の アパート、駅から 近くて 便利なのに、どうしてですか。\n"
            "女：ええ、便利なんですが、来月 姉が いっしょに 住むことに なったので、もっと 広い 部屋が 必要なんです。\n男：そうですか。\n"
            "女の人は どうして 引っ越しを しますか。",
            "Her sister is moving in, so she needs a bigger flat. The current flat is near the station.")
    m.heard(["山に 登った", "家に いた", "美術館へ 行った", "台風を 見に 行った"], 3,
            "男の人は 週末 何を しましたか。\n女：週末は どこかへ 出かけましたか。\n男：山に 登る 予定だったんですが、台風が 来たので、やめました。\n"
            "女：じゃあ、家に いたんですか。\n男：いいえ、友だちと 美術館へ 行きました。\n男の人は 週末 何を しましたか。",
            "The climb was cancelled because of the typhoon; he went to an art museum with a friend.")
    m.heard(["朝 早く 起きること", "仕事の 内容", "会社の 人", "仕事が 多いこと"], 1,
            "女の人は 何が いちばん 大変だと 言って いますか。\n男：新しい 仕事は どうですか。\n"
            "女：仕事の 内容は おもしろいです。でも、会社が 遠いので、毎朝 6時に 起きなければ ならないのが 大変です。\n男：そうですか。\n"
            "女の人は 何が いちばん 大変だと 言って いますか。",
            "The work itself is interesting; getting up at six is the hard part.")
    m.heard(["飛行機", "バス", "車", "新幹線"], 4,
            "男の人は 何で 旅行に 行きますか。\n女：来週の 旅行、飛行機で 行くんですか。\n男：最初は そう 思って いましたが、高かったので、新幹線に しました。\n"
            "女：バスも 安いですよ。\n男：バスは 時間が かかるので…。\n男の人は 何で 旅行に 行きますか。",
            "The plane was too expensive and the bus too slow, so he chose the bullet train.")

    m.group("L", "verbal-expressions")
    m.heard(None, 2, "ナレーター：先生の 部屋に 入ります。何と 言いますか。\n1。失礼しました。\n2。失礼します。\n3。お先に どうぞ。",
            "失礼します is said when entering a teacher's room; 失礼しました when leaving.", prompt="先生の 部屋に 入ります。何と 言いますか。")
    m.heard(None, 3, "ナレーター：友だちの 本を 借りたいです。何と 言いますか。\n1。この 本、貸して あげようか。\n2。この 本、借りて くれる？\n3。この 本、借りても いい？",
            "～ても いい？ asks permission to borrow. 貸して あげようか offers to lend.", prompt="友だちの 本を 借りたいです。何と 言いますか。")

    m.group("L", "quick-response")
    m.heard(None, 1, "女：お先に 失礼します。\n1。お疲れさまでした。\n2。いただきます。\n3。おかげさまで。",
            "A colleague leaving work first is answered with お疲れさまでした.")
    m.heard(None, 2, "男：窓を 開けても いいですか。\n1。はい、開けて いました。\n2。ええ、どうぞ。\n3。いいえ、開けませんでした。",
            "A request for permission is answered with ええ、どうぞ.")
    m.heard(None, 1, "女：あした、ちょっと 手伝って もらえませんか。\n1。ええ、いいですよ。何時ごろですか。\n2。はい、手伝って もらいました。\n3。いいえ、手伝いませんでした。",
            "A request about tomorrow is accepted, and a natural follow-up question is asked.")
    m.heard(None, 3, "男：この 料理、だれが 作ったんですか。\n1。はい、作りました。\n2。おいしそうですね。\n3。母が 作りました。",
            "だれ asks who, so the answer names a person.")
    return m.build("N4", "JLPT N4 · Free Half Mock", "Үнэгүй хагас mock · Ажил, сургууль, аялал, өдөр тутмын амьдрал"), None
