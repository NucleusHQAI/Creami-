// Pure — no React. `ingredients.category` is a free-text key ('nut-butter',
// 'dairy', …), not a foreign key into a table, so there is nowhere in the
// database to store a display label. This formats the key itself rather
// than hardcoding a lookup table that would drift from whatever categories
// actually exist in the data.

export function formatCategoryLabel(category: string): string {
  return category
    .split('-')
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(' ')
}
