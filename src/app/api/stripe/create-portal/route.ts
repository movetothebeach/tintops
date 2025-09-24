import { NextRequest, NextResponse } from 'next/server'
import { stripe, STRIPE_CONFIG } from '@/core/lib/stripe'
import { supabase } from '@/core/lib/supabase'
import { organizationService } from '@/core/lib/organizations'
import { logger } from '@/core/lib/logger'

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization
    const { organization, error: orgError } = await organizationService.getOrganizationByUserId(user.id)

    if (orgError || !organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Check if organization has a Stripe customer ID
    if (!organization.stripe_customer_id) {
      return NextResponse.json({ error: 'No billing account found' }, { status: 404 })
    }

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: organization.stripe_customer_id,
      return_url: STRIPE_CONFIG.PORTAL_RETURN_URL,
    })

    return NextResponse.json({
      url: session.url,
    })

  } catch (error) {
    logger.error('Error creating billing portal session', error)
    return NextResponse.json({ error: 'Failed to create billing portal session' }, { status: 500 })
  }
}