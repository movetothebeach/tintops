'use client'

import { AuthProvider } from '@/core/contexts/AuthContext'
import { User } from '@supabase/supabase-js'
import { SWRConfig } from 'swr'
import { swrConfig } from '@/core/lib/swr-config'

interface ClientProvidersProps {
  children: React.ReactNode
  user: User | null
}

export default function ClientProviders({ children, user }: ClientProvidersProps) {
  return (
    <SWRConfig value={swrConfig}>
      <AuthProvider initialUser={user}>
        {children}
      </AuthProvider>
    </SWRConfig>
  )
}