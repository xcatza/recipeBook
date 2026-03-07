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
