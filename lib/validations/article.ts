import { z } from 'zod';

/**
 * 記事作成のバリデーションスキーマ
 */
export const createArticleSchema = z.object({
  title: z
    .string()
    .min(1, 'タイトルは必須です')
    .max(500, 'タイトルは500文字以内で入力してください'),
  slug: z
    .string()
    .min(1, 'スラッグは必須です')
    .max(500, 'スラッグは500文字以内で入力してください')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'スラッグは小文字英数字とハイフンのみ使用できます'
    ),
  content: z.string().min(1, '本文は必須です'),
  excerpt: z.string().max(1000, '抜粋は1000文字以内で入力してください').optional(),
  categoryId: z.coerce.number().positive('カテゴリを選択してください').optional(),
  status: z.enum(['draft', 'published', 'unpublished'], {
    errorMap: () => ({ message: 'ステータスが不正です' }),
  }).default('draft'),
  tags: z.string().optional(),
  publishNow: z.string().optional(),
});

/**
 * 記事更新のバリデーションスキーマ
 */
export const updateArticleSchema = z.object({
  title: z
    .string()
    .min(1, 'タイトルは必須です')
    .max(500, 'タイトルは500文字以内で入力してください'),
  slug: z
    .string()
    .min(1, 'スラッグは必須です')
    .max(500, 'スラッグは500文字以内で入力してください')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'スラッグは小文字英数字とハイフンのみ使用できます'
    ),
  content: z.string().min(1, '本文は必須です'),
  excerpt: z.string().max(1000, '抜粋は1000文字以内で入力してください').optional(),
  categoryId: z.coerce.number().positive('カテゴリを選択してください').optional(),
  status: z.enum(['draft', 'published', 'unpublished'], {
    errorMap: () => ({ message: 'ステータスが不正です' }),
  }),
  tags: z.string().optional(),
  publishNow: z.string().optional(),
});

/**
 * カテゴリ作成のバリデーションスキーマ
 */
export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'カテゴリ名は必須です')
    .max(100, 'カテゴリ名は100文字以内で入力してください'),
  slug: z
    .string()
    .min(1, 'スラッグは必須です')
    .max(100, 'スラッグは100文字以内で入力してください')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'スラッグは小文字英数字とハイフンのみ使用できます'
    ),
});
