# Recipe Book Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a personal recipe management web app where recipes are imported via URL (recipe sites or Instagram), with live serving size scaling and ingredient substitute lookup.

**Architecture:** Next.js 14 App Router monolith. API routes handle all third-party calls server-side. Business logic lives in `src/lib/` service modules, separate from route handlers for testability. Prisma manages a SQLite database.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Prisma + SQLite, @extractus/recipe-extractor, Spoonacular API (free tier), RapidAPI Instagram scraper (free tier), Vitest, Playwright

---

### Task 1: Scaffold the project

**Files:**
- Initialize: project root
- Create: `vitest.config.ts`, `playwright.config.ts`, `tests/setup.ts`, `.env.local.example`

**Step 1: Initialize Next.js**

Run in `/home/shafiq/src/recipeBook`:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-git
```
Accept all defaults.

**Step 2: Install dependencies**

```bash
npm install @prisma/client @extractus/recipe-extractor
npm install -D prisma vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom
npm install -D @playwright/test
npx playwright install --with-deps chromium
```

**Step 3: Create `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
```

**Step 4: Create `tests/setup.ts`**

```typescript
import '@testing-library/jest-dom'
```

**Step 5: Create `playwright.config.ts`**

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

**Step 6: Add test scripts to `package.json`**

In the `"scripts"` section add:
```json
"test": "vitest run",
"test:watch": "vitest",
"test:e2e": "playwright test"
```

**Step 7: Create `.env.local.example`**

```
SPOONACULAR_API_KEY=your_key_here
RAPIDAPI_KEY=your_key_here
```

Then: `cp .env.local.example .env.local` and fill in your keys.

**Step 8: Create test directories**

```bash
mkdir -p tests/unit tests/integration tests/e2e
```

**Step 9: Commit**

```bash
git init
git add -A
git commit -m "feat: scaffold Next.js project with Vitest and Playwright"
```

---

### Task 2: Database schema

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/prisma.ts`

**Step 1: Initialize Prisma**

```bash
npx prisma init --datasource-provider sqlite
```

This creates `prisma/schema.prisma` and a `.env` file. Confirm `.env` contains:
```
DATABASE_URL="file:./dev.db"
```
Note: Prisma reads `.env`, not `.env.local`.

**Step 2: Replace `prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Recipe {
  id              String          @id @default(cuid())
  title           String
  description     String?
  sourceUrl       String
  imageUrl        String?
  defaultServings Int
  steps           String          // JSON-serialized string[]
  createdAt       DateTime        @default(now())
  ingredients     Ingredient[]
  tags            TagsOnRecipes[]
}

model Ingredient {
  id            String  @id @default(cuid())
  recipeId      String
  name          String
  quantity      Float?
  unit          String?
  notes         String?
  spoonacularId Int?
  recipe        Recipe  @relation(fields: [recipeId], references: [id], onDelete: Cascade)
}

model Tag {
  id      String          @id @default(cuid())
  name    String          @unique
  recipes TagsOnRecipes[]
}

model TagsOnRecipes {
  recipeId String
  tagId    String
  recipe   Recipe @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  tag      Tag    @relation(fields: [tagId], references: [id], onDelete: Cascade)
  @@id([recipeId, tagId])
}
```

SQLite has no native array type — `steps` is stored as a JSON string and serialized/deserialized in the service layer.

**Step 3: Run migration**

```bash
npx prisma migrate dev --name init
```

Expected: `prisma/migrations/` directory created, `prisma/dev.db` created.

**Step 4: Generate client**

```bash
npx prisma generate
```

**Step 5: Create `src/lib/prisma.ts`**

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

**Step 6: Write smoke test — `tests/unit/prisma-schema.test.ts`**

```typescript
import { describe, it, expect } from 'vitest'

describe('Prisma client', () => {
  it('can be imported', async () => {
    const { PrismaClient } = await import('@prisma/client')
    expect(PrismaClient).toBeDefined()
  })
})
```

**Step 7: Run test**

```bash
npm test -- tests/unit/prisma-schema.test.ts
```
Expected: PASS

**Step 8: Commit**

```bash
git add prisma/ src/lib/prisma.ts tests/unit/prisma-schema.test.ts
git commit -m "feat: add Prisma schema with Recipe, Ingredient, Tag models"
```

---

### Task 3: Serving scale utility

**Files:**
- Create: `src/lib/scaling.ts`
- Create: `tests/unit/scaling.test.ts`

**Step 1: Write failing tests — `tests/unit/scaling.test.ts`**

```typescript
import { describe, it, expect } from 'vitest'
import { scaleQuantity, scaleIngredients } from '@/lib/scaling'

describe('scaleQuantity', () => {
  it('scales proportionally', () => {
    expect(scaleQuantity(2, 4, 8)).toBe(4)
  })
  it('handles halving', () => {
    expect(scaleQuantity(3, 6, 3)).toBe(1.5)
  })
  it('returns null when quantity is null', () => {
    expect(scaleQuantity(null, 4, 8)).toBeNull()
  })
  it('rounds to 2 decimal places', () => {
    expect(scaleQuantity(1, 3, 4)).toBe(1.33)
  })
})

describe('scaleIngredients', () => {
  it('scales all ingredient quantities', () => {
    const ingredients = [
      { id: '1', name: 'flour', quantity: 2, unit: 'cups', notes: null, spoonacularId: null, recipeId: 'r1' },
      { id: '2', name: 'salt', quantity: 1, unit: 'tsp', notes: null, spoonacularId: null, recipeId: 'r1' },
    ]
    const scaled = scaleIngredients(ingredients, 4, 8)
    expect(scaled[0].quantity).toBe(4)
    expect(scaled[1].quantity).toBe(2)
  })
})
```

