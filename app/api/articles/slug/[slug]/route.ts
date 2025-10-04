import { db } from '@/lib/db/drizzle';
import { articles, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const result = await db.query.articles.findFirst({
    where: eq(articles.slug, slug),
    with: {
      author: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
      articleCategories: {
        with: {
          category: true,
        },
      },
      articleTags: {
        with: {
          tag: true,
        },
      },
    },
  });

  if (!result) {
    return Response.json({ error: 'Article not found' }, { status: 404 });
  }

  // 公開記事のみアクセス可能
  if (result.status !== 'published') {
    return Response.json({ error: 'Article not published' }, { status: 404 });
  }

  return Response.json(result);
}
