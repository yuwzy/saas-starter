import { NextRequest, NextResponse } from 'next/server';
import { getArticleById, getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { articles, articleTags } from '@/lib/db/schema';
import { articleSchema } from '@/lib/validations/article';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

/**
 * 記事詳細を取得
 * GET /api/articles/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const articleId = parseInt(id, 10);

    if (isNaN(articleId)) {
      return NextResponse.json(
        { error: '無効な記事IDです' },
        { status: 400 }
      );
    }

    const article = await getArticleById(articleId);

    if (!article) {
      return NextResponse.json(
        { error: '記事が見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json(article);
  } catch (error) {
    console.error('Failed to fetch article:', error);
    return NextResponse.json(
      { error: '記事の取得に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * 記事を更新
 * PATCH /api/articles/[id]
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const articleId = parseInt(id, 10);

    if (isNaN(articleId)) {
      return NextResponse.json(
        { error: '無効な記事IDです' },
        { status: 400 }
      );
    }

    // 記事の存在確認と権限チェック
    const existingArticle = await db.query.articles.findFirst({
      where: eq(articles.id, articleId),
    });

    if (!existingArticle) {
      return NextResponse.json(
        { error: '記事が見つかりません' },
        { status: 404 }
      );
    }

    if (existingArticle.userId !== user.id) {
      return NextResponse.json(
        { error: 'この記事を編集する権限がありません' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = articleSchema.parse(body);

    // スラッグの重複チェック（自分の記事以外）
    if (validatedData.slug !== existingArticle.slug) {
      const duplicateSlug = await db.query.articles.findFirst({
        where: (articles, { eq, and, ne }) =>
          and(
            eq(articles.slug, validatedData.slug),
            ne(articles.id, articleId)
          ),
      });

      if (duplicateSlug) {
        return NextResponse.json(
          { error: 'このスラッグは既に使用されています' },
          { status: 400 }
        );
      }
    }

    // 記事を更新
    const [updatedArticle] = await db
      .update(articles)
      .set({
        title: validatedData.title,
        slug: validatedData.slug,
        content: validatedData.content,
        excerpt: validatedData.excerpt ?? null,
        status: validatedData.status,
        categoryId: validatedData.categoryId ?? null,
        publishedAt:
          validatedData.status === 'published' &&
          !existingArticle.publishedAt
            ? new Date()
            : existingArticle.publishedAt,
        updatedAt: new Date(),
      })
      .where(eq(articles.id, articleId))
      .returning();

    // タグを更新（既存のタグを削除して新しいタグを追加）
    await db.delete(articleTags).where(eq(articleTags.articleId, articleId));

    if (validatedData.tagIds && validatedData.tagIds.length > 0) {
      await db.insert(articleTags).values(
        validatedData.tagIds.map((tagId) => ({
          articleId: updatedArticle.id,
          tagId,
        }))
      );
    }

    return NextResponse.json(updatedArticle);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Failed to update article:', error);
    return NextResponse.json(
      { error: '記事の更新に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * 記事を削除
 * DELETE /api/articles/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const articleId = parseInt(id, 10);

    if (isNaN(articleId)) {
      return NextResponse.json(
        { error: '無効な記事IDです' },
        { status: 400 }
      );
    }

    // 記事の存在確認と権限チェック
    const existingArticle = await db.query.articles.findFirst({
      where: eq(articles.id, articleId),
    });

    if (!existingArticle) {
      return NextResponse.json(
        { error: '記事が見つかりません' },
        { status: 404 }
      );
    }

    if (existingArticle.userId !== user.id) {
      return NextResponse.json(
        { error: 'この記事を削除する権限がありません' },
        { status: 403 }
      );
    }

    // 記事を削除（カスケード削除でarticle_tagsも削除される）
    await db.delete(articles).where(eq(articles.id, articleId));

    return NextResponse.json({ message: '記事を削除しました' });
  } catch (error) {
    console.error('Failed to delete article:', error);
    return NextResponse.json(
      { error: '記事の削除に失敗しました' },
      { status: 500 }
    );
  }
}
