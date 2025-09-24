import { createAdminClient } from './supabase'
import { Database } from '@/core/types/database'

type Organization = Database['public']['Tables']['organizations']['Row']
type OrganizationInsert = Database['public']['Tables']['organizations']['Insert']
type UserInsert = Database['public']['Tables']['users']['Insert']

export interface CreateOrganizationData {
  name: string
  subdomain: string
  ownerEmail: string
  ownerName: string
  userId: string
}

export const organizationService = {
  async createOrganization(data: CreateOrganizationData): Promise<{ organization: Organization; error: null } | { organization: null; error: string }> {
    try {
      const adminClient = createAdminClient()

      // Start a transaction by creating organization first
      const orgInsert = {
        name: data.name,
        subdomain: data.subdomain,
        is_active: true,
        onboarding_completed: false,
        subscription_status: 'trialing',
      } as OrganizationInsert

      const { data: organization, error: orgError } = await (adminClient
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('organizations') as any)
        .insert(orgInsert)
        .select()
        .single()

      if (orgError || !organization) {
        console.error('Error creating organization:', orgError)
        return { organization: null, error: 'Failed to create organization' }
      }

      // Create user record linked to organization
      const userInsert: UserInsert = {
        id: data.userId,
        organization_id: organization.id,
        email: data.ownerEmail,
        full_name: data.ownerName,
        role: 'owner',
        is_active: true,
      }

      const { error: userError } = await (adminClient
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('users') as any)
        .insert(userInsert)

      if (userError) {
        console.error('Error creating user record:', userError)
        // Clean up organization if user creation failed
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (adminClient.from('organizations') as any).delete().eq('id', organization.id)
        return { organization: null, error: 'Failed to create user record' }
      }

      return { organization, error: null }
    } catch (error) {
      console.error('Unexpected error in createOrganization:', error)
      return { organization: null, error: 'An unexpected error occurred' }
    }
  },

  async getOrganizationByUserId(userId: string): Promise<{ organization: Organization | null; error: string | null }> {
    try {
      const adminClient = createAdminClient()

      const { data: user, error: userError } = await (adminClient
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('users') as any)
        .select('organization_id, organizations(*)')
        .eq('id', userId)
        .single()

      if (userError) {
        return { organization: null, error: 'User not found' }
      }

      return { organization: user.organizations as Organization, error: null }
    } catch (error) {
      console.error('Error getting organization:', error)
      return { organization: null, error: 'Failed to get organization' }
    }
  },

  async checkSubdomainAvailability(subdomain: string): Promise<boolean> {
    try {
      const adminClient = createAdminClient()

      const { data, error } = await (adminClient
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('organizations') as any)
        .select('subdomain')
        .eq('subdomain', subdomain)
        .limit(1)

      if (error) {
        console.error('Error checking subdomain:', error)
        return false
      }

      return data.length === 0
    } catch (error) {
      console.error('Error checking subdomain availability:', error)
      return false
    }
  },
}