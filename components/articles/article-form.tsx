'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArticleStatus, Category, Tag, Article } from '@/lib/db/schema';
import { Loader2 } from 'lucide-react';

type ArticleFormProps = {
  article?: Article;
  mode: 'create' | 'edit';
};

/**
 * 記事作成・編集フォームコンポーネント
 */
export function ArticleForm({ article, mode }: ArticleFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);

  /**
   * カテゴリとタグを取得
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, tagsRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/tags'),
        ]);

        if (categoriesRes.ok) {
          setCategories(await categoriesRes.json());
        }
        if (tagsRes.ok) {
          setTags(await tagsRes.json());
        }
      } catch (error) {
        console.error('Failed to fetch categories and tags:', error);
      }
    };

    fetchData();
  }, []);

  /**
   * フォーム送信ハンドラー
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title') as string,
      slug: formData.get('slug') as string,
      content: formData.get('content') as string,
      excerpt: formData.get('excerpt') as string,
      status: formData.get('status') as ArticleStatus,
      categoryId: formData.get('categoryId')
        ? parseInt(formData.get('categoryId') as string, 10)
        : null,
      tagIds: selectedTags,
    };

    try {
      const url =
        mode === 'create'
          ? '/api/articles'
          : `/api/articles/${article?.id}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || '保存に失敗しました');
      }

      router.push('/dashboard/articles');
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : '保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * タグ選択切り替えハンドラー
   */
  const toggleTag = (tagId: number) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  /**
   * スラッグ自動生成ハンドラー
   */
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">タイトル *</Label>
            <Input
              id="title"
              name="title"
              defaultValue={article?.title}
              onChange={(e) => {
                const slugInput = document.getElementById(
                  'slug'
                ) as HTMLInputElement;
                if (slugInput && !article) {
                  slugInput.value = generateSlug(e.target.value);
                }
              }}
              required
              aria-required="true"
            />
          </div>

          <div>
            <Label htmlFor="slug">スラッグ *</Label>
            <Input
              id="slug"
              name="slug"
              defaultValue={article?.slug}
              pattern="^[a-z0-9-]+$"
              title="小文字英数字とハイフンのみ使用できます"
              required
              aria-required="true"
            />
            <p className="text-xs text-muted-foreground mt-1">
              小文字英数字とハイフン(-)のみ使用できます
            </p>
          </div>

          <div>
            <Label htmlFor="excerpt">抜粋</Label>
            <Textarea
              id="excerpt"
              name="excerpt"
              defaultValue={article?.excerpt ?? ''}
              maxLength={500}
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1">
              500文字以内で入力してください
            </p>
          </div>

          <div>
            <Label htmlFor="content">本文 *</Label>
            <Textarea
              id="content"
              name="content"
              defaultValue={article?.content}
              rows={15}
              required
              aria-required="true"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>カテゴリとタグ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="categoryId">カテゴリ</Label>
            <Select
              name="categoryId"
              defaultValue={article?.categoryId?.toString() ?? ''}
            >
              <SelectTrigger id="categoryId">
                <SelectValue placeholder="カテゴリを選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">なし</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>タグ</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${
                    selectedTags.includes(tag.id)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                  aria-pressed={selectedTags.includes(tag.id)}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>公開設定</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="status">ステータス *</Label>
            <Select
              name="status"
              defaultValue={article?.status ?? ArticleStatus.DRAFT}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ArticleStatus.DRAFT}>下書き</SelectItem>
                <SelectItem value={ArticleStatus.PUBLISHED}>公開</SelectItem>
                <SelectItem value={ArticleStatus.UNPUBLISHED}>
                  非公開
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              保存中...
            </>
          ) : mode === 'create' ? (
            '作成'
          ) : (
            '更新'
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          キャンセル
        </Button>
      </div>
    </form>
  );
}
