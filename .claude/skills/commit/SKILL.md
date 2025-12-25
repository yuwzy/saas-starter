---
name: commit
description: Gitコミットを自動で行うスキル。変更内容を分析してConventional Commits形式のメッセージを自動生成し、ステージングからコミットまで実行する。「/commit」で呼び出す。機密情報を含むファイルは自動で除外する。
---

# Git Commit

変更内容を分析し、Conventional Commits形式でコミットメッセージを自動生成してコミットを実行する。

## ワークフロー

### 1. 状態確認（並列実行）

```bash
git status                    # 未追跡・変更ファイル一覧
git diff                      # ステージされていない変更
git diff --cached             # ステージ済みの変更
git log --oneline -5          # 直近のコミット履歴（スタイル参考用）
```

### 2. 機密ファイルの除外

以下のファイルはステージングから除外する：

- `.env*`（`.env`, `.env.local`, `.env.production`など）
- `credentials*.json`
- `*secret*`
- `*.pem`, `*.key`
- `config/secrets.yml`

該当ファイルがある場合、ユーザーに警告を表示する。

### 3. コミット前チェック

プロジェクトに応じて以下を実行：

| ファイル/設定                 | 実行コマンド                                |
| ----------------------------- | ------------------------------------------- |
| `package.json` に `lint`      | `pnpm lint` または `npm run lint`           |
| `package.json` に `typecheck` | `pnpm typecheck` または `npm run typecheck` |
| `package.json` に `build`     | `pnpm build` または `npm run build`         |
| `.pre-commit-config.yaml`     | `pre-commit run --all-files`                |

チェックが失敗した場合はコミットを中止し、エラーを報告する。

### 4. ステージング

```bash
git add <対象ファイル>
```

- 機密ファイルは除外
- ユーザーが特定ファイルを指定した場合はそれに従う

### 5. コミットメッセージ生成

Conventional Commits形式で生成：

```
<type>(<scope>): <description>

[optional body]
```

**type一覧：**

| type       | 用途                               |
| ---------- | ---------------------------------- |
| `feat`     | 新機能追加                         |
| `fix`      | バグ修正                           |
| `docs`     | ドキュメントのみ                   |
| `style`    | フォーマット変更（動作に影響なし） |
| `refactor` | リファクタリング                   |
| `perf`     | パフォーマンス改善                 |
| `test`     | テスト追加・修正                   |
| `chore`    | ビルド・ツール・依存関係更新       |
| `ci`       | CI設定変更                         |

**scope**: 変更対象のモジュール/機能名（任意）

**description**:

- 日本語または英語（リポジトリの既存コミットに合わせる）
- 命令形で記述
- 50文字以内

### 6. コミット実行

```bash
git commit -m "<message>"
```

### 7. 結果確認

```bash
git status
git log --oneline -1
```

## 使用例

**入力:** `/commit`

**出力:**

```
変更内容を分析しました：
- lib/db/queries.ts: 新しいクエリ関数追加
- app/api/users/route.ts: エンドポイント追加

コミットメッセージ:
feat(api): add user creation endpoint

コミットが完了しました。
```

## 注意事項

- `--no-verify` は使用しない（pre-commit hookを尊重）
- `--amend` は使用しない（新規コミットのみ）
- 変更がない場合は空コミットを作成しない
