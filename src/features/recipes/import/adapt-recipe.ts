import { slugify } from '@/lib/slug'
import type { BaseWithIngredients, Category, Ingredient, IngredientUnit } from '@/types/domain'
import type {
  AdaptationDecision,
  AdaptationRuleData,
  AdaptedRecipeDraft,
  ExtractedRecipe,
} from '@/features/recipes/import/types'
import { normaliseSourceLine } from '@/features/recipes/import/normalise-source-line'

export interface AdaptRecipeInput {
  recipe: ExtractedRecipe
  bases: BaseWithIngredients[]
  ingredients: Ingredient[]
  categories: Category[]
  rules: AdaptationRuleData[]
}

function normaliseText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function findRule(text: string, rules: AdaptationRuleData[]): AdaptationRuleData | undefined {
  const normalised = normaliseText(text)
  return [...rules]
    .sort((a, b) => b.priority - a.priority || a.match_term.localeCompare(b.match_term))
    .find((rule) => normalised.includes(normaliseText(rule.match_term)))
}

function findIngredient(text: string, ingredients: Ingredient[]): Ingredient | undefined {
  const normalised = normaliseText(text)
  return ingredients.find(
    (ingredient) =>
      normaliseText(ingredient.name) === normalised ||
      normaliseText(ingredient.slug) === normalised ||
      normaliseText(ingredient.name.replace(/^0%\s*/, '')) === normalised,
  )
}

function suggestBase(
  recipe: ExtractedRecipe,
  bases: BaseWithIngredients[],
  rules: AdaptationRuleData[],
): BaseWithIngredients | undefined {
  const searchable = `${recipe.name} ${recipe.ingredients.map((line) => line.original).join(' ')}`
  const scores = new Map<string, number>()

  for (const rule of rules) {
    if (
      rule.action === 'base_hint' &&
      rule.suggested_base_id &&
      normaliseText(searchable).includes(normaliseText(rule.match_term))
    ) {
      scores.set(rule.suggested_base_id, (scores.get(rule.suggested_base_id) ?? 0) + rule.priority)
    }
  }

  const ranked = [...bases].sort((a, b) => {
    const scoreDifference = (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0)
    return scoreDifference || a.sort_order - b.sort_order || a.name.localeCompare(b.name)
  })

  const winner = ranked[0]
  if (winner && (scores.get(winner.id) ?? 0) > 0) return winner
  return bases.find((base) => base.key === 'everyday') ?? ranked[0]
}

function chooseCategory(
  recipe: ExtractedRecipe,
  base: BaseWithIngredients | undefined,
  categories: Category[],
): string {
  const text = normaliseText(
    `${recipe.name} ${recipe.ingredients.map((line) => line.original).join(' ')}`,
  )
  const key = /\bcoffee|espresso|mocha\b/.test(text)
    ? 'coffee'
    : /\bchocolate|cocoa|brownie\b/.test(text)
      ? 'chocolate'
      : base?.key === 'fruit' ||
          base?.key === 'cheesecake' ||
          /\bstrawberry|raspberry|blueberry|banana|mango|fruit\b/.test(text)
        ? 'fruit'
        : /\bbiscuit|cookie|cake|dessert|cheesecake\b/.test(text)
          ? 'bakery'
          : 'classic'
  return categories.find((category) => category.key === key)?.id ?? categories[0]?.id ?? ''
}

function inferRole(
  ingredient: Ingredient,
  suggested: 'addition' | 'mixin' | null,
): 'addition' | 'mixin' {
  if (suggested) return suggested
  return ['confectionery', 'biscuit', 'nuts'].includes(ingredient.category) ? 'mixin' : 'addition'
}

function displayQuantity(quantity: number, unit: IngredientUnit, name: string): string {
  const rounded = Number.isInteger(quantity)
    ? String(quantity)
    : String(Number(quantity.toFixed(1)))
  return `${rounded}${unit === 'item' ? ' ' : ''}${unit} ${name}`.replace('item ', '')
}

function profileFor(recipe: ExtractedRecipe): string {
  const description = recipe.description?.replace(/\s+/g, ' ').trim()
  if (description) return description.slice(0, 200)
  return `A CREAMi adaptation inspired by ${recipe.name}.`.slice(0, 200)
}

