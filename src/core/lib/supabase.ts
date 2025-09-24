import { createClient } from '@supabase/supabase-js'
import { Database } from '@/core/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Server-side admin client (only create when actually needed)
export function createAdminClient() {
  if (typeof window !== 'undefined') {
    throw new Error('Admin client should only be used server-side')
  }

  const serviceKey = process.env.SUPABASE_SERVICE_KEY
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_KEY is required for admin operations')
  }

  return createClient<Database>(
    supabaseUrl,
    serviceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}