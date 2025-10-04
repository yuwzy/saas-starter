import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArticleForm } from '@/components/articles/article-form';
import { ArrowLeft } from 'lucide-react';

/**
 * 記事作成ページ
 */
export default function NewArticlePage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/articles">
            <ArrowLeft className="mr-2 h-4 w-4" />
            記事一覧に戻る
          </Link>
        </Button>
      </div>

      <h1 className="text-lg lg:text-2xl font-medium text-foreground mb-6">
        新規記事作成
      </h1>

      <ArticleForm mode="create" />
    </section>
  );
}
