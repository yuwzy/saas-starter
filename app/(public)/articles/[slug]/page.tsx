import { notFound } from 'next/navigation';
import {
  getArticleBySlug,
  canUserAccessArticle,
} from '@/lib/db/articles-queries';
import { getUser } from '@/lib/db/queries';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Tag, Lock } from 'lucide-react';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ slug: string }>;
};

/**
 * 記事詳細ページのメタデータ生成
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return {
      title: '記事が見つかりません',
    };
  }

  // 公開記事のみメタデータを生成
  if (article.status === 'published') {
    return {
      title: article.title,
      description: article.excerpt || article.content.slice(0, 160),
      openGraph: {
        title: article.title,
        description: article.excerpt || article.content.slice(0, 160),
        type: 'article',
        publishedTime: article.publishedAt?.toISOString(),
        authors: [article.author.name || article.author.email],
      },
    };
  }

  return {
    title: '非公開記事',
    robots: 'noindex, nofollow',
  };
}

/**
 * 記事詳細ページ
 */
export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  // 公開記事でない場合、チームメンバーかチェック
  if (article.status !== 'published') {
    const user = await getUser();

    if (!user) {
      // 未ログインユーザーには404を返す
      notFound();
    }

    const canAccess = await canUserAccessArticle(article.id, user.id);
    if (!canAccess) {
      notFound();
    }
  }

  return (
    <article className="max-w-4xl mx-auto px-4 py-8">
      {/* ヘッダー */}
      <header className="mb-8">
        {/* 非公開記事の警告 */}
        {article.status !== 'published' && (
          <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <Lock className="h-5 w-5" />
              <span className="font-medium">
                この記事は{article.status === 'draft' ? '下書き' : '非公開'}です
              </span>
            </div>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              チームメンバーのみ閲覧可能です
            </p>
          </div>
        )}

        <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
          {article.title}
        </h1>

        {article.excerpt && (
          <p className="text-lg text-muted-foreground mb-6">
            {article.excerpt}
          </p>
        )}

        {/* メタ情報 */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" aria-hidden="true" />
            <span>{article.author.name || article.author.email}</span>
          </div>
          {article.publishedAt && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" aria-hidden="true" />
              <time dateTime={article.publishedAt.toISOString()}>
                {new Date(article.publishedAt).toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            </div>
          )}
          {article.category && (
            <Badge variant="secondary">{article.category.name}</Badge>
          )}
        </div>

        {/* タグ */}
        {article.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <Tag className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            {article.tags.map((tag) => (
              <Badge key={tag.id} variant="outline">
                {tag.tagName}
              </Badge>
            ))}
          </div>
        )}
      </header>

      {/* 本文 */}
      <Card>
        <CardContent className="pt-6">
          <div
            className="prose prose-neutral dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{
              __html: article.content
                .split('\n')
                .map((line) => {
                  if (line.startsWith('# ')) {
                    return `<h1>${line.slice(2)}</h1>`;
                  }
                  if (line.startsWith('## ')) {
                    return `<h2>${line.slice(3)}</h2>`;
                  }
                  if (line.startsWith('### ')) {
                    return `<h3>${line.slice(4)}</h3>`;
                  }
                  if (line.trim() === '') {
                    return '<br>';
                  }
                  return `<p>${line}</p>`;
                })
                .join(''),
            }}
          />
        </CardContent>
      </Card>

      {/* フッター */}
      <footer className="mt-8 pt-8 border-t border-border">
        <p className="text-sm text-muted-foreground">
          最終更新:{' '}
          <time dateTime={article.updatedAt.toISOString()}>
            {new Date(article.updatedAt).toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
        </p>
      </footer>
    </article>
  );
}
