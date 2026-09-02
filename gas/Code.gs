/*** 神谷梓さん 受付管理システム GAS v11.1 ***************************
 * 【v11.1 2026-09-02】お支払い方法の変更は1回まで
 *   列は増やさず、J列（決済方法）に「（変更）」の印を残して見分ける。
 *     空／カード／カード（変更）の3段階。
 *   同じ方法を選び直した場合は変更に数えない。
 *
/*** 神谷梓さん 受付管理システム GAS v11.0 ***************************
 * 【v11.0 2026-09-02】状態（G列）が空の行があってもアプリを壊さない
 *   スプレッドシートで状態のセルだけ消すと、アプリが行き先を失って
 *   「読み込みできませんでした」になっていた（テスト中に実際に発生）。
 *   状態が空なら『確認中』として返し、お客さまには落ち着いた画面を出す。
 *   あわせて運営へお知らせする（同じ方につき1時間に1回まで）。
 *
/*** 神谷梓さん 受付管理システム GAS v10.9 ***************************
 * 【v10.9 2026-09-02】お支払い方法の選び直しで期限を延ばせる穴をふさぐ
 *   ① 振込で24時間にしたあとカードへ戻すと、24時間のカード枠になっていた
 *   ② 振込を選び直すたび「そこから24時間」に更新され、無限に延ばせた
 *   直し方：振込は【受付日時】から数え、カードは【いまから20分】と
 *   【いまの期限】の短いほうにする。選び直しても得をしない。
 *
/*** 神谷梓さん 受付管理システム GAS v10.8 ***************************
 * 【v10.8 2026-09-02】お支払いと期限切れが行き違いになった方を受け止める
 *   マーケの期限は20分と短く、カード決済の最中に期限切れになって
 *   キャンセルのお知らせが届くことが起こりうる。
 *   ・カード決済のご連絡が「期限切れ」だと弾かれていたのを受け付けるように
 *   ・振込のご連絡は、確定済み・キャンセル済みの方を上書きしないよう保護
 *   ・どちらも期限切れ後だった場合は備考に印を付け、運営へ強めにお知らせする
 *
/*** 神谷梓さん 受付管理システム GAS v10.7 ***************************
 * 【v10.7 2026-09-02】セルフにも繰上げ期限の分数を明記
 *   v10.6 でキャンセル待ちの画面の「3日以内」を自動生成に変えたところ、
 *   数字を持たないセルフでは表示そのものが消えてしまった。
 *   promote_deadline_min: 4320（＝3日）を入れて元の表示に戻す。
 *   期限の長さは DEADLINE_DAYS と同じなので、動きは従来どおり変わらない。
 *
/*** 神谷梓さん 受付管理システム GAS v10.6 ***************************
 * 【v10.6 2026-09-02】繰上げの期限の長さも画面へ返す
 *   キャンセル待ちの画面に「3日以内」とベタ書きされていて、
 *   マーケ（24時間）と食い違っていたため。
 *   ※繰上げの期限は「繰り上げた瞬間＝LINEを送った瞬間」から数えている。
 *     アプリを開いたときからではないので、開かれずに席がふさがることはない。
 *
/*** 神谷梓さん 受付管理システム GAS v10.5 ***************************
 * 【v10.5 2026-09-02】お支払い期限の長さを get_status で返す
 *   画面の「◯分以内」「◯時間以内」はこの値から作る。
 *   期限を変えるときは SEMINARS の deadline_min / bank_deadline_min
 *   だけを直せばよく、文言との食い違いが起きない。
 *
/*** 神谷梓さん 受付管理システム GAS v10.4 ***************************
 * 【v10.4 2026-09-02】choose_payment からロックを外す
 *   ご本人の行しか触らず定員の判断もしないので、ロックは不要だった。
 *   つけたままだと受付の殺到中に submit_application と取り合ってしまう。
 *   （本番で busy が返ることを確認して修正）
 *
/*** 神谷梓さん 受付管理システム GAS v10.3 ***************************
 * 【v10.3 2026-09-02】20分きざみの期限切れを、トリガーに頼らず処理する
 *   Apps Scriptの5分トリガーが保存できなかったため、
 *   受付ページが開かれた瞬間（get_capacity）にその場で片づける方式にした。
 *   sweepIfNeeded_ は30秒に1回までなので、殺到しても重くならない。
 *   毎時の checkExpired からも呼んでいる（保険）。
 *   将来トリガーを作れたら setupFastTrigger を実行すればよい（任意）。
 *
/*** 神谷梓さん 受付管理システム GAS v10.2 ***************************
 * 【v10.2 2026-09-02】マーケ一般：受付してから空き状況が分かる方式へ
 *   ① 受付前に残席を見せない（hide_capacity）。フォームは誰にでも出し、
 *      送信して初めて「お支払いへ」か「キャンセル待ち◯番目」かが分かる。
 *   ② お支払い期限を短く
 *        カード       … 受付できてから 20分（deadline_min）
 *        銀行振込     … お選びいただいてから 24時間（bank_deadline_min）
 *        繰上げの方   … ご案内から 24時間（promote_deadline_min）
 *      20分きざみを効かせるため、checkExpiredFast を5分ごとに走らせる。
 *      （setupFastTrigger を一度実行してトリガーを作ること）
 *   ③ 期限を過ぎたあとのご入金・ご決済も、返金せずお受けする。
 *      そのぶん定員15名を超えることがある。会場上限25名に近づいたら
 *      watchAttendees_ が運営へお知らせする（受付は止めない）。
 *
/*** 神谷梓さん 受付管理システム GAS v10.1 ***************************
 * 【v10.1 2026-09-02】マーケ一般を当初の【公式LINE連携】方式へ戻す
 *   受付は apply.html?seminar=marke_general&uid=[[uid]]、決済はプロライン経由。
 *   LINEなし方式のコードは消していない。MARKE_NO_LINE を true にすれば戻る。
 *   ・残席の数え方 … 確定／決済案内中／振込報告済み（当初どおり）
 *   ・自動繰上げ  … 復活（プロラインの「空きできました」が飛ぶため）
 *   ・LINEなし方式の入口（submit_marke ほか）は閉じてある
 *
/*** 神谷梓さん 受付管理システム GAS v10.0 ***************************
 * 【v10.0 2026-09-02】マーケ：受付できた時点でお席を確保する
 *   これまでは「お支払いが済んだ人」だけを残席から引いていたため、
 *   同時に何人も決済画面へ入れてしまい、16人目がお支払いできてしまう
 *   （＝返金のお願いをする）可能性が残っていた。
 *
 *   これからは、受付できた時点で MARKE_HOLD_MIN 分だけお席を確保する。
 *   確保中の方も残席から引くので、15人ぶん埋まったら16人目は受付の段階で
 *   「満席」になり、決済ページに入れない。
 *   確保時間を過ぎてもお支払いがなければ、checkExpired が席を戻す。
 *
/*** 神谷梓さん 受付管理システム GAS v9.6 ****************************
 * 【v9.6 追加 2026-09-01】管理アプリの名簿にフリガナとインスタを載せる
 *   キャンセル待ちの方へDMを送るとき、名簿からそのままInstagramへ飛べるように。
 *
/*** 神谷梓さん 受付管理システム GAS v9.5 ****************************
 * 【v9.5 追加 2026-09-01】受付開始ゲートの戻し忘れ防止
 *   OFFにしてから30分たつと、自動でONへ戻る（運営へお知らせも飛ぶ）。
 *   OFFのままだと募集開始日時より前に申し込めてしまうため、
 *   実際に2度、戻し忘れの状態が発生したことを受けての対策。
 *
/*** 神谷梓さん 受付管理システム GAS v9.4 ****************************
 * 【v9.4 修正 2026-08-27】席を持っていない方のキャンセルで繰り上げないように
 *   「決済待ち」は残席に数えないため、その方がキャンセルしても席は空かない。
 *   なのに繰り上げてしまうと定員を1つ超えてしまう。holdsSeat_ で判定するようにした。
 *
/*** 神谷梓さん 受付管理システム GAS v9.3 ****************************
 * 【v9.3 追加 2026-08-27】📊 マーケ名簿（見やすい並びの一覧）
 *   ・「📋 マーケ一般」の列の並びは、システムが番号で見ているため動かせない
 *     （G列＝状態、H列＝待機順などがずれると全部止まる）。
 *   ・そこで見る用のシートをQUERYで別に作る。中身は自動で同期される。
 *     並び：お名前／読み仮名／メール／インスタ／生年月日／お電話／状態／…
 *
/*** 神谷梓さん 受付管理システム GAS v9.2 ****************************
 * 【v9.2 追加 2026-08-27】決済待ちのまま満席になった方の逃げ道
 *   ・marke_to_wait … ご本人がキャンセル待ちへ移れる。
 *     お支払いいただいてから「満席でした」となるのを避けるため。
 *
/*** 神谷梓さん 受付管理システム GAS v9.1 ****************************
 * 【v9.1 追加 2026-08-27】マーケをLINEなしで受け付ける
 *   Instagram → 受付アプリ → カード決済、という流れに変更されたため。
 *   ・submit_marke  … uidの代わりに【申込ID】を発行してA列へ。
 *                     状態は「決済待ち」＝残席に数えない（席を押さえない）。
 *   ・marke_paid    … 決済後に「確定」へ。定員を超えていたら待機＋要返金の記録。
 *   ・marke_lookup  … メールアドレス＋生年月日でご自身の申込を探す。
 *                     （LINEが無いので、これがアプリを開く鍵になる）
 *   ⚠️ セルフ（LINE経由）の処理には一切手を入れていない。
 *
/*** 神谷梓さん 受付管理システム GAS v9.0 ****************************
 * 【v9.0 追加 2026-08-26】繰り上げまわりの手当て
 *   ① 空席があるのにキャンセル待ちの方がいると、運営のスマホへお知らせ。
 *      1日1回まで／朝9時〜夜9時のあいだだけ（remindPromote_）。
 *      満席後のキャンセルは従来どおり自動で繰り上がるので通知しない。
 *   ② キャンセル待ちの方を「決済案内中」に変えると、繰り上げとして扱う。
 *      期限3日＋後ろの方の番号を詰める＋⑤「空きができました」を送る。
 *      → 管理アプリから【お一人を指名して】繰り上げられる。
 *   ⚠️ スプシのG列を手で書き換えても、この処理は動きません（LINEも飛びません）。
 *      繰り上げは必ず管理アプリのボタンから行ってください。
 *
/*** 神谷梓さん 受付管理システム GAS v8.9 ****************************
 * 【v8.9 追加 2026-08-26】マーケティングセミナー向け
 *   ① キャンセル待ち専用の入口。申込に mode=wait を付けて送ると、
 *      空席があっても最初からキャンセル待ちに入る（待機番号は自動採番）。
 *      通常の入口（mode無し）は従来どおり：空席あり→決済案内中／満席→待機。
 *   ② インスタのユーザー名を【P列】に追加（マーケのみ必須・フォーム側で判定）。
 *      @やURLを貼られても、ユーザー名だけにして保存する。
 *      ※列は必ず末尾に足すこと。途中に挿入すると全部の番号がずれる。
 *
/*** 神谷梓さん 受付管理システム GAS v8.8 ****************************
 * 【v8.8 追加 2026-08-26】（v8.8.1で get_capacity にも締切情報を追加）
 *   ① 申込の締切 close_at を追加（開催前日23:59）。
 *      セルフ=9/17 23:59 ／ マーケ=9/28 23:59（初回開催の前日）
 *      締切を過ぎると submit_application が error:'closed' を返す。
 *      ゲートのオンオフとは無関係に効く（開催後の申込を止めるため）。
 *   ② 管理アプリから「キャンセル待ちに移す」ができるように。
 *      待機番号は自動で最後尾に振るので、繰上げの順番は狂わない。
 *   ③ 返金の文言をLP（開催1週間前まで全額返金）に合わせた（アプリ側）
 *
/*** 神谷梓さん 受付管理システム GAS v8.7 ****************************
 * 【v8.7 変更 2026-08-21】フリガナはカタカナのみ
 *   ・normalizeKana_ … 半角カナ・ひらがなをカタカナへ、スペースもそろえる
 *   ・isKana_ … カタカナ（＋長音・中黒・スペース）だけかを判定
 *   ・save_kana はカタカナ以外をお断りする
 *   ・⚠️申込(submit_application)は【お断りしない】。表記をそろえて保存するだけ。
 *     募集開始直後にフリガナの形式でお申込みを弾くと、席を落としてしまうため。
 *     形式のチェックは申込フォーム側（apply.html）で行う。
 *
/*** 神谷梓さん 受付管理システム GAS v8.6 ****************************
 * 【v8.6 追加 2026-08-21】お知らせの「🧪 テスト送信」
 *   ・管理アプリから、指定した1人のuidにだけ⑧を飛ばせる。
 *   ・お客さまへ一斉に送る前に、自分のLINEで届き方を確かめられる。
 *
/*** 神谷梓さん 受付管理システム GAS v8.5 ****************************
 * 【v8.5 追加 2026-08-21】読み仮名と、受付完了のお知らせ
 *   ① 読み仮名を【O列】に追加。既存のA〜N列は一切動かしていない
 *      （途中に挿入すると全部の番号がずれて、すでに入っている申込が壊れるため）
 *      ・新規のお申込みはフォームで入力していただく
 *      ・すでにお申込み済みの方は、アプリに入力欄が出る（save_kana）
 *      ・メニュー「🈁 読み仮名の列を用意する」で既存シートに見出しを付ける
 *   ② 受付完了とキャンセル待ちのとき、運営のスマホへお知らせが飛ぶようにした。
 *      事前決済の「決済案内中」では飛ばさない（募集開始直後に鳴り続けるため）
 *
/*** 神谷梓さん 受付管理システム GAS v8.4 ****************************
 * 【v8.4 追加 2026-08-21】Google側の一時的な混雑を自動でやり直す
 *   ・100人同時申込のテストで「同時呼び出しの数が多すぎます: スプレッドシート」
 *     が数件発生した。これはGoogle側の一時的な制限で、待てば通る。
 *   ・そういうエラーを busy として返すようにしたので、
 *     アプリが少し待って自動でやり直す（お客さまにはエラーが見えない）。
 *
/*** 神谷梓さん 受付管理システム GAS v8.3 ****************************
 * 【v8.3 追加 2026-08-20】本番稼働中でも混雑テストができるように
 *   ・admin_submit_dryrun（管理キー必須）＝申込処理を「計算だけ」実行。
 *     行の追加もLINE送信もしないので、本番データを汚さずに
 *     ロックの混み具合を測れる。
 *   ・申込のレスポンスに lock_held_ms（カギを何ミリ秒つかんだか）を追加。
 *     ここが伸びてきたら混雑のサイン。
 *
/*** 神谷梓さん 受付管理システム GAS v8.2 ****************************
 * 【v8.2 一斉アクセス対策 2026-08-20】募集開始直後の同時申込に耐える
 *   ① ロックの中を最小化：LINE送信と操作履歴をロックの外へ。
 *      シートの読み込みも3回→1回（A〜H列をまとめて読む）。
 *      → 1人あたりの占有時間が約2.5秒 → 約0.7秒に。
 *   ② waitLock(10秒・例外) → tryLock(25秒・busyを返す)。
 *      混雑してもエラー画面ではなく「混み合っています」を返し、アプリが再送する。
 *   ③ 残席表示を3秒キャッシュ（getCapacity_）。定員判定には使わない。
 *
/*** 神谷梓さん 受付管理システム GAS v8.1 ****************************
 * 【v8.1 追加 2026-08-20】お知らせの対象セミナーに「まとめて」を追加
 *   ・「セルフ両方」＝セルフ先行＋セルフ一般（同じ9/18開催なので便利）
 *   ・「マーケ両方」＝マーケ先行＋マーケ一般
 *
/*** 神谷梓さん 受付管理システム GAS v8.0 ****************************
 * 【v8.0 変更 2026-08-20】前日リマインドの自動送信を廃止
 *   ・プロライン⑧は「📣 お知らせ」専用の合図になりました。
 *   ・前日のご連絡は、お知らせ機能の「予約」で前日10時などに送ってください
 *     （文面を自由に書けるので、こちらのほうが融通がききます）。
 *
/*** 神谷梓さん 受付管理システム GAS v7.9 ****************************
 * 【v7.9 改良 2026-08-20】お知らせの表示ルールを分かりやすく
 *   ・「表示」に【非表示】を追加（送り終わった過去のお知らせを畳む用）
 *   ・該当する「公開」のお知らせは【すべて】アプリに表示（以前は1件だけだった）
 *   ・公開が1件も無いときだけ「通常」を表示
 *
/*** 神谷梓さん 受付管理システム GAS v7.8 ****************************
 * 【v7.8 改良 2026-08-20】お知らせの入力と編集をもっと簡単に
 *   ・予約日はカレンダーから選択、時刻は30分きざみのプルダウンに分離
 *   ・管理アプリからお知らせを作成・編集・送信できるAPIを追加
 *     （admin_news_list / save / send / count / delete）
 *
/*** 神谷梓さん 受付管理システム GAS v7.7 ****************************
 * 【v7.7 追加 2026-08-20】📣 お知らせ機能
 *   スプシの「📣 お知らせ」シートに本文を書くとアプリに表示され、
 *   必要なときだけLINEで「お知らせがあります」を対象者へ送れる。
 *   ・表示＝公開／下書き／通常（通常＝臨時が無いときに出る定常メッセージ）
 *   ・対象＝セミナー×状態で絞り込み
 *   ・LINE通知＝送らない／すぐ送る（メニュー実行）／予約（日時指定・毎時チェック）
 *   ※LINEは⑧を「お知らせの合図」として使うため、シナリオ枠は増えません
 *
/*** 神谷梓さん 受付管理システム GAS v7.6 ****************************
 *   ※ previewDayBeforeReminders() をエディタで実行すると、送らずに対象人数だけ確認できる
 *
/*** 神谷梓さん 受付管理システム GAS v7.5 ****************************
 * 【v7.5 変更 2026-08-20】セルフ先行の受付を開始
 *   セルフ先行(当日現金20名)の open_at を 2026-08-20 00:00 にして受付開始。
 *   セルフ一般は 8/24 21:00、マーケは 9/5 21:00 のまま（変更なし）。
 *
/*** 神谷梓さん 受付管理システム GAS v7.4 ****************************
 * 【v7.4 追加 2026-08-19】総合リストに「LINE ID（uid）」列を追加
 *   ※メニュー「🌸受付管理 → 👥💎総合リストを再生成」で反映（デプロイ不要）
 *
/*** 神谷梓さん 受付管理システム GAS v7.3 ****************************
 * 【v7.3 追加 2026-08-19】カード決済完了のご連絡（お客さま申告）
 *   プロラインの「決済成功→⑦へ移動→外部プログラム」が届かない場合でも、
 *   お客さまが決済画面で止まらないようにするための受け皿。
 *   action=report_card_payment で「振込報告済み」に変え、
 *   運営が管理画面で確認して確定する流れ（銀行振込と同じ手順）に合流させる。
 *
/*** 神谷梓さん 受付管理システム GAS v7.2 ****************************
 * 【v7.2 改善 2026-08-19】アプリの読み込みを速く
 *   名簿の検索でシート全列を読んでいたのをA列(uid)だけに変更し、
 *   一致した1行だけを読むようにした。複数セミナーを横断する場面で効く。
 *
/*** 神谷梓さん 受付管理システム GAS v7.1 ****************************
 * 【v7.1 修正 2026-08-19】複数セミナーに申し込んだ方の状態が正しく出ない問題
 *   セルフとマーケの両方に申込があると、シート順で最初のもの（セルフ）が
 *   常に返り、マーケの入口から入っても別セミナーの画面が出ていた。
 *   ・入口セミナーの指定があればそれを優先
 *   ・指定がなければ「申込日時が最新」のものを返す
 *   ・決済完了時は「お支払い待ちの行」を優先して確定する
 *
 *  （以下 v7.0 以前の履歴）
/*** 神谷梓さん 受付管理システム GAS v7.0 ****************************
 * 【v7.0 修正 2026-08-19】カード決済で確定メッセージが2通届く不具合を修正
 *   プロラインが「決済成功→⑦へ移動」でメッセージを送った後、
 *   ⑦の外部プログラムから呼ばれたGASが再び⑦を叩いていたため2通になっていた。
 *   handlePaymentComplete_ から moveScenario_ の呼び出しを削除。
 *   ※振込確認・管理画面からの確定は従来どおりGASが⑦を叩く（プロライン側の移動がないため）
 *
 * 【v6.9 追加 2026-08-17】⑩受付完了シナリオを接続
 *   申込→「決済案内中」になった方へ、お支払い案内のLINEが自動で届く
 *   （セルフ先行＝当日現金は即確定のため⑦確定が飛ぶ。キャンセル待ちは枠なしで通知なし）
 *
 * 【v6.8 変更 2026-08-17】マーケは先行枠なしの一般募集15名に一本化
 *   marke_general の定員 10→15。marke_priority の定義は温存（使わないが
 *   復活できるよう残す）。アプリ側の表示名からも【一般受付】を削除
 *
 * 【v6.7 追加 2026-08-08】受付開始ゲート
 *   募集開始日時（SEMINARSのopen_at）より前は申込を受け付けない。
 *   管理画面の「⏳受付開始ゲート」スイッチでON/OFF切替（デフォルトON）。
 *   セルフ＝8/24 21:00／マーケ＝9/5 21:00（先行・一般とも同時刻で設定）
 *
 * 【v6.6 修正 2026-08-08】毎時トリガーのcheckExpiredがエラーメールを
 *   出していた問題を修正（ContentServiceの戻り値をトリガーに返さない）
 ***********************************************************/
