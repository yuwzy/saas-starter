import { z } from 'zod';
import { ArticleStatus } from '@/lib/db/schema';

/**
 * 記事作成・更新用のバリデーションスキーマ
 */
export const articleSchema = z.object({
  title: z.string().min(1, '記事タイトルは必須です').max(255, '記事タイトルは255文字以内で入力してください'),
  slug: z
    .string()
    .min(1, 'スラッグは必須です')
    .max(255, 'スラッグは255文字以内で入力してください')
    .regex(/^[a-z0-9-]+$/, 'スラッグは小文字英数字とハイフンのみ使用できます'),
  content: z.string().min(1, '記事本文は必須です'),
  excerpt: z.string().max(500, '抜粋は500文字以内で入力してください').optional().nullable(),
  status: z.nativeEnum(ArticleStatus, {
    errorMap: () => ({ message: '無効なステータスです' }),
  }),
  categoryId: z.number().int().positive().optional().nullable(),
  tagIds: z.array(z.number().int().positive()).optional(),
});

export type ArticleFormData = z.infer<typeof articleSchema>;
