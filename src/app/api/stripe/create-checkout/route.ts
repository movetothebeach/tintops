import { NextRequest, NextResponse } from 'next/server'
import { stripe, STRIPE_CONFIG } from '@/core/lib/stripe'
import { supabase } from '@/core/lib/supabase'
import { organizationService } from '@/core/lib/organizations'
import { getActiveProducts, getTrialDaysForPrice } from '@/core/lib/stripe-products'
import { logger } from '@/core/lib/logger'

export async function POST(request: NextRequest) {

  try {
    const body = await request.json()
    const { priceId } = body

    // Validate that priceId is provided
    if (!priceId || typeof priceId !== 'string') {
      return NextResponse.json({ error: 'Price ID is required' }, { status: 400 })
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

    // Create Stripe customer if doesn't exist - use idempotency for race condition safety
    if (!customerId) {
      try {
        // Use organization ID as idempotency key to prevent duplicate customers
        const customer = await stripe.customers.create({
          email: user.email!,
          name: organization.name,
          metadata: {
            organizationId: organization.id,
            userId: user.id,
          },
        }, {
          idempotencyKey: `customer_${organization.id}_${user.id}`
        })

        customerId = customer.id

        // Atomically update organization with customer ID, but handle race condition
        const { error: updateError } = await organizationService.updateOrganization(organization.id, {
          stripe_customer_id: customerId,
        })

        if (updateError) {
          logger.error('Error updating organization with customer ID', updateError, {
            organizationId: organization.id,
            customerId,
            userId: user.id
          })

          // If update failed, fetch the organization again - another request might have succeeded
          const { organization: refreshedOrg, error: fetchError } = await organizationService.getOrganizationByUserId(user.id)

          if (fetchError || !refreshedOrg) {
            return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 })
          }

          // Use the customer ID that was actually saved (handles race condition)
          customerId = refreshedOrg.stripe_customer_id || customerId
        }

      } catch (error: unknown) {
        // If idempotency conflict, fetch existing customer
        if (error && typeof error === 'object' && 'type' in error && error.type === 'idempotency_error') {
          logger.info('Idempotency conflict creating customer, using existing', {
            organizationId: organization.id,
            userId: user.id
          })

          // Fetch the organization again to get the customer ID that was already created
          const { organization: refreshedOrg, error: fetchError } = await organizationService.getOrganizationByUserId(user.id)

          if (fetchError || !refreshedOrg || !refreshedOrg.stripe_customer_id) {
            logger.error('Failed to fetch organization after idempotency conflict', fetchError)
            return NextResponse.json({ error: 'Failed to resolve customer creation conflict' }, { status: 500 })
          }

          customerId = refreshedOrg.stripe_customer_id
        } else {
          logger.error('Error creating Stripe customer', error, {
            organizationId: organization.id,
            userId: user.id
          })
          return NextResponse.json({ error: 'Failed to create Stripe customer' }, { status: 500 })
        }
      }
    }

    // Get trial period from Stripe product data
    const products = await getActiveProducts()
    const trialDays = getTrialDaysForPrice(products, priceId)

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
        ...(trialDays > 0 && { trial_period_days: trialDays }),
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
    logger.error('Error creating checkout session', error, {
      priceId: 'price_id_from_request'
    })
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}