/*** （以下v2からの説明） ******************************************
 * スプシ「神谷さん受付管理」に紐付けて動作する統合GAS。
 *
 * 【v2で追加した機能（Webアプリ用API）】
 *  - get_status          … uidから状態取得（画面出し分け用）
 *  - submit_application  … Webアプリのフォーム受信＋定員判定
 *  - report_bank_transfer… 振込報告受信
 *  - get_capacity        … 残席照会
 *  - cancel_application  … ユーザー自身のキャンセル＋繰上げ
 *
 * 【v1から引き継いだ機能】
 *  1) プロライン→GAS：フォーム送信受信（form_submitted）
 *  2) プロライン→GAS：Stripe決済完了受信（payment_completed）
 *  3) スプシonEdit：手動書換→繰上げ
 *  4) 時限トリガー(1時間毎)：3日期限判定→期限切れ＋繰上げ
 *
 * 【更新手順】
 *  1. スプシ → 拡張機能 → Apps Script → 既存コードをこれで丸ごと置換 → 保存
 *  2. デプロイ → デプロイを管理 → 編集(鉛筆) → バージョン「新バージョン」→ デプロイ
 *     ※これでURLは変わらずに更新されます
 *
 * 【列構成（各セミナーシート・10行目からデータ）】
 *  A:uid B:名前 C:メール D:電話 E:申込日時 F:期限 G:状態 H:待機順
 *  I:決済日時 J:決済方法 K:備考 L:生年月日 M:職業 N:お悩み O:読み仮名
 *  P:インスタユーザー名（マーケのみ・v8.9で末尾に追加）
 *  ※読み仮名(O)は後から足した列。既存の並びを崩さないよう末尾に置いてある。
 *    列を増やすときも必ず末尾に足すこと（途中に挿入すると全部の番号がずれる）
 ***********************************************************/

// ========== 設定 ==========
var TOKEN = 'TOORU-kamiya-reception-hK8pL2';
var ADMIN_TOKEN = 'kamiya-admin-Wq7xR3nT';  // 管理画面専用（名簿閲覧用・一般トークンでは読めない）

// プロライン「外部システム連携用の実行URL」（2026-08-05 とーるさん取得済み）
var PROLINE_URLS = {
  '決済案内':      'https://autosns.jp/api/call-beacon/l8j3osTWwQ/[[uid]]',  // ⑩受付完了→お支払い案内
  'キャンセル待ち': '',  // シナリオ枠なし（アプリ画面で案内するため通知なし）
  '空きできました': 'https://autosns.jp/api/call-beacon/bTFA7xmCIj/[[uid]]',  // ⑤あなたの番
  '期限切れ':      'https://autosns.jp/api/call-beacon/T4X1DuWLcP/[[uid]]',  // ⑥期限切れ
  '確定':          'https://autosns.jp/api/call-beacon/fL7KpDojxq/[[uid]]',  // ⑦支払い確定
  'お知らせ': 'https://autosns.jp/api/call-beacon/qgD9wnxlmt/[[uid]]',       // ⑧ 📣お知らせの合図（本文はアプリ側）
  'キャンセル完了': 'https://autosns.jp/api/call-beacon/fG0RdXOvCs/[[uid]]'   // ⑨キャンセル完了通知
};

// セミナー定義（シート名と定員）
// open_at = 募集開始日時（この時刻より前は申し込めない／'YYYY-MM-DD HH:mm' 日本時間）
// ※効くのは「受付開始ゲート」がONのときだけ。管理画面のスイッチでOFFにすればテスト申込ができる
// ※先行と一般で開始時刻を分けたい場合は、この行の日時を個別に変えるだけでOK
var SEMINARS = {
  /* dates は開催日のメモです（自動送信には使いません） */
  /* promote_deadline_min = 4320分（3日）。DEADLINE_DAYS と同じ長さで、
     繰上げの期限は従来どおり。数字を書いておくのは、キャンセル待ちの画面に
     「お知らせが届いてから3日以内」と正しく出すため（v10.7） */
  'self_priority':   { sheet: '📋 セルフ先行',  capacity: 20, payment: 'cash',    open_at: '2026-08-20 00:00',  // 先行は8/20から受付中
                       close_at: '2026-09-17 23:59', dates: ['2026-09-18'],
                       promote_deadline_min: 4320 },
  'self_general':    { sheet: '📋 セルフ一般',  capacity: 30, payment: 'prepaid', open_at: '2026-08-24 21:00',
                       close_at: '2026-09-17 23:59', dates: ['2026-09-18'],
                       promote_deadline_min: 4320 },
  'marke_priority':  { sheet: '📋 マーケ先行',  capacity: 5,  payment: 'prepaid', open_at: '2026-09-05 21:00',
                       close_at: '2026-09-28 23:59', dates: ['2026-09-29', '2026-10-29', '2026-11-25'],
                       promote_deadline_min: 4320 },
  // マーケは先行枠なしの一般募集のみ（2026-08-17変更・15名）。先行枠は使わないが定義は温存
  /* マーケ一般（2026-09-02 改定）
     ・受付前に残席を見せない（hide_capacity）。送信して初めて結果が分かる
     ・お支払い期限を短くして席を早く回す
         deadline_min         … 受付できてから、カードでお支払いいただくまで
         bank_deadline_min    … 銀行振込をお選びいただいてから
         promote_deadline_min … 繰上げでご案内してから（LINEに気づく時間が要るので長め）
     ・max_attendees … 会場の上限。期限切れ後のご入金で定員を超えることを許容するが、
                       ここに近づいたら運営へ警告を出す */
  'marke_general':   { sheet: '📋 マーケ一般',  capacity: 15, payment: 'prepaid', open_at: '2026-09-05 21:00',
                       close_at: '2026-09-28 23:59', dates: ['2026-09-29', '2026-10-29', '2026-11-25'],
                       hide_capacity: true,
                       deadline_min: 20, bank_deadline_min: 1440, promote_deadline_min: 1440,
                       max_attendees: 25 }
};

var DEADLINE_DAYS = 3;   // 決済期限（日数）※セミナー個別の指定がないときの既定値

/**
 * お支払い期限を出す。
 *   kind … 'card'（受付直後の既定）／'bank'（銀行振込をお選びになったとき）
 *          'promote'（キャンセル待ちから繰り上がったとき）
 * セミナー設定に分数の指定があればそれを使い、無ければ従来どおり DEADLINE_DAYS。
 */
function deadlineFrom_(config, fromDate, kind) {
  var min = 0;
  if (config) {
    if (kind === 'bank')         min = config.bank_deadline_min || 0;
    else if (kind === 'promote') min = config.promote_deadline_min || config.deadline_min || 0;
    else                         min = config.deadline_min || 0;
  }
  if (!min) return new Date(fromDate.getTime() + DEADLINE_DAYS * 86400000);
  return new Date(fromDate.getTime() + min * 60000);
}

/** シートに入っている日時を Date にする（文字列でも Date でも受ける） */
function parseSheetDate_(v) {
  if (v instanceof Date) return v;
  var t = String(v || '').trim();
  if (!t) return null;
  var d = new Date(t.replace(/-/g, '/'));   // Safari対策と同じ書き方でそろえる
  return isNaN(d.getTime()) ? null : d;
}

/** そのセミナーで「短い期限」を使っているか（＝分きざみの運用か） */
function usesShortDeadline_(config) {
  return !!(config && config.deadline_min);
}
var DATA_START_ROW = 10; // データ開始行
var KANA_COL  = 15;      // O列＝読み仮名（v8.5で末尾に追加）
var INSTA_COL = 16;      // P列＝インスタユーザー名（v8.9で末尾に追加・マーケのみ）
var LAST_COL  = 16;      // P列まで

// ========== エンドポイント ==========
function doGet(e)  { return handleRequest_(e); }
function doPost(e) { return handleRequest_(e); }

function handleRequest_(e) {
  var p = {};
  try {
    if (e && e.postData && e.postData.contents) {
      try { p = JSON.parse(e.postData.contents); }
      catch(_) { p = e.parameter || {}; }
    } else if (e && e.parameter) {
      p = e.parameter;
    }

    var action = p.action || 'ping';

    // 管理者専用アクション（名簿閲覧・状態操作は管理キー必須）
    var ADMIN_ACTIONS = ['admin_summary', 'read_sheet', 'admin_update_status', 'admin_promote',
                         'admin_save_push_token', 'admin_test_push', 'admin_set_test_pay',
                         'admin_set_gate',
                         'admin_news_list', 'admin_news_save', 'admin_news_send',
                         'admin_news_count', 'admin_news_delete',
                         'admin_submit_dryrun', 'admin_news_test'];
    if (ADMIN_ACTIONS.indexOf(action) !== -1) {
      if (String(p.token) !== String(ADMIN_TOKEN)) {
        return out_({ ok: false, error: 'unauthorized' });
      }
      if (action === 'admin_summary')         return adminSummary_();
      if (action === 'read_sheet')            return readSheet_(p);
      if (action === 'admin_update_status')   return adminUpdateStatus_(p);
      if (action === 'admin_promote')         return manualPromote_(p);
      if (action === 'admin_save_push_token') return adminSavePushToken_(p);
      if (action === 'admin_test_push')       return adminTestPush_(p);
      if (action === 'admin_set_test_pay')    return adminSetTestPay_(p);
      if (action === 'admin_set_gate')        return adminSetGate_(p);
      if (action === 'admin_news_list')       return adminNewsList_();
      if (action === 'admin_news_save')       return adminNewsSave_(p);
      if (action === 'admin_news_send')       return adminNewsSend_(p);
      if (action === 'admin_news_count')      return adminNewsCount_(p);
      if (action === 'admin_news_delete')     return adminNewsDelete_(p);
      if (action === 'admin_submit_dryrun')   return submitApplication_(p, true);
      if (action === 'admin_news_test')       return adminNewsTest_(p);
    }

    // トークン認証（一般）
    if (String(p.token) !== String(TOKEN)) {
      return out_({ ok: false, error: 'unauthorized' });
    }

    if (action === 'ping')                 return out_({ ok: true, message: 'GAS alive' });
    // --- v1（プロライン連携） ---
    if (action === 'form_submitted')       return handleFormSubmit_(p);
    if (action === 'payment_completed')    return handlePaymentComplete_(p);
    if (action === 'choose_payment')       return choosePayment_(p);
    if (action === 'manual_promote')       return manualPromote_(p);
    if (action === 'check_expired')        return out_(checkExpired());
    // --- v2（Webアプリ用） ---
    if (action === 'get_status')           return getStatus_(p);
    if (action === 'submit_application')   return submitApplication_(p);
    if (action === 'report_bank_transfer') return reportBankTransfer_(p);
    if (action === 'report_card_payment')  return reportCardPayment_(p);
    if (action === 'get_capacity')         return getCapacity_(p);
    if (action === 'cancel_application')   return cancelApplication_(p);
    if (action === 'save_kana')            return saveKana_(p);
    // --- v9.1 マーケ（LINEを通らない申込） ---
    // LINEなし方式の入口。いまは閉じている（MARKE_NO_LINE = false）
    if (['submit_marke', 'marke_paid', 'marke_lookup', 'marke_to_wait'].indexOf(action) !== -1) {
      if (!MARKE_NO_LINE) return out_({ ok: false, error: 'marke_no_line_disabled' });
      if (action === 'submit_marke')       return submitMarke_(p);
      if (action === 'marke_paid')         return markePaid_(p);
      if (action === 'marke_lookup')       return markeLookup_(p);
      if (action === 'marke_to_wait')      return markeToWait_(p);
    }

    return out_({ ok: false, error: 'unknown action: ' + action });
  } catch (err) {
    // Google側が一時的に「混んでいる」と言ってきた場合は、
    // 失敗ではなく busy として返す。アプリが少し待って自動でやり直す。
    if (isTransientError_(err)) {
      try { logAction_('busy', (p && p.uid) || '', '', 'transient: ' + String(err).slice(0, 120), ''); } catch (_) {}
      return out_({ ok: false, error: 'busy', retry: true });
    }
    return out_({ ok: false, error: String(err) });
  }
}

/**
 * 「待てば直る」たぐいのエラーかどうか。
 * 例：同時にスプレッドシートを触りすぎたときにGoogleが返すもの。
 * 募集開始直後の一斉アクセスで実際に発生する（100人同時で数件）。
 */
function isTransientError_(err) {
  var m = String(err && err.message ? err.message : err);
  var signs = [
    '同時呼び出し',            // 同時呼び出しの数が多すぎます: スプレッドシート
    'too many',               // Too many simultaneous invocations
    'simultaneous',
    'Service invoked too many times',
    'サービスの呼び出し回数',
    'Timed out',
    'タイムアウト',
    'try again',
    'しばらくしてからもう一度',
    'internal error',
    '内部エラー'
  ];
  for (var i = 0; i < signs.length; i++) {
    if (m.toLowerCase().indexOf(signs[i].toLowerCase()) !== -1) return true;
  }
  return false;
}

// ========== 【v6】運営プッシュ通知（FCM・エルラボ＋と同方式） ==========
// 必要なスクリプトプロパティ：FCM_CLIENT_EMAIL / FCM_PRIVATE_KEY（エルラボGASからコピー）
var ADMIN_APP_URL = 'https://apps.l-mine.com/kamiya-seminar-reception/admin.html';

/** 通知先トークンを保存するシート */
function pushSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('🔔 通知先');
  if (!sh) { sh = ss.insertSheet('🔔 通知先'); sh.appendRow(['token', '端末名', '登録日時']); }
  return sh;
}

/** 通知トークン登録（同一トークンは日時更新） */
function adminSavePushToken_(p) {
  var token = String(p.push_token || '').trim();
  if (!token) return out_({ ok: false, error: 'no_token' });
  var sh = pushSheet_();
  var v = sh.getDataRange().getValues();
  var now = formatDate_(new Date());
  for (var r = 1; r < v.length; r++) {
    if (String(v[r][0]) === token) {
      sh.getRange(r + 1, 3).setValue(now);
      if (p.label) sh.getRange(r + 1, 2).setValue(String(p.label));
      return out_({ ok: true, dup: true });
    }
  }
  sh.appendRow([token, String(p.label || ''), now]);
  logAction_('push_token_registered', '', '', String(p.label || ''), '');
  return out_({ ok: true });
}

/** テスト通知（指定トークンのみ／未指定なら全端末） */
function adminTestPush_(p) {
  var at = getFcmAccessToken_();
  if (!at) return out_({ ok: false, error: 'no_fcm_credentials' });
  var tokens = [];
  if (p.push_token) {
    tokens = [String(p.push_token)];
  } else {
    var v = pushSheet_().getDataRange().getValues();
    for (var r = 1; r < v.length; r++) { var t = String(v[r][0] || '').trim(); if (t) tokens.push(t); }
  }
  var res = fcmSend_(at, tokens, '🔔 テスト通知', '受付管理システムの通知テストです。この通知が見えていれば設定完了です！', ADMIN_APP_URL);
  return out_({ ok: true, sent: res.sent, total: res.total });
}

/** 運営全端末へ通知（鍵未設定なら静かにスキップ） */
function notifyOps_(title, body) {
  try {
    var at = getFcmAccessToken_();
    if (!at) return;
    var v = pushSheet_().getDataRange().getValues();
    var tokens = [];
    for (var r = 1; r < v.length; r++) { var t = String(v[r][0] || '').trim(); if (t) tokens.push(t); }
    if (!tokens.length) return;
    fcmSend_(at, tokens, title, body, ADMIN_APP_URL);
  } catch (err) {
    try { logAction_('error', '', '', 'notifyOps: ' + err, ''); } catch (_) {}
  }
}

/** FCM v1 送信（失効トークンは自動削除） */
function fcmSend_(at, tokens, title, body, url) {
  if (!tokens.length) return { sent: 0, total: 0 };
  var reqs = tokens.map(function (t) {
    return {
      url: 'https://fcm.googleapis.com/v1/projects/elabo-plus/messages:send',
      method: 'post', contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + at }, muteHttpExceptions: true,
      payload: JSON.stringify({ message: { token: t, data: { title: title, body: body, url: url || ADMIN_APP_URL } } })
    };
  });
  var sent = 0; var dead = [];
  for (var i = 0; i < reqs.length; i += 100) {
    var res = UrlFetchApp.fetchAll(reqs.slice(i, i + 100));
    res.forEach(function (x, k) {
      var code = x.getResponseCode();
      if (code < 300) { sent++; return; }
      var t = String(x.getContentText() || '');
      if (code === 404 || /UNREGISTERED|INVALID_ARGUMENT|NOT_FOUND/i.test(t)) dead.push(tokens[i + k]);
    });
  }
  // 失効トークン削除
  if (dead.length) {
    var deadMap = {}; dead.forEach(function (t) { deadMap[t] = 1; });
    var sh = pushSheet_();
    var v = sh.getDataRange().getValues();
    for (var r = v.length - 1; r >= 1; r--) {
      if (deadMap[String(v[r][0] || '').trim()]) sh.deleteRow(r + 1);
    }
  }
  return { sent: sent, total: tokens.length };
}

/** サービスアカウントでFCM v1のアクセストークンを取得 */
function getFcmAccessToken_() {
  var props = PropertiesService.getScriptProperties();
  var email = props.getProperty('FCM_CLIENT_EMAIL');
  var key = props.getProperty('FCM_PRIVATE_KEY');
  if (!email || !key) return null;
  key = String(key).trim();
  if (key.charAt(0) === '{') {
    try { var o = JSON.parse(key); if (o.private_key) key = o.private_key; if (o.client_email) email = o.client_email; } catch (e) {}
  }
  key = key.replace(/^["']+|["']+$/g, '');
  key = key.replace(/\\r/g, '').replace(/\\n/g, '\n').replace(/\r/g, '').trim();
  var b64 = function (s) { return Utilities.base64EncodeWebSafe(s).replace(/=+$/, ''); };
  var now = Math.floor(Date.now() / 1000);
  var head = b64(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  var claim = b64(JSON.stringify({ iss: email, scope: 'https://www.googleapis.com/auth/firebase.messaging', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }));
  var input = head + '.' + claim;
  var sig = Utilities.base64EncodeWebSafe(Utilities.computeRsaSha256Signature(input, key)).replace(/=+$/, '');
  var jwt = input + '.' + sig;
  var res = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
    method: 'post', muteHttpExceptions: true,
    payload: { grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }
  });
  try { return JSON.parse(res.getContentText()).access_token || null; } catch (e) { return null; }
}

// ========== 【v4】管理者用サマリー（全セミナーの受付状況＋名簿） ==========
function adminSummary_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var result = { ok: true, generated_at: formatDate_(new Date()), seminars: {},
                 test_pay: isTestPayOn_(), gate_on: isGateOn_() };

  Object.keys(SEMINARS).forEach(function (key) {
    var config = SEMINARS[key];
    var sh = ss.getSheetByName(config.sheet);
    var rows = [];
    var counts = { '確定': 0, '決済案内中': 0, '振込報告済み': 0, 'キャンセル待ち': 0, '期限切れ': 0, 'キャンセル済': 0 };

    if (sh) {
      var lastRow = sh.getLastRow();
      if (lastRow >= DATA_START_ROW) {
        var data = sh.getRange(DATA_START_ROW, 1, lastRow - DATA_START_ROW + 1, LAST_COL).getValues();
        for (var i = 0; i < data.length; i++) {
          if (!data[i][0]) continue; // uid空行はスキップ
          var status = String(data[i][6] || '');
          if (counts.hasOwnProperty(status)) counts[status]++;
          rows.push({
            uid:      String(data[i][0]),
            name:     data[i][1] || '',
            email:    data[i][2] || '',
            phone:    data[i][3] || '',
            applied:  data[i][4] ? formatDateValue_(data[i][4]) : '',
            deadline: data[i][5] ? formatDateValue_(data[i][5]) : '',
            status:   status,
            wait_num: data[i][7] || '',
            paid_at:  data[i][8] ? formatDateValue_(data[i][8]) : '',
            method:   data[i][9] || '',
            memo:     data[i][10] || '',
            kana:     data[i][14] || '',   // O列：読み仮名
            insta:    data[i][15] || ''    // P列：インスタ（マーケのみ）
          });
        }
      }
    }

    var occupied = counts['確定'] + counts['決済案内中'] + counts['振込報告済み'];
    result.seminars[key] = {
      capacity: config.capacity,
      occupied: occupied,
      available: Math.max(0, config.capacity - occupied),
      counts: counts,
      rows: rows
    };
  });

  return out_(result);
}

