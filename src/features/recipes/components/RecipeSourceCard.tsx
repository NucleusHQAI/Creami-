import { ExternalLink } from 'lucide-react'
import { safeSourceUrl } from '@/lib/api/recipe-sources'
import type { RecipeSource } from '@/types/domain'

export function RecipeSourceCard({ sources }: { sources: RecipeSource[] }) {
  if (sources.length === 0) return null

  return (
    <section className="rounded-panel border border-line bg-paper p-4">
      <h2 className="font-display text-xl tracking-[-0.025em] text-ink">Inspired by</h2>
      <div className="mt-2 space-y-3">
        {sources.map((source) => {
          const url = safeSourceUrl(source.source_url)
          const label =
            source.source_title ?? source.source_site ?? source.source_url ?? 'Online recipe'
          return (
            <div key={source.id}>
              {url ? (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-medium text-berrydk underline underline-offset-2"
                >
                  {label}
                  <ExternalLink size={14} aria-hidden="true" />
                </a>
              ) : (
                <p className="font-medium text-ink">{label}</p>
              )}
              {source.source_site && source.source_site !== label && (
                <p className="text-[12px] text-muted">{source.source_site}</p>
              )}
              {source.adaptation_summary && (
                <p className="mt-1 text-[13px] text-muted">{source.adaptation_summary}</p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
