import { getArticles, createArticle, getUser } from '@/lib/db/queries';
import { NextRequest } from 'next/server';

export async function GET() {
  const articles = await getArticles();
  return Response.json(articles);
}

export async function POST(request: NextRequest) {
  const user = await getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { title, slug, content, excerpt, status } = body;

  if (!title || !slug || !content) {
    return Response.json(
      { error: 'Title, slug, and content are required' },
      { status: 400 }
    );
  }

  const article = await createArticle({
    title,
    slug,
    content,
    excerpt: excerpt || null,
    authorId: user.id,
    status: status || 'draft',
    publishedAt: status === 'published' ? new Date() : null,
  });

  return Response.json(article, { status: 201 });
}