**Step 2: Run to verify failure**

```bash
npm test -- tests/unit/scaling.test.ts
```
Expected: FAIL — "Cannot find module"

**Step 3: Implement `src/lib/scaling.ts`**

```typescript
type Ingredient = {
  id: string
  name: string
  quantity: number | null
  unit: string | null
  notes: string | null
  spoonacularId: number | null
  recipeId: string
}

export function scaleQuantity(
  quantity: number | null,
  defaultServings: number,
  desiredServings: number
): number | null {
  if (quantity === null) return null
  const scaled = (quantity / defaultServings) * desiredServings
  return Math.round(scaled * 100) / 100
}

export function scaleIngredients(
  ingredients: Ingredient[],
  defaultServings: number,
  desiredServings: number
): Ingredient[] {
  return ingredients.map((ing) => ({
    ...ing,
    quantity: scaleQuantity(ing.quantity, defaultServings, desiredServings),
  }))
}
```

**Step 4: Run tests**

```bash
npm test -- tests/unit/scaling.test.ts
```
Expected: PASS (5 tests)

**Step 5: Commit**

```bash
git add src/lib/scaling.ts tests/unit/scaling.test.ts
git commit -m "feat: add serving scale utility with tests"
```

---

### Task 4: URL detection utility

**Files:**
- Create: `src/lib/parsers/detect-url.ts`
- Create: `tests/unit/detect-url.test.ts`

**Step 1: Write failing tests**

```typescript
import { describe, it, expect } from 'vitest'
import { detectUrlType } from '@/lib/parsers/detect-url'

describe('detectUrlType', () => {
  it('detects Instagram post URLs', () => {
    expect(detectUrlType('https://www.instagram.com/p/ABC123/')).toBe('instagram')
  })
  it('detects Instagram reel URLs', () => {
    expect(detectUrlType('https://www.instagram.com/reel/ABC123/')).toBe('instagram')
  })
  it('detects regular recipe URLs', () => {
    expect(detectUrlType('https://www.allrecipes.com/recipe/123/pasta/')).toBe('recipe')
  })
  it('throws on invalid URL', () => {
    expect(() => detectUrlType('not-a-url')).toThrow()
  })
})
```

**Step 2: Run to verify failure**

```bash
npm test -- tests/unit/detect-url.test.ts
```

**Step 3: Implement `src/lib/parsers/detect-url.ts`**

```typescript
export type UrlType = 'instagram' | 'recipe'

export function detectUrlType(url: string): UrlType {
  const parsed = new URL(url) // throws if invalid
  const hostname = parsed.hostname.replace('www.', '')
  if (hostname === 'instagram.com') return 'instagram'
  return 'recipe'
}
```

**Step 4: Run tests**

```bash
npm test -- tests/unit/detect-url.test.ts
```
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/parsers/detect-url.ts tests/unit/detect-url.test.ts
git commit -m "feat: add URL type detection utility"
```

---

### Task 5: Shared types + recipe parser (extractor + Spoonacular fallback)

**Files:**
- Create: `src/lib/parsers/types.ts`
- Create: `src/lib/parsers/recipe-extractor.ts`
- Create: `src/lib/parsers/spoonacular.ts`
- Create: `src/lib/parsers/index.ts`
- Create: `tests/unit/recipe-parser.test.ts`

**Step 1: Create `src/lib/parsers/types.ts`**

```typescript
export type ParsedIngredient = {
  name: string
  quantity: number | null
  unit: string | null
  notes: string | null
}

export type ParsedRecipe = {
  title: string
  description: string | null
  imageUrl: string | null
  defaultServings: number
  ingredients: ParsedIngredient[]
  steps: string[]
  sourceUrl: string
}
```

**Step 2: Write failing tests — `tests/unit/recipe-parser.test.ts`**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/parsers/recipe-extractor', () => ({
  extractRecipeFromUrl: vi.fn(),
}))
vi.mock('@/lib/parsers/spoonacular', () => ({
  analyzeRecipeFromUrl: vi.fn(),
  resolveIngredientId: vi.fn(),
  getIngredientSubstitutes: vi.fn(),
}))

import { parseRecipeUrl } from '@/lib/parsers/index'
import { extractRecipeFromUrl } from '@/lib/parsers/recipe-extractor'
import { analyzeRecipeFromUrl } from '@/lib/parsers/spoonacular'

const mockRecipe = {
  title: 'Pasta', description: null, imageUrl: null,
  defaultServings: 4, ingredients: [], steps: ['Boil water'],
  sourceUrl: 'https://example.com/pasta',
}

describe('parseRecipeUrl', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns extractor result when successful', async () => {
    vi.mocked(extractRecipeFromUrl).mockResolvedValue(mockRecipe)
    const result = await parseRecipeUrl('https://example.com/pasta')
    expect(result).toEqual(mockRecipe)
    expect(analyzeRecipeFromUrl).not.toHaveBeenCalled()
  })

  it('falls back to Spoonacular when extractor returns null', async () => {
    vi.mocked(extractRecipeFromUrl).mockResolvedValue(null)
    vi.mocked(analyzeRecipeFromUrl).mockResolvedValue(mockRecipe)
    const result = await parseRecipeUrl('https://example.com/pasta')
    expect(result).toEqual(mockRecipe)
    expect(analyzeRecipeFromUrl).toHaveBeenCalled()
  })

  it('falls back to Spoonacular when extractor throws', async () => {
    vi.mocked(extractRecipeFromUrl).mockRejectedValue(new Error('fail'))
    vi.mocked(analyzeRecipeFromUrl).mockResolvedValue(mockRecipe)
    expect(await parseRecipeUrl('https://example.com/pasta')).toEqual(mockRecipe)
  })

  it('returns null when both fail', async () => {
    vi.mocked(extractRecipeFromUrl).mockResolvedValue(null)
    vi.mocked(analyzeRecipeFromUrl).mockResolvedValue(null)
    expect(await parseRecipeUrl('https://example.com/pasta')).toBeNull()
  })
})
```

