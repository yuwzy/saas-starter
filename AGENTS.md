# Repository Guidelines

## Project Structure & Module Organization
- `app/` houses all Next.js route groups. `app/(dashboard)` contains authenticated dashboard UI and API routes; `app/(login)` handles auth flows; `app/api` exposes serverless endpoints.
- `components/` provides shared UI built with shadcn/ui primitives; keep new atoms and molecules near related feature folders.
- `lib/` encapsulates domain logic: `lib/db` for Drizzle models/migrations, `lib/auth` for session helpers, `lib/payments` for Stripe integrations. Keep business rules here instead of components.
- `.env.example` documents runtime settings. Use `docker-compose.yml` for local Postgres that matches `drizzle.config.ts`.

## Build, Test, and Development Commands
- `pnpm install` syncs dependencies; prefer pnpm for all scripts.
- `pnpm dev` runs Turbopack dev server at `localhost:3000`; `pnpm build` and `pnpm start` mirror production.
- Database lifecycle: `pnpm db:setup` scaffolds `.env`, `pnpm db:migrate` applies Drizzle migrations, `pnpm db:seed` loads starter data, `pnpm db:studio` opens the schema viewer. Start the containerised database with `docker compose up -d postgres`.
- Payments: use `stripe login` once and `stripe listen --forward-to localhost:3000/api/stripe/webhook` while developing billing flows.

## Coding Style & Naming Conventions
- TypeScript-first: keep components in `.tsx`, utilities in `.ts`. Use PascalCase for React components, kebab-case for route segments, and lower_snake_case for database columns.
- Follow existing 2-space indentation, single quotes, and Tailwind utility ordering used across `app/(dashboard)`. Co-locate component styles via classNames rather than separate CSS.
- Use typed Drizzle queries from `lib/db/queries.ts`; avoid ad-hoc SQL in components.

## Testing Guidelines
- Automated tests are not yet configured; manually verify features in `pnpm dev` before opening a PR.
- When adding tests, prefer colocated `*.test.ts(x)` files using Vitest or Playwright. Document any new command (e.g., `pnpm test`) in `package.json` and update this guide.

## Commit & Pull Request Guidelines
- Recent commits follow Conventional Commits (`chore(docker): …`, `fix: …`); continue that pattern for clarity and changelog tooling.
- Reference related issues, call out schema or seed changes, and include screenshots or Looms for UI updates. Note any `.env` additions and attach migration filenames from `lib/db/migrations`.

## Security & Configuration Tips
- Never commit secrets; derive local values via `pnpm db:setup` and keep production credentials in Vercel/Stripe dashboards.
- Regenerate `AUTH_SECRET` with `openssl rand -base64 32` when rotating keys and ensure `POSTGRES_URL` matches the running database before executing migrations.
