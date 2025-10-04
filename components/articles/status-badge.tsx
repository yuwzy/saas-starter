import { ArticleStatus } from '@/lib/db/schema';
import { cn } from '@/lib/utils';

type StatusBadgeProps = {
  status: string;
};

/**
 * 記事ステータス表示バッジコンポーネント
 */
export function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig = {
    [ArticleStatus.DRAFT]: {
      label: '下書き',
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
    },
    [ArticleStatus.PUBLISHED]: {
      label: '公開',
      className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    },
    [ArticleStatus.UNPUBLISHED]: {
      label: '非公開',
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
    },
  };

  const config = statusConfig[status as ArticleStatus] || statusConfig[ArticleStatus.DRAFT];

  return (
    <span
      className={cn(
        'px-2 py-1 text-xs font-medium rounded-md',
        config.className
      )}
      role="status"
      aria-label={`記事ステータス: ${config.label}`}
    >
      {config.label}
    </span>
  );
}
