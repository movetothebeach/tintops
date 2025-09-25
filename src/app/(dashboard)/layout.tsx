import { redirect } from 'next/navigation'
import { createServerClient } from '@/core/lib/supabase/server'
import { DashboardLayout } from '@/components/dashboard-layout'
import { organizationService } from '@/core/lib/organizations'

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Check authentication
  if (!user) {
    redirect('/auth/login')
  }

  // Get user's organization
  const { organization } = await organizationService.getOrganizationByUserId(user.id)

  // Check organization exists
  if (!organization) {
    redirect('/onboarding')
  }

  // Check subscription status
  if (!organization.is_active) {
    // Check if still in trial period
    if (organization.subscription_status === 'trialing' && organization.trial_ends_at) {
      const trialEndsAt = new Date(organization.trial_ends_at)
      if (trialEndsAt < new Date()) {
        redirect('/subscription-setup')
      }
    } else if (organization.subscription_status !== 'active') {
      redirect('/subscription-setup')
    }
  }

  // All checks passed, render dashboard
  return <DashboardLayout>{children}</DashboardLayout>
}