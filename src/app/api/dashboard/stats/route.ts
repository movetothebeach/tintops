import { NextResponse } from 'next/server'
import { createServerClient } from '@/core/lib/supabase/server'
import { organizationService } from '@/core/lib/organizations'

export async function GET() {
  try {
    const supabase = await createServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get organization
    const { organization, error } = await organizationService.getOrganizationByUserId(user.id)

    if (error || !organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Calculate days in trial if applicable
    let daysLeftInTrial = null
    if (organization.subscription_status === 'trialing' && organization.trial_ends_at) {
      const trialEndsAt = new Date(organization.trial_ends_at)
      const now = new Date()
      daysLeftInTrial = Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    }

    // For now, return placeholder stats
    // In the future, you'd aggregate real data here
    const stats = {
      organizationName: organization.name,
      subdomain: organization.subdomain,
      subscriptionStatus: organization.subscription_status,
      subscriptionPlan: organization.subscription_plan,
      daysLeftInTrial,
      isActive: organization.is_active,
      // Placeholder stats - replace with real data when available
      totalCustomers: 0,
      totalAppointments: 0,
      monthlyRevenue: 0,
      upcomingAppointments: 0,
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}