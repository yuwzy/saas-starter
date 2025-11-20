import { desc, eq, and, like, or, sql } from 'drizzle-orm';
import { db } from './drizzle';
import {
  articles,
  categories,
  articleTags,
  users,
  articleComments,
} from './schema';
import type {
  Article,
  ArticleWithDetails,
  Category,
  ArticleComment,
  ArticleCommentWithAuthor,
} from './schema';

/**
 * 記事一覧を取得する（ページネーション付き）
 * チームの記事のみを返す（認証必須）
 * @param options - フィルタとページネーションのオプション
 * @returns 記事一覧とメタ情報
 */
export async function getArticles(options: {
  page?: number;
  limit?: number;
  status?: string;
  userId?: number;
  categoryId?: number;
  search?: string;
  teamId?: number;
  includePublicOnly?: boolean;
}) {
  const page = options.page || 1;
  const limit = options.limit || 10;
  const offset = (page - 1) * limit;

  const conditions = [];

  // チームIDでフィルタ（必須）
  if (options.teamId) {
    conditions.push(eq(articles.teamId, options.teamId));
  }

  // 公開記事のみの場合
  if (options.includePublicOnly) {
    conditions.push(eq(articles.status, 'published'));
  } else {
    if (options.status) {
      conditions.push(eq(articles.status, options.status));
    }
  }

  if (options.userId) {
    conditions.push(eq(articles.userId, options.userId));
  }

  if (options.categoryId) {
    conditions.push(eq(articles.categoryId, options.categoryId));
  }

  if (options.search) {
    conditions.push(
      or(
        like(articles.title, `%${options.search}%`),
        like(articles.content, `%${options.search}%`)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [articlesData, countResult] = await Promise.all([
    db
      .select({
        id: articles.id,
        userId: articles.userId,
        title: articles.title,
        slug: articles.slug,
        content: articles.content,
        excerpt: articles.excerpt,
        categoryId: articles.categoryId,
        status: articles.status,
        publishedAt: articles.publishedAt,
        createdAt: articles.createdAt,
        updatedAt: articles.updatedAt,
        authorName: users.name,
        authorEmail: users.email,
        categoryName: categories.name,
        categorySlug: categories.slug,
      })
      .from(articles)
      .leftJoin(users, eq(articles.userId, users.id))
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .where(whereClause)
      .orderBy(desc(articles.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(articles)
      .where(whereClause),
  ]);

  const totalCount = Number(countResult[0]?.count || 0);

  return {
    articles: articlesData,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
}

/**
 * スラッグで記事を取得する（チーム認可なし - 詳細ページで使用）
 * @param slug - 記事のスラッグ
 * @returns 記事詳細またはnull
 */
export async function getArticleBySlug(
  slug: string
): Promise<ArticleWithDetails | null> {
  const result = await db.query.articles.findFirst({
    where: eq(articles.slug, slug),
    with: {
      author: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
      category: true,
      tags: true,
    },
  });

  return result || null;
}

/**
 * IDで記事を取得する（チーム認可なし - 編集ページで使用）
 * @param id - 記事のID
 * @returns 記事詳細またはnull
 */
export async function getArticleById(
  id: number
): Promise<ArticleWithDetails | null> {
  const result = await db.query.articles.findFirst({
    where: eq(articles.id, id),
    with: {
      author: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
      category: true,
      tags: true,
    },
  });

  return result || null;
}

/**
 * 記事を作成する
 * @param articleData - 記事データ
 * @param tags - タグ配列
 * @returns 作成された記事
 */
export async function createArticle(
  articleData: {
    teamId: number;
    userId: number;
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    categoryId?: number;
    status?: string;
    publishedAt?: Date;
  },
  tags: string[] = []
): Promise<Article> {
  const [newArticle] = await db
    .insert(articles)
    .values({
      ...articleData,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  if (tags.length > 0) {
    await db.insert(articleTags).values(
      tags.map((tagName) => ({
        articleId: newArticle.id,
        tagName: tagName.trim(),
        createdAt: new Date(),
      }))
    );
  }

  return newArticle;
}

/**
 * 記事を更新する
 * @param id - 記事のID
 * @param articleData - 更新する記事データ
 * @param tags - タグ配列（指定された場合は全て置き換え）
 * @returns 更新された記事
 */
export async function updateArticle(
  id: number,
  articleData: Partial<{
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    categoryId: number;
    status: string;
    publishedAt: Date;
  }>,
  tags?: string[]
): Promise<Article | null> {
  const [updatedArticle] = await db
    .update(articles)
    .set({
      ...articleData,
      updatedAt: new Date(),
    })
    .where(eq(articles.id, id))
    .returning();

  if (tags !== undefined) {
    await db.delete(articleTags).where(eq(articleTags.articleId, id));

    if (tags.length > 0) {
      await db.insert(articleTags).values(
        tags.map((tagName) => ({
          articleId: id,
          tagName: tagName.trim(),
          createdAt: new Date(),
        }))
      );
    }
  }

  return updatedArticle || null;
}

/**
 * 記事を削除する
 * @param id - 記事のID
 */
export async function deleteArticle(id: number): Promise<void> {
  await db.delete(articles).where(eq(articles.id, id));
}

/**
 * 全てのカテゴリを取得する
 * @returns カテゴリ一覧
 */
export async function getCategories(): Promise<Category[]> {
  return await db.select().from(categories).orderBy(categories.name);
}

/**
 * カテゴリを作成する
 * @param categoryData - カテゴリデータ
 * @returns 作成されたカテゴリ
 */
export async function createCategory(categoryData: {
  name: string;
  slug: string;
}): Promise<Category> {
  const [newCategory] = await db
    .insert(categories)
    .values({
      ...categoryData,
      createdAt: new Date(),
    })
    .returning();

  return newCategory;
}

/**
 * ユーザーが記事にアクセスできるかチェックする
 * @param articleId - 記事のID
 * @param userId - ユーザーのID
 * @returns アクセス可能な場合true
 */
export async function canUserAccessArticle(
  articleId: number,
  userId: number
): Promise<boolean> {
  const article = await db
    .select({ userId: articles.userId, status: articles.status })
    .from(articles)
    .where(eq(articles.id, articleId))
    .limit(1);

  if (article.length === 0) {
    return false;
  }

  // 公開記事は誰でもアクセス可能
  if (article[0].status === 'published') {
    return true;
  }

  // 下書き・非公開記事は作成者のみアクセス可能
  return article[0].userId === userId;
}

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
  const article = await db
    .select({ userId: articles.userId })
    .from(articles)
    .where(eq(articles.id, articleId))
    .limit(1);

  if (article.length === 0) {
    return false;
  }

  // 記事の作成者のみ編集可能
  return article[0].userId === userId;
}

/**
 * 記事のコメント一覧を取得する
 * @param articleId - 記事のID
 * @returns コメント一覧
 */
export async function getArticleComments(
  articleId: number
): Promise<ArticleCommentWithAuthor[]> {
  const comments = await db.query.articleComments.findMany({
    where: eq(articleComments.articleId, articleId),
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: desc(articleComments.createdAt),
  });

  return comments.map((comment) => ({
    ...comment,
    user: comment.user || null,
  }));
}

/**
 * コメントを作成する
 * @param commentData - コメントデータ
 * @returns 作成されたコメント
 */
export async function createArticleComment(
  commentData: {
    articleId: number;
    userId?: number;
    content: string;
    authorName?: string;
    authorEmail?: string;
  }
): Promise<ArticleComment> {
  const [newComment] = await db
    .insert(articleComments)
    .values({
      ...commentData,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return newComment;
}

/**
 * コメントを削除する
 * @param commentId - コメントのID
 * @param userId - ユーザーのID（認証済みユーザーのみ削除可能）
 */
export async function deleteArticleComment(
  commentId: number,
  userId?: number
): Promise<void> {
  const conditions = [eq(articleComments.id, commentId)];

  // 認証済みユーザーの場合、自分のコメントのみ削除可能
  if (userId) {
    conditions.push(eq(articleComments.userId, userId));
  }

  await db
    .delete(articleComments)
    .where(conditions.length > 1 ? and(...conditions) : conditions[0]);
}
