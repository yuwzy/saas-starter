import { redirect, notFound } from 'next/navigation';
import { getUser, getUserWithTeam, getArticleById } from '@/lib/db/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArticleForm } from '@/components/articles/article-form';
import { updateArticleAction } from '../../actions';

export default async function EditArticlePage({
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
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Edit Article</CardTitle>
        </CardHeader>
        <CardContent>
          <ArticleForm
            action={updateArticleAction}
            initialData={{
              id: article.id,
              title: article.title,
              content: article.content,
              status: article.status,
            }}
            submitLabel="Update Article"
          />
        </CardContent>
      </Card>
    </div>
  );
}
