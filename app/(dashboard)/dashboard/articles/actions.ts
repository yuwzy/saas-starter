'use server';

import { revalidatePath } from 'next/cache';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import {
  createArticle,
  updateArticle,
  deleteArticle,
  canUserModifyArticle,
  getArticleById,
} from '@/lib/db/articles-queries';
import {
  createArticleSchema,
  updateArticleSchema,
} from '@/lib/validations/article';
import { ActivityType } from '@/lib/db/schema';
import type { ActionState } from '@/lib/auth/middleware';

/**
 * スラッグを生成するヘルパー関数
 * @param title - 記事のタイトル
 * @returns URLフレンドリーなスラッグ
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * 記事作成アクション
 * @param prevState - 前回のアクション状態
 * @param formData - フォームデータ
 * @returns アクション結果の状態
 */
export async function createArticleAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await getUser();
    if (!user) {
      return { error: '認証が必要です' };
    }

    const team = await getTeamForUser();
    if (!team) {
      return { error: 'チームが見つかりません' };
    }

    const data = Object.fromEntries(formData);
    const result = createArticleSchema.safeParse(data);

    if (!result.success) {
      return { error: result.error.errors[0].message };
    }

    const { title, slug, content, excerpt, categoryId, status, tags, publishNow } =
      result.data;

    const tags_array = tags
      ? tags
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0)
      : [];

    const shouldPublish = status === 'published' || publishNow === 'true';

    const article = await createArticle(
      {
        userId: user.id,
        title,
        slug,
        content,
        excerpt: excerpt || undefined,
        categoryId: categoryId || undefined,
        status: shouldPublish ? 'published' : status,
        publishedAt: shouldPublish ? new Date() : undefined,
      },
      tags_array
    );

    revalidatePath('/dashboard/articles');
    return { success: '記事を作成しました', articleId: article.id };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: '記事の作成に失敗しました' };
  }
}

/**
 * 記事更新アクション
 * @param id - 記事のID
 * @param prevState - 前回のアクション状態
 * @param formData - フォームデータ
 * @returns アクション結果の状態
 */
export async function updateArticleAction(
  id: number,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await getUser();
    if (!user) {
      return { error: '認証が必要です' };
    }

    const canModify = await canUserModifyArticle(id, user.id);
    if (!canModify) {
      return { error: 'この記事を編集する権限がありません' };
    }

    const data = Object.fromEntries(formData);
    const result = updateArticleSchema.safeParse(data);

    if (!result.success) {
      return { error: result.error.errors[0].message };
    }

    const { title, slug, content, excerpt, categoryId, status, tags, publishNow } =
      result.data;

    const tags_array = tags
      ? tags
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0)
      : [];

    const article = await getArticleById(id);
    const shouldPublish =
      (status === 'published' || publishNow === 'true') && !article?.publishedAt;

    await updateArticle(
      id,
      {
        title,
        slug,
        content,
        excerpt: excerpt || undefined,
        categoryId: categoryId || undefined,
        status: shouldPublish ? 'published' : status,
        publishedAt: shouldPublish ? new Date() : undefined,
      },
      tags_array
    );

    revalidatePath('/dashboard/articles');
    revalidatePath(`/dashboard/articles/${id}/edit`);
    return { success: '記事を更新しました' };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: '記事の更新に失敗しました' };
  }
}

/**
 * 記事削除アクション
 * @param id - 記事のID
 * @returns アクション結果の状態
 */
export async function deleteArticleAction(id: number): Promise<ActionState> {
  try {
    const user = await getUser();
    if (!user) {
      return { error: '認証が必要です' };
    }

    const canModify = await canUserModifyArticle(id, user.id);
    if (!canModify) {
      return { error: 'この記事を削除する権限がありません' };
    }

    await deleteArticle(id);

    revalidatePath('/dashboard/articles');
    return { success: '記事を削除しました' };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: '記事の削除に失敗しました' };
  }
}

/**
 * タイトルからスラッグを生成するアクション
 * @param title - 記事のタイトル
 * @returns 生成されたスラッグ
 */
export async function generateSlugAction(title: string): Promise<string> {
  return generateSlug(title);
}