**Step 3: Run to verify failure**

```bash
npm test -- tests/unit/recipe-parser.test.ts
```

**Step 4: Implement `src/lib/parsers/recipe-extractor.ts`**

```typescript
import { extract } from '@extractus/recipe-extractor'
import type { ParsedRecipe, ParsedIngredient } from './types'

function parseIngredientString(raw: string): ParsedIngredient {
  const match = raw.match(/^([\d./]+)?\s*([a-zA-Z]+)?\s+(.+)$/)
  if (!match) return { name: raw, quantity: null, unit: null, notes: null }
  const [, qty, unit, rest] = match
  const [name, ...notesParts] = rest.split(',')
  return {
    quantity: qty ? parseFloat(qty) : null,
    unit: unit || null,
    name: name.trim(),
    notes: notesParts.join(',').trim() || null,
  }
}

export async function extractRecipeFromUrl(url: string): Promise<ParsedRecipe | null> {
  try {
    const data = await extract(url)
    if (!data?.name) return null

    const ingredients: ParsedIngredient[] = (data.recipeIngredient ?? []).map(parseIngredientString)
    const steps: string[] = (data.recipeInstructions ?? [])
      .map((s: any) => (typeof s === 'string' ? s : s.text ?? ''))
      .filter(Boolean)

    let defaultServings = 4
    if (data.recipeYield) {
      const y = Array.isArray(data.recipeYield) ? data.recipeYield[0] : data.recipeYield
      const n = parseInt(String(y), 10)
      if (!isNaN(n)) defaultServings = n
    }

    return {
      title: data.name,
      description: data.description ?? null,
      imageUrl: Array.isArray(data.image) ? data.image[0] : (data.image ?? null),
      defaultServings,
      ingredients,
      steps,
      sourceUrl: url,
    }
  } catch {
    return null
  }
}
```

**Step 5: Implement `src/lib/parsers/spoonacular.ts`**

Get a free API key at https://spoonacular.com/food-api (150 req/day on free tier). Set `SPOONACULAR_API_KEY` in `.env.local`.

```typescript
import type { ParsedRecipe, ParsedIngredient } from './types'

const BASE = 'https://api.spoonacular.com'

function key(): string {
  const k = process.env.SPOONACULAR_API_KEY
  if (!k) throw new Error('SPOONACULAR_API_KEY not set')
  return k
}

export async function analyzeRecipeFromUrl(url: string): Promise<ParsedRecipe | null> {
  try {
    const res = await fetch(
      `${BASE}/recipes/extract?apiKey=${key()}&url=${encodeURIComponent(url)}&forceExtraction=false`
    )
    if (!res.ok) return null
    const data = await res.json()

    const ingredients: ParsedIngredient[] = (data.extendedIngredients ?? []).map((ing: any) => ({
      name: ing.nameClean ?? ing.name,
      quantity: ing.amount ?? null,
      unit: ing.unit || null,
      notes: null,
    }))

    const steps: string[] = []
    for (const section of data.analyzedInstructions ?? []) {
      for (const step of section.steps ?? []) steps.push(step.step)
    }

    return {
      title: data.title,
      description: data.summary?.replace(/<[^>]+>/g, '') ?? null,
      imageUrl: data.image ?? null,
      defaultServings: data.servings ?? 4,
      ingredients,
      steps,
      sourceUrl: url,
    }
  } catch {
    return null
  }
}

export async function resolveIngredientId(name: string): Promise<number | null> {
  try {
    const res = await fetch(
      `${BASE}/food/ingredients/search?apiKey=${key()}&query=${encodeURIComponent(name)}&number=1`
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.results?.[0]?.id ?? null
  } catch {
    return null
  }
}

export async function getIngredientSubstitutes(spoonacularId: number): Promise<string[]> {
  try {
    const res = await fetch(`${BASE}/food/ingredients/${spoonacularId}/substitutes?apiKey=${key()}`)
    if (!res.ok) return []
    const data = await res.json()
    return data.substitutes ?? []
  } catch {
    return []
  }
}
```

**Step 6: Implement `src/lib/parsers/index.ts`**

