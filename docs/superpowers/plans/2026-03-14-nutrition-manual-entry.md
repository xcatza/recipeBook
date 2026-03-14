# Nutrition Manual Entry Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to manually enter and edit nutrition data at import time and on the recipe detail page.

**Architecture:** A shared `NutritionForm` component renders 7 number inputs inline. The review form gets a collapsed "Add nutrition" toggle. The detail page gets an "Edit" button (when data exists) and an "Enter manually" button (when data is absent). The PATCH handler gets a third route branch that calls the existing `storeNutrition` upsert.

**Tech Stack:** Next.js 16 App Router, React state, Tailwind CSS v4, existing Prisma `storeNutrition` service

---

## Chunk 1: API + service layer

### Task 1: PATCH handler — nutrition branch

**Files:**
- Modify: `src/app/api/recipes/[id]/route.ts`
- Modify: `tests/integration/recipes.test.ts`

- [ ] **Step 1: Write the failing integration test for the PATCH route**

The goal is to test that the *HTTP route* correctly routes a `nutrition` body to `storeNutrition`. Since the route handler doesn't exist yet, write the test against the service directly but framed as a route-layer concern. The existing `storeNutrition` unit tests already pass — this test verifies the new route branch wires it correctly.

Add to `tests/integration/recipes.test.ts` inside the `describe('Recipe service')` block:

```typescript
it('updateNutrition stores all fields and returns updated recipe', async () => {
  const saved = await saveRecipe({ ...testRecipe, sourceUrl: 'https://nutrition-patch.com', nutrition: null })
  expect(saved.nutrition).toBeNull()

  const updated = await storeNutrition(saved.id, {
    calories: 320, protein: 12, carbs: 40, fat: 10, fibre: 3, sugar: 5, sodium: 450,
  })
  expect(updated.nutrition).toMatchObject({
    calories: 320, protein: 12, carbs: 40, fat: 10, fibre: 3, sugar: 5, sodium: 450,
  })

  // Calling again updates existing values (upsert)
  const reUpdated = await storeNutrition(saved.id, {
    calories: 500, protein: 25, carbs: 60, fat: 20, fibre: 6, sugar: 10, sodium: 800,
  })
  expect(reUpdated.nutrition?.calories).toBe(500)
})
```

Update the import line to include `storeNutrition`:
```typescript
import { saveRecipe, getRecipes, getRecipe, deleteRecipe, getTags, updateTags, storeNutrition } from '@/lib/recipes'
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- --reporter=verbose 2>&1 | tail -20
```

Expected: FAIL — `storeNutrition` is not yet in the import (the test file references it but it isn't imported yet). After the import line is updated the test will pass since `storeNutrition` is already exported from `@/lib/recipes`.

- [ ] **Step 3: Add nutrition branch to PATCH route**

In `src/app/api/recipes/[id]/route.ts`, update the imports and PATCH handler:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getRecipe, updateRecipe, deleteRecipe, updateTags, storeNutrition } from '@/lib/recipes'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const recipe = await getRecipe(id)
  if (!recipe) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(recipe)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  if (body.nutrition !== undefined) {
    const recipe = await storeNutrition(id, body.nutrition)
    return NextResponse.json(recipe)
  }
  if (body.tags !== undefined) {
    const recipe = await updateTags(id, body.tags)
    return NextResponse.json(recipe)
  }
  const recipe = await updateRecipe(id, { notes: body.notes ?? null })
  return NextResponse.json(recipe)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await deleteRecipe(id)
  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 4: Run tests to verify all pass**

```bash
npm test 2>&1 | tail -15
```

Expected: all tests passing (the new `updateNutrition` test passes, no regressions).

- [ ] **Step 5: Commit**

```bash
git add src/app/api/recipes/[id]/route.ts tests/integration/recipes.test.ts
git commit -m "feat: add nutrition branch to PATCH /api/recipes/[id]"
```

---

### Task 2: POST route — pass nutrition through

