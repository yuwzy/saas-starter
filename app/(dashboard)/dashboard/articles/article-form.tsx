'use client';

import { useActionState, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Eye } from 'lucide-react';
import { createArticleAction, updateArticleAction } from './actions';
import type { Category, ArticleWithDetails } from '@/lib/db/schema';

type ArticleFormProps = {
  article?: ArticleWithDetails;
  categories: Category[];
};

type ActionState = {
  error?: string;
  success?: string;
  articleId?: number;
};

/**
 * 記事フォームコンポーネント
 */
export function ArticleForm({ article, categories }: ArticleFormProps) {
  const router = useRouter();
  const isEditMode = !!article;

  const [formState, formAction, isPending] = useActionState<ActionState, FormData>(
    isEditMode
      ? updateArticleAction.bind(null, article.id)
      : createArticleAction,
    {}
  );

  const [title, setTitle] = useState(article?.title || '');
  const [slug, setSlug] = useState(article?.slug || '');
  const [content, setContent] = useState(article?.content || '');
  const [excerpt, setExcerpt] = useState(article?.excerpt || '');
  const [categoryId, setCategoryId] = useState(
    article?.categoryId?.toString() || ''
  );
  const [status, setStatus] = useState(article?.status || 'draft');
  const [tags, setTags] = useState(
    article?.tags?.map((t) => t.tagName).join(', ') || ''
  );
  const [isAutoSlug, setIsAutoSlug] = useState(!isEditMode);

  /**
   * タイトルからスラッグを自動生成
   */
  useEffect(() => {
    if (isAutoSlug && title && !isEditMode) {
      const generatedSlug = title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generatedSlug);
    }
  }, [title, isAutoSlug, isEditMode]);

  /**
   * フォーム送信成功時の処理
   */
  useEffect(() => {
    if (formState.success) {
      if (!isEditMode && formState.articleId) {
        router.push('/dashboard/articles');
      } else if (isEditMode) {
        router.refresh();
      }
    }
  }, [formState, router, isEditMode]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? '記事情報の編集' : '記事情報の入力'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          {/* タイトル */}
          <div>
            <Label htmlFor="title" className="mb-2">
              タイトル <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              name="title"
              placeholder="記事のタイトルを入力"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              aria-required="true"
              maxLength={500}
            />
          </div>

          {/* スラッグ */}
          <div>
            <Label htmlFor="slug" className="mb-2">
              スラッグ <span className="text-destructive">*</span>
            </Label>
            <div className="space-y-2">
              <Input
                id="slug"
                name="slug"
                placeholder="url-friendly-slug"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setIsAutoSlug(false);
                }}
                required
                aria-required="true"
                maxLength={500}
                pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
              />
              <p className="text-xs text-muted-foreground">
                小文字英数字とハイフンのみ使用可能。記事のURLに使用されます。
              </p>
            </div>
          </div>

          {/* カテゴリ */}
          <div>
            <Label htmlFor="categoryId" className="mb-2">
              カテゴリ
            </Label>
            <Select
              id="categoryId"
              name="categoryId"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              aria-label="カテゴリを選択"
            >
              <option value="">カテゴリなし</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </div>

          {/* 抜粋 */}
          <div>
            <Label htmlFor="excerpt" className="mb-2">
              抜粋
            </Label>
            <Textarea
              id="excerpt"
              name="excerpt"
              placeholder="記事の概要を入力（任意）"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              maxLength={1000}
              aria-label="記事の抜粋"
            />
            <p className="text-xs text-muted-foreground mt-1">
              記事一覧やSNSシェア時に表示されます
            </p>
          </div>

          {/* 本文 */}
          <div>
            <Label htmlFor="content" className="mb-2">
              本文 <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="content"
              name="content"
              placeholder="記事の本文を入力"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              aria-required="true"
              rows={15}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Markdown形式で記述できます
            </p>
          </div>

          {/* タグ */}
          <div>
            <Label htmlFor="tags" className="mb-2">
              タグ
            </Label>
            <Input
              id="tags"
              name="tags"
              placeholder="タグをカンマ区切りで入力（例: JavaScript, React, Next.js）"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              aria-label="タグ"
            />
          </div>

          {/* ステータス */}
          <div>
            <Label htmlFor="status" className="mb-2">
              ステータス <span className="text-destructive">*</span>
            </Label>
            <Select
              id="status"
              name="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              required
              aria-required="true"
            >
              <option value="draft">下書き</option>
              <option value="published">公開</option>
              <option value="unpublished">非公開</option>
            </Select>
          </div>

          {/* エラー・成功メッセージ */}
          {formState.error && (
            <div
              className="p-3 rounded-md bg-destructive/10 text-destructive text-sm"
              role="alert"
            >
              {formState.error}
            </div>
          )}
          {formState.success && (
            <div
              className="p-3 rounded-md bg-accent text-accent-foreground text-sm"
              role="status"
            >
              {formState.success}
            </div>
          )}

          {/* アクションボタン */}
          <div className="flex items-center gap-4 pt-4 border-t border-border">
            <Button
              type="submit"
              disabled={isPending}
              aria-label={isEditMode ? '記事を更新' : '記事を作成'}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? '更新中...' : '作成中...'}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isEditMode ? '更新する' : '作成する'}
                </>
              )}
            </Button>

            {!isEditMode && (
              <input type="hidden" name="publishNow" value="false" />
            )}

            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/articles')}
              disabled={isPending}
            >
              キャンセル
            </Button>

            {isEditMode && article.status === 'published' && (
              <Button
                variant="outline"
                asChild
                className="ml-auto"
              >
                <a href={`/articles/${article.slug}`} target="_blank" rel="noopener noreferrer">
                  <Eye className="mr-2 h-4 w-4" />
                  プレビュー
                </a>
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
