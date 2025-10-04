'use server';

import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import {
  articles,
  type NewArticle,
  ActivityType,
} from '@/lib/db/schema';
import { validatedActionWithUser } from '@/lib/auth/middleware';
import { getUser, getTeamForUser, getArticleById } from '@/lib/db/queries';
import { redirect } from 'next/navigation';
import { eq, and, isNull, sql } from 'drizzle-orm';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const createArticleSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です').max(255),
  content: z.string().min(1, '本文は必須です'),
  excerpt: z.string().max(500).optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
});

export const createArticle = validatedActionWithUser(
  createArticleSchema,
  async (data, _, user) => {
    const { title, content, excerpt, status } = data;

    const teamData = await getTeamForUser();
    if (!teamData) {
      return { error: 'チームに所属していません' };
    }

    const slug = generateSlug(title);

    // Check if slug already exists
    const existingArticle = await db
      .select()
      .from(articles)
      .where(and(eq(articles.slug, slug), isNull(articles.deletedAt)))
      .limit(1);

    if (existingArticle.length > 0) {
      return { error: '同じタイトルの記事が既に存在します' };
    }

    const newArticle: NewArticle = {
      userId: user.id,
      teamId: teamData.id,
      title,
      slug,
      content,
      excerpt: excerpt || null,
      status,
      publishedAt: status === 'published' ? new Date() : null,
    };

    const [createdArticle] = await db
      .insert(articles)
      .values(newArticle)
      .returning();

    if (!createdArticle) {
      return { error: '記事の作成に失敗しました' };
    }

    redirect(`/articles/${createdArticle.id}`);
  }
);

const updateArticleSchema = z.object({
  id: z.number(),
  title: z.string().min(1, 'タイトルは必須です').max(255),
  content: z.string().min(1, '本文は必須です'),
  excerpt: z.string().max(500).optional(),
  status: z.enum(['draft', 'published', 'archived']),
});

export const updateArticle = validatedActionWithUser(
  updateArticleSchema,
  async (data, _, user) => {
    const { id, title, content, excerpt, status } = data;

    const articleData = await getArticleById(id);
    if (!articleData) {
      return { error: '記事が見つかりません' };
    }

    // Check if user has permission to update
    if (articleData.article.userId !== user.id) {
      return { error: '記事を更新する権限がありません' };
    }

    const slug = generateSlug(title);

    // Check if new slug conflicts with another article
    if (slug !== articleData.article.slug) {
      const existingArticle = await db
        .select()
        .from(articles)
        .where(and(eq(articles.slug, slug), isNull(articles.deletedAt)))
        .limit(1);

      if (existingArticle.length > 0 && existingArticle[0].id !== id) {
        return { error: '同じタイトルの記事が既に存在します' };
      }
    }

    const wasPublished = articleData.article.status === 'published';
    const isNowPublished = status === 'published';

    await db
      .update(articles)
      .set({
        title,
        slug,
        content,
        excerpt: excerpt || null,
        status,
        publishedAt: isNowPublished && !wasPublished ? new Date() : articleData.article.publishedAt,
        updatedAt: new Date(),
      })
      .where(eq(articles.id, id));

    return { success: '記事を更新しました' };
  }
);

const deleteArticleSchema = z.object({
  id: z.number(),
});

export const deleteArticle = validatedActionWithUser(
  deleteArticleSchema,
  async (data, _, user) => {
    const { id } = data;

    const articleData = await getArticleById(id);
    if (!articleData) {
      return { error: '記事が見つかりません' };
    }

    // Check if user has permission to delete
    if (articleData.article.userId !== user.id) {
      return { error: '記事を削除する権限がありません' };
    }

    // Soft delete
    await db
      .update(articles)
      .set({
        deletedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(articles.id, id));

    redirect('/articles');
  }
);
