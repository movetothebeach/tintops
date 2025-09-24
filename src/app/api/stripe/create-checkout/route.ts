import { NextRequest, NextResponse } from 'next/server'
import { stripe, STRIPE_CONFIG } from '@/core/lib/stripe'
import { supabase } from '@/core/lib/supabase'
import { organizationService } from '@/core/lib/organizations'

export async function POST(request: NextRequest) {
  try {
    const { plan } = await request.json()

    // Validate plan
    if (!plan || !['monthly', 'yearly'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan specified' }, { status: 400 })
    }

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

    // Check if organization already has an active subscription
    if (organization.subscription_status === 'active') {
      return NextResponse.json({ error: 'Organization already has an active subscription' }, { status: 400 })
    }

    let customerId = organization.stripe_customer_id

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        name: organization.name,
        metadata: {
          organizationId: organization.id,
          userId: user.id,
        },
      })

      customerId = customer.id

      // Update organization with customer ID
      const { error: updateError } = await organizationService.updateOrganization(organization.id, {
        stripe_customer_id: customerId,
      })

      if (updateError) {
        console.error('Error updating organization with customer ID:', updateError)
        return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 })
      }
    }

    // Get price ID based on plan
    const priceId = plan === 'yearly' ? STRIPE_CONFIG.PRICE_YEARLY : STRIPE_CONFIG.PRICE_MONTHLY

    if (!priceId) {
      return NextResponse.json({ error: 'Price not configured for plan' }, { status: 500 })
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: {
        trial_period_days: STRIPE_CONFIG.TRIAL_PERIOD_DAYS,
        metadata: {
          organizationId: organization.id,
        },
      },
      success_url: STRIPE_CONFIG.SUCCESS_URL,
      cancel_url: STRIPE_CONFIG.CANCEL_URL,
      metadata: {
        organizationId: organization.id,
        userId: user.id,
      },
    })

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })

  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}