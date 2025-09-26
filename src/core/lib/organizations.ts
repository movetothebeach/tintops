import { createServerClient, createServiceClient } from '@/core/lib/supabase/server'
import { Database } from '@/core/types/database'
import { isReservedSubdomain } from '@/core/utils/slug'
import { logger } from './logger'

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
  async updateOrganization(orgId: string, updates: Partial<Organization>): Promise<{ error: string | null }> {
    try {
      const adminClient = await createServiceClient()

      const { error } = await adminClient
        .from('organizations')
        .update(updates)
        .eq('id', orgId)

      if (error) {
        logger.error('Error updating organization', error)
        return { error: 'Failed to update organization' }
      }

      return { error: null }
    } catch (error) {
      logger.error('Unexpected error updating organization', error)
      return { error: 'An unexpected error occurred' }
    }
  },

  async createOrganization(data: CreateOrganizationData): Promise<{ organization: Organization; error: null } | { organization: null; error: string }> {
    try {
      const adminClient = await createServiceClient()

      // Start a transaction by creating organization first
      const orgInsert = {
        name: data.name,
        subdomain: data.subdomain,
        is_active: false, // Only active after real subscription
        onboarding_completed: false,
        // NO subscription data - only set by Stripe webhooks
      } as OrganizationInsert

      const { data: organization, error: orgError } = await adminClient
        .from('organizations')
        .insert(orgInsert)
        .select()
        .single()

      if (orgError || !organization) {
        logger.error('Error creating organization', orgError)
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

      const { error: userError } = await adminClient
        .from('users')
        .insert(userInsert)

      if (userError) {
        logger.error('Error creating user record', userError)
        // Clean up organization if user creation failed
        await adminClient.from('organizations').delete().eq('id', organization.id)
        return { organization: null, error: 'Failed to create user record' }
      }

      return { organization, error: null }
    } catch (error) {
      logger.error('Unexpected error in createOrganization', error)
      return { organization: null, error: 'An unexpected error occurred' }
    }
  },

  async getOrganizationByUserId(userId: string): Promise<{ organization: Organization | null; error: string | null }> {
    try {
      // Use regular server client - RLS policies will handle access control
      const supabase = await createServerClient()

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('organization_id, organizations(*)')
        .eq('id', userId)
        .single()

      if (userError) {
        return { organization: null, error: 'User not found' }
      }

      return { organization: user.organizations as Organization, error: null }
    } catch (error) {
      logger.error('Error getting organization', error)
      return { organization: null, error: 'Failed to get organization' }
    }
  },

  async checkSubdomainAvailability(subdomain: string): Promise<boolean> {
    try {
      // Check if subdomain is reserved first
      if (isReservedSubdomain(subdomain)) {
        return false
      }

      // Use regular server client - this is a simple read operation
      const supabase = await createServerClient()

      const { data, error } = await supabase
        .from('organizations')
        .select('subdomain')
        .eq('subdomain', subdomain)
        .limit(1)

      if (error) {
        logger.error('Error checking subdomain', error)
        return false
      }

      return data.length === 0
    } catch (error) {
      logger.error('Error checking subdomain availability', error)
      return false
    }
  },
}