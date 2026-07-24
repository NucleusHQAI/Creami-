import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl) {
  throw new Error(
    'Missing environment variable VITE_SUPABASE_URL. Copy .env.example to .env and fill it in.',
  )
}

if (!supabasePublishableKey) {
  throw new Error(
    'Missing environment variable VITE_SUPABASE_PUBLISHABLE_KEY. Copy .env.example to .env and fill it in.',
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey)
