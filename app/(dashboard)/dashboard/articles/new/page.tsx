import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { getCategories } from '@/lib/db/articles-queries';
import { ArticleForm } from '../article-form';

/**
 * 記事作成ページ
 */
export default async function NewArticlePage() {
  const user = await getUser();
  if (!user) {
    redirect('/sign-in');
  }

  const categories = await getCategories();

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-lg lg:text-2xl font-medium text-foreground mb-2">
            新規記事作成
          </h1>
          <p className="text-sm text-muted-foreground">
            記事の情報を入力して作成してください
          </p>
        </div>

        <ArticleForm categories={categories} />
      </div>
    </section>
  );
}
