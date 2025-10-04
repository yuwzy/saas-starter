import { db } from '@/lib/db/drizzle';
import { tags } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { desc } from 'drizzle-orm';
import { NextRequest } from 'next/server';

export async function GET() {
  const result = await db
    .select()
    .from(tags)
    .orderBy(desc(tags.createdAt));

  return Response.json(result);
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { name, slug } = body;

  if (!name || !slug) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const [tag] = await db
      .insert(tags)
      .values({ name, slug })
      .returning();

    return Response.json(tag, { status: 201 });
  } catch (error: any) {
    if (error.code === '23505') {
      return Response.json({ error: 'Slug already exists' }, { status: 409 });
    }
    return Response.json({ error: 'Failed to create tag' }, { status: 500 });
  }
}
