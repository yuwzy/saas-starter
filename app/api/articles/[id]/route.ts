import { db } from '@/lib/db/drizzle';
import { articles } from '@/lib/db/schema';
import { getUser, getUserWithTeam } from '@/lib/db/queries';
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

  const userWithTeam = await getUserWithTeam(user.id);
  if (!userWithTeam?.teamId) {
    return Response.json({ error: 'User is not part of a team' }, { status: 400 });
  }

  const { id } = await params;
  const [article] = await db
    .select()
    .from(articles)
    .where(
      and(
        eq(articles.id, parseInt(id)),
        eq(articles.teamId, userWithTeam.teamId)
      )
    )
    .limit(1);

  if (!article) {
    return Response.json({ error: 'Article not found' }, { status: 404 });
  }

  return Response.json(article);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userWithTeam = await getUserWithTeam(user.id);
  if (!userWithTeam?.teamId) {
    return Response.json({ error: 'User is not part of a team' }, { status: 400 });
  }

  const { id } = await params;
  const body = await request.json();
  const { title, content, status } = body;

  const [updatedArticle] = await db
    .update(articles)
    .set({
      title,
      content,
      status,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(articles.id, parseInt(id)),
        eq(articles.teamId, userWithTeam.teamId)
      )
    )
    .returning();

  if (!updatedArticle) {
    return Response.json({ error: 'Article not found' }, { status: 404 });
  }

  return Response.json(updatedArticle);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userWithTeam = await getUserWithTeam(user.id);
  if (!userWithTeam?.teamId) {
    return Response.json({ error: 'User is not part of a team' }, { status: 400 });
  }

  const { id } = await params;
  const [deletedArticle] = await db
    .delete(articles)
    .where(
      and(
        eq(articles.id, parseInt(id)),
        eq(articles.teamId, userWithTeam.teamId)
      )
    )
    .returning();

  if (!deletedArticle) {
    return Response.json({ error: 'Article not found' }, { status: 404 });
  }

  return Response.json({ success: true });
}
