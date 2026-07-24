// Development aid — renders every design token and UI primitive. Every
// later task using docs/03-design-system.md checks its work here.

import { useState } from 'react'
import { Heart, Inbox, Star } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { Card } from '@/components/ui/Card'
import { Pill } from '@/components/ui/Pill'
import { Chip } from '@/components/ui/Chip'
import { Skeleton } from '@/components/ui/Skeleton'
import { FavouriteButton } from '@/components/ui/FavouriteButton'
import { Sheet } from '@/components/ui/Sheet'
import { Field } from '@/components/ui/Field'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { RatingStars } from '@/components/ui/RatingStars'
import { Stepper } from '@/components/ui/Stepper'
import { QuantityInput } from '@/components/ui/QuantityInput'

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-4 font-display text-2xl tracking-[-0.03em] text-ink">{title}</h2>
      {children}
    </section>
  )
}

export default function StyleguidePage() {
  const [favourite, setFavourite] = useState(false)
  const [chip, setChip] = useState('all')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [rating, setRating] = useState(3)
  const [count, setCount] = useState(1)
  const [quantity, setQuantity] = useState<number | null>(12)
  const [unit, setUnit] = useState<'g' | 'ml' | 'item'>('g')

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

      <Section title="Colour">
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
      </Section>

      <Section title="Type">
        <div className="space-y-3">
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
        </div>
      </Section>

      <Section title="Radius">
        <div className="flex flex-wrap gap-4">
          {radii.map((radius) => (
            <div key={radius.name} className="text-center">
              <div className={`h-20 w-20 border border-line bg-paper ${radius.class}`} />
              <p className="mt-2 font-mono text-[11px] text-muted">{radius.name}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Shadow">
        <div className="h-20 w-40 rounded-panel border border-line bg-paper shadow-lift" />
      </Section>

      <Section title="Button">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="primary" size="sm">
            Small
          </Button>
          <Button variant="primary" size="lg">
            Large
          </Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
        </div>
      </Section>

      <Section title="IconButton">
        <div className="flex items-center gap-3">
          <IconButton aria-label="Example primary" variant="primary">
            <Heart size={18} aria-hidden="true" />
          </IconButton>
          <IconButton aria-label="Example secondary" variant="secondary">
            <Star size={18} aria-hidden="true" />
          </IconButton>
          <IconButton aria-label="Example ghost" variant="ghost">
            <Inbox size={18} aria-hidden="true" />
          </IconButton>
        </div>
      </Section>

      <Section title="Card">
        <Card className="max-w-sm p-4">
          <p className="text-[15px] text-ink">A generic paper surface with a line border.</p>
        </Card>
      </Section>

      <Section title="Pill">
        <div className="flex flex-wrap gap-2">
          <Pill>Default</Pill>
          <Pill variant="protein">68g protein</Pill>
          <Pill variant="base">Everyday creamy</Pill>
          <Pill
            variant="accent"
            style={{ '--accent': '#d94468', '--tint': '#ffe7ee' } as React.CSSProperties}
          >
            Accent
          </Pill>
        </div>
      </Section>

      <Section title="Chip">
        <div className="flex flex-wrap gap-2">
          {['all', 'classic', 'fruit', 'bakery'].map((option) => (
            <Chip key={option} selected={chip === option} onClick={() => setChip(option)}>
              {option}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="FavouriteButton">
        <FavouriteButton isFavourite={favourite} onToggle={() => setFavourite((v) => !v)} />
      </Section>

      <Section title="Skeleton">
        <div className="max-w-sm space-y-2">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-24 w-full" />
        </div>
      </Section>

      <Section title="RatingStars">
        <div className="flex items-center gap-6">
          <RatingStars value={4.5} />
          <RatingStars value={rating} onChange={setRating} />
        </div>
      </Section>

      <Section title="Stepper">
        <Stepper value={count} onChange={setCount} label="multiplier" min={1} max={5} />
      </Section>

      <Section title="QuantityInput">
        <QuantityInput
          quantity={quantity}
          unit={unit}
          onQuantityChange={setQuantity}
          onUnitChange={setUnit}
          gramsPerTsp={5}
        />
      </Section>

      <Section title="Field">
        <div className="max-w-sm space-y-4">
          <Field label="Name" hint="Shown on the recipe card">
            {(props) => <input {...props} className="h-11 w-full rounded-soft border border-line bg-cream px-3" />}
          </Field>
          <Field label="Name" error="Name is required">
            {(props) => <input {...props} className="h-11 w-full rounded-soft border border-line bg-cream px-3" />}
          </Field>
        </div>
      </Section>

      <Section title="EmptyState">
        <EmptyState
          icon={Inbox}
          title="Nothing here yet"
          message="Once you add something, it shows up in this space."
          action={<Button variant="secondary">Take an action</Button>}
        />
      </Section>

      <Section title="ErrorState">
        <ErrorState onRetry={() => undefined} />
      </Section>

      <Section title="Sheet">
        <Button onClick={() => setSheetOpen(true)}>Open sheet</Button>
        <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Example sheet">
          <p className="text-[15px] text-ink">
            Bottom sheet on phones, centred modal above 768px. Traps focus, closes on Escape.
          </p>
        </Sheet>
      </Section>
    </div>
  )
}
