# Macro Sorting Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Sort recipes by nutritional macros (calories, protein, carbs, fat, fibre, sugar, sodium) fetched from Spoonacular.

**Architecture:** New `Nutrition` model with 1:1 relation to `Recipe`. Spoonacular `POST /recipes/analyze` called at import time (background) and on-demand for backfill. Client-side sorting via state in the home page.

**Tech Stack:** Prisma 7 (SQLite), Spoonacular API, Next.js 16 App Router, React client components.

---

### Task 1: Prisma Schema — Add Nutrition Model

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add Nutrition model to schema**

Add after the `Recipe` model:

```prisma
model Nutrition {
  id       String @id @default(cuid())
  recipeId String @unique
  recipe   Recipe @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  calories Float?
  protein  Float?
  carbs    Float?
  fat      Float?
  fibre    Float?
  sugar    Float?
  sodium   Float?
}
```

Add to the `Recipe` model:

```prisma
  nutrition   Nutrition?
```

**Step 2: Run migration**

Run: `npx prisma migrate dev --name add-nutrition`
Expected: Migration applied, client regenerated.

**Step 3: Verify generated client**

Run: `grep -r "calories" src/generated/prisma/models/Nutrition.ts | head -3`
Expected: Shows `calories: Float?` fields.

**Step 4: Commit**

```bash
git add prisma/ src/generated/
git commit -m "feat: add Nutrition model to Prisma schema"
```

---

### Task 2: Spoonacular Nutrition Fetcher

**Files:**
- Modify: `src/lib/parsers/spoonacular.ts`
- Test: `tests/unit/spoonacular-nutrition.test.ts`

**Step 1: Write the failing test**

Create `tests/unit/spoonacular-nutrition.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock global fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Must set env before importing
vi.stubEnv('SPOONACULAR_API_KEY', 'test-key')

import { analyzeNutrition } from '@/lib/parsers/spoonacular'

describe('analyzeNutrition', () => {
  beforeEach(() => { mockFetch.mockReset() })

  it('parses nutrition from Spoonacular response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        nutrition: {
          nutrients: [
            { name: 'Calories', amount: 450, unit: 'kcal' },
            { name: 'Protein', amount: 32, unit: 'g' },
            { name: 'Carbohydrates', amount: 55, unit: 'g' },
            { name: 'Fat', amount: 12, unit: 'g' },
            { name: 'Fiber', amount: 8, unit: 'g' },
            { name: 'Sugar', amount: 6, unit: 'g' },
            { name: 'Sodium', amount: 400, unit: 'mg' },
          ],
        },
      }),
    })

    const result = await analyzeNutrition('Test Recipe', [
      { name: 'chicken', quantity: 200, unit: 'g' },
    ], 2)

    expect(result).toEqual({
      calories: 450,
      protein: 32,
      carbs: 55,
      fat: 12,
      fibre: 8,
      sugar: 6,
      sodium: 400,
    })
    expect(mockFetch).toHaveBeenCalledOnce()
    expect(mockFetch.mock.calls[0][0]).toContain('/recipes/analyze')
  })

  it('returns null on API failure', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false })
    const result = await analyzeNutrition('Fail', [], 1)
    expect(result).toBeNull()
  })

  it('returns null when API key is missing', async () => {
    vi.stubEnv('SPOONACULAR_API_KEY', '')
    const { analyzeNutrition: freshFn } = await import('@/lib/parsers/spoonacular')
    // Key check throws, caught internally → null
    mockFetch.mockRejectedValueOnce(new Error('should not be called'))
    const result = await freshFn('No Key', [], 1)
    expect(result).toBeNull()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/spoonacular-nutrition.test.ts`
Expected: FAIL — `analyzeNutrition` is not exported.

**Step 3: Implement analyzeNutrition**

Add to `src/lib/parsers/spoonacular.ts`:

