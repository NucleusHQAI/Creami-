export type DnsResolver = (hostname: string, type: 'A' | 'AAAA') => Promise<string[]>

function parseIpv4(value: string): number[] | null {
  const parts = value.split('.')
  if (parts.length !== 4) return null
  const numbers = parts.map(Number)
  if (numbers.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return null
  return numbers
}

function isBlockedIpv4(value: string): boolean {
  const parts = parseIpv4(value)
  if (!parts) return false
  const [first = 0, second = 0, third = 0] = parts
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 0 && third === 0) ||
    (first === 192 && second === 0 && third === 2) ||
    (first === 192 && second === 168) ||
    (first === 198 && (second === 18 || second === 19)) ||
    (first === 198 && second === 51 && third === 100) ||
    (first === 203 && second === 0 && third === 113) ||
    first >= 224
  )
}

function isBlockedIpv6(value: string): boolean {
  const normalised = value.toLowerCase().replace(/^\[|\]$/g, '')
  if (!normalised.includes(':')) return false
  if (
    normalised === '::' ||
    normalised === '::1' ||
    normalised.startsWith('fc') ||
    normalised.startsWith('fd') ||
    /^fe[89ab]/.test(normalised) ||
    normalised.startsWith('2001:db8:')
  ) {
    return true
  }
  const mapped = normalised.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/)
  return mapped ? isBlockedIpv4(mapped[1] ?? '') : false
}

export function isBlockedIp(value: string): boolean {
  return isBlockedIpv4(value) || isBlockedIpv6(value)
}

export class UrlSecurityError extends Error {
  readonly code = 'blocked_host'

  constructor(message = 'This address cannot be fetched safely.') {
    super(message)
    this.name = 'UrlSecurityError'
  }
}

export async function validatePublicRecipeUrl(
  value: string,
  resolveDns: DnsResolver,
): Promise<URL> {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new UrlSecurityError('Enter a complete HTTP or HTTPS recipe link.')
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new UrlSecurityError('Only HTTP and HTTPS recipe links are supported.')
  }
  if (url.username || url.password) {
    throw new UrlSecurityError('Recipe links cannot contain a username or password.')
  }
  if (
    (url.port && url.protocol === 'http:' && url.port !== '80') ||
    (url.port && url.protocol === 'https:' && url.port !== '443')
  ) {
    throw new UrlSecurityError('Recipe links must use the standard web port.')
  }

  const hostname = url.hostname.toLowerCase().replace(/\.$/, '')
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    isBlockedIp(hostname)
  ) {
    throw new UrlSecurityError()
  }

  const addresses = (
    await Promise.all([
      resolveDns(hostname, 'A').catch(() => []),
      resolveDns(hostname, 'AAAA').catch(() => []),
    ])
  ).flat()
  if (addresses.length === 0) {
    throw new UrlSecurityError('The recipe website could not be found.')
  }
  if (addresses.some(isBlockedIp)) throw new UrlSecurityError()
  return url
}
