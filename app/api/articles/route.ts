import { NextRequest, NextResponse } from 'next/server';
import { getArticles, createArticle } from '@/lib/db/articles-queries';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { createArticleSchema } from '@/lib/validations/article';

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

/**
 * POST /api/articles
 * 記事を作成するAPIエンドポイント
 * @param request - Next.jsリクエストオブジェクト
 * @returns 作成された記事
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json(
        { error: 'チームが見つかりません' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const result = createArticleSchema.safeParse(body);

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

    const shouldPublish = status === 'published' || publishNow === 'true';

    const article = await createArticle(
      {
        teamId: team.id,
        userId: user.id,
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

    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: '記事の作成に失敗しました' },
      { status: 500 }
    );
  }
}
