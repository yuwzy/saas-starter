'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import Link from 'next/link';
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  status: string;
  publishedAt: string | null;
  createdAt: string;
  authorName: string | null;
  authorEmail: string | null;
}

export default function ArticlesPage() {
  const router = useRouter();
  const { data: articles, mutate } = useSWR<Article[]>('/api/articles', fetcher);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this article?')) {
      return;
    }

    try {
      const response = await fetch(`/api/articles/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete article');
      }

      mutate();
    } catch (error) {
      console.error('Error deleting article:', error);
      alert('Failed to delete article');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-lg lg:text-2xl font-medium">Articles</h1>
        <Button onClick={() => router.push('/dashboard/articles/new')}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Article
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Articles</CardTitle>
        </CardHeader>
        <CardContent>
          {!articles ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : articles.length === 0 ? (
            <p className="text-muted-foreground">No articles yet.</p>
          ) : (
            <div className="space-y-4">
              {articles.map((article) => (
                <div
                  key={article.id}
                  className="flex items-start justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <Link
                      href={`/dashboard/articles/${article.id}`}
                      className="text-lg font-medium hover:underline"
                    >
                      {article.title}
                    </Link>
                    {article.excerpt && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {article.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="capitalize">{article.status}</span>
                      <span>•</span>
                      <span>
                        {article.status === 'published'
                          ? `Published ${formatDate(article.publishedAt)}`
                          : `Created ${formatDate(article.createdAt)}`}
                      </span>
                      <span>•</span>
                      <span>By {article.authorName || article.authorEmail}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(`/dashboard/articles/${article.id}/edit`)
                      }
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(article.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
