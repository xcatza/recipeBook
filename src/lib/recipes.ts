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
    include: { ingredients: true, tags: { include: { tag: true } } },
  })

  // Resolve Spoonacular IDs in background — non-blocking
  resolveSpoonacularIds(recipe.ingredients).catch(console.error)

  return serialize(recipe)
}

async function resolveSpoonacularIds(ingredients: Array<{ id: string; name: string }>) {
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
