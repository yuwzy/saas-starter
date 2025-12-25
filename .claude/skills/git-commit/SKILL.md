---
name: git-commit
description: Creates Git commits following conventional commit standards. Use when you need to commit staged changes with proper formatting, or when the user asks to commit code changes.
allowed-tools: Bash, Read, Grep
---

# Git Commit Skill

このスキルは、変更をGitコミットとして適切にコミットします。Conventional Commitsフォーマットに従い、プロジェクトの標準に準拠したコミットメッセージを生成します。

## Instructions

このスキルを実行する際は、以下の手順に従ってください:

### 1. 現在の状態を確認

```bash
# 並列実行して現在の状態を把握
git status
git diff --staged
git diff
git log --oneline -5
```

これらのコマンドを同時に実行して:

- ステージされた変更
- ステージされていない変更
- 最近のコミットメッセージのスタイル

を確認します。

### 2. 変更の分析

- ステージされた変更がない場合、ユーザーに何をコミットするか確認する
- 変更が複数の関心事に分かれている場合、分割を提案する
- 機密情報（`.env`、`credentials.json`など）が含まれていないか確認する

### 3. コミットメッセージの作成

**Conventional Commits形式を使用:**

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type の種類:**

- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメントのみの変更
- `style`: コードの意味に影響しない変更（空白、フォーマットなど）
- `refactor`: バグ修正でも機能追加でもないコード変更
- `perf`: パフォーマンス改善
- `test`: テストの追加・修正
- `chore`: ビルドプロセスや補助ツールの変更

**Scope (オプション):**

- 変更の影響範囲（例: `auth`, `api`, `ui`, `db`）

**Subject:**

- 50文字以内
- 小文字で始める
- 末尾にピリオドを付けない
- 命令形を使用（"add" not "added"）

**Body (オプション):**

- 変更の理由と詳細を説明
- 72文字で改行

### 4. コミットの実行

変更をステージングし、HEREDOCを使用してコミット:

```bash
# 関連ファイルをステージング
git add <files>

# コミット実行
git commit -m "$(cat <<'EOF'
feat(articles): add markdown editor support

Add rich text editing capabilities using react-markdown.
Includes syntax highlighting and preview mode.
EOF
)"

# 確認
git status
```

### 5. エラーハンドリング

- **pre-commitフックが失敗した場合**: 問題を修正し、**新しいコミット**を作成（amendは使わない）
- **変更がない場合**: 空のコミットは作成しない
- **リモートにpush済みの場合**: amendは絶対に使わない（ユーザーが明示的に要求した場合を除く）

## Examples

### Example 1: 新機能の追加

```bash
# 状態確認
git status
git diff --staged

# コミット
git add app/(dashboard)/dashboard/articles/new/page.tsx
git commit -m "$(cat <<'EOF'
feat(articles): add article creation page

Implement new article creation form with:
- Title and content fields
- Category selection
- Tag management
- Draft/publish toggle
EOF
)"
```

### Example 2: バグ修正

```bash
git add lib/auth/session.ts
git commit -m "$(cat <<'EOF'
fix(auth): prevent session token expiry race condition

Fix issue where concurrent requests could cause session
refresh to fail. Add mutex lock during token refresh.
EOF
)"
```

### Example 3: 複数ファイルのリファクタリング

```bash
git add lib/db/queries.ts lib/db/articles-queries.ts
git commit -m "$(cat <<'EOF'
refactor(db): extract article queries to separate file

Move article-related queries from queries.ts to
articles-queries.ts for better organization and
maintainability.
EOF
)"
```

### Example 4: ドキュメント更新

```bash
git add README.md CLAUDE.md
git commit -m "$(cat <<'EOF'
docs: update setup instructions for pnpm

Add missing pnpm install step and clarify database
setup sequence.
EOF
)"
```

## Important Notes

1. **プロジェクトの既存のコミットスタイルを確認する** - `git log`で最近のコミットを見て、チームのパターンに従う
2. **変更の"why"を説明する** - コードの diff は "what" を示すので、メッセージでは "why" に焦点を当てる
3. **機密情報をコミットしない** - `.env` ファイルなどが含まれている場合は警告する
4. **atomic commits** - 1つのコミットは1つの論理的な変更のみを含むべき
5. **push は自動で行わない** - ユーザーが明示的に要求した場合のみ push する

## Related Files

このスキルは以下のプロジェクト規約に従います:

- [CLAUDE.md](../../../CLAUDE.md) - プロジェクト全体のガイドライン
- Git hooks configuration (if exists)
