import { NextResponse } from 'next/server';
import { getCategories } from '@/lib/db/queries';

/**
 * カテゴリ一覧を取得
 * GET /api/categories
 */
export async function GET() {
  try {
    const categoriesList = await getCategories();
    return NextResponse.json(categoriesList);
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return NextResponse.json(
      { error: 'カテゴリの取得に失敗しました' },
      { status: 500 }
    );
  }
}
