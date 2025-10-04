'use client';

import { use } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Trash2, Calendar, User } from 'lucide-react';
import Link from 'next/link';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { deleteArticle } from '../actions';
import { useActionState } from 'react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type Article = {
  id: number;
  userId: number;
  teamId: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  status: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

type ArticleData = {
  article: Article;
  authorName: string | null;
  authorEmail: string | null;
};

function formatDate(dateString: string | null) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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

export default function ArticleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data, error, isLoading } = useSWR<ArticleData>(
    `/api/articles/${id}`,
    fetcher
  );

  const [deleteState, deleteAction, isDeleting] = useActionState(
    async (prevState: any, formData: FormData) => {
      if (
        !confirm(
          '本当にこの記事を削除しますか？この操作は取り消せません。'
        )
      ) {
        return prevState;
      }
      formData.append('id', id);
      return deleteArticle(prevState, formData);
    },
    {}
  );

  if (error) {
    return (
      <section className="flex-1 p-4 lg:p-8">
        <div className="mb-6">
          <Link
            href="/articles"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            記事一覧に戻る
          </Link>
        </div>
        <Card>
          <CardContent className="p-8">
            <div className="text-red-500">
              エラーが発生しました: {error.message || '記事の取得に失敗しました'}
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (isLoading || !data) {
    return (
      <section className="flex-1 p-4 lg:p-8">
        <div className="mb-6">
          <Link
            href="/articles"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            記事一覧に戻る
          </Link>
        </div>
        <Card>
          <CardContent className="p-8">
            <div className="text-center text-muted-foreground">
              読み込み中...
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  const { article, authorName, authorEmail } = data;

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-6">
        <Link
          href="/articles"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          記事一覧に戻る
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                  {article.title}
                </h1>
                <StatusBadge status={article.status} />
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-4">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{authorName || authorEmail}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>作成: {formatDate(article.createdAt)}</span>
                </div>
                {article.publishedAt && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>公開: {formatDate(article.publishedAt)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Link href={`/articles/${id}/edit`}>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
              </Link>
              <form action={deleteAction}>
                <Button
                  type="submit"
                  variant="destructive"
                  size="sm"
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {article.excerpt && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium text-muted-foreground mb-1">
                要約
              </p>
              <p className="text-foreground">{article.excerpt}</p>
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3">
              本文
            </p>
            <div className="prose dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-foreground">
                {article.content}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t text-xs text-muted-foreground">
            最終更新: {formatDate(article.updatedAt)}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
