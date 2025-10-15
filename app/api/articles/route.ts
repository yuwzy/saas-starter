import { NextRequest, NextResponse } from 'next/server';
import { getArticles } from '@/lib/db/articles-queries';

/**
 * GET /api/articles
 * 記事一覧を取得するAPIエンドポイント
 * @param request - Next.jsリクエストオブジェクト
 * @returns 記事一覧とページネーション情報
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const status = searchParams.get('status') || undefined;
    const userId = searchParams.get('userId')
      ? parseInt(searchParams.get('userId')!, 10)
      : undefined;
    const categoryId = searchParams.get('categoryId')
      ? parseInt(searchParams.get('categoryId')!, 10)
      : undefined;
    const search = searchParams.get('search') || undefined;

    const result = await getArticles({
      page,
      limit,
      status,
      userId,
      categoryId,
      search,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: '記事の取得に失敗しました' },
      { status: 500 }
    );
  }
}
