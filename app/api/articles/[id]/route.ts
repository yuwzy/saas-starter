import { db } from '@/lib/db/drizzle';
import { articles, articleCategories, articleTags, categories, tags, users } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, and } from 'drizzle-orm';
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const articleId = parseInt(id);

  if (isNaN(articleId)) {
    return Response.json({ error: 'Invalid article ID' }, { status: 400 });
  }

  const user = await getUser();

  const result = await db.query.articles.findFirst({
    where: eq(articles.id, articleId),
    with: {
      author: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
      articleCategories: {
        with: {
          category: true,
        },
      },
      articleTags: {
        with: {
          tag: true,
        },
      },
    },
  });

  if (!result) {
    return Response.json({ error: 'Article not found' }, { status: 404 });
  }

  // 非公開記事は作成者のみ閲覧可能
  if (result.status !== 'published' && (!user || result.userId !== user.id)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  return Response.json(result);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const articleId = parseInt(id);

  if (isNaN(articleId)) {
    return Response.json({ error: 'Invalid article ID' }, { status: 400 });
  }

  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 記事の所有者確認
  const existingArticle = await db.query.articles.findFirst({
    where: eq(articles.id, articleId),
  });

  if (!existingArticle) {
    return Response.json({ error: 'Article not found' }, { status: 404 });
  }

  if (existingArticle.userId !== user.id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { title, slug, content, excerpt, status, categoryIds, tagIds } = body;

  try {
    const [updatedArticle] = await db
      .update(articles)
      .set({
        title,
        slug,
        content,
        excerpt,
        status,
        publishedAt:
          status === 'published' && !existingArticle.publishedAt
            ? new Date()
            : existingArticle.publishedAt,
        updatedAt: new Date(),
      })
      .where(eq(articles.id, articleId))
      .returning();

    // カテゴリーを更新
    if (categoryIds !== undefined) {
      await db.delete(articleCategories).where(eq(articleCategories.articleId, articleId));
      if (categoryIds.length > 0) {
        await db.insert(articleCategories).values(
          categoryIds.map((categoryId: number) => ({
            articleId,
            categoryId,
          }))
        );
      }
    }

    // タグを更新
    if (tagIds !== undefined) {
      await db.delete(articleTags).where(eq(articleTags.articleId, articleId));
      if (tagIds.length > 0) {
        await db.insert(articleTags).values(
          tagIds.map((tagId: number) => ({
            articleId,
            tagId,
          }))
        );
      }
    }

    return Response.json(updatedArticle);
  } catch (error: any) {
    if (error.code === '23505') {
      return Response.json({ error: 'Slug already exists' }, { status: 409 });
    }
    return Response.json({ error: 'Failed to update article' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const articleId = parseInt(id);

  if (isNaN(articleId)) {
    return Response.json({ error: 'Invalid article ID' }, { status: 400 });
  }

  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 記事の所有者確認
  const existingArticle = await db.query.articles.findFirst({
    where: eq(articles.id, articleId),
  });

  if (!existingArticle) {
    return Response.json({ error: 'Article not found' }, { status: 404 });
  }

  if (existingArticle.userId !== user.id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // カテゴリーとタグの紐付けを削除
  await db.delete(articleCategories).where(eq(articleCategories.articleId, articleId));
  await db.delete(articleTags).where(eq(articleTags.articleId, articleId));

  // 記事を削除
  await db.delete(articles).where(eq(articles.id, articleId));

  return Response.json({ success: true });
}