```typescript
import { extractRecipeFromUrl } from './recipe-extractor'
import { analyzeRecipeFromUrl } from './spoonacular'
import type { ParsedRecipe } from './types'

export type { ParsedRecipe, ParsedIngredient } from './types'

export async function parseRecipeUrl(url: string): Promise<ParsedRecipe | null> {
  try {
    const result = await extractRecipeFromUrl(url)
    if (result) return result
  } catch {
    // fall through
  }
  return analyzeRecipeFromUrl(url)
}
```

**Step 7: Run tests**

```bash
npm test -- tests/unit/recipe-parser.test.ts
```
Expected: PASS (4 tests)

**Step 8: Commit**

```bash
git add src/lib/parsers/ tests/unit/recipe-parser.test.ts
git commit -m "feat: add recipe parser with extractus + Spoonacular fallback"
```

---

### Task 6: Instagram parser

**Files:**
- Create: `src/lib/parsers/instagram.ts`
- Create: `tests/unit/instagram-parser.test.ts`

**Before starting:** Sign up at https://rapidapi.com. Search for "Instagram Scraper" and subscribe to a free-tier option (e.g. "instagram-scraper-api2"). Set `RAPIDAPI_KEY` in `.env.local`.

**Step 1: Write failing tests — `tests/unit/instagram-parser.test.ts`**

```typescript
import { describe, it, expect } from 'vitest'
import { extractRecipeFromCaption } from '@/lib/parsers/instagram'

describe('extractRecipeFromCaption', () => {
  it('extracts ingredients and steps from a structured caption', () => {
    const caption = `Delicious pasta!\n\nIngredients:\n2 cups flour\n1 tsp salt\n3 eggs\n\nInstructions:\n1. Mix flour and salt\n2. Add eggs and knead\n3. Cook for 10 minutes`
    const result = extractRecipeFromCaption(caption, 'https://instagram.com/p/test/')
    expect(result).not.toBeNull()
    expect(result!.ingredients.length).toBe(3)
    expect(result!.steps.length).toBe(3)
  })

  it('returns null when caption has no recipe structure', () => {
    expect(extractRecipeFromCaption('Just a nice photo!', 'https://instagram.com/p/test/')).toBeNull()
  })
})
```

**Step 2: Run to verify failure**

```bash
npm test -- tests/unit/instagram-parser.test.ts
```

**Step 3: Implement `src/lib/parsers/instagram.ts`**

```typescript
import type { ParsedRecipe, ParsedIngredient } from './types'

const RAPIDAPI_HOST = 'instagram-scraper-api2.p.rapidapi.com'

export async function fetchInstagramPost(
  url: string
): Promise<{ caption: string; imageUrl: string | null } | null> {
  const apiKey = process.env.RAPIDAPI_KEY
  if (!apiKey) throw new Error('RAPIDAPI_KEY not set')

  const match = url.match(/\/(p|reel)\/([A-Za-z0-9_-]+)/)
  if (!match) return null
  const shortcode = match[2]

  const res = await fetch(
    `https://${RAPIDAPI_HOST}/v1/post_info?code_or_id_or_url=${shortcode}`,
    {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      },
    }
  )
  if (!res.ok) return null
  const data = await res.json()

  return {
    caption: data.data?.caption?.text ?? '',
    imageUrl: data.data?.thumbnail_url ?? data.data?.image_url ?? null,
  }
}

function parseIngredientLine(line: string): ParsedIngredient {
  const match = line.trim().match(/^([\d./]+)?\s*([a-zA-Z]+)?\s+(.+)$/)
  if (!match) return { name: line.trim(), quantity: null, unit: null, notes: null }
  const [, qty, unit, name] = match
  return { quantity: qty ? parseFloat(qty) : null, unit: unit || null, name: name.trim(), notes: null }
}

export function extractRecipeFromCaption(caption: string, sourceUrl: string): ParsedRecipe | null {
  const lower = caption.toLowerCase()
  const hasIngredients = lower.includes('ingredient')
  const hasInstructions =
    lower.includes('instruction') || lower.includes('direction') ||
    lower.includes('method') || /\n\d+\./.test(caption)

  if (!hasIngredients && !hasInstructions) return null

  const lines = caption.split('\n').map((l) => l.trim()).filter(Boolean)
  const ingredients: ParsedIngredient[] = []
  const steps: string[] = []
  let mode: 'none' | 'ingredients' | 'steps' = 'none'

  for (const line of lines) {
    const low = line.toLowerCase()
    if (low.startsWith('ingredient')) { mode = 'ingredients'; continue }
    if (low.startsWith('instruction') || low.startsWith('direction') || low.startsWith('method')) {
      mode = 'steps'; continue
    }
    if (mode === 'ingredients') ingredients.push(parseIngredientLine(line))
    else if (mode === 'steps') steps.push(line.replace(/^\d+[.)]\s*/, ''))
  }

  if (ingredients.length === 0 && steps.length === 0) return null

  return {
    title: lines[0] || 'Untitled Recipe',
    description: null,
    imageUrl: null,
    defaultServings: 4,
    ingredients,
    steps,
    sourceUrl,
  }
}
```

**Step 4: Run tests**

```bash
npm test -- tests/unit/instagram-parser.test.ts
```
Expected: PASS (2 tests)

**Step 5: Commit**

```bash
git add src/lib/parsers/instagram.ts tests/unit/instagram-parser.test.ts
git commit -m "feat: add Instagram caption parser"
```

---

### Task 7: Recipe service layer + integration tests

**Files:**
- Create: `src/lib/recipes.ts`
- Create: `tests/integration/recipes.test.ts`

**Step 1: Set up integration test DB**

```bash
DATABASE_URL="file:./tests/integration/test.db" npx prisma migrate deploy
```

**Step 2: Write failing integration tests — `tests/integration/recipes.test.ts`**

```typescript
import { describe, it, expect, vi } from 'vitest'

