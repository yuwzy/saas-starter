'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { useState, useEffect, use } from 'react';
import { Loader2 } from 'lucide-react';
import useSWR from 'swr';

type Article = {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  status: string;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { data: article, error: fetchError } = useSWR<Article>(
    `/api/articles/${id}`,
    fetcher
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const slug = formData.get('slug') as string;
    const content = formData.get('content') as string;
    const excerpt = formData.get('excerpt') as string;
    const status = formData.get('status') as string;

    try {
      const response = await fetch(`/api/articles/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          slug,
          content,
          excerpt,
          status,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '記事の更新に失敗しました');
      }

      router.push('/dashboard/articles');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (fetchError) {
    return (
      <section className="flex-1 p-4 lg:p-8">
        <p className="text-red-500">記事の読み込みに失敗しました</p>
      </section>
    );
  }

  if (!article) {
    return (
      <section className="flex-1 p-4 lg:p-8">
        <p className="text-muted-foreground">読み込み中...</p>
      </section>
    );
  }

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-lg lg:text-2xl font-medium">記事編集</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>記事情報</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="title">タイトル</Label>
              <Input
                id="title"
                name="title"
                required
                defaultValue={article.title}
                placeholder="記事のタイトルを入力"
              />
            </div>

            <div>
              <Label htmlFor="slug">スラッグ</Label>
              <Input
                id="slug"
                name="slug"
                required
                defaultValue={article.slug}
                placeholder="url-friendly-slug"
              />
              <p className="text-sm text-muted-foreground mt-1">
                URLに使用されます（半角英数字とハイフンのみ）
              </p>
            </div>

            <div>
              <Label htmlFor="excerpt">要約</Label>
              <Textarea
                id="excerpt"
                name="excerpt"
                defaultValue={article.excerpt || ''}
                placeholder="記事の要約を入力（任意）"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="content">本文</Label>
              <Textarea
                id="content"
                name="content"
                required
                defaultValue={article.content}
                placeholder="記事の本文を入力"
                rows={12}
              />
            </div>

            <div>
              <Label htmlFor="status">ステータス</Label>
              <Select name="status" defaultValue={article.status}>
                <SelectTrigger>
                  <SelectValue placeholder="ステータスを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">下書き</SelectItem>
                  <SelectItem value="published">公開</SelectItem>
                  <SelectItem value="unpublished">非公開</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    更新中...
                  </>
                ) : (
                  '更新'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                キャンセル
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
