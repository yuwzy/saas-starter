# Coding Conventions

このドキュメントは、プロジェクト全体で一貫したコード品質を保つためのコーディング規約を定義します。

## 目次

1. [TypeScript / JavaScript](#typescript--javascript)
2. [React コンポーネント](#react-コンポーネント)
3. [データベースとクエリ](#データベースとクエリ)
4. [API ルート](#api-ルート)
5. [Server Actions](#server-actions)
6. [エラーハンドリング](#エラーハンドリング)
7. [命名規則](#命名規則)
8. [コメントとドキュメント](#コメントとドキュメント)
9. [セキュリティ](#セキュリティ)

---

## TypeScript / JavaScript

### 基本原則

- **TypeScript strict mode を使用する**
- **`any` 型の使用を避ける** - 不明な型には `unknown` を使い、型ガードで絞り込む
- **型推論を活用する** - 明示的な型アノテーションが不要な場合は省略可
- **Drizzle スキーマから型を推論する** - `User`, `NewUser`, `Article` などの型を活用

### 型定義

```typescript
// ✅ Good: Drizzle から型を推論
import type { User, Article } from '@/lib/db/schema';

// ✅ Good: 複合型をエクスポート
export type ArticleWithDetails = Article & {
  author: Pick<User, 'id' | 'name' | 'email'>;
  category: Category | null;
  tags: ArticleTag[];
};

// ❌ Bad: any 型の使用
function processData(data: any) {}

// ✅ Good: unknown と型ガード
function processData(data: unknown) {
  if (typeof data === 'string') {
    // data is string
  }
}
```

### インポート

- **パスエイリアス `@/` を使用する**
- **名前付きエクスポート/インポートを優先する**（default export は避ける）
- **型インポートには `import type` を使用する**

```typescript
// ✅ Good
import type { User } from '@/lib/db/schema';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { Button } from '@/components/ui/button';

// ❌ Bad: 相対パス、default import
import User from '../../../lib/db/schema';
```

---

## React コンポーネント

### 基本原則

- **Server Components をデフォルトとする** - クライアントインタラクションが必要な場合のみ `'use client'` を使用
- **関数コンポーネントを使用する** - クラスコンポーネントは使用しない
- **名前付き関数でエクスポートする** - default export は避ける
- **PascalCase で命名する**

### コンポーネント構造

```typescript
// ✅ Good: Server Component (default)
import { getUser } from '@/lib/db/queries';

interface ArticleListProps {
  teamId: number;
  status?: string;
}

export async function ArticleList({ teamId, status }: ArticleListProps) {
  const articles = await getArticles({ teamId, status });

  return (
    <div className="space-y-4">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}

// ✅ Good: Client Component (when needed)
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface InteractiveButtonProps {
  label: string;
  onClick: () => void;
}

export function InteractiveButton({ label, onClick }: InteractiveButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  return <Button onClick={onClick}>{label}</Button>;
}
```

### Props の型定義

```typescript
// ✅ Good: Interface を使用
interface ComponentProps {
  title: string;
  count: number;
  onSubmit?: (data: FormData) => void;
}

// ❌ Bad: Type でインライン定義
const Component = ({ title, count }: { title: string; count: number }) => {};
```

### スタイリング

- **Tailwind ユーティリティクラスのみ使用する** - CSS Modules やインラインスタイルは避ける
- **セマンティックカラートークンを使用する** (`bg-background`, `text-foreground`, `border-border` など)
- **プライマリカラーはオレンジ** - `bg-primary`, `text-primary` を使用
- **`cn()` ユーティリティで className をマージする**

```typescript
// ✅ Good: Tailwind + semantic tokens + cn()
import { cn } from '@/lib/utils';

export function Card({ className, children }: CardProps) {
  return (
    <div className={cn('rounded-lg border bg-card p-4', className)}>
      {children}
    </div>
  );
}

// ❌ Bad: Inline styles
<div style={{ backgroundColor: '#fff', padding: '16px' }}>
```

### バリアントシステム

- **複数のバリアントがある場合は `class-variance-authority` (cva) を使用する**

```typescript
// ✅ Good: cva を使用
import { cva, type VariantProps } from 'class-variance-authority';

const badgeVariants = cva(
  'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
        destructive: 'bg-destructive text-destructive-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: React.ReactNode;
}
```

---

## データベースとクエリ

### アーキテクチャ原則

- **全ての SQL クエリは `lib/db/queries.ts` または `lib/db/*-queries.ts` に抽象化する**
- **API ルート、Server Actions、ページコンポーネントで直接 `db.*` を呼び出さない**
- **Drizzle のリレーショナルクエリ構文 (`db.query.*`) を優先する**

### クエリ関数

```typescript
// ✅ Good: lib/db/articles-queries.ts
import { eq, and, like } from 'drizzle-orm';
import { db } from './drizzle';
import { articles, users, categories } from './schema';
import type { ArticleWithDetails } from './schema';

/**
 * 記事一覧を取得する（ページネーション付き）
 * @param options - フィルタとページネーションのオプション
 * @returns 記事一覧とメタ情報
 */
export async function getArticles(options: {
  page?: number;
  limit?: number;
  teamId?: number;
  status?: string;
}): Promise<{ articles: ArticleWithDetails[]; pagination: Pagination }> {
  // Implementation
}

// ❌ Bad: API ルートで直接クエリ
export async function GET(request: Request) {
  const articles = await db.select().from(articles); // ❌
}
```

### 命名規則

- **データベースカラム**: `lower_snake_case` (例: `created_at`, `user_id`)
- **TypeScript**: `camelCase` (例: `createdAt`, `userId`)
- **クエリ関数**: `get*`, `create*`, `update*`, `delete*`, `can*` (例: `getArticleById`, `canUserModifyArticle`)

### JSDoc コメント

- **すべてのクエリ関数に JSDoc を追加する**
- **パラメータと戻り値を明記する**

```typescript
/**
 * ユーザーが記事を編集・削除できるかチェックする
 * @param articleId - 記事のID
 * @param userId - ユーザーのID
 * @returns 編集可能な場合true
 */
export async function canUserModifyArticle(
  articleId: number,
  userId: number
): Promise<boolean> {
  // Implementation
}
```

---

## API ルート

### アーキテクチャ原則

- **全てのデータ変更は API ルート経由で行う**
- **API ルートは標準化された JSON レスポンスを返す**
- **適切な HTTP ステータスコードを使用する** (200, 201, 400, 401, 403, 404, 500)
- **Zod でリクエストボディをバリデーションする**

### 標準パターン

```typescript
// ✅ Good: app/api/articles/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { getArticles, createArticle } from '@/lib/db/articles-queries';
import { createArticleSchema } from '@/lib/validations/article';

/**
 * GET /api/articles
 * 記事一覧を取得するAPIエンドポイント（認証必須）
 * @param request - Next.jsリクエストオブジェクト
 * @returns 記事一覧とページネーション情報
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 認証チェック
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // 2. 認可チェック（チーム取得）
    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json(
        { error: 'チームが見つかりません' },
        { status: 404 }
      );
    }

    // 3. クエリパラメータ取得
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);

    // 4. クエリ関数呼び出し
    const result = await getArticles({ page, teamId: team.id });

    // 5. レスポンス返却
    return NextResponse.json(result);
  } catch (_error) {
    return NextResponse.json(
      { error: '記事の取得に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/articles
 * 記事を作成するAPIエンドポイント
 * @param request - Next.jsリクエストオブジェクト
 * @returns 作成された記事
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 認証チェック
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // 2. チーム取得
    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json(
        { error: 'チームが見つかりません' },
        { status: 404 }
      );
    }

    // 3. リクエストボディのバリデーション
    const body = await request.json();
    const result = createArticleSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    // 4. クエリ関数呼び出し
    const article = await createArticle({
      teamId: team.id,
      userId: user.id,
      ...result.data,
    });

    // 5. レスポンス返却（201 Created）
    return NextResponse.json(article, { status: 201 });
  } catch (_error) {
    return NextResponse.json(
      { error: '記事の作成に失敗しました' },
      { status: 500 }
    );
  }
}
```

### エラーレスポンス

```typescript
// ✅ Good: 一貫したエラー形式
{ error: 'エラーメッセージ' }

// ❌ Bad: バラバラなエラー形式
{ message: 'エラー' }
{ errors: [...] }
throw new Error('エラー')
```

### JSDoc コメント

- **各ハンドラー関数に JSDoc を追加する**
- **エンドポイントパス、説明、パラメータ、戻り値を明記する**

---

## Server Actions

### アーキテクチャ原則

- **Server Actions は API ルートを呼び出すのみ** - データベースに直接アクセスしない
- **`'use server'` ディレクティブを使用する**
- **Zod でフォームデータをバリデーションする**
- **`ActionState` 型で戻り値を統一する** (`{ error?: string; success?: string }`)

### 標準パターン

```typescript
// ✅ Good: app/(dashboard)/dashboard/articles/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { createArticleSchema } from '@/lib/validations/article';
import type { ActionState } from '@/lib/auth/middleware';

/**
 * 記事作成アクション
 * @param prevState - 前回のアクション状態
 * @param formData - フォームデータ
 * @returns アクション結果の状態
 */
export async function createArticleAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    // 1. バリデーション
    const data = Object.fromEntries(formData);
    const result = createArticleSchema.safeParse(data);

    if (!result.success) {
      return { error: result.error.errors[0].message };
    }

    // 2. Cookie 取得
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    // 3. API ルート呼び出し
    const response = await fetch(`${process.env.BASE_URL}/api/articles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(sessionCookie ? { Cookie: `session=${sessionCookie.value}` } : {}),
      },
      body: JSON.stringify(result.data),
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || '記事の作成に失敗しました' };
    }

    // 4. キャッシュ再検証
    revalidatePath('/dashboard/articles');

    // 5. 成功レスポンス
    return { success: '記事を作成しました' };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: '記事の作成に失敗しました' };
  }
}
```

### データフロー

```
Client Form
  ↓
Server Action (validates with Zod)
  ↓
API Route (receives validated data)
  ↓
Query Function in lib/db/queries.ts
  ↓
Database
```

### 禁止事項

```typescript
// ❌ Bad: Server Action で直接データベースアクセス
export async function createArticleAction(formData: FormData) {
  const article = await db.insert(articles).values({...}); // ❌
}

// ✅ Good: API ルート経由
export async function createArticleAction(formData: FormData) {
  const response = await fetch('/api/articles', {...}); // ✅
}
```

---

## エラーハンドリング

### 基本原則

- **エラーは適切なレイヤーでキャッチする**
- **ユーザーフレンドリーなエラーメッセージを返す**
- **エラー変数は `_error` で命名する**（未使用の場合）
- **型安全なエラーチェックを行う**

### パターン

```typescript
// ✅ Good: API ルートでのエラーハンドリング
export async function POST(request: NextRequest) {
  try {
    // Implementation
    return NextResponse.json(result);
  } catch (_error) {
    return NextResponse.json({ error: 'エラーメッセージ' }, { status: 500 });
  }
}

// ✅ Good: Server Action でのエラーハンドリング
export async function createAction(formData: FormData): Promise<ActionState> {
  try {
    // Implementation
    return { success: '成功しました' };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: '失敗しました' };
  }
}

// ❌ Bad: エラーを握りつぶす
try {
  await riskyOperation();
} catch (e) {
  // 何もしない
}
```

---

## 命名規則

### ファイル名

- **kebab-case**: `article-list.tsx`, `articles-queries.ts`
- **コンポーネントファイル**: `component-name.tsx`
- **クエリファイル**: `feature-queries.ts`

### 変数・関数

- **camelCase**: `const articleList`, `function getArticles()`
- **真偽値**: `is*`, `has*`, `can*` プレフィックス (例: `isPublished`, `canEdit`)

### コンポーネント

- **PascalCase**: `ArticleList`, `Button`, `ArticleForm`

### 型・インターフェース

- **PascalCase**: `User`, `Article`, `ArticleWithDetails`
- **Props インターフェース**: `ComponentNameProps`

### 定数

- **UPPER_SNAKE_CASE**: `MAX_ARTICLES`, `DEFAULT_PAGE_SIZE`

### データベース

- **テーブル**: `lower_snake_case` (例: `team_members`, `activity_logs`)
- **カラム**: `lower_snake_case` (例: `created_at`, `user_id`)

---

## コメントとドキュメント

### JSDoc コメント

- **すべての公開関数に JSDoc を追加する**
- **特に以下には必須**:
  - クエリ関数 (`lib/db/*-queries.ts`)
  - API ルートハンドラー (`app/api/*/route.ts`)
  - Server Actions (`actions.ts`)

```typescript
/**
 * 記事一覧を取得する（ページネーション付き）
 * チームの記事のみを返す（認証必須）
 * @param options - フィルタとページネーションのオプション
 * @returns 記事一覧とメタ情報
 */
export async function getArticles(options: GetArticlesOptions) {
  // Implementation
}
```

### インラインコメント

- **複雑なロジックや意図が不明瞭な箇所のみコメントを追加する**
- **自明なコードにはコメント不要**

```typescript
// ✅ Good: 必要なコメント
// 公開記事は誰でもアクセス可能
if (article.status === 'published') {
  return true;
}

// ❌ Bad: 自明なコメント
// ユーザーを取得
const user = await getUser();
```

---

## セキュリティ

### 認証・認可

- **API ルートで必ず認証チェックを行う** (`getUser()` を呼び出す)
- **チームベースの認可を実装する** (`getTeamForUser()`, `canUserModifyArticle()` など)
- **公開データと非公開データを区別する**

```typescript
// ✅ Good: 認証チェック
export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const canAccess = await canUserAccessArticle(articleId, user.id);
  if (!canAccess) {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 });
  }

  // Implementation
}
```

### バリデーション

- **ユーザー入力は必ず Zod でバリデーションする**
- **クエリパラメータも適切に検証する**

```typescript
// ✅ Good: Zod バリデーション
const result = createArticleSchema.safeParse(body);
if (!result.success) {
  return NextResponse.json(
    { error: result.error.errors[0].message },
    { status: 400 }
  );
}

// ❌ Bad: バリデーションなし
const { title, content } = await request.json();
await createArticle({ title, content }); // ❌
```

### OWASP Top 10 対策

- **SQL インジェクション**: Drizzle の型安全クエリビルダーを使用（生 SQL は避ける）
- **XSS**: React の自動エスケープを信頼（`dangerouslySetInnerHTML` は避ける）
- **CSRF**: Next.js の Server Actions は自動的に CSRF 保護される
- **認証の不備**: JWT トークンの有効期限チェック、httpOnly Cookie の使用

---

## まとめ

このコーディング規約は、プロジェクトの品質、保守性、セキュリティを維持するための基盤です。すべてのコード変更は、この規約に従って実装してください。

不明な点や例外的なケースについては、チームメンバーと相談してください。
