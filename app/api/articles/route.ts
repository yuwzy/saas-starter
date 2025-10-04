import { db } from '@/lib/db/drizzle';
import { articles } from '@/lib/db/schema';
import { getUser, getUserWithTeam } from '@/lib/db/queries';
import { eq, and, desc } from 'drizzle-orm';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userWithTeam = await getUserWithTeam(user.id);
  if (!userWithTeam?.teamId) {
    return Response.json({ error: 'User is not part of a team' }, { status: 400 });
  }

  const teamArticles = await db
    .select()
    .from(articles)
    .where(eq(articles.teamId, userWithTeam.teamId))
    .orderBy(desc(articles.updatedAt));

  return Response.json(teamArticles);
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userWithTeam = await getUserWithTeam(user.id);
  if (!userWithTeam?.teamId) {
    return Response.json({ error: 'User is not part of a team' }, { status: 400 });
  }

  const body = await request.json();
  const { title, content, status } = body;

  const [newArticle] = await db
    .insert(articles)
    .values({
      teamId: userWithTeam.teamId,
      userId: user.id,
      title,
      content,
      status: status || 'draft',
    })
    .returning();

  return Response.json(newArticle);
}
