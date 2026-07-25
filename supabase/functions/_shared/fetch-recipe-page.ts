import {
  UrlSecurityError,
  validatePublicRecipeUrl,
  type DnsResolver,
} from './recipe-url-security.ts'

const MAX_REDIRECTS = 3
const MAX_RESPONSE_BYTES = 1_000_000
const TIMEOUT_MS = 8_000

export type ExtractionErrorCode =
  | 'invalid_url'
  | 'blocked_host'
  | 'timeout'
  | 'too_large'
  | 'unsupported_content'
  | 'fetch_failed'
  | 'no_structured_recipe'
  | 'invalid_request'

export class RecipeExtractionError extends Error {
  constructor(
    readonly code: ExtractionErrorCode,
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'RecipeExtractionError'
  }
}

async function readLimitedText(response: Response): Promise<string> {
  const declaredLength = Number(response.headers.get('content-length'))
  if (Number.isFinite(declaredLength) && declaredLength > MAX_RESPONSE_BYTES) {
    throw new RecipeExtractionError('too_large', 'The recipe page is too large to import.', 413)
  }

  const reader = response.body?.getReader()
  if (!reader) return ''
  const chunks: Uint8Array[] = []
  let total = 0
  let isReading = true
  while (isReading) {
    const { done, value } = await reader.read()
    if (done) {
      isReading = false
      continue
    }
    total += value.byteLength
    if (total > MAX_RESPONSE_BYTES) {
      await reader.cancel()
      throw new RecipeExtractionError('too_large', 'The recipe page is too large to import.', 413)
    }
    chunks.push(value)
  }

  const combined = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    combined.set(chunk, offset)
    offset += chunk.byteLength
  }
  return new TextDecoder().decode(combined)
}

export async function fetchRecipePage(
  inputUrl: string,
  resolveDns: DnsResolver,
  fetcher: typeof fetch = fetch,
): Promise<{ html: string; finalUrl: string }> {
  let current: URL
  try {
    current = await validatePublicRecipeUrl(inputUrl, resolveDns)
  } catch (error) {
    if (error instanceof UrlSecurityError) {
      const invalid = /complete|http/i.test(error.message)
      throw new RecipeExtractionError(invalid ? 'invalid_url' : 'blocked_host', error.message, 400)
    }
    throw error
  }

  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
    let response: Response
    try {
      response = await fetcher(current, {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          Accept: 'text/html,application/xhtml+xml',
          'User-Agent': 'CREAMi-Recipe-Adapter/1.0',
        },
      })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new RecipeExtractionError(
          'timeout',
          'The recipe website took too long to respond.',
          504,
        )
      }
      throw new RecipeExtractionError(
        'fetch_failed',
        'The recipe website could not be fetched.',
        502,
      )
    } finally {
      clearTimeout(timeout)
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      if (!location || redirect === MAX_REDIRECTS) {
        throw new RecipeExtractionError(
          'fetch_failed',
          'The recipe website redirected too many times.',
          502,
        )
      }
      try {
        current = await validatePublicRecipeUrl(new URL(location, current).toString(), resolveDns)
      } catch (error) {
        throw new RecipeExtractionError(
          'blocked_host',
          error instanceof Error ? error.message : 'The redirected address is not safe.',
          400,
        )
      }
      continue
    }

    if (!response.ok) {
      throw new RecipeExtractionError('fetch_failed', 'The recipe website returned an error.', 502)
    }
    const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
      throw new RecipeExtractionError(
        'unsupported_content',
        'That link did not return a supported recipe page.',
        415,
      )
    }

    return { html: await readLimitedText(response), finalUrl: current.toString() }
  }

  throw new RecipeExtractionError('fetch_failed', 'The recipe website could not be fetched.', 502)
}
