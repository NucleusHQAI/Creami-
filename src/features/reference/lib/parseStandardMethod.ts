// Pure — no React. Splits app_settings.standard_method into the five
// numbered appliance steps for the Method screen. The text lives in one
// editable field (the Settings textarea), so this reads it rather than
// duplicating the copy in the component — editing the method in Settings
// keeps this page honest without a second place to update.

export interface MethodStep {
  label: string
  text: string
}

const STEP_LABELS: Array<{ label: string; pattern: RegExp }> = [
  { label: 'Blend', pattern: /\bblend\b/i },
  { label: 'Fill', pattern: /\bfill\b/i },
  { label: 'Freeze', pattern: /\bfreeze\b/i },
  { label: 'Process', pattern: /\bprocess\b|\bre-?spin\b|lite ice cream/i },
  { label: 'Mix-in', pattern: /\bmix-?in\b/i },
]

function labelFor(sentence: string): string | null {
  for (const { label, pattern } of STEP_LABELS) {
    if (pattern.test(sentence)) return label
  }
  return null
}

/**
 * Splits the standard method into sentences, then groups consecutive
 * sentences that belong to the same appliance step (a step can read as more
 * than one sentence — "Process on LITE ICE CREAM. If powdery, add milk and
 * RE-SPIN." is one step, not two). Sentences that don't name a recognised
 * step continue the previous one, which is how an extra instruction stays
 * attached to its appliance step rather than starting an unlabelled group.
 */
export function parseStandardMethod(text: string): MethodStep[] {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)

  const steps: MethodStep[] = []
  for (const sentence of sentences) {
    const label = labelFor(sentence)
    const last = steps[steps.length - 1]

    if (label && (!last || last.label !== label)) {
      steps.push({ label, text: sentence })
    } else if (last) {
      last.text = `${last.text} ${sentence}`
    } else {
      steps.push({ label: `Step ${steps.length + 1}`, text: sentence })
    }
  }
  return steps
}
