import { stripe } from '../payments/stripe';
import { db } from './drizzle';
import { users, teams, teamMembers, categories } from './schema';
import { hashPassword } from '@/lib/auth/session';

async function createStripeProducts() {
  console.log('Creating Stripe products and prices...');

  const baseProduct = await stripe.products.create({
    name: 'Base',
    description: 'Base subscription plan',
  });

  await stripe.prices.create({
    product: baseProduct.id,
    unit_amount: 800, // $8 in cents
    currency: 'usd',
    recurring: {
      interval: 'month',
      trial_period_days: 7,
    },
  });

  const plusProduct = await stripe.products.create({
    name: 'Plus',
    description: 'Plus subscription plan',
  });

  await stripe.prices.create({
    product: plusProduct.id,
    unit_amount: 1200, // $12 in cents
    currency: 'usd',
    recurring: {
      interval: 'month',
      trial_period_days: 7,
    },
  });

  console.log('Stripe products and prices created successfully.');
}

async function seed() {
  const email = 'test@test.com';
  const password = 'admin123';
  const passwordHash = await hashPassword(password);

  // 既存のユーザーをチェック
  let user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, email),
  });

  if (!user) {
    const [newUser] = await db
      .insert(users)
      .values([
        {
          email: email,
          passwordHash: passwordHash,
          role: 'owner',
        },
      ])
      .returning();
    user = newUser;
    console.log('Initial user created.');
  } else {
    console.log('User already exists.');
  }

  // 既存のチームをチェック
  let team = await db.query.teams.findFirst({
    where: (teams, { eq }) => eq(teams.name, 'Test Team'),
  });

  if (!team) {
    const [newTeam] = await db
      .insert(teams)
      .values({
        name: 'Test Team',
      })
      .returning();
    team = newTeam;

    await db.insert(teamMembers).values({
      teamId: team.id,
      userId: user.id,
      role: 'owner',
    });
    console.log('Team created.');
  } else {
    console.log('Team already exists.');
  }

  // 既存のカテゴリをチェック
  const existingCategories = await db.query.categories.findMany();

  if (existingCategories.length === 0) {
    await db.insert(categories).values([
      { name: 'テクノロジー', slug: 'technology' },
      { name: 'ビジネス', slug: 'business' },
      { name: 'ライフスタイル', slug: 'lifestyle' },
      { name: 'デザイン', slug: 'design' },
      { name: 'マーケティング', slug: 'marketing' },
    ]);
    console.log('Categories created.');
  } else {
    console.log('Categories already exist.');
  }

  await createStripeProducts();
}

seed()
  .catch((error) => {
    console.error('Seed process failed:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('Seed process finished. Exiting...');
    process.exit(0);
  });
