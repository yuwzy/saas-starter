# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Next.js 15 SaaS starter template with authentication, Stripe payments, team management, and dashboard UI. Uses App Router with route groups, Server Actions, and JWT-based sessions.

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development server (with Turbopack)
pnpm dev

# Build for production
pnpm build
pnpm start

# Database setup
docker compose up -d postgres          # Start local Postgres
pnpm db:setup                          # Create .env file
pnpm db:migrate                        # Run Drizzle migrations
pnpm db:seed                           # Seed with test user (test@test.com / admin123)
pnpm db:generate                       # Generate new migration from schema changes
pnpm db:studio                         # Open Drizzle Studio

# Stripe webhook testing (run alongside dev server)
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Architecture Principles

### API-First Design
- **All data mutations MUST go through API routes** (`app/api/*`)
- Server Actions should ONLY handle:
  - Form validation and submission
  - Calling API routes via `fetch()`
  - Client-side redirects (`redirect()`, `revalidatePath()`)
- **Direct database access from Server Actions is prohibited**
- API routes return standardized JSON responses with proper HTTP status codes

### Data Access Layer
- **All SQL queries MUST be abstracted in** `lib/db/queries.ts` or domain-specific query files (`lib/db/*-queries.ts`)
- **Never write raw SQL or direct `db.*` calls in:**
  - API routes (`app/api/*`)
  - Server Actions (`actions.ts`)
  - Page components
- Query functions must be typed with Drizzle schema types
- Use Drizzle's relational query syntax (`db.query.*`) over raw selects when fetching nested data

### Type Safety
- **Always use inferred types from Drizzle schema** (e.g., `User`, `NewUser`, `Article`)
- **Avoid `any` types** - use `unknown` and type guards if needed
- Use generics for reusable utility functions
- Export composite types for complex data structures (e.g., `TeamDataWithMembers`, `ArticleWithDetails`)
- Validate API request bodies with Zod schemas before processing

## Architecture

### Route Structure

- **`app/(login)/`**: Unauthenticated routes (`/sign-in`, `/sign-up`) with authentication forms
- **`app/(dashboard)/`**: Authenticated routes requiring session cookies, protected by global middleware
  - `/dashboard/*`: Main dashboard with settings, activity logs, team management, articles
  - `/pricing`: Stripe Checkout integration
- **`app/(public)/`**: Public marketing pages
- **`app/api/`**: Serverless API routes for Stripe webhooks, teams, users, articles, categories

### Authentication Flow

