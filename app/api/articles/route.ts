import { getArticles } from '@/lib/db/queries';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const articles = await getArticles();
    return NextResponse.json(articles);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '記事の取得に失敗しました' },
      { status: 401 }
    );
  }
}