**Files:**
- Modify: `src/app/api/recipes/route.ts`

The `saveRecipe` service already handles `parsed.nutrition` — it stores it if present, falls back to Spoonacular if null. The POST route just needs to pass `nutrition` from the request body as part of the recipe object.

- [ ] **Step 1: Verify current behaviour with a test**

Add to `tests/integration/recipes.test.ts`:

```typescript
it('saveRecipe with nutrition stores it immediately', async () => {
  const recipeWithNutrition = {
    ...testRecipe,
    sourceUrl: 'https://nutrition-save.com',
    nutrition: { calories: 400, protein: 20, carbs: 50, fat: 15, fibre: 4, sugar: 8, sodium: 600 },
  }
  const saved = await saveRecipe(recipeWithNutrition)
  // nutrition is stored async in saveRecipe — wait briefly
  await new Promise((r) => setTimeout(r, 50))
  const retrieved = await getRecipe(saved.id)
  expect(retrieved?.nutrition).toMatchObject({ calories: 400, protein: 20 })
})
```

- [ ] **Step 2: Run test to see if it passes**

```bash
npm test 2>&1 | tail -15
```

Expected: passes (service already handles this). If it fails due to async timing, change the timeout on this line in the test:
```typescript
await new Promise((r) => setTimeout(r, 50))
```
to `200` and re-run.

- [ ] **Step 3: Update POST route to forward nutrition**

In `src/app/api/recipes/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { saveRecipe, getRecipes } from '@/lib/recipes'

export async function GET() {
  try {
    return NextResponse.json(await getRecipes())
  } catch {
    return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { recipe, tags, nutrition } = await req.json()
    const recipeWithNutrition = nutrition !== undefined ? { ...recipe, nutrition } : { ...recipe, nutrition: null }
    const saved = await saveRecipe(recipeWithNutrition, tags ?? [])
    return NextResponse.json(saved, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to save recipe' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Run all tests**

```bash
npm test 2>&1 | tail -15
```

Expected: all tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/recipes/route.ts tests/integration/recipes.test.ts
git commit -m "feat: forward nutrition through POST /api/recipes"
```

---

## Chunk 2: UI components

### Task 3: NutritionForm component

**Files:**
- Create: `src/components/NutritionForm.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/NutritionForm.tsx`:

```typescript
'use client'
import { useState } from 'react'

export type NutritionValues = {
  calories: number | null
  protein: number | null
  carbs: number | null
  fat: number | null
  fibre: number | null
  sugar: number | null
  sodium: number | null
}

type Props = {
  initialValues?: Partial<NutritionValues>
  onSave: (data: NutritionValues) => void
  onCancel: () => void
  saving?: boolean
}

const FIELDS: { key: keyof NutritionValues; label: string; unit: string }[] = [
  { key: 'calories', label: 'Calories', unit: 'kcal' },
  { key: 'protein',  label: 'Protein',  unit: 'g' },
  { key: 'carbs',    label: 'Carbs',    unit: 'g' },
  { key: 'fat',      label: 'Fat',      unit: 'g' },
  { key: 'fibre',    label: 'Fibre',    unit: 'g' },
  { key: 'sugar',    label: 'Sugar',    unit: 'g' },
  { key: 'sodium',   label: 'Sodium',   unit: 'mg' },
]

function toStr(v: number | null | undefined): string {
  return v == null ? '' : String(v)
}

function toNum(v: string): number | null {
  const n = parseFloat(v)
  return isNaN(n) ? null : n
}

export function NutritionForm({ initialValues = {}, onSave, onCancel, saving }: Props) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(FIELDS.map((f) => [f.key, toStr(initialValues[f.key])]))
  )

  function handleSave() {
    const data = Object.fromEntries(
      FIELDS.map((f) => [f.key, toNum(values[f.key])])
    ) as NutritionValues
    onSave(data)
  }

  const inputStyle = {
    background: 'var(--color-warm-white)',
    border: '1px solid var(--color-border)',
    borderRadius: '2px',
    color: 'var(--color-ink)',
    width: '100%',
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {FIELDS.map(({ key, label, unit }) => (
          <div key={key}>
            <label
              className="block text-xs mb-1"
              style={{ color: 'var(--color-ink-muted)', fontWeight: 600, letterSpacing: '0.05em' }}
            >
              {label} <span style={{ fontWeight: 400, color: 'var(--color-sage)' }}>({unit})</span>
            </label>
            <input
              type="number"
              min={0}
              value={values[key]}
              onChange={(e) => setValues({ ...values, [key]: e.target.value })}
              placeholder="—"
              className="px-3 py-2 text-sm outline-none"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-terracotta)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium transition-all duration-200 disabled:opacity-50"
          style={{
            background: 'var(--color-terracotta)',
            color: 'var(--color-warm-white)',
            borderRadius: '2px',
          }}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm transition-all duration-200"
          style={{
            color: 'var(--color-ink-muted)',
            border: '1px solid var(--color-border)',
            borderRadius: '2px',
            background: 'transparent',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/NutritionForm.tsx
git commit -m "feat: add NutritionForm component"
```

