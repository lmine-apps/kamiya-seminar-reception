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

/** GAS API呼び出し（POST・text/plainでプリフライト回避） */
async function apiPost(action, body) {
  const payload = Object.assign({ action: action, token: CONFIG.TOKEN }, body || {});
  const res = await fetch(CONFIG.GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('network error: ' + res.status);
  return res.json();
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

/** 期限カウントダウン開始 */
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
    el.textContent = (d > 0 ? d + '日 ' : '') + h + '時間 ' + m + '分';
    setTimeout(tick, 30000);
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

/** HTMLエスケープ */
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}