// ========== 【v5】管理画面からの状態変更（通知も自動発火） ==========
function adminUpdateStatus_(p) {
  var config = SEMINARS[p.seminar];
  if (!config) return out_({ ok: false, error: 'unknown seminar' });
  var uid = String(p.uid || '');
  var newStatus = String(p.new_status || '');
  if (!uid || !newStatus) return out_({ ok: false, error: 'uid and new_status required' });

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(LOCK_WAIT_MS)) return out_({ ok: false, error: 'busy', retry: true });
  try {
    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(config.sheet);
    if (!sh) return out_({ ok: false, error: 'sheet not found' });
    var row = findRowByUid_(sh, uid);
    if (!row) return out_({ ok: false, error: 'user not found' });

    var prev = String(sh.getRange(row, 7).getValue());
    var now = new Date();

    if (newStatus === '確定') {
      sh.getRange(row, 6).setValue('');            // 期限クリア
      sh.getRange(row, 7).setValue('確定');
      sh.getRange(row, 8).setValue('');            // 待機順クリア
      sh.getRange(row, 9).setValue(formatDate_(now));
      if (!sh.getRange(row, 10).getValue()) sh.getRange(row, 10).setValue(p.method || '手動確認');
      moveScenario_(uid, '確定');

    } else if (newStatus === '期限切れ') {
      sh.getRange(row, 7).setValue('期限切れ');
      sh.getRange(row, 8).setValue('');
      moveScenario_(uid, '期限切れ');
      promoteNextWaiting_(sh);

    } else if (newStatus === 'キャンセル済') {
      sh.getRange(row, 7).setValue('キャンセル済');
      if (prev === 'キャンセル待ち') {
        var myNum = Number(sh.getRange(row, 8).getValue());
        sh.getRange(row, 8).setValue('');
        renumberWaiting_(sh, myNum);
      } else {
        sh.getRange(row, 8).setValue('');
        // 席を持っていた方のときだけ繰り上げる（v10.0：決済待ちも席を持つ）
        if (holdsSeat_(prev)) promoteNextWaiting_(sh);
      }
      moveScenario_(uid, 'キャンセル完了');

    } else if (newStatus === 'キャンセル待ち') {
      /* 空席があっても、ご本人の希望で待機に回すとき用（v8.8）。
         待機番号は【いまの最大＋1】を自動で振るので、順番は狂わない。
         ※空席があるうちは自動繰上げは起きない（繰上げはキャンセル・期限切れが
           起きたときに動くため）。すぐ席をお渡しするなら管理画面の
           「⬆ 待機1番を繰上げる」を押す。 */
      var maxWait = 0;
      var lastRowW = sh.getLastRow();
      if (lastRowW >= DATA_START_ROW) {
        var dataW = sh.getRange(DATA_START_ROW, 7, lastRowW - DATA_START_ROW + 1, 2).getValues();
        for (var w = 0; w < dataW.length; w++) {
          if (dataW[w][0] === 'キャンセル待ち') {
            var wnw = Number(dataW[w][1]);
            if (wnw > maxWait) maxWait = wnw;
          }
        }
      }
      sh.getRange(row, 6).setValue('');              // 決済期限はクリア
      sh.getRange(row, 7).setValue('キャンセル待ち');
      sh.getRange(row, 8).setValue(maxWait + 1);     // 最後尾に並ぶ
      moveScenario_(uid, 'キャンセル待ち');

    } else if (newStatus === '決済案内中') {
      // 復帰（期限切れ・キャンセル済からの救済など）：期限は今から3日
      var prevWaitNum = Number(sh.getRange(row, 8).getValue());
      sh.getRange(row, 6).setValue(formatDate_(new Date(now.getTime() + DEADLINE_DAYS * 86400000)));
      sh.getRange(row, 7).setValue('決済案内中');
      sh.getRange(row, 8).setValue('');

      /* キャンセル待ちからの繰り上げ（v9.0）。
         自動繰り上げ（promoteNextWaiting_）と同じ後始末をここでも行う：
         後ろの方の待機番号を1つずつ詰めて、ご本人へ⑤「空きができました」を送る。
         ※お一人を指名して繰り上げられるようにするための分岐。 */
      if (prev === 'キャンセル待ち') {
        if (prevWaitNum > 0) renumberWaiting_(sh, prevWaitNum);
        moveScenario_(uid, '空きできました');
        notifyOps_('⬆ 繰上げました',
          (sh.getRange(row, 2).getValue() || 'どなたか') + ' さんを繰上げました（' + config.sheet + '）。');
      }

    } else {
      return out_({ ok: false, error: 'unknown status: ' + newStatus });
    }

    logAction_('admin_update_status', uid, config.sheet, prev + ' → ' + newStatus, '管理画面から操作');
    return out_({ ok: true, prev: prev, status: newStatus });
  } finally {
    lock.releaseLock();
  }
}

// ========== 【v2】uid状態取得 ==========
/**
 * 読み仮名の表記をそろえる。
 *   ・半角カナ → 全角カナ（NFKC。濁点もまとめてくれる）
 *   ・ひらがな → カタカナ
 *   ・全角スペース → 半角、連続スペースは1つに
 */
/** インスタのユーザー名を必要とするセミナーか（マーケのみ） */
function needsInsta_(seminarKey) {
  return String(seminarKey || '').indexOf('marke') === 0;
}

/** インスタのユーザー名を整える（@や余分な空白・URLを外す） */
function normalizeInsta_(v) {
  var t = String(v || '').trim();
  try { t = t.normalize('NFKC'); } catch (_) {}
  t = t.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '');  // URLを貼られた場合
  t = t.replace(/[\/?#].*$/, '');                                 // 後ろの余計な部分
  t = t.replace(/^@+/, '').trim();                                // 先頭の@
  return t.slice(0, 40);
}

function normalizeKana_(v) {
  var t = String(v || '');
  try { t = t.normalize('NFKC'); } catch (_) {}
  t = t.replace(/[\u3041-\u3096]/g, function (c) {
    return String.fromCharCode(c.charCodeAt(0) + 0x60);
  });
  return t.replace(/\s+/g, ' ').trim();
}

/** カタカナ（と長音・中黒・スペース）だけでできているか */
function isKana_(v) {
  return /^[\u30A1-\u30F6\u30FC\u30FB ]+$/.test(String(v || ''));
}

/**
 * 読み仮名をあとから登録する（すでにお申込み済みの方むけ）。
 * 複数のセミナーに申し込んでいる方は、その【すべての行】に入れる。
 */
function saveKana_(p) {
  var uid = String(p.uid || '');
  var kana = normalizeKana_(p.kana);
  if (!uid)  return out_({ ok: false, error: 'uid required' });
  if (!kana) return out_({ ok: false, error: 'kana required' });
  if (kana.length > 60) kana = kana.slice(0, 60);
  // ここは席の取り合いが絡まないので、カタカナ以外はきちんとお断りする
  if (!isKana_(kana)) return out_({ ok: false, error: 'kana_invalid' });

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var saved = 0;
  Object.keys(SEMINARS).forEach(function (key) {
    var sh = ss.getSheetByName(SEMINARS[key].sheet);
    if (!sh) return;
    var lastRow = sh.getLastRow();
    if (lastRow < DATA_START_ROW) return;
    var col = sh.getRange(DATA_START_ROW, 1, lastRow - DATA_START_ROW + 1, 1).getValues();
    for (var i = 0; i < col.length; i++) {
      if (String(col[i][0]) !== uid) continue;
      sh.getRange(DATA_START_ROW + i, KANA_COL).setValue(kana);
      saved++;
    }
  });

  if (!saved) return out_({ ok: false, error: 'not found' });
  logAction_('save_kana', uid, '', kana, saved + '件に登録');
  return out_({ ok: true, kana: kana, saved: saved });
}

function getStatus_(p) {
  var uid = String(p.uid || '');
  if (!uid) return out_({ ok: false, error: 'uid required' });

  // 入口セミナーの指定があれば、そのセミナーの申込を優先して返す（複数申込対策・v7.1）
  var found = null;
  if (p.seminar && SEMINARS[p.seminar]) found = findUserInSeminar_(uid, p.seminar);
  if (!found) found = findUserAcrossSeminars_(uid);
  if (!found) {
    return out_({ ok: true, uid: uid, seminar: null, status: '未登録' });
  }

  var row = found.data;

  /* 状態（G列）が空の行を守る（v11.0）。
     スプレッドシートで状態のセルだけ消してしまうと、アプリが行き先を失って
     「読み込みできませんでした」になっていた。
     ここでは『確認中』という状態にしてお客さまに落ち着いた画面をお見せし、
     運営へお知らせして直していただく。通知は1時間に1回まで。 */
  var statusText = String(row[6] || '').trim();
  if (!statusText) {
    statusText = '確認中';
    try {
      var cache = CacheService.getScriptCache();
      var key = 'blankstatus_' + uid;
      if (!cache.get(key)) {
        cache.put(key, '1', 3600);
        notifyOps_('⚠️ 状態が空のお申込みがあります',
          (row[1] || 'お名前未記入') + ' 様（' + SEMINARS[found.seminarKey].sheet.replace('📋 ', '') + '）の' +
          '「状態」欄が空になっています。スプレッドシートでご確認ください。' +
          'そのままだと、お客さまのアプリに画面が出せません。');
        logAction_('blank_status', uid, SEMINARS[found.seminarKey].sheet, '状態が空', '');
      }
    } catch (_) {}
  }

  return out_({
    ok: true,
    uid: uid,
    seminar: found.seminarKey,
    status: statusText,
    deadline: row[5] ? formatDateValue_(row[5]) : null,
    wait_number: row[7] || null,
    name: row[1] || '',
    kana: row[14] || '',
    insta: row[15] || '',
    // 読み仮名がまだ無い方には、アプリで入力をお願いする（v8.5）
    need_kana: !String(row[14] || '').trim() && ['確定', '決済案内中', '振込報告済み', 'キャンセル待ち', MARKE_PENDING].indexOf(String(row[6])) !== -1,
    payment_completed: row[6] === '確定',
    payment_method: row[9] || '',
    // お支払い期限の長さ（分）。画面の文言はこれを見て作るので、
    // 期限を変えるときは SEMINARS の数字だけ直せばよい（v10.5）
    deadline_min:         (SEMINARS[found.seminarKey] || {}).deadline_min || null,
    bank_deadline_min:    (SEMINARS[found.seminarKey] || {}).bank_deadline_min || null,
    // 繰上げのご案内が届いてから、お手続きいただくまでの長さ（分）
    promote_deadline_min: (SEMINARS[found.seminarKey] || {}).promote_deadline_min || null,
    test_pay: isTestPayOn_(),
    news: pickNews_(found.seminarKey, String(row[6] || ''))   // 📣 お知らせ（v7.7）
  });
}

// ========== 【v6.5】テスト決済モード（マーケ一般） ==========
// ONの間、マーケ一般の決済画面がテスト用Stripe決済ページに切り替わる
function isTestPayOn_() {
  try {
    return PropertiesService.getScriptProperties().getProperty('TEST_PAY_MARKE_GENERAL') === '1';
  } catch (_) { return false; }
}

function adminSetTestPay_(p) {
  var v = String(p.value) === '1' ? '1' : '0';
  PropertiesService.getScriptProperties().setProperty('TEST_PAY_MARKE_GENERAL', v);
  logAction_('test_pay_mode', '', '', v === '1' ? 'ON' : 'OFF', '管理画面から切替');
  return out_({ ok: true, test_pay: v === '1' });
}

// ========== 【v6.7】受付開始ゲート（募集開始前は申し込めないようにする） ==========
// デフォルトはON。ONの間、SEMINARSのopen_atより前は受付フォームがカウントダウン画面になる。
// 事前テストのときだけ管理画面のスイッチでOFFにする（OFFでも動作に支障はないが、フライング申込が可能になる）
/* ゲートをOFFにできる時間の上限。テストは数分で終わるので、
   これを過ぎたら自動でONへ戻す（戻し忘れると募集開始前に申し込まれてしまうため） */
var GATE_OFF_MINUTES = 30;

function isGateOn_() {
  try {
    var props = PropertiesService.getScriptProperties();
    if (props.getProperty('RECEPTION_GATE') !== '0') return true;

    // OFFになっている。期限を過ぎていたら自動でONに戻す
    var until = Number(props.getProperty('GATE_OFF_UNTIL') || 0);
    if (!until || new Date().getTime() > until) {
      props.setProperty('RECEPTION_GATE', '1');
      props.deleteProperty('GATE_OFF_UNTIL');
      try {
        logAction_('reception_gate', '', '', 'ON', GATE_OFF_MINUTES + '分たったので自動で戻しました');
        notifyOps_('⏳ 受付開始ゲートを自動でONに戻しました',
          'OFFのまま' + GATE_OFF_MINUTES + '分が過ぎたため、安全のためONに戻しました。' +
          'テスト中でしたら、もう一度OFFにしてください。');
      } catch (_) {}
      return true;
    }
    return false;
  } catch (_) { return true; }
}

function adminSetGate_(p) {
  var v = String(p.value) === '0' ? '0' : '1';
  var props = PropertiesService.getScriptProperties();
  props.setProperty('RECEPTION_GATE', v);
  if (v === '0') {
    // OFFにするときは期限をつける。過ぎたら isGateOn_ が自動でONへ戻す
    props.setProperty('GATE_OFF_UNTIL', String(new Date().getTime() + GATE_OFF_MINUTES * 60000));
  } else {
    props.deleteProperty('GATE_OFF_UNTIL');
  }
  logAction_('reception_gate', '', '', v === '1' ? 'ON' : 'OFF',
    '管理画面から切替' + (v === '0' ? '（' + GATE_OFF_MINUTES + '分で自動的にONへ戻ります）' : ''));
  return out_({ ok: true, gate_on: v === '1', off_minutes: (v === '0' ? GATE_OFF_MINUTES : 0) });
}

/** 募集開始日時をDateで返す（未設定・不正ならnull） */
/** 申込の締切日時。close_at が無ければ「締切なし」 */
function closeAtDate_(config) {
  if (!config || !config.close_at) return null;
  var s = String(config.close_at).trim().replace(' ', 'T');
  if (s.length === 16) s += ':00';
  var d = new Date(s + '+09:00');   // 日本時間として確定させる
  return isNaN(d.getTime()) ? null : d;
}

function openAtDate_(config) {
  if (!config || !config.open_at) return null;
  var s = String(config.open_at).trim().replace(' ', 'T');
  if (s.length === 16) s += ':00';
  var d = new Date(s + '+09:00');   // 日本時間として確定させる
  return isNaN(d.getTime()) ? null : d;
}

/** そのセミナーの受付が開いているか（ゲートOFF・open_at未設定なら常に開いている扱い） */
function gateInfo_(seminarKey) {
  var config = SEMINARS[seminarKey];
  var openAt = openAtDate_(config);
  var closeAt = closeAtDate_(config);
  var gateOn = isGateOn_();
  var now = new Date().getTime();
  return {
    gate_on: gateOn,
    is_open: (!gateOn || !openAt || now >= openAt.getTime()),
    // 締切はゲートのオンオフに関係なく効く（開催後の申込を止めるためのもの）
    is_closed: (!!closeAt && now > closeAt.getTime()),
    open_at: (config && config.open_at) ? String(config.open_at) : '',
    close_at: (config && config.close_at) ? String(config.close_at) : ''
  };
}

// ========== 【v2】Webアプリからの申込受信 ==========
/**
 * 申込を受け付ける。
 * @param {boolean} dryRun trueなら「どう処理されるか」を計算して返すだけ。
 *   行の追加もLINE送信も一切しない。本番稼働中に混雑テストをするための入口で、
 *   管理キーが要る（admin_submit_dryrun）。お客さまからは呼べない。
 */
/* =====================================================================
 * マーケティングセミナー（2026-08-27〜 LINEを使わない方式）
 *
 * 【従来との違い】
 *   ・LINEを通らないので uid が無い。代わりに【申込ID】を発行してA列に入れる。
 *     A列は「本人を見分ける鍵」でしかないので、中身がuidでも申込IDでも同じに動く。
 *   ・受付できた時点でお席を MARKE_HOLD_MIN 分だけ確保する（状態＝「決済待ち」）。
 *     確保中の方も残席から引くので、15人分埋まると16人目は受付の段階で
 *     「満席」になり、決済ページに入れない（v10.0）。
 *   ・通知はしない。神谷さんがDMでご案内し、お客さまがご自分でアプリを開く。
 *     開く鍵は「メールアドレス＋生年月日」（markeLookup_）。
 * ===================================================================== */

/* ★ マーケ一般の方式スイッチ（v10.1 2026-09-02）
     false … 当初どおり【公式LINE連携】。apply.html から受付し、
              プロライン経由でStripe決済。← いまはこちら
     true  … LINEを使わない方式。marke.html から受付し、
              受付時にお席を確保してStripeの決済リンクへ。
     戻すときは、この1行を true にして marke.html を復活させるだけ。 */
var MARKE_NO_LINE = false;

var MARKE_PENDING = '決済待ち';   // LINEなし方式のみ。受付済み・未決済でお席を確保
var MARKE_HOLD_MIN = 20;          // 受付後、お席を確保しておく時間（分）

/**
 * その状態が「席を持っている」かどうか。
 * 「決済待ち」も席を持つ（v10.0）。確保時間を過ぎたものは checkExpired が
 * 「期限切れ」に落とすので、ここでは持っている扱いのまま（多めに数える側に倒す）。
 */
function holdsSeat_(status) {
  var held = ['確定', '決済案内中', '振込報告済み'];
  if (MARKE_NO_LINE) held.push(MARKE_PENDING);
  return held.indexOf(String(status)) !== -1;
}

/**
 * その行が「いま席を押さえているか」を、確保期限まで見て判定する。
 * 残席を数えるところは、すべてこれを通すこと。
 *   status   … G列
 *   deadline … F列（決済待ちのときだけ意味を持つ）
 */
function seatHeld_(status, deadline, now) {
  var st = String(status);
  if (['確定', '決済案内中', '振込報告済み'].indexOf(st) !== -1) return true;
  if (!MARKE_NO_LINE) return false;               // LINE連携方式では「決済待ち」は使わない
  if (st !== MARKE_PENDING) return false;
  if (!deadline) return false;                    // 期限なしの古い行は席を持たない
  var dl = new Date(deadline);
  if (isNaN(dl.getTime())) return false;
  return dl > (now || new Date());
}

/** お席の確保期限（いまから MARKE_HOLD_MIN 分後） */
function markeHoldUntil_() {
  return new Date(Date.now() + MARKE_HOLD_MIN * 60000);
}

/** 申込ID（LINEのuidの代わり）。まぎらわしい文字は使わない */
function newAppId_() {
  var chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  var t = '';
  for (var i = 0; i < 8; i++) t += chars.charAt(Math.floor(Math.random() * chars.length));
  return 'MK-' + t;
}

/** 生年月日の表記をそろえる（yyyy-MM-dd の文字列にする） */
function normalizeBirthday_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, 'Asia/Tokyo', 'yyyy-MM-dd');
  var t = String(v || '').trim();
  var m = t.match(/^(\d{4})[-\/年]\s*(\d{1,2})[-\/月]\s*(\d{1,2})/);
  if (!m) return t;
  return m[1] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[3]).slice(-2);
}

