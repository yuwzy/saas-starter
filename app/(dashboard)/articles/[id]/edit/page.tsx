'use client';

import { use } from 'react';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft } from 'lucide-react';
import { updateArticle } from '../../actions';
import Link from 'next/link';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type Article = {
  id: number;
  userId: number;
  teamId: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  status: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

type ArticleData = {
  article: Article;
  authorName: string | null;
  authorEmail: string | null;
};

type ActionState = {
  error?: string;
  success?: string;
};

function EditForm({
  articleId,
  article,
  state,
  formAction,
  isPending,
}: {
  articleId: string;
  article: Article;
  state: ActionState;
  formAction: (payload: FormData) => void;
  isPending: boolean;
}) {
  return (
    <form className="space-y-6" action={formAction}>
      <input type="hidden" name="id" value={articleId} />

      <div>
        <Label htmlFor="title" className="mb-2">
          タイトル <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          name="title"
          placeholder="記事のタイトルを入力"
          defaultValue={article.title}
          required
        />
      </div>

      <div>
        <Label htmlFor="excerpt" className="mb-2">
          要約
        </Label>
        <Textarea
          id="excerpt"
          name="excerpt"
          placeholder="記事の要約を入力（任意）"
          rows={3}
          maxLength={500}
          defaultValue={article.excerpt || ''}
        />
        <p className="text-xs text-muted-foreground mt-1">
          記事一覧に表示される要約文です（最大500文字）
        </p>
      </div>

      <div>
        <Label htmlFor="content" className="mb-2">
          本文 <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="content"
          name="content"
          placeholder="記事の本文を入力"
          rows={15}
          defaultValue={article.content}
          required
        />
      </div>

      <div>
        <Label className="mb-3 block">
          ステータス <span className="text-red-500">*</span>
        </Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="status-draft"
              name="status"
              value="draft"
              defaultChecked={article.status === 'draft'}
              className="h-4 w-4"
            />
            <Label htmlFor="status-draft" className="font-normal">
              下書き
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="status-published"
              name="status"
              value="published"
              defaultChecked={article.status === 'published'}
              className="h-4 w-4"
            />
            <Label htmlFor="status-published" className="font-normal">
              公開
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="status-archived"
              name="status"
              value="archived"
              defaultChecked={article.status === 'archived'}
              className="h-4 w-4"
            />
            <Label htmlFor="status-archived" className="font-normal">
              アーカイブ
            </Label>
          </div>
        </div>
      </div>

      {state.error && (
        <div className="p-3 rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400 text-sm">
            {state.error}
          </p>
        </div>
      )}

      {state.success && (
        <div className="p-3 rounded-md bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
          <p className="text-green-600 dark:text-green-400 text-sm">
            {state.success}
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="submit"
          className="bg-orange-500 hover:bg-orange-600 text-white"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              更新中...
            </>
          ) : (
            '変更を保存'
          )}
        </Button>
        <Link href={`/articles/${articleId}`}>
          <Button type="button" variant="outline">
            キャンセル
          </Button>
        </Link>
      </div>
    </form>
  );
}

export default function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, error, isLoading } = useSWR<ArticleData>(
    `/api/articles/${id}`,
    fetcher
  );

  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updateArticle,
    {}
  );

  if (error) {
    return (
      <section className="flex-1 p-4 lg:p-8">
        <div className="mb-6">
          <Link
            href="/articles"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            記事一覧に戻る
          </Link>
        </div>
        <Card>
          <CardContent className="p-8">
            <div className="text-red-500">
              エラーが発生しました: {error.message || '記事の取得に失敗しました'}
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (isLoading || !data) {
    return (
      <section className="flex-1 p-4 lg:p-8">
        <div className="mb-6">
          <Link
            href="/articles"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            記事一覧に戻る
          </Link>
        </div>
        <Card>
          <CardContent className="p-8">
            <div className="text-center text-muted-foreground">
              読み込み中...
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-6">
        <Link
          href={`/articles/${id}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          記事詳細に戻る
        </Link>
      </div>

      <h1 className="text-lg lg:text-2xl font-medium text-foreground mb-6">
        記事編集
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>記事情報</CardTitle>
        </CardHeader>
        <CardContent>
          <EditForm
            articleId={id}
            article={data.article}
            state={state}
            formAction={formAction}
            isPending={isPending}
          />
        </CardContent>
      </Card>
    </section>
  );
}
