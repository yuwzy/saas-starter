import { redirect, notFound } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { getArticleById, getCategories, canUserModifyArticle } from '@/lib/db/articles-queries';
import { ArticleForm } from '../../article-form';

/**
 * 記事編集ページ
 */
export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();
  if (!user) {
    redirect('/sign-in');
  }

  const { id } = await params;
  const articleId = parseInt(id, 10);

  if (isNaN(articleId)) {
    notFound();
  }

  const [article, categories, canModify] = await Promise.all([
    getArticleById(articleId),
    getCategories(),
    canUserModifyArticle(articleId, user.id),
  ]);

  if (!article) {
    notFound();
  }

  if (!canModify) {
    redirect('/dashboard/articles');
  }

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-lg lg:text-2xl font-medium text-foreground mb-2">
            記事編集
          </h1>
          <p className="text-sm text-muted-foreground">
            記事の情報を編集してください
          </p>
        </div>

        <ArticleForm article={article} categories={categories} />
      </div>
    </section>
  );
}
