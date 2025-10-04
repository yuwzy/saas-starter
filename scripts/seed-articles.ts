/**
 * 記事管理機能のテストデータシードスクリプト
 */
import { db } from '../lib/db/drizzle';
import { categories, tags } from '../lib/db/schema';

async function seedArticleData() {
  console.log('Seeding article management test data...');

  try {
    // カテゴリデータを挿入
    const categoryData = [
      { name: 'テクノロジー', slug: 'technology' },
      { name: 'ビジネス', slug: 'business' },
      { name: 'デザイン', slug: 'design' },
      { name: 'マーケティング', slug: 'marketing' },
    ];

    console.log('Inserting categories...');
    await db.insert(categories).values(categoryData).onConflictDoNothing();
    console.log('✓ Categories inserted');

    // タグデータを挿入
    const tagData = [
      { name: 'Next.js', slug: 'nextjs' },
      { name: 'React', slug: 'react' },
      { name: 'TypeScript', slug: 'typescript' },
      { name: 'Node.js', slug: 'nodejs' },
      { name: 'データベース', slug: 'database' },
      { name: 'API', slug: 'api' },
      { name: 'UI/UX', slug: 'ui-ux' },
      { name: 'SEO', slug: 'seo' },
    ];

    console.log('Inserting tags...');
    await db.insert(tags).values(tagData).onConflictDoNothing();
    console.log('✓ Tags inserted');

    console.log('\nSeeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedArticleData();
