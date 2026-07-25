import { useState } from 'react'
import { Chip } from '@/components/ui/Chip'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'

export type ServingMode = 'full' | 'half' | 'custom'

export interface ServingToggleProps {
  mode: ServingMode
  customMl: number
  maxFillMl: number
  onChange: (mode: ServingMode, customMl: number) => void
}

/** Full tub / Half tub / Custom, per docs/05 § Recipe detail item 2. Custom opens a sheet for a millilitre value. */
export function ServingToggle({ mode, customMl, maxFillMl, onChange }: ServingToggleProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [draftMl, setDraftMl] = useState(String(customMl))

  function openCustomSheet() {
    setDraftMl(String(customMl))
    setSheetOpen(true)
  }

  function confirmCustom() {
    const parsed = Number(draftMl)
    if (Number.isFinite(parsed) && parsed > 0) {
      onChange('custom', parsed)
      setSheetOpen(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Chip selected={mode === 'full'} onClick={() => onChange('full', customMl)}>
        Full tub
      </Chip>
      <Chip selected={mode === 'half'} onClick={() => onChange('half', customMl)}>
        Half tub
      </Chip>
      <Chip selected={mode === 'custom'} onClick={openCustomSheet}>
        {mode === 'custom' ? `Custom — ${customMl}ml` : 'Custom'}
      </Chip>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Custom fill">
        <div className="space-y-4">
          <Field label="Fill volume (ml)" hint={`Your tub's MAX FILL line is ${maxFillMl}ml.`}>
            {(fieldProps) => (
              <input
                {...fieldProps}
                type="number"
                inputMode="decimal"
                min={1}
                max={maxFillMl}
                value={draftMl}
                onChange={(event) => setDraftMl(event.target.value)}
                className="h-11 w-full rounded-soft border border-line bg-cream px-3 text-ink focus-visible:outline-none"
              />
            )}
          </Field>
          <Button className="w-full" onClick={confirmCustom}>
            Use this fill
          </Button>
        </div>
      </Sheet>
    </div>
  )
}
