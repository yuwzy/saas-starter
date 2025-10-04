import { ArticleForm } from '@/components/article-form';
import { getArticleById } from '@/lib/db/queries';
import { notFound } from 'next/navigation';

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await getArticleById(parseInt(id));

  if (!article) {
    notFound();
  }

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium mb-6">Edit Article</h1>
      <ArticleForm
        article={{
          id: article.id,
          title: article.title,
          slug: article.slug,
          content: article.content,
          excerpt: article.excerpt,
          status: article.status,
        }}
      />
    </section>
  );
}
