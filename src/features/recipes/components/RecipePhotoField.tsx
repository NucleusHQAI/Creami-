import { useEffect, useId, useState } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export interface RecipePhotoFieldProps {
  currentImageUrl: string | null
  selectedFile: File | null
  error: string | null
  disabled?: boolean
  onSelect: (file: File) => void
  onRemove: () => void
}

export function RecipePhotoField({
  currentImageUrl,
  selectedFile,
  error,
  disabled = false,
  onSelect,
  onRemove,
}: RecipePhotoFieldProps) {
  const inputId = useId()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null)
      return
    }

    const objectUrl = URL.createObjectURL(selectedFile)
    setPreviewUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [selectedFile])

  const imageUrl = previewUrl ?? currentImageUrl

  return (
    <section aria-labelledby={`${inputId}-label`} className="space-y-3">
      <div>
        <h2 id={`${inputId}-label`} className="text-[14px] font-medium text-ink">
          Recipe photo
        </h2>
        <p className="mt-1 text-[12px] text-muted">JPG, PNG or WebP · up to 5 MB</p>
      </div>

      <div className="overflow-hidden rounded-panel border border-line bg-paper">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Recipe photo preview"
            className="aspect-[4/3] w-full object-cover"
          />
        ) : (
          <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 bg-line/25 text-muted">
            <ImagePlus size={28} aria-hidden="true" />
            <p className="text-[13px]">Add a photo to bring the recipe to life</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <label
          htmlFor={inputId}
          className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-pill bg-ink px-5 text-[14px] font-medium text-cream transition-colors hover:bg-ink/90 focus-within:ring-2 focus-within:ring-berry focus-within:ring-offset-2 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
          aria-disabled={disabled}
        >
          {imageUrl ? 'Replace photo' : 'Choose photo'}
          <input
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={disabled}
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) onSelect(file)
              event.target.value = ''
            }}
          />
        </label>

        {imageUrl && (
          <Button type="button" variant="secondary" disabled={disabled} onClick={onRemove}>
            <Trash2 size={16} aria-hidden="true" />
            Remove photo
          </Button>
        )}
      </div>

      {error && (
        <p role="alert" className="text-[13px] text-berry">
          {error}
        </p>
      )}
    </section>
  )
}