1. **Global middleware** ([middleware.ts:1](middleware.ts#L1)): Checks session cookie on all routes, redirects unauthenticated users from `/dashboard/*` to `/sign-in`. Auto-refreshes JWTs on GET requests.
2. **Session management** ([lib/auth/session.ts:1](lib/auth/session.ts#L1)): JWT tokens signed with `AUTH_SECRET`, stored in httpOnly cookies with 24h expiry. Use `getUser()` to retrieve current user in Server Components/Actions.
3. **Action middleware** ([lib/auth/middleware.ts:1](lib/auth/middleware.ts#L1)): Wrap Server Actions with:
   - `validatedAction()`: Validates Zod schema
   - `validatedActionWithUser()`: Validates + injects authenticated user
   - `withTeam()`: Injects current user's team with members

### Database Architecture

- **Schema** ([lib/db/schema.ts:1](lib/db/schema.ts#L1)): Core tables:
  - `users`: User accounts with password hashes, soft deletes via `deletedAt`
  - `teams`: Stripe customer/subscription IDs, plan details
  - `team_members`: Many-to-many with RBAC roles (owner/member)
  - `activity_logs`: Audit trail linked to teams and users
  - `invitations`: Pending team invites
  - `articles`, `categories`, `article_tags`: Content management system
- **Queries** ([lib/db/queries.ts:1](lib/db/queries.ts#L1)): Centralized typed queries. Always use these instead of inline queries:
  - `getUser()`: Current authenticated user from session
  - `getTeamForUser()`: User's team with members (relational query)
  - `getTeamByStripeCustomerId()`: For webhook processing
- **Relations**: Drizzle relational queries enabled via `relations()` exports. Use `db.query.*` syntax for nested fetches.

### Stripe Integration

- **Checkout flow**: Product/price IDs in pricing page → Stripe Checkout → webhook updates `teams` table
- **Webhooks** ([app/api/stripe/webhook/](app/api/stripe/webhook/)): Verify signature with `STRIPE_WEBHOOK_SECRET`, handle `checkout.session.completed` and `customer.subscription.*` events
- **Customer Portal**: Users manage subscriptions via Stripe-hosted portal, synced back via webhooks

### Server Actions Pattern

Server Actions live in `actions.ts` files alongside routes, but must follow API-first principles:
- **Form actions**: Use `validatedActionWithUser()` wrapper for Zod validation
- **Data flow**: Action validates → calls API route → returns response to client
- **Return format**: `{ error?: string, success?: string }` for form state
- **Never access database directly** - always use API routes for mutations
- Example pattern:
  ```typescript
  export const createArticle = validatedActionWithUser(
    articleSchema,
    async (data, formData, user) => {
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        return { error: 'Failed to create article' };
      }
      revalidatePath('/dashboard/articles');
      return { success: 'Article created' };
    }
  );
  ```

### Activity Logging

Use `ActivityType` enum ([lib/db/schema.ts:207](lib/db/schema.ts#L207)) for consistent audit events. Activity logs should be created in API routes (not Server Actions) using query functions from `lib/db/queries.ts`.

## Code Style

- TypeScript strict mode, React 19 with Server Components default
- Use `'use client'` only when necessary (forms with `useActionState`, interactive UI)
- Database columns: `lower_snake_case`; TypeScript: `camelCase`; React: `PascalCase`
- Tailwind classes for styling (no CSS modules)
- Follow 2-space indentation, single quotes from existing files
- Import paths use `@/` alias for root

## Common Patterns

### Adding a new feature with data mutations

1. **Define schema types** in [lib/db/schema.ts:1](lib/db/schema.ts#L1) and run `pnpm db:generate && pnpm db:migrate`
2. **Create query functions** in `lib/db/queries.ts` or `lib/db/[feature]-queries.ts`:
   ```typescript
   export async function getArticles(teamId: number): Promise<ArticleWithDetails[]> {
     return await db.query.articles.findMany({
       where: eq(articles.teamId, teamId),
       with: { author: true, category: true, tags: true }
     });
   }
   ```
3. **Create API route** in `app/api/[feature]/route.ts`:
   ```typescript
   export async function POST(request: Request) {
     const user = await getUser();
     if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

     const body = await request.json();
     const validated = schema.safeParse(body);
     if (!validated.success) {
       return NextResponse.json({ error: validated.error }, { status: 400 });
     }

     const result = await createArticle(validated.data); // query function
     return NextResponse.json(result, { status: 201 });
   }
   ```
4. **Create Server Action** in `actions.ts` that calls the API route
5. **Create UI page** in `app/(dashboard)/dashboard/[feature]/page.tsx` using `getUser()` for read operations

### Adding a new authenticated page

1. Create route in `app/(dashboard)/dashboard/your-page/page.tsx`
2. Use `getUser()` from queries to verify auth in Server Component
3. For read-only data, call query functions directly in Server Components
4. For mutations, create Server Actions that call API routes

### Adding a new database table

1. Define table/relations in [lib/db/schema.ts:1](lib/db/schema.ts#L1)
2. Run `pnpm db:generate` to create migration
3. Review migration SQL in `lib/db/migrations/`
4. Run `pnpm db:migrate` to apply
5. Add typed queries to [lib/db/queries.ts:1](lib/db/queries.ts#L1) or new query file
6. Update seed script if needed

### Data Flow Summary

```
User Form Submission
  ↓
Server Action (validates with Zod)
  ↓
API Route (receives validated data)
  ↓
Query Function in lib/db/queries.ts (executes SQL)
  ↓
Database
```

**Read operations (Server Components):**
```
Server Component → Query Function → Database
```

**Write operations (forms):**
```
Client Form → Server Action → API Route → Query Function → Database
```

## Environment Variables

See `.env.example`. Required:
- `AUTH_SECRET`: Generate with `openssl rand -base64 32`
- `POSTGRES_URL`: Database connection string
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`: From Stripe dashboard
- `BASE_URL`: `http://localhost:3000` for dev

## Authorization Rules

### Team-based Access Control for Articles

All articles belong to a team and have access control based on team membership and publication status.

#### Access Rules

**Public articles (status: 'published'):**
- Can be viewed by anyone (authenticated or not)
- No team membership check required

**Draft/private articles (status: 'draft' or other non-published statuses):**
- Can only be accessed by team members
- Requires team membership verification

#### Operations and Required Permissions

| Operation | Requirement | Check Function |
|-----------|------------|----------------|
| Create article | Team membership | User must be member of target team |
| Update article | Team membership | `canUserModifyArticle()` |
| Delete article | Team membership | `canUserModifyArticle()` |
| View draft/private article | Team membership | `canUserAccessArticle()` |
| View published article | None | Public access |

#### Implementation Pattern

**For mutations (create/update/delete):**
```typescript
// API Route: Check team membership before modification
const user = await getUser();
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

const canModify = await canUserModifyArticle(articleId, user.id);
if (!canModify) {
  return NextResponse.json({ error: 'No permission' }, { status: 403 });
}
```

**For viewing non-public articles:**
```typescript
// API Route: Check access for draft/private articles
const user = await getUser();
const article = await getArticleById(articleId);

// Public articles are accessible to everyone
if (article.status === 'published') {
  return NextResponse.json(article);
}

// Draft/private articles require team membership
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

const canAccess = await canUserAccessArticle(articleId, user.id);
if (!canAccess) {
  return NextResponse.json({ error: 'No permission' }, { status: 403 });
}
```

**For listing articles:**
```typescript
// Query function: Filter by team or public status
const result = await getArticles({
  teamId: user ? teamId : undefined,  // Filter by team for members
  includePublicOnly: !user,           // Public only for unauthenticated users
  // ... other filters
});
```

#### Key Query Functions

Located in [lib/db/articles-queries.ts](lib/db/articles-queries.ts):

- **`canUserAccessArticle(articleId, userId)`**: Returns `true` if user can view the article (published = everyone, draft = team members only)
- **`canUserModifyArticle(articleId, userId)`**: Returns `true` if user can edit/delete the article (team members only)
- **`getArticles(options)`**: Supports filtering by `teamId` and `includePublicOnly` for proper access control

#### Schema Fields

All articles have these required fields for authorization ([lib/db/schema.ts:132](lib/db/schema.ts#L132)):
- `teamId`: Links article to owning team (required, foreign key)
- `userId`: Links article to author (required, foreign key)
- `status`: Publication status ('draft', 'published', etc.)

## Testing

No automated tests configured. Manually test in `pnpm dev`. Use Stripe test cards (4242 4242 4242 4242) for payments.
