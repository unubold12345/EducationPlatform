"""JLPT N5 — free half mock (jlpt-n5-free).

Vocabulary 12 items / 10 min, grammar and reading 11 / 20 min, listening 11 / 15 min: 34 items in 45 minutes
(the full form is 67 items in 90 minutes). Every group type of the N5 paper appears at least once.
"""

from __future__ import annotations

from jlpt_common import JlptMock

SLUG = "jlpt-n5-free"


def build(program_dir):
    m = JlptMock(SLUG, "N5-FREE", {"V": 10, "G": 20, "L": 15})
    w = m.written

    m.group("V", "kanji-reading")
    w("V", "まいあさ 【六時】に おきます。", ["ろくじ", "ろっじ", "むじ", "ろくし"], 1, "六時 is read ろくじ: 六 (ろく) + 時 (じ).")
    w("V", "この 【川】は きれいです。", ["やま", "かわ", "うみ", "いけ"], 2, "川 means river and is read かわ.")
    w("V", "【先週】 ともだちと えいがを みました。", ["ぜんしゅう", "せんしゅ", "せんしょう", "せんしゅう"], 4, "先週 (last week) is read せんしゅう, with a long しゅう.")
    w("V", "つぎの かどを 【右】に まがって ください。", ["ひだり", "うえ", "みぎ", "した"], 3, "右 is みぎ (right); 左 would be ひだり.")

    m.group("V", "orthography")
    w("V", "【でんしゃ】で がっこうへ いきます。", ["電事", "電車", "雷車", "電者"], 2, "でんしゃ (train) is written 電車.")
    w("V", "【やすみ】の ひは なにを しますか。", ["体み", "本み", "木み", "休み"], 4, "やすみ is written 休み: a person (亻) resting by a tree (木). 体 is からだ.")
    w("V", "ここに 【なまえ】を かいて ください。", ["名前", "名先", "各前", "名方"], 1, "なまえ (name) is written 名前.")

    m.group("V", "context")
    w("V", "のどが かわきましたから、（　）を のみます。", ["くつ", "みず", "ほん", "かぎ"], 2, "Being thirsty, you drink water (みず).")
    w("V", "きのうは あめでしたが、きょうは （　）です。", ["さかな", "つくえ", "はれ", "ゆうびん"], 3, "が contrasts yesterday's rain with today's fine weather (はれ).")
    w("V", "この シャツは ちいさいですから、もっと （　） シャツを ください。", ["ひくい", "ふるい", "くらい", "おおきい"], 4, "The shirt is too small, so the customer wants a bigger (おおきい) one.")

    m.group("V", "paraphrase")
    w("V", "【あには がっこうの せんせいです】。", ["あには がっこうで おしえて います。", "あには がっこうで ならって います。", "あには がっこうに すんで います。", "あには がっこうを やすんで います。"], 1,
      "A teacher teaches (おしえる) at a school; ならう means to learn.")
    w("V", "【へやが くらいです】。", ["へやが ひろくないです。", "へやが しずかです。", "へやが あかるくないです。", "へやが さむいです。"], 3,
      "くらい (dark) means the same as あかるくない (not bright).")

    m.group("G", "grammar-form")
    w("G", "えき（　） バスに のります。", ["を", "で", "が", "と"], 2, "で marks the place where an action happens: you board the bus at the station.")
    w("G", "A「この りんごは （　）ですか。」 B「ひとつ １００えんです。」", ["いくら", "どこ", "だれ", "いつ"], 1, "The answer is a price, so the question word is いくら (how much).")
    w("G", "ごはんを たべた （　）、はを みがきます。", ["まえに", "ても", "ながら", "あとで"], 4, "た-form + あとで means after doing. まえに follows the dictionary form (たべる まえに).")
    w("G", "A「いっしょに おちゃを のみませんか。」 B「ええ、（　）。」", ["のみません", "のみました", "のみましょう", "のんで います"], 3, "ええ accepts the invitation, so B answers with ～ましょう (let's).")

    m.group("G", "sentence-order")
    w("G", "これは ____  ____  ★  ____ です。", ["デパートで", "かった", "きのう", "かさ"], 2,
      "これは きのう デパートで かった かさです。かった describes かさ, so it comes just before it; the third blank is かった in either order of きのう and デパートで.")
    w("G", "____  ____  ★  ____ わたしの あねです。", ["ひとは", "あそこで", "ほんを", "よんで いる"], 4,
      "あそこで ほんを よんで いる ひとは わたしの あねです。The third blank is よんで いる.")

    passage = ("わたしは まいしゅう どようびに プールへ いきます。プールは うちから とおいですから、バス【1】 いきます。"
               "きのうも いきましたが、ひとが おおくて、あまり およげませんでした。にちようびの あさは ひとが すくないです。【2】、らいしゅうは にちようびの あさ いきたいです。")
    m.group("G", "text-grammar", "文を 読んで、【1】と【2】に 入る ものを えらんでください。")
    w("G", "【1】", ["に", "で", "を", "と"], 2, "で marks the means of transport: バスで いきます.", passage=passage)
    w("G", "【2】", ["ですから", "でも", "それから", "そして"], 1, "Sunday mornings are quiet, and that is the reason for going then, so ですから (therefore). でも would set up a contrast.", passage=passage)

    m.group("G", "short-reading")
    w("G", "ジョンさんは あした どう しますか。",
      ["６じに のみものを もって さとうさんの うちへ いきます。", "５じに さとうさんの うちへ いきます。", "たべものを つくって もって いきます。", "のみものと たべものを かって いきます。"], 1,
      "The party moved from five to six o'clock at Sato's home. John brings drinks; Sato cooks the food.",
      passage="ジョンさんへ\nあしたの パーティーは ６じからです。はじめは ５じでしたが、かわりました。わたしの うちで します。のみものを かって きて ください。たべものは わたしが つくります。\nさとう")

    m.group("G", "medium-reading")
    w("G", "この ひとは しゅうまつ なにを しますか。",
      ["アルバイトを します。", "やまへ いきます。", "としょかんで しゅくだいを します。", "ともだちと ひるごはんを たべます。"], 1,
      "しゅうまつは アルバイトを します. The mountain trip is next month; homework and lunch happen on school days.",
      passage="わたしは ことしの ４がつから にほんごがっこうで べんきょうして います。がっこうは えきの まえに あります。まいにち ９じから １２じまで クラスが あります。"
              "ひるごはんは がっこうの ちかくの みせで ともだちと たべます。ごごは としょかんで しゅくだいを します。しゅうまつは アルバイトを しますから、あまり あそびません。"
              "でも、らいげつ がっこうの りょこうが あります。みんなで やまへ いきます。とても たのしみです。")

    m.group("G", "information-retrieval")
    w("G", "サラさんは どようびの あさ ９じに 本を かえしに いきたいです。どう しますか。",
      ["９じに いきます。", "１０じに いきます。", "げつようびに いきます。", "きんようびの １９じに いきます。"], 2,
      "On Saturday the library opens at 10:00. It is closed on Monday and closes at 18:00 on weekdays.",
      passage="みどり としょかん\nあいて いる じかん：かようび〜きんようび 9:00〜18:00／どようび・にちようび 10:00〜17:00\nげつようび：やすみ\n"
              "本は ２しゅうかん かりる ことが できます。いちどに ５さつまでです。")

    m.group("L", "task-comprehension")
    m.heard(["おべんとうと のみもの", "えんぴつと かみ", "おべんとうと かさ", "かみと のみもの"], 1,
            "ナレーター：がっこうで せんせいが はなしています。がくせいは あした なにを もって いきますか。\n"
            "女：あしたは こうえんで えを かきます。えんぴつと かみは わたしが もって いきます。みなさんは おべんとうと のみものを もって きて ください。あ、かさは いりません。あしたは はれですから。\n"
            "がくせいは あした なにを もって いきますか。",
            "The teacher brings pencils and paper; no umbrella is needed. Students bring lunch and a drink.")
    m.heard(["えきの まえ", "きっさてんの なか", "きっさてんの まえ", "えきの なか"], 2,
            "ナレーター：おとこのひとと おんなのひとが はなしています。おとこのひとは どこで おんなのひとを まちますか。\n"
            "男：あしたは どこで あいましょうか。えきの まえは どうですか。\n女：えきの まえは ひとが おおいですから、えきの となりの きっさてんは どうですか。\n"
            "男：いいですね。じゃあ、きっさてんの なかで まって います。\nおとこのひとは どこで おんなのひとを まちますか。",
            "The station front is crowded; he will wait inside the café next to it.")
    m.heard(["くろい くつ", "８０００えんの くつ", "しろい くつ", "くつは かいません"], 3,
            "ナレーター：みせで おんなのひとと みせの ひとが はなしています。おんなのひとは どれを かいますか。\n"
            "女：すみません、この くろい くつは いくらですか。\n男：８０００えんです。\n女：ちょっと たかいですね。\n男：こちらの しろい くつは ５０００えんです。\n"
            "女：じゃあ、しろいのを ください。\nおんなのひとは どれを かいますか。",
            "The black shoes are too expensive; she buys the white ones.")

    m.group("L", "key-points")
    m.heard(["でんしゃ", "バス", "あるいて", "じてんしゃ"], 4,
            "おんなのひとは きょう なにで かいしゃへ いきますか。\n男：まいにち でんしゃで かいしゃへ いきますか。\n"
            "女：まえは でんしゃでしたが、いまは じてんしゃです。あめの ひは バスで いきます。\n男：きょうは はれですね。\n女：ええ。\n"
            "おんなのひとは きょう なにで かいしゃへ いきますか。",
            "She cycles now and takes the bus only on rainy days. Today is fine, so she cycles.")
    m.heard(["５がつ１５にち", "５がつ２５にち", "４がつ２５にち", "５がつ５か"], 2,
            "おとこのひとの たんじょうびは いつですか。\n女：たなかさんの たんじょうびは なんがつですか。\n男：５がつです。\n女：５がつの なんにちですか。\n"
            "男：１５にちです。あ、ちがいます。１５にちは あにの たんじょうびです。わたしは ２５にちです。\nおとこのひとの たんじょうびは いつですか。",
            "He corrects himself: the 15th is his brother's birthday; his is 25 May.")
    m.heard(["テニスを しました", "そうじを しました", "えいがを みました", "うちで ねました"], 3,
            "おとこのひとは きのうの ごご なにを しましたか。\n女：きのうは なにを しましたか。\n"
            "男：ごぜんは うちで そうじを しました。ごごは ともだちと テニスを したかったですが、あめでしたから、いっしょに えいがを みました。\n"
            "おとこのひとは きのうの ごご なにを しましたか。",
            "Cleaning was in the morning. Tennis was cancelled by rain, so in the afternoon they watched a film.")

    m.group("L", "verbal-expressions")
    m.heard(None, 1, "ナレーター：ともだちの うちに はいります。なんと いいますか。\n1。おじゃまします。\n2。いってきます。\n3。おかえりなさい。",
            "おじゃまします is said when entering someone else's home.", prompt="ともだちの うちに はいります。なんと いいますか。")
    m.heard(None, 2, "ナレーター：レストランで みずが ほしいです。なんと いいますか。\n1。みずを のみました。\n2。すみません、みずを ください。\n3。みずは いかがですか。",
            "～を ください asks for something. いかがですか offers it to someone else.", prompt="レストランで みずが ほしいです。なんと いいますか。")

    m.group("L", "quick-response")
    m.heard(None, 2, "男：はじめまして、キムです。\n1。どういたしまして。\n2。はじめまして、やまだです。どうぞ よろしく。\n3。いただきます。",
            "A first greeting is answered with はじめまして and your own name.")
    m.heard(None, 1, "女：その かばん、すてきですね。\n1。ありがとうございます。\n2。ごめんなさい。\n3。いいえ、ちがいます。",
            "A compliment is answered with thanks.")
    m.heard(None, 3, "男：あした いっしょに えいがを みに いきませんか。\n1。はい、みました。\n2。いいえ、いきませんでした。\n3。いいですね。いきましょう。",
            "～ませんか is an invitation about tomorrow; past-tense answers do not fit.")
    return m.build("N5", "JLPT N5 · Free Half Mock", "Үнэгүй хагас mock · Өдөр тутмын амьдрал, сургууль, дэлгүүр"), None
