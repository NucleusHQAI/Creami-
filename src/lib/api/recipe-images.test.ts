import { describe, expect, it } from 'vitest'
import {
  MAX_RECIPE_IMAGE_BYTES,
  getRecipeImageUrl,
  isUploadedRecipeImage,
  validateRecipeImage,
} from '@/lib/api/recipe-images'

describe('recipe image helpers', () => {
  it('accepts supported image types within the size limit', () => {
    const file = new File(['image'], 'sundae.webp', { type: 'image/webp' })
    expect(validateRecipeImage(file)).toBeNull()
  })

  it('rejects unsupported image types', () => {
    const file = new File(['image'], 'sundae.gif', { type: 'image/gif' })
    expect(validateRecipeImage(file)).toBe('Choose a JPG, PNG or WebP image.')
  })

  it('rejects oversized images', () => {
    const file = new File([new Uint8Array(MAX_RECIPE_IMAGE_BYTES + 1)], 'sundae.jpg', {
      type: 'image/jpeg',
    })
    expect(validateRecipeImage(file)).toBe('Choose an image smaller than 5 MB.')
  })

  it('keeps bundled paths local and recognises uploaded paths', () => {
    expect(getRecipeImageUrl('/recipe-images/vanilla-custard.webp')).toBe(
      '/recipe-images/vanilla-custard.webp',
    )
    expect(isUploadedRecipeImage('/recipe-images/vanilla-custard.webp')).toBe(false)
    expect(isUploadedRecipeImage('uploads/recipe.webp')).toBe(true)
  })
})