```typescript
export type NutritionData = {
  calories: number | null
  protein: number | null
  carbs: number | null
  fat: number | null
  fibre: number | null
  sugar: number | null
  sodium: number | null
}

export async function analyzeNutrition(
  title: string,
  ingredients: Array<{ name: string; quantity: number | null; unit: string | null }>,
  servings: number
): Promise<NutritionData | null> {
  try {
    const ingredientList = ingredients
      .map((i) => `${i.quantity ?? ''} ${i.unit ?? ''} ${i.name}`.trim())
      .join('\n')

    const res = await fetch(`${BASE}/recipes/analyze?apiKey=${key()}&includeNutrition=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, ingredients: ingredientList, servings }),
    })
    if (!res.ok) return null
    const data = await res.json()

    const nutrients: Array<{ name: string; amount: number }> = data.nutrition?.nutrients ?? []
    const find = (n: string) => nutrients.find((x) => x.name === n)?.amount ?? null

    return {
      calories: find('Calories'),
      protein: find('Protein'),
      carbs: find('Carbohydrates'),
      fat: find('Fat'),
      fibre: find('Fiber'),
      sugar: find('Sugar'),
      sodium: find('Sodium'),
    }
  } catch {
    return null
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/spoonacular-nutrition.test.ts`
Expected: 3 tests PASS.

**Step 5: Commit**

```bash
git add src/lib/parsers/spoonacular.ts tests/unit/spoonacular-nutrition.test.ts
git commit -m "feat: add Spoonacular nutrition analyzer"
```

---

### Task 3: Service Layer — Store & Fetch Nutrition

**Files:**
- Modify: `src/lib/recipes.ts`
- Modify: `tests/integration/recipes.test.ts`

**Step 1: Write the failing integration test**

Add to `tests/integration/recipes.test.ts`:

```typescript
it('stores and retrieves nutrition data', async () => {
  const saved = await saveRecipe({ ...testRecipe, sourceUrl: 'https://nutrition.com' })
  expect(saved.nutrition).toBeNull()

  // Simulate storing nutrition
  const { storeNutrition } = await import('@/lib/recipes')
  const updated = await storeNutrition(saved.id, {
    calories: 450, protein: 32, carbs: 55, fat: 12, fibre: 8, sugar: 6, sodium: 400,
  })
  expect(updated.nutrition?.calories).toBe(450)
  expect(updated.nutrition?.protein).toBe(32)

  // Verify getRecipe includes nutrition
  const retrieved = await getRecipe(saved.id)
  expect(retrieved?.nutrition?.calories).toBe(450)

  // Verify getRecipes includes nutrition
  const all = await getRecipes()
  const found = all.find((r: any) => r.id === saved.id)
  expect(found?.nutrition?.calories).toBe(450)
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/integration/recipes.test.ts`
Expected: FAIL — `storeNutrition` not exported, `nutrition` not included in queries.

**Step 3: Update recipes.ts**

In `src/lib/recipes.ts`:

1. Add `nutrition` to all `include` blocks: `include: { ingredients: true, tags: { include: { tag: true } }, nutrition: true }`

2. Add `storeNutrition` function:

```typescript
export async function storeNutrition(recipeId: string, data: {
  calories: number | null; protein: number | null; carbs: number | null
  fat: number | null; fibre: number | null; sugar: number | null; sodium: number | null
}) {
  await prisma.nutrition.upsert({
    where: { recipeId },
    create: { recipeId, ...data },
    update: data,
  })
  const recipe = await prisma.recipe.findUniqueOrThrow({
    where: { id: recipeId },
    include: { ingredients: true, tags: { include: { tag: true } }, nutrition: true },
  })
  return serialize(recipe)
}
```

3. Update `serialize` to include nutrition:

```typescript
function serialize(recipe: any) {
  return {
    ...recipe,
    steps: JSON.parse(recipe.steps) as string[],
    tags: recipe.tags.map((t: any) => t.tag.name),
    nutrition: recipe.nutrition
      ? {
          calories: recipe.nutrition.calories,
          protein: recipe.nutrition.protein,
          carbs: recipe.nutrition.carbs,
          fat: recipe.nutrition.fat,
          fibre: recipe.nutrition.fibre,
          sugar: recipe.nutrition.sugar,
          sodium: recipe.nutrition.sodium,
        }
      : null,
  }
}
```

**Step 4: Update afterEach cleanup**

Add `await prisma.nutrition.deleteMany()` before recipe deletion in `afterEach`.

**Step 5: Run test to verify it passes**

Run: `npx vitest run tests/integration/recipes.test.ts`
Expected: 4 tests PASS.

**Step 6: Commit**

```bash
git add src/lib/recipes.ts tests/integration/recipes.test.ts
git commit -m "feat: add nutrition storage and retrieval to recipe service"
```

---

### Task 4: Background Nutrition Fetch at Import Time

**Files:**
- Modify: `src/lib/recipes.ts`

**Step 1: Add background nutrition fetch to saveRecipe**

After the existing `resolveSpoonacularIds` call in `saveRecipe`, add:

```typescript
// Fetch nutrition in background — non-blocking
fetchAndStoreNutrition(recipe.id, parsed).catch(console.error)
```

Add the helper function:

```typescript
async function fetchAndStoreNutrition(recipeId: string, parsed: ParsedRecipe) {
  const { analyzeNutrition } = await import('./parsers/spoonacular')
  const nutrition = await analyzeNutrition(parsed.title, parsed.ingredients, parsed.defaultServings)
  if (nutrition) await storeNutrition(recipeId, nutrition)
}
```

**Step 2: Run all tests**

Run: `npx vitest run`
Expected: All tests PASS (existing tests mock Spoonacular).

**Step 3: Commit**

```bash
git add src/lib/recipes.ts
git commit -m "feat: fetch nutrition from Spoonacular at import time"
```

---

### Task 5: Backfill API Route

**Files:**
- Create: `src/app/api/recipes/[id]/nutrition/route.ts`

**Step 1: Create the route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getRecipe, storeNutrition } from '@/lib/recipes'
import { analyzeNutrition } from '@/lib/parsers/spoonacular'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const recipe = await getRecipe(id)
  if (!recipe) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const nutrition = await analyzeNutrition(
    recipe.title,
    recipe.ingredients.map((i) => ({ name: i.name, quantity: i.quantity, unit: i.unit })),
    recipe.defaultServings
  )
  if (!nutrition) return NextResponse.json({ error: 'Could not fetch nutrition data' }, { status: 502 })

  const updated = await storeNutrition(id, nutrition)
  return NextResponse.json(updated.nutrition)
}
```

**Step 2: Run build**

Run: `npx next build 2>&1 | tail -15`
Expected: Compiles, new route visible in route list.

**Step 3: Commit**

```bash
git add src/app/api/recipes/[id]/nutrition/
git commit -m "feat: add nutrition backfill API route"
```

---

### Task 6: Home Page — Sort Bar

**Files:**
- Modify: `src/app/page.tsx` (convert to client component wrapper)
- Create: `src/components/SortBar.tsx`
- Create: `src/components/RecipeCollection.tsx`

The home page is currently a server component. Sorting is client-side state, so we need a client component wrapper that receives the server-fetched recipes.

**Step 1: Create SortBar component**

Create `src/components/SortBar.tsx`:

```typescript
'use client'

export type MacroKey = 'calories' | 'protein' | 'carbs' | 'fat' | 'fibre' | 'sugar' | 'sodium'
export type SortDirection = 'desc' | 'asc'
export type SortState = { macro: MacroKey; direction: SortDirection } | null

const MACROS: { key: MacroKey; label: string }[] = [
  { key: 'calories', label: 'Calories' },
  { key: 'protein', label: 'Protein' },
  { key: 'carbs', label: 'Carbs' },
  { key: 'fat', label: 'Fat' },
  { key: 'fibre', label: 'Fibre' },
  { key: 'sugar', label: 'Sugar' },
  { key: 'sodium', label: 'Sodium' },
]

export function SortBar({ sort, onChange }: { sort: SortState; onChange: (s: SortState) => void }) {
  return (
    <div
      className="flex items-center gap-3 flex-wrap py-4 mb-8"
      style={{ borderBottom: '1px solid var(--color-border)' }}
    >
      <span
        className="text-xs tracking-wide uppercase shrink-0"
        style={{ color: 'var(--color-ink-muted)', fontWeight: 600, letterSpacing: '0.1em' }}
      >
        Sort by
      </span>
      <div className="flex items-center gap-1.5 flex-wrap">
        {MACROS.map(({ key, label }) => {
          const isActive = sort?.macro === key
          return (
            <button
              key={key}
              onClick={() => {
                if (!isActive) {
                  onChange({ macro: key, direction: 'desc' })
                } else if (sort.direction === 'desc') {
                  onChange({ macro: key, direction: 'asc' })
                } else {
                  onChange(null)
                }
              }}
              className="text-xs px-2.5 py-1 transition-all duration-200"
              style={{
                borderRadius: '2px',
                fontWeight: 500,
                background: isActive ? 'var(--color-terracotta)' : 'transparent',
                color: isActive ? 'var(--color-warm-white)' : 'var(--color-ink-muted)',
                border: isActive ? '1px solid var(--color-terracotta)' : '1px solid var(--color-border)',
              }}
            >
              {label}
              {isActive && (sort.direction === 'desc' ? ' ↓' : ' ↑')}
            </button>
          )
        })}
      </div>
      {sort && (
        <button
          onClick={() => onChange(null)}
          className="text-xs ml-auto transition-colors duration-200"
          style={{ color: 'var(--color-ink-muted)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-terracotta)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-ink-muted)'}
        >
          Clear
        </button>
      )}
    </div>
  )
}
```

**Step 2: Create RecipeCollection wrapper**

Create `src/components/RecipeCollection.tsx`:

```typescript
'use client'
import { useState } from 'react'
import { RecipeGrid } from './RecipeGrid'
import { SortBar, type SortState } from './SortBar'

type Nutrition = {
  calories: number | null; protein: number | null; carbs: number | null
  fat: number | null; fibre: number | null; sugar: number | null; sodium: number | null
} | null

type Recipe = {
  id: string; title: string; imageUrl: string | null
  defaultServings: number; tags: string[]; nutrition: Nutrition
}

export function RecipeCollection({ recipes }: { recipes: Recipe[] }) {
  const [sort, setSort] = useState<SortState>(null)

  const sorted = sort
    ? [...recipes].sort((a, b) => {
        const aVal = a.nutrition?.[sort.macro] ?? null
        const bVal = b.nutrition?.[sort.macro] ?? null
        // nulls always go to the end
        if (aVal === null && bVal === null) return 0
        if (aVal === null) return 1
        if (bVal === null) return -1
        return sort.direction === 'desc' ? bVal - aVal : aVal - bVal
      })
    : recipes

  return (
    <>
      {recipes.length > 1 && <SortBar sort={sort} onChange={setSort} />}
      <RecipeGrid recipes={sorted} activeMacro={sort?.macro ?? null} />
    </>
  )
}
```

**Step 3: Update page.tsx**

Replace `<RecipeGrid recipes={recipes} />` with `<RecipeCollection recipes={recipes} />`. Add the import.

**Step 4: Run build**

Run: `npx next build 2>&1 | tail -15`
Expected: Compiles clean.

**Step 5: Commit**

```bash
git add src/components/SortBar.tsx src/components/RecipeCollection.tsx src/app/page.tsx
git commit -m "feat: add macro sort bar to home page"
```

---

### Task 7: RecipeCard — Macro Badge

**Files:**
- Modify: `src/components/RecipeCard.tsx`
- Modify: `src/components/RecipeGrid.tsx`

**Step 1: Update RecipeGrid to pass activeMacro and nutrition**

Update the `Recipe` type in `RecipeGrid` to include `nutrition`, and pass `activeMacro` through:

```typescript
import { RecipeCard } from './RecipeCard'

type Nutrition = {
  calories: number | null; protein: number | null; carbs: number | null
  fat: number | null; fibre: number | null; sugar: number | null; sodium: number | null
} | null

type Recipe = { id: string; title: string; imageUrl: string | null; defaultServings: number; tags: string[]; nutrition: Nutrition }

export function RecipeGrid({ recipes, activeMacro }: { recipes: Recipe[]; activeMacro: string | null }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10 stagger-children">
      {recipes.map((r) => <RecipeCard key={r.id} {...r} activeMacro={activeMacro} />)}
    </div>
  )
}
```

**Step 2: Update RecipeCard to show macro badge**

Add `nutrition` and `activeMacro` to Props. After the "Serves X" line, add:

```typescript
{nutrition && (() => {
  const macro = (activeMacro ?? 'calories') as keyof typeof nutrition
  const value = nutrition[macro]
  if (value === null) return null
  const unit = macro === 'calories' ? 'kcal' : macro === 'sodium' ? 'mg' : 'g'
  const label = macro.charAt(0).toUpperCase() + macro.slice(1)
  return (
    <p
      className="text-xs mt-0.5 tracking-wide"
      style={{ color: 'var(--color-terracotta)', fontWeight: 500, letterSpacing: '0.03em' }}
    >
      {Math.round(value)}{unit} {label}
    </p>
  )
})()}
```

**Step 3: Run build**

Run: `npx next build 2>&1 | tail -15`
Expected: Compiles clean.

**Step 4: Commit**

```bash
git add src/components/RecipeCard.tsx src/components/RecipeGrid.tsx
git commit -m "feat: show macro badge on recipe cards"
```

---

### Task 8: RecipeDetail — Fetch Nutrition Button & Display

**Files:**
- Modify: `src/components/RecipeDetail.tsx`

**Step 1: Add nutrition prop and state**

Add to the `Recipe` type:

```typescript
nutrition: {
  calories: number | null; protein: number | null; carbs: number | null
  fat: number | null; fibre: number | null; sugar: number | null; sodium: number | null
} | null
```

**Step 2: Add nutrition display section and backfill button**

After the serving control section, add a nutrition section. If `nutrition` exists, show a compact grid of macro values. If null, show a "Fetch nutrition info" button.

Nutrition display:

```typescript
{/* Nutrition */}
<section className="mb-10 animate-fade-up" style={{ animationDelay: '120ms' }}>
  <h2
    className="text-xs tracking-wide uppercase mb-4"
    style={{ color: 'var(--color-ink-muted)', fontWeight: 600, letterSpacing: '0.1em' }}
  >
    Nutrition <span style={{ fontWeight: 400 }}>(per serving)</span>
  </h2>
  {nutritionData ? (
    <div className="grid grid-cols-4 gap-3">
      {([
        ['Calories', nutritionData.calories, 'kcal'],
        ['Protein', nutritionData.protein, 'g'],
        ['Carbs', nutritionData.carbs, 'g'],
        ['Fat', nutritionData.fat, 'g'],
        ['Fibre', nutritionData.fibre, 'g'],
        ['Sugar', nutritionData.sugar, 'g'],
        ['Sodium', nutritionData.sodium, 'mg'],
      ] as const).map(([label, value, unit]) => (
        value !== null && (
          <div key={label} className="text-center py-3" style={{ background: 'var(--color-border-light)', borderRadius: '2px' }}>
            <p className="text-lg tabular-nums" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-terracotta)', fontWeight: 600 }}>
              {Math.round(value)}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-ink-muted)' }}>
              {unit} {label.toLowerCase()}
            </p>
          </div>
        )
      ))}
    </div>
  ) : (
    <button
      onClick={handleFetchNutrition}
      disabled={fetchingNutrition}
      className="flex items-center gap-2 text-sm px-4 py-2.5 transition-all duration-200 disabled:opacity-50"
      style={{
        color: 'var(--color-sage)',
        border: '1px solid var(--color-sage-light)',
        borderRadius: '2px',
        background: 'var(--color-warm-white)',
        fontWeight: 500,
      }}
    >
      {fetchingNutrition ? 'Fetching...' : 'Fetch nutrition info'}
    </button>
  )}
</section>
```

**Step 3: Add state and handler**

```typescript
const [nutritionData, setNutritionData] = useState(recipe.nutrition)
const [fetchingNutrition, setFetchingNutrition] = useState(false)

async function handleFetchNutrition() {
  setFetchingNutrition(true)
  try {
    const res = await fetch(`/api/recipes/${recipe.id}/nutrition`, { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      setNutritionData(data)
    }
  } finally {
    setFetchingNutrition(false)
  }
}
```

**Step 4: Run build**

Run: `npx next build 2>&1 | tail -15`
Expected: Compiles clean.

**Step 5: Run all tests**

Run: `npx vitest run`
Expected: All tests PASS.

**Step 6: Commit**

```bash
git add src/components/RecipeDetail.tsx
git commit -m "feat: show nutrition grid and backfill button on recipe detail"
```

---

### Task 9: Final Verification

**Step 1: Full test suite**

Run: `npx vitest run`
Expected: All tests PASS.

**Step 2: Build**

Run: `npx next build 2>&1 | tail -15`
Expected: Compiles clean.

**Step 3: Spot check with dev server**

Run: `npm run dev`
Manual checks:
- Home page shows sort bar when 2+ recipes exist
- Clicking a macro pill sorts, second click reverses, third click clears
- Recipe cards show macro badge
- Recipe detail shows nutrition grid or fetch button
- Fetch button calls API and shows nutrition

**Step 4: Final commit if any tweaks**

```bash
git add -A
git commit -m "chore: final tweaks for macro sorting feature"
```
