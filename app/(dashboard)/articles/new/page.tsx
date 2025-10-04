'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup } from '@/components/ui/radio-group';
import { Loader2, ArrowLeft } from 'lucide-react';
import { createArticle } from '../actions';
import Link from 'next/link';

type ActionState = {
  error?: string;
  success?: string;
};

export default function NewArticlePage() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    createArticle,
    {}
  );

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

      <h1 className="text-lg lg:text-2xl font-medium text-foreground mb-6">
        新規記事作成
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>記事情報</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" action={formAction}>
            <div>
              <Label htmlFor="title" className="mb-2">
                タイトル <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                placeholder="記事のタイトルを入力"
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
                required
              />
            </div>

            <div>
              <Label className="mb-3 block">
                ステータス <span className="text-red-500">*</span>
              </Label>
              <RadioGroup defaultValue="draft" name="status">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="status-draft"
                    name="status"
                    value="draft"
                    defaultChecked
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
                    className="h-4 w-4"
                  />
                  <Label htmlFor="status-published" className="font-normal">
                    公開
                  </Label>
                </div>
              </RadioGroup>
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
                    作成中...
                  </>
                ) : (
                  '記事を作成'
                )}
              </Button>
              <Link href="/articles">
                <Button type="button" variant="outline">
                  キャンセル
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
