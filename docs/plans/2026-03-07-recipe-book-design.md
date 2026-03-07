# Recipe Book — Design Document

**Date:** 2026-03-07
**Status:** Approved

## Overview

A personal recipe management web app where recipes are imported by pasting a URL (recipe site or Instagram). Stored recipes support dynamic serving size scaling and per-ingredient substitute lookup. Built for local use now, designed to be extensible to multi-user and cloud hosting later.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | SQLite via Prisma ORM (Postgres-ready via config swap) |
| Styling | Tailwind CSS |
| Testing | Vitest (unit/integration) + Playwright (E2E) |

---

## External Services

- **Recipe parsing (primary):** `@extractus/recipe-extractor` — scrapes schema.org JSON-LD from recipe pages (free, no API key)
- **Recipe parsing (fallback):** Spoonacular free tier — used when structured data is not found
- **Instagram scraping:** RapidAPI Instagram scraper (free tier) — fetches post caption and image, recipe data extracted from caption
- **Ingredient substitutes:** Spoonacular `/food/ingredients/{id}/substitutes` (free tier: 150 req/day)

---

## Data Model

### Recipe
- `id`, `title`, `description`, `sourceUrl`, `imageUrl`
- `defaultServings` — the serving count the original recipe is written for
- `steps` — ordered array of instruction strings
- `createdAt`
- relations: `ingredients[]`, `tags[]`

### Ingredient
- `id`, `recipeId`
- `name` — e.g. "flour"
- `quantity` — numeric value, e.g. `2`
- `unit` — e.g. "cups"
- `notes` — e.g. "sifted" (not scaled)
- `spoonacularId` — resolved on import for substitute lookups

### Tag
- `id`, `name`
- many-to-many with Recipe

---

## Key Features & User Flows

### 1. Import a Recipe
1. User pastes a URL into the import field
2. App detects Instagram URL vs regular recipe URL
3. **Instagram:** calls RapidAPI scraper, extracts recipe from caption text
4. **Regular URL:** tries `@extractus/recipe-extractor` first; falls back to Spoonacular analyze endpoint
5. Parsed data populates a review/edit form before saving
6. On save, Spoonacular ingredient IDs are resolved in the background

### 2. View a Recipe
- Displays title, source link, image, ingredients, and steps
- Serving size control (+/- or number input) at the top
- All ingredient quantities update instantly: `displayQty = originalQty × (desired / default)`
- No database writes — purely a display calculation

### 3. Ingredient Substitutes
- Each ingredient row has a "Substitutes" button
- Fetches from Spoonacular using the stored `spoonacularId`
- Displayed inline below the ingredient

### 4. Recipe Collection
- Grid/list view of all saved recipes with title and image
- Filter by tags
- Search by title

---

## Architecture Notes

- All third-party API calls are made from Next.js API routes (server-side) — API keys never exposed to the browser
- SQLite file lives in the project root locally; switching to Postgres requires only a Prisma `DATABASE_URL` change
- Designed single-user for now; multi-user would add a `User` model and auth (NextAuth) without restructuring the rest

---

## Testing Strategy

| Type | Tool | Coverage |
|---|---|---|
| Unit | Vitest | Serving scale calculation, ingredient parsing utilities |
| Integration | Vitest | API routes with test SQLite DB — import flow, CRUD |
| E2E | Playwright | Import recipe from URL, adjust servings, view substitutes |
