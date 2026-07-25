import { describe, expect, it } from 'vitest'
import { ensureUniqueSlug, slugify } from '@/lib/slug'

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Vanilla Custard')).toBe('vanilla-custard')
  })

  it('strips punctuation', () => {
    expect(slugify("Nan's Piña Colada!")).toBe('nan-s-pina-colada')
  })

  it('trims stray hyphens', () => {
    expect(slugify('  --Mango Lassi--  ')).toBe('mango-lassi')
  })
})

describe('ensureUniqueSlug', () => {
  it('leaves an already-unique slug alone', () => {
    expect(ensureUniqueSlug('mango-lassi', new Set(['vanilla-custard']))).toBe('mango-lassi')
  })

  it('appends -2 on first collision', () => {
    expect(ensureUniqueSlug('mango-lassi', new Set(['mango-lassi']))).toBe('mango-lassi-2')
  })

  it('keeps incrementing past multiple collisions', () => {
    const taken = new Set(['mango-lassi', 'mango-lassi-2', 'mango-lassi-3'])
    expect(ensureUniqueSlug('mango-lassi', taken)).toBe('mango-lassi-4')
  })
})