function summaryFor(decisions: AdaptationDecision[], baseName: string | undefined): string {
  const replaced = decisions.filter((decision) => decision.kind === 'replaced').length
  const covered = decisions.filter((decision) => decision.kind === 'covered_by_base').length
  const unresolved = decisions.filter((decision) => decision.kind === 'unresolved').length
  return [
    baseName ? `Adapted around ${baseName}.` : 'Adapted around an existing base.',
    replaced ? `${replaced} UK replacement${replaced === 1 ? '' : 's'}.` : '',
    covered ? `${covered} source line${covered === 1 ? '' : 's'} covered by the base.` : '',
    unresolved ? `${unresolved} line${unresolved === 1 ? '' : 's'} left for review.` : '',
  ]
    .filter(Boolean)
    .join(' ')
}

export function adaptRecipe({
  recipe,
  bases,
  ingredients,
  categories,
  rules,
}: AdaptRecipeInput): AdaptedRecipeDraft {
  const base = suggestBase(recipe, bases, rules)
  const baseIngredientIds = new Set(base?.ingredients.map((line) => line.ingredient_id) ?? [])
  if (base?.fill_ingredient_id) baseIngredientIds.add(base.fill_ingredient_id)

  const additions: AdaptedRecipeDraft['values']['additions'] = []
  const mixins: AdaptedRecipeDraft['values']['mixins'] = []
  const decisions: AdaptationDecision[] = []

  for (const source of recipe.ingredients) {
    const initial = normaliseSourceLine(source.original)
    const exactIngredient = findIngredient(initial.ingredientText, ingredients)
    const rule = findRule(`${initial.ingredientText} ${source.original}`, rules)
    const replacement = rule?.replacement_ingredient_id
      ? ingredients.find((ingredient) => ingredient.id === rule.replacement_ingredient_id)
      : undefined
    const ingredient = exactIngredient ?? replacement

    if (rule?.action === 'omit' || (rule?.action === 'base_hint' && !ingredient)) {
      decisions.push({
        kind: 'covered_by_base',
        sourceLine: source.original,
        reason: rule.reason,
        ingredientId: null,
        ingredientName: null,
        role: null,
      })
      continue
    }

    if (!ingredient) {
      decisions.push({
        kind: 'unresolved',
        sourceLine: source.original,
        reason:
          'No existing ingredient was a confident match. Choose one from the library, add a no-macro note or ignore this line.',
        ingredientId: null,
        ingredientName: null,
        role: null,
      })
      continue
    }

    if (baseIngredientIds.has(ingredient.id)) {
      decisions.push({
        kind: 'covered_by_base',
        sourceLine: source.original,
        reason: `${ingredient.name} is already supplied by the selected base.`,
        ingredientId: ingredient.id,
        ingredientName: ingredient.name,
        role: null,
      })
      continue
    }

    const normalised = normaliseSourceLine(source.original, ingredient)
    if (normalised.warning || normalised.quantity === null || normalised.unit === null) {
      decisions.push({
        kind: 'unresolved',
        sourceLine: source.original,
        reason:
          normalised.warning ??
          'The quantity or unit needs review before this ingredient can be added.',
        ingredientId: ingredient.id,
        ingredientName: ingredient.name,
        role: null,
      })
      continue
    }

    const role = inferRole(ingredient, rule?.suggested_role ?? null)
    const target = role === 'mixin' ? mixins : additions
    target.push({
      ingredientId: ingredient.id,
      freeText: null,
      quantity: normalised.quantity,
      unit: normalised.unit,
      display: displayQuantity(normalised.quantity, normalised.unit, ingredient.name),
      optional: false,
    })
    decisions.push({
      kind: replacement && !exactIngredient ? 'replaced' : 'mapped',
      sourceLine: source.original,
      reason:
        replacement && !exactIngredient
          ? (rule?.reason ?? `Uses ${ingredient.name} from your ingredient library.`)
          : `Matched ${ingredient.name} in your ingredient library.`,
      ingredientId: ingredient.id,
      ingredientName: ingredient.name,
      role,
    })
  }

  return {
    values: {
      name: recipe.name.slice(0, 80),
      slug: slugify(recipe.name),
      categoryId: chooseCategory(recipe, base, categories),
      baseId: base?.id ?? '',
      profile: profileFor(recipe),
      additions,
      mixins,
      mixinNote: '',
      tip: '',
      methodOverride: '',
      macroOverrideKcal: null,
      macroOverrideProteinG: null,
    },
    decisions,
    warnings: decisions
      .filter((decision) => decision.kind === 'unresolved')
      .map((decision) => ({ sourceLine: decision.sourceLine, message: decision.reason })),
    source: {
      sourceUrl: recipe.source.url,
      sourceTitle: recipe.source.title ?? recipe.name,
      sourceSite: recipe.source.site,
      adaptationSummary: summaryFor(decisions, base?.name),
      retrievedAt: recipe.source.retrievedAt,
    },
  }
}
