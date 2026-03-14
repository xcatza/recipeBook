# "What Can I Cook?" Page — Design Spec

**Date:** 2026-03-14

## Problem

Users have a collection of imported recipes but no easy way to figure out what they can actually cook right now based on what's in their kitchen.

## Goals

- Let users enter available ingredients and see which recipes they can make
- Rank partial matches by how many ingredients the user already has
- Show what's missing for incomplete matches
- Gracefully handle the empty state (no recipes imported yet)

## Design

### Navigation

A "What can I cook?" link is added to the home page header alongside the "Import Recipe" button.

- **No recipes imported:** link is muted (greyed text, no pointer cursor, no hover effect) with a `title` tooltip reading "Import recipes first"
- **Recipes exist:** active link navigating to `/cook`

### Page: `/cook`

Separate page with a stacked layout: ingredient input at the top, recipe results grid below.

**Server component** (`src/app/cook/page.tsx`):
- Fetches all recipes with their ingredients
- Fetches all unique ingredient names for autocomplete
- If no recipes: renders a simple empty-state message pointing to `/import`
- Passes data to `CookPage` client component

### Ingredient Input

- Autocomplete input: typing filters suggestions drawn from all unique ingredient names across imported recipes
- Selecting a suggestion adds it as a removable pill chip (same visual as tags)
- "Clear all" link resets the list
- No persistence — resets on each page visit

### Matching Algorithm

Pure client-side function in `src/lib/matching.ts`:

```
matchRecipes(recipes, pantry) → RankedRecipe[]
```

- **Normalization:** lowercase + trim both sides before comparing
- **Match:** an ingredient is matched if any pantry item is a substring of the ingredient name, or the ingredient name is a substring of the pantry item (bidirectional substring match)
- **Score:** `matchedCount / totalIngredients`
- **Ranking:** sorted by score descending; ties broken by recipe title alphabetically
- Returns all recipes regardless of score (even 0/n matches shown at the bottom)

### Results Display

- **Before any ingredients added:** prompt — "Add ingredients above to see what you can make"
- **After ingredients added:** results count label ("X recipes matched") + recipe grid

Each recipe card:
- Thumbnail + title
- Match badge: `"5/5 ✓"` (sage/green when 100%) or `"3/7"` (terracotta when partial)
- Missing ingredients: compact inline list below title for partial matches — "Missing: banana, sugar, baking soda"
- Clicking navigates to `/recipes/[id]`

### Components & Files

| File | Type | Responsibility |
|------|------|----------------|
| `src/app/cook/page.tsx` | Server component | Fetch data, render `CookPage` or empty state |
| `src/components/CookPage.tsx` | Client component | Ingredient state, autocomplete, matching, results grid |
| `src/lib/matching.ts` | Pure utility | `matchRecipes` function — no DB, no side effects |
| `src/app/page.tsx` | Modified | Add "What can I cook?" link, muted when no recipes |
| `src/lib/recipes.ts` | Modified | Add `getIngredientNames()` — returns unique ingredient name list |

### Out of Scope

- Persisting the ingredient list between sessions
- Fuzzy matching beyond substring (Spoonacular ID-based matching)
- Filtering by match threshold
- Shopping list generation
