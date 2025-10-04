import { NextRequest, NextResponse } from 'next/server';
import { getArticles, getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { articles, articleTags } from '@/lib/db/schema';
import { articleSchema } from '@/lib/validations/article';
import { z } from 'zod';

/**
 * 記事一覧を取得
 * GET /api/articles
 */
export async function GET() {
  try {
    const articlesList = await getArticles();
    return NextResponse.json(articlesList);
  } catch (error) {
    console.error('Failed to fetch articles:', error);
    return NextResponse.json(
      { error: '記事の取得に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * 新しい記事を作成
 * POST /api/articles
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = articleSchema.parse(body);

    // スラッグの重複チェック
    const existingArticle = await db.query.articles.findFirst({
      where: (articles, { eq }) => eq(articles.slug, validatedData.slug),
    });

    if (existingArticle) {
      return NextResponse.json(
        { error: 'このスラッグは既に使用されています' },
        { status: 400 }
      );
    }

    // 記事を作成
    const [newArticle] = await db
      .insert(articles)
      .values({
        userId: user.id,
        title: validatedData.title,
        slug: validatedData.slug,
        content: validatedData.content,
        excerpt: validatedData.excerpt ?? null,
        status: validatedData.status,
        categoryId: validatedData.categoryId ?? null,
        publishedAt:
          validatedData.status === 'published' ? new Date() : null,
      })
      .returning();

    // タグを関連付け
    if (validatedData.tagIds && validatedData.tagIds.length > 0) {
      await db.insert(articleTags).values(
        validatedData.tagIds.map((tagId) => ({
          articleId: newArticle.id,
          tagId,
        }))
      );
    }

    return NextResponse.json(newArticle, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Failed to create article:', error);
    return NextResponse.json(
      { error: '記事の作成に失敗しました' },
      { status: 500 }
    );
  }
}