function normalizeEmail_(v) {
  return String(v || '').trim().toLowerCase();
}

/**
 * マーケの申込を受け付ける。
 *   mode=wait … キャンセル待ちとして登録（決済なし）
 *   それ以外  … 「決済待ち」で登録。席は押さえない
 */
function submitMarke_(p) {
  var seminarKey = p.seminar || 'marke_general';
  var config = SEMINARS[seminarKey];
  if (!config) return out_({ ok: false, error: 'unknown seminar' });

  var email = normalizeEmail_(p.email);
  var birthday = normalizeBirthday_(p.birthday);
  if (!email)    return out_({ ok: false, error: 'email required' });
  if (!birthday) return out_({ ok: false, error: 'birthday required' });

  var gate = gateInfo_(seminarKey);
  if (!gate.is_open)  return out_({ ok: false, error: 'not_open_yet', open_at: gate.open_at });
  if (gate.is_closed) return out_({ ok: false, error: 'closed', close_at: gate.close_at });

  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(config.sheet);
  if (!sh) return out_({ ok: false, error: 'sheet not found' });

  var wantWait = (String(p.mode || '') === 'wait');

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(LOCK_WAIT_MS)) return out_({ ok: false, error: 'busy', retry: true });

  var appId = '', status = '', waitNum = '', holdUntil = null;
  try {
    var now = new Date();
    var lastRow = sh.getLastRow();
    var rows = (lastRow >= DATA_START_ROW)
      ? sh.getRange(DATA_START_ROW, 1, lastRow - DATA_START_ROW + 1, 8).getValues()
      : [];

    var maxWait = 0, used = {}, seats = 0, dupIdx = -1;
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (r[0]) used[String(r[0])] = true;
      // 同じメールアドレスで、まだ生きているお申込みがないか
      if (dupIdx === -1 && normalizeEmail_(r[2]) === email &&
          ['キャンセル済', '期限切れ'].indexOf(String(r[6])) === -1) {
        dupIdx = i;
      }
      if (seatHeld_(r[6], r[5], now)) seats++;
      else if (r[6] === 'キャンセル待ち') {
        var wn = Number(r[7]);
        if (wn > maxWait) maxWait = wn;
      }
    }

    // ---- すでにお申込みがある方 --------------------------------------
    if (dupIdx !== -1) {
      var dupRow = DATA_START_ROW + dupIdx;
      var dupSt  = String(rows[dupIdx][6]);
      if (dupSt !== MARKE_PENDING) {
        return out_({ ok: true, already: true, app_id: String(rows[dupIdx][0]), status: dupSt });
      }
      // 決済待ち。確保が生きていればそのまま、切れていれば取り直す
      if (seatHeld_(dupSt, rows[dupIdx][5], now)) {
        return out_({ ok: true, already: true, app_id: String(rows[dupIdx][0]), status: dupSt,
                      hold_until: formatDateValue_(rows[dupIdx][5]) });
      }
      if (seats >= config.capacity) {
        return out_({ ok: false, error: 'full', app_id: String(rows[dupIdx][0]) });
      }
      var again = markeHoldUntil_();
      sh.getRange(dupRow, 6).setValue(formatDate_(again));
      capacityCacheClear_(seminarKey);
      return out_({ ok: true, already: true, app_id: String(rows[dupIdx][0]), status: MARKE_PENDING,
                    hold_until: formatDate_(again) });
    }

    // ---- 満席のときは受け付けない（＝決済ページに入れない）------------
    if (!wantWait && seats >= config.capacity) {
      return out_({ ok: false, error: 'full' });
    }

    do { appId = newAppId_(); } while (used[appId]);

    var deadlineCell = '';
    if (wantWait) {
      status = 'キャンセル待ち'; waitNum = maxWait + 1;
    } else {
      status = MARKE_PENDING; waitNum = '';
      holdUntil = markeHoldUntil_();
      deadlineCell = formatDate_(holdUntil);
    }

    sh.appendRow([
      appId,
      p.name || '',
      p.email || '',
      p.phone || '',
      formatDate_(new Date()),
      deadlineCell,  // F:お席の確保期限（決済待ちのみ）
      status,
      waitNum,
      '', '', '',    // I:決済日時 J:決済方法 K:備考
      birthday,
      p.job || '',
      p.worries || '',
      normalizeKana_(p.kana),
      normalizeInsta_(p.insta)
    ]);
  } finally {
    lock.releaseLock();
  }

  capacityCacheClear_(seminarKey);
  logAction_('marke_apply', appId, config.sheet, '→ ' + status, 'アプリ（LINEなし）');
  if (status === 'キャンセル待ち') {
    notifyOps_('⏳ キャンセル待ちのお申込み（' + config.sheet.replace('📋 ', '') + '）',
      (p.name || 'お名前未記入') + ' 様が待機' + waitNum + '番目に入りました。');
  }
  return out_({ ok: true, app_id: appId, status: status, wait_num: waitNum,
                hold_until: holdUntil ? formatDate_(holdUntil) : null,
                hold_minutes: MARKE_HOLD_MIN });
}

/**
 * 【v10.2】ご参加が確定するたびに人数を数え、定員を超えていたら運営へお知らせする。
 * 期限を過ぎたあとのご入金は返金せずお受けする決まりなので、定員（15名）を
 * 超えることがある。会場の上限（max_attendees）に近づいたら強めにお伝えする。
 * ※ここは「知らせるだけ」。受付を止めたり、確定を取り消したりはしない。
 */
function watchAttendees_(sh, seminarKey) {
  try {
    var config = SEMINARS[seminarKey];
    if (!config || !config.max_attendees) return;

    var confirmed = countByStatuses_(sh, ['確定']);
    if (confirmed <= config.capacity) return;      // 定員内なら何も言わない

    var over = confirmed - config.capacity;
    var name = config.sheet.replace('📋 ', '');

    if (confirmed >= config.max_attendees) {
      notifyOps_('🚨 会場の上限に達しました（' + name + '）',
        'ご参加確定が' + confirmed + '名になりました（定員' + config.capacity +
        '名／会場上限' + config.max_attendees + '名）。' +
        'これ以上はお受けできません。振込のご案内を止めるなど、ご対応をお願いいたします。');
    } else {
      notifyOps_('⚠️ 定員を' + over + '名超えています（' + name + '）',
        'ご参加確定が' + confirmed + '名になりました（定員' + config.capacity +
        '名／会場上限' + config.max_attendees + '名）。' +
        '期限後のご入金をお受けした分です。会場の席数をご確認くださいませ。');
    }
    logAction_('over_capacity', '', config.sheet, confirmed + '名（定員' + config.capacity + '）', '');
  } catch (err) {
    logAction_('error', '', '', 'watchAttendees failed: ' + err, '');
  }
}

/**
 * お支払い方法をお選びいただいたときに呼ばれる（v10.2）。
 *   method='bank' … 銀行振込。お選びいただいた時点から bank_deadline_min 分に期限を延ばす
 *   method='card' … カード。期限は受付時のまま（変えない）
 * どちらもJ列（決済方法）に記録しておき、運営がひと目で分かるようにする。
 * ※「決済案内中」の方だけ。確定済み・キャンセル済みの方は動かさない。
 */
function choosePayment_(p) {
  var uid = String(p.uid || '').trim();
  var method = String(p.method || '').trim();
  if (!uid) return out_({ ok: false, error: 'uid required' });
  if (['card', 'bank'].indexOf(method) === -1) return out_({ ok: false, error: 'bad method' });

  /* ここではロックを取らない（v10.4）。
     触るのはご本人の行のF列とJ列だけで、定員の判断はしていない。
     ロックを取ると、受付が殺到しているあいだ submit_application と
     取り合ってしまい、お客さまに「混み合っております」が出てしまう。 */
  var found = (p.seminar && SEMINARS[p.seminar])
    ? findUserInSeminar_(uid, p.seminar)
    : findUserAcrossSeminars_(uid);
  if (!found) return out_({ ok: false, error: 'user not found' });

  var status = String(found.data[6]);
  if (status !== '決済案内中') {
    return out_({ ok: false, error: 'not_payable', status: status });
  }

  var config = SEMINARS[found.seminarKey];
  var baseLabel = (method === 'bank') ? '銀行振込' : 'カード';

  /* お支払い方法の変更は1回まで（v11.1）。
     列を増やさず、J列に「（変更）」の印を残して見分ける。
       空            … まだ選んでいない（初回）
       カード        … 1回目を選んだ状態。変更できる
       カード（変更）… もう変更した。これ以上は変えられない
     同じ方法を選び直した場合は、変更に数えない。 */
  var curMethod = String(found.data[9] || '').trim();
  var curBase = curMethod.replace('（変更）', '');

  if (curBase === baseLabel) {
    // 同じ方法。何も変えずに、いまの状態をそのまま返す
    return out_({ ok: true, unchanged: true, method: method, label: curMethod,
                  deadline: found.data[5] ? formatDateValue_(found.data[5]) : '' });
  }
  if (curMethod.indexOf('（変更）') !== -1) {
    return out_({ ok: false, error: 'change_limit', label: curMethod });
  }

  var label = baseLabel + (curBase ? '（変更）' : '');

  /* お支払い方法を選び直しても期限を延ばせないようにする（v10.9）。
       銀行振込 … 【受付日時】から数える。何度選び直しても延びない。
       カード   … 【いまから20分】と【いまの期限】の短いほう。
                  振込で24時間にしたあとカードへ戻しても、そこから20分に締まる。
     どちらも「選び直すと得をする」ことがない形にしてある。 */
  var appliedAt = parseSheetDate_(found.data[4]) || new Date();
  var newDate;

  if (method === 'bank') {
    newDate = deadlineFrom_(config, appliedAt, 'bank');
  } else {
    var byCard = deadlineFrom_(config, new Date(), 'card');
    var cur = parseSheetDate_(found.data[5]);
    newDate = (cur && cur.getTime() < byCard.getTime()) ? cur : byCard;
  }

  var newDeadline = formatDate_(newDate);
  found.sheet.getRange(found.row, 6).setValue(newDeadline);
  found.sheet.getRange(found.row, 10).setValue(label);

  logAction_('choose_payment', uid, '', '→ ' + label, 'お客さまが選択');
  return out_({ ok: true, method: method, label: label, deadline: newDeadline });
}

/**
 * Stripeの決済が終わって戻ってきたとき、「確定」にする。
 * ※ご自分のお席の確保が生きていれば、必ず「確定」になる。
 *   確保が切れたあとにお支払いされた場合だけ、保険としてキャンセル待ちに回す。
 */
function markePaid_(p) {
  var seminarKey = p.seminar || 'marke_general';
  var config = SEMINARS[seminarKey];
  if (!config) return out_({ ok: false, error: 'unknown seminar' });
  var appId = String(p.app_id || '').trim();
  if (!appId) return out_({ ok: false, error: 'app_id required' });

  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(config.sheet);
  if (!sh) return out_({ ok: false, error: 'sheet not found' });

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(LOCK_WAIT_MS)) return out_({ ok: false, error: 'busy', retry: true });

  var status = '', waitNum = '', name = '';
  try {
    var lastRow = sh.getLastRow();
    if (lastRow < DATA_START_ROW) return out_({ ok: false, error: 'not found' });
    var rows = sh.getRange(DATA_START_ROW, 1, lastRow - DATA_START_ROW + 1, 8).getValues();

    var now = new Date();
    var myIdx = -1, others = 0, maxWait = 0;
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (String(r[0]) === appId) { myIdx = i; name = String(r[1]); continue; }
      if (seatHeld_(r[6], r[5], now)) others++;   // ご自分以外が押さえている席
      else if (r[6] === 'キャンセル待ち') {
        var wn = Number(r[7]);
        if (wn > maxWait) maxWait = wn;
      }
    }
    if (myIdx === -1) return out_({ ok: false, error: 'not found' });

    // ご自分のお席の確保が生きていれば、それを確定に変えるだけ（必ず入れる）
    var myHold = seatHeld_(rows[myIdx][6], rows[myIdx][5], now);
    var confirmed = myHold ? 0 : others;

    var row = DATA_START_ROW + myIdx;
    var prev = String(rows[myIdx][6]);
    if (prev === '確定') {
      return out_({ ok: true, already: true, status: '確定', app_id: appId });
    }

    if (myHold || confirmed < config.capacity) {
      status = '確定'; waitNum = '';
      sh.getRange(row, 6).setValue('');
      sh.getRange(row, 7).setValue('確定');
      sh.getRange(row, 8).setValue('');
      sh.getRange(row, 9).setValue(formatDate_(new Date()));
      sh.getRange(row, 10).setValue('カード');
    } else {
      // 万一の保険。お席の確保が切れたあとにお支払いされた場合など。返金のご案内が必要
      status = 'キャンセル待ち'; waitNum = maxWait + 1;
      sh.getRange(row, 7).setValue('キャンセル待ち');
      sh.getRange(row, 8).setValue(waitNum);
      sh.getRange(row, 11).setValue('⚠️満席後の決済／要返金確認 ' + formatDate_(new Date()));
    }
  } finally {
    lock.releaseLock();
  }

  capacityCacheClear_(seminarKey);
  logAction_('marke_paid', appId, config.sheet, '→ ' + status, 'カード決済後');
  if (status === '確定') {
    notifyOps_('🌸 お支払い完了（' + config.sheet.replace('📋 ', '') + '）',
      (name || 'お名前未記入') + ' 様のお支払いが完了し、ご参加が確定しました。');
  } else {
    notifyOps_('⚠️ 満席後のお支払いです（' + config.sheet.replace('📋 ', '') + '）',
      (name || 'お名前未記入') + ' 様が満席後に決済されました。返金のご確認をお願いします。');
  }
  return out_({ ok: true, status: status, wait_num: waitNum, app_id: appId });
}

/**
 * 「決済待ち」のまま満席になってしまった方が、ご自分でキャンセル待ちへ移る。
 * お支払いいただいてから「満席でした」となるのを避けるための逃げ道。
 */
function markeToWait_(p) {
  var seminarKey = p.seminar || 'marke_general';
  var config = SEMINARS[seminarKey];
  if (!config) return out_({ ok: false, error: 'unknown seminar' });
  var appId = String(p.app_id || '').trim();
  if (!appId) return out_({ ok: false, error: 'app_id required' });

  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(config.sheet);
  if (!sh) return out_({ ok: false, error: 'sheet not found' });

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(LOCK_WAIT_MS)) return out_({ ok: false, error: 'busy', retry: true });

  var waitNum = 0, name = '';
  try {
    var lastRow = sh.getLastRow();
    if (lastRow < DATA_START_ROW) return out_({ ok: false, error: 'not found' });
    var rows = sh.getRange(DATA_START_ROW, 1, lastRow - DATA_START_ROW + 1, 8).getValues();

    var myIdx = -1, maxWait = 0;
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (String(r[0]) === appId) { myIdx = i; name = String(r[1]); }
      if (r[6] === 'キャンセル待ち') {
        var wn = Number(r[7]);
        if (wn > maxWait) maxWait = wn;
      }
    }
    if (myIdx === -1) return out_({ ok: false, error: 'not found' });

    var cur = String(rows[myIdx][6]);
    if (cur === 'キャンセル待ち') {
      return out_({ ok: true, already: true, status: 'キャンセル待ち', wait_num: Number(rows[myIdx][7]) || '' });
    }
    // 決済待ちの方だけ。すでに確定した方は動かさない
    if (cur !== MARKE_PENDING) return out_({ ok: false, error: 'not_pending', status: cur });

    waitNum = maxWait + 1;
    sh.getRange(DATA_START_ROW + myIdx, 7).setValue('キャンセル待ち');
    sh.getRange(DATA_START_ROW + myIdx, 8).setValue(waitNum);
  } finally {
    lock.releaseLock();
  }

  capacityCacheClear_(seminarKey);
  logAction_('marke_to_wait', appId, config.sheet, '決済待ち → キャンセル待ち', 'ご本人が選択');
  notifyOps_('⏳ キャンセル待ちへ移られました（' + config.sheet.replace('📋 ', '') + '）',
    (name || 'お名前未記入') + ' 様が、満席のためキャンセル待ち' + waitNum + '番目に入りました。');
  return out_({ ok: true, status: 'キャンセル待ち', wait_num: waitNum });
}

/**
 * メールアドレス＋生年月日で、ご自身のお申込みを探す。
 * ※メールだけだと他人が開けてしまうため、必ず2つ揃ったときだけ返す。
 */
function markeLookup_(p) {
  var email = normalizeEmail_(p.email);
  var birthday = normalizeBirthday_(p.birthday);
  if (!email || !birthday) return out_({ ok: false, error: 'email and birthday required' });

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var found = null;

  Object.keys(SEMINARS).forEach(function (key) {
    if (found) return;
    if (String(key).indexOf('marke') !== 0) return;   // マーケのみ
    var sh = ss.getSheetByName(SEMINARS[key].sheet);
    if (!sh) return;
    var lastRow = sh.getLastRow();
    if (lastRow < DATA_START_ROW) return;
    var rows = sh.getRange(DATA_START_ROW, 1, lastRow - DATA_START_ROW + 1, LAST_COL).getValues();
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (!r[0]) continue;
      if (normalizeEmail_(r[2]) !== email) continue;
      if (normalizeBirthday_(r[11]) !== birthday) continue;
      found = { key: key, app_id: String(r[0]) };
      return;
    }
  });

  // 見つからない理由（メール違い／生年月日違い）は伝えない
  if (!found) return out_({ ok: false, error: 'not_found' });
  logAction_('marke_lookup', found.app_id, SEMINARS[found.key].sheet, '照会成功', '');
  return out_({ ok: true, app_id: found.app_id, seminar: found.key });
}

