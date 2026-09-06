/* ===== 共通処理：uid管理・GAS API呼び出し ===== */

/** uid取得（URL → localStorage の順。URLにあれば保存） */
function getUid() {
  const urlUid = new URLSearchParams(location.search).get('uid');
  if (urlUid && urlUid !== '[[uid]]') {
    try { localStorage.setItem('kamiya_uid', urlUid); } catch (_) {}
    return urlUid;
  }
  try { return localStorage.getItem('kamiya_uid'); } catch (_) { return null; }
}

/** GAS API呼び出し（GET） */
async function apiGet(action, params) {
  const url = new URL(CONFIG.GAS_URL);
  url.searchParams.set('action', action);
  url.searchParams.set('token', CONFIG.TOKEN);
  for (const k in (params || {})) url.searchParams.set(k, params[k]);
  const res = await fetch(url.toString(), { method: 'GET' });
  if (!res.ok) throw new Error('network error: ' + res.status);
  return res.json();
}

/** GAS API呼び出し（POST・text/plainでプリフライト回避）
 *  timeoutMs を渡すと、その時間で打ち切る。
 *  混雑時にサーバーの返事が数分返らないことがあり、
 *  そのまま待つと画面が固まって見えるため。打ち切って送り直すほうが速い。 */
async function apiPost(action, body, timeoutMs) {
  const payload = Object.assign({ action: action, token: CONFIG.TOKEN }, body || {});
  let ctrl = null, timer = null;
  if (timeoutMs && typeof AbortController !== 'undefined') {
    ctrl = new AbortController();
    timer = setTimeout(() => ctrl.abort(), timeoutMs);
  }
  try {
    const res = await fetch(CONFIG.GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      signal: ctrl ? ctrl.signal : undefined
    });
    if (!res.ok) throw new Error('network error: ' + res.status);
    return res.json();
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** ローディング表示切替 */
function showLoading(show) {
  const el = document.getElementById('loading');
  if (el) el.style.display = show ? 'flex' : 'none';
}

/** 画面セクション切替（.screen のうち1つだけ表示） */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
  showLoading(false);
  window.scrollTo(0, 0);
}

/** uid無しフォールバック画面 */
function showNoUid() {
  showScreen('screen-nouid');
}

/** エラー画面 */
function showError(msg) {
  const el = document.getElementById('error-detail');
  if (el && msg) el.textContent = msg;
  showScreen('screen-error');
}

/** 期限カウントダウン開始（1秒刻み） */
function startCountdown(deadlineStr, elId) {
  const el = document.getElementById(elId);
  if (!el || !deadlineStr) return;
  const deadline = new Date(deadlineStr.replace(/-/g, '/')); // Safari対応
  function tick() {
    const diff = deadline - new Date();
    if (diff <= 0) {
      el.textContent = '期限を過ぎています';
      el.classList.add('expired');
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor(diff % 86400000 / 3600000);
    const m = Math.floor(diff % 3600000 / 60000);
    const s = Math.floor(diff % 60000 / 1000);
    el.textContent = (d > 0 ? d + '日 ' : '') + h + '時間 ' + m + '分 ' + s + '秒';
    setTimeout(tick, 1000);
  }
  tick();
}

/**
 * フリップ式カウントダウン開始（1秒刻み・秒境界に同期）
 * @param {string} deadlineStr 期限日時
 * @param {string} rootId .luxury-countdown 要素のID
 */
function startFlipCountdown(deadlineStr, rootId) {
  const root = document.getElementById(rootId);
  if (!root || !deadlineStr) return;
  const deadline = new Date(String(deadlineStr).replace(/-/g, '/')); // Safari対応

  // 再表示時は前のタイマーを停止してリセット
  if (root._flipTimer) clearTimeout(root._flipTimer);
  root.classList.remove('is-expired');
  let firstRender = true;

  function createDigits(container, value) {
    container.innerHTML = '';
    value.split('').forEach(function (n) {
      const d = document.createElement('span');
      d.className = 'luxury-countdown__digit';
      d.textContent = n;
      d.dataset.value = n;
      container.appendChild(d);
    });
  }

  function updateDigits(unitName, value) {
    const container = root.querySelector('[data-unit="' + unitName + '"]');
    if (!container) return;
    const formatted = String(value).padStart(2, '0');
    const digits = container.querySelectorAll('.luxury-countdown__digit');
    if (firstRender || digits.length !== formatted.length) {
      createDigits(container, formatted);
      return;
    }
    formatted.split('').forEach(function (newNum, i) {
      const digit = digits[i];
      if (digit.dataset.value === newNum) return;
      digit.classList.remove('flip-in');
      digit.classList.add('flip-out');
      setTimeout(function () {
        digit.textContent = newNum;
        digit.dataset.value = newNum;
        digit.classList.remove('flip-out');
        digit.classList.add('flip-in');
        setTimeout(function () { digit.classList.remove('flip-in'); }, 220);
      }, 180);
    });
  }

  /* 残りが短いときに「00 DAYS 00 HOURS」と並ぶのは分かりにくいので、
     必要な単位だけをお見せする。単位のうしろの「:」も一緒に隠す。 */
  function setUnitVisible(unitName, show) {
    const container = root.querySelector('[data-unit="' + unitName + '"]');
    if (!container) return;
    const unit = container.closest('.luxury-countdown__unit');
    if (!unit) return;
    unit.style.display = show ? '' : 'none';
    const sep = unit.nextElementSibling;
    if (sep && sep.classList.contains('luxury-countdown__separator')) {
      sep.style.display = show ? '' : 'none';
    }
  }

  function tick() {
    const diff = deadline.getTime() - Date.now();
    if (diff <= 0) {
      root.classList.add('is-expired');
      return;
    }
    setUnitVisible('days',  diff >= 86400000);   // 1日未満なら「日」は出さない
    setUnitVisible('hours', diff >= 3600000);    // 1時間未満なら「時間」も出さない
    updateDigits('days',    Math.floor(diff / 86400000));
    updateDigits('hours',   Math.floor(diff % 86400000 / 3600000));
    updateDigits('minutes', Math.floor(diff % 3600000 / 60000));
    updateDigits('seconds', Math.floor(diff % 60000 / 1000));
    firstRender = false;
    // 秒の境目に同期（ズレ補正）
    root._flipTimer = setTimeout(tick, 1000 - (Date.now() % 1000) + 20);
  }
  tick();
}

/** 日時文字列を「8月20日（木）12:00」形式に */
function formatDeadline(str) {
  if (!str) return '';
  const d = new Date(String(str).replace(/-/g, '/'));
  if (isNaN(d)) return str;
  const week = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()];
  return (d.getMonth() + 1) + '月' + d.getDate() + '日（' + week + '）' +
    d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0');
}

