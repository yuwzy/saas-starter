import Link from 'next/link';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Loader2 } from 'lucide-react';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { getArticles } from '@/lib/db/articles-queries';
import { redirect } from 'next/navigation';
import { ArticleList } from './article-list';

/**
 * 記事一覧の読み込み中表示
 */
function ArticleListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center justify-between p-4 border border-border rounded-lg animate-pulse"
        >
          <div className="flex-1">
            <div className="h-6 bg-muted rounded w-3/4 mb-2" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
          <div className="h-8 w-24 bg-muted rounded" />
        </div>
      ))}
    </div>
  );
}

/**
 * 記事一覧ページ
 */
export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; search?: string }>;
}) {
  const user = await getUser();
  if (!user) {
    redirect('/sign-in');
  }

  const team = await getTeamForUser();
  if (!team) {
    redirect('/dashboard');
  }

  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);
  const status = params.status;
  const search = params.search;

  const { articles, pagination } = await getArticles({
    page,
    limit: 10,
    teamId: team.id,
    status,
    search,
  });

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg lg:text-2xl font-medium text-foreground mb-2">
            記事管理
          </h1>
          <p className="text-sm text-muted-foreground">
            記事の作成・編集・削除を行えます
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/articles/new">
            <Plus className="h-4 w-4 mr-2" />
            新規作成
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            記事一覧
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<ArticleListSkeleton />}>
            <ArticleList
              articles={articles}
              pagination={pagination}
              currentStatus={status}
              currentSearch={search}
            />
          </Suspense>
        </CardContent>
      </Card>
    </section>
  );
}
