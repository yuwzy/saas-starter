import { ArticleForm } from '@/components/article-form';

export default function NewArticlePage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium mb-6">Create New Article</h1>
      <ArticleForm />
    </section>
  );
}
