import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { useSettings } from '@/features/reference/hooks/useSettings'
import { parseStandardMethod } from '@/features/reference/lib/parseStandardMethod'

interface TechniqueNote {
  title: string
  content: ReactNode
}

const TECHNIQUE_NOTES: TechniqueNote[] = [
  {
    title: 'Using xanthan gum',
    content:
      '1/8 tsp per tub, maximum. Mix it through the protein powder before blending so it disperses. More is not better — too much makes the finished ice cream stretchy.',
  },
  {
    title: 'Quark and cottage cheese',
    content:
      'Not the same product. Quark is naturally smooth; cottage cheese has curds and tastes saltier. Fat-free cottage cheese substitutes gram for gram but must be blended completely smooth first. Quark stays the first choice for cheesecake texture.',
  },
  {
    title: 'The milk guide',
    content: (
      <>
        <p>
          Semi-skimmed is the sensible starting point while learning the texture. Move to skimmed
          afterwards to cut calories while keeping far more body and protein than an almond-milk
          base. For light fruit tubs, swap no more than 150–200ml of dairy milk for unsweetened
          almond milk.
        </p>
        <Link to="/settings" className="mt-2 inline-block text-[13px] font-medium text-berry underline underline-offset-2">
          Go to the milk setting →
        </Link>
      </>
    ),
  },
  {
    title: 'Why whey and casein',
    content:
      'A blend gives more body than whey alone. Whey works, but the yoghurt or quark and the xanthan matter more for texture if you use it.',
  },
  {
    title: 'Macros are estimates',
    content:
      'Calculated from an editable ingredient library using typical UK values. Brands and mix-ins change the totals — check your own labels when it matters.',
  },
]

export default function MethodPage() {
  const { data: settings, isLoading, isError, refetch } = useSettings()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[clamp(32px,6vw,48px)] leading-[1.05] tracking-[-0.04em] text-ink">
          Method
        </h1>
        <p className="mt-1 text-[13px] text-muted">
          The standard method, and the notes worth knowing before you start.
        </p>
      </div>

      <section aria-labelledby="method-steps-heading" className="space-y-3">
        <h2 id="method-steps-heading" className="font-display text-2xl tracking-[-0.03em] text-ink">
          The standard method
        </h2>

        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        )}

        {!isLoading && isError && (
          <ErrorState message="Could not load the standard method." onRetry={() => refetch()} />
        )}

        {!isLoading && !isError && settings && (
          <ol className="space-y-3">
            {parseStandardMethod(settings.standard_method).map((step, index) => (
              <li key={step.label} className="flex gap-3 rounded-panel border border-line bg-paper p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill bg-ink font-mono text-[13px] font-bold text-cream">
                  {index + 1}
                </span>
                <p className="text-[15px] text-ink">
                  <strong className="font-medium">{step.label}</strong> — {step.text}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section aria-labelledby="method-notes-heading" className="space-y-3">
        <h2 id="method-notes-heading" className="font-display text-2xl tracking-[-0.03em] text-ink">
          Technique notes
        </h2>
        <div className="space-y-2">
          {TECHNIQUE_NOTES.map((note) => (
            <details key={note.title} className="rounded-panel border border-line bg-paper p-4">
              <summary className="cursor-pointer font-display text-lg tracking-[-0.02em] text-ink">
                {note.title}
              </summary>
              <div className="mt-2 space-y-2 text-[15px] leading-[1.5] text-ink">{note.content}</div>
            </details>
          ))}
        </div>
      </section>
    </div>
  )
}
