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
