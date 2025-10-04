'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Article } from '@/lib/db/schema';
import useSWR, { mutate } from 'swr';
import { Suspense, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { PlusCircle, Pencil, Trash2, FileText } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function ArticlesSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Articles</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-muted rounded"></div>
          <div className="h-12 bg-muted rounded"></div>
          <div className="h-12 bg-muted rounded"></div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ArticleFormData {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  status: 'draft' | 'published';
}

function ArticleDialog({
  article,
  onSuccess
}: {
  article?: Article;
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ArticleFormData>({
    title: article?.title || '',
    slug: article?.slug || '',
    content: article?.content || '',
    excerpt: article?.excerpt || '',
    status: (article?.status as 'draft' | 'published') || 'draft'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = article
        ? `/api/articles/${article.id}`
        : '/api/articles';
      const method = article ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to save article');
      }

      mutate('/api/articles');
      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error('Error saving article:', error);
      alert('Failed to save article');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  };

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: generateSlug(title)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {article ? (
          <Button variant="ghost" size="sm">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Article
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {article ? 'Edit Article' : 'Create New Article'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, slug: e.target.value }))
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea
              id="excerpt"
              value={formData.excerpt}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, excerpt: e.target.value }))
              }
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, content: e.target.value }))
              }
              required
              rows={10}
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: 'draft' | 'published') =>
                setFormData((prev) => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : article ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ArticlesList() {
  const { data: articles, error } = useSWR<Article[]>('/api/articles', fetcher);

  const deleteArticle = async (id: number) => {
    if (!confirm('Are you sure you want to delete this article?')) return;

    try {
      const response = await fetch(`/api/articles/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete article');
      }

      mutate('/api/articles');
    } catch (error) {
      console.error('Error deleting article:', error);
      alert('Failed to delete article');
    }
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Articles</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Failed to load articles</p>
        </CardContent>
      </Card>
    );
  }

  if (!articles) {
    return <ArticlesSkeleton />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Articles</CardTitle>
            <CardDescription>
              Manage your team&apos;s articles
            </CardDescription>
          </div>
          <ArticleDialog onSuccess={() => mutate('/api/articles')} />
        </div>
      </CardHeader>
      <CardContent>
        {articles.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No articles yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Get started by creating your first article
            </p>
            <div className="mt-6">
              <ArticleDialog onSuccess={() => mutate('/api/articles')} />
            </div>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles.map((article) => (
                  <TableRow key={article.id}>
                    <TableCell className="font-medium">
                      {article.title}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {article.slug}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          article.status === 'published'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {article.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(article.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <ArticleDialog
                          article={article}
                          onSuccess={() => mutate('/api/articles')}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteArticle(article.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ArticlesPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium mb-6">
        Article Management
      </h1>
      <Suspense fallback={<ArticlesSkeleton />}>
        <ArticlesList />
      </Suspense>
    </section>
  );
}
