from common import choices, listening, order, reading

FORMS = [
dict(theme='Community events and study plans', vocabulary=[
choices('''
ここは 【特別】な へやです。|とくべつ|とっべつ|とくへつ|どくべつ|特別 is read とくべつ.
【急行】に のりましょう。|きゅうこう|きゅこう|きゅうごう|きょうこう|急行 is read きゅうこう.
あしたの 【予定】を おしえてください。|よてい|よってい|ようてい|よでい|予定 is read よてい.
この まちの 【人口】は へっています。|じんこう|にんこう|じんぐち|ひとくち|人口 is read じんこう.
【運転】には 気をつけてください。|うんてん|うんでん|うてん|うんてい|運転 is read うんてん.
しりょうを 【集めて】います。|あつめて|あたためて|つとめて|すすめて|集める is read あつめる.
【最近】、いそがしいです。|さいきん|さいこん|ざいきん|さいぎん|最近 is read さいきん.
'''), choices('''
えきで 【おりました】。|降りました|乗りました|通りました|帰りました|おりる from a train is 降りる.
この へやは 【あんぜん】です。|安全|安金|案全|安前|あんぜん is 安全.
【かぞく】に そうだんします。|家族|家旅|家続|家属|かぞく is 家族.
【せつめい】を よく きいてください。|説明|設明|説名|設名|せつめい is 説明.
この まちの 【ぶんか】を しりたいです。|文化|文花|分化|分科|ぶんか meaning culture is 文化.
'''), choices('''
やくそくの 時間に （　）ように、早く 出ました。|おくれない|こわれない|よごれない|なくならない|Leave early to avoid being late.
あしたまでに この しごとを （　）ください。|すませて|すぎて|そだてて|こわして|すませる means to finish a task.
かぜが 強くて、ぼうしが （　）しまいました。|とんで|さいて|おれて|ひえて|A hat can be blown away in strong wind.
テストの 前に、もう一度 ノートを （　）しました。|ふくしゅう|しょうたい|にゅういん|うんてん|Review notes before a test: ふくしゅう.
電車が とまったので、バスを （　）ことに しました。|りようする|はんたいする|しっぱいする|そつぎょうする|Use the bus as alternative transport.
この 店は サービスが よく、店員も （　）です。|しんせつ|ざんねん|ふべん|きけん|Helpful staff are しんせつ.
この へやは （　）が よくて、昼は 電気が いりません。|ひあたり|かみなり|おみまい|うけつけ|Good sunlight makes electric lighting unnecessary.
さとうさんから パーティーの （　）が とどきました。|しょうたいじょう|りょうしゅうしょ|きょうかしょ|しんぶん|An invitation arrives for a party.
'''), choices('''
この もんだいは 【かんたんです】。|むずかしく ありません。|時間が かかります。|だれにも わかりません。|答えが ありません。|かんたん means easy.
会議の 時間が 【かわりました】。|会議は 前と ちがう 時間に なりました。|会議は なくなりました。|会議は おわりました。|会議は 長く なりました。|A changed time is different from the earlier time.
あの 人は 【いつも】 ここに 来ます。|あの 人は まいにちのように ここに 来ます。|あの 人は 一度だけ ここに 来ました。|あの 人は ここに 来ません。|あの 人は あした はじめて 来ます。|いつも means regularly/always.
駅まで 【むかえに 行きます】。|駅で あなたに 会って、いっしょに 帰ります。|駅で あなたを 見送ります。|駅で 一人で 電車に のります。|駅までの 道を おしえます。|むかえに行く means go to meet/pick someone up.
'''), choices('''
【予約】の つかいかたが 正しい 文を えらんでください。|旅行の 前に ホテルを 予約しました。|あしたの 天気を 予約しました。|なくした かぎを 予約しました。|日本語を ３年間 予約しました。|予約 is used for booking a hotel or service.
【準備】の つかいかたが 正しい 文を えらんでください。|出かける 準備が できました。|バスが 駅を 準備しました。|この りんごは 準備な 味です。|先生に 準備を 返しました。|準備 means preparation.
【残念】の つかいかたが 正しい 文を えらんでください。|友だちに 会えなくて 残念です。|この かばんは 残念に 入ります。|道を 残念に 曲がります。|パンを 残念で 切ります。|残念 expresses regret at an undesired outcome.
【比べる】の つかいかたが 正しい 文を えらんでください。|二つの 店の ねだんを 比べました。|ドアを 比べて 外に 出ました。|かぜを 比べて 休みました。|電車を 比べて 学校へ 行きました。|比べる means compare two prices or other comparable things.
''')], grammar=choices('''
雨が ふっている（　）、試合は あります。|のに|ためで|ようで|ことに|のに expresses the unexpected contrast.
日本へ 行った（　）が あります。|こと|もの|ところ|ほう|たことがある expresses experience.
この 本は 子ども（　） 読めます。|でも|しか|ずつ|ほど|でも expresses even children can read it.
毎日 少しずつ 漢字を おぼえる（　）しています。|ように|ことが|ためで|そうで|ようにしている expresses an ongoing deliberate effort.
先生に 作文を （　）。|ほめられました|ほめさせました|ほめてあげました|ほめておきました|The student was praised by the teacher: passive.
もうすぐ 雨が （　）そうです。空が 暗いです。|ふり|ふる|ふって|ふった|Appearance そう attaches to the verb stem.
食事を （　）あとで、薬を のんでください。|した|する|して|し|た-form + あとで marks after finishing.
ここでは くつを ぬが（　）なりません。|なければ|なくても|ないで|ないか|なければならない expresses obligation.
電気を つけた（　） ねてしまいました。|まま|ほど|ため|だけに|たまま means leaving a state unchanged.
この 料理は 作り（　）です。|やすい|やすく|やすさ|やすくて|Verb stem + やすい means easy to do.
駅に （　）ところです。今、改札の 前に います。|着いた|着いて|着き|着くの|たところです expresses having just arrived; the speaker is now at the ticket gate.
仕事が おわったら、電話して（　）か。|いただけません|さしあげません|やりません|いたしません|ていただけませんか politely requests an action.
今日は 三人（　） 来ませんでした。|しか|だけを|でもが|までを|しか with a negative means only three came.
'''), order=order('''
これは|友だちに/かりた/本を/入れる|かばんです。|友だちにかりた modifies 本; 本を入れる modifies かばん.
駅へ|行く/バスに/乗る/ために|ここで 待ちます。|駅へ行く modifies バス; バスに乗るために states the purpose.
この 漢字の|読み方を/知っている/人に/聞いて|ください。|読み方を知っている modifies 人; 人に聞く is ask a person.
きのう|買った/ばかりの/くつを/はいて|出かけました。|買ったばかりの modifies くつ; くつをはいて precedes leaving.
'''), text=reading('''来月、町の ホールで 写真展が あります。わたしの クラブも 参加する 【1】。一人 二枚ずつ 写真を 出します。わたしは 去年 山で 【2】 写真を えらびました。まだ 題名を 【3】ので、今夜 考えます。たくさんの 人に 見て 【4】です。''','''
【1】|予定です|予定でしたか|予定でください|予定をします|予定です states a scheduled future activity.
【2】|とった|とる|とって|とり|A photo taken last year needs the past relative clause.
【3】|決めていない|決めてしまった|決めてある|決めておいた|まだ and the plan to think tonight show it is undecided.
【4】|もらいたい|あげたい|くれたい|いただきました|見てもらいたい expresses wanting others to see the photos.
'''), short=[reading('''サラさん、あしたの 勉強会は いつもの 喫茶店ではなく、市民センターで します。喫茶店は 工事で 休みです。時間は ２時の ままです。センターの へやが わからなかったら、着いてから 電話してください。ユウ''','''
勉強会について 正しいのは どれですか。|場所だけが 変わりました。|時間だけが 変わりました。|場所も 時間も 変わりました。|中止に なりました。|The location changes while the two o'clock time remains.
'''),reading('''図書館からの お知らせ。今週 借りた 本は、来週の 金曜日までに 返してください。返す日が 休館日の 場合は、その 次の 開館日で かまいません。入口の 箱には CDを 入れないでください。''','''
返す日が 休館日なら、いつ 返せば いいですか。|次に 図書館が あく日|必ず その 前の日|一か月後|休館日の 朝だけ|The notice explicitly allows the next open day.
'''),reading('''昨日から 熱が あったので、今日は 会社を 休みました。朝は 食欲が ありませんでしたが、昼には おかゆを 食べられました。夕方には 熱も 下がりました。明日も 無理を しないようにと 医者に 言われました。''','''
この 人は 夕方には どう なりましたか。|熱が 下がりました。|初めて 熱が 出ました。|何も 食べられなく なりました。|会社へ 行きました。|The fever subsided by evening; no return to work is stated.
''')],medium=reading('''わたしたちの 町では、毎月 一度、使わなくなった 物を 持ちよる 会が あります。お金で 売るのではなく、ほしい 人に 無料で あげます。わたしは 先月、小さくなった 子どもの 服を 持っていきました。まだ きれいだったので、すぐに もらう 人が 決まりました。わたしは 大きな なべを もらいました。家の なべでは、家族 全員の カレーを 一度に 作れなかったからです。持ち帰る 物は 一人 三つまでで、持っていく 物が なくても 参加できます。ただし、こわれた 物や 食べ物は 受けつけていません。来月は 母と 行く つもりです。母は 使っていない お皿を 持っていきたいと 言っています。この 会で 近所の 人とも 話せるので、物を 大切に するだけでなく、友だちも できそうです。''','''
この 会では どうやって 物を 手に 入れますか。|お金を はらわずに もらいます。|必ず 自分の 物と 交換します。|いちばん 高い 金額を 言います。|会費を はらって 買います。|Items are given free; bringing an item is not compulsory.
わたしは なぜ なべを もらいましたか。|家族の 料理を 一度に 作りたかったから|家の なべが こわれたから|母に 売りたかったから|料理教室を 開くから|The existing pot was too small for the whole family's curry.
来月の 参加について 正しいのは どれですか。|母は お皿を 持っていく つもりです。|母は 食べ物を 持っていきます。|わたしは 四つ 持ち帰ります。|物が ない 人は 参加できません。|The mother plans to bring unused plates; food and four takeaways are disallowed.
'''),info=reading('''市民センター・日曜日の 教室\nA 写真：9:00〜10:30／800円／カメラ持参\nB 料理：10:00〜12:00／1,500円／エプロン持参\nC 絵：13:00〜15:00／1,000円／道具つき\nD 体操：15:30〜16:30／500円／タオル持参\nどの 教室も 前日までに 電話で 予約。二つ 以上 申し込むと 合計から 200円引き。''','''
ミナさんは 午後だけ 時間が あります。道具を 持っていません。絵を かきたいなら どれに 申し込みますか。|C|A|B|D|The afternoon art class provides its equipment.
写真と 体操を 両方 申し込むと、合計 いくらですか。|1,100円|1,300円|1,500円|900円|800 + 500 minus the two-class discount of 200 = 1,100 yen.
'''),task=listening('''
女の人は 最初に 何を しますか。|男：会場へ 行く前に、受付で 名札を もらってください。女：荷物は？ 男：名札を もらった後、となりの へやに 置けます。|受付で 名札を もらう|会場に 入る|荷物を 置く|となりの へやで 待つ|Name tag collection precedes luggage storage and entering the venue.
男の人は 何を 買いますか。|女：サンドイッチ用の パンと チーズを 買ってきて。男：ハムも？ 女：ハムは あるの。あ、パンも あった。チーズだけ お願い。|チーズだけ|パンと チーズ|ハムと チーズ|パンだけ|The final correction removes bread; only cheese remains.
女の人は どの 電車に 乗りますか。|女：３時の 急行で 間に 合いますか。男：急行は 目的の 駅に とまりません。２時50分の 普通に 乗ってください。|２時50分の 普通|３時の 急行|３時50分の 普通|２時の 急行|The ordinary train at 2:50 stops at the required station.
男の人は あした 何を 持っていきますか。|女：申込書と 写真を お願いします。男：申込書は メールで 送りました。女：届いています。では 写真だけ 持ってきてください。|写真だけ|申込書だけ|申込書と 写真|何も 持っていかない|The form has arrived electronically; the photo is still needed.
二人は どこで 会いますか。|男：いつもの 店で 会おうか。女：今日は 休みよ。駅の 北口は？ 男：工事中だよ。女：じゃ、南口の 時計の 下で。男：うん。|南口の 時計の 下|北口の 時計の 下|いつもの 店|工事の 入口|The final agreed meeting point is under the south-exit clock.
女の人は どうやって 予約を 変えますか。|女：サイトで 予約したんですが、時間を 変えたいです。男：変更は 電話だけです。女：窓口では？ 男：窓口は 新しい 予約だけです。|電話する|サイトで 変える|窓口へ 行く|メールを 送る|Changes are accepted by telephone only.
男の人は どの へやを 使いますか。|女：３階の 大きい へやは 30人からです。男：今日は 12人です。女：それなら ２階の 小さい へやが いいですね。男：お願いします。|２階の 小さい へや|３階の 大きい へや|２階の 大きい へや|３階の 小さい へや|The group of twelve is assigned the small second-floor room.
女の人は 帰る前に 何を しますか。|男：そうじは おわりましたか。女：はい。もう 帰っても？ 男：机の 上の しりょうを 棚に 入れてから お願いします。|しりょうを 棚に 入れる|机を ふく|電気を つける|そうじを 始める|She must put the documents on the shelf before leaving.
'''),points=listening('''
男の人は なぜ 引っこしますか。|女：今の アパートは 家賃が 高いんですか。男：値段は いいんですが、夜も 車の 音が うるさくて。もっと 静かな 所を さがしています。|車の 音が うるさいから|家賃が 高いから|会社から 遠いから|へやが せまいから|Noise, rather than rent, is the reason.
女の人は いつ レポートを 出しますか。|男：レポートは 金曜日までですね。女：旅行に 行くので、水曜日に 出します。木曜日は 準備を したいんです。|水曜日|木曜日|金曜日|土曜日|She plans to submit Wednesday, earlier than the deadline.
店の 新しい 開店時間は 何時ですか。|ナレーター：来月から 開店時間が ９時半に なります。今月は これまでどおり 10時です。閉店時間は ８時で 変わりません。|９時半|10時|８時|９時|The new opening time next month is 9:30.
男の人は 何を するのが 好きですか。|女：写真を とるのが 趣味ですか。男：前は そうでした。今は とった 写真を 見ながら 絵を かくのが 楽しいです。|写真を 見て 絵を かくこと|新しい カメラを 買うこと|写真展を 開くこと|旅行の 本を 読むこと|His current enjoyment is painting from photographs.
女の人は 何が 心配ですか。|男：発表の 内容は できましたか。女：はい。でも、人の 前だと 声が 小さく なってしまうんです。内容より それが 心配で。|大きな 声で 話せるか|内容が 正しいか|時間に 間に合うか|しりょうが 足りるか|She worries about voice volume in public, not content.
会費に 含まれていないものは 何ですか。|男：会費は 千円で、お茶と お菓子が つきます。昼ご飯は 各自で 用意してください。道具は 無料で かします。|昼ご飯|お茶|お菓子|道具の 使用|Participants must provide their own lunch.
女の人は どのくらい 日本に 住んでいますか。|男：日本は もう ３年ですか。女：いえ、学生として ２年、卒業してから １年半です。|３年半|３年|２年半|１年半|Two years plus one and a half years equals three and a half.
'''),utterance=listening('''
友だちが 重い 箱を 運んでいます。手伝いたいです。何と 言いますか。|ナレーター：友だちが 重い 箱を 運んでいます。手伝いたいです。|半分 持ちましょうか。|もっと 重くしてください。|自分で 持ってください。|ましょうか offers help.
先生に もう一度 説明を お願いします。何と 言いますか。|ナレーター：先生の 説明が よく わかりませんでした。|もう一度 説明していただけませんか。|もう一度 説明してあげませんか。|もう一度 説明してやりますか。|ていただけませんか politely requests the teacher's action.
友だちとの 約束に 遅れました。何と 言いますか。|ナレーター：約束の 時間より 20分 遅れて 着きました。|待たせて ごめんね。|待ってくれて ごめんね。|待たせて おめでとう。|待たせてごめん apologizes for making someone wait.
図書館で 電話している 人に 注意します。何と 言いますか。|ナレーター：図書館では 電話が 禁止されています。|ここでの 電話は やめていただけますか。|ここで 電話していただけますか。|電話を かけてあげましょうか。|Politely ask the person to stop a prohibited call.
店で 買った 服の サイズを 変えたいです。何と 言いますか。|ナレーター：買った 服が 小さすぎました。店員に 話します。|もう少し 大きいものに かえていただけますか。|もう少し 小さいものを 着ていますか。|同じ 大きさを 着てください。|Request exchanging for a larger size.
'''),quick=listening('''
（返事を えらんでください。）|女：窓を 閉めても かまいませんか。|ええ、お願いします。|ええ、閉めましたか。|ええ、窓に なります。|Agree to her request to close the window.
（返事を えらんでください。）|男：お待たせして すみません。|いいえ、今 来たところです。|いいえ、まだ 来ません。|いいえ、待たせてください。|Reassure the late arrival that you have just arrived.
（返事を えらんでください。）|女：この 書類、見ていただけますか。|ええ、ちょっと 貸してください。|ええ、見ていただきました。|ええ、見ないでください。|Accept the request and ask for the document.
（返事を えらんでください。）|男：明日の 試合、楽しみですね。|ええ、晴れると いいですね。|ええ、楽しみでは いけません。|ええ、昨日 行きましょう。|A hope for fine weather responds naturally to anticipation.
（返事を えらんでください。）|女：この バス、市役所に とまりますか。|いいえ、次の バスですよ。|いいえ、市役所でした。|いいえ、とめてあります。|Direct the passenger to the correct bus.
（返事を えらんでください。）|男：コーヒー、もう なくなったんですか。|ええ、さっき 全部 飲んでしまいました。|ええ、まだ たくさん あります。|ええ、明日 飲みました。|Explain that the coffee has all been consumed.
（返事を えらんでください。）|女：お手伝いしましょうか。|ありがとうございます。助かります。|ありがとうございます。手伝ってあげます。|ありがとうございます。手伝いませんでしたか。|Accept the offered help with appreciation.
（返事を えらんでください。）|男：この ペン、使っても いいですか。|どうぞ。そちらの 黒いのを。|どうぞ。使っても いいですか。|どうぞ。ペンに 使います。|Grant permission and identify the pen.
''')),
dict(theme='Travel, part-time work and shared facilities', vocabulary=[
choices('''
【空港】まで バスで 行きます。|くうこう|くこう|くうごう|そらこう|空港 is read くうこう.
【住所】を 書いてください。|じゅうしょ|じゅしょ|じゅうじょ|じょうしょ|住所 is read じゅうしょ.
この 店は 【有名】です。|ゆうめい|ゆめい|うめい|ゆうみょう|有名 is read ゆうめい.
【台風】が 近づいています。|たいふう|だいふう|たいふ|だいふ|台風 is read たいふう.
【工場】を 見学しました。|こうじょう|こうばあ|こうしょう|こじょう|In this compound 工場 is read こうじょう.
荷物を 【運びます】。|はこびます|えらびます|ならびます|ころびます|運ぶ is read はこぶ.
【夕方】には 帰ります。|ゆうがた|ゆがた|ゆうかた|ゆうほう|夕方 is read ゆうがた.
'''),choices('''
【じゅんび】は 終わりました。|準備|準部|順備|純備|じゅんび is 準備.
バスが 【とうちゃく】しました。|到着|当着|倒着|登着|とうちゃく is 到着.
それは 大切な 【けいけん】です。|経験|経険|軽験|径験|けいけん is 経験.
この 道は 【きけん】です。|危険|気険|危検|期験|きけん is 危険.
駅の 【ちかく】に 住んでいます。|近く|遠く|低く|若く|ちかく is 近く.
'''),choices('''
バスが 来るまで、ここで （　）いましょう。|待って|止めて|送って|落として|Wait until the bus arrives.
この シャツは 私には 大きいので、妹に （　）。|あげます|もらいます|くれます|いただきます|The speaker gives an item to someone else: あげる.
部長は 会議中です。しばらくしてから （　）電話してください。|もう一度|決して|ほとんど|ぜんぜん|Call once more after some time.
冷蔵庫が （　）ので、修理を お願いしました。|こわれた|つかれた|われた|ぬれた|An appliance breaks: こわれる.
この 仕事は （　）が なくても 応募できます。|けいけん|きおん|けしき|きせつ|A job may accept applicants without experience.
お金を はらったら、（　）を もらってください。|りょうしゅうしょ|しょうたいじょう|てんきよほう|じかんわり|A receipt is issued after payment.
駅の 前で 人が 長い （　）を 作っていました。|れつ|ねつ|こえ|あじ|People form a queue, れつ.
この きかいの 使い方を （　）ください。|おしえて|ひろって|さわって|にげて|Ask someone to explain how to use a machine.
'''),choices('''
切符は 【往復】で 買いました。|行きと 帰りの 切符を 買いました。|行きの 切符だけ 買いました。|帰りの 切符だけ 買いました。|二人分の 切符を 買いました。|往復 means a round trip.
その 話は 【本当です】。|うそでは ありません。|まだ 決まっていません。|よく わかりません。|少し 変わっています。|本当 means true.
今日は 【具合が 悪いです】。|今日は 体の 調子が よく ありません。|今日は 天気が よく ありません。|今日は 機械が 動きません。|今日は 予定が ありません。|For a person, 具合が悪い means feeling unwell.
この 道具は 【役に 立ちます】。|この 道具は 便利です。|この 道具は 重いです。|この 道具は 新しいです。|この 道具は 高いです。|役に立つ means useful.
'''),choices('''
【間に合う】の つかいかたが 正しい 文を えらんでください。|走ったので、電車に 間に合いました。|駅と 店の 間に合いました。|服の 大きさが 間に合いました。|友だちと 話を 間に合いました。|間に合う means arrive in time for a train or deadline.
【招待】の つかいかたが 正しい 文を えらんでください。|友だちを 結婚式に 招待しました。|道で 財布を 招待しました。|電気を 招待して 寝ました。|雨が 招待してきました。|招待 means invite a person to an event.
【直す】の つかいかたが 正しい 文を えらんでください。|自転車の パンクを 直しました。|ジュースを コップに 直しました。|電車を 駅で 直しました。|靴を 玄関に 直しました。|直す means repair; the other sentences misuse it for pouring, boarding, or placing.
【続ける】の つかいかたが 正しい 文を えらんでください。|毎朝の 運動を 三年間 続けています。|机の 上に 本を 続けました。|かぜを 続けて 会社を 休みました。|駅を 続けて 家へ 帰りました。|続ける means continue an activity.
''')],grammar=choices('''
宿題を して（　）、遊びに 行きます。|から|まで|より|ほど|てから establishes the sequence.
弟は 今、寝ている（　）です。静かにしてください。|ところ|ため|こと|まえ|ているところ describes an action currently in progress.
ここに 車を とめ（　）いけません。|ては|ても|たら|たり|てはいけない expresses prohibition.
この 漢字は どう（　）んですか。|読む|読み|読んで|読め|A plain verb precedes explanatory んですか.
あしたは 早く 起きる（　）が ありません。休みですから。|必要|予定で|つもりを|ことに|必要がない means no need to do something.
この 薬を のむと、ねむく（　）ことが あります。|なる|する|ある|いる|なる expresses becoming sleepy.
先生は もう （　）か。|お帰りに なりました|お帰り しました|帰らせました|帰ってあげました|お帰りになる is respectful language for a teacher's return.
あそこに 名前が 書いて（　）。|あります|います|おきます|みます|てある describes the result of intentional writing.
きのう、友だちに 写真を 見せて（　）。うれしかったです。|もらいました|あげませんでした|くれました|やりました|The speaker received the favour of being shown photos.
この 店は 安い（　）、駅からも 近いです。|し|のに|ならばに|ようを|し adds another favourable reason.
雨が ふったら、試合は 中止に（　）。|なります|します|あります|います|中止になる means be cancelled.
まだ 子ども（　）、一人で 行かせないでください。|なので|なのに|ように|そうに|なので gives the reason: because the person is still a child.
この ボタンを （　）ば、ドアが 開きます。|押せ|押す|押し|押した|押す becomes 押せば in the conditional.
'''),order=order('''
わたしは|日本へ/来た/ばかりの/学生|を 案内しました。|日本へ来たばかりの modifies 学生.
これは|母が/旅行で/使う/ために|買った かばんです。|母が旅行で使うために describes the purpose of buying.
この 機械は|ボタンを/押す/だけで/動く|ので 便利です。|ボタンを押すだけで means simply by pressing a button.
駅で|友だちに/会う/約束を/した|のを 忘れていました。|友だちに会う modifies 約束; 約束をした is made a promise.
'''),text=reading('''先月から 喫茶店で アルバイトを しています。最初は 注文を 【1】ことが よく ありました。でも、先輩が やさしく 【2】ので、今は 一人でも できます。来週から 新しい 人が 入ります。今度は わたしが 教えて 【3】と 思います。教える 前に、自分でも 仕事の やり方を 【4】つもりです。''','''
【1】|まちがえる|まちがえて|まちがえ|まちがえたら|Dictionary verb + ことがある expresses an occurrence; 最初は makes it habitual in the past.
【2】|教えてくれた|教えてあげた|教えさせた|教えておいたか|The senior kindly taught the speaker: くれた.
【3】|あげよう|もらおう|くれよう|いただこう|The speaker intends to give help to the newcomer.
【4】|確認する|確認して|確認し|確認したら|Dictionary form precedes つもり.
'''),short=[reading('''マンションの 皆さまへ。エレベーターの 点検を 火曜日の 10時から 12時まで 行います。その 間は 階段を ご利用ください。大きな 荷物を 運ぶ 予定の 方は、この 時間を 避けてください。''','''
火曜日の 11時には どう しなければ なりませんか。|階段を 使います。|エレベーターを 使います。|必ず 家に います。|荷物を 運びます。|The lift is unavailable during the inspection; stairs must be used.
'''),reading('''ミラさん、旅行の ホテルを 予約しました。駅から 少し 遠いですが、海が 見えます。朝ご飯は ついていないので、近くの 店で 食べましょう。キャンセルは 三日前まで 無料です。ケン''','''
ホテルについて 正しいのは どれですか。|朝ご飯は 自分たちで 用意します。|駅の すぐ となりです。|海は 見えません。|前日でも 無料で キャンセルできます。|Breakfast is not included, so they plan to eat at a nearby shop.
'''),reading('''明日の 面接は ３時からです。受付には 15分前までに お越しください。履歴書は すでに 受け取っていますので、持参する 必要は ありません。身分証明書を お持ちください。''','''
面接を 受ける 人は どうすれば いいですか。|２時45分までに 身分証明書を 持って 受付へ 行く|３時15分に 履歴書を 持って 行く|３時に 何も 持たずに 行く|２時45分に 履歴書だけを 持って 行く|Arrive by 2:45 with identification; the CV has already been received.
''')],medium=reading('''わたしは 去年まで、旅行の ときは 有名な 場所を たくさん 見ることが 大切だと 思っていました。朝から 夜まで 予定を 入れて、いつも 急いでいました。写真は たくさん とれましたが、帰ると とても 疲れていました。今年は 友だちと 小さな 町へ 二泊の 旅行を しました。見学する 場所は 一日に 一つだけに して、ほかの 時間は 自由に しました。二日目の 午後、雨が ふってきたので、近くの 喫茶店に 入りました。そこで 店の 人に 町の 昔の 話を 聞きました。予定には なかった 時間でしたが、今回の 旅行で いちばん 心に 残っています。もちろん 有名な 場所を 見るのも 楽しいです。でも、次の 旅行でも 予定を 入れすぎないように したいです。ゆっくりする 時間が あると、その 場所を もっと よく 知ることが できると 思うからです。''','''
去年までの 旅行は どのような ものでしたか。|たくさんの 場所を 急いで 見ていました。|一つの 店で 一日 過ごしました。|予定を 全く 決めませんでした。|写真を とりませんでした。|The narrator packed the schedule with famous sites and rushed.
今回 いちばん 心に 残ったのは 何ですか。|喫茶店で 町の 話を 聞いたこと|有名な 建物の 写真を とったこと|雨の 中を 一日 歩いたこと|友だちと 予定を 作ったこと|The unplanned conversation in the cafe was the most memorable.
次の 旅行では どうしたいですか。|自由な 時間を 残しておきたいです。|有名な 場所を 全部 やめたいです。|朝から 夜まで 予定を 入れたいです。|雨の日は 必ず 帰りたいです。|The narrator wants an unhurried schedule with free time.
'''),info=reading('''駅前レンタサイクル\n普通自転車：２時間 400円／一日 900円\n電動自転車：２時間 700円／一日 1,400円\n２時間を こえる 場合は 一日料金。営業時間 8:00〜18:00。必ず 当日の 18:00までに 返すこと。\n中学生以上が 利用できます。身分証明書が 必要です。ヘルメットは 無料。電話予約可。''','''
普通自転車を ９時から 12時まで 借りると いくらですか。|900円|400円|800円|1,400円|Three hours exceeds the two-hour tariff, so the daily 900-yen rate applies.
借りるときに 必ず 必要な ものは 何ですか。|身分証明書|自分の ヘルメット|電話予約の 番号|学生証と 写真２枚|Identification is required; helmets are supplied and reservations are optional.
'''),task=listening('''
男の人は 最初に 何を しますか。|女：コピーを 20枚 お願いします。男：この しりょうですね。女：あ、その前に、最後の ページの 日付を 直してください。|日付を 直す|20枚 コピーする|しりょうを 配る|最後の ページを 捨てる|The correction must happen before copying.
女の人は 何時に 店へ 行きますか。|女：２時に 行けば いいですか。男：その 時間は 配達で いません。３時には 戻りますが、３時半に 来てもらえますか。女：わかりました。|３時半|２時|３時|２時半|The agreed visit is 3:30, after the man's return.
男の人は 何を 返しますか。|女：借りていた 本、全部 返してください。男：一冊だけ、まだ 読み終わっていなくて。女：では、読み終わった 二冊を 先に お願いします。|読み終わった 二冊|三冊 全部|読んでいない 一冊|何も 返さない|She permits him to keep the unfinished book and return the other two.
女の人は どうやって 空港へ 行きますか。|男：電車は 台風で とまっています。女：バスは？ 男：空港行きは 動いていますよ。女：じゃ、それに します。|バス|電車|タクシー|自分の 車|Airport buses still run despite the train suspension.
男の人は どの 写真を 送りますか。|女：全員が 写っている 写真を 送って。男：海の 写真？ 女：あれは ミカさんが いないよ。山の 前の 写真なら 全員 いる。男：わかった。|山の 前の 写真|海の 写真|ミカさんだけの 写真|町の 写真|The mountain photo includes everyone.
女の人は つぎに 何を しますか。|男：申込書は 書けましたか。女：はい。お金も 今 はらいますか。男：お金は 当日です。今日は この 箱に 申込書を 入れてください。|申込書を 箱に 入れる|お金を はらう|申込書を 書き始める|当日まで 持ち帰る|Today's required action is submitting the completed form.
男の人は どこに 車を とめますか。|女：入口の 前は 配達用です。男：となりの 駐車場で いいですか。女：ええ、ただ、１番は 使えません。２番に お願いします。|となりの 駐車場の ２番|入口の 前|となりの 駐車場の １番|道の 反対側|Space 2 is assigned; space 1 and the entrance are unavailable.
女の人は だれに 電話しますか。|男：山田さんが 休みだから、会議の 変更を 伝えて。女：佐藤さんにも？ 男：佐藤さんには もう メールしたよ。山田さんだけ お願い。|山田さんだけ|佐藤さんだけ|山田さんと 佐藤さん|だれにも しない|Sato is already informed; only Yamada needs a call.
'''),points=listening('''
女の人は なぜ アルバイトを 変えたいですか。|男：今の 店は 時給が 低いんですか。女：いいえ、でも 夜 遅くまでなので、朝の 授業で 眠くなるんです。|仕事が 夜 遅くまで あるから|時給が 低いから|店が 遠いから|仕事が 難しいから|Late work interferes with morning classes.
男の人は 何曜日に 休みますか。|女：休みは 土日ですか。男：普通は そうですが、今週は 土曜に 働いて、月曜に 休みます。日曜も 休みです。|日曜と 月曜|土曜と 日曜|土曜と 月曜|月曜だけ|This week Saturday is worked, while Sunday and Monday are off.
荷物は いつ 届きますか。|女：荷物は 今日 来ますか。男：雪で 一日 遅れるそうです。あしたの 午後に なります。|あしたの 午後|今日の 午後|あしたの 午前|あさっての 午後|The one-day delay shifts delivery to tomorrow afternoon.
女の人は 旅行で 何が よかったと 言っていますか。|男：ホテルは どうでしたか。女：へやは 少し 狭かったけど、夕ご飯が とても おいしかったです。温泉は 入る 時間が なくて。|夕ご飯|へやの 広さ|温泉|ホテルまでの 道|She praises dinner, not the small room or unused hot spring.
会議は 何分 長く なりましたか。|女：会議は 一時間の 予定でしたよね。男：ええ、でも 質問が 多くて、一時間半 かかりました。|30分|15分|60分|90分|Ninety minutes minus the planned sixty equals thirty extra minutes.
男の人が 本を えらんだ 理由は 何ですか。|女：この 本、絵が きれいですね。男：ええ。でも 買ったのは、説明が 短くて わかりやすかったからです。|説明が わかりやすいから|絵だけが 多いから|値段が 安いから|先生が 書いたから|The stated reason is concise, clear explanations.
この 店で 使えるのは 何ですか。|女：カードで はらえますか。男：すみません、現金だけなんです。スマートフォンの 支払いも 使えません。|現金だけ|カードだけ|スマートフォンだけ|現金と カード|Only cash is accepted.
'''),utterance=listening('''
病院へ 予約時間を 変える 電話を します。何と 言いますか。|ナレーター：あしたの 予約を 来週に 変えたいです。|予約を 来週に 変更していただけますか。|来週の 予約を 昨日に してください。|予約は 来週に 変わっていませんか。|Ask directly for rescheduling to next week.
友だちに 借りた 本を 返すのが 遅れました。何と 言いますか。|ナレーター：返す 約束の 日を 過ぎてしまいました。|返すのが 遅くなって ごめん。|返してくれて ありがとう。|借りてあげて よかったね。|Apologize for your late return of the book.
客が 来ました。中へ 案内します。何と 言いますか。|ナレーター：会社に 来た お客さんを へやへ 案内します。|どうぞ こちらへ お入りください。|どうぞ こちらへ 出ていってください。|どうぞ 私が お入りください。|Politely invite the guest inside.
友だちの 発表を ほめます。何と 言いますか。|ナレーター：友だちは 練習して、わかりやすい 発表を しました。|とても わかりやすかったよ。|全然 聞こえなかったよ。|まだ 発表していないね。|Praise the clarity of the completed presentation.
職場で 一日 休みたいです。何と 言いますか。|ナレーター：用事が あるので 上司に 休みを お願いします。|金曜日に お休みを いただけませんか。|金曜日に お休みを あげませんか。|金曜日に 休んでいただけませんか。|Ask to receive permission for your own leave.
'''),quick=listening('''
（返事を えらんでください。）|女：駅まで 送ってくださって、ありがとうございました。|いいえ、どういたしまして。|いいえ、送ってください。|いいえ、駅からですか。|Respond modestly to thanks for giving a ride.
（返事を えらんでください。）|男：田中さんは もう 帰ったそうですよ。|そうですか。明日 また 来ます。|そうですか。今 田中さんが 来てください。|そうですか。昨日 帰りません。|Plan another visit after learning Tanaka has left.
（返事を えらんでください。）|女：よかったら、これ 食べてみて。|ありがとう。じゃ、一つ いただくね。|ありがとう。一つ 食べてくれるね。|ありがとう。食べてあげないで。|Politely accept the offered food.
（返事を えらんでください。）|男：この へや、ちょっと 寒くないですか。|そうですね。暖房を つけましょうか。|そうですね。冷房を 強くしましょうか。|そうですね。窓を 全部 あけましょうか。|Offer heating in response to a cold room.
（返事を えらんでください。）|女：あしたまでに 終わりそうですか。|はい、あと 少しですから。|はい、まだ 始められませんから。|はい、来週まで 無理ですから。|Being nearly finished supports the yes response about tomorrow's deadline.
（返事を えらんでください。）|男：手ぶくろが 落ちましたよ。|あ、気がつきませんでした。ありがとうございます。|あ、落としてあげます。ありがとうございます。|あ、落ちないでください。ありがとうございます。|Acknowledge the unnoticed dropped glove and thank the speaker.
（返事を えらんでください。）|女：お仕事は 何を なさっていますか。|銀行に 勤めています。|銀行を なさってください。|銀行に なりますか。|The honorific question asks about the listener's job.
（返事を えらんでください。）|男：今日は 無理を しないほうが いいですよ。|ええ、早めに 休むことに します。|ええ、もっと 無理を します。|ええ、休んでは いけません。|Accept the advice by deciding to rest early.
''')),
dict(theme='Health, local notices and learning a skill', vocabulary=[
choices('''
【病院】で 診てもらいました。|びょういん|びょいん|びよういん|ひょういん|病院 is read びょういん; distinguish 美容院.
【約束】を 忘れました。|やくそく|やっそく|やくぞく|よくそく|約束 is read やくそく.
【旅館】に 泊まりました。|りょかん|りょうかん|りょがん|たびかん|旅館 is read りょかん.
【注意】して 聞いてください。|ちゅうい|ちゅい|ちょうい|じゅうい|注意 is read ちゅうい.
【親切】な 人です。|しんせつ|しんさい|おやせつ|しんぜつ|親切 is read しんせつ.
この 町は 【昔】、静かでした。|むかし|むこう|むし|まえ|昔 is read むかし.
時間を 【調べて】おきます。|しらべて|くらべて|ならべて|えらべて|調べる is read しらべる.
'''),choices('''
【しゅうまつ】に 会いましょう。|週末|週未|周末|周未|しゅうまつ is 週末.
ここに 【とめて】ください。|止めて|歩めて|走めて|立めて|とめる meaning stop is 止める.
【おんがく】を 聞きます。|音楽|音学|意楽|意学|おんがく is 音楽.
パスポートが 【ひつよう】です。|必要|必用|心要|心用|ひつよう is 必要.
【しょくどう】で 食べます。|食堂|食道|飯堂|飯道|しょくどう meaning cafeteria is 食堂.
'''),choices('''
転んで 足に （　）を しました。|けが|かぜ|ねつ|せき|An injury from falling is けが.
野菜は 冷蔵庫に 入れておくと、長く （　）。|もちます|たちます|よります|おります|もつ means keep/last for food.
道が 混んでいるので、到着が （　）なりそうです。|おそく|ほそく|ひろく|ふかく|Congestion makes arrival late.
あしたの 発表のために、何度も （　）しました。|れんしゅう|せいかつ|うけつけ|けんぶつ|Practise for a presentation.
この 道を （　）行くと、橋が あります。|まっすぐ|はっきり|すっかり|びっくり|まっすぐ modifies going straight along a road.
答えが 正しいか、もう一度 （　）ください。|たしかめて|いじめて|あやまって|かたづけて|たしかめる means check/confirm.
とても つかれたので、少し （　）を とります。|きゅうけい|きゅうこう|きゅうりょう|きゅうじょ|Take a rest: 休憩をとる.
友だちと 山に 登る （　）を 立てました。|けいかく|けしき|きおく|けいさつ|Make a plan to climb a mountain.
'''),choices('''
【なるべく】 早く 来てください。|できるだけ 早く 来てください。|必ず 昨日 来てください。|ゆっくり 来てください。|来なくても いいです。|なるべく means as much/as soon as possible.
この 店は 【すいています】。|客が 少ないです。|客が 多いです。|もう 閉まっています。|品物が ありません。|すいている describes an uncrowded place.
【ずいぶん】 寒く なりました。|とても 寒く なりました。|少しだけ 寒く なりました。|まだ 暖かいです。|寒く なくなりました。|ずいぶん intensifies the degree.
先生に 【しかられました】。|先生に よくないと 強く 言われました。|先生に ほめられました。|先生に 招待されました。|先生に 教えてあげました。|しかられる means be scolded.
'''),choices('''
【知らせる】の つかいかたが 正しい 文を えらんでください。|予定が 変わったら、すぐ 知らせてください。|窓を 知らせて 外を 見ました。|パンを 二つ 知らせました。|電車を 知らせて 帰りました。|知らせる means inform someone of information.
【似る】の つかいかたが 正しい 文を えらんでください。|妹の 声は 母の 声に 似ています。|電車は 駅に 似ています。|かぜが 体に 似ています。|ねだんを 千円に 似ています。|似る compares resemblance in voices or other features.
【拾う】の つかいかたが 正しい 文を えらんでください。|道で 百円玉を 拾いました。|駅で 電車を 拾いました。|店で ねだんを 拾いました。|家で かぜを 拾いました。|拾う means pick up an object found on the ground.
【楽しみ】の つかいかたが 正しい 文を えらんでください。|来週の 旅行が 楽しみです。|この 机は 楽しみに ながいです。|雨を 楽しみで ふります。|切符を 楽しみから 買いました。|楽しみ expresses looking forward to an event.
''')],grammar=choices('''
明日は 雨が ふる（　）しれません。|かも|でも|にも|とも|かもしれない expresses possibility.
急いでいたので、朝ご飯を 食べ（　） 出ました。|ないで|なくては|なくても|なければ|ないで means without doing.
ここから 山が よく（　）。|見えます|見せます|見ますでした|見らせます|見える expresses visibility.
けがを したので、しばらく 運動しない（　） いいです。|ほうが|よりが|ままに|ためが|ないほうがいい advises against an action.
姉は 私に 日本語を 教えて（　）。|くれました|あげました|もらいました|いただきました|くれる describes a benefit given to the speaker.
おなかが すいて、歩けない（　）です。|ほど|だけで|ばかりに|しか|ほど expresses degree: so hungry that unable to walk.
日本に いる（　）に、一度 京都へ 行きたいです。|間|あと|まえ|ため|間に specifies within the period of being in Japan.
漢字が 読める（　） なりました。|ように|ことに|ために|そうに|ようになる describes acquiring an ability.
今朝は バスが 遅れた（　）、授業に 遅刻しました。|ので|のに|けれど|なら|ので gives the cause of being late.
この 部屋は 静か（　） 勉強できます。|なら|でもが|だったを|ようを|な-adjective + なら introduces a condition.
机の 上に 置いた はず（　）、かぎが ありません。|なのに|なので|ならば|になって|はずなのに expresses an expectation contradicted by reality.
毎朝 走る（　）に しました。|こと|もの|ため|ような|ことにする expresses a personal decision.
この 料理は 少し から（　）ます。|すぎ|すぎる|すぎた|すぎて|Adjective stem + すぎます means excessively spicy.
'''),order=order('''
わたしは|母に/教えて/もらった/料理|を 作りました。|母に教えてもらった modifies 料理.
明日の|会議で/使う/ことに/なっている|へやを 調べます。|使うことになっている describes the room scheduled for use.
友だちが|すすめて/くれた/本を/読む|つもりです。|すすめてくれた modifies 本; 本を読む precedes intention.
この 道具の|使い方が/わからない/人の/ために|説明を 書きました。|使い方がわからない modifies 人; 人のために is for those people.
'''),text=reading('''健康のために、先月から 歩くことに しました。初めは 毎日 一時間 歩こうと 思いましたが、仕事で 疲れて、三日しか 【1】。それで、一日 十分から 始めることに 【2】。短い 時間なら 忙しい 日も 【3】。今は 駅まで バスに 乗らずに 歩いています。少しずつですが、前より 体が 軽くなった 【4】。''','''
【1】|続きませんでした|続きました|続けてください|続いています|しか requires a negative: the plan lasted only three days.
【2】|しました|なりましたか|していましたか|してください|ことにしました records the speaker's decision.
【3】|できます|できません|できませんでした|できるでしょうか|A short routine is achievable even on busy days.
【4】|気がします|気にします|気をつけます|気になりません|気がする expresses a subjective impression of improvement.
'''),short=[reading('''公園の そうじに 参加する 皆さんへ。集合は 日曜日の ９時です。雨の 場合は 一週間後に 延期します。中止や 延期の 連絡は 当日の 朝７時までに メールで 送ります。道具は こちらで 用意します。''','''
日曜日に 雨が ふったら どう なりますか。|次の 日曜日に そうじを します。|その日の 午後に します。|道具を 自分で 買います。|連絡なしで 中止します。|A one-week postponement means the following Sunday.
'''),reading('''この 薬は 一日 三回、食事の あとに 二錠ずつ のんでください。ねむくなることが ありますから、のんだ あとは 車を 運転しないでください。よくなっても、自分で やめずに 医者に 相談してください。''','''
この 薬を のんでいる 人が しては いけないことは 何ですか。|のんだ あとに 車を 運転すること|食事の あとに のむこと|医者に 相談すること|一回に 二錠 のむこと|Driving after taking the medicine is prohibited due to drowsiness.
'''),reading('''山田さん、かしてくれた カメラを 土曜日に 返す 約束でしたが、急に 出張が 入りました。金曜日の 夜に お宅へ 届けても いいですか。むずかしければ、木曜日に 会社へ 持っていきます。リー''','''
リーさんが 最初に 提案しているのは どれですか。|金曜の 夜に 家へ 持っていくこと|土曜に 会社へ 持っていくこと|木曜に 家へ 送ること|日曜まで 借りること|The first proposal is Friday evening delivery to Yamada's home.
''')],medium=reading('''わたしは 半年前に ギター教室に 通い始めました。子どもの ころから 音楽が 好きでしたが、楽器を 習うのは 初めてでした。最初の 一か月は 指が 痛くて、簡単な 曲も 最後まで ひけませんでした。ほかの 人と 比べて、やめようかと 思ったことも あります。そのとき 先生に「昨日の 自分と 比べてみてください」と 言われました。それからは、毎週 練習を 録音して 聞くように しました。一週間 前に できなかった ところが 少し ひけるように なっていて、うれしくなりました。今は 一曲 ひけるように なりましたが、まだ 人の 前では 緊張します。来月、教室の 小さな 発表会が あります。失敗するかもしれませんが、出ることに しました。うまく ひくことだけでなく、ここまで 続けたことを 大切に したいと 思っています。''','''
わたしは なぜ やめようかと 思いましたか。|ほかの 人より うまく ひけないと 感じたから|先生に やめるよう 言われたから|音楽が 嫌いに なったから|教室が 遠かったから|Difficulty and unfavourable comparisons with others discouraged the narrator.
練習を 録音して 聞くと、何が わかりましたか。|前より できることが 増えていること|ほかの 人の 練習時間|先生が 使う ギターの ねだん|発表会の 順番|Recordings reveal progress against the narrator's own earlier performance.
発表会について どう 思っていますか。|失敗しても 続けたことを 大切に したいです。|失敗しないので 練習は いりません。|緊張するので 出ません。|一位に なれなければ やめます。|The narrator chooses to participate and value persistence despite possible mistakes.
'''),info=reading('''まちの 健康センター\n月：9:00〜12:00 健康相談（無料・予約不要）\n火：14:00〜15:00 体操（500円・予約必要）\n木：10:00〜11:30 栄養教室（800円・予約必要）\n土：9:00〜11:00 健康相談（無料・予約必要）\n予約は 前日17:00までに 電話。体操は タオルを 持参。栄養教室の 材料費は 料金に 含まれます。''','''
平日の 午前しか 来られず、予約を していない 人が 参加できるのは どれですか。|月曜の 健康相談|火曜の 体操|木曜の 栄養教室|土曜の 健康相談|Only Monday morning advice meets both the availability and no-reservation conditions.
木曜の 栄養教室に 参加するには どうしますか。|水曜17時までに 電話し、800円を はらう|木曜の 朝 電話し、材料費を 別に はらう|予約せずに 行き、800円を はらう|水曜17時までに メールし、500円を はらう|Book by telephone by Wednesday 17:00; the 800-yen fee includes materials.
'''),task=listening('''
女の人は 最初に 何を しますか。|男：熱を はかってから、この 紙に 症状を 書いてください。女：保険証は？ 男：紙と いっしょに あとで 出してください。|熱を はかる|症状を 書く|保険証だけ 出す|薬を のむ|Temperature measurement is first, followed by writing and submitting documents.
男の人は 何を 持ってきますか。|女：明日は 外を 歩きますから、タオルと 水を。男：お弁当も いりますか。女：昼前に 終わるので、いりません。|タオルと 水|タオルと お弁当|水と お弁当|お弁当だけ|The walk ends before lunch, so only a towel and water are needed.
女の人は いつ 先生に 会いますか。|女：木曜日の 午後は いらっしゃいますか。男：午後は 会議です。午前10時なら 大丈夫です。女：では、その 時間に うかがいます。|木曜の 午前10時|木曜の 午後10時|金曜の 午前10時|木曜の 午後１時|She accepts Thursday at 10 a.m.
男の人は どの 道を 行きますか。|女：川の そばの 道は 工事中です。男：橋を 渡る 道は？ 女：今日は そちらを 通ってください。|橋を 渡る 道|川の そばの 道|山の 中の 道|駅の 地下道|The bridge route is recommended while the riverside road is closed.
女の人は 何を 消しますか。|男：帰るときは エアコンを 消してください。女：電気も？ 男：あとで そうじの 人が 来るので、電気は つけたままで。|エアコンだけ|電気だけ|エアコンと 電気|何も 消さない|Turn off the air conditioner but leave the lights on for the cleaner.
男の人は 本を どこに 返しますか。|女：今日は カウンターが 閉まっています。男：入口の 箱に 入れれば いいですか。女：ええ、本は そちらへ。CDは 明日 カウンターへ お願いします。|入口の 箱|今日の カウンター|CDの 棚|教室の 机|Books may be returned through the entrance box; CDs require the counter tomorrow.
女の人は 何を 書き直しますか。|男：この お知らせ、日にちは 正しいですが、場所が 古いままです。女：２階じゃなくて ３階ですね。直します。|場所|日にち|開始時間|電話番号|Only the venue floor is wrong.
男の人は つぎに 何を しますか。|女：先に 野菜を 洗っておきました。男：じゃ、切りますね。女：その前に、冷蔵庫から 肉を 出してもらえますか。男：はい。|冷蔵庫から 肉を 出す|野菜を 洗う|野菜を 切る|肉を 買いに 行く|The final instruction puts taking out meat before cutting the washed vegetables.
'''),points=listening('''
女の人は なぜ 水泳を 始めましたか。|男：やせるためですか。女：それも いいですが、いちばんの 理由は 腰が 痛いからです。医者に すすめられました。|腰が 痛いから|友だちに 会うため|試合に 出るため|旅行に 行くため|Back pain is explicitly the main reason.
男の人は 一週間に 何回 練習しますか。|女：毎日 練習ですか。男：火曜と 木曜は 休みです。あとの 日は 毎日です。|５回|７回|２回|４回|Seven days minus two rest days equals five sessions.
料理教室は 何時に 終わりますか。|ナレーター：今日は ９時半から 始めます。料理に 一時間半、その後 30分 食事をして、最後に 30分 かたづけます。|12時|11時|11時半|12時半|9:30 plus 1.5 + 0.5 + 0.5 hours ends at noon.
女の人は かぎを どこで 見つけましたか。|男：かぎ、あった？ 女：かばんには なくて、上着の ポケットに 入っていたの。机の 上ばかり さがしてた。|上着の ポケット|かばんの 中|机の 上|玄関の 棚|The key was in the jacket pocket, not the places searched.
発表会は いつに なりましたか。|男：発表会は 今月の 最後の 土曜でしたね。女：会場が 使えなくて、来月 最初の 日曜に 変わったそうです。|来月 最初の 日曜|今月 最後の 土曜|来月 最初の 土曜|今月 最後の 日曜|The new date is the first Sunday of next month.
男の人は どのように 勉強していますか。|女：単語は 書いて おぼえますか。男：前は そうでしたが、今は 音を 聞いて、声に 出して おぼえています。|聞いて 声に 出す|何度も 書くだけ|絵だけを 見る|友だちの ノートを 写す|His current method is listening and speaking aloud.
女の人は 何を 忘れましたか。|男：体操の 用意は できましたか。女：運動ぐつも 水も あります。でも タオルを 持ってくるのを 忘れました。|タオル|運動ぐつ|水|予約の 紙|She has shoes and water; the towel is missing.
'''),utterance=listening('''
道で 財布を 見つけて 交番へ 届けます。何と 言いますか。|ナレーター：道で 拾った 財布を 警察官に 渡します。|この 財布を 道で 拾ったんですが。|この 財布を 道に 捨てたいんですが。|この 財布を 道で 買ったんですが。|Explain that you found the wallet on the road.
友だちを 心配して 休むように 言います。何と 言いますか。|ナレーター：友だちは 熱が あるのに 働こうと しています。|今日は 無理しないで 休んだら？|今日は もっと 無理したら？|今日は 休まないほうが いいよ。|Suggest resting rather than working with a fever.
先生の 荷物を 運ぶと 申し出ます。何と 言いますか。|ナレーター：先生が たくさんの 荷物を 持っています。|お荷物を お持ちしましょうか。|お荷物を 持たせてあげますか。|お荷物を 持っていただけませんか。|お持ちしましょうか politely offers your help to the teacher.
店で 商品の 使い方を 質問します。何と 言いますか。|ナレーター：初めて 見る 道具の 使い方が わかりません。|これは どうやって 使うんですか。|これは どうして 使ったんですか。|これは だれに 使われたんですか。|どうやって asks how to operate the tool.
誘われましたが、予定が あって 断ります。何と 言いますか。|ナレーター：友だちに あしたの 映画に 誘われましたが、行けません。|残念だけど、あしたは 用事が あるんだ。|残念だけど、ぜひ 行こう。|残念だけど、時間は いつでも いいよ。|Explain the conflicting plan to decline politely.
'''),quick=listening('''
（返事を えらんでください。）|男：ずいぶん 上手に なりましたね。|ありがとうございます。まだ 練習中です。|ありがとうございます。下手に なってください。|ありがとうございます。上手に してあげます。|Accept praise modestly while referring to ongoing practice.
（返事を えらんでください。）|女：傘、持っていったほうが いいですよ。|そうですね。雨が ふりそうですしね。|そうですね。雨は 昨日までに ください。|そうですね。傘を ふりましょう。|Acknowledge advice because rain looks likely.
（返事を えらんでください。）|男：こちらに 名前を 書いていただけますか。|はい、ここですね。|はい、書いていただきますか。|はい、名前を 読んでください。|Confirm where to write in response to the request.
（返事を えらんでください。）|女：まだ 食べたことが ないんですか。|ええ、今日が 初めてです。|ええ、毎日 食べています。|ええ、去年 何度も 食べました。|Confirm no previous experience; today is the first time.
（返事を えらんでください。）|男：この 荷物、どこに 置けば いいですか。|あの 棚の 下に お願いします。|昨日 置けば よかったですか。|荷物に 置いてあります。|Give the requested location for the luggage.
（返事を えらんでください。）|女：お体の 具合は いかがですか。|おかげさまで、よく なりました。|おかげさまで、よく してください。|おかげさまで、具合を あげます。|Report recovery in response to a polite health inquiry.
（返事を えらんでください。）|男：少し 小さく していただけませんか、音。|あ、すみません。すぐ 下げます。|あ、すみません。もっと 大きくします。|あ、すみません。音を 入れてください。|Apologize and lower the volume as requested.
（返事を えらんでください。）|女：今度の 土曜日、空いていますか。|午後なら 大丈夫です。|土曜日に 入っていますか。|空は 青いです。|Specify available time in response to a schedule inquiry.
''')),
]
