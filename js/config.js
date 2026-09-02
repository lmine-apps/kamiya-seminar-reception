/* ===== 神谷梓さんセミナー受付 設定 ===== */
const CONFIG = {
  // GAS Web App
  GAS_URL: 'https://script.google.com/macros/s/AKfycbwZvWsBLfbSGF3NW1brPZY1gO9Jm5-dDgYeyT_OVNxOo4_Apj5FQ9AgYdT4Cin0Glh-/exec',
  TOKEN: 'TOORU-kamiya-reception-hK8pL2',

  // Stripe決済（プロライン）
  // prid: 埋め込みフォームPOST用（アプリから直接Stripeカード入力へ）
  // STRIPE_URLS: 予備の決済ページ（/pd/・うまく開かない場合の逃げ道）
  STRIPE_CHECKOUT_ACTION: 'https://gr8dq5cg.autosns.app/api/stripe/create-checkout-session/',
  STRIPE_PRIDS: {
    marke_priority: 'dZ7LuNr8e4',
    marke_general:  'dZ7LuNr8e4',
    self_priority:  '',   // 当日現金のため不要
    self_general:   'o0KefDZWky'
  },
  // マーケは当初どおり公式LINE連携＋プロライン経由の決済に戻しました（2026-09-02）。
  // 下はLINEなし方式で使う予定だったStripe決済リンクの置き場。いまは使いません。
  STRIPE_MARKE_LINK: '',

  STRIPE_URLS: {
    marke_priority: 'https://gr8dq5cg.autosns.app/pd/dZ7LuNr8e4',
    marke_general:  'https://gr8dq5cg.autosns.app/pd/dZ7LuNr8e4',
    self_priority:  '',
    self_general:   'https://gr8dq5cg.autosns.app/pd/o0KefDZWky'
  },
  // テスト決済（管理画面のスイッチがONの時だけこちらに切替・prod_V1MdxTyHZWljfk）
  STRIPE_URLS_TEST: {
    marke_general: 'https://gr8dq5cg.autosns.app/pd/qALE9e5Q18'
  },

  // 銀行振込先
  BANK_INFO: {
    bank: '沖縄銀行',
    branch: '安慶名支店（店番314）',
    type: '普通',
    number: '1970581',
    holder: '株式会社ボヌールルリアン'
  },

  // 会場（既定値＝セミナー個別のvenue未設定時のフォールバック）
  VENUE: {
    name: '沖縄県総合福祉センター 402号室',
    address: '〒903-8603 沖縄県那覇市首里石嶺町4-373-1',
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('沖縄県総合福祉センター')
  },

  // セミナー定義
  SEMINARS: {
    self_priority: {
      title: 'セルフイメージセミナー【先行受付】',
      shortTitle: 'セルフイメージセミナー',
      schedule: '9月18日（金）11:00〜15:00',
      dates: ['2026-09-18'],
      price: '10,000円（税込）',
      capacity: 20,
      payment: 'cash',   // 当日現金
      paymentNote: '当日、会場にて現金でお支払いください。',
      items: '筆記用具',
      venue: {
        name: '沖縄県総合福祉センター 402号室',
        address: '〒903-8603 沖縄県那覇市首里石嶺町4-373-1',
        mapUrl: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('沖縄県総合福祉センター')
      }
    },
    self_general: {
      title: 'セルフイメージセミナー【一般受付】',
      shortTitle: 'セルフイメージセミナー',
      schedule: '9月18日（金）11:00〜15:00',
      dates: ['2026-09-18'],
      price: '10,000円（税込）',
      capacity: 30,
      payment: 'prepaid',   // 事前決済（カード／振込）
      paymentNote: 'クレジットカード決済または銀行振込にてお支払いください。',
      items: '筆記用具',
      venue: {
        name: '沖縄県総合福祉センター 402号室',
        address: '〒903-8603 沖縄県那覇市首里石嶺町4-373-1',
        mapUrl: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('沖縄県総合福祉センター')
      }
    },
    marke_priority: {
      title: 'マーケティングセミナー【先行受付】',
      shortTitle: 'マーケティングセミナー',
      schedule: '9/29(火)・10/29(木)・11/25(水) 全3回 11:00〜15:00',
      dates: ['2026-09-29', '2026-10-29', '2026-11-25'],
      price: '98,000円（税込・全3回分）',
      capacity: 5,
      payment: 'prepaid',
      paymentNote: 'クレジットカード決済または銀行振込にてお支払いください。',
      items: '筆記用具',
      venue: {
        name: '沖縄県総合福祉センター（9/29・11/25＝401号室／10/29＝402号室）',
        address: '〒903-8603 沖縄県那覇市首里石嶺町4-373-1',
        mapUrl: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('沖縄県総合福祉センター')
      }
    },
    // 2026-08-17 変更: マーケは先行枠なしの一般募集のみ（15名）。名称からも【一般受付】を外した
    marke_general: {
      // 受付前に残席を出さない（2026-09-02）。
      // 「キャンセル待ちらしい」と先に見えると申込をためらわれるため、
      // フォームは誰にでもお出しし、送信して初めて結果をお伝えする。
      hideCapacity: true,
      // 受付のあと、お支払い方法をお選びいただく（2026-09-02）。
      // お選びいただいた時点でお支払い期限が決まる。
      // {T} には、GASが返す期限の長さ（20分／24時間 など）が入る。
      // 期限を変えるときは、GAS側の SEMINARS の数字だけを直せばよい。
      paymentChoice: {
        card: { label: 'クレジットカード', note: '受付から{T}以内にお支払い',
                fallback: 20 },
        bank: { label: '銀行振込',         note: '{T}以内にお振込ください',
                fallback: 1440,
                extra: 'お振込後、アプリから「振込完了のご連絡」をいただければ、お席は確保されます' }
      },
      title: 'マーケティングセミナー',
      shortTitle: 'マーケティングセミナー',
      schedule: '9/29(火)・10/29(木)・11/25(水) 全3回 11:00〜15:00',
      dates: ['2026-09-29', '2026-10-29', '2026-11-25'],
      price: '98,000円（税込・全3回分）',
      capacity: 15,
      payment: 'prepaid',
      paymentNote: 'クレジットカード決済または銀行振込にてお支払いください。',
      items: '筆記用具',
      venue: {
        name: '沖縄県総合福祉センター（9/29・11/25＝401号室／10/29＝402号室）',
        address: '〒903-8603 沖縄県那覇市首里石嶺町4-373-1',
        mapUrl: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('沖縄県総合福祉センター')
      }
    }
  },

  // 待機順ポーリング間隔（ミリ秒）
  WAIT_POLL_INTERVAL: 15000,

  // カード決済完了の「お客さま申告」機能を使うか（GAS v7.3以降で true にする）
  // false の間は、決済画面のボタンも ?paid=1 の自動報告も動かない＝従来どおりの動き
  CARD_SELF_REPORT: false,

  // 特別枠（ゲスト受付）の合言葉キー
  // 使い方: apply.html?seminar=◯◯&guest=azg-Kx7m2 のURLを運営が個別に渡す
  GUEST_KEY: 'azg-Kx7m2'
};