// Must be set before importing anything that touches Prisma
process.env.DATABASE_URL = `file:${__dirname}/test.db`

vi.mock('@/lib/parsers/spoonacular', () => ({
  resolveIngredientId: vi.fn().mockResolvedValue(null),
  analyzeRecipeFromUrl: vi.fn(),
  getIngredientSubstitutes: vi.fn(),
}))

import { saveRecipe, getRecipes, getRecipe, deleteRecipe } from '@/lib/recipes'

const testRecipe = {
  title: 'Test Pasta',
  description: 'A test',
  imageUrl: null,
  defaultServings: 4,
  ingredients: [
    { name: 'flour', quantity: 2, unit: 'cups', notes: null },
    { name: 'salt', quantity: 1, unit: 'tsp', notes: null },
  ],
  steps: ['Boil water', 'Cook pasta'],
  sourceUrl: 'https://example.com/pasta',
}

describe('Recipe service', () => {
  it('saves and retrieves a recipe', async () => {
    const saved = await saveRecipe(testRecipe)
    expect(saved.title).toBe('Test Pasta')
    expect(saved.steps).toEqual(['Boil water', 'Cook pasta'])
    expect(saved.ingredients).toHaveLength(2)
    const retrieved = await getRecipe(saved.id)
    expect(retrieved?.title).toBe('Test Pasta')
  })

  it('lists all recipes', async () => {
    await saveRecipe({ ...testRecipe, sourceUrl: 'https://a.com' })
    await saveRecipe({ ...testRecipe, sourceUrl: 'https://b.com' })
    const recipes = await getRecipes()
    expect(recipes.length).toBeGreaterThanOrEqual(2)
  })

  it('deletes a recipe', async () => {
    const saved = await saveRecipe({ ...testRecipe, sourceUrl: 'https://delete.com' })
    await deleteRecipe(saved.id)
    expect(await getRecipe(saved.id)).toBeNull()
  })
})
```

**Step 3: Run to verify failure**

```bash
npm test -- tests/integration/recipes.test.ts
```

**Step 4: Implement `src/lib/recipes.ts`**

```typescript
import { prisma } from './prisma'
import type { ParsedRecipe } from './parsers/types'
import { resolveIngredientId } from './parsers/spoonacular'

export async function saveRecipe(parsed: ParsedRecipe, tags: string[] = []) {
  const recipe = await prisma.recipe.create({
    data: {
      title: parsed.title,
      description: parsed.description,
      sourceUrl: parsed.sourceUrl,
      imageUrl: parsed.imageUrl,
      defaultServings: parsed.defaultServings,
      steps: JSON.stringify(parsed.steps),
      ingredients: {
        create: parsed.ingredients.map((ing) => ({
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          notes: ing.notes,
        })),
      },
      tags: {
        connectOrCreate: tags.map((name) => ({
          where: { name },
          create: { name },
        })),
      },
    },
    include: { ingredients: true, tags: { include: { tag: true } } },
  })

  // Resolve Spoonacular IDs in background — non-blocking
  resolveSpoonacularIds(recipe.id, recipe.ingredients).catch(console.error)

  return serialize(recipe)
}

async function resolveSpoonacularIds(recipeId: string, ingredients: Array<{ id: string; name: string }>) {
  for (const ing of ingredients) {
    const id = await resolveIngredientId(ing.name)
    if (id) await prisma.ingredient.update({ where: { id: ing.id }, data: { spoonacularId: id } })
  }
}

