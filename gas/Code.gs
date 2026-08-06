/*** 神谷梓さん 受付管理システム GAS v2（Webアプリ対応版） ************
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
 *  I:決済日時 J:決済方法 K:備考 L:生年月日 M:職業 N:お悩み
 ***********************************************************/

// ========== 設定 ==========
var TOKEN = 'TOORU-kamiya-reception-hK8pL2';
var ADMIN_TOKEN = 'kamiya-admin-Wq7xR3nT';  // 管理画面専用（名簿閲覧用・一般トークンでは読めない）

// プロライン「外部システム連携用の実行URL」（2026-08-05 とーるさん取得済み）
var PROLINE_URLS = {
  '決済案内':      '',  // シナリオなし（アプリ画面で案内するため通知不要）
  'キャンセル待ち': '',  // 同上
  '空きできました': 'https://autosns.jp/api/call-beacon/bTFA7xmCIj/[[uid]]',  // ⑤あなたの番
  '期限切れ':      'https://autosns.jp/api/call-beacon/T4X1DuWLcP/[[uid]]',  // ⑥期限切れ
  '確定':          'https://autosns.jp/api/call-beacon/fL7KpDojxq/[[uid]]',  // ⑦支払い確定
  '前日リマインド': 'https://autosns.jp/api/call-beacon/qgD9wnxlmt/[[uid]]',  // ⑧（GAS自動発火なし・将来用）
  'キャンセル完了': 'https://autosns.jp/api/call-beacon/fG0RdXOvCs/[[uid]]'   // ⑨キャンセル完了通知
};

// セミナー定義（シート名と定員）
var SEMINARS = {
  'self_priority':   { sheet: '📋 セルフ先行',  capacity: 20, payment: 'cash' },
  'self_general':    { sheet: '📋 セルフ一般',  capacity: 30, payment: 'prepaid' },
  'marke_priority':  { sheet: '📋 マーケ先行',  capacity: 5,  payment: 'prepaid' },
  'marke_general':   { sheet: '📋 マーケ一般',  capacity: 10, payment: 'prepaid' }
};

var DEADLINE_DAYS = 3;   // 決済期限（日数）
var DATA_START_ROW = 10; // データ開始行
var LAST_COL = 14;       // N列まで

// ========== エンドポイント ==========
function doGet(e)  { return handleRequest_(e); }
function doPost(e) { return handleRequest_(e); }

