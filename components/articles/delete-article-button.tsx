'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { deleteArticleAction } from '@/app/(dashboard)/articles/actions';

export function DeleteArticleButton({ articleId }: { articleId: number }) {
  const [state, formAction, isPending] = useActionState(
    deleteArticleAction,
    {}
  );

  const handleDelete = (e: React.MouseEvent) => {
    if (!confirm('Are you sure you want to delete this article? This action cannot be undone.')) {
      e.preventDefault();
      return;
    }
  };

  return (
    <form action={formAction} onSubmit={handleDelete}>
      <input type="hidden" name="id" value={articleId} />
      <Button type="submit" variant="destructive" disabled={isPending}>
        {isPending ? 'Deleting...' : 'Delete'}
      </Button>
      {state?.error && (
        <p className="text-sm text-red-500 mt-2">{state.error}</p>
      )}
    </form>
  );
}
