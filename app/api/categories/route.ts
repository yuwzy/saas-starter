import { NextResponse } from 'next/server';
import { getCategories } from '@/lib/db/articles-queries';

/**
 * GET /api/categories
 * カテゴリ一覧を取得するAPIエンドポイント
 * @returns カテゴリ一覧
 */
export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json(
      { error: 'カテゴリの取得に失敗しました' },
      { status: 500 }
    );
  }
}
