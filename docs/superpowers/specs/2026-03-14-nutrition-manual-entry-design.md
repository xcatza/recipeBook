# Nutrition Manual Entry — Design Spec

**Date:** 2026-03-14

## Problem

Some recipe sites (e.g. Serious Eats) block server-side fetches via Cloudflare, so JSON-LD nutrition extraction fails silently. Spoonacular fallback also fails for blocked sites. Users need a way to enter nutrition data manually — both at import time and when editing an existing recipe.

## Goals

- Allow manual nutrition entry during recipe import (optional, collapsed by default)
- Allow editing existing nutrition on the recipe detail page
- Allow entering nutrition manually when it's absent on the detail page

## Design

### Shared Component: `NutritionForm`

A new `src/components/NutritionForm.tsx` client component.

- Renders 7 number inputs in a 2-column grid: Calories (kcal), Protein (g), Carbs (g), Fat (g), Fibre (g), Sugar (g), Sodium (mg)
- Props: `initialValues`, `onSave(data)`, `onCancel()`
- Each field is optional — empty fields are sent as `null`
- Save button explicit (not auto-save) since it's a deliberate data entry action
- Matches existing design system (terracotta inputs, warm-white background, sage labels)

### Review Form (`RecipeReviewForm`)

- After the Tags section, add a collapsed nutrition block
- Default state: "Add nutrition ↓" button
- Clicking reveals `NutritionForm` with empty fields + "Remove" link to collapse
- On save: if any field filled, include `nutrition` in POST body; if all blank, send `nutrition: null`
- `saveRecipe` already handles storing nutrition when present — no service changes needed

### Recipe Detail (`RecipeDetail`)

**When nutrition exists:**
- Section heading row gets an "Edit" button
- Clicking swaps read-only grid for `NutritionForm` pre-filled with current values
- "Save" → `PATCH /api/recipes/[id]` with `{ nutrition: {...} }` → updates displayed grid
- "Cancel" → reverts to read-only grid

**When nutrition is absent:**
- Keep existing "Fetch nutrition info" button
- Add secondary "Enter manually" button next to it
- Clicking "Enter manually" expands `NutritionForm` inline with empty fields
- Same save flow as above

### API Changes

**`PATCH /api/recipes/[id]`** — add third route branch:
```
if (body.nutrition !== undefined) → storeNutrition(id, body.nutrition)
```
`storeNutrition` already exists and performs an upsert — no new function needed.

**`POST /api/recipes`** — pass `nutrition` from request body through to `saveRecipe`. Already handled by existing service when nutrition is present in the parsed recipe object.

## What Does Not Change

- Prisma schema (Nutrition model already exists)
- `storeNutrition` service function
- Spoonacular fallback ("Fetch nutrition info" button remains)
- Auto-extraction from JSON-LD

## Out of Scope

- Per-ingredient nutrition breakdown
- Nutrition calculations when scaling servings (values stored per-serving as entered)
