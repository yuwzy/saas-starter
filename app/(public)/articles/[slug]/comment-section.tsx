'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MessageSquare, Trash2, User } from 'lucide-react';

interface Comment {
  id: number;
  content: string;
  authorName: string | null;
  authorEmail: string | null;
  createdAt: string;
  user: {
    id: number;
    name: string | null;
    email: string;
  } | null;
}

interface CommentSectionProps {
  articleId: number;
  currentUser?: {
    id: number;
    name: string | null;
    email: string;
  } | null;
}


async function deleteComment(
  articleId: number,
  commentId: number
): Promise<boolean> {
  try {
    const response = await fetch(
      `/api/articles/${articleId}/comments/${commentId}`,
      {
        method: 'DELETE',
      }
    );

    return response.ok;
  } catch (error) {
    return false;
  }
}

export function CommentSection({
  articleId,
  currentUser,
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadComments() {
    try {
      const response = await fetch(`/api/articles/${articleId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error('コメントの読み込みに失敗しました:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);
    const content = formData.get('content')?.toString();
    const authorName = formData.get('authorName')?.toString();
    const authorEmail = formData.get('authorEmail')?.toString();

    if (!content || content.trim().length === 0) {
      setError('コメントを入力してください');
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`/api/articles/${articleId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          articleId,
          content: content.trim(),
          authorName: authorName?.trim() || undefined,
          authorEmail: authorEmail?.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'コメントの投稿に失敗しました');
        setSubmitting(false);
        return;
      }

      setSuccess('コメントを投稿しました');
      await loadComments();
      // フォームをリセット
      e.currentTarget.reset();
    } catch (error) {
      setError('コメントの投稿に失敗しました');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId: number) {
    if (!confirm('このコメントを削除しますか？')) {
      return;
    }

    const success = await deleteComment(articleId, commentId);
    if (success) {
      setComments(comments.filter((c) => c.id !== commentId));
    } else {
      alert('コメントの削除に失敗しました');
    }
  }

  return (
    <div className="mt-12 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            コメント ({comments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* コメント投稿フォーム */}
          <form
            id="comment-form"
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="content">コメント</Label>
              <Textarea
                id="content"
                name="content"
                placeholder="コメントを入力してください..."
                required
                rows={4}
                className="resize-none"
              />
            </div>
            {!currentUser && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="authorName">お名前</Label>
                  <Input
                    id="authorName"
                    name="authorName"
                    placeholder="お名前"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="authorEmail">メールアドレス</Label>
                  <Input
                    id="authorEmail"
                    name="authorEmail"
                    type="email"
                    placeholder="email@example.com"
                    required
                  />
                </div>
              </div>
            )}
            {error && (
              <div className="text-sm text-destructive">{error}</div>
            )}
            {success && (
              <div className="text-sm text-green-600 dark:text-green-400">
                {success}
              </div>
            )}
            <Button type="submit" disabled={submitting}>
              {submitting ? '投稿中...' : 'コメントを投稿'}
            </Button>
          </form>

          {/* コメント一覧 */}
          <div className="space-y-4 pt-6 border-t border-border">
            {loading ? (
              <div className="text-sm text-muted-foreground">
                コメントを読み込み中...
              </div>
            ) : comments.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                まだコメントがありません。最初のコメントを投稿してみませんか？
              </div>
            ) : (
              comments.map((comment) => {
                const authorName =
                  comment.user?.name ||
                  comment.authorName ||
                  comment.user?.email ||
                  comment.authorEmail ||
                  '匿名ユーザー';
                const isOwnComment =
                  currentUser && comment.user?.id === currentUser.id;

                return (
                  <div
                    key={comment.id}
                    className="flex gap-4 p-4 rounded-lg border border-border bg-card"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-medium text-foreground">
                            {authorName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleString('ja-JP', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                        {isOwnComment && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(comment.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="text-sm text-foreground whitespace-pre-wrap break-words">
                        {comment.content}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

