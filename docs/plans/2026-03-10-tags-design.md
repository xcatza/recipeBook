# Tags & "I'm Feeling Like" Design

## Problem
Users want to tag recipes with taste profiles at import time or later, and quickly filter their collection by mood/craving.

## Decisions
- Tag input: preset chips + freeform typed + autocomplete from existing tags
- Editable: review form (import) and recipe detail page
- "I'm feeling like": always-visible dropdown on home page; shows "No taste tags yet" when empty
- Filter + macro sort are independent and composable

## Data & API

No schema changes — `Tag` and `TagsOnRecipes` already exist.

Two new endpoints:
- `GET /api/tags` — returns all tag names (for autocomplete + dropdown)
- `PATCH /api/recipes/[id]/tags` — replaces a recipe's full tag set

`POST /api/recipes` already accepts `tags: string[]` — unchanged.

## TagInput Component

Single reusable component used in both review form and detail page.

**Preset chips** (fixed list, toggle on/off):
`Comfort`, `Quick`, `Spicy`, `Light`, `Healthy`, `Indulgent`, `Vegetarian`, `Vegan`, `Meal Prep`, `Date Night`

**Freeform input**: text field with autocomplete dropdown from `GET /api/tags` as user types. Enter or comma confirms a tag.

**Active tags**: shown as removable pills (× to remove). Presets and custom tags look identical once added.

**On review form**: optional, no auto-save — tags sent with `POST /api/recipes` on save.

**On detail page**: auto-saves via `PATCH /api/recipes/[id]/tags` with 800ms debounce (same pattern as notes). Shows subtle "Saved" indicator.

## "I'm Feeling Like" Dropdown

Sits on the home page alongside the macro sort bar. Always visible.

- Populated from `GET /api/tags`
- When no tags exist: single disabled option "No taste tags yet"
- Selecting a tag filters the recipe grid client-side
- "All" option clears the filter
- Composable with macro sort (both can be active simultaneously)
