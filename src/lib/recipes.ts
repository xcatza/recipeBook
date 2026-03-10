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
        create: tags.map((name) => ({
          tag: {
            connectOrCreate: {
              where: { name },
              create: { name },
            },
          },
        })),
      },
    },
    include: { ingredients: true, tags: { include: { tag: true } }, nutrition: true },
  })

  // Resolve Spoonacular IDs in background — non-blocking
  resolveSpoonacularIds(recipe.ingredients).catch(console.error)

  if (parsed.nutrition) {
    // Store nutrition extracted directly from the page (no API call needed)
    storeNutrition(recipe.id, parsed.nutrition).catch(console.error)
  } else {
    // Fall back to Spoonacular nutrition fetch in background
    fetchAndStoreNutrition(recipe.id, parsed.sourceUrl).catch(console.error)
  }

  return serialize(recipe)
}

async function resolveSpoonacularIds(ingredients: Array<{ id: string; name: string }>) {
  for (const ing of ingredients) {
    const id = await resolveIngredientId(ing.name)
    if (id) await prisma.ingredient.update({ where: { id: ing.id }, data: { spoonacularId: id } })
  }
}

async function fetchAndStoreNutrition(recipeId: string, sourceUrl: string) {
  const { fetchNutritionFromUrl } = await import('./parsers/spoonacular')
  const nutrition = await fetchNutritionFromUrl(sourceUrl)
  if (nutrition) await storeNutrition(recipeId, nutrition)
}

export async function getRecipes() {
  const recipes = await prisma.recipe.findMany({
    include: { ingredients: true, tags: { include: { tag: true } }, nutrition: true },
    orderBy: { createdAt: 'desc' },
  })
  return recipes.map(serialize)
}

export async function getRecipe(id: string) {
  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: { ingredients: true, tags: { include: { tag: true } }, nutrition: true },
  })
  return recipe ? serialize(recipe) : null
}

export async function updateRecipe(id: string, data: { notes?: string | null }) {
  const recipe = await prisma.recipe.update({
    where: { id },
    data,
    include: { ingredients: true, tags: { include: { tag: true } }, nutrition: true },
  })
  return serialize(recipe)
}

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

export async function deleteRecipe(id: string) {
  await prisma.recipe.delete({ where: { id } })
}

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
