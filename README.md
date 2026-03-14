# Recipe Book

A personal recipe collection app. Import recipes from any URL or Instagram post, browse your collection, and find out what you can cook with what's in your kitchen.

## Quick start

```bash
git clone https://github.com/xcatza/recipeBook.git
cd recipeBook
cp .env.local.example .env.local   # fill in your API keys (see below)
npm run setup                       # install deps + run DB migrations
npm run dev                         # http://localhost:3001
```

## Environment variables

Copy `.env.local.example` to `.env.local` and fill in:

| Variable | Where to get it |
|----------|----------------|
| `SPOONACULAR_API_KEY` | [spoonacular.com/food-api](https://spoonacular.com/food-api) — free tier |
| `RAPIDAPI_KEY` | [rapidapi.com](https://rapidapi.com) — for Instagram scraping, free tier |

The database URL is already configured in `.env` — no changes needed there.

## What `npm run setup` does

1. `npm install` — installs dependencies
2. `prisma migrate deploy` — creates `dev.db` and applies all schema migrations
3. `prisma generate` — generates the Prisma client

Run it again any time you pull changes that include new migrations.

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server at http://localhost:3001 |
| `npm run setup` | First-time setup: install deps + init DB |
| `npm test` | Run unit and integration tests |
| `npm run test:e2e` | Run E2E tests (requires dev server running) |
| `npx prisma studio` | Browse the database in your browser |

## Features

- Import recipes from any website or Instagram post
- Browse your collection, filter by taste tags
- Edit tags and nutrition info on any recipe
- "What can I cook?" — enter what's in your kitchen, see recipes ranked by how many ingredients you already have
