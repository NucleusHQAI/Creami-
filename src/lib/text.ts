/**
 * Splits a period-separated method blob (`app_settings.standard_method`, or
 * a recipe's `method_override`) into individual steps for a numbered list.
 * Both are stored as plain sentences with no other delimiter.
 */
export function splitIntoSteps(text: string): string[] {
  return text
    .split('. ')
    .map((step) => step.trim())
    .filter((step) => step.length > 0)
    .map((step) => (step.endsWith('.') ? step : `${step}.`))
}
