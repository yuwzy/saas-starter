import { NextRequest, NextResponse } from 'next/server';
import {
  getArticleById,
  updateArticle,
  deleteArticle,
  canUserModifyArticle,
  canUserAccessArticle,
} from '@/lib/db/articles-queries';
import { getUser } from '@/lib/db/queries';
import { updateArticleSchema } from '@/lib/validations/article';

/**
 * GET /api/articles/[id]
 * 記事詳細を取得するAPIエンドポイント
 * @param request - Next.jsリクエストオブジェクト
 * @param params - URLパラメータ
 * @returns 記事詳細
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
        { error: '不正な記事IDです' },
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

    // 公開記事は誰でもアクセス可能
    if (article.status === 'published') {
      return NextResponse.json(article);
    }

    // 下書き・非公開記事はチームメンバーのみアクセス可能
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const canAccess = await canUserAccessArticle(articleId, user.id);
    if (!canAccess) {
      return NextResponse.json(
        { error: 'この記事にアクセスする権限がありません' },
        { status: 403 }
      );
    }

    return NextResponse.json(article);
  } catch (error) {
    return NextResponse.json(
      { error: '記事の取得に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/articles/[id]
 * 記事を更新するAPIエンドポイント
 * @param request - Next.jsリクエストオブジェクト
 * @param params - URLパラメータ
 * @returns 更新された記事
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { id } = await params;
    const articleId = parseInt(id, 10);

    if (isNaN(articleId)) {
      return NextResponse.json(
        { error: '不正な記事IDです' },
        { status: 400 }
      );
    }

    const canModify = await canUserModifyArticle(articleId, user.id);
    if (!canModify) {
      return NextResponse.json(
        { error: 'この記事を編集する権限がありません' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = updateArticleSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { title, slug, content, excerpt, categoryId, status, tags, publishNow } =
      result.data;

    const tags_array = tags
      ? tags
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0)
      : [];

    const article = await getArticleById(articleId);
    const shouldPublish =
      (status === 'published' || publishNow === 'true') && !article?.publishedAt;

    const updatedArticle = await updateArticle(
      articleId,
      {
        title,
        slug,
        content,
        excerpt: excerpt || undefined,
        categoryId: categoryId || undefined,
        status: shouldPublish ? 'published' : status,
        publishedAt: shouldPublish ? new Date() : undefined,
      },
      tags_array
    );

    return NextResponse.json(updatedArticle);
  } catch (error) {
    return NextResponse.json(
      { error: '記事の更新に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/articles/[id]
 * 記事を削除するAPIエンドポイント
 * @param request - Next.jsリクエストオブジェクト
 * @param params - URLパラメータ
 * @returns 削除成功メッセージ
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { id } = await params;
    const articleId = parseInt(id, 10);

    if (isNaN(articleId)) {
      return NextResponse.json(
        { error: '不正な記事IDです' },
        { status: 400 }
      );
    }

    const canModify = await canUserModifyArticle(articleId, user.id);
    if (!canModify) {
      return NextResponse.json(
        { error: 'この記事を削除する権限がありません' },
        { status: 403 }
      );
    }

    await deleteArticle(articleId);

    return NextResponse.json({ success: '記事を削除しました' });
  } catch (error) {
    return NextResponse.json(
      { error: '記事の削除に失敗しました' },
      { status: 500 }
    );
  }
}
