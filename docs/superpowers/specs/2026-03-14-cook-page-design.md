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

A new `IngredientAutocomplete` component (not `TagInput`) manages the pantry list:

- Text input that filters suggestions from `ingredientNames` as the user types (case-insensitive prefix/substring filter)
- Suggestions shown in a dropdown below the input; selecting one adds it as a pill chip
- Pill chips are removable (× button); a "Clear all" link resets the list
- No persistence — resets on each page visit

### Matching Algorithm

Pure client-side function in `src/lib/matching.ts`:

```
matchRecipes(recipes, pantry) → RankedRecipe[]
```

- **Normalization:** lowercase + trim both sides before comparing
- **Match:** an ingredient is matched if any pantry item is a substring of the ingredient name, or the ingredient name is a substring of the pantry item (bidirectional substring match)
- **Known limitation:** substring matching produces some false positives (e.g. "salt" matches "salted butter", "egg" matches "eggplant"). This is accepted behaviour for a personal app — no fuzzy disambiguation is needed.
- **Score:** `matchedCount / totalIngredients`
- **Ranking:** sorted by score descending; ties broken by recipe title alphabetically
- Returns all recipes regardless of score (even 0/n matches shown at the bottom)

### Results Display

- **Before any ingredients added:** prompt — "Add ingredients above to see what you can make"
- **After ingredients added:** results count label ("X recipes" — always all recipes, ranked by match score) + recipe grid

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
| `src/components/IngredientAutocomplete.tsx` | Client component | Text input + dropdown + pill chips for pantry list |
| `src/components/CookRecipeCard.tsx` | Client component | Recipe card with match badge and missing ingredients list |
| `src/lib/matching.ts` | Pure utility | `matchRecipes` function — no DB, no side effects |
| `src/app/page.tsx` | Modified | Add "What can I cook?" link, muted when no recipes |
| `src/lib/recipes.ts` | Modified | Add `getIngredientNames()` — returns unique ingredient name list |

#### Types

```typescript
// shared input/output types

type CookRecipe = {
  id: number
  title: string
  imageUrl: string | null
  ingredients: Array<{ name: string }>
}

type RankedRecipe = CookRecipe & {
  score: number           // matchedCount / totalIngredients (0–1)
  matchedCount: number
  totalIngredients: number
  missingIngredients: string[]  // ingredient.name values (original case) for unmatched ingredients
}
```

#### Component props

```typescript
// CookPage
type CookPageProps = {
  recipes: CookRecipe[]
  ingredientNames: string[]   // sorted a–z; may be empty if recipes have no ingredients stored
}

// IngredientAutocomplete
type IngredientAutocompleteProps = {
  allIngredients: string[]    // full suggestion pool
  pantry: string[]            // current selected items
  onChange: (pantry: string[]) => void
}

// CookRecipeCard
type CookRecipeCardProps = {
  recipe: RankedRecipe
}
```

#### `matchRecipes` signature

```typescript
// src/lib/matching.ts
export function matchRecipes(recipes: CookRecipe[], pantry: string[]): RankedRecipe[]
```

- `missingIngredients`: ingredient names (original case) for every ingredient that has no matching pantry item
- Shown for all recipes including 0-match ones
- If `pantry` is empty, all scores are 0; function still returns all recipes sorted alphabetically

#### `getIngredientNames()` implementation

```typescript
// src/lib/recipes.ts
export async function getIngredientNames(): Promise<string[]> {
  const rows = await prisma.ingredient.findMany({
    select: { name: true },
    distinct: ['name'],
    orderBy: { name: 'asc' },
  })
  return rows.map((r) => r.name)
}
```

If no ingredients are stored, returns `[]`; autocomplete shows no suggestions but the page still renders normally.

#### Home page recipe count

The existing `getRecipes()` call in `src/app/page.tsx` already fetches all recipes. The "What can I cook?" link is muted when `recipes.length === 0` — no additional query needed.

#### Error handling

If the server-side fetch in `src/app/cook/page.tsx` throws (Prisma error), allow it to propagate to Next.js — the default `error.tsx` boundary handles it.

#### "Clear all" styling

Render as a `<button type="button">` styled as a plain text link (no border, no background, `cursor: pointer`). This ensures keyboard accessibility.

### Out of Scope

- Persisting the ingredient list between sessions
- Fuzzy matching beyond substring (Spoonacular ID-based matching)
- Filtering by match threshold
- Shopping list generation
