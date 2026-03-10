export type ParsedIngredient = {
  name: string
  quantity: number | null
  unit: string | null
  notes: string | null
}

export type ParsedNutrition = {
  calories: number | null
  protein: number | null
  carbs: number | null
  fat: number | null
  fibre: number | null
  sugar: number | null
  sodium: number | null
}

export type ParsedRecipe = {
  title: string
  description: string | null
  imageUrl: string | null
  defaultServings: number
  ingredients: ParsedIngredient[]
  steps: string[]
  sourceUrl: string
  nutrition: ParsedNutrition | null
}