/**
 * ステップ表示を描画（迷子防止バー）
 * @param {string} containerId 描画先要素ID
 * @param {number} current いま何ステップ目か（1始まり）
 * @param {boolean} isCash 当日現金（支払いステップなし）なら true
 * @param {boolean} allDone 全ステップ完了表示にするなら true
 */
function renderSteps(containerId, current, isCash, allDone) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const labels = isCash ? ['お申込み', 'ご参加確定'] : ['お申込み', 'お支払い', 'ご参加確定'];
  el.className = 'steps-bar';
  el.innerHTML = labels.map((label, i) => {
    const n = i + 1;
    let cls = 'step';
    if (allDone || n < current) cls += ' done';
    else if (n === current) cls += ' active';
    const mark = (allDone || n < current) ? '✓' : n;
    return '<div class="' + cls + '"><div class="dot">' + mark + '</div><span class="label">' + esc(label) + '</span></div>';
  }).join('');
}

/** セミナー個別の会場情報を取得（未設定なら既定値VENUEにフォールバック） */
function getVenue(sem) {
  return (sem && sem.venue) ? sem.venue : CONFIG.VENUE;
}

/** HTMLエスケープ */
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}


/* ============================================================
   分割でのお支払いのご案内（受付ページとお支払い画面の共通・v81）
   ============================================================ */
/**
 * 分割でのお支払いのご案内（たたんである・v80）。
 * カードは一括でお手続きいただいたあと、カード会社へのお電話で分割に変更できる。
 * 98,000円と高額なため、これを知っていただくだけでお手続きに進みやすくなる。
 * 手数料のことは、あとで「聞いていない」とならないよう先にお伝えしておく。
 */
function installmentNote_(sem) {
  const price = (sem && sem.price) ? String(sem.price).replace(/（.*$/, '') : '';
  const title = (sem && sem.shortTitle) || 'セミナー';
  return '' +
  '<details class="acc-note">' +
    '<summary>💳 分割でのお支払いをご希望の方へ</summary>' +
    '<div class="acc-body">' +
      'カードでのお支払いは、<strong>一括でお手続きいただいたあとに、分割へ変更できます。</strong>' +
      'この画面では一括のお手続きだけをお願いいたします。' +
      '<span class="acc-step"><br><strong>お手続きの流れ</strong></span>' +
      '<span class="acc-step">① この画面から、カードでお支払いをお済ませください</span>' +
      '<span class="acc-step">② カード裏面の電話番号へ、お客さまからお電話ください</span>' +
      '<span class="acc-step">③「' + esc(title) + 'の' + esc(price) +
        'のお支払いを、24回の分割にしたい」とお伝えください</span>' +
      '<span class="acc-step"><br>たいていのカードは<strong>2〜24回</strong>に対応しております' +
      '（まれに36回まで対応のカードもございます）。</span>' +
      '<span class="acc-fine">' +
        '※ 分割でのお支払いには、カード会社所定の手数料がかかります。<br>' +
        '※ 分割にできる金額の枠は、ショッピング枠（ご利用限度額）より小さく' +
        '設定されていることがございます（例：30万円まで など）。' +
        '気になる場合は、<strong>お支払いの前に</strong>カード裏面の番号へ' +
        'お問い合わせくださいませ。<br>' +
        '※ お手続きはカード会社とお客さまのあいだで完結いたします。' +
        '当方でのお取り扱いはございません。' +
      '</span>' +
    '</div>' +
  '</details>';
}
