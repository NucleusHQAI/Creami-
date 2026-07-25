import { describe, expect, it, vi } from 'vitest'
import { fetchRecipePage, RecipeExtractionError } from './fetch-recipe-page'
import { validatePublicRecipeUrl, type DnsResolver } from './recipe-url-security'

const publicResolver: DnsResolver = async (_hostname, type) =>
  type === 'A' ? ['93.184.216.34'] : []

describe('validatePublicRecipeUrl', () => {
  it.each([
    'file:///etc/passwd',
    'http://user:pass@example.com',
    'http://localhost/recipe',
    'http://127.0.0.1/recipe',
    'http://10.0.0.1/recipe',
    'http://169.254.169.254/metadata',
    'https://[::1]/recipe',
    'https://example.com:8443/recipe',
  ])('blocks %s', async (url) => {
    await expect(validatePublicRecipeUrl(url, publicResolver)).rejects.toThrow()
  })

  it('blocks a public hostname resolving to a private address', async () => {
    await expect(
      validatePublicRecipeUrl('https://example.com/recipe', async () => ['192.168.1.10']),
    ).rejects.toThrow()
  })
})

describe('fetchRecipePage', () => {
  it('revalidates redirects and blocks a private redirect target', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        new Response(null, { status: 302, headers: { location: 'http://127.0.0.1/secret' } }),
      )
    await expect(
      fetchRecipePage('https://example.com', publicResolver, fetcher),
    ).rejects.toMatchObject({ code: 'blocked_host' })
  })

  it('rejects non-HTML and oversized responses', async () => {
    await expect(
      fetchRecipePage(
        'https://example.com',
        publicResolver,
        vi
          .fn()
          .mockResolvedValue(
            new Response('{}', { headers: { 'content-type': 'application/json' } }),
          ),
      ),
    ).rejects.toMatchObject({ code: 'unsupported_content' })

    await expect(
      fetchRecipePage(
        'https://example.com',
        publicResolver,
        vi.fn().mockResolvedValue(
          new Response('x', {
            headers: { 'content-type': 'text/html', 'content-length': '1000001' },
          }),
        ),
      ),
    ).rejects.toMatchObject({ code: 'too_large' })
  })

  it('returns supported HTML', async () => {
    const result = await fetchRecipePage(
      'https://example.com/recipe',
      publicResolver,
      vi
        .fn()
        .mockResolvedValue(
          new Response('<html></html>', { headers: { 'content-type': 'text/html' } }),
        ),
    )
    expect(result.finalUrl).toBe('https://example.com/recipe')
  })

  it('exposes stable error codes', () => {
    expect(new RecipeExtractionError('timeout', 'Timed out', 504).code).toBe('timeout')
  })
})
