import { getArticleById } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Pencil } from 'lucide-react';

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await getArticleById(parseInt(id));

  if (!article) {
    notFound();
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-lg lg:text-2xl font-medium">Article Details</h1>
        <Link href={`/dashboard/articles/${article.id}/edit`}>
          <Button variant="outline">
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{article.title}</CardTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="capitalize">{article.status}</span>
            <span>•</span>
            <span>By {article.authorName || article.authorEmail}</span>
            <span>•</span>
            <span>
              {article.status === 'published'
                ? `Published ${formatDate(article.publishedAt)}`
                : `Created ${formatDate(article.createdAt)}`}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {article.excerpt && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm italic">{article.excerpt}</p>
            </div>
          )}
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <div className="whitespace-pre-wrap">{article.content}</div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
