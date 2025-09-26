import { cache } from 'react'
import { createServerClient } from '@/core/lib/supabase/server'
import { organizationService } from '@/core/lib/organizations'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/core/types/database'

type Organization = Database['public']['Tables']['organizations']['Row']

/**
 * Get current authenticated user - cached at request level
 * Multiple calls within the same request will return the same result
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

/**
 * Get organization by user ID - cached at request level
 * Multiple calls within the same request will return the same result
 */
export const getOrganizationByUserId = cache(async (userId: string): Promise<Organization | null> => {
  const { organization } = await organizationService.getOrganizationByUserId(userId)
  return organization
})

/**
 * Combined helper to get both user and organization - cached
 * Useful for components that need both pieces of data
 */
export const getUserWithOrganization = cache(async (): Promise<{
  user: User | null
  organization: Organization | null
}> => {
  const user = await getCurrentUser()

  if (!user) {
    return { user: null, organization: null }
  }

  const organization = await getOrganizationByUserId(user.id)

  return { user, organization }
})