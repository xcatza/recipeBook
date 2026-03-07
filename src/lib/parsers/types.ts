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
