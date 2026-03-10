# CLAUDE.md

## Commands

- `npm run dev` — start dev server at http://localhost:3001
- `npm test` — run unit and integration tests (Vitest)
- `npm run test:e2e` — run E2E tests (Playwright, requires dev server)
- `npx prisma studio` — open database browser
- `npx prisma migrate dev --name <name>` — create a new migration

## Architecture

- **Framework:** Next.js 16 App Router
- **Database:** SQLite via Prisma 7 ORM (better-sqlite3 adapter)
- **Key files:**
  - `src/lib/prisma.ts` — Prisma client singleton
  - `src/lib/recipes.ts` — recipe CRUD service
  - `src/lib/scaling.ts` — serving size math (pure, no DB)
  - `src/lib/parsers/index.ts` — URL parsing orchestrator
  - `src/lib/parsers/recipe-extractor.ts` — JSON-LD schema.org scraper
  - `src/lib/parsers/spoonacular.ts` — Spoonacular API (parse fallback + substitutes)
  - `src/lib/parsers/instagram.ts` — Instagram caption scraper

## Environment Variables

Copy `.env.local.example` → `.env.local` and fill in:
- `SPOONACULAR_API_KEY` — https://spoonacular.com/food-api (free tier)
- `RAPIDAPI_KEY` — https://rapidapi.com (Instagram scraper, free tier)

Prisma reads `DATABASE_URL` from `.env` (not `.env.local`).

## Testing

- Unit: `tests/unit/`
- Integration: `tests/integration/` (uses dev.db)
- E2E: `tests/e2e/` (Playwright, requires dev server)
