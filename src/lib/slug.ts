/** Lowercase, hyphenated slug from free text — the editor's starting point for the slug field. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip combining diacritics left by NFKD (café → cafe)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Appends -2, -3, … until the slug is not in `taken`. Leaves an already-unique slug alone. */
export function ensureUniqueSlug(slug: string, taken: ReadonlySet<string>): string {
  if (!taken.has(slug)) {
    return slug
  }
  let suffix = 2
  while (taken.has(`${slug}-${suffix}`)) {
    suffix += 1
  }
  return `${slug}-${suffix}`
}
