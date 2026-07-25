import { supabase } from '@/lib/supabase'

const RECIPE_IMAGE_BUCKET = 'recipe-images'
export const MAX_RECIPE_IMAGE_BYTES = 5 * 1024 * 1024

const EXTENSION_BY_MIME_TYPE: Readonly<Record<string, string>> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export function validateRecipeImage(file: File): string | null {
  if (!EXTENSION_BY_MIME_TYPE[file.type]) {
    return 'Choose a JPG, PNG or WebP image.'
  }
  if (file.size > MAX_RECIPE_IMAGE_BYTES) {
    return 'Choose an image smaller than 5 MB.'
  }
  return null
}

export function isUploadedRecipeImage(path: string | null): path is string {
  return path !== null && !path.startsWith('/')
}

export function getRecipeImageUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (path.startsWith('/')) return path
  return supabase.storage.from(RECIPE_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl
}

export async function uploadRecipeImage(file: File): Promise<string> {
  const validationError = validateRecipeImage(file)
  if (validationError) throw new Error(validationError)

  const extension = EXTENSION_BY_MIME_TYPE[file.type]
  if (!extension) throw new Error('Unsupported recipe image type.')

  const path = `uploads/${crypto.randomUUID()}.${extension}`
  const { error } = await supabase.storage.from(RECIPE_IMAGE_BUCKET).upload(path, file, {
    cacheControl: '31536000',
    contentType: file.type,
    upsert: false,
  })
  if (error) throw error
  return path
}

export async function removeRecipeImage(path: string): Promise<void> {
  const { error } = await supabase.storage.from(RECIPE_IMAGE_BUCKET).remove([path])
  if (error) throw error
}
