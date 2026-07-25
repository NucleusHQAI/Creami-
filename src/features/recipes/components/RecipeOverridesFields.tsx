import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import type { RecipeFormValues } from '@/features/recipes/recipe-form-schema'

export interface RecipeOverridesFieldsProps {
  register: UseFormRegister<RecipeFormValues>
  errors: FieldErrors<RecipeFormValues>
}

const textareaClass =
  'mt-2 min-h-24 w-full rounded-soft border border-line bg-cream px-3 py-2 text-[14px] text-ink focus-visible:outline-none'
const numberClass =
  'mt-1 h-11 w-full rounded-soft border border-line bg-cream px-3 text-ink focus-visible:outline-none'

/** Method override and macro override — both collapsed by default (docs/05 § The editor field table). */
export function RecipeOverridesFields({ register, errors }: RecipeOverridesFieldsProps) {
  return (
    <div className="space-y-3">
      <details className="rounded-panel border border-line bg-paper p-4">
        <summary className="cursor-pointer font-display text-lg tracking-[-0.02em] text-ink">
          Method override
        </summary>
        <p className="mt-1 text-[13px] text-muted">
          Leave this empty to use the standard method from settings.
        </p>
        <textarea {...register('methodOverride')} className={textareaClass} />
      </details>

      <details className="rounded-panel border border-line bg-paper p-4">
        <summary className="cursor-pointer font-display text-lg tracking-[-0.02em] text-ink">
          Macro override
        </summary>
        <p className="mt-1 text-[13px] text-berrydk">
          Setting either figure replaces the calculated value everywhere it's shown.
        </p>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <label className="text-[13px] text-muted">
            Calories per tub
            <input
              type="number"
              inputMode="decimal"
              min={0}
              className={numberClass}
              {...register('macroOverrideKcal', {
                setValueAs: (value) => (value === '' ? null : Number(value)),
              })}
            />
            {errors.macroOverrideKcal && (
              <span role="alert" className="mt-1 block text-[13px] text-berry">
                {errors.macroOverrideKcal.message}
              </span>
            )}
          </label>
          <label className="text-[13px] text-muted">
            Protein per tub (g)
            <input
              type="number"
              inputMode="decimal"
              min={0}
              className={numberClass}
              {...register('macroOverrideProteinG', {
                setValueAs: (value) => (value === '' ? null : Number(value)),
              })}
            />
            {errors.macroOverrideProteinG && (
              <span role="alert" className="mt-1 block text-[13px] text-berry">
                {errors.macroOverrideProteinG.message}
              </span>
            )}
          </label>
        </div>
      </details>
    </div>
  )
}
