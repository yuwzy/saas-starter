import { db } from '@/lib/db/drizzle';
import { articles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';

type Article = {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  status: string;
  publishedAt: string | null;
  createdAt: string;
  author: {
    id: number;
    name: string | null;
    email: string;
  };
  articleCategories: Array<{
    category: {
      id: number;
      name: string;
      slug: string;
    };
  }>;
  articleTags: Array<{
    tag: {
      id: number;
      name: string;
      slug: string;
    };
  }>;
};

async function getArticle(slug: string): Promise<Article | null> {
  const result = await db.query.articles.findFirst({
    where: eq(articles.slug, slug),
    with: {
      author: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
      articleCategories: {
        with: {
          category: true,
        },
      },
      articleTags: {
        with: {
          tag: true,
        },
      },
    },
  });

  if (!result || result.status !== 'published') {
    return null;
  }

  return result as Article;
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <article>
          <header className="mb-8">
            <h1 className="text-4xl font-bold mb-4">{article.title}</h1>

            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <span>
                投稿者: {article.author.name || article.author.email}
              </span>
              <span>•</span>
              <time dateTime={article.publishedAt || article.createdAt}>
                {formatDate(article.publishedAt || article.createdAt)}
              </time>
            </div>

            {article.excerpt && (
              <p className="text-lg text-muted-foreground mb-4">
                {article.excerpt}
              </p>
            )}

            {(article.articleCategories.length > 0 ||
              article.articleTags.length > 0) && (
              <div className="flex flex-wrap gap-2">
                {article.articleCategories.map((ac) => (
                  <span
                    key={ac.category.id}
                    className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                  >
                    {ac.category.name}
                  </span>
                ))}
                {article.articleTags.map((at) => (
                  <span
                    key={at.tag.id}
                    className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-sm font-medium"
                  >
                    #{at.tag.name}
                  </span>
                ))}
              </div>
            )}
          </header>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            {article.content.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </article>
      </main>
    </div>
  );
}
