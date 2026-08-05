// 神谷さん受付管理 FCM用 Service Worker（プッシュ通知の受信＋PWA）
// ※エルラボ＋と同じFirebaseプロジェクト(elabo-plus)を運営通知専用に利用
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBpBpGmxfWhyHq3rzwH2Oa_6IWDIZbOAj8",
  authDomain: "elabo-plus.firebaseapp.com",
  projectId: "elabo-plus",
  storageBucket: "elabo-plus.firebasestorage.app",
  messagingSenderId: "452649305918",
  appId: "1:452649305918:web:4bef5bae57aee4d86c4e6f"
});

const messaging = firebase.messaging();

// バックグラウンドでプッシュ受信 → 通知を表示（data形式で送る想定）
messaging.onBackgroundMessage(function(payload){
  var d = payload.data || payload.notification || {};
  var title = d.title || '受付管理';
  var options = {
    body: d.body || '',
    icon: 'assets/icon-192.png',
    badge: 'assets/icon-192.png',
    data: { url: d.url || 'https://apps.l-mine.com/kamiya-seminar-reception/admin.html' }
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', function(event){
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || 'https://apps.l-mine.com/kamiya-seminar-reception/admin.html';
  event.waitUntil(clients.openWindow(url));
});

// 通信には一切介入しない（fetchハンドラを置くとiOSでGAS通信が失敗するため削除）
// SWは新版を即時有効化（更新待ちで古いSWが残らないように）
self.addEventListener('install', function(){ self.skipWaiting(); });
self.addEventListener('activate', function(e){ e.waitUntil(clients.claim()); });
