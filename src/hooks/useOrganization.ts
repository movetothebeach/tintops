import useSWR from 'swr'

export interface Organization {
  id: string
  name: string
  subdomain: string
  ownerId: string
  ownerEmail: string
  ownerName: string
  stripeCustomerId: string | null
  subscriptionStatus: string | null
  subscriptionPlan: string | null
  isActive: boolean
  trialEndsAt: string | null
  currentPeriodEnd: string | null
  createdAt: string
  updatedAt: string
}

export interface OrganizationResponse {
  organization: Organization
}

export function useOrganization() {
  const { data, error, isLoading, mutate } = useSWR<OrganizationResponse>('/api/organization')

  return {
    organization: data?.organization,
    isLoading,
    isError: error,
    mutate,
    // Computed values
    isActive: data?.organization?.isActive || false,
    isTrialing: data?.organization?.subscriptionStatus === 'trialing',
    subscriptionStatus: data?.organization?.subscriptionStatus || null,
  }
}