export async function getRecipes() {
  const recipes = await prisma.recipe.findMany({
    include: { ingredients: true, tags: { include: { tag: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return recipes.map(serialize)
}

export async function getRecipe(id: string) {
  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: { ingredients: true, tags: { include: { tag: true } } },
  })
  return recipe ? serialize(recipe) : null
}

export async function deleteRecipe(id: string) {
  await prisma.recipe.delete({ where: { id } })
}

function serialize(recipe: any) {
  return {
    ...recipe,
    steps: JSON.parse(recipe.steps) as string[],
    tags: recipe.tags.map((t: any) => t.tag.name),
  }
}
```

**Step 5: Run integration tests**

```bash
npm test -- tests/integration/recipes.test.ts
```
Expected: PASS (3 tests)

**Step 6: Commit**

```bash
git add src/lib/recipes.ts tests/integration/recipes.test.ts
git commit -m "feat: add recipe service layer with integration tests"
```

---

### Task 8: API routes

**Files:**
- Create: `src/app/api/recipes/route.ts`
- Create: `src/app/api/recipes/[id]/route.ts`
- Create: `src/app/api/recipes/parse/route.ts`
- Create: `src/app/api/ingredients/[id]/substitutes/route.ts`

**Step 1: Create `src/app/api/recipes/route.ts`**

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
    const { recipe, tags } = await req.json()
    const saved = await saveRecipe(recipe, tags ?? [])
    return NextResponse.json(saved, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to save recipe' }, { status: 500 })
  }
}
```

**Step 2: Create `src/app/api/recipes/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getRecipe, deleteRecipe } from '@/lib/recipes'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const recipe = await getRecipe(params.id)
  if (!recipe) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(recipe)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await deleteRecipe(params.id)
  return new NextResponse(null, { status: 204 })
}
```

**Step 3: Create `src/app/api/recipes/parse/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { detectUrlType } from '@/lib/parsers/detect-url'
import { parseRecipeUrl } from '@/lib/parsers'
import { fetchInstagramPost, extractRecipeFromCaption } from '@/lib/parsers/instagram'

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url) return NextResponse.json({ error: 'url is required' }, { status: 400 })

    const type = detectUrlType(url)
    let parsed = null

    if (type === 'instagram') {
      const post = await fetchInstagramPost(url)
      if (post) {
        parsed = extractRecipeFromCaption(post.caption, url)
        if (parsed && post.imageUrl) parsed.imageUrl = post.imageUrl
      }
    } else {
      parsed = await parseRecipeUrl(url)
    }

    if (!parsed) {
      return NextResponse.json({ error: 'Could not extract recipe from URL' }, { status: 422 })
    }
    return NextResponse.json(parsed)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

**Step 4: Create `src/app/api/ingredients/[id]/substitutes/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getIngredientSubstitutes } from '@/lib/parsers/spoonacular'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const ingredient = await prisma.ingredient.findUnique({ where: { id: params.id } })
  if (!ingredient) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (!ingredient.spoonacularId) {
    return NextResponse.json({ substitutes: [], message: 'No Spoonacular ID resolved yet' })
  }

  const substitutes = await getIngredientSubstitutes(ingredient.spoonacularId)
  return NextResponse.json({ substitutes })
}
```

**Step 5: Commit**

```bash
git add src/app/api/
git commit -m "feat: add recipe and ingredient API routes"
```

---

### Task 9: Collection page UI

**Files:**
- Create: `src/components/RecipeCard.tsx`
- Create: `src/components/RecipeGrid.tsx`
- Modify: `src/app/page.tsx`

**Step 1: Create `src/components/RecipeCard.tsx`**

```tsx
import Link from 'next/link'

type Props = { id: string; title: string; imageUrl: string | null; defaultServings: number; tags: string[] }

export function RecipeCard({ id, title, imageUrl, defaultServings, tags }: Props) {
  return (
    <Link href={`/recipes/${id}`} className="block group">
      <div className="rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="w-full h-48 object-cover" />
        ) : (
          <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">No image</div>
        )}
        <div className="p-4">
          <h3 className="font-medium text-gray-900 group-hover:text-blue-600 line-clamp-2">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">Serves {defaultServings}</p>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.map((tag) => (
                <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
```

**Step 2: Create `src/components/RecipeGrid.tsx`**

```tsx
import { RecipeCard } from './RecipeCard'

type Recipe = { id: string; title: string; imageUrl: string | null; defaultServings: number; tags: string[] }

export function RecipeGrid({ recipes }: { recipes: Recipe[] }) {
  if (recipes.length === 0) {
    return <div className="text-center text-gray-500 py-16">No recipes yet. Import one above!</div>
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {recipes.map((r) => <RecipeCard key={r.id} {...r} />)}
    </div>
  )
}
```

**Step 3: Replace `src/app/page.tsx`**

```tsx
import { getRecipes } from '@/lib/recipes'
import { RecipeGrid } from '@/components/RecipeGrid'
import Link from 'next/link'

export default async function HomePage() {
  const recipes = await getRecipes()
  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Recipes</h1>
        <Link href="/import" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
          Import Recipe
        </Link>
      </div>
      <RecipeGrid recipes={recipes} />
    </main>
  )
}
```

**Step 4: Commit**

```bash
git add src/components/RecipeCard.tsx src/components/RecipeGrid.tsx src/app/page.tsx
git commit -m "feat: add recipe collection page with grid layout"
```

---

### Task 10: Import page UI

**Files:**
- Create: `src/components/ImportForm.tsx`
- Create: `src/components/RecipeReviewForm.tsx`
- Create: `src/app/import/page.tsx`

**Step 1: Create `src/components/ImportForm.tsx`**

```tsx
'use client'
import { useState } from 'react'
import type { ParsedRecipe } from '@/lib/parsers/types'

export function ImportForm({ onParsed }: { onParsed: (r: ParsedRecipe) => void }) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/recipes/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      if (!res.ok) { setError((await res.json()).error ?? 'Failed to parse'); return }
      onParsed(await res.json())
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
          Recipe or Instagram URL
        </label>
        <input
          id="url" type="url" value={url} onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..." required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium">
        {loading ? 'Importing...' : 'Import'}
      </button>
    </form>
  )
}
```

**Step 2: Create `src/components/RecipeReviewForm.tsx`**

```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ParsedRecipe } from '@/lib/parsers/types'

