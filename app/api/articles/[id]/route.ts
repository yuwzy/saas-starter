import { NextRequest, NextResponse } from 'next/server';
import { getArticleById } from '@/lib/db/articles-queries';

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

    return NextResponse.json(article);
  } catch (error) {
    return NextResponse.json(
      { error: '記事の取得に失敗しました' },
      { status: 500 }
    );
  }
}
