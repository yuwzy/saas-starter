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

Server Actions live in `actions.ts` files alongside routes:
- **Form actions**: Use `validatedActionWithUser()` wrapper for forms with Zod validation
- **Inline actions**: Use `withTeam()` for actions needing team context
- **Return format**: `{ error?: string, success?: string }` for form state
- Example: [app/(dashboard)/dashboard/articles/actions.ts:1](app/(dashboard)/dashboard/articles/actions.ts#L1)

### Activity Logging

Use `ActivityType` enum ([lib/db/schema.ts:207](lib/db/schema.ts#L207)) for consistent audit events. Log user actions via `activity_logs` inserts in Server Actions.

## Code Style

- TypeScript strict mode, React 19 with Server Components default
- Use `'use client'` only when necessary (forms with `useActionState`, interactive UI)
- Database columns: `lower_snake_case`; TypeScript: `camelCase`; React: `PascalCase`
- Tailwind classes for styling (no CSS modules)
- Follow 2-space indentation, single quotes from existing files
- Import paths use `@/` alias for root

## Common Patterns

### Adding a new authenticated page

1. Create route in `app/(dashboard)/dashboard/your-page/page.tsx`
2. Use `getUser()` from queries to verify auth in Server Component
3. Add activity logging if needed
4. Create `actions.ts` for mutations using `validatedActionWithUser()`

### Adding a new database table

1. Define table/relations in [lib/db/schema.ts:1](lib/db/schema.ts#L1)
2. Run `pnpm db:generate` to create migration
3. Review migration SQL in `lib/db/migrations/`
4. Run `pnpm db:migrate` to apply
5. Add typed queries to [lib/db/queries.ts:1](lib/db/queries.ts#L1) or new query file
6. Update seed script if needed

### Server Action with validation

```typescript
export const yourAction = validatedActionWithUser(
  z.object({ field: z.string() }),
  async (data, formData, user) => {
    // Access validated data.field and user.id
    return { success: 'Done' };
  }
);
```

## Environment Variables

See `.env.example`. Required:
- `AUTH_SECRET`: Generate with `openssl rand -base64 32`
- `POSTGRES_URL`: Database connection string
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`: From Stripe dashboard
- `BASE_URL`: `http://localhost:3000` for dev

## Testing

No automated tests configured. Manually test in `pnpm dev`. Use Stripe test cards (4242 4242 4242 4242) for payments.