export function RecipeReviewForm({ recipe, onCancel }: { recipe: ParsedRecipe; onCancel: () => void }) {
  const router = useRouter()
  const [form, setForm] = useState(recipe)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipe: form }),
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

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input type="text" value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Default Servings</label>
        <input type="number" min={1} value={form.defaultServings}
          onChange={(e) => setForm({ ...form, defaultServings: parseInt(e.target.value) || 1 })}
          className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Ingredients ({form.ingredients.length})</h3>
        <ul className="space-y-1 text-sm text-gray-700">
          {form.ingredients.map((ing, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-gray-400 w-20 shrink-0">{ing.quantity} {ing.unit}</span>
              <span>{ing.name}</span>
              {ing.notes && <span className="text-gray-400">({ing.notes})</span>}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Steps ({form.steps.length})</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
          {form.steps.map((step, i) => <li key={i}>{step}</li>)}
        </ol>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3">
        <button onClick={handleSave} disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium">
          {saving ? 'Saving...' : 'Save Recipe'}
        </button>
        <button onClick={onCancel}
          className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm">
          Cancel
        </button>
      </div>
    </div>
  )
}
```

**Step 3: Create `src/app/import/page.tsx`**

```tsx
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ImportForm } from '@/components/ImportForm'
import { RecipeReviewForm } from '@/components/RecipeReviewForm'
import type { ParsedRecipe } from '@/lib/parsers/types'

export default function ImportPage() {
  const [parsed, setParsed] = useState<ParsedRecipe | null>(null)
  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">← Back</Link>
        <h1 className="text-2xl font-bold text-gray-900">Import Recipe</h1>
      </div>
      {!parsed
        ? <ImportForm onParsed={setParsed} />
        : <RecipeReviewForm recipe={parsed} onCancel={() => setParsed(null)} />}
    </main>
  )
}
```

**Step 4: Commit**

```bash
git add src/app/import/ src/components/ImportForm.tsx src/components/RecipeReviewForm.tsx
git commit -m "feat: add import page with URL input and recipe review form"
```

---

### Task 11: Recipe detail page with serving scaling + substitutes

**Files:**
- Create: `src/components/ServingControl.tsx`
- Create: `src/components/IngredientRow.tsx`
- Create: `src/components/RecipeDetail.tsx`
- Create: `src/app/recipes/[id]/page.tsx`

**Step 1: Create `src/components/ServingControl.tsx`**

```tsx
'use client'

export function ServingControl({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">Servings:</span>
      <button onClick={() => onChange(Math.max(1, value - 1))}
        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-lg">−</button>
      <span className="w-8 text-center font-medium">{value}</span>
      <button onClick={() => onChange(value + 1)}
        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-lg">+</button>
    </div>
  )
}
```

**Step 2: Create `src/components/IngredientRow.tsx`**

```tsx
'use client'
import { useState } from 'react'
import { scaleQuantity } from '@/lib/scaling'

type Props = {
  id: string; name: string; quantity: number | null; unit: string | null
  notes: string | null; defaultServings: number; currentServings: number
}

