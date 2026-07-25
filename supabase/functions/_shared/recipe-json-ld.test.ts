import { describe, expect, it } from 'vitest'
import { extractRecipeJsonLd } from './recipe-json-ld'

function page(json: unknown): string {
  return `<html><script type="application/ld+json">${JSON.stringify(json)}</script></html>`
}

describe('extractRecipeJsonLd', () => {
  it.each([
    { '@type': 'Recipe', name: 'Single', recipeIngredient: ['1 g cocoa'] },
    [{ '@type': ['Thing', 'Recipe'], name: 'Array', recipeIngredient: ['1 g cocoa'] }],
    {
      '@graph': [
        { '@type': 'Thing', name: 'Ignore' },
        { '@type': 'Recipe', name: 'Graph', recipeIngredient: [{ name: '1 g cocoa' }] },
      ],
    },
  ])('supports schema.org JSON-LD shapes', (json) => {
    expect(extractRecipeJsonLd(page(json), 'https://recipes.example/test')?.ingredients).toEqual([
      { original: '1 g cocoa' },
    ])
  })

  it('chooses the most complete recipe deterministically', () => {
    const result = extractRecipeJsonLd(
      page([
        { '@type': 'Recipe', name: 'Short', recipeIngredient: ['1 g cocoa'] },
        {
          '@type': 'Recipe',
          name: 'Complete',
          description: 'The fuller recipe.',
          recipeIngredient: ['1 g cocoa', '2 g sprinkles'],
        },
      ]),
      'https://recipes.example/test',
    )
    expect(result?.name).toBe('Complete')
  })

  it('ignores malformed blocks and never returns nutrition or method data', () => {
    const html = `<script type="application/ld+json">{broken</script>${page({
      '@type': 'Recipe',
      name: 'Safe',
      nutrition: { calories: '900 kcal' },
      recipeInstructions: 'Copyrighted method',
      recipeIngredient: ['1 g cocoa'],
    })}`
    const result = extractRecipeJsonLd(html, 'https://recipes.example/test')
    expect(result).not.toHaveProperty('nutrition')
    expect(result).not.toHaveProperty('recipeInstructions')
  })

  it('returns null without a complete Recipe object', () => {
    expect(extractRecipeJsonLd(page({ '@type': 'Thing' }), 'https://example.com')).toBeNull()
  })
})
