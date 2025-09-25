import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe, STRIPE_CONFIG } from '@/core/lib/stripe'
import { createAdminClient } from '@/core/lib/supabase'
import { logger } from '@/core/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const sig = headersList.get('stripe-signature')

    if (!sig) {
      logger.error('Missing stripe-signature header')
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    if (!STRIPE_CONFIG.WEBHOOK_SECRET) {
      logger.error('Missing STRIPE_WEBHOOK_SECRET environment variable')
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, sig, STRIPE_CONFIG.WEBHOOK_SECRET)
    } catch (err) {
      logger.error('Webhook signature verification failed', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    logger.webhook(event.type, 'received', { eventId: event.id })

    // Enhanced logging for subscription events to debug field values
    if (event.type.startsWith('customer.subscription.')) {
      const subscription = event.data.object as Stripe.Subscription & {
        current_period_start?: number
        current_period_end?: number
        trial_start?: number | null
        trial_end?: number | null
      }
      logger.webhook(event.type, 'subscription_data', {
        eventId: event.id,
        subscriptionId: subscription.id,
        status: subscription.status,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        trial_start: subscription.trial_start,
        trial_end: subscription.trial_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        customer: subscription.customer
      })
    }

    const adminClient = createAdminClient()

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription & {
          current_period_end?: number
          cancel_at_period_end?: boolean
          items?: {
            data: Array<{
              current_period_end?: number
              current_period_start?: number
            }>
          }
        }

        // Stripe best practice: Make idempotent by checking current state
        const { data: currentOrg, error: fetchError } = await adminClient
          .from('organizations')
          .select('subscription_status, stripe_subscription_id, is_active, cancel_at_period_end')
          .eq('stripe_customer_id', subscription.customer as string)
          .single()

        if (fetchError) {
          logger.error('Error fetching organization for subscription update', fetchError, {
            eventType: event.type,
            subscriptionId: subscription.id,
            customerId: subscription.customer
          })
          return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }

        // Determine if organization should be active based on subscription status
        // Allow access during payment retry period (past_due) for better customer experience
        const shouldBeActive =
          subscription.status === 'active' ||
          subscription.status === 'trialing' ||
          subscription.status === 'past_due'  // Grace period during payment retries

        // Only update if state has actually changed (idempotency)
        if (currentOrg.subscription_status !== subscription.status ||
            currentOrg.stripe_subscription_id !== subscription.id ||
            currentOrg.is_active !== shouldBeActive ||
            currentOrg.cancel_at_period_end !== (subscription.cancel_at_period_end || false)) {

          // Get current_period_end from subscription or subscription items
          let periodEnd: string | null = null

          // Check for current_period_end at root level (some webhook formats)
          if (subscription.current_period_end) {
            periodEnd = new Date(subscription.current_period_end * 1000).toISOString()
          }
          // Check in subscription items (other webhook formats)
          else if (subscription.items?.data?.[0]?.current_period_end) {
            periodEnd = new Date(subscription.items.data[0].current_period_end * 1000).toISOString()
          }
          // For trialing subscriptions, use trial_end as fallback
          else if (subscription.status === 'trialing' && subscription.trial_end) {
            periodEnd = new Date(subscription.trial_end * 1000).toISOString()
          }

          const { error } = await adminClient
            .from('organizations')
            .update({
              stripe_subscription_id: subscription.id,
              subscription_status: subscription.status,
              subscription_plan: subscription.items.data[0].price.recurring?.interval || 'monthly',
              current_period_end: periodEnd,
              trial_ends_at: subscription.trial_end
                ? new Date(subscription.trial_end * 1000).toISOString()
                : null,
              is_active: shouldBeActive,
              cancel_at_period_end: subscription.cancel_at_period_end || false,
            })
            .eq('stripe_customer_id', subscription.customer as string)

          if (error) {
            logger.error('Error updating organization subscription', error, {
              subscriptionId: subscription.id,
              customerId: subscription.customer,
              newStatus: subscription.status
            })
            return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
          }

          logger.webhook(event.type, 'subscription_updated', {
            subscriptionId: subscription.id,
            oldStatus: currentOrg.subscription_status,
            newStatus: subscription.status,
            oldIsActive: currentOrg.is_active,
            newIsActive: shouldBeActive,
            periodEnd: periodEnd,
            trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null
          })
        } else {
          logger.webhook(event.type, 'subscription_unchanged', {
            subscriptionId: subscription.id,
            status: subscription.status,
            isActive: currentOrg.is_active,
            reason: 'no_changes_detected'
          })
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        // Stripe best practice: Check current state before updating
        const { data: currentOrg, error: fetchError } = await adminClient
          .from('organizations')
          .select('subscription_status')
          .eq('stripe_customer_id', subscription.customer as string)
          .single()

        if (fetchError) {
          logger.error('Error fetching organization for subscription deletion', fetchError, {
            eventType: event.type,
            subscriptionId: subscription.id,
            customerId: subscription.customer
          })
          return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }

        // Only update if not already canceled (idempotency)
        if (currentOrg.subscription_status !== 'canceled') {
          const { error } = await adminClient
            .from('organizations')
            .update({
              subscription_status: 'canceled',
              current_period_end: null,
              is_active: false,  // Revoke access when subscription is deleted
              cancel_at_period_end: false,  // Reset since subscription is fully canceled
            })
            .eq('stripe_customer_id', subscription.customer as string)

          if (error) {
            logger.error('Error canceling organization subscription', error, {
              subscriptionId: subscription.id,
              customerId: subscription.customer
            })
            return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
          }

          logger.webhook(event.type, 'subscription_canceled', {
            subscriptionId: subscription.id
          })
        } else {
          logger.webhook(event.type, 'subscription_already_canceled', {
            subscriptionId: subscription.id
          })
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string
        }

        // Mark organization as active after successful payment
        if (invoice.subscription) {
          const subscriptionId = invoice.subscription

          // Check current status before updating (idempotency)
          const { data: currentOrg, error: fetchError } = await adminClient
            .from('organizations')
            .select('subscription_status, is_active')
            .eq('stripe_subscription_id', subscriptionId)
            .single()

          if (fetchError) {
            logger.error('Error fetching organization for payment success', fetchError, {
              eventType: event.type,
              subscriptionId,
              invoiceId: invoice.id
            })
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
          }

          // Only update if status needs to change
          if (currentOrg.subscription_status !== 'active' || !currentOrg.is_active) {
            const { error } = await adminClient
              .from('organizations')
              .update({
                subscription_status: 'active',
                is_active: true,
              })
              .eq('stripe_subscription_id', subscriptionId)

            if (error) {
              logger.error('Error activating organization after payment', error, {
                subscriptionId,
                invoiceId: invoice.id
              })
              return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
            }

            logger.webhook(event.type, 'organization_activated', {
              subscriptionId,
              invoiceId: invoice.id
            })
          } else {
            logger.webhook(event.type, 'organization_already_active', {
              subscriptionId,
              invoiceId: invoice.id
            })
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string
        }

        // Mark subscription as past due
        if (invoice.subscription) {
          const subscriptionId = invoice.subscription

          // Check current status before updating (idempotency)
          const { data: currentOrg, error: fetchError } = await adminClient
            .from('organizations')
            .select('subscription_status')
            .eq('stripe_subscription_id', subscriptionId)
            .single()

          if (fetchError) {
            logger.error('Error fetching organization for failed payment', fetchError, {
              eventType: event.type,
              subscriptionId,
              invoiceId: invoice.id
            })
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
          }

          // Only update if not already past_due
          if (currentOrg.subscription_status !== 'past_due') {
            const { error } = await adminClient
              .from('organizations')
              .update({
                subscription_status: 'past_due',
              })
              .eq('stripe_subscription_id', subscriptionId)

            if (error) {
              logger.error('Error marking subscription past due', error, {
                subscriptionId,
                invoiceId: invoice.id
              })
              return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
            }

            logger.webhook(event.type, 'subscription_past_due', {
              subscriptionId,
              invoiceId: invoice.id
            })
          } else {
            logger.webhook(event.type, 'subscription_already_past_due', {
              subscriptionId,
              invoiceId: invoice.id
            })
          }
        }
        break
      }

      default:
        logger.webhook(event.type, 'unhandled', { eventId: event.id })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    logger.error('Webhook handler failed', error, {
      requestHeaders: Object.fromEntries((await headers()).entries())
    })
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}