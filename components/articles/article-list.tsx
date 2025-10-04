'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { ArticleWithRelations } from '@/lib/db/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from './status-badge';
import { Edit, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * 記事一覧コンポーネント
 */
export function ArticleList() {
  const { data: articles, error, mutate } = useSWR<ArticleWithRelations[]>(
    '/api/articles',
    fetcher
  );
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const router = useRouter();

  /**
   * 記事削除ハンドラー
   */
  const handleDelete = async (id: number) => {
    if (!confirm('この記事を削除してもよろしいですか？')) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || '削除に失敗しました');
      }

      mutate();
    } catch (error) {
      alert(error instanceof Error ? error.message : '削除に失敗しました');
    } finally {
      setDeletingId(null);
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-500">記事の読み込みに失敗しました</p>
        </CardContent>
      </Card>
    );
  }

  if (!articles) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">読み込み中...</p>
        </CardContent>
      </Card>
    );
  }

  if (articles.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">記事がありません</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {articles.map((article) => (
        <Card key={article.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <CardTitle className="text-xl">
                  <Link
                    href={`/dashboard/articles/${article.id}/edit`}
                    className="hover:underline"
                  >
                    {article.title}
                  </Link>
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <StatusBadge status={article.status} />
                  {article.category && (
                    <span className="px-2 py-1 bg-secondary rounded-md">
                      {article.category.name}
                    </span>
                  )}
                  <span>by {article.user.name}</span>
                  <span>
                    {new Date(article.createdAt).toLocaleDateString('ja-JP')}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <Link href={`/dashboard/articles/${article.id}/edit`}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(article.id)}
                  disabled={deletingId === article.id}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          {article.excerpt && (
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {article.excerpt}
              </p>
              {article.articleTags.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {article.articleTags.map(({ tag }) => (
                    <span
                      key={tag.id}
                      className="px-2 py-1 text-xs bg-accent rounded-md"
                    >
                      #{tag.name}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