function handleRequest_(e) {
  try {
    var p = {};
    if (e && e.postData && e.postData.contents) {
      try { p = JSON.parse(e.postData.contents); }
      catch(_) { p = e.parameter || {}; }
    } else if (e && e.parameter) {
      p = e.parameter;
    }

    var action = p.action || 'ping';

    // 管理者専用アクション（名簿閲覧・状態操作は管理キー必須）
    var ADMIN_ACTIONS = ['admin_summary', 'read_sheet', 'admin_update_status', 'admin_promote',
                         'admin_save_push_token', 'admin_test_push'];
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
    }

    // トークン認証（一般）
    if (String(p.token) !== String(TOKEN)) {
      return out_({ ok: false, error: 'unauthorized' });
    }

    if (action === 'ping')                 return out_({ ok: true, message: 'GAS alive' });
    // --- v1（プロライン連携） ---
    if (action === 'form_submitted')       return handleFormSubmit_(p);
    if (action === 'payment_completed')    return handlePaymentComplete_(p);
    if (action === 'manual_promote')       return manualPromote_(p);
    if (action === 'check_expired')        return checkExpired();
    // --- v2（Webアプリ用） ---
    if (action === 'get_status')           return getStatus_(p);
    if (action === 'submit_application')   return submitApplication_(p);
    if (action === 'report_bank_transfer') return reportBankTransfer_(p);
    if (action === 'get_capacity')         return getCapacity_(p);
    if (action === 'cancel_application')   return cancelApplication_(p);

    return out_({ ok: false, error: 'unknown action: ' + action });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  }
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
  var result = { ok: true, generated_at: formatDate_(new Date()), seminars: {} };

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
            memo:     data[i][10] || ''
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
  lock.waitLock(10000);
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
        promoteNextWaiting_(sh);
      }
      moveScenario_(uid, 'キャンセル完了');

    } else if (newStatus === '決済案内中') {
      // 復帰（期限切れ・キャンセル済からの救済など）：期限は今から3日
      sh.getRange(row, 6).setValue(formatDate_(new Date(now.getTime() + DEADLINE_DAYS * 86400000)));
      sh.getRange(row, 7).setValue('決済案内中');
      sh.getRange(row, 8).setValue('');

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
function getStatus_(p) {
  var uid = String(p.uid || '');
  if (!uid) return out_({ ok: false, error: 'uid required' });

  var found = findUserAcrossSeminars_(uid);
  if (!found) {
    return out_({ ok: true, uid: uid, seminar: null, status: '未登録' });
  }

  var row = found.data;
  return out_({
    ok: true,
    uid: uid,
    seminar: found.seminarKey,
    status: row[6],
    deadline: row[5] ? formatDateValue_(row[5]) : null,
    wait_number: row[7] || null,
    name: row[1] || '',
    payment_completed: row[6] === '確定',
    payment_method: row[9] || ''
  });
}

// ========== 【v2】Webアプリからの申込受信 ==========
function submitApplication_(p) {
  var seminarKey = p.seminar;
  var config = SEMINARS[seminarKey];
  if (!config) return out_({ ok: false, error: 'unknown seminar: ' + seminarKey });
  if (!p.uid)  return out_({ ok: false, error: 'uid required' });

  // 同時申込対策のロック
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(config.sheet);
    if (!sh) return out_({ ok: false, error: 'sheet not found' });

    // 重複チェック（同uidの既存申込があれば現状を返す）
    var existRow = findRowByUid_(sh, p.uid);
    if (existRow) {
      var st = sh.getRange(existRow, 7).getValue();
      return out_({ ok: true, already: true, status: st, row: existRow });
    }

    // 定員判定
    var occupied = countByStatuses_(sh, ['確定', '決済案内中', '振込報告済み']);
    var isWithinCapacity = occupied < config.capacity;

    var now = new Date();
    var status, deadline, waitNum, scenarioName;

    if (isWithinCapacity) {
      if (config.payment === 'cash') {
        // セルフ先行：当日現金 → 即確定
        status = '確定';
        deadline = '';
        waitNum = '';
        scenarioName = '確定';
      } else {
        status = '決済案内中';
        deadline = formatDate_(new Date(now.getTime() + DEADLINE_DAYS * 86400000));
        waitNum = '';
        scenarioName = '決済案内';
      }
    } else {
      status = 'キャンセル待ち';
      deadline = '';
      waitNum = getNextWaitNumber_(sh);
      scenarioName = 'キャンセル待ち';
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
      '', // I:決済日時
      config.payment === 'cash' && status === '確定' ? '当日現金' : '',
      '', // K:備考
      p.birthday || '',
      p.job || '',
      p.worries || ''
    ]);

    moveScenario_(p.uid, scenarioName);
    logAction_('web_application', p.uid, config.sheet, '→ ' + status, 'Webアプリ経由');

    return out_({ ok: true, status: status, waitNum: waitNum, deadline: deadline });
  } finally {
    lock.releaseLock();
  }
}

// ========== 【v2】振込報告受信 ==========
function reportBankTransfer_(p) {
  var uid = String(p.uid || '');
  if (!uid) return out_({ ok: false, error: 'uid required' });

  var found = findUserAcrossSeminars_(uid);
  if (!found) return out_({ ok: false, error: 'user not found' });

  var sh = found.sheet;
  var row = found.row;
  sh.getRange(row, 7).setValue('振込報告済み');
  sh.getRange(row, 10).setValue('銀行振込');
  var memo = '名義:' + (p.transfer_name || '') +
    (p.transfer_date ? ' 振込日:' + p.transfer_date : '') +
    ' 報告:' + formatDate_(new Date());
  sh.getRange(row, 11).setValue(memo);

  logAction_('bank_transfer_reported', uid, sh.getName(), '→ 振込報告済み', memo);

  // 運営へプッシュ通知（入金確認のアクションが必要なため）
  notifyOps_('🏦 振込のご報告が届きました',
    (found.data[1] || 'どなたか') + 'さんから振込のご報告がありました。入金確認をお願いします。');

  return out_({ ok: true });
}