export function IngredientRow({ id, name, quantity, unit, notes, defaultServings, currentServings }: Props) {
  const [substitutes, setSubstitutes] = useState<string[] | null>(null)
  const [loading, setLoading] = useState(false)
  const scaledQty = scaleQuantity(quantity, defaultServings, currentServings)

  async function toggleSubstitutes() {
    if (substitutes !== null) { setSubstitutes(null); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/ingredients/${id}/substitutes`)
      const data = await res.json()
      setSubstitutes(data.substitutes ?? [])
    } finally {
      setLoading(false)
    }
  }

  return (
    <li className="py-2 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3">
        <span className="text-gray-400 w-20 shrink-0 text-sm">{scaledQty ?? ''} {unit}</span>
        <span className="flex-1 text-gray-900">{name}</span>
        {notes && <span className="text-gray-400 text-sm">({notes})</span>}
        <button onClick={toggleSubstitutes} className="text-xs text-blue-600 hover:underline shrink-0">
          {loading ? '...' : substitutes !== null ? 'Hide' : 'Substitutes'}
        </button>
      </div>
      {substitutes !== null && (
        <div className="mt-1 pl-20">
          {substitutes.length === 0
            ? <p className="text-sm text-gray-400">No substitutes found.</p>
            : <ul className="text-sm text-gray-600 list-disc list-inside space-y-0.5">
                {substitutes.map((s, i) => <li key={i}>{s}</li>)}
              </ul>}
        </div>
      )}
    </li>
  )
}
```

**Step 3: Create `src/components/RecipeDetail.tsx`**

```tsx
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ServingControl } from './ServingControl'
import { IngredientRow } from './IngredientRow'

type Recipe = {
  id: string; title: string; description: string | null; imageUrl: string | null
  sourceUrl: string; defaultServings: number; tags: string[]
  ingredients: Array<{ id: string; name: string; quantity: number | null; unit: string | null; notes: string | null }>
  steps: string[]
}

export function RecipeDetail({ recipe }: { recipe: Recipe }) {
  const [servings, setServings] = useState(recipe.defaultServings)
  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 mb-6 block">← Back</Link>
      {recipe.imageUrl && (
        <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-64 object-cover rounded-xl mb-6" />
      )}
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{recipe.title}</h1>
      <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
        View source
      </a>
      {recipe.description && <p className="text-gray-600 text-sm mt-3">{recipe.description}</p>}

      <div className="mt-6 mb-4">
        <ServingControl value={servings} onChange={setServings} />
      </div>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Ingredients</h2>
        <ul>
          {recipe.ingredients.map((ing) => (
            <IngredientRow key={ing.id} {...ing} defaultServings={recipe.defaultServings} currentServings={servings} />
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Instructions</h2>
        <ol className="space-y-3">
          {recipe.steps.map((step, i) => (
            <li key={i} className="flex gap-4">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-medium shrink-0 mt-0.5">
                {i + 1}
              </span>
              <p className="text-gray-700 text-sm leading-relaxed">{step}</p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  )
}
```

**Step 4: Create `src/app/recipes/[id]/page.tsx`**

```tsx
import { getRecipe } from '@/lib/recipes'
import { notFound } from 'next/navigation'
import { RecipeDetail } from '@/components/RecipeDetail'

export default async function RecipePage({ params }: { params: { id: string } }) {
  const recipe = await getRecipe(params.id)
  if (!recipe) notFound()
  return <RecipeDetail recipe={recipe} />
}
```

**Step 5: Commit**

```bash
git add src/components/ServingControl.tsx src/components/IngredientRow.tsx src/components/RecipeDetail.tsx src/app/recipes/
git commit -m "feat: add recipe detail page with serving scaling and substitutes"
```

---

### Task 12: E2E tests

**Files:**
- Create: `tests/e2e/import-recipe.spec.ts`
- Create: `tests/e2e/serving-scale.spec.ts`

**Before starting:** Ensure `npm run dev` starts successfully with API keys in `.env.local`. These tests make real network requests.

**Step 1: Create `tests/e2e/import-recipe.spec.ts`**

```typescript
import { test, expect } from '@playwright/test'

test('imports a recipe from a URL and saves it', async ({ page }) => {
  await page.goto('/import')
  await page.fill('input[type="url"]', 'https://www.allrecipes.com/recipe/158968/spinach-and-feta-turkey-burgers/')
  await page.click('button[type="submit"]')

  // Wait for review form to appear (parsing may take a few seconds)
  await expect(page.locator('text=Save Recipe')).toBeVisible({ timeout: 20000 })

  // Title field should be populated
  const titleInput = page.locator('input[type="text"]').first()
  await expect(titleInput).not.toHaveValue('')

  await page.click('text=Save Recipe')

  // Should redirect to recipe detail page
  await expect(page).toHaveURL(/\/recipes\//, { timeout: 10000 })
  await expect(page.locator('h1')).not.toBeEmpty()
})
```

**Step 2: Create `tests/e2e/serving-scale.spec.ts`**

```typescript
import { test, expect } from '@playwright/test'

test('serving size control updates ingredient quantities', async ({ page }) => {
  await page.goto('/')

  // Click the first recipe card
  const firstCard = page.locator('a[href^="/recipes/"]').first()
  await expect(firstCard).toBeVisible({ timeout: 5000 })
  await firstCard.click()
  await expect(page).toHaveURL(/\/recipes\//)

  // Get initial serving count
  const servingDisplay = page.locator('span.font-medium').filter({ hasText: /^\d+$/ })
  const initial = parseInt((await servingDisplay.textContent()) ?? '4')

  // Get an initial ingredient quantity text
  const firstQty = page.locator('li .text-gray-400').first()
  const initialQty = await firstQty.textContent()

  // Increment servings
  await page.click('button:has-text("+")')
  expect(parseInt((await servingDisplay.textContent()) ?? '5')).toBe(initial + 1)

  // Ingredient quantity should have changed
  await expect(firstQty).not.toHaveText(initialQty ?? '')
})
```

**Step 3: Run E2E tests**

Start dev server in another terminal: `npm run dev`

Then:
```bash
npm run test:e2e
```
Expected: PASS

**Step 4: Commit**

```bash
git add tests/e2e/
git commit -m "test: add Playwright E2E tests for import and serving scale"
```

---

### Task 13: Update CLAUDE.md

**Step 1: Replace `CLAUDE.md`**

```markdown
# CLAUDE.md

## Commands

- `npm run dev` — start dev server at http://localhost:3000
- `npm test` — run unit and integration tests (Vitest)
- `npm run test:e2e` — run E2E tests (Playwright, requires dev server)
- `npx prisma studio` — open database browser
- `npx prisma migrate dev --name <name>` — create a new migration

## Architecture

- **Framework:** Next.js 14 App Router
- **Database:** SQLite via Prisma ORM (`prisma/dev.db`)
- **Key files:**
  - `src/lib/prisma.ts` — Prisma client singleton
  - `src/lib/recipes.ts` — recipe CRUD service
  - `src/lib/scaling.ts` — serving size math (pure, no DB)
  - `src/lib/parsers/index.ts` — URL parsing orchestrator
  - `src/lib/parsers/spoonacular.ts` — Spoonacular API (parse fallback + substitutes)
  - `src/lib/parsers/instagram.ts` — Instagram caption scraper

## Environment Variables

Copy `.env.local.example` → `.env.local` and fill in:
- `SPOONACULAR_API_KEY` — https://spoonacular.com/food-api (free tier)
- `RAPIDAPI_KEY` — https://rapidapi.com (Instagram scraper, free tier)

Prisma reads `DATABASE_URL` from `.env` (not `.env.local`).

## Testing

- Unit: `tests/unit/`
- Integration: `tests/integration/` (uses `tests/integration/test.db`)
- E2E: `tests/e2e/` (real network calls, needs API keys)
```

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with commands and architecture"
```
