'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Calendar, User } from 'lucide-react';
import Link from 'next/link';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type Article = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  status: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  authorName: string | null;
  authorEmail: string | null;
};

function formatDate(dateString: string | null) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    published: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    archived: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  };

  const labels = {
    draft: '下書き',
    published: '公開中',
    archived: 'アーカイブ',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        styles[status as keyof typeof styles] || styles.draft
      }`}
    >
      {labels[status as keyof typeof labels] || status}
    </span>
  );
}

export default function ArticlesPage() {
  const { data: articles, error, isLoading } = useSWR<Article[]>(
    '/api/articles',
    fetcher
  );

  if (error) {
    return (
      <section className="flex-1 p-4 lg:p-8">
        <div className="text-red-500">
          エラーが発生しました: {error.message || '記事の取得に失敗しました'}
        </div>
      </section>
    );
  }

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-lg lg:text-2xl font-medium text-foreground">
          記事管理
        </h1>
        <Link href="/articles/new">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">
            <Plus className="mr-2 h-4 w-4" />
            新規記事作成
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center text-muted-foreground">
              読み込み中...
            </div>
          </CardContent>
        </Card>
      ) : articles && articles.length > 0 ? (
        <div className="grid gap-4">
          {articles.map((article) => (
            <Link key={article.id} href={`/articles/${article.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">
                        {article.title}
                      </CardTitle>
                      {article.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {article.excerpt}
                        </p>
                      )}
                    </div>
                    <StatusBadge status={article.status} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>{article.authorName || article.authorEmail}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>作成: {formatDate(article.createdAt)}</span>
                    </div>
                    {article.publishedAt && (
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        <span>公開: {formatDate(article.publishedAt)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                まだ記事がありません
              </p>
              <Link href="/articles/new">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  最初の記事を作成
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
