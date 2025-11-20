import { NextRequest, NextResponse } from 'next/server';
import { deleteArticleComment } from '@/lib/db/articles-queries';
import { getUser } from '@/lib/db/queries';

/**
 * DELETE /api/articles/[id]/comments/[commentId]
 * コメントを削除するAPIエンドポイント
 * @param request - Next.jsリクエストオブジェクト
 * @param params - URLパラメータ
 * @returns 削除成功メッセージ
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { commentId } = await params;
    const commentIdNum = parseInt(commentId, 10);

    if (isNaN(commentIdNum)) {
      return NextResponse.json(
        { error: '不正なコメントIDです' },
        { status: 400 }
      );
    }

    await deleteArticleComment(commentIdNum, user.id);

    return NextResponse.json({ success: 'コメントを削除しました' });
  } catch (_error) {
    return NextResponse.json(
      { error: 'コメントの削除に失敗しました' },
      { status: 500 }
    );
  }
}

