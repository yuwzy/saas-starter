---
description: プロジェクト固有のルールでIssueをトリアージ
---

このIssueを以下のルールに従ってトリアージしてください:

## ラベル付けルール

### タイプの判定

- エラー、バグ、不具合、動作しない、500エラー、クラッシュ、例外、エラーログ → `bug`
- 新機能、追加、改善、〜が欲しい、〜を実装、機能追加、リクエスト → `enhancement`
- ドキュメント、README、説明、ガイド、チュートリアル、コメント、API仕様 → `documentation`
- 質問、how to、使い方、分からない、確認、相談 → `question`

### 優先度の判定

- **priority/critical**: サービス停止、セキュリティ脆弱性、データ損失、全ユーザーに影響、本番環境で動作しない、認証が機能しない
- **priority/high**: 主要機能の障害（支払い、認証、ダッシュボード）、多数のユーザーに影響、回避策なし、Stripe連携エラー
- **priority/medium**: 一部機能の問題、一部ユーザーに影響、回避策あり、UIの不具合、パフォーマンス問題
- **priority/low**: 軽微な問題、UXの改善、将来の機能追加、スタイリングの調整、タイポ修正

### 領域の判定

- UI/UX、React、コンポーネント、スタイル、CSS、Tailwind、shadcn/ui、ダッシュボード画面、フォーム、レスポンシブ → `area/frontend`
- API、エンドポイント、サーバー、Next.js API Routes、Server Actions、ミドルウェア、ルーティング → `area/backend`
- DB、テーブル、クエリ、migration、PostgreSQL、Drizzle、スキーマ、シードデータ、リレーション → `area/database`
- ログイン、認証、認可、JWT、セッション、パスワード、セキュリティ設定、middleware.ts → `area/auth`
- Stripe、支払い、サブスクリプション、チェックアウト、Webhook、顧客ポータル、プラン管理 → `area/payments`
- チーム管理、メンバー招待、権限管理、アクティビティログ → `area/teams`
- 記事管理、CMS、カテゴリ、タグ、公開設定 → `area/articles`

## 追加タスク

- 初心者向けの簡単なタスク(ドキュメント修正、タイポ修正、軽微なスタイル調整など)は `good-first-issue` を付与
- セキュリティ関連のIssueには `security` ラベルを追加
- パフォーマンス関連のIssueには `performance` ラベルを追加
- 情報が不足している場合は、以下のテンプレートで追加情報を依頼:

  「このIssueについてもう少し詳しく教えてください:
  - 再現手順
  - 期待される動作
  - 実際の動作
  - エラーメッセージ(あれば)
  - 環境情報（ブラウザ、OS、Node.jsバージョンなど）」

## プロジェクト固有の技術スタック

このプロジェクトは以下の技術を使用しています:

- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript
- **UI**: React 19, Tailwind CSS, shadcn/ui
- **データベース**: PostgreSQL + Drizzle ORM
- **認証**: JWT (jose)
- **支払い**: Stripe
- **パッケージマネージャー**: pnpm

これらの技術に関連するキーワードが含まれている場合は、適切な領域ラベルを付与してください。
