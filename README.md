# 神谷梓さん セミナー受付Webアプリ

LINE（プロラインフリー）＋ Webアプリのハイブリッド構成で、4セミナーの受付・決済案内・キャンセル待ち・繰上げを自動管理するシステム。

## 構成

- **フロント**：静的Webアプリ（GitHub Pages）
- **バックエンド**：GAS Web App（`gas/Code.gs`）
- **DB**：Googleスプレッドシート「神谷さん受付管理」
- **決済**：Stripe（プロライン経由）
- **通知**：LINE（プロラインフリー call-beacon）

## URL構造

```
index.html              … ホーム（uid状態別に画面出し分け）
apply.html?seminar=xxx  … 受付フォーム（4セミナー共通）
```

seminar パラメータ：`self_priority` / `self_general` / `marke_priority` / `marke_general`

すべてのURLに `&uid=[[uid]]` を付与（プロラインが自動置換）。uidは localStorage に保持。

## 状態遷移

```
未登録 → 申込 → ┬ 定員内(事前決済) → 決済案内中 → 確定 / 期限切れ(3日)
                ├ 定員内(当日現金)  → 確定
                └ 定員外           → キャンセル待ち → (空きで繰上げ) → 決済案内中
```

## デプロイ

- GitHub Pages（main branch / root）
- GAS更新時：Apps Scriptエディタでコード置換 → デプロイを管理 → 新バージョン

## ファイル

| ファイル | 役割 |
|---|---|
| `index.html` | ホーム・状態別画面（決済/待機/確定/期限切れ） |
| `apply.html` | 受付フォーム |
| `js/config.js` | セミナー定義・GAS URL・振込先等の設定 |
| `js/common.js` | uid管理・API呼び出し共通処理 |
| `css/style.css` | 共通スタイル |
| `gas/Code.gs` | GASバックエンド（スプシに貼付するコード） |
