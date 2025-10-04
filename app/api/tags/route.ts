import { NextResponse } from 'next/server';
import { getTags } from '@/lib/db/queries';

/**
 * タグ一覧を取得
 * GET /api/tags
 */
export async function GET() {
  try {
    const tagsList = await getTags();
    return NextResponse.json(tagsList);
  } catch (error) {
    console.error('Failed to fetch tags:', error);
    return NextResponse.json(
      { error: 'タグの取得に失敗しました' },
      { status: 500 }
    );
  }
}
