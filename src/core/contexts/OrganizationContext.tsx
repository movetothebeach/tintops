'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '@/core/lib/supabase'
import { Database } from '@/core/types/database'

type Organization = Database['public']['Tables']['organizations']['Row']

interface OrganizationContextType {
  organization: Organization | null
  loading: boolean
  refetch: () => Promise<void>
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const fetchOrganization = async () => {
    if (!user) {
      setOrganization(null)
      setLoading(false)
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setOrganization(null)
        setLoading(false)
        return
      }

      const response = await fetch('/api/organizations', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const { organization: org } = await response.json()
        setOrganization(org)
      } else {
        setOrganization(null)
      }
    } catch (error) {
      console.error('Error fetching organization:', error)
      setOrganization(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrganization()
  }, [user])

  const value = {
    organization,
    loading,
    refetch: fetchOrganization,
  }

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider')
  }
  return context
}