import {
  getArticleById,
  updateArticle,
  deleteArticle,
  getUser,
} from '@/lib/db/queries';
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const article = await getArticleById(parseInt(id));

  if (!article) {
    return Response.json({ error: 'Article not found' }, { status: 404 });
  }

  return Response.json(article);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const article = await getArticleById(parseInt(id));

  if (!article) {
    return Response.json({ error: 'Article not found' }, { status: 404 });
  }

  if (article.authorId !== user.id && user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { title, slug, content, excerpt, status } = body;

  const updateData: any = {};
  if (title) updateData.title = title;
  if (slug) updateData.slug = slug;
  if (content) updateData.content = content;
  if (excerpt !== undefined) updateData.excerpt = excerpt;
  if (status) {
    updateData.status = status;
    if (status === 'published' && !article.publishedAt) {
      updateData.publishedAt = new Date();
    }
  }

  await updateArticle(parseInt(id), updateData);

  return Response.json({ success: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const article = await getArticleById(parseInt(id));

  if (!article) {
    return Response.json({ error: 'Article not found' }, { status: 404 });
  }

  if (article.authorId !== user.id && user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  await deleteArticle(parseInt(id));

  return Response.json({ success: true });
}
