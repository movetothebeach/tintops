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

    // Get organization with subscription info
    const { organization, error } = await organizationService.getOrganizationByUserId(user.id)

    if (error || !organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Get the owner information from users table
    const { data: owner } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('organization_id', organization.id)
      .eq('role', 'owner')
      .single()

    return NextResponse.json({
      organization: {
        id: organization.id,
        name: organization.name,
        subdomain: organization.subdomain,
        ownerId: owner?.id || user.id,
        ownerEmail: owner?.email || user.email,
        ownerName: owner?.full_name || '',
        stripeCustomerId: organization.stripe_customer_id,
        subscriptionStatus: organization.subscription_status,
        subscriptionPlan: organization.subscription_plan,
        isActive: organization.is_active,
        trialEndsAt: organization.trial_ends_at,
        currentPeriodEnd: organization.current_period_end,
        createdAt: organization.created_at,
        updatedAt: organization.updated_at,
      }
    })
  } catch (error) {
    console.error('Error fetching organization:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}