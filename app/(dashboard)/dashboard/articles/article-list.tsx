'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Edit, Trash2, Eye, Search } from 'lucide-react';
import { deleteArticleAction } from './actions';
import { useRouter } from 'next/navigation';

type ArticleListProps = {
  articles: Array<{
    id: number;
    teamId: number;
    title: string;
    slug: string;
    status: string;
    publishedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    categoryName: string | null;
  }>;
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
  currentStatus?: string;
  currentSearch?: string;
};

/**
 * ステータスバッジコンポーネント
 */
function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, 'default' | 'success' | 'secondary'> = {
    published: 'success',
    draft: 'secondary',
    unpublished: 'default',
  };

  const labels: Record<string, string> = {
    published: '公開',
    draft: '下書き',
    unpublished: '非公開',
  };

  return (
    <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>
  );
}

/**
 * 記事一覧コンポーネント
 */
export function ArticleList({
  articles,
  pagination,
  currentStatus,
  currentSearch,
}: ArticleListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(currentSearch || '');
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  /**
   * 記事削除ハンドラー
   */
  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`「${title}」を削除しますか？この操作は取り消せません。`)) {
      return;
    }

    setIsDeleting(id);
    try {
      const result = await deleteArticleAction(id);
      if (result.error) {
        alert(result.error);
      } else {
        router.refresh();
      }
    } catch (error) {
      alert('記事の削除に失敗しました');
    } finally {
      setIsDeleting(null);
    }
  };

  /**
   * 検索ハンドラー
   */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (currentStatus) params.set('status', currentStatus);
    router.push(`/dashboard/articles?${params.toString()}`);
  };

  /**
   * ステータスフィルターハンドラー
   */
  const handleStatusFilter = (status: string) => {
    const params = new URLSearchParams();
    if (status !== 'all') params.set('status', status);
    if (searchQuery) params.set('search', searchQuery);
    router.push(`/dashboard/articles?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      {/* 検索とフィルター */}
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="記事を検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              aria-label="記事を検索"
            />
          </div>
        </form>
        <div className="flex gap-2">
          <Button
            variant={!currentStatus || currentStatus === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleStatusFilter('all')}
          >
            全て
          </Button>
          <Button
            variant={currentStatus === 'published' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleStatusFilter('published')}
          >
            公開
          </Button>
          <Button
            variant={currentStatus === 'draft' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleStatusFilter('draft')}
          >
            下書き
          </Button>
        </div>
      </div>

      {/* 記事一覧 */}
      {articles.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">記事がありません</p>
          <Button asChild>
            <Link href="/dashboard/articles/new">最初の記事を作成する</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {articles.map((article) => (
            <div
              key={article.id}
              className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-foreground truncate">
                    {article.title}
                  </h3>
                  <StatusBadge status={article.status} />
                  {article.categoryName && (
                    <Badge variant="outline">{article.categoryName}</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  作成日: {new Date(article.createdAt).toLocaleDateString('ja-JP')}
                  {article.publishedAt && (
                    <> | 公開日: {new Date(article.publishedAt).toLocaleDateString('ja-JP')}</>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                {article.status === 'published' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    aria-label="記事を表示"
                  >
                    <Link href={`/articles/${article.slug}`} target="_blank">
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  aria-label="記事を編集"
                >
                  <Link href={`/dashboard/articles/${article.id}/edit`}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(article.id, article.title)}
                  disabled={isDeleting === article.id}
                  aria-label="記事を削除"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ページネーション */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            {pagination.totalCount}件中 {(pagination.page - 1) * pagination.limit + 1}-
            {Math.min(pagination.page * pagination.limit, pagination.totalCount)}件を表示
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => {
                const params = new URLSearchParams();
                params.set('page', String(pagination.page - 1));
                if (currentStatus) params.set('status', currentStatus);
                if (searchQuery) params.set('search', searchQuery);
                router.push(`/dashboard/articles?${params.toString()}`);
              }}
            >
              前へ
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => {
                const params = new URLSearchParams();
                params.set('page', String(pagination.page + 1));
                if (currentStatus) params.set('status', currentStatus);
                if (searchQuery) params.set('search', searchQuery);
                router.push(`/dashboard/articles?${params.toString()}`);
              }}
            >
              次へ
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
