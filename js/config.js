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
    marke_general: {
      title: 'マーケティングセミナー【一般受付】',
      shortTitle: 'マーケティングセミナー',
      schedule: '9/29(火)・10/29(木)・11/25(水) 全3回 11:00〜15:00',
      dates: ['2026-09-29', '2026-10-29', '2026-11-25'],
      price: '98,000円（税込・全3回分）',
      capacity: 10,
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

  // 特別枠（ゲスト受付）の合言葉キー
  // 使い方: apply.html?seminar=◯◯&guest=azg-Kx7m2 のURLを運営が個別に渡す
  GUEST_KEY: 'azg-Kx7m2'
};