function submitApplication_(p, dryRun) {
  var seminarKey = p.seminar;
  var config = SEMINARS[seminarKey];
  if (!config) return out_({ ok: false, error: 'unknown seminar: ' + seminarKey });
  if (!p.uid)  return out_({ ok: false, error: 'uid required' });

  // 受付開始ゲート：募集開始前は受け付けない（URLが漏れてもフライング申込を防ぐ）
  var gate = gateInfo_(seminarKey);
  if (!gate.is_open && !dryRun) {
    return out_({ ok: false, error: 'not_open_yet', open_at: gate.open_at });
  }
  // 申込の締切（開催前日23:59）を過ぎていたら受け付けない
  if (gate.is_closed && !dryRun) {
    return out_({ ok: false, error: 'closed', close_at: gate.close_at });
  }

  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(config.sheet);
  if (!sh) return out_({ ok: false, error: 'sheet not found' });

  // ============ ここからロック ============
  // 【重要】ロックの中でやるのは「数える → 書く」だけ。
  // LINE送信（外部通信）と操作履歴はロックの外へ出してある。
  // ここに処理を足すと、その分だけ全員の行列が伸びる。足さないこと。
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(LOCK_WAIT_MS)) {
    // 待っても取れなかった＝混雑。例外を投げずに「やり直してね」を返す
    logAction_('busy', p.uid, config.sheet, 'lock timeout', '同時アクセス');
    return out_({ ok: false, error: 'busy', retry: true });
  }

  var lockedAt = new Date().getTime(), lockHeld = 0;
  var status, deadline, waitNum, scenarioName, occupiedAfter = 0;
  try {
    // A〜H列を【1回だけ】読む。重複チェック・定員・待機番号をこの1回でまかなう
    var lastRow = sh.getLastRow();
    var rows = (lastRow >= DATA_START_ROW)
      ? sh.getRange(DATA_START_ROW, 1, lastRow - DATA_START_ROW + 1, 8).getValues()
      : [];

    var occupied = 0, maxWait = 0, exRow = 0, exStatus = '';
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var st = r[6];
      // 重複チェック（uidが入っている行だけ見る）
      if (r[0] && !exRow && r[0] === p.uid) { exRow = DATA_START_ROW + i; exStatus = String(st); }
      // 定員の数え方は従来どおり（uidの有無に関係なく状態だけで数える）
      if (st === '確定' || st === '決済案内中' || st === '振込報告済み') occupied++;
      else if (st === 'キャンセル待ち') {
        var wn = Number(r[7]);
        if (wn > maxWait) maxWait = wn;
      }
    }

    // 重複（もう申し込んでいる人）→ 現状を返すだけ。LINEは飛ばさない
    if (exRow) {
      return out_({ ok: true, already: true, status: exStatus, row: exRow });
    }

    /* キャンセル待ち専用の入口から来た方（mode=wait）は、
       空席があっても最初からキャンセル待ちに入れる。
       ※お客さまが自分で選んだ場合だけ。通常の入口では従来どおり。 */
    var wantWait = (String(p.mode || '') === 'wait');

    var now = new Date();
    if (!wantWait && occupied < config.capacity) {
      if (config.payment === 'cash') {
        // セルフ先行：当日現金 → 即確定
        status = '確定';       deadline = '';  waitNum = '';  scenarioName = '確定';
      } else {
        status = '決済案内中';
        deadline = formatDate_(deadlineFrom_(config, now, 'card'));
        waitNum = '';          scenarioName = '決済案内';
      }
    } else {
      status = 'キャンセル待ち'; deadline = ''; waitNum = maxWait + 1; scenarioName = 'キャンセル待ち';
    }

    // ここまでが「数える」。dry run はここで返す（1行も書かない）
    if (dryRun) {
      return out_({
        ok: true, dry_run: true,
        seminar: seminarKey, rows_read: rows.length,
        occupied: occupied, capacity: config.capacity,
        would_status: status, would_wait: waitNum, would_scenario: scenarioName,
        want_wait: wantWait,
        lock_held_ms: new Date().getTime() - lockedAt
      });
    }

    occupiedAfter = occupied + (status === 'キャンセル待ち' ? 0 : 1);

    sh.appendRow([
      p.uid || '',
      p.name || '',
      p.email || '',
      p.phone || '',
      formatDate_(now),
      deadline,
      status,
      waitNum,
      '', // I:決済日時
      config.payment === 'cash' && status === '確定' ? '当日現金' : '',
      '', // K:備考
      p.birthday || '',
      p.job || '',
      p.worries || '',
      normalizeKana_(p.kana),  // O:読み仮名（表記をそろえるだけ。
                               //   カタカナでなくても申込は止めない＝席を落とさない。
                               //   形式のチェックはフォーム側で行う）
      normalizeInsta_(p.insta)  // P:インスタユーザー名（マーケのみ・@は外して保存）
    ]);
    lockHeld = new Date().getTime() - lockedAt;
  } finally {
    lock.releaseLock();
  }
  // ============ ここでロックを離した ============

  // 残席の表示用キャッシュを捨てる（次の人には新しい数字を見せる）
  capacityCacheClear_(seminarKey);

  // 以下は他の人を待たせないので、ロックの外で行う
  moveScenario_(p.uid, scenarioName);
  logAction_('web_application', p.uid, config.sheet, '→ ' + status, 'Webアプリ経由 ／ カギ占有 ' + lockHeld + 'ms');

  /* 運営のスマホへお知らせ（v8.5）
     ・当日現金のセミナー（セルフ先行）は申込＝受付完了なので、その場でお知らせする
     ・キャンセル待ちは「満席になった」合図なのでお知らせする
     ・事前決済の「決済案内中」は通知しない。募集開始直後に何十件も鳴ってしまうため
       （入金の報告が来たときに別途お知らせが飛ぶ） */
  try {
    var label = config.sheet.replace('📋 ', '');
    if (status === '確定') {
      notifyOps_('🌸 受付完了（' + label + '）',
        (p.name || 'お名前未記入') + ' 様のお申込みが確定しました。残り' +
        Math.max(0, config.capacity - (occupiedAfter)) + '席です。');
    } else if (status === 'キャンセル待ち') {
      notifyOps_('⏳ キャンセル待ちのお申込み（' + label + '）',
        (p.name || 'お名前未記入') + ' 様が待機' + waitNum + '番目に入りました。満席です。');
    }
  } catch (_) {}

  return out_({ ok: true, status: status, waitNum: waitNum, deadline: deadline,
                // キャンセル待ちの画面で「お知らせが届いてから◯時間」を出すため
                promote_deadline_min: config.promote_deadline_min || null,
                lock_held_ms: lockHeld });
}

// ========== 【v2】振込報告受信 ==========
function reportBankTransfer_(p) {
  var uid = String(p.uid || '');
  if (!uid) return out_({ ok: false, error: 'uid required' });

  var found = findUserAcrossSeminars_(uid);
  if (!found) return out_({ ok: false, error: 'user not found' });

  var sh = found.sheet;
  var row = found.row;
  var current = String(sh.getRange(row, 7).getValue());

  /* すでにご参加が確定している方・キャンセル済みの方は動かさない（v10.8）。
     「期限切れ」の方は受け付ける。お振込みを済ませたあとに行き違いで
     キャンセルのお知らせが届くことがあり、そのご連絡を受け取る必要があるため。 */
  if (current === '確定' || current === '振込報告済み' || current === 'キャンセル済') {
    return out_({ ok: true, already: true, status: current });
  }
  var wasExpired = (current === '期限切れ');

  sh.getRange(row, 7).setValue('振込報告済み');
  sh.getRange(row, 6).setValue('');   // 期限は役目を終えたので消す
  sh.getRange(row, 10).setValue('銀行振込');
  var memo = (wasExpired ? '⚠️期限切れ後のご連絡／要確認 ' : '') +
    '名義:' + (p.transfer_name || '') +
    (p.transfer_date ? ' 振込日:' + p.transfer_date : '') +
    ' 報告:' + formatDate_(new Date());
  sh.getRange(row, 11).setValue(memo);

  logAction_('bank_transfer_reported', uid, sh.getName(), '→ 振込報告済み', memo);

  // 運営へプッシュ通知（入金確認のアクションが必要なため）
  if (wasExpired) {
    notifyOps_('⚠️ 期限切れ後に振込のご報告が届きました',
      (found.data[1] || 'どなたか') + 'さんです。お手続きの行き違いの可能性があります。' +
      '入金をご確認のうえ、ご参加いただけるかご判断ください。');
  } else {
    notifyOps_('🏦 振込のご報告が届きました',
      (found.data[1] || 'どなたか') + 'さんから振込のご報告がありました。入金確認をお願いします。');
  }

  return out_({ ok: true, was_expired: wasExpired });
}

// ========== 【v7.3】カード決済完了のご連絡（お客さま申告） ==========
// プロラインの「決済成功→シナリオ移動→外部プログラム」が届かなくても
// お客さまが止まらないようにするための、こちら側の受け皿。
// 状態は銀行振込と同じ「振込報告済み」にして、運営が確認して確定する流れに合流させる。
function reportCardPayment_(p) {
  var uid = String(p.uid || '');
  if (!uid) return out_({ ok: false, error: 'uid required' });

  var found = null;
  if (p.seminar && SEMINARS[p.seminar]) found = findUserInSeminar_(uid, p.seminar);
  if (!found) found = findPayableAcrossSeminars_(uid) || findUserAcrossSeminars_(uid);
  if (!found) return out_({ ok: false, error: 'user not found' });

  var sh = found.sheet, row = found.row;
  var current = String(sh.getRange(row, 7).getValue());

  /* 二重報告・確定済みへの上書きを防ぐ。
     ただし「期限切れ」の方は受け付ける（v10.8）。
     お支払い期限が20分と短いため、決済の最中に期限切れになり、
     行き違いでキャンセルのお知らせが届くことが起こりうる。
     期限を過ぎたあとのご決済も返金せずお受けする決まりなので、
     ここで門前払いにしてはいけない。 */
  var wasExpired = (current === '期限切れ');
  if (current !== '決済案内中' && !wasExpired) {
    return out_({ ok: true, already: true, status: current });
  }

  sh.getRange(row, 7).setValue('振込報告済み');
  sh.getRange(row, 6).setValue('');   // 期限は役目を終えたので消す
  if (!sh.getRange(row, 10).getValue()) sh.getRange(row, 10).setValue('カード（要確認）');
  sh.getRange(row, 11).setValue(
    (wasExpired ? '⚠️期限切れ後のご連絡／要確認 ' : '') +
    'カード決済完了のご連絡 ' + formatDate_(new Date()));

  logAction_('card_payment_reported', uid, sh.getName(), '→ 振込報告済み',
    wasExpired ? '期限切れ後のカード決済の申告' : 'カード決済完了の申告');

  if (wasExpired) {
    notifyOps_('⚠️ 期限切れ後にカード決済のご連絡が届きました',
      (found.data[1] || 'どなたか') + 'さんです。お手続きの行き違いの可能性があります。' +
      'Stripeで入金をご確認のうえ、ご参加いただけるかご判断ください。');
  } else {
    notifyOps_('💳 カード決済のご連絡が届きました',
      (found.data[1] || 'どなたか') + 'さんがカード決済を完了されました。Stripeで入金をご確認のうえ、確定の操作をお願いします。');
  }

  return out_({ ok: true, status: '振込報告済み', was_expired: wasExpired });
}

// ========== 【v2】残席照会 ==========
/**
 * 残席などを返す。募集開始直後は同じ問い合わせが一気に来るので、
 * 数字だけ CAPACITY_CACHE_SEC 秒キャッシュして負荷を下げる。
 * 【重要】これは「画面に出す数字」専用。実際の定員判定は
 * submitApplication_ がロックの中で毎回数え直すので、ここは多少古くてよい。
 */
function getCapacity_(p) {
  var config = SEMINARS[p.seminar];
  if (!config) return out_({ ok: false, error: 'unknown seminar' });

  // 分きざみの期限を使うセミナーは、ここで期限切れを片づけてから数える（v10.3）。
  // こうしておくと、受付ページを開いた方に常に正しい残席が見える。
  sweepIfNeeded_(p.seminar);

  var gate = gateInfo_(p.seminar);   // ゲートはキャッシュしない（開始判定なので）
  var counts = capacityCounts_(p.seminar);
  if (!counts) return out_({ ok: false, error: 'sheet not found' });

  return out_({
    ok: true,
    seminar: p.seminar,
    capacity: config.capacity,
    confirmed: counts.confirmed,
    waiting: counts.waiting,
    available: Math.max(0, config.capacity - counts.confirmed),
    is_open: gate.is_open,     // false なら受付開始前（カウントダウン画面を出す）
    open_at: gate.open_at,
    is_closed: gate.is_closed, // true なら申込の締切を過ぎている
    close_at: gate.close_at,
    gate_on: gate.gate_on,
    cached: counts.cached
  });
}

var CAPACITY_CACHE_SEC = 3;   // 残席表示のキャッシュ秒数。長くすると軽いが表示が古くなる

function capacityCacheKey_(seminarKey) { return 'cap_' + seminarKey; }

function capacityCacheClear_(seminarKey) {
  try { CacheService.getScriptCache().remove(capacityCacheKey_(seminarKey)); } catch (_) {}
}

/** 確定系と待機の人数を数える（3秒キャッシュ付き・G列だけ1回読む） */
function capacityCounts_(seminarKey) {
  var config = SEMINARS[seminarKey];
  if (!config) return null;

  var cache = CacheService.getScriptCache();
  var key = capacityCacheKey_(seminarKey);
  try {
    var hit = cache.get(key);
    if (hit) {
      var o = JSON.parse(hit);
      o.cached = true;
      return o;
    }
  } catch (_) {}

  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(config.sheet);
  if (!sh) return null;

  var lastRow = sh.getLastRow();
  var confirmed = 0, waiting = 0;
  if (lastRow >= DATA_START_ROW) {
    // F列（お席の確保期限）とG列（状態）をまとめて読む
    var col = sh.getRange(DATA_START_ROW, 6, lastRow - DATA_START_ROW + 1, 2).getValues();
    var now = new Date();
    for (var i = 0; i < col.length; i++) {
      var st = col[i][1];
      if (seatHeld_(st, col[i][0], now)) confirmed++;
      else if (st === 'キャンセル待ち') waiting++;
    }
  }
  var out = { confirmed: confirmed, waiting: waiting, cached: false };
  try { cache.put(key, JSON.stringify({ confirmed: confirmed, waiting: waiting }), CAPACITY_CACHE_SEC); } catch (_) {}
  return out;
}

