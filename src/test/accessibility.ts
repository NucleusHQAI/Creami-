import axe, { type Result, type RunOptions } from 'axe-core'

const JSDOM_OPTIONS: RunOptions = {
  rules: {
    'color-contrast': { enabled: false },
  },
}

function formatViolation(violation: Result): string {
  const targets = violation.nodes.flatMap((node) => node.target).join(', ')
  return `${violation.id}: ${violation.help} (${targets})`
}

export async function expectNoAxeViolations(container: Element): Promise<void> {
  const result = await axe.run(container, JSDOM_OPTIONS)

  if (result.violations.length > 0) {
    throw new Error(result.violations.map(formatViolation).join('\n'))
  }
}
