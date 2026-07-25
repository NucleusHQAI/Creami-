import type { ExtractedRecipePayload } from './recipe-extraction-types.ts'

type JsonObject = Record<string, unknown>

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asString(value: unknown, maxLength: number): string | null {
  if (typeof value === 'string') {
    const trimmed = value.replace(/\s+/g, ' ').trim()
    return trimmed ? trimmed.slice(0, maxLength) : null
  }
  if (typeof value === 'number') return String(value)
  return null
}

function hasRecipeType(value: unknown): boolean {
  if (typeof value === 'string') return value.toLowerCase() === 'recipe'
  if (Array.isArray(value)) return value.some(hasRecipeType)
  return false
}

function collectObjects(value: unknown, output: JsonObject[]): void {
  if (Array.isArray(value)) {
    for (const item of value) collectObjects(item, output)
    return
  }
  if (!isObject(value)) return

  output.push(value)
  const graph = value['@graph']
  if (graph) collectObjects(graph, output)
}

function ingredientText(value: unknown): string | null {
  const direct = asString(value, 500)
  if (direct) return direct
  if (!isObject(value)) return null
  return asString(value.name, 500) ?? asString(value.text, 500) ?? asString(value.value, 500)
}

function readIngredients(value: unknown): string[] {
  const values = Array.isArray(value) ? value : value === undefined ? [] : [value]
  return values.map(ingredientText).filter((line): line is string => line !== null)
}

function readYield(value: unknown): string | null {
  if (Array.isArray(value)) {
    return value.map((item) => asString(item, 100)).find((item) => item !== null) ?? null
  }
  return asString(value, 100)
}

function scoreRecipe(value: JsonObject): number {
  const ingredients = readIngredients(value.recipeIngredient)
  return (
    ingredients.length * 10 +
    (asString(value.name, 200) ? 5 : 0) +
    (asString(value.description, 500) ? 2 : 0) +
    (readYield(value.recipeYield) ? 1 : 0)
  )
}

function parseScripts(html: string): unknown[] {
  const pattern =
    /<script\b[^>]*type\s*=\s*(?:"application\/ld\+json"|'application\/ld\+json'|application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/gi
  const parsed: unknown[] = []
  for (const match of html.matchAll(pattern)) {
    const source = match[1]?.trim()
    if (!source) continue
    try {
      parsed.push(JSON.parse(source))
    } catch {
      // A page can contain one broken JSON-LD block alongside a valid one.
    }
  }
  return parsed
}

export function extractRecipeJsonLd(
  html: string,
  finalUrl: string,
  retrievedAt = new Date().toISOString(),
): ExtractedRecipePayload | null {
  const objects: JsonObject[] = []
  for (const parsed of parseScripts(html)) collectObjects(parsed, objects)

  const recipes = objects
    .filter((value) => hasRecipeType(value['@type']))
    .map((value, index) => ({ value, index, score: scoreRecipe(value) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)

  const selected = recipes[0]?.value
  if (!selected) return null

  const name = asString(selected.name, 200)
  const ingredients = readIngredients(selected.recipeIngredient)
  if (!name || ingredients.length === 0) return null

  const url = new URL(finalUrl)
  return {
    source: {
      url: finalUrl,
      title: name,
      site: url.hostname.replace(/^www\./i, ''),
      retrievedAt,
    },
    name,
    description: asString(selected.description, 500),
    recipeYield: readYield(selected.recipeYield),
    ingredients: ingredients.map((original) => ({ original })),
  }
}
