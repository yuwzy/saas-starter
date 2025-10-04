'use client';

import { useActionState, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Edit, Trash2 } from 'lucide-react';
import { createArticle, updateArticle, deleteArticle } from './actions';
import { Article } from '@/lib/db/schema';
import useSWR from 'swr';
import { Suspense } from 'react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type ActionState = {
  error?: string;
  success?: string;
  article?: Article;
};

type ArticleFormProps = {
  state: ActionState;
  article?: Article;
  onCancel?: () => void;
};

function ArticleForm({ state, article, onCancel }: ArticleFormProps) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      if (article) {
        formData.append('id', article.id.toString());
        await updateArticle(state, formData);
      } else {
        await createArticle(state, formData);
      }
      if (onCancel) onCancel();
    });
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title" className="mb-2">
          Title
        </Label>
        <Input
          id="title"
          name="title"
          placeholder="Enter article title"
          defaultValue={article?.title || ''}
          required
        />
      </div>
      <div>
        <Label htmlFor="content" className="mb-2">
          Content
        </Label>
        <textarea
          id="content"
          name="content"
          placeholder="Enter article content"
          defaultValue={article?.content || ''}
          className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
      <div>
        <Label htmlFor="status" className="mb-2">
          Status
        </Label>
        <select
          id="status"
          name="status"
          defaultValue={article?.status || 'draft'}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>
      {state.error && (
        <p className="text-red-500 text-sm">{state.error}</p>
      )}
      {state.success && (
        <p className="text-green-500 text-sm">{state.success}</p>
      )}
      <div className="flex gap-2">
        <Button
          type="submit"
          className="bg-orange-500 hover:bg-orange-600 text-white"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            article ? 'Update Article' : 'Create Article'
          )}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

function ArticleList() {
  const { data: articles, mutate } = useSWR<Article[]>('/api/articles', fetcher);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [createState, createFormAction] = useActionState<ActionState, FormData>(
    createArticle,
    {}
  );
  const [updateState, updateFormAction] = useActionState<ActionState, FormData>(
    updateArticle,
    {}
  );

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this article?')) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append('id', id.toString());
      const result = await deleteArticle({}, formData);
      if (result.success) {
        mutate();
      }
    });
  };

  const handleEdit = (article: Article) => {
    setEditingArticle(article);
    setShowCreateForm(false);
  };

  const handleCancelEdit = () => {
    setEditingArticle(null);
    mutate();
  };

  const handleCancelCreate = () => {
    setShowCreateForm(false);
    mutate();
  };

  if (!articles) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!showCreateForm && !editingArticle && (
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Article
        </Button>
      )}

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Article</CardTitle>
          </CardHeader>
          <CardContent>
            <ArticleForm state={createState} onCancel={handleCancelCreate} />
          </CardContent>
        </Card>
      )}

      {editingArticle && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Article</CardTitle>
          </CardHeader>
          <CardContent>
            <ArticleForm
              state={updateState}
              article={editingArticle}
              onCancel={handleCancelEdit}
            />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {articles.map((article) => (
          <Card key={article.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{article.title}</CardTitle>
                <div className="flex gap-2">
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      article.status === 'published'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {article.status}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 whitespace-pre-wrap">
                {article.content}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(article)}
                  disabled={isPending}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(article.id)}
                  disabled={isPending}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {articles.length === 0 && !showCreateForm && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <p className="text-muted-foreground mb-4">No articles yet</p>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Article
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function ArticlesPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-foreground mb-6">
        Article Management
      </h1>

      <Suspense
        fallback={
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <ArticleList />
      </Suspense>
    </section>
  );
}
