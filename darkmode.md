# ダークモード実装計画

## ゴール
- システム／ユーザーのテーマ選択に応じて `html` に `light` / `dark` クラスを付与し、全ページでテーマトークンが機能する状態にする。
- ユーザーがダッシュボードのUIからテーマを即時切り替えられるようにし、選択をローカルに永続化する。
- ページ初回ロード時の FOUC（Flash of Unstyled Content）を避け、アクセシビリティを満たすトグルを用意する。

## 現状と前提
- `app/layout.tsx` で `html` 要素に `dark:` 系クラスが付与されているが、テーマを制御するロジックは存在しない。
- `app/globals.css` には `.dark` クラス用のカラートークンが定義済みで、shadcn/uiベースのコンポーネントも `dark:` バリアントに対応している。
- ダッシュボードのヘッダー（`app/(dashboard)/layout.tsx`）にユーザーメニューがあり、トグル差し込み先として利用できる。

## 実装ステップ
1. **依存関係と基盤整備**
   - `pnpm add next-themes` でクラスベースのテーマスイッチャーを導入する。
   - 型定義は同梱されているため追加不要。

2. **ThemeProvider の作成と適用**
   - `components/providers/theme-provider.tsx`（新規）を作成し、`next-themes` の `ThemeProvider` をラップ。
   - `attribute: 'class'`, `defaultTheme: 'system'`, `enableSystem: true`, `disableTransitionOnChange: true` を設定し、サーバレンダリングとの統合で `suppressHydrationWarning` を付与。
   - `app/layout.tsx` の `<html>` から静的な `bg-` クラスを外し、`<body>` に `className="min-h-[100dvh] bg-background text-foreground"` を適用。
   - `<body>` 直下に `ThemeProvider` を配置し、既存の `SWRConfig` などを子要素にラップする。

3. **テーマトグルUIの実装**
   - `components/theme-toggle.tsx`（新規）を作成し、`useTheme()` で `theme`, `setTheme` を取得。
   - ボタン、もしくは `DropdownMenu` 内に `Light`, `Dark`, `System` の3択を用意。`sun`, `moon` アイコン（`lucide-react`）で状態を視覚化。
   - フォーカスリングやARIA属性（`aria-label`）を設定し、キーボード操作・スクリーンリーダーに対応。

4. **トグルの組み込み**
   - `app/(dashboard)/layout.tsx` の `Header` コンポーネントに `ThemeToggle` を追加。ログイン済み・未ログイン双方で表示できるよう、ユーザーメニュー横に配置。
   - 必要に応じてトップページなど共通ヘッダーにも導入。未ログインビューのレイアウトを確認し、影響範囲を整理。

5. **初期テーマとスタイル整合性の確認**
   - `ThemeProvider` がクライアント側で初期化される際の FOUC を避けるため、`suppressHydrationWarning` と `defaultTheme` 設定を再確認。
   - `app/(login)` 系やモーダルコンポーネントでも `.dark` クラスが動作するか確認。`bg-gray-50` など固定色が残っている箇所を `bg-background` / `text-foreground` へ順次置換。

6. **QAとドキュメント**
   - `pnpm dev` でライト／ダーク切替、システムテーマ追従、リロード後の永続化を目視確認。
   - 実装後に `README.md` または `docs/` にテーマ切替の手順を記載（任意）。PRではスクリーンショットを添付する。

## 想定される追加検討事項
- マーケティングサイト（`app/page.tsx` など）にもトグルを露出するか、ダッシュボード限定とするか。
- 認証前ページでのテーマ永続化（Cookie共有など）を行うか。
- 将来的に自動ダークモードテストを追加する場合、Playwrightでのスクリーンショット比較を検討。

