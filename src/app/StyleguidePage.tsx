// Development aid — renders every design token. Every later task using
// docs/03-design-system.md checks its work here. Component sections are
// added as the primitives that back them land (Tasks 12-13).

const colors = [
  { name: 'cream', hex: '#fffaf2' },
  { name: 'paper', hex: '#fffdf9' },
  { name: 'ink', hex: '#232238' },
  { name: 'muted', hex: '#686579' },
  { name: 'line', hex: '#e9e2d7' },
  { name: 'berry', hex: '#d94468' },
  { name: 'berrydk', hex: '#a62249' },
  { name: 'blue', hex: '#385d8a' },
] as const

const radii = [
  { name: 'recipe', class: 'rounded-recipe' },
  { name: 'panel', class: 'rounded-panel' },
  { name: 'soft', class: 'rounded-soft' },
  { name: 'pill', class: 'rounded-pill' },
] as const

export default function StyleguidePage() {
  return (
    <div className="mx-auto max-w-content space-y-12 px-4 py-10 sm:px-6">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-berrydk">
          Development aid
        </p>
        <h1 className="font-display text-[clamp(32px,6vw,48px)] leading-[1.05] tracking-[-0.04em] text-ink">
          Styleguide
        </h1>
      </header>

      <section>
        <h2 className="mb-4 font-display text-2xl tracking-[-0.03em] text-ink">Colour</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {colors.map((color) => (
            <div key={color.name} className="overflow-hidden rounded-soft border border-line">
              <div className="h-20" style={{ backgroundColor: color.hex }} />
              <div className="bg-paper p-3">
                <p className="font-mono text-[13px] text-ink">{color.name}</p>
                <p className="font-mono text-[11px] text-muted">{color.hex}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="mb-4 font-display text-2xl tracking-[-0.03em] text-ink">Type</h2>
        <p className="font-display text-[clamp(32px,6vw,48px)] leading-[1.05] tracking-[-0.04em] text-ink">
          Page title
        </p>
        <p className="font-display text-2xl tracking-[-0.03em] text-ink">Section heading</p>
        <p className="font-display text-xl tracking-[-0.025em] text-ink">Card title</p>
        <p className="font-sans text-[15px] leading-[1.5] text-ink">
          Body text sits at 15px with 1.5 line height for comfortable reading at arm's length.
        </p>
        <p className="font-sans text-[13px] text-muted">Small / secondary text</p>
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-berrydk">Eyebrow</p>
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-ink">
          Pill / label
        </p>
      </section>

      <section>
        <h2 className="mb-4 font-display text-2xl tracking-[-0.03em] text-ink">Radius</h2>
        <div className="flex flex-wrap gap-4">
          {radii.map((radius) => (
            <div key={radius.name} className="text-center">
              <div className={`h-20 w-20 border border-line bg-paper ${radius.class}`} />
              <p className="mt-2 font-mono text-[11px] text-muted">{radius.name}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-2xl tracking-[-0.03em] text-ink">Shadow</h2>
        <div className="h-20 w-40 rounded-panel border border-line bg-paper shadow-lift" />
      </section>
    </div>
  )
}
