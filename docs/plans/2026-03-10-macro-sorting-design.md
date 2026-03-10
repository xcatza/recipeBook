# Macro Sorting Design

## Problem
Users want to sort their recipe collection by nutritional macros (calories, protein, carbs, fat, fibre, sugar, sodium) to support dietary goals.

## Decisions
- **Data source:** Spoonacular `POST /recipes/analyze` endpoint
- **Macros tracked:** calories, protein, carbs, fat, fibre, sugar, sodium (all per serving)
- **Filtering model:** Sort only (dropdown + direction toggle), no range sliders
- **Legacy recipes:** Show "Fetch nutrition" button on detail page to backfill on demand

## Data Model

New `Nutrition` table with 1:1 relation to `Recipe`:

```
Nutrition
  id         String  @id @default(cuid())
  recipeId   String  @unique (FK → Recipe, onDelete: Cascade)
  calories   Float?
  protein    Float?
  carbs      Float?
  fat        Float?
  fibre      Float?
  sugar      Float?
  sodium     Float?
```

All fields nullable to handle partial Spoonacular responses. No row = no data fetched yet.

## Spoonacular Integration

Two paths, same underlying function:

1. **At import time** — after `saveRecipe`, call Spoonacular analyze in background (non-blocking, like existing Spoonacular ID resolution). Store result in Nutrition table.
2. **Backfill on demand** — `POST /api/recipes/[id]/nutrition` endpoint. Same analyze call, stores result. Used by UI button on older recipes.

If API call fails or key is missing, recipe simply has no nutrition data.

## API Changes

- `GET /api/recipes` and `GET /api/recipes/[id]` — include `nutrition` relation in response. `nutrition: null` when no data exists.
- `POST /api/recipes/[id]/nutrition` — new endpoint for backfill.

Sorting is client-side. No server-side sort parameters needed.

## UI Changes

1. **Sort bar (home page)** — between header and grid. Dropdown for macro selection + High/Low toggle + Clear button. Editorial styling (uppercase labels, terracotta accents).
2. **Macro badge (RecipeCard)** — subtle line showing the active sort macro value (e.g. "32g protein"). Shows calories when no sort is active. Hidden when no nutrition data.
3. **Fetch nutrition button (RecipeDetail)** — shown when `nutrition` is null. Sage-colored button near serving control. Calls backfill endpoint, refreshes page.
