import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { ArticleList } from '@/components/articles/article-list';

/**
 * 記事一覧ページ
 */
export default function ArticlesPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-lg lg:text-2xl font-medium text-foreground">
          記事管理
        </h1>
        <Button asChild>
          <Link href="/dashboard/articles/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            新規作成
          </Link>
        </Button>
      </div>

      <Suspense fallback={<div>読み込み中...</div>}>
        <ArticleList />
      </Suspense>
    </section>
  );
}
