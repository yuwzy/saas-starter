import { db } from '@/lib/db/drizzle';
import { articles } from '@/lib/db/schema';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { eq, and } from 'drizzle-orm';
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const team = await getTeamForUser();
  if (!team) {
    return Response.json({ error: 'Team not found' }, { status: 404 });
  }

  const { id } = await params;
  const article = await db
    .select()
    .from(articles)
    .where(and(eq(articles.id, parseInt(id)), eq(articles.teamId, team.id)))
    .limit(1);

  if (article.length === 0) {
    return Response.json({ error: 'Article not found' }, { status: 404 });
  }

  return Response.json(article[0]);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const team = await getTeamForUser();
  if (!team) {
    return Response.json({ error: 'Team not found' }, { status: 404 });
  }

  const { id } = await params;
  const body = await request.json();
  const { title, slug, content, excerpt, status } = body;

  const existingArticle = await db
    .select()
    .from(articles)
    .where(and(eq(articles.id, parseInt(id)), eq(articles.teamId, team.id)))
    .limit(1);

  if (existingArticle.length === 0) {
    return Response.json({ error: 'Article not found' }, { status: 404 });
  }

  const updateData: any = {
    updatedAt: new Date(),
  };

  if (title !== undefined) updateData.title = title;
  if (slug !== undefined) updateData.slug = slug;
  if (content !== undefined) updateData.content = content;
  if (excerpt !== undefined) updateData.excerpt = excerpt;
  if (status !== undefined) {
    updateData.status = status;
    if (status === 'published' && !existingArticle[0].publishedAt) {
      updateData.publishedAt = new Date();
    }
  }

  const updatedArticle = await db
    .update(articles)
    .set(updateData)
    .where(and(eq(articles.id, parseInt(id)), eq(articles.teamId, team.id)))
    .returning();

  return Response.json(updatedArticle[0]);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const team = await getTeamForUser();
  if (!team) {
    return Response.json({ error: 'Team not found' }, { status: 404 });
  }

  const { id } = await params;

  const existingArticle = await db
    .select()
    .from(articles)
    .where(and(eq(articles.id, parseInt(id)), eq(articles.teamId, team.id)))
    .limit(1);

  if (existingArticle.length === 0) {
    return Response.json({ error: 'Article not found' }, { status: 404 });
  }

  await db
    .delete(articles)
    .where(and(eq(articles.id, parseInt(id)), eq(articles.teamId, team.id)));

  return Response.json({ message: 'Article deleted successfully' });
}
