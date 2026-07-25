import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { Skeleton } from '@/components/ui/Skeleton'
import { AdaptationReviewPanel } from '@/features/recipes/components/AdaptationReviewPanel'
import { adaptRecipe } from '@/features/recipes/import/adapt-recipe'
import type {
  AdaptationRuleData,
  AdaptedRecipeDraft,
  ExtractedRecipe,
} from '@/features/recipes/import/types'
import { useExtractRecipe } from '@/features/recipes/hooks/useExtractRecipe'
import type { BaseWithIngredients, Category, Ingredient } from '@/types/domain'

interface AdaptRecipeSheetProps {
  open: boolean
  onClose: () => void
  onUse: (draft: AdaptedRecipeDraft) => void
  isOnline: boolean
  bases: BaseWithIngredients[]
  ingredients: Ingredient[]
  categories: Category[]
  rules: AdaptationRuleData[]
}

type Mode = 'link' | 'paste'

const inputClass =
  'h-11 w-full rounded-soft border border-line bg-cream px-3 text-[14px] text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-berry'

export function AdaptRecipeSheet({
  open,
  onClose,
  onUse,
  isOnline,
  bases,
  ingredients,
  categories,
  rules,
}: AdaptRecipeSheetProps) {
  const [mode, setMode] = useState<Mode>('link')
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [pasteUrl, setPasteUrl] = useState('')
  const [pastedIngredients, setPastedIngredients] = useState('')
  const [draft, setDraft] = useState<AdaptedRecipeDraft | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const extraction = useExtractRecipe()

  function buildDraft(recipe: ExtractedRecipe) {
    setDraft(adaptRecipe({ recipe, bases, ingredients, categories, rules }))
    setFormError(null)
  }

  async function submitLink() {
    const trimmed = url.trim()
    if (!trimmed) {
      setFormError('Enter a recipe link.')
      return
    }
    setDraft(null)
    setFormError(null)
    try {
      buildDraft(await extraction.mutateAsync(trimmed))
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Couldn't extract that recipe.")
    }
  }

  function submitPaste() {
    const lines = pastedIngredients
      .split(/\r?\n/)
      .map((line) => line.replace(/^[•*-]\s*/, '').trim())
      .filter(Boolean)
    if (lines.length === 0) {
      setFormError('Paste at least one ingredient line.')
      return
    }

    let sourceUrl: string | null = null
    if (pasteUrl.trim()) {
      try {
        const parsed = new URL(pasteUrl.trim())
        if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('unsupported')
        sourceUrl = parsed.toString()
      } catch {
        setFormError('The optional source link must use HTTP or HTTPS.')
        return
      }
    }

    const recipeName = title.trim() || 'Adapted online recipe'
    buildDraft({
      source: {
        url: sourceUrl,
        title: title.trim() || null,
        site: sourceUrl ? new URL(sourceUrl).hostname.replace(/^www\./, '') : null,
        retrievedAt: sourceUrl ? new Date().toISOString() : null,
      },
      name: recipeName,
      description: null,
      recipeYield: null,
      ingredients: lines.map((original) => ({ original })),
    })
  }

  function changeMode(next: Mode) {
    setMode(next)
    setDraft(null)
    setFormError(null)
    extraction.reset()
  }

  return (
    <Sheet open={open} onClose={onClose} title="Adapt an online recipe">
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-2" role="group" aria-label="Recipe source">
          <Button
            type="button"
            variant={mode === 'link' ? 'primary' : 'secondary'}
            onClick={() => changeMode('link')}
          >
            Recipe link
          </Button>
          <Button
            type="button"
            variant={mode === 'paste' ? 'primary' : 'secondary'}
            onClick={() => changeMode('paste')}
          >
            Paste ingredients
          </Button>
        </div>

        {!isOnline ? (
          <p role="status" className="rounded-soft bg-berry/10 px-3 py-2 text-[13px] text-berrydk">
            Reconnect before adapting a recipe. Saved recipes are still available to read offline.
          </p>
        ) : mode === 'link' ? (
          <div className="space-y-3">
            <label className="block text-[13px] text-muted" htmlFor="adapt-recipe-url">
              Recipe link
            </label>
            <input
              id="adapt-recipe-url"
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com/recipe"
              className={inputClass}
            />
            <Button type="button" onClick={() => void submitLink()} disabled={extraction.isPending}>
              {extraction.isPending ? 'Reading recipe…' : 'Read recipe'}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block text-[13px] text-muted" htmlFor="adapt-recipe-title">
              Recipe title <span className="text-muted">(optional)</span>
            </label>
            <input
              id="adapt-recipe-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={inputClass}
            />
            <label className="block text-[13px] text-muted" htmlFor="adapt-paste-url">
              Source link <span className="text-muted">(optional)</span>
            </label>
            <input
              id="adapt-paste-url"
              type="url"
              value={pasteUrl}
              onChange={(event) => setPasteUrl(event.target.value)}
              className={inputClass}
            />
            <label className="block text-[13px] text-muted" htmlFor="adapt-ingredients">
              Ingredients, one per line
            </label>
            <textarea
              id="adapt-ingredients"
              value={pastedIngredients}
              onChange={(event) => setPastedIngredients(event.target.value)}
              rows={8}
              placeholder={'1 cup milk\n2 tbsp cocoa powder\n20 g chocolate chips'}
              className={`${inputClass} h-auto py-3`}
            />
            <Button type="button" onClick={submitPaste}>
              Build adaptation
            </Button>
          </div>
        )}

        {extraction.isPending && (
          <div className="space-y-2" aria-label="Reading recipe">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}

        {formError && (
          <div role="alert" className="rounded-soft bg-berry/10 px-3 py-2 text-[13px] text-berrydk">
            {formError}
          </div>
        )}

        {draft && (
          <>
            <AdaptationReviewPanel decisions={draft.decisions} />
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={() => {
                  onUse(draft)
                  onClose()
                }}
              >
                Use this adaptation
              </Button>
              {mode === 'link' && (
                <Button type="button" variant="secondary" onClick={() => changeMode('paste')}>
                  Paste instead
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </Sheet>
  )
}
