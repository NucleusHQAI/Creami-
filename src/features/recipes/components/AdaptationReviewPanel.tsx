import type { AdaptationDecision } from '@/features/recipes/import/types'

export interface AdaptationReviewPanelProps {
  decisions: AdaptationDecision[]
}

const GROUPS: Array<{
  title: string
  kinds: AdaptationDecision['kind'][]
  description: string
}> = [
  { title: 'Using', kinds: ['mapped'], description: 'Matched to your ingredient library.' },
  {
    title: 'UK replacements',
    kinds: ['replaced'],
    description: 'Swapped for an existing UK-style ingredient.',
  },
  {
    title: 'Covered by your base',
    kinds: ['covered_by_base'],
    description: 'Left out of the additions because the selected base supplies it.',
  },
  {
    title: 'Needs attention',
    kinds: ['unresolved'],
    description: 'Choose an existing ingredient, add a no-macro note or ignore this line.',
  },
]

export function AdaptationReviewPanel({ decisions }: AdaptationReviewPanelProps) {
  return (
    <section className="space-y-4 rounded-panel border border-line bg-paper p-4">
      <div>
        <h2 className="font-display text-xl tracking-[-0.025em] text-ink">Adaptation review</h2>
        <p className="mt-1 text-[13px] text-muted">
          Macros are calculated from your selected base and ingredient library, not the source
          website.
        </p>
      </div>

      {GROUPS.map((group) => {
        const rows = decisions.filter((decision) => group.kinds.includes(decision.kind))
        if (rows.length === 0) return null
        return (
          <div key={group.title}>
            <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-ink">
              {group.title}
            </h3>
            <p className="mt-0.5 text-[12px] text-muted">{group.description}</p>
            <ul className="mt-2 divide-y divide-line rounded-soft border border-line bg-cream px-3">
              {rows.map((decision, index) => (
                <li key={`${decision.sourceLine}-${index}`} className="py-2.5">
                  <p className="text-[14px] font-medium text-ink">{decision.sourceLine}</p>
                  <p className="mt-0.5 text-[12px] text-muted">{decision.reason}</p>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </section>
  )
}
