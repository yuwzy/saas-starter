import { redirect, notFound } from 'next/navigation';
import { getUser, getUserWithTeam, getArticleById } from '@/lib/db/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DeleteArticleButton } from '@/components/articles/delete-article-button';
import Link from 'next/link';

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ articleId: string }>;
}) {
  const { articleId } = await params;
  const user = await getUser();

  if (!user) {
    redirect('/sign-in');
  }

  const userWithTeam = await getUserWithTeam(user.id);

  if (!userWithTeam?.teamId) {
    redirect('/dashboard');
  }

  const article = await getArticleById(parseInt(articleId), userWithTeam.teamId);

  if (!article) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <Link href="/articles">
            <Button variant="outline">← Back to Articles</Button>
          </Link>
          <div className="flex gap-2">
            <Link href={`/articles/${articleId}/edit`}>
              <Button variant="outline">Edit</Button>
            </Link>
            <DeleteArticleButton articleId={article.id} />
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="space-y-4">
              <CardTitle className="text-3xl">{article.title}</CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>By {article.authorName || 'Unknown'}</span>
                <span>•</span>
                <span className="capitalize">{article.status}</span>
                <span>•</span>
                <span>
                  Created {new Date(article.createdAt).toLocaleDateString()}
                </span>
                {article.updatedAt !== article.createdAt && (
                  <>
                    <span>•</span>
                    <span>
                      Updated {new Date(article.updatedAt).toLocaleDateString()}
                    </span>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-slate max-w-none">
              <div className="whitespace-pre-wrap">{article.content}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
