import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'
import { getUserWithOrganization } from '@/core/lib/data/cached-queries'

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get user and organization using cached queries
  const { user, organization } = await getUserWithOrganization()

  // Check authentication
  if (!user) {
    redirect('/auth/login')
  }

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