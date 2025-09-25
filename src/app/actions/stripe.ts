'use server'

import { redirect } from 'next/navigation'
import { createServerClient, createServiceClient } from '@/core/lib/supabase/server'
import { stripe } from '@/core/lib/stripe'
import { organizationService } from '@/core/lib/organizations'
import { getActiveProducts } from '@/core/lib/stripe-products'
import { logger } from '@/core/lib/logger'

export async function createCheckoutSession(priceId: string) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Get user's organization
  const { organization, error: orgError } = await organizationService.getOrganizationByUserId(user.id)

  if (orgError || !organization) {
    throw new Error('Organization not found')
  }

  // Check if organization already has an active subscription
  if (organization.subscription_status === 'active') {
    throw new Error('Organization already has an active subscription')
  }

  let customerId = organization.stripe_customer_id

  // Create Stripe customer if doesn't exist
  if (!customerId) {
    try {
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

      // Update organization with Stripe customer ID
      const adminClient = await createServiceClient()
      await adminClient
        .from('organizations')
        .update({ stripe_customer_id: customerId })
        .eq('id', organization.id)
    } catch (error) {
      logger.error('Error creating Stripe customer', error)
      throw new Error('Failed to create customer')
    }
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
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/canceled`,
    metadata: {
      organizationId: organization.id,
      userId: user.id,
    },
  })

  if (!session.url) {
    throw new Error('Failed to create checkout session')
  }

  // Redirect to Stripe Checkout
  redirect(session.url)
}

export async function createBillingPortalSession() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Get user's organization
  const { organization, error: orgError } = await organizationService.getOrganizationByUserId(user.id)

  if (orgError || !organization) {
    throw new Error('Organization not found')
  }

  if (!organization.stripe_customer_id) {
    throw new Error('No billing account found')
  }

  // Create portal session
  const session = await stripe.billingPortal.sessions.create({
    customer: organization.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
  })

  // Redirect to portal
  redirect(session.url)
}

export async function getProducts() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  return await getActiveProducts()
}