---

### Task 4: RecipeReviewForm — Add nutrition toggle

**Files:**
- Modify: `src/components/RecipeReviewForm.tsx`

- [ ] **Step 1: Add nutrition state and type to RecipeReviewForm**

At the top of `src/components/RecipeReviewForm.tsx`, add `NutritionValues` import and update the component:

Add to imports:
```typescript
import { NutritionForm, type NutritionValues } from './NutritionForm'
```

Add state inside the component (after `tags` state):
```typescript
const [showNutrition, setShowNutrition] = useState(false)
const [nutrition, setNutrition] = useState<NutritionValues | null>(null)
```

- [ ] **Step 2: Add nutrition section between Tags and Ingredients**

In the JSX, between the closing `</div>` of the Tags section and the `{/* Ingredients */}` comment, insert:

```tsx
{/* Nutrition */}
<div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '1.5rem', marginBottom: '0.5rem' }}>
  <div className="flex items-center justify-between mb-3">
    <label
      className="block text-xs tracking-wide uppercase"
      style={{ color: 'var(--color-ink-muted)', fontWeight: 600, letterSpacing: '0.1em' }}
    >
      Nutrition <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
    </label>
    {showNutrition ? (
      <button
        type="button"
        onClick={() => { setShowNutrition(false); setNutrition(null) }}
        className="text-xs transition-colors duration-200"
        style={{ color: 'var(--color-ink-muted)' }}
      >
        Remove
      </button>
    ) : (
      <button
        type="button"
        onClick={() => setShowNutrition(true)}
        className="text-xs transition-colors duration-200"
        style={{ color: 'var(--color-sage)', fontWeight: 500 }}
      >
        Add nutrition ↓
      </button>
    )}
  </div>
  {showNutrition && (
    <NutritionForm
      onSave={(data) => { setNutrition(data); setShowNutrition(false) }}
      onCancel={() => { setShowNutrition(false); setNutrition(null) }}
    />
  )}
  {nutrition && !showNutrition && (
    <p className="text-xs" style={{ color: 'var(--color-sage)' }}>
      ✓ Nutrition added ({nutrition.calories ?? '—'} kcal)
      <button
        type="button"
        onClick={() => setShowNutrition(true)}
        className="ml-2 underline"
        style={{ color: 'var(--color-ink-muted)' }}
      >
        Edit
      </button>
    </p>
  )}
</div>
```

- [ ] **Step 3: Include nutrition in the save body**

Update `handleSave` to send nutrition as a top-level field:

```typescript
async function handleSave() {
  setSaving(true)
  setError(null)
  try {
    const res = await fetch('/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipe: { ...form, nutrition: null }, tags, nutrition }),
    })
    if (!res.ok) { setError('Failed to save recipe'); return }
    const saved = await res.json()
    router.push(`/recipes/${saved.id}`)
  } catch {
    setError('Network error')
  } finally {
    setSaving(false)
  }
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 5: Run all tests**

```bash
npm test 2>&1 | tail -15
```

Expected: all tests passing.

- [ ] **Step 6: Commit**

```bash
git add src/components/RecipeReviewForm.tsx
git commit -m "feat: add optional nutrition entry to recipe review form"
```

---

### Task 5: RecipeDetail — Edit and Enter manually

**Files:**
- Modify: `src/components/RecipeDetail.tsx`

- [ ] **Step 1: Add NutritionForm import and editing state**

Add import at the top of `src/components/RecipeDetail.tsx`:
```typescript
import { NutritionForm, type NutritionValues } from './NutritionForm'
```

Add state inside the component (after `fetchingNutrition` state):
```typescript
const [editingNutrition, setEditingNutrition] = useState(false)
const [savingNutrition, setSavingNutrition] = useState(false)
```

- [ ] **Step 2: Add saveNutrition handler**

Add after `handleFetchNutrition`:

```typescript
async function handleSaveNutrition(data: NutritionValues) {
  setSavingNutrition(true)
  try {
    const res = await fetch(`/api/recipes/${recipe.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nutrition: data }),
    })
    if (res.ok) {
      const updated = await res.json()
      setNutritionData(updated.nutrition)
    }
  } finally {
    setSavingNutrition(false)
    setEditingNutrition(false)
  }
}
```

- [ ] **Step 3: Update the Nutrition section JSX**

Replace the entire `{/* Nutrition */}` section (lines 222–268 in the current file) with:

```tsx
{/* Nutrition */}
<section className="mb-10 animate-fade-up" style={{ animationDelay: '120ms' }}>
  <div className="flex items-center justify-between mb-4">
    <h2
      className="text-xs tracking-wide uppercase"
      style={{ color: 'var(--color-ink-muted)', fontWeight: 600, letterSpacing: '0.1em' }}
    >
      Nutrition <span style={{ fontWeight: 400 }}>(per serving)</span>
    </h2>
    {nutritionData && !editingNutrition && (
      <button
        onClick={() => setEditingNutrition(true)}
        className="text-xs transition-colors duration-200"
        style={{ color: 'var(--color-sage)', fontWeight: 500 }}
      >
        Edit
      </button>
    )}
  </div>
  {editingNutrition ? (
    <NutritionForm
      initialValues={nutritionData ?? {}}
      onSave={handleSaveNutrition}
      onCancel={() => setEditingNutrition(false)}
      saving={savingNutrition}
    />
  ) : nutritionData ? (
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
    <div className="flex gap-2 flex-wrap">
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
      <button
        onClick={() => setEditingNutrition(true)}
        className="flex items-center gap-2 text-sm px-4 py-2.5 transition-all duration-200"
        style={{
          color: 'var(--color-ink-muted)',
          border: '1px solid var(--color-border)',
          borderRadius: '2px',
          background: 'transparent',
          fontWeight: 500,
        }}
      >
        Enter manually
      </button>
    </div>
  )}
</section>
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 5: Run all tests**

```bash
npm test 2>&1 | tail -15
```

Expected: all tests passing.

- [ ] **Step 6: Commit**

```bash
git add src/components/RecipeDetail.tsx
git commit -m "feat: add edit nutrition and enter manually to recipe detail"
```

---

## Chunk 3: Final verification

### Task 6: Build and verify

- [ ] **Step 1: Run full test suite**

```bash
npm test 2>&1 | tail -15
```

Expected: all tests passing (26 total — 24 original + 2 new integration tests: `updateNutrition stores all fields` and `saveRecipe with nutrition stores it immediately`).

- [ ] **Step 2: Run production build**

```bash
npm run build 2>&1 | tail -20
```

Expected: clean build, no TypeScript errors, all routes present.

- [ ] **Step 3: Invoke finishing-a-development-branch skill**

Use `superpowers:finishing-a-development-branch` to complete the work.
