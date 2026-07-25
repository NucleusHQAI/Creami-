import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RecipeSourceCard } from '@/features/recipes/components/RecipeSourceCard'
import type { RecipeSource } from '@/types/domain'

function source(url: string | null): RecipeSource {
  return {
    id: 'source',
    recipe_id: 'recipe',
    source_url: url,
    source_title: 'Original recipe',
    source_site: 'example.com',
    adaptation_summary: 'Adapted around Everyday creamy.',
    retrieved_at: null,
    created_at: '',
  }
}

describe('RecipeSourceCard', () => {
  it('renders safe links with external-link protection', () => {
    render(<RecipeSourceCard sources={[source('https://example.com/recipe')]} />)
    const link = screen.getByRole('link', { name: /original recipe/i })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders an unsafe saved URL only as text', () => {
    render(<RecipeSourceCard sources={[source('javascript:alert(1)')]} />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText('Original recipe')).toBeInTheDocument()
  })
})