// ========== 【v2】ユーザーキャンセル ==========
function cancelApplication_(p) {
  var uid = String(p.uid || '');
  if (!uid) return out_({ ok: false, error: 'uid required' });

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(LOCK_WAIT_MS)) return out_({ ok: false, error: 'busy', retry: true });
  try {
    var found = findUserAcrossSeminars_(uid);
    if (!found) return out_({ ok: false, error: 'user not found' });

    var sh = found.sheet;
    var row = found.row;
    var prevStatus = found.data[6];

    // 確定済みのキャンセルは「返金なし了解フラグ」必須（アプリ側で理由入力＋二重確認済みの場合のみ）
    if (prevStatus === '確定' && String(p.confirm_no_refund) !== '1') {
      return out_({ ok: false, error: 'confirmed_cannot_cancel' });
    }

    // キャンセル理由を備考(K列)に記録
    if (p.reason) {
      var memo = String(sh.getRange(row, 11).getValue() || '');
      sh.getRange(row, 11).setValue((memo ? memo + ' / ' : '') + 'キャンセル理由:' + p.reason);
    }

    sh.getRange(row, 7).setValue('キャンセル済');

    // キャンセル待ちだった場合：後続の待機順を繰上げ
    if (prevStatus === 'キャンセル待ち') {
      var myNum = Number(found.data[7]);
      sh.getRange(row, 8).setValue('');
      renumberWaiting_(sh, myNum);
    } else if (holdsSeat_(prevStatus)) {
      // 席を持っていた場合だけ、待機1番を繰上げる
      // （v10.0：決済待ちの方もお席を確保しているので、ここに含まれる）
      promoteNextWaiting_(sh);
    }

    // LINEへ「キャンセル完了」通知（⑨）
    moveScenario_(uid, 'キャンセル完了');
    logAction_('user_cancel', uid, sh.getName(), prevStatus + ' → キャンセル済', 'Webアプリ経由');
    return out_({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

/** キャンセル待ちの抜け番以降を -1 繰上げ */
function renumberWaiting_(sh, removedNum) {
  if (!removedNum) return;
  var lastRow = sh.getLastRow();
  if (lastRow < DATA_START_ROW) return;
  var data = sh.getRange(DATA_START_ROW, 1, lastRow - DATA_START_ROW + 1, 8).getValues();
  for (var i = 0; i < data.length; i++) {
    if (data[i][6] === 'キャンセル待ち') {
      var wn = Number(data[i][7]);
      if (wn > removedNum) {
        sh.getRange(DATA_START_ROW + i, 8).setValue(wn - 1);
      }
    }
  }
}

/** 全セミナーシートからuidを検索 */
/** 指定セミナーの中から uid の行を探す（同uidが複数あれば下の行＝最新） */
function findUserInSeminar_(uid, seminarKey) {
  var config = SEMINARS[seminarKey];
  if (!config) return null;
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(config.sheet);
  if (!sh) return null;
  var lastRow = sh.getLastRow();
  if (lastRow < DATA_START_ROW) return null;
  var n = lastRow - DATA_START_ROW + 1;
  // v7.2: まずA列(uid)だけを読む。全列を読むと重く、表示が遅くなるため
  var uids = sh.getRange(DATA_START_ROW, 1, n, 1).getValues();
  for (var i = n - 1; i >= 0; i--) {   // 同uidが複数あれば下の行＝最新
    if (String(uids[i][0]) === uid) {
      var row = DATA_START_ROW + i;
      return {
        seminarKey: seminarKey, sheet: sh, row: row,
        data: sh.getRange(row, 1, 1, LAST_COL).getValues()[0]
      };
    }
  }
  return null;
}

/**
 * 全セミナーから uid を探す。
 * 【v7.1】複数セミナーに申込がある場合は「申込日時がいちばん新しい」ものを返す。
 * （以前はシート順で最初に見つかったものを返していたため、
 *   セルフとマーケの両方に申し込んだ方が常にセルフ側の画面になってしまっていた）
 */
function findUserAcrossSeminars_(uid) {
  var keys = Object.keys(SEMINARS);
  var best = null, bestTime = -1;
  for (var k = 0; k < keys.length; k++) {
    var hit = findUserInSeminar_(uid, keys[k]);
    if (!hit) continue;
    var t = hit.data[4] ? new Date(hit.data[4]).getTime() : 0;
    if (isNaN(t)) t = 0;
    if (t >= bestTime) { bestTime = t; best = hit; }
  }
  return best;
}

/**
 * 決済の宛先を探す（お支払い待ちの行を優先）。
 * すでに確定済みの行に決済が吸い込まれるのを防ぐため、
 * 「決済案内中／振込報告済み」の中でいちばん新しいものを返す。
 */
function findPayableAcrossSeminars_(uid) {
  var keys = Object.keys(SEMINARS);
  var best = null, bestTime = -1;
  for (var k = 0; k < keys.length; k++) {
    var hit = findUserInSeminar_(uid, keys[k]);
    if (!hit) continue;
    var st = String(hit.data[6] || '');
    if (st !== '決済案内中' && st !== '振込報告済み') continue;
    var t = hit.data[4] ? new Date(hit.data[4]).getTime() : 0;
    if (isNaN(t)) t = 0;
    if (t >= bestTime) { bestTime = t; best = hit; }
  }
  return best;
}

// ========== ①フォーム送信受信（v1：プロライン経由） ==========
function handleFormSubmit_(p) {
  var seminarKey = p.seminar;
  var config = SEMINARS[seminarKey];
  if (!config) return out_({ ok: false, error: 'unknown seminar: ' + seminarKey });

  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(config.sheet);
  if (!sh) return out_({ ok: false, error: 'sheet not found' });

  // 重複チェック（同uidの既存申込があればスキップ）
  var existRow = findRowByUid_(sh, p.uid);
  if (existRow) {
    return out_({ ok: true, message: 'already exists', row: existRow });
  }

  // 定員判定
  var occupied = countByStatuses_(sh, ['確定', '決済案内中', '振込報告済み']);
  var isWithinCapacity = occupied < config.capacity;

  var now = new Date();
  var status, deadline, waitNum;

  if (isWithinCapacity) {
    status = '決済案内中';
    deadline = formatDate_(new Date(now.getTime() + DEADLINE_DAYS * 86400000));
    waitNum = '';
  } else {
    status = 'キャンセル待ち';
    deadline = '';
    waitNum = getNextWaitNumber_(sh);
  }

  sh.appendRow([
    p.uid || '',
    p.name || '',
    p.email || '',
    p.phone || '',
    formatDate_(now),
    deadline,
    status,
    waitNum,
    '', '', ''
  ]);

  // プロラインへシナリオ移動指示
  var scenarioName = isWithinCapacity ? '決済案内' : 'キャンセル待ち';
  moveScenario_(p.uid, scenarioName);
  logAction_('form_submitted', p.uid, config.sheet, '→ ' + status, '');

  return out_({ ok: true, status: status, waitNum: waitNum });
}

// ========== ②決済完了受信 ==========
function handlePaymentComplete_(p) {
  var seminarKey = p.seminar;
  var config = SEMINARS[seminarKey];
  var sh, row;

  if (config) {
    sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(config.sheet);
    row = findRowByUid_(sh, p.uid);
  } else {
    // seminar未指定でも uid だけで探せるように（v2改良）
    // v7.1: 複数申込があるとき、すでに確定済みの行ではなく
    //       「お支払い待ちの行」を優先する（決済が別セミナーに吸い込まれるのを防ぐ）
    var found = findPayableAcrossSeminars_(String(p.uid || '')) ||
                findUserAcrossSeminars_(String(p.uid || ''));
    if (found) { sh = found.sheet; row = found.row; }
  }
  if (!sh || !row) return out_({ ok: false, error: 'user not found' });

  // 二重発火ガード：すでに確定なら何もしない
  // （⑦シナリオの「実行時に外部プログラム実行」経由の呼び出しがループしないための重要な処理）
  var currentStatus = String(sh.getRange(row, 7).getValue());
  if (currentStatus === '確定') {
    return out_({ ok: true, message: 'already confirmed' });
  }

  sh.getRange(row, 6).setValue('');   // 期限クリア
  sh.getRange(row, 7).setValue('確定');
  sh.getRange(row, 8).setValue('');   // 待機順クリア
  sh.getRange(row, 9).setValue(formatDate_(new Date()));
  if (!sh.getRange(row, 10).getValue()) sh.getRange(row, 10).setValue(p.method || 'Stripe');

  // ⚠️ここで moveScenario_(p.uid,'確定') を呼んではいけない。
  // この関数は「⑦支払い確定」シナリオの“実行時に外部プログラム”から呼ばれる＝
  // お客さまはすでに⑦へ移動済みで、確定メッセージも届いている。
  // ここで再度⑦を叩くと⑦がもう一度実行され、同じメッセージが2通届く（2026-08-19 修正）。
  logAction_('payment_completed', p.uid, sh.getName(), '→ 確定', p.method || '');

  // 期限を過ぎたあとのご入金も、返金せずお受けする決まり（2026-09-02）。
  // そのぶん定員を超えることがあるので、人数を見て運営へお知らせする。
  var paidKey = null;
  Object.keys(SEMINARS).forEach(function (k) {
    if (SEMINARS[k].sheet === sh.getName()) paidKey = k;
  });
  if (paidKey) {
    capacityCacheClear_(paidKey);
    watchAttendees_(sh, paidKey);
  }

  return out_({ ok: true });
}

// ========== ③手動書換検知（onEdit）==========
function onEdit(e) {
  try {
    var range = e.range;
    var sh = range.getSheet();
    var sheetName = sh.getName();

    // 🏦支払い状況シートの☑ → 確定処理
    if (sheetName === PAYMENT_VIEW_SHEET) {
      if (range.getColumn() === 1 && range.getRow() >= 5 && range.getValue() === true) {
        var vRow = range.getRow();
        var vUid = String(sh.getRange(vRow, 8).getValue());
        var vLabel = String(sh.getRange(vRow, 3).getValue());
        var vKey = null;
        Object.keys(SEMINARS).forEach(function (k) {
          if (SEMINARS[k].sheet === '📋 ' + vLabel) vKey = k;
        });
        if (vUid && vKey) {
          confirmFromPaymentView_(vUid, vKey);
          setupPaymentStatusSheet();  // 確定した行が消えた最新リストに再構築
        }
      }
      return;
    }

    var seminarKey = findSeminarBySheetName_(sheetName);
    if (!seminarKey) return;

    // G列(状態)の変更のみ処理
    if (range.getColumn() !== 7) return;
    if (range.getRow() < DATA_START_ROW) return;

    var newValue = range.getValue();
    var uid = sh.getRange(range.getRow(), 1).getValue();

    if (newValue === 'キャンセル済' || newValue === '期限切れ') {
      // 変更前の状態が「席を持っていた」ときだけ繰り上げる（下で判定）
      var prevHeld = String(e.oldValue || '');
      // 期限切れシナリオ通知（本人向け）
      if (newValue === '期限切れ') {
        moveScenario_(uid, '期限切れ');
      }
      // 待機順1番を繰り上げ（席を持っていた方のときだけ）
      if (!prevHeld || holdsSeat_(prevHeld)) promoteNextWaiting_(sh);
      logAction_('manual_status_change', uid, sheetName, '→ ' + newValue, '');
    }

    // 手動で「確定」に変更（振込確認時）→ 確定シナリオ通知
    if (newValue === '確定') {
      moveScenario_(uid, '確定');
      logAction_('manual_confirm', uid, sheetName, '→ 確定', '手動確認');
      var manualKey = null;
      Object.keys(SEMINARS).forEach(function (k) {
        if (SEMINARS[k].sheet === sheetName) manualKey = k;
      });
      if (manualKey) { capacityCacheClear_(manualKey); watchAttendees_(sh, manualKey); }
    }
  } catch (err) {
    // onEditはエラーを外に投げると危険なのでログのみ
    try { logAction_('error', '', '', 'onEdit: ' + err, ''); } catch(_) {}
  }
}

// ========== ④時限トリガー：3日期限チェック ==========
/**
 * 空席があるのにキャンセル待ちの方がいるとき、運営へお知らせする（v9.0）。
 * 満席後のキャンセルは自動で繰り上がるが、
 * 「空席が残っている状態」だけは手動で繰り上げる必要があるため、その気づき用。
 * ・1日1回まで（同じ日に何度も鳴らさない）
 * ・朝9時〜夜9時のあいだだけ
 */
var PROMOTE_HINT_FROM = 9;   // この時刻より前は鳴らさない
var PROMOTE_HINT_TO   = 21;  // この時刻以降は鳴らさない

function remindPromote_() {
  var hour = Number(Utilities.formatDate(new Date(), 'Asia/Tokyo', 'H'));
  if (hour < PROMOTE_HINT_FROM || hour >= PROMOTE_HINT_TO) return 0;

  var today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
  var props = PropertiesService.getScriptProperties();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sent = 0;

  Object.keys(SEMINARS).forEach(function (key) {
    var config = SEMINARS[key];
    var sh = ss.getSheetByName(config.sheet);
    if (!sh) return;

    var lastRow = sh.getLastRow();
    if (lastRow < DATA_START_ROW) return;
    var col = sh.getRange(DATA_START_ROW, 7, lastRow - DATA_START_ROW + 1, 1).getValues();

    var occupied = 0, waiting = 0;
    for (var i = 0; i < col.length; i++) {
      var st = col[i][0];
      if (st === '確定' || st === '決済案内中' || st === '振込報告済み') occupied++;
      else if (st === 'キャンセル待ち') waiting++;
    }

    var free = config.capacity - occupied;
    if (free <= 0 || waiting <= 0) return;   // 満席なら自動で回るので不要

    var mark = 'PROMOTE_HINT_' + key + '_' + today;
    if (props.getProperty(mark)) return;     // 今日はもう鳴らした
    props.setProperty(mark, '1');

    notifyOps_('⏳ 繰上げできる方がいます',
      config.sheet.replace('📋 ', '') + 'に空席が' + free + 'つあり、' +
      'キャンセル待ちの方が' + waiting + '名お待ちです。' +
      '管理アプリの「⬆ 待機1番を繰上げる」からご案内できます。');
    logAction_('promote_hint', '', config.sheet, '空席' + free + '／待機' + waiting, '運営へ通知');
    sent++;
  });
  return sent;
}

/**
 * 【v10.2】5分ごとに走らせる軽い期限切れ処理。
 * マーケの期限は20分きざみなので、1時間に1回では間に合わない。
 * 重い処理（名簿の作り直し・お知らせ送信など）は入れず、期限切れと繰上げだけを見る。
 */
function checkExpiredFast() {
  var total = 0;
  Object.keys(SEMINARS).forEach(function (key) {
    total += sweepSeminar_(key);
  });
  if (total > 0) {
    notifyOps_('⏰ お支払い期限切れ（' + total + '件）',
      'キャンセル待ちの方がいらっしゃる場合は、自動で繰上げています。');
  }
  return { ok: true, expiredCount: total };
}

/**
 * 1つのセミナーについて、お支払い期限を過ぎた「決済案内中」を片づける。
 * 分きざみの期限を使っているセミナー（マーケ一般）だけが対象。
 * 片づけた件数を返す。
 */
function sweepSeminar_(seminarKey) {
  var config = SEMINARS[seminarKey];
  if (!usesShortDeadline_(config)) return 0;

  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(config.sheet);
  if (!sh) return 0;
  var lastRow = sh.getLastRow();
  if (lastRow < DATA_START_ROW) return 0;

  var now = new Date();
  var n = lastRow - DATA_START_ROW + 1;
  // F列（期限）とG列（状態）だけ読む。軽くしておく
  var col = sh.getRange(DATA_START_ROW, 6, n, 2).getValues();

  var hits = [];
  for (var i = 0; i < col.length; i++) {
    if (String(col[i][1]) !== '決済案内中') continue;
    if (!col[i][0]) continue;
    var dl = new Date(col[i][0]);
    if (isNaN(dl.getTime()) || dl >= now) continue;
    hits.push(i);
  }
  if (!hits.length) return 0;

  for (var h = 0; h < hits.length; h++) {
    var row = DATA_START_ROW + hits[h];
    var uid = sh.getRange(row, 1).getValue();
    sh.getRange(row, 7).setValue('期限切れ');
    moveScenario_(uid, '期限切れ');
    logAction_('auto_expire_fast', uid, sh.getName(), '→ 期限切れ', 'お支払い期限を過ぎたため');
    promoteNextWaiting_(sh);
  }
  capacityCacheClear_(seminarKey);
  return hits.length;
}

/**
 * 【v10.3】アクセスのついでに期限切れを片づける。
 * トリガーに頼らず、受付ページが開かれた瞬間に残席を正しくするための仕組み。
 * SWEEP_INTERVAL_SEC 秒に1回までに抑えるので、殺到しても重くならない。
 */
var SWEEP_INTERVAL_SEC = 30;

function sweepIfNeeded_(seminarKey) {
  var config = SEMINARS[seminarKey];
  if (!usesShortDeadline_(config)) return;

  var cache = CacheService.getScriptCache();
  var key = 'sweep_' + seminarKey;
  try {
    if (cache.get(key)) return;          // ついさっき掃除したので何もしない
    cache.put(key, '1', SWEEP_INTERVAL_SEC);
  } catch (_) { return; }

  try {
    var n = sweepSeminar_(seminarKey);
    if (n > 0) {
      notifyOps_('⏰ お支払い期限切れ（' + n + '件）',
        'キャンセル待ちの方がいらっしゃる場合は、自動で繰上げています。');
    }
  } catch (err) {
    logAction_('error', '', '', 'sweep failed: ' + err, '');
  }
}

/**
 * 5分ごとのトリガーを用意する（一度だけ手で実行すればOK）。
 * 同じ関数のトリガーが既にあれば作り直す。
 */
function setupFastTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'checkExpiredFast') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('checkExpiredFast').timeBased().everyMinutes(5).create();
  return '⏱ checkExpiredFast を5分ごとに実行するようにしました';
}

function checkExpired() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var now = new Date();
  var expiredCount = 0;

  Object.keys(SEMINARS).forEach(function (key) {
    var sh = ss.getSheetByName(SEMINARS[key].sheet);
    if (!sh) return;

    var lastRow = sh.getLastRow();
    if (lastRow < DATA_START_ROW) return;

    var data = sh.getRange(DATA_START_ROW, 1, lastRow - DATA_START_ROW + 1, 11).getValues();

    for (var i = 0; i < data.length; i++) {
      var uid = data[i][0];
      var deadline = data[i][5];
      var status = data[i][6];

      // マーケ：お席の確保時間を過ぎた「決済待ち」を外す（v10.0／LINEなし方式のみ）
      if (MARKE_NO_LINE && status === MARKE_PENDING && deadline) {
        var hd = new Date(deadline);
        if (!isNaN(hd.getTime()) && hd < now) {
          var hrow = DATA_START_ROW + i;
          sh.getRange(hrow, 7).setValue('期限切れ');
          logAction_('marke_hold_expired', uid, sh.getName(), '決済待ち → 期限切れ',
                     'お席の確保時間（' + MARKE_HOLD_MIN + '分）を過ぎたため');
          expiredCount++;
        }
        continue;
      }

      if (status === '決済案内中' && deadline) {
        var dl = new Date(deadline);
        if (dl < now) {
          var row = DATA_START_ROW + i;
          sh.getRange(row, 7).setValue('期限切れ');
          moveScenario_(uid, '期限切れ');
          logAction_('auto_expire', uid, sh.getName(), '→ 期限切れ', '3日超過');
          promoteNextWaiting_(sh);
          expiredCount++;
        }
      }
    }
  });

  // 運営へプッシュ通知（期限切れ処理のお知らせ）
  if (expiredCount > 0) {
    notifyOps_('⏰ 期限切れ処理を行いました',
      expiredCount + '件のお申込みが期限切れになりました。待機の方がいる場合は自動で繰上げています。');
  }

  // ⏰ 分きざみの期限（マーケ）も、ここで念のため片づける（v10.3）
  try { checkExpiredFast(); } catch (err) { logAction_('error', '', '', 'fast sweep failed: ' + err, ''); }

  // ⏳ 空席があるのに待機の方がいたら、運営へお知らせ（1日1回まで）
  try { remindPromote_(); } catch (err) { logAction_('error', '', '', 'remindPromote failed: ' + err, ''); }

  // 📣 予約されたお知らせ（時刻を過ぎたものを送る）
  try { sendScheduledNews_(); } catch (err) { logAction_('error', '', '', 'news failed: ' + err, ''); }

  // 🏦支払い状況シートも最新化（1時間ごとに自動更新される）
  try { setupPaymentStatusSheet(); } catch (_) {}

  // 毎時トリガーからも呼ばれるので ContentService は返さない（返すとGASがエラーメールを送る）
  return { ok: true, expiredCount: expiredCount };
}

// ========== 手動繰上げ（管理用API） ==========
function manualPromote_(p) {
  var config = SEMINARS[p.seminar];
  if (!config) return out_({ ok: false, error: 'unknown seminar' });
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(config.sheet);
  promoteNextWaiting_(sh);
  return out_({ ok: true });
}

// ========== ヘルパー：待機順1番を繰上げ ==========
function promoteNextWaiting_(sh) {
  var lastRow = sh.getLastRow();
  if (lastRow < DATA_START_ROW) return;

  /* LINEなし方式のときだけ、マーケ一般は自動で繰り上げない（v10.0）。
     「空きました」のご案内が自動では届かず、勝手に「決済案内中」へ動かすと
     お客さまが気づけないまま期限を迎えてしまうため。
     公式LINE連携（いまの方式）では、プロラインの「空きできました」が
     自動で飛ぶので、これまでどおり自動で繰り上げる。 */
  if (MARKE_NO_LINE && sh.getName() === SEMINARS['marke_general'].sheet) {
    var waitingCount = countByStatuses_(sh, ['キャンセル待ち']);
    if (waitingCount > 0) {
      notifyOps_('🪑 お席が1つ空きました（マーケ一般）',
        'キャンセル待ちの方が' + waitingCount + '名いらっしゃいます。管理アプリからご案内をお願いいたします。\n' +
        '※ Stripeの決済リンクの「支払い回数の上限」を 1 つ上げてください。');
    }
    logAction_('marke_seat_open', '', sh.getName(), '空席1（自動繰上げはしません）', '');
    return;
  }

  var data = sh.getRange(DATA_START_ROW, 1, lastRow - DATA_START_ROW + 1, 11).getValues();
  var minWaitIdx = -1;
  var minWaitNum = Infinity;

  for (var i = 0; i < data.length; i++) {
    if (data[i][6] === 'キャンセル待ち') {
      var wn = Number(data[i][7]);
      if (wn > 0 && wn < minWaitNum) {
        minWaitNum = wn;
        minWaitIdx = i;
      }
    }
  }

  if (minWaitIdx === -1) return; // 待機者なし

  var row = DATA_START_ROW + minWaitIdx;
  var uid = data[minWaitIdx][0];
  var promoteConfig = null;
  Object.keys(SEMINARS).forEach(function (k) {
    if (SEMINARS[k].sheet === sh.getName()) promoteConfig = SEMINARS[k];
  });
  var deadline = deadlineFrom_(promoteConfig, new Date(), 'promote');
  sh.getRange(row, 6).setValue(formatDate_(deadline));
  sh.getRange(row, 7).setValue('決済案内中');
  sh.getRange(row, 8).setValue('');

  // 残りの待機順を -1 繰上げ
  for (var j = 0; j < data.length; j++) {
    if (data[j][6] === 'キャンセル待ち') {
      var wn2 = Number(data[j][7]);
      if (wn2 > minWaitNum) {
        sh.getRange(DATA_START_ROW + j, 8).setValue(wn2 - 1);
      }
    }
  }

  // プロラインへ「空きできました」通知
  moveScenario_(uid, '空きできました');
  logAction_('auto_promote', uid, sh.getName(), 'キャンセル待ち → 決済案内中', '');

  // 運営へプッシュ通知（繰上げ発生のお知らせ）
  notifyOps_('⬆ 繰上げが発生しました',
    (data[minWaitIdx][1] || 'どなたか') + 'さんが繰上げで「決済案内中」になりました（' + sh.getName() + '）。');
}

// ========== プロラインへシナリオ移動指示 ==========
function moveScenario_(uid, scenarioName) {
  var urlTemplate = PROLINE_URLS[scenarioName];
  if (!urlTemplate || !uid) return;
  if (urlTemplate.indexOf('PLACEHOLDER') !== -1) {
    logAction_('warn', uid, '', 'proline url not set: ' + scenarioName, '');
    return;
  }
  var url = urlTemplate.replace('[[uid]]', uid);
  try {
    UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  } catch (err) {
    logAction_('error', uid, '', 'moveScenario failed: ' + err, '');
  }
}

// ========== ヘルパー関数 ==========
function findRowByUid_(sh, uid) {
  if (!uid) return null;
  var lastRow = sh.getLastRow();
  if (lastRow < DATA_START_ROW) return null;
  var data = sh.getRange(DATA_START_ROW, 1, lastRow - DATA_START_ROW + 1, 1).getValues();
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] === uid) return DATA_START_ROW + i;
  }
  return null;
}

function countByStatuses_(sh, statuses) {
  var lastRow = sh.getLastRow();
  if (lastRow < DATA_START_ROW) return 0;
  var data = sh.getRange(DATA_START_ROW, 7, lastRow - DATA_START_ROW + 1, 1).getValues();
  var count = 0;
  for (var i = 0; i < data.length; i++) {
    if (statuses.indexOf(data[i][0]) !== -1) count++;
  }
  return count;
}

function getNextWaitNumber_(sh) {
  var lastRow = sh.getLastRow();
  if (lastRow < DATA_START_ROW) return 1;
  var data = sh.getRange(DATA_START_ROW, 7, lastRow - DATA_START_ROW + 1, 2).getValues();
  var maxNum = 0;
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] === 'キャンセル待ち') {
      var wn = Number(data[i][1]);
      if (wn > maxNum) maxNum = wn;
    }
  }
  return maxNum + 1;
}

function findSeminarBySheetName_(name) {
  for (var key in SEMINARS) {
    if (SEMINARS[key].sheet === name) return key;
  }
  return null;
}

function formatDate_(d) {
  return Utilities.formatDate(d, 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss');
}

/** セルの値（DateまたはString）を文字列に統一 */
function formatDateValue_(v) {
  if (v instanceof Date) return formatDate_(v);
  return String(v);
}

function logAction_(event, uid, seminar, change, memo) {
  try {
    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('📜 操作履歴');
    if (!sh) return;
    sh.appendRow([formatDate_(new Date()), event, uid || '', seminar || '', change || '', memo || '']);
  } catch (_) {}
}

function readSheet_(p) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(p.sheet);
  if (!sh) return out_({ ok: false, error: 'sheet not found' });
  var values = p.range ? sh.getRange(p.range).getValues() : sh.getDataRange().getValues();
  return out_({ ok: true, sheet: sh.getName(), values: values });
}

function out_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/*** ============================================================
 * 🏦 支払い状況シート（全セミナー横断・☑で確定できるアクションビュー）
 *
 * 【初回】関数選択で「setupPaymentStatusSheet」を実行
 * 【日常】スプシのメニュー「🌸受付管理」→「🏦支払い状況を更新」で最新化
 *        （1時間ごとの自動チェック時にも自動更新されます）
 * 【使い方】入金確認できた方の A列の☑ を入れる → 自動で「確定」＋LINE通知
 * ============================================================ */
var PAYMENT_VIEW_SHEET = '🏦 支払い状況';

function setupPaymentStatusSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(PAYMENT_VIEW_SHEET);
  if (!sh) { sh = ss.insertSheet(PAYMENT_VIEW_SHEET, 1); }
  sh.getRange(1, 1, sh.getMaxRows(), 8).clearDataValidations();
  sh.clear();

  var HEAD = ['✔入金確認→確定', 'お名前', 'セミナー', '状態', '振込名義など（備考）', '支払期限', '申込日時', 'uid（触らない）'];
  sh.getRange(1, 1, 1, HEAD.length).merge().setValue('🏦 支払い状況（全セミナー横断）')
    .setFontSize(13).setFontWeight('bold').setFontColor('#fff')
    .setBackground('#4a6fa5').setHorizontalAlignment('center');
  sh.getRange(2, 1, 1, HEAD.length).merge()
    .setValue('入金を確認したら A列の☑を入れる → 自動で「確定」＋本人へLINE通知が飛びます（青い行＝振込報告済み・最優先で確認）')
    .setFontSize(9).setFontColor('#888').setHorizontalAlignment('center');
  sh.getRange(4, 1, 1, HEAD.length).setValues([HEAD])
    .setFontWeight('bold').setBackground('#eef3f9').setFontSize(10);
  sh.setFrozenRows(4);
  sh.setColumnWidth(1, 120); sh.setColumnWidth(2, 130); sh.setColumnWidth(3, 110);
  sh.setColumnWidth(4, 100); sh.setColumnWidth(5, 220); sh.setColumnWidth(6, 130);
  sh.setColumnWidth(7, 130); sh.setColumnWidth(8, 110);

  // 全セミナーから「支払い進行中」の人を集める
  var rows = [];
  Object.keys(SEMINARS).forEach(function (key) {
    var config = SEMINARS[key];
    var src = ss.getSheetByName(config.sheet);
    if (!src) return;
    var lastRow = src.getLastRow();
    if (lastRow < DATA_START_ROW) return;
    var data = src.getRange(DATA_START_ROW, 1, lastRow - DATA_START_ROW + 1, LAST_COL).getValues();
    var label = config.sheet.replace('📋 ', '');
    for (var i = 0; i < data.length; i++) {
      if (!data[i][0]) continue;
      var status = String(data[i][6] || '');
      if (status !== '振込報告済み' && status !== '決済案内中') continue;
      rows.push([
        false, data[i][1] || '', label, status,
        String(data[i][10] || ''),
        data[i][5] ? formatDateValue_(data[i][5]) : '',
        data[i][4] ? formatDateValue_(data[i][4]) : '',
        String(data[i][0])
      ]);
    }
  });
  // 振込報告済みを先頭に、次に期限が近い順
  rows.sort(function (a, b) {
    if (a[3] !== b[3]) return a[3] === '振込報告済み' ? -1 : 1;
    return String(a[5]).localeCompare(String(b[5]));
  });

  if (!rows.length) {
    sh.getRange(5, 1, 1, HEAD.length).merge()
      .setValue('現在、お支払い手続き中の方はいません 🌿')
      .setHorizontalAlignment('center').setFontColor('#888');
    return '🏦 支払い状況シートを更新しました（該当0件）';
  }

  sh.getRange(5, 1, rows.length, HEAD.length).setValues(rows).setFontSize(10);
  sh.getRange(5, 1, rows.length, 1).insertCheckboxes();
  // 振込報告済みの行を青系でハイライト
  for (var r = 0; r < rows.length; r++) {
    if (rows[r][3] === '振込報告済み') {
      sh.getRange(5 + r, 1, 1, HEAD.length).setBackground('#e5edf7');
      sh.getRange(5 + r, 4).setFontWeight('bold').setFontColor('#4a6fa5');
    }
  }
  return '🏦 支払い状況シートを更新しました（' + rows.length + '件）';
}

/** ☑からの確定処理（支払い状況シート用） */
function confirmFromPaymentView_(uid, seminarKey) {
  var config = SEMINARS[seminarKey];
  if (!config) return;
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(config.sheet);
  var row = findRowByUid_(sh, uid);
  if (!row) return;
  if (String(sh.getRange(row, 7).getValue()) === '確定') return;
  sh.getRange(row, 6).setValue('');
  sh.getRange(row, 7).setValue('確定');
  sh.getRange(row, 8).setValue('');
  sh.getRange(row, 9).setValue(formatDate_(new Date()));
  if (!sh.getRange(row, 10).getValue()) sh.getRange(row, 10).setValue('手動確認');
  moveScenario_(uid, '確定');
  logAction_('confirm_from_payment_view', uid, config.sheet, '→ 確定', '🏦支払い状況シートの☑から');
}

/** スプシを開いた時に運営メニューを追加 */
function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu('🌸 受付管理')
      .addItem('🏦 支払い状況を更新', 'setupPaymentStatusSheet')
      .addItem('👥💎 総合リストを再生成', 'setupMasterLists')
      .addItem('📦 終了セミナーを台帳へ保存', 'archiveSeminarPrompt')
      .addSeparator()
      .addItem('📣 お知らせをLINEで送る', 'sendNewsNow')
      .addItem('📣 お知らせシートを用意する', 'setupNewsSheet')
      .addSeparator()
      .addItem('📊 マーケ名簿を作り直す', 'setupMarkeRoster')
      .addItem('🈁 追加項目の列を用意する（読み仮名・インスタ）', 'setupKanaColumn')
      .addItem('📊 集計エリアを再設置', 'setupSummaryFormulas')
      .addItem('📖 操作マニュアルを再生成', 'setupManualSheet')
      .addToUi();
  } catch (_) {}
}

/*** ============================================================
 * 📦 参加履歴台帳（累積・永久保存）
 *
 * セミナー終了時にメニュー「📦 終了セミナーを台帳へ保存」を実行すると、
 * そのシートの全員分（確定もキャンセルも）が台帳に値として焼き付けられる。
 * → 以後、受付シートを削除しても記録は台帳に永久に残る。
 * ============================================================ */
var LEDGER_SHEET = '📦 参加履歴台帳';

function ledgerSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(LEDGER_SHEET);
  if (!sh) {
    sh = ss.insertSheet(LEDGER_SHEET);
    var HEAD = ['保存日', 'セミナー', 'お名前', 'メール', '電話', '最終状態', '決済方法', '申込日時', '備考', 'uid'];
    sh.getRange(1, 1, 1, HEAD.length).merge().setValue('📦 参加履歴台帳（全セミナー累積・永久保存）')
      .setFontSize(13).setFontWeight('bold').setFontColor('#fff')
      .setBackground('#8a5ca5').setHorizontalAlignment('center');
    sh.getRange(2, 1, 1, HEAD.length).merge()
      .setValue('※終了セミナーの記録がここに蓄積されます。受付シートを削除しても、ここの記録は消えません')
      .setFontSize(9).setFontColor('#888').setHorizontalAlignment('center');
    sh.getRange(4, 1, 1, HEAD.length).setValues([HEAD])
      .setFontWeight('bold').setBackground('#f3eef7').setFontSize(10);
    sh.setFrozenRows(4);
    sh.setColumnWidth(3, 130); sh.setColumnWidth(4, 170); sh.setColumnWidth(9, 220);
  }
  return sh;
}

/** メニューから：シート名を聞いて台帳へ保存 */
function archiveSeminarPrompt() {
  var ui = SpreadsheetApp.getUi();
  var res = ui.prompt('📦 終了セミナーを台帳へ保存',
    '保存するシート名を正確に入力してください（例：📋 セルフ先行）\n' +
    '※全員分（確定・キャンセル含む）が台帳に永久保存されます。\n' +
    '※保存後、そのシートは削除しても記録は残ります。',
    ui.ButtonSet.OK_CANCEL);
  if (res.getSelectedButton() !== ui.Button.OK) return;
  var name = String(res.getResponseText() || '').trim();
  var count = archiveSeminarSheet_(name);
  if (count < 0) {
    ui.alert('シートが見つかりませんでした：' + name + '\n（📋を含むシート名を正確にコピーして入力してください）');
  } else {
    ui.alert('📦 「' + name + '」の ' + count + '件を台帳に保存しました。\n\n' +
      'このシートは削除してOKです（記録は台帳に残ります）。\n' +
      '⚠️ シートを削除した後は、あかり（開発担当）へ「セミナー入替」を連絡してください。\n' +
      '（受付システム側の設定更新と、総合リストの数式再生成が必要なため）');
  }
}

/** 指定シートの全データを台帳へ追記（重複保存はスキップ） */
function archiveSeminarSheet_(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var src = ss.getSheetByName(sheetName);
  if (!src) return -1;
  var lastRow = src.getLastRow();
  var ledger = ledgerSheet_();
  if (lastRow < DATA_START_ROW) return 0;

  // 既に台帳にある（セミナー×uid）はスキップして二重保存を防ぐ
  var existing = {};
  var lv = ledger.getDataRange().getValues();
  for (var r = 4; r < lv.length; r++) {
    existing[String(lv[r][1]) + '|' + String(lv[r][9])] = 1;
  }

  var label = sheetName.replace('📋 ', '');
  var today = formatDate_(new Date());
  var data = src.getRange(DATA_START_ROW, 1, lastRow - DATA_START_ROW + 1, LAST_COL).getValues();
  var out = [];
  for (var i = 0; i < data.length; i++) {
    if (!data[i][0]) continue;
    if (existing[label + '|' + String(data[i][0])]) continue;
    out.push([
      today, label,
      data[i][1] || '', data[i][2] || '', data[i][3] || '',
      String(data[i][6] || ''), data[i][9] || '',
      data[i][4] ? formatDateValue_(data[i][4]) : '',
      String(data[i][10] || ''), String(data[i][0])
    ]);
  }
  if (out.length) {
    ledger.getRange(ledger.getLastRow() + 1, 1, out.length, out[0].length)
      .setValues(out).setFontSize(10);
  }
  return out.length;
}

/*** ============================================================
 * 👥💎 総合リストシート生成（1回だけ手動実行する関数）
 *
 * 【実行方法】エディタ上部の関数選択で「setupMasterLists」を選び「実行」
 * ・「👥 総参加者一覧」…全セミナーの確定者を横断表示（リアルタイム数式）
 * ・「💎 準見込みリスト」…期限切れ/キャンセルの方＝再アプローチ先（同上）
 * ※デプロイ不要。何度実行しても作り直されるだけなので安全。
 * ============================================================ */
function setupMasterLists() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 4シートを縦に積んだデータの束（B〜K列＋セミナー名ラベル列）
  var parts = Object.keys(SEMINARS).map(function (key) {
    var s = SEMINARS[key].sheet;
    var label = s.replace('📋 ', '');
    return "{'" + s + "'!A10:O1000, ARRAYFORMULA(IF(LEN('" + s + "'!A10:A1000),\"" + label + "\",\"\"))}";
  });
  var stack = '{' + parts.join(';') + '}';
  // 列対応（v7.4でA列=uidを追加したため、1つずつ後ろにずれています）:
  //   Col1=uid Col2=名前 Col3=メール Col4=電話 Col5=申込日時 Col6=期限
  //   Col7=状態 Col8=待機順 Col9=決済完了日時 Col10=決済方法 Col11=備考
  //   Col12=生年月日 Col13=職業 Col14=お悩み Col15=読み仮名 Col16=セミナー名

  var C_TITLE = '#9c6f5f', C_HEAD = '#f8f4ea';

  function buildSheet(name, title, note, headers, formula) {
    var sh = ss.getSheetByName(name);
    if (!sh) { sh = ss.insertSheet(name); } else { sh.clear(); }
    sh.getRange(1, 1, 1, headers.length).merge().setValue(title)
      .setFontSize(13).setFontWeight('bold').setFontColor('#fff')
      .setBackground(C_TITLE).setHorizontalAlignment('center');
    sh.getRange(2, 1, 1, headers.length).merge().setValue(note)
      .setFontSize(9).setFontColor('#888').setHorizontalAlignment('center');
    sh.getRange(4, 1, 1, headers.length).setValues([headers])
      .setFontWeight('bold').setBackground(C_HEAD).setFontSize(10);
    sh.getRange(5, 1).setFormula(formula);
    sh.setColumnWidth(1, 140);
    sh.setColumnWidth(2, 130);
    for (var c = 3; c <= headers.length; c++) sh.setColumnWidth(c, 150);
    sh.setFrozenRows(4);
  }

  buildSheet(
    '👥 総参加者一覧',
    '👥 総参加者一覧（全セミナー横断・確定者）',
    '※受付シートから自動反映（さわらない）。複数セミナー参加の方は複数行で表示されます',
    ['お名前', '読み仮名', '参加セミナー', 'メール', '電話', '決済方法', '申込日時', 'LINE ID（uid）'],
    '=IFERROR(QUERY(' + stack + ',"select Col2, Col15, Col16, Col3, Col4, Col10, Col5, Col1 where Col7=\'確定\' and Col2 is not null order by Col16, Col5",0),"まだ確定の方はいません")'
  );

  buildSheet(
    '💎 準見込みリスト',
    '💎 準見込みリスト（申込意思あり・参加に至らなかった方）',
    '※期限切れ/キャンセル済の方が自動で並びます。次回セミナーの再アプローチ候補！（さわらない）',
    ['お名前', '読み仮名', '対象セミナー', '状態', 'メール', '電話', '申込日時', 'LINE ID（uid）'],
    '=IFERROR(QUERY(' + stack + ',"select Col2, Col15, Col16, Col7, Col3, Col4, Col5, Col1 where (Col7=\'期限切れ\' or Col7=\'キャンセル済\') and Col2 is not null order by Col5 desc",0),"まだ該当の方はいません")'
  );

  return '👥💎 総合リスト2シートを作成しました';
}

/*** ============================================================
 * 📊 集計エリア再設置（1回だけ手動実行する関数）
 *
 * 【実行方法】エディタ上部の関数選択で「setupSummaryFormulas」を選び「実行」
 * ※各セミナーシートの5〜6行目に自動集計の数式を設置し直します。
 * ※デプロイ不要。何度実行しても作り直されるだけなので安全。
 * ============================================================ */
/**
 * 既存の受付シートに「読み仮名」(O列)の見出しを付ける。
 * すでにお申込みが入っているシートでも安全：
 *   ・列の挿入はしない（末尾のO列に見出しを書くだけ）
 *   ・お申込みのデータには一切触れない
 * 何度実行しても大丈夫。
 */
/**
 * 📊 マーケ名簿（見やすい並びの一覧）を作り直す。
 *
 * 「📋 マーケ一般」の列の並びはシステムが番号で見ているため動かせない。
 * そこで、見る用のシートをQUERYで作る。中身は常に自動で同期される。
 *   並び：お名前／読み仮名／メール／インスタ／生年月日／お電話／状態／…
 *
 * ⚠️ このシートは【見るだけ】。ここを書き換えても本体には反映されない。
 *    状態を変えるときは「📋 マーケ一般」か管理アプリから。
 */
var MARKE_ROSTER_SHEET = '📊 マーケ名簿';

function setupMarkeRoster() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var src = SEMINARS['marke_general'].sheet;

  var sh = ss.getSheetByName(MARKE_ROSTER_SHEET);
  if (!sh) { sh = ss.insertSheet(MARKE_ROSTER_SHEET); } else { sh.clear(); }

  var HEAD = ['お名前', '読み仮名', 'メール', 'インスタ', '生年月日', 'お電話',
              '状態', '待機順', 'お申込み日時', 'お支払い日時', 'ご職業', 'お悩み', '備考', '申込ID'];

  sh.getRange(1, 1, 1, HEAD.length).merge()
    .setValue('📊 マーケ名簿（見やすい並び・自動反映）')
    .setFontSize(13).setFontWeight('bold').setFontColor('#fff')
    .setBackground('#9c6f5f').setHorizontalAlignment('center');
  sh.getRange(2, 1, 1, HEAD.length).merge()
    .setValue('※「📋 マーケ一般」から自動で反映されます。ここを書き換えても本体には反映されません（さわらないでください）')
    .setFontSize(9).setFontColor('#888').setHorizontalAlignment('center');
  sh.getRange(4, 1, 1, HEAD.length).setValues([HEAD])
    .setFontWeight('bold').setBackground('#f8f4ea').setFontSize(10);
  sh.setFrozenRows(4);

  /* 列の対応（📋 マーケ一般 の A〜P）
     Col1=uid Col2=名前 Col3=メール Col4=電話 Col5=申込日時 Col6=期限
     Col7=状態 Col8=待機順 Col9=決済日時 Col10=決済方法 Col11=備考
     Col12=生年月日 Col13=職業 Col14=お悩み Col15=読み仮名 Col16=インスタ */
  var q = "=IFERROR(QUERY('" + src + "'!A10:P1000,"
        + '"select Col2, Col15, Col3, Col16, Col12, Col4, Col7, Col8, Col5, Col9, Col13, Col14, Col11, Col1 '
        + 'where Col1 is not null order by Col5",0),"まだお申込みはありません")';
  sh.getRange(5, 1).setFormula(q);

  var widths = [130, 130, 210, 150, 110, 130, 110, 70, 140, 140, 130, 260, 180, 120];
  for (var c = 0; c < widths.length; c++) sh.setColumnWidth(c + 1, widths[c]);

  return '📊 マーケ名簿を作り直しました';
}

function setupKanaColumn() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var done = [];

  Object.keys(SEMINARS).forEach(function (key) {
    var sh = ss.getSheetByName(SEMINARS[key].sheet);
    if (!sh) return;

    // 見出しの行を探す（A列に「uid」と書いてある行）
    var headRow = 0;
    var top = sh.getRange(1, 1, DATA_START_ROW - 1, 1).getValues();
    for (var i = top.length - 1; i >= 0; i--) {
      if (String(top[i][0]).toLowerCase().indexOf('uid') !== -1) { headRow = i + 1; break; }
    }
    if (!headRow) headRow = DATA_START_ROW - 2;   // 見つからなければ従来の8行目

    var sample = sh.getRange(headRow, 8);        // H列（待機順）の見た目に合わせる
    function head_(col, label, width) {
      var cell = sh.getRange(headRow, col);
      if (String(cell.getValue()).indexOf(label) === -1) {
        cell.setValue(label)
          .setFontWeight(sample.getFontWeight())
          .setBackground(sample.getBackground())
          .setFontSize(sample.getFontSize());
      }
      sh.setColumnWidth(col, width);
    }
    head_(KANA_COL, '読み仮名', 130);
    head_(INSTA_COL, 'インスタ', 150);
    done.push(SEMINARS[key].sheet.replace('📋 ', ''));
  });

  return '🈁 追加項目の列（O:読み仮名／P:インスタ）を用意しました：' + done.join('・');
}

function setupSummaryFormulas() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(SEMINARS).forEach(function (key) {
    var config = SEMINARS[key];
    var sh = ss.getSheetByName(config.sheet);
    if (!sh) return;

    // 5行目：見出し（振込報告済みを追加した8列構成）
    sh.getRange(5, 1, 1, 8).setValues([[
      '申込総数', '確定', '決済案内中', '振込報告済み', 'キャンセル待ち', '期限切れ', 'キャンセル済', '残席'
    ]]);
    // 6行目：自動集計の数式
    sh.getRange(6, 1, 1, 8).setFormulas([[
      '=COUNTA(A10:A1000)',
      '=COUNTIF(G10:G1000,"確定")',
      '=COUNTIF(G10:G1000,"決済案内中")',
      '=COUNTIF(G10:G1000,"振込報告済み")',
      '=COUNTIF(G10:G1000,"キャンセル待ち")',
      '=COUNTIF(G10:G1000,"期限切れ")',
      '=COUNTIF(G10:G1000,"キャンセル済")',
      '=' + config.capacity + '-B6-C6-D6'
    ]]);
    // 体裁
    sh.getRange(5, 1, 1, 8).setFontWeight('bold').setBackground('#f8f4ea').setFontSize(10);
    sh.getRange(6, 1, 1, 8).setFontWeight('bold').setFontSize(12).setHorizontalAlignment('center');
  });
  return '📊 集計エリアを4シートに再設置しました';
}

/*** ============================================================
 * 📖 操作マニュアルシート生成（1回だけ手動実行する関数）
 *
 * 【実行方法】エディタ上部の関数選択で「setupManualSheet」を選び「実行」
 * ※デプロイ不要。何度実行しても作り直されるだけなので安全。
 * ============================================================ */
function setupManualSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var name = '📖 操作マニュアル';
  var sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name, 0); } else { sh.clear(); }

  var C_TITLE = '#9c6f5f', C_HEAD = '#f8f4ea', C_IMPORTANT = '#fdf3ef', C_OK = '#e7f0e7', C_WARN = '#fff3b8';

  var rows = [
    ['神谷さんセミナー受付システム 操作マニュアル', ''],
    ['最終更新：2026-08-05 ／ 詳しい版は「神谷さん受付システム_運用マニュアル.txt」参照', ''],
    ['', ''],
    ['★基本ルール', '申込・キャンセル待ち・繰上げ・3日期限切れは全部自動。状態を変えるとLINE通知も自動で飛びます。'],
    ['★管理画面（推奨）', 'https://apps.l-mine.com/kamiya-seminar-reception/admin.html?key=kamiya-admin-Wq7xR3nT'],
    ['', ''],
    ['🏦 銀行振込の運用（一番大事な作業）', ''],
    ['① お客さまが振込→アプリで報告', '状態が自動で「振込報告済み」になります（報告された振込名義・振込日は備考列に記録）'],
    ['② 通帳/ネットバンクで入金確認', '⚠️振込名義が申込のお名前と違うことがあります。備考列の「名義:〜」と照合してください'],
    ['③ 管理画面で「✔入金確認→確定」を押す', 'これだけで完了！確定LINEが自動で届きます（スプシでG列を「確定」にしてもOK）'],
    ['⚠️ 振込が期限(3日)に間に合わず期限切れになったら', '入金があるのに「期限切れ」になっていたら：管理画面で「↩復帰させる」→「✔確定」の順に押す'],
    ['⚠️ 入金がないまま3日過ぎたら', '何もしなくてOK。自動で期限切れ→本人へLINE通知→待機の方が繰上がります'],
    ['', ''],
    ['📝 スプシを直接さわる場合（G列＝状態 だけ変更）', ''],
    ['「確定」と入力', '確定LINE通知が飛ぶ（入金確認したときなど）'],
    ['「期限切れ」と入力', '期限切れLINE通知＋待機1番が自動繰上げ'],
    ['「キャンセル済」と入力', '待機1番が自動繰上げ（※LINE通知は飛びません。通知も送るなら管理画面の✕キャンセルを使う）'],
    ['⚠️ 文言は完全一致で！', '「確定 」(空白入り)や「かくてい」では反応しません。上の3つをそのままコピーして使うのが安全'],
    ['', ''],
    ['🚫 やってはいけないこと', ''],
    ['行の削除・並べ替え・切り取り', '繰上げ順や自動処理が壊れます。消したい時はG列を「キャンセル済」にするだけ'],
    ['G列以外のセルの編集', '期限・待機順・備考などは自動管理です（メモを書きたい時はK列の備考のみOK）'],
    ['1〜9行目（見出しエリア）の変更', 'データは10行目からです'],
    ['ファイル設定のタイムゾーン変更', '「東京」のまま変えない（期限計算がズレます）'],
    ['', ''],
    ['❓ 困ったら', 'とーるさんへ連絡（このシートは自動生成なので編集しても次回作り直されます）']
  ];

  sh.getRange(1, 1, rows.length, 2).setValues(rows);

  // 体裁
  sh.setColumnWidth(1, 340);
  sh.setColumnWidth(2, 560);
  sh.getRange(1, 1, rows.length, 2).setWrap(true).setVerticalAlignment('top').setFontSize(10);

  // タイトル
  sh.getRange(1, 1, 1, 2).merge().setFontSize(14).setFontWeight('bold')
    .setFontColor('#ffffff').setBackground(C_TITLE).setHorizontalAlignment('center');
  sh.getRange(2, 1, 1, 2).merge().setFontColor('#888888').setFontSize(9).setHorizontalAlignment('center');
  sh.setRowHeight(1, 34);

  // セクション見出しと重要行の色付け
  for (var i = 0; i < rows.length; i++) {
    var r = i + 1;
    var a = String(rows[i][0]);
    if (a.indexOf('🏦') === 0 || a.indexOf('📝') === 0 || a.indexOf('🚫') === 0) {
      sh.getRange(r, 1, 1, 2).setBackground(C_HEAD).setFontWeight('bold').setFontSize(11);
    }
    if (a.indexOf('⚠️') === 0) {
      sh.getRange(r, 1, 1, 2).setBackground(C_WARN);
    }
    if (a.indexOf('★') === 0) {
      sh.getRange(r, 1, 1, 2).setBackground(C_OK).setFontWeight('bold');
    }
    if (a.indexOf('③') === 0) {
      sh.getRange(r, 1, 1, 2).setBackground(C_IMPORTANT).setFontWeight('bold');
    }
  }

  return '📖 操作マニュアルシートを作成しました';
}

/*** ============================================================
 * 📣 お知らせ（アプリ表示＋LINEでのお知らせ）
 *
 * 「アプリに本文を置き、LINEは"見てください"の合図だけ送る」仕組み。
 * シナリオ枠を消費せず、送信後も本文を直せる。
 * スプレッドシートからも、管理アプリからも編集できる。
 *
 * 【シートの列】
 *  A 表示（公開／下書き／通常）  B 対象セミナー  C 対象の状態
 *  D タイトル  E 本文  F LINE通知（送らない／すぐ送る／予約／送信済み）
 *  G 予約日（カレンダー）  H 予約時刻（プルダウン）
 *  I 送信済み日時  J 送信人数
 *
 * 「通常」＝臨時のお知らせが無いときに出る定常メッセージ。
 *          公開の行があればそちらが優先され、下書きに戻すと通常に戻る。
 * ============================================================ */
// 申込が重なったときにロックを待つ上限。ここを過ぎたら「混み合っています」を返す
var LOCK_WAIT_MS = 25000;

var NEWS_SHEET = '📣 お知らせ';
var NEWS_START_ROW = 5;
var NEWS_COLS = 10;
var NEWS_SEM_ALL = 'すべて';
// セミナーをまとめて指定する選択肢（先行＋一般をひとまとめに送りたいとき）
var NEWS_SEM_GROUPS = {
  'セルフ両方': ['self_priority', 'self_general'],
  'マーケ両方': ['marke_priority', 'marke_general']
};
var NEWS_SHOW_LIST   = ['公開', '下書き', '非表示', '通常'];
var NEWS_TARGET_LIST = ['すべて', '確定', 'お支払い待ち', 'キャンセル待ち'];
var NEWS_NOTIFY_LIST = ['送らない', 'すぐ送る', '予約', '送信済み'];

/** 予約時刻の候補（30分きざみ） */
function newsTimeList_() {
  var list = [];
  for (var h = 0; h < 24; h++) {
    list.push(('0' + h).slice(-2) + ':00');
    list.push(('0' + h).slice(-2) + ':30');
  }
  return list;
}

function newsSeminarList_() {
  var list = [NEWS_SEM_ALL];
  Object.keys(NEWS_SEM_GROUPS).forEach(function (g) { list.push(g); });
  Object.keys(SEMINARS).forEach(function (k) { list.push(newsSeminarLabel_(k)); });
  return list;
}

/**
 * お知らせの「対象セミナー」欄と、実際のセミナーが合っているか。
 * すべて → 全部／セルフ両方・マーケ両方 → そのグループ／それ以外 → 名前が一致するか
 */
function newsSeminarMatch_(seminarLabel, key) {
  if (!seminarLabel || seminarLabel === NEWS_SEM_ALL) return true;
  var group = NEWS_SEM_GROUPS[seminarLabel];
  if (group) return group.indexOf(key) !== -1;
  return newsSeminarLabel_(key) === seminarLabel;
}

function newsSeminarLabel_(key) {
  return SEMINARS[key] ? SEMINARS[key].sheet.replace('📋 ', '') : '';
}

function newsStatusMatch_(target, status) {
  if (!target || target === 'すべて') return true;
  if (target === '確定') return status === '確定';
  if (target === 'お支払い待ち') return status === '決済案内中' || status === '振込報告済み';
  if (target === 'キャンセル待ち') return status === 'キャンセル待ち';
  return false;
}

/** 日付セルを yyyy-MM-dd の文字列に */
function newsDateStr_(v) {
  if (!v) return '';
  if (Object.prototype.toString.call(v) === '[object Date]') {
    return Utilities.formatDate(v, 'Asia/Tokyo', 'yyyy-MM-dd');
  }
  return String(v).trim();
}

/** 時刻セルを HH:mm の文字列に（Dateで入っても拾えるように） */
function newsTimeStr_(v) {
  if (!v && v !== 0) return '';
  if (Object.prototype.toString.call(v) === '[object Date]') {
    return Utilities.formatDate(v, 'Asia/Tokyo', 'HH:mm');
  }
  return String(v).trim();
}

/** シートが無ければ作る */
function ensureNewsSheet_() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NEWS_SHEET);
  if (!sh) { setupNewsSheet(); sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NEWS_SHEET); }
  return sh;
}

/** お知らせシートの全行（60秒キャッシュ・表示を重くしないため） */
function newsRows_(useCache) {
  var cache = CacheService.getScriptCache();
  if (useCache !== false) {
    var hit = cache.get('news_rows');
    if (hit) { try { return JSON.parse(hit); } catch (_) {} }
  }
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NEWS_SHEET);
  var rows = [];
  if (sh) {
    var lastRow = sh.getLastRow();
    if (lastRow >= NEWS_START_ROW) {
      var data = sh.getRange(NEWS_START_ROW, 1, lastRow - NEWS_START_ROW + 1, NEWS_COLS).getValues();
      for (var i = 0; i < data.length; i++) {
        var r = data[i];
        if (!String(r[3]).trim() && !String(r[4]).trim()) continue;
        rows.push({
          row: NEWS_START_ROW + i,
          show: String(r[0] || '').trim(),
          seminar: String(r[1] || '').trim(),
          target: String(r[2] || '').trim(),
          title: String(r[3] || '').trim(),
          body: String(r[4] || '').trim(),
          notify: String(r[5] || '').trim(),
          date: newsDateStr_(r[6]),
          time: newsTimeStr_(r[7]),
          sent: r[8] ? formatDateValue_(r[8]) : '',
          count: r[9] || ''
        });
      }
    }
  }
  try { cache.put('news_rows', JSON.stringify(rows), 60); } catch (_) {}
  return rows;
}

function newsCacheClear_() { try { CacheService.getScriptCache().remove('news_rows'); } catch (_) {} }

/**
 * その人に出すお知らせを集める。
 * 「公開」に当てはまるものは【すべて】返す（シートの上から順）。
 * 公開が1件も無ければ「通常」を1件だけ返す。
 * 「下書き」「非表示」は出さない。
 */
function pickNews_(seminarKey, status) {
  var rows = newsRows_();
  var opens = [], normal = null;

  for (var i = 0; i < rows.length; i++) {
    var n = rows[i];
    if (n.show !== '公開' && n.show !== '通常') continue;
    if (!newsSeminarMatch_(n.seminar, seminarKey)) continue;
    if (!newsStatusMatch_(n.target, status)) continue;
    if (n.show === '公開') opens.push({ title: n.title, body: n.body, normal: false });
    else if (!normal) normal = { title: n.title, body: n.body, normal: true };
  }
  if (opens.length) return opens;
  return normal ? [normal] : [];
}

/** 対象者のuidを集める */
function newsTargets_(seminarLabel, target) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var uids = [];
  Object.keys(SEMINARS).forEach(function (key) {
    if (!newsSeminarMatch_(seminarLabel, key)) return;
    var sh = ss.getSheetByName(SEMINARS[key].sheet);
    if (!sh) return;
    var lastRow = sh.getLastRow();
    if (lastRow < DATA_START_ROW) return;
    var data = sh.getRange(DATA_START_ROW, 1, lastRow - DATA_START_ROW + 1, LAST_COL).getValues();
    for (var i = 0; i < data.length; i++) {
      if (!data[i][0]) continue;
      if (!newsStatusMatch_(target, String(data[i][6]))) continue;
      uids.push(String(data[i][0]));
    }
  });
  return uids;
}

/** 1行分を送信して結果を書き戻す */
function sendNewsRow_(n) {
  var uids = newsTargets_(n.seminar, n.target);
  for (var i = 0; i < uids.length; i++) {
    moveScenario_(uids[i], 'お知らせ');   // ⑧＝お知らせの合図（本文はアプリで読む）
    Utilities.sleep(150);
  }
  var sh = ensureNewsSheet_();
  sh.getRange(n.row, 6).setValue('送信済み');
  sh.getRange(n.row, 9).setValue(formatDate_(new Date()));
  sh.getRange(n.row, 10).setValue(uids.length);
  logAction_('news_sent', '', n.seminar + '/' + n.target, n.title, uids.length + '名へ送信');
  newsCacheClear_();
  return uids.length;
}

/** メニュー：「すぐ送る」の行をLINEで送信 */
function sendNewsNow() {
  var ui = SpreadsheetApp.getUi();
  var rows = newsRows_(false).filter(function (n) { return n.notify === 'すぐ送る'; });
  if (!rows.length) {
    ui.alert('送信待ちのお知らせはありません。\n\nF列「LINE通知」を『すぐ送る』にしてから、もう一度実行してください。');
    return;
  }
  var lines = rows.map(function (n) {
    var c = newsTargets_(n.seminar, n.target).length;
    return '・' + (n.seminar || 'すべて') + '／' + (n.target || 'すべて') + '　' + c + '名\n　「' + n.title + '」';
  }).join('\n');
  var res = ui.alert('お知らせをLINEで送ります',
    lines + '\n\n送信してよろしいですか？（送信後は取り消せません）', ui.ButtonSet.OK_CANCEL);
  if (res !== ui.Button.OK) return;

  var total = 0;
  rows.forEach(function (n) { total += sendNewsRow_(n); });
  notifyOps_('📣 お知らせを送りました', total + '名へLINEでお知らせしました。');
  ui.alert('送信しました（合計 ' + total + '名）');
}

/** 予約時刻を過ぎたお知らせを送る（毎時チェックから呼ばれる） */
function sendScheduledNews_() {
  var now = new Date();
  var rows = newsRows_(false).filter(function (n) {
    if (n.notify !== '予約' || !n.date) return false;
    var t = new Date(String(n.date).replace(/-/g, '/') + ' ' + (n.time || '00:00'));
    return !isNaN(t.getTime()) && t.getTime() <= now.getTime();
  });
  var total = 0;
  rows.forEach(function (n) { total += sendNewsRow_(n); });
  if (total) notifyOps_('📣 予約したお知らせを送りました', total + '名へLINEでお知らせしました。');
  return total;
}

/* ---------- 管理アプリ用API ---------- */

function adminNewsList_() {
  return out_({
    ok: true,
    rows: newsRows_(false),
    seminars: newsSeminarList_(),
    targets: NEWS_TARGET_LIST,
    times: newsTimeList_()
  });
}

/** 新規追加 or 上書き保存 */
function adminNewsSave_(p) {
  var sh = ensureNewsSheet_();
  var row = Number(p.row || 0);
  if (!row || row < NEWS_START_ROW) {
    row = Math.max(sh.getLastRow(), NEWS_START_ROW - 1) + 1;
  }
  sh.getRange(row, 1, 1, 8).setValues([[
    p.show || '下書き',
    p.seminar || NEWS_SEM_ALL,
    p.target || 'すべて',
    String(p.title || ''),
    String(p.body || ''),
    p.notify || '送らない',
    p.date || '',
    p.time || ''
  ]]);
  newsCacheClear_();
  logAction_('news_saved', '', p.seminar + '/' + p.target, String(p.title || ''), '管理アプリから保存');
  return out_({ ok: true, row: row });
}

/** 指定行をいま送信する */
/**
 * お知らせのテスト送信。指定した1人のuidにだけ⑧を飛ばす。
 * LINEに届くのは、お知らせの本文ではなく「アプリを見てね」の合図。
 * 本文はアプリを開いたときに、その方の状態に合わせて表示される。
 */
function adminNewsTest_(p) {
  var uid = String(p.uid || '').trim();
  if (!uid) return out_({ ok: false, error: 'uid required' });
  if (!PROLINE_URLS['お知らせ']) return out_({ ok: false, error: 'proline url not set' });

  moveScenario_(uid, 'お知らせ');
  logAction_('news_test', uid, '', 'テスト送信', String(p.title || ''));
  return out_({ ok: true, uid: uid });
}

function adminNewsSend_(p) {
  var row = Number(p.row || 0);
  var target = null;
  newsRows_(false).forEach(function (n) { if (n.row === row) target = n; });
  if (!target) return out_({ ok: false, error: 'row not found' });
  var count = sendNewsRow_(target);
  notifyOps_('📣 お知らせを送りました', count + '名へLINEでお知らせしました。');
  return out_({ ok: true, count: count });
}

/** 送信対象の人数だけ数える（送信前の確認用） */
function adminNewsCount_(p) {
  return out_({ ok: true, count: newsTargets_(p.seminar || NEWS_SEM_ALL, p.target || 'すべて').length });
}

/** 行を削除 */
function adminNewsDelete_(p) {
  var row = Number(p.row || 0);
  if (!row || row < NEWS_START_ROW) return out_({ ok: false, error: 'bad row' });
  var sh = ensureNewsSheet_();
  sh.deleteRow(row);
  newsCacheClear_();
  logAction_('news_deleted', '', '', '行' + row, '管理アプリから削除');
  return out_({ ok: true });
}

/** 📣 お知らせシートを用意する（メニューから実行・何度押しても安全） */
function setupNewsSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(NEWS_SHEET);
  var keep = [];
  if (sh) {
    var lastRow = sh.getLastRow();
    if (lastRow >= NEWS_START_ROW) keep = sh.getRange(NEWS_START_ROW, 1, lastRow - NEWS_START_ROW + 1, NEWS_COLS).getValues();
    sh.clear();
    sh.getRange(1, 1, sh.getMaxRows(), NEWS_COLS).clearDataValidations();
  } else {
    sh = ss.insertSheet(NEWS_SHEET, 2);
  }

  var HEAD = ['表示', '対象セミナー', '対象の状態', 'タイトル', '本文', 'LINE通知', '予約日', '予約時刻', '送信済み日時', '送信人数'];
  sh.getRange(1, 1, 1, NEWS_COLS).merge().setValue('📣 お知らせ（アプリに表示／LINEでお知らせ）')
    .setFontSize(13).setFontWeight('bold').setFontColor('#fff')
    .setBackground('#b18474').setHorizontalAlignment('center');
  sh.getRange(2, 1, 1, NEWS_COLS).merge()
    .setValue('「表示」を公開にするとアプリに出ます。臨時のお知らせを下書きに戻すと通常のメッセージに戻ります。'
            + ' ／ LINEでも知らせたい時は「LINE通知」を すぐ送る（→メニューから実行）か 予約（日付と時刻を入れる）に。'
            + ' ／ 対象セミナーは「セルフ両方」「マーケ両方」でまとめて選べます。'
            + ' ／ 管理アプリの「📣 お知らせ」からも編集できます。')
    .setFontSize(9).setFontColor('#888').setHorizontalAlignment('center').setWrap(true);
  sh.getRange(4, 1, 1, NEWS_COLS).setValues([HEAD])
    .setFontWeight('bold').setBackground('#f8f4ea').setFontSize(10);
  sh.setFrozenRows(4);
  var widths = [80, 110, 110, 190, 360, 100, 110, 90, 140, 80];
  for (var c = 0; c < widths.length; c++) sh.setColumnWidth(c + 1, widths[c]);

  // プルダウン
  var lists = [
    { col: 1, list: NEWS_SHOW_LIST },
    { col: 2, list: newsSeminarList_() },
    { col: 3, list: NEWS_TARGET_LIST },
    { col: 6, list: NEWS_NOTIFY_LIST },
    { col: 8, list: newsTimeList_() }
  ];
  lists.forEach(function (r) {
    var rule = SpreadsheetApp.newDataValidation().requireValueInList(r.list, true).setAllowInvalid(false).build();
    sh.getRange(NEWS_START_ROW, r.col, 200, 1).setDataValidation(rule);
  });

  // 予約日はカレンダーから選べるように（日付の入力規則＋日付表示形式）
  var dateRule = SpreadsheetApp.newDataValidation().requireDate().setAllowInvalid(true)
    .setHelpText('カレンダーから日付を選んでください').build();
  sh.getRange(NEWS_START_ROW, 7, 200, 1).setDataValidation(dateRule).setNumberFormat('yyyy-mm-dd');
  sh.getRange(NEWS_START_ROW, 8, 200, 1).setNumberFormat('@');   // 時刻は文字列扱い
  sh.getRange(NEWS_START_ROW, 5, 200, 1).setWrap(true);

  if (keep.length) {
    sh.getRange(NEWS_START_ROW, 1, keep.length, NEWS_COLS).setValues(keep);
  } else {
    sh.getRange(NEWS_START_ROW, 1, 1, 6).setValues([[
      '通常', NEWS_SEM_ALL, '確定',
      '当日、お会いできますのを楽しみにしております',
      '会場・お時間・持ち物は、下のご案内をご覧ください。\nお気をつけてお越しくださいませ。',
      '送らない'
    ]]);
  }
  newsCacheClear_();
  return '📣 お知らせシートを用意しました';
}
