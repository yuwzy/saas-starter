'use server';

import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { articles, activityLogs, ActivityType } from '@/lib/db/schema';
import { getUserWithTeam } from '@/lib/db/queries';
import { validatedActionWithUser } from '@/lib/auth/middleware';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

async function logActivity(
  teamId: number | null | undefined,
  userId: number,
  type: ActivityType
) {
  if (teamId === null || teamId === undefined) {
    return;
  }
  await db.insert(activityLogs).values({
    teamId,
    userId,
    action: type,
    ipAddress: '',
  });
}

const createArticleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  content: z.string().optional(),
  status: z.enum(['draft', 'published']).default('draft'),
});

export const createArticle = validatedActionWithUser(
  createArticleSchema,
  async (data, _, user) => {
    const { title, content, status } = data;
    const userWithTeam = await getUserWithTeam(user.id);

    if (!userWithTeam?.teamId) {
      return { error: 'User is not part of a team' };
    }

    const [newArticle] = await db
      .insert(articles)
      .values({
        teamId: userWithTeam.teamId,
        userId: user.id,
        title,
        content: content || '',
        status,
      })
      .returning();

    await logActivity(userWithTeam.teamId, user.id, ActivityType.CREATE_ARTICLE);

    revalidatePath('/dashboard/articles');
    return { success: 'Article created successfully', article: newArticle };
  }
);

const updateArticleSchema = z.object({
  id: z.number(),
  title: z.string().min(1, 'Title is required').max(255),
  content: z.string().optional(),
  status: z.enum(['draft', 'published']),
});

export const updateArticle = validatedActionWithUser(
  updateArticleSchema,
  async (data, _, user) => {
    const { id, title, content, status } = data;
    const userWithTeam = await getUserWithTeam(user.id);

    if (!userWithTeam?.teamId) {
      return { error: 'User is not part of a team' };
    }

    const [updatedArticle] = await db
      .update(articles)
      .set({
        title,
        content: content || '',
        status,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(articles.id, id),
          eq(articles.teamId, userWithTeam.teamId)
        )
      )
      .returning();

    if (!updatedArticle) {
      return { error: 'Article not found' };
    }

    await logActivity(userWithTeam.teamId, user.id, ActivityType.UPDATE_ARTICLE);

    revalidatePath('/dashboard/articles');
    return { success: 'Article updated successfully', article: updatedArticle };
  }
);

const deleteArticleSchema = z.object({
  id: z.number(),
});

export const deleteArticle = validatedActionWithUser(
  deleteArticleSchema,
  async (data, _, user) => {
    const { id } = data;
    const userWithTeam = await getUserWithTeam(user.id);

    if (!userWithTeam?.teamId) {
      return { error: 'User is not part of a team' };
    }

    const [deletedArticle] = await db
      .delete(articles)
      .where(
        and(
          eq(articles.id, id),
          eq(articles.teamId, userWithTeam.teamId)
        )
      )
      .returning();

    if (!deletedArticle) {
      return { error: 'Article not found' };
    }

    await logActivity(userWithTeam.teamId, user.id, ActivityType.DELETE_ARTICLE);

    revalidatePath('/dashboard/articles');
    return { success: 'Article deleted successfully' };
  }
);