// ========== 【v2】残席照会 ==========
function getCapacity_(p) {
  var config = SEMINARS[p.seminar];
  if (!config) return out_({ ok: false, error: 'unknown seminar' });

  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(config.sheet);
  if (!sh) return out_({ ok: false, error: 'sheet not found' });

  var confirmed = countByStatuses_(sh, ['確定', '決済案内中', '振込報告済み']);
  var waiting = countByStatuses_(sh, ['キャンセル待ち']);

  return out_({
    ok: true,
    seminar: p.seminar,
    capacity: config.capacity,
    confirmed: confirmed,
    waiting: waiting,
    available: Math.max(0, config.capacity - confirmed)
  });
}

// ========== 【v2】ユーザーキャンセル ==========
function cancelApplication_(p) {
  var uid = String(p.uid || '');
  if (!uid) return out_({ ok: false, error: 'uid required' });

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
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
    } else {
      // 席を持っていた場合：待機1番を繰上げ
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
function findUserAcrossSeminars_(uid) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var keys = Object.keys(SEMINARS);
  for (var k = 0; k < keys.length; k++) {
    var sh = ss.getSheetByName(SEMINARS[keys[k]].sheet);
    if (!sh) continue;
    var lastRow = sh.getLastRow();
    if (lastRow < DATA_START_ROW) continue;
    var data = sh.getRange(DATA_START_ROW, 1, lastRow - DATA_START_ROW + 1, LAST_COL).getValues();
    // 後勝ち：同uidが複数あれば最新（下の行）を返す
    for (var i = data.length - 1; i >= 0; i--) {
      if (String(data[i][0]) === uid) {
        return {
          seminarKey: keys[k],
          sheet: sh,
          row: DATA_START_ROW + i,
          data: data[i]
        };
      }
    }
  }
  return null;
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
    var found = findUserAcrossSeminars_(String(p.uid || ''));
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

  moveScenario_(p.uid, '確定');
  logAction_('payment_completed', p.uid, sh.getName(), '→ 確定', p.method || '');

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
      // 期限切れシナリオ通知（本人向け）
      if (newValue === '期限切れ') {
        moveScenario_(uid, '期限切れ');
      }
      // 待機順1番を繰り上げ
      promoteNextWaiting_(sh);
      logAction_('manual_status_change', uid, sheetName, '→ ' + newValue, '');
    }

    // 手動で「確定」に変更（振込確認時）→ 確定シナリオ通知
    if (newValue === '確定') {
      moveScenario_(uid, '確定');
      logAction_('manual_confirm', uid, sheetName, '→ 確定', '手動確認');
    }
  } catch (err) {
    // onEditはエラーを外に投げると危険なのでログのみ
    try { logAction_('error', '', '', 'onEdit: ' + err, ''); } catch(_) {}
  }
}

// ========== ④時限トリガー：3日期限チェック ==========
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

  // 🏦支払い状況シートも最新化（1時間ごとに自動更新される）
  try { setupPaymentStatusSheet(); } catch (_) {}

  return out_({ ok: true, expiredCount: expiredCount });
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
  var deadline = new Date(Date.now() + DEADLINE_DAYS * 86400000);
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
    return "{'" + s + "'!B10:K1000, ARRAYFORMULA(IF(LEN('" + s + "'!A10:A1000),\"" + label + "\",\"\"))}";
  });
  var stack = '{' + parts.join(';') + '}';
  // 列対応: Col1=名前 Col2=メール Col3=電話 Col4=申込日時 Col5=期限
  //         Col6=状態 Col7=待機順 Col8=決済完了 Col9=決済方法 Col10=備考 Col11=セミナー名

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
    ['お名前', '参加セミナー', 'メール', '電話', '決済方法', '申込日時'],
    '=IFERROR(QUERY(' + stack + ',"select Col1, Col11, Col2, Col3, Col9, Col4 where Col6=\'確定\' and Col1 is not null order by Col11, Col4",0),"まだ確定の方はいません")'
  );

  buildSheet(
    '💎 準見込みリスト',
    '💎 準見込みリスト（申込意思あり・参加に至らなかった方）',
    '※期限切れ/キャンセル済の方が自動で並びます。次回セミナーの再アプローチ候補！（さわらない）',
    ['お名前', '対象セミナー', '状態', 'メール', '電話', '申込日時'],
    '=IFERROR(QUERY(' + stack + ',"select Col1, Col11, Col6, Col2, Col3, Col4 where (Col6=\'期限切れ\' or Col6=\'キャンセル済\') and Col1 is not null order by Col4 desc",0),"まだ該当の方はいません")'
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
