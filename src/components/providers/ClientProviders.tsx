'use client'

import { AuthProvider } from '@/core/contexts/AuthContext'
import { User } from '@supabase/supabase-js'

interface ClientProvidersProps {
  children: React.ReactNode
  user: User | null
}

export default function ClientProviders({ children, user }: ClientProvidersProps) {
  return (
    <AuthProvider initialUser={user}>
      {children}
    </AuthProvider>
  )
}