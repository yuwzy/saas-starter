import { db } from '@/lib/db/drizzle';
import { articles, articleCategories, articleTags, categories, tags, users } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, desc, and } from 'drizzle-orm';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status');
  const userId = searchParams.get('userId');

  const user = await getUser();

  let query = db
    .select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      excerpt: articles.excerpt,
      status: articles.status,
      publishedAt: articles.publishedAt,
      createdAt: articles.createdAt,
      updatedAt: articles.updatedAt,
      author: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(articles)
    .leftJoin(users, eq(articles.userId, users.id))
    .orderBy(desc(articles.createdAt));

  const conditions = [];

  // 認証済みユーザーの場合、自分の記事または公開記事を取得
  if (user) {
    if (status) {
      conditions.push(eq(articles.status, status));
    }
    if (userId) {
      conditions.push(eq(articles.userId, parseInt(userId)));
    }
  } else {
    // 未認証の場合は公開記事のみ
    conditions.push(eq(articles.status, 'published'));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }

  const result = await query;

  return Response.json(result);
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { title, slug, content, excerpt, status, categoryIds, tagIds } = body;

  if (!title || !slug || !content) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const [article] = await db
      .insert(articles)
      .values({
        userId: user.id,
        title,
        slug,
        content,
        excerpt,
        status: status || 'draft',
        publishedAt: status === 'published' ? new Date() : null,
      })
      .returning();

    // カテゴリーの紐付け
    if (categoryIds && categoryIds.length > 0) {
      await db.insert(articleCategories).values(
        categoryIds.map((categoryId: number) => ({
          articleId: article.id,
          categoryId,
        }))
      );
    }

    // タグの紐付け
    if (tagIds && tagIds.length > 0) {
      await db.insert(articleTags).values(
        tagIds.map((tagId: number) => ({
          articleId: article.id,
          tagId,
        }))
      );
    }

    return Response.json(article, { status: 201 });
  } catch (error: any) {
    if (error.code === '23505') {
      return Response.json({ error: 'Slug already exists' }, { status: 409 });
    }
    return Response.json({ error: 'Failed to create article' }, { status: 500 });
  }
}
