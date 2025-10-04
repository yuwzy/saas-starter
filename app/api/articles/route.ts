import { db } from '@/lib/db/drizzle';
import { articles } from '@/lib/db/schema';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { eq, desc } from 'drizzle-orm';
import { NextRequest } from 'next/server';

export async function GET() {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const team = await getTeamForUser();
  if (!team) {
    return Response.json({ error: 'Team not found' }, { status: 404 });
  }

  const articlesList = await db
    .select()
    .from(articles)
    .where(eq(articles.teamId, team.id))
    .orderBy(desc(articles.createdAt));

  return Response.json(articlesList);
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const team = await getTeamForUser();
  if (!team) {
    return Response.json({ error: 'Team not found' }, { status: 404 });
  }

  const body = await request.json();
  const { title, slug, content, excerpt, status } = body;

  if (!title || !slug || !content) {
    return Response.json(
      { error: 'Title, slug, and content are required' },
      { status: 400 }
    );
  }

  const newArticle = await db
    .insert(articles)
    .values({
      title,
      slug,
      content,
      excerpt: excerpt || null,
      status: status || 'draft',
      authorId: user.id,
      teamId: team.id,
      publishedAt: status === 'published' ? new Date() : null,
    })
    .returning();

  return Response.json(newArticle[0], { status: 201 });
}
