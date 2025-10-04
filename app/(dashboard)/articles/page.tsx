import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { getUserWithTeam } from '@/lib/db/queries';
import { getArticlesForTeam } from '@/lib/db/queries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default async function ArticlesPage() {
  const user = await getUser();

  if (!user) {
    redirect('/sign-in');
  }

  const userWithTeam = await getUserWithTeam(user.id);

  if (!userWithTeam?.teamId) {
    redirect('/dashboard');
  }

  const articles = await getArticlesForTeam(userWithTeam.teamId);

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Articles</h1>
        <Link href="/articles/new">
          <Button>Create Article</Button>
        </Link>
      </div>

      {articles.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No articles yet. Create your first article to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {articles.map((article) => (
            <Card key={article.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <Link href={`/articles/${article.id}`}>
                      <CardTitle className="hover:underline cursor-pointer">
                        {article.title}
                      </CardTitle>
                    </Link>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <span>{article.authorName || 'Unknown'}</span>
                      <span>•</span>
                      <span>{article.status}</span>
                      <span>•</span>
                      <span>
                        {new Date(article.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Link href={`/articles/${article.id}`}>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </Link>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
