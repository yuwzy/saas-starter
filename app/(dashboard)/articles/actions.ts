'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { validatedActionWithUser } from '@/lib/auth/middleware';
import {
  createArticle,
  updateArticle,
  deleteArticle,
  getArticleById,
} from '@/lib/db/queries';
import { getUserWithTeam } from '@/lib/db/queries';
import { createArticleSchema, updateArticleSchema } from '@/lib/validation/article';
import { db } from '@/lib/db/drizzle';
import { activityLogs, ActivityType } from '@/lib/db/schema';

async function logActivity(
  teamId: number,
  userId: number,
  type: ActivityType
) {
  await db.insert(activityLogs).values({
    teamId,
    userId,
    action: type,
    ipAddress: '',
  });
}

export const createArticleAction = validatedActionWithUser(
  createArticleSchema,
  async (data, _, user) => {
    const userWithTeam = await getUserWithTeam(user.id);

    if (!userWithTeam?.teamId) {
      return { error: 'User is not part of a team' };
    }

    const article = await createArticle({
      teamId: userWithTeam.teamId,
      authorId: user.id,
      title: data.title,
      content: data.content,
      status: data.status,
    });

    await logActivity(userWithTeam.teamId, user.id, ActivityType.CREATE_ARTICLE);

    revalidatePath('/articles');
    redirect(`/articles/${article.id}`);
  }
);

const updateArticleActionSchema = updateArticleSchema.extend({
  id: z.number(),
});

export const updateArticleAction = validatedActionWithUser(
  updateArticleActionSchema,
  async (data, _, user) => {
    const { id, ...updateData } = data;
    const userWithTeam = await getUserWithTeam(user.id);

    if (!userWithTeam?.teamId) {
      return { error: 'User is not part of a team' };
    }

    // Check if article exists and belongs to user's team
    const existingArticle = await getArticleById(id, userWithTeam.teamId);
    if (!existingArticle) {
      return { error: 'Article not found' };
    }

    const article = await updateArticle(id, userWithTeam.teamId, updateData);

    if (!article) {
      return { error: 'Failed to update article' };
    }

    await logActivity(userWithTeam.teamId, user.id, ActivityType.UPDATE_ARTICLE);

    revalidatePath('/articles');
    revalidatePath(`/articles/${id}`);
    redirect(`/articles/${id}`);
  }
);

const deleteArticleSchema = z.object({
  id: z.number(),
});

export const deleteArticleAction = validatedActionWithUser(
  deleteArticleSchema,
  async (data, _, user) => {
    const { id } = data;
    const userWithTeam = await getUserWithTeam(user.id);

    if (!userWithTeam?.teamId) {
      return { error: 'User is not part of a team' };
    }

    // Check if article exists and belongs to user's team
    const existingArticle = await getArticleById(id, userWithTeam.teamId);
    if (!existingArticle) {
      return { error: 'Article not found' };
    }

    const article = await deleteArticle(id, userWithTeam.teamId);

    if (!article) {
      return { error: 'Failed to delete article' };
    }

    await logActivity(userWithTeam.teamId, user.id, ActivityType.DELETE_ARTICLE);

    revalidatePath('/articles');
    redirect('/articles');
  }
);
