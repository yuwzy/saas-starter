import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArticleForm } from '@/components/articles/article-form';
import { getArticleById, getUser } from '@/lib/db/queries';
import { ArrowLeft } from 'lucide-react';

type EditArticlePageProps = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * 記事編集ページ
 */
export default async function EditArticlePage({ params }: EditArticlePageProps) {
  const { id } = await params;
  const articleId = parseInt(id, 10);

  if (isNaN(articleId)) {
    notFound();
  }

  const user = await getUser();
  if (!user) {
    redirect('/sign-in');
  }

  const article = await getArticleById(articleId);

  if (!article) {
    notFound();
  }

  // 作成者のみ編集可能
  if (article.userId !== user.id) {
    redirect('/dashboard/articles');
  }

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
        記事編集
      </h1>

      <ArticleForm mode="edit" article={article} />
    </section>
  );
}
