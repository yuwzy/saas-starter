import { NextRequest, NextResponse } from 'next/server';
import {
  getArticleComments,
  createArticleComment,
  canUserAccessArticle,
} from '@/lib/db/articles-queries';
import { getUser } from '@/lib/db/queries';
import { createCommentSchema } from '@/lib/validations/article';
import { getArticleById } from '@/lib/db/articles-queries';

/**
 * GET /api/articles/[id]/comments
 * 記事のコメント一覧を取得するAPIエンドポイント
 * @param request - Next.jsリクエストオブジェクト
 * @param params - URLパラメータ
 * @returns コメント一覧
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const articleId = parseInt(id, 10);

    if (isNaN(articleId)) {
      return NextResponse.json({ error: '不正な記事IDです' }, { status: 400 });
    }

    // 記事が存在し、アクセス可能かチェック
    const article = await getArticleById(articleId);
    if (!article) {
      return NextResponse.json(
        { error: '記事が見つかりません' },
        { status: 404 }
      );
    }

    // 公開記事は誰でもコメントを閲覧可能
    if (article.status === 'published') {
      const comments = await getArticleComments(articleId);
      return NextResponse.json(comments);
    }

    // 非公開記事は認証が必要
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const canAccess = await canUserAccessArticle(articleId, user.id);
    if (!canAccess) {
      return NextResponse.json(
        { error: 'この記事にアクセスする権限がありません' },
        { status: 403 }
      );
    }

    const comments = await getArticleComments(articleId);
    return NextResponse.json(comments);
  } catch (_error) {
    return NextResponse.json(
      { error: 'コメントの取得に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/articles/[id]/comments
 * コメントを作成するAPIエンドポイント
 * @param request - Next.jsリクエストオブジェクト
 * @param params - URLパラメータ
 * @returns 作成されたコメント
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const articleId = parseInt(id, 10);

    if (isNaN(articleId)) {
      return NextResponse.json({ error: '不正な記事IDです' }, { status: 400 });
    }

    // 記事が存在し、アクセス可能かチェック
    const article = await getArticleById(articleId);
    if (!article) {
      return NextResponse.json(
        { error: '記事が見つかりません' },
        { status: 404 }
      );
    }

    // 公開記事は誰でもコメント可能
    // 非公開記事は認証が必要
    let userId: number | undefined;
    if (article.status !== 'published') {
      const user = await getUser();
      if (!user) {
        return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
      }

      const canAccess = await canUserAccessArticle(articleId, user.id);
      if (!canAccess) {
        return NextResponse.json(
          { error: 'この記事にコメントする権限がありません' },
          { status: 403 }
        );
      }

      userId = user.id;
    }

    const body = await request.json();
    const result = createCommentSchema.safeParse({
      ...body,
      articleId,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { content, authorName, authorEmail } = result.data;

    // 認証済みユーザーの場合、ユーザー情報を使用
    // 未認証ユーザーの場合、名前とメールアドレスが必要
    if (!userId && (!authorName || !authorEmail)) {
      return NextResponse.json(
        { error: '名前とメールアドレスは必須です' },
        { status: 400 }
      );
    }

    const comment = await createArticleComment({
      articleId,
      userId,
      content,
      authorName: userId ? undefined : authorName,
      authorEmail: userId ? undefined : authorEmail,
    });

    // 作成されたコメントをユーザー情報と一緒に返す
    const comments = await getArticleComments(articleId);
    const newComment = comments.find((c) => c.id === comment.id);

    return NextResponse.json(newComment || comment, { status: 201 });
  } catch (_error) {
    return NextResponse.json(
      { error: 'コメントの作成に失敗しました' },
      { status: 500 }
    );
  }
}

