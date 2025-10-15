'use server';

import { revalidatePath } from 'next/cache';
import {
  createArticleSchema,
  updateArticleSchema,
} from '@/lib/validations/article';
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
    const data = Object.fromEntries(formData);
    const result = createArticleSchema.safeParse(data);

    if (!result.success) {
      return { error: result.error.errors[0].message };
    }

    const response = await fetch(`${process.env.BASE_URL}/api/articles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(result.data),
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || '記事の作成に失敗しました' };
    }

    const article = await response.json();

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
    const data = Object.fromEntries(formData);
    const result = updateArticleSchema.safeParse(data);

    if (!result.success) {
      return { error: result.error.errors[0].message };
    }

    const response = await fetch(`${process.env.BASE_URL}/api/articles/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(result.data),
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || '記事の更新に失敗しました' };
    }

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
    const response = await fetch(`${process.env.BASE_URL}/api/articles/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || '記事の削除に失敗しました' };
    }